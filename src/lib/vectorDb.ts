import { ai, EMBEDDING_MODEL } from './gemini';
import resumeData from '@/data/resume.json';
import cachedEmbeddings from '@/data/embeddings-cache.json';

export interface ResumeChunk {
  id: string;
  text: string;
  source: string;
}

export interface EmbeddedChunk extends ResumeChunk {
  embedding: number[];
}

interface ExperienceItem {
  company: string;
  role: string;
  period: string;
  description: string;
  bullets: string[];
}

interface ProjectItem {
  id: string;
  name: string;
  tagline: string;
  description: string;
  bullets: string[];
  techStack: string[];
  link: string;
}

interface EducationItem {
  institution: string;
  degree: string;
  period: string;
  details: string;
}

interface ResumeData {
  personal: {
    name: string;
    title: string;
    email: string;
    github: string;
    linkedin: string;
    location: string;
    about: string;
  };
  experience: ExperienceItem[];
  projects: ProjectItem[];
  skills: {
    languages: string[];
    frameworks: string[];
    tools: string[];
  };
  education: EducationItem[];
}

// Helper to generate chunks from the resume JSON
export function generateChunks(): ResumeChunk[] {
  const chunks: ResumeChunk[] = [];
  const resume = resumeData as unknown as ResumeData;

  // 1. Personal / About
  chunks.push({
    id: 'personal_about',
    text: `About ${resume.personal.name} (${resume.personal.title}): ${resume.personal.about} Location: ${resume.personal.location}. Github: ${resume.personal.github}, LinkedIn: ${resume.personal.linkedin}`,
    source: 'personal'
  });

  // 2. Experience
  resume.experience.forEach((exp: ExperienceItem) => {
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
  resume.projects.forEach((proj: ProjectItem) => {
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
  resume.education.forEach((edu: EducationItem, eduIdx: number) => {
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
  const cache: Record<string, number[]> = cachedEmbeddings as unknown as Record<string, number[]>;
  const embeddedChunks: EmbeddedChunk[] = [];

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
          embedding: new Array(3072).fill(0)
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
        } else {
          throw new Error('No embedding returned from API');
        }
      } catch (err) {
        console.error(`Failed to generate embedding for ${chunk.id}:`, err);
        embeddedChunks.push({
          ...chunk,
          embedding: new Array(3072).fill(0)
        });
      }
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
