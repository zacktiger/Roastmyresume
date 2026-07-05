import fs from 'fs';
import path from 'path';
import { ai, EMBEDDING_MODEL } from './gemini';

export interface ResumeChunk {
  id: string;
  text: string;
  source: string;
}

export interface EmbeddedChunk extends ResumeChunk {
  embedding: number[];
}

const RESUME_PATH = path.join(process.cwd(), 'src/data/resume.json');
const CACHE_PATH = path.join(process.cwd(), 'src/data/embeddings-cache.json');

// Helper to generate chunks from the resume JSON
export function generateChunks(): ResumeChunk[] {
  if (!fs.existsSync(RESUME_PATH)) {
    throw new Error(`Resume data file not found at ${RESUME_PATH}`);
  }

  const rawData = fs.readFileSync(RESUME_PATH, 'utf8');
  const resume = JSON.parse(rawData);
  const chunks: ResumeChunk[] = [];

  // 1. Personal / About
  chunks.push({
    id: 'personal_about',
    text: `About ${resume.personal.name} (${resume.personal.title}): ${resume.personal.about} Location: ${resume.personal.location}. Github: ${resume.personal.github}, LinkedIn: ${resume.personal.linkedin}`,
    source: 'personal'
  });

  // 2. Experience
  resume.experience.forEach((exp: any, expIdx: number) => {
    const expId = `exp_${exp.company.toLowerCase().replace(/\s+/g, '_')}`;
    
    // Summary chunk
    chunks.push({
      id: `${expId}_summary`,
      text: `Work experience at ${exp.company} as ${exp.role} (${exp.period}): ${exp.description}`,
      source: `experience:${exp.company}`
    });

    // Bullet points
    exp.bullets.forEach((bullet: string, bulletIdx: number) => {
      chunks.push({
        id: `${expId}_bullet_${bulletIdx}`,
        text: `Work experience detail at ${exp.company} as ${exp.role}: ${bullet}`,
        source: `experience:${exp.company}`
      });
    });
  });

  // 3. Projects
  resume.projects.forEach((proj: any) => {
    const projId = `proj_${proj.id}`;

    // Summary chunk
    chunks.push({
      id: `${projId}_summary`,
      text: `Project "${proj.name}" - ${proj.tagline}. Description: ${proj.description} Tech Stack: ${proj.techStack.join(', ')}. Link: ${proj.link}`,
      source: `project:${proj.id}`
    });

    // Bullet points
    proj.bullets.forEach((bullet: string, bulletIdx: number) => {
      chunks.push({
        id: `${projId}_bullet_${bulletIdx}`,
        text: `Project detail for "${proj.name}": ${bullet}`,
        source: `project:${proj.id}`
      });
    });
  });

  // 4. Skills
  chunks.push({
    id: 'skills_languages',
    text: `Technical Skills - Programming Languages: ${resume.skills.languages.join(', ')}`,
    source: 'skills'
  });
  chunks.push({
    id: 'skills_frameworks',
    text: `Technical Skills - Frameworks and Libraries: ${resume.skills.frameworks.join(', ')}`,
    source: 'skills'
  });
  chunks.push({
    id: 'skills_tools',
    text: `Technical Skills - Developer Tools & Platforms: ${resume.skills.tools.join(', ')}`,
    source: 'skills'
  });

  // 5. Education
  resume.education.forEach((edu: any, eduIdx: number) => {
    chunks.push({
      id: `education_${eduIdx}`,
      text: `Education at ${edu.institution}: Degree: ${edu.degree} (${edu.period}). Details: ${edu.details}`,
      source: 'education'
    });
  });

  return chunks;
}

// Cosine similarity between two vectors
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  let dotProduct = 0.0;
  let normA = 0.0;
  let normB = 0.0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Initialize the Vector Database (runs on-demand or at boot)
let dbCache: EmbeddedChunk[] | null = null;

export async function initVectorDb(): Promise<EmbeddedChunk[]> {
  if (dbCache) return dbCache;

  const chunks = generateChunks();
  let cache: Record<string, number[]> = {};

  if (fs.existsSync(CACHE_PATH)) {
    try {
      cache = JSON.parse(fs.readFileSync(CACHE_PATH, 'utf8'));
    } catch (e) {
      console.error('Failed to parse embeddings cache, recreating...', e);
    }
  }

  const embeddedChunks: EmbeddedChunk[] = [];
  let updatedCache = false;

  for (const chunk of chunks) {
    if (cache[chunk.text]) {
      embeddedChunks.push({
        ...chunk,
        embedding: cache[chunk.text]
      });
    } else {
      // Fetch embedding from Gemini if not cached
      if (!process.env.GEMINI_API_KEY) {
        console.error('GEMINI_API_KEY is missing. Cannot fetch new embeddings.');
        // Fallback to empty embedding for now, to let it boot
        embeddedChunks.push({
          ...chunk,
          embedding: new Array(768).fill(0)
        });
        continue;
      }

      try {
        console.log(`Generating embedding for chunk: ${chunk.id}`);
        const response = await ai.models.embedContent({
          model: EMBEDDING_MODEL,
          contents: chunk.text,
        });

        const embedding = response.embeddings?.[0]?.values;
        if (embedding) {
          cache[chunk.text] = embedding;
          embeddedChunks.push({
            ...chunk,
            embedding
          });
          updatedCache = true;
        } else {
          throw new Error('No embedding returned from API');
        }
      } catch (err) {
        console.error(`Failed to generate embedding for ${chunk.id}:`, err);
        embeddedChunks.push({
          ...chunk,
          embedding: new Array(768).fill(0)
        });
      }
    }
  }

  // Save the updated cache back to disk if new embeddings were created
  if (updatedCache) {
    try {
      // Ensure the directory exists
      const dir = path.dirname(CACHE_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2), 'utf8');
      console.log('Saved updated embeddings cache.');
    } catch (e) {
      console.error('Failed to write embeddings cache to disk:', e);
    }
  }

  dbCache = embeddedChunks;
  return embeddedChunks;
}

// Query the Vector Database for top-k matches
export async function queryVectorDb(queryText: string, k: number = 3): Promise<EmbeddedChunk[]> {
  const db = await initVectorDb();
  
  if (!process.env.GEMINI_API_KEY) {
    console.warn('GEMINI_API_KEY is missing. Returning first k chunks.');
    return db.slice(0, k);
  }

  try {
    const response = await ai.models.embedContent({
      model: EMBEDDING_MODEL,
      contents: queryText,
    });

    const queryEmbedding = response.embeddings?.[0]?.values;
    if (!queryEmbedding) {
      throw new Error('Failed to generate embedding for query');
    }

    const scored = db.map(chunk => {
      const score = cosineSimilarity(queryEmbedding, chunk.embedding);
      return { chunk, score };
    });

    // Sort by descending score
    scored.sort((a, b) => b.score - a.score);
    
    // Return top K
    return scored.slice(0, k).map(s => s.chunk);
  } catch (error) {
    console.error('Vector query failed, falling back to substring matching:', error);
    // Simple fallback string search if embedding API fails
    const queryLower = queryText.toLowerCase();
    const matches = db.filter(chunk => chunk.text.toLowerCase().includes(queryLower));
    if (matches.length > 0) {
      return matches.slice(0, k);
    }
    return db.slice(0, k);
  }
}
