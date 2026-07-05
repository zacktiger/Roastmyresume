import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RESUME_PATH = path.join(__dirname, '../src/data/resume.json');
const CACHE_PATH = path.join(__dirname, '../src/data/embeddings-cache.json');
const EMBEDDING_MODEL = 'gemini-embedding-2';

// Simple check for GEMINI_API_KEY
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('ERROR: GEMINI_API_KEY is not defined in the environment variables.');
  console.error('Please run: $env:GEMINI_API_KEY="your-key" (PowerShell) or set it in your environment.');
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

function generateChunks() {
  if (!fs.existsSync(RESUME_PATH)) {
    throw new Error(`Resume data file not found at ${RESUME_PATH}`);
  }

  const rawData = fs.readFileSync(RESUME_PATH, 'utf8');
  const resume = JSON.parse(rawData);
  const chunks = [];

  // 1. Personal / About
  chunks.push({
    id: 'personal_about',
    text: `About ${resume.personal.name} (${resume.personal.title}): ${resume.personal.about} Location: ${resume.personal.location}. Github: ${resume.personal.github}, LinkedIn: ${resume.personal.linkedin}`,
    source: 'personal'
  });

  // 2. Experience
  resume.experience.forEach((exp) => {
    const expId = `exp_${exp.company.toLowerCase().replace(/\s+/g, '_')}`;
    
    // Summary chunk
    chunks.push({
      id: `${expId}_summary`,
      text: `Work experience at ${exp.company} as ${exp.role} (${exp.period}): ${exp.description}`,
      source: `experience:${exp.company}`
    });

    // Bullet points
    exp.bullets.forEach((bullet, bulletIdx) => {
      chunks.push({
        id: `${expId}_bullet_${bulletIdx}`,
        text: `Work experience detail at ${exp.company} as ${exp.role}: ${bullet}`,
        source: `experience:${exp.company}`
      });
    });
  });

  // 3. Projects
  resume.projects.forEach((proj) => {
    const projId = `proj_${proj.id}`;

    // Summary chunk
    chunks.push({
      id: `${projId}_summary`,
      text: `Project "${proj.name}" - ${proj.tagline}. Description: ${proj.description} Tech Stack: ${proj.techStack.join(', ')}. Link: ${proj.link}`,
      source: `project:${proj.id}`
    });

    // Bullet points
    proj.bullets.forEach((bullet, bulletIdx) => {
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
  resume.education.forEach((edu, eduIdx) => {
    chunks.push({
      id: `education_${eduIdx}`,
      text: `Education at ${edu.institution}: Degree: ${edu.degree} (${edu.period}). Details: ${edu.details}`,
      source: 'education'
    });
  });

  return chunks;
}

async function main() {
  console.log('Generating chunks from resume.json...');
  const chunks = generateChunks();
  console.log(`Generated ${chunks.length} chunks.`);

  let cache = {};
  if (fs.existsSync(CACHE_PATH)) {
    try {
      cache = JSON.parse(fs.readFileSync(CACHE_PATH, 'utf8'));
      console.log(`Loaded existing cache with ${Object.keys(cache).length} entries.`);
    } catch (e) {
      console.warn('Failed to parse existing cache. Starting fresh.', e);
    }
  }

  let newEmbeddingsCount = 0;
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    if (cache[chunk.text]) {
      continue;
    }

    console.log(`[${i + 1}/${chunks.length}] Fetching embedding for: ${chunk.id}`);
    try {
      const response = await ai.models.embedContent({
        model: EMBEDDING_MODEL,
        contents: chunk.text,
      });

      const embedding = response.embeddings?.[0]?.values;
      if (embedding) {
        cache[chunk.text] = embedding;
        newEmbeddingsCount++;
      } else {
        throw new Error('No embedding values returned');
      }
    } catch (error) {
      console.error(`Failed to get embedding for ${chunk.id}:`, error);
    }

    // Small delay to respect rate limits
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  if (newEmbeddingsCount > 0) {
    fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2), 'utf8');
    console.log(`Success! Generated ${newEmbeddingsCount} new embeddings and saved to ${CACHE_PATH}`);
  } else {
    console.log('All embeddings were already cached. No changes made.');
  }
}

main().catch(console.error);
