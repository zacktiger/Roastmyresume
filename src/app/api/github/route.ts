import { NextResponse } from 'next/server';
import resumeData from '@/data/resume.json';

export async function GET() {
  try {
    let username = 'kshitij-github-placeholder';
    
    const githubUrl = resumeData.personal.github;
    if (githubUrl && githubUrl.includes('github.com/')) {
      username = githubUrl.split('github.com/')[1].split('/')[0];
    }

    // Attempt to fetch public events from GitHub API
    // We add a user-agent header as required by GitHub API guidelines
    const response = await fetch(`https://api.github.com/users/${username}/events/public`, {
      headers: {
        'User-Agent': 'RoastMyResume-Agent',
      },
      next: { revalidate: 300 } // Cache for 5 minutes
    });

    if (!response.ok) {
      throw new Error(`GitHub API returned status ${response.status}`);
    }

    const events = await response.json();
    
    // Find the latest PushEvent
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pushEvent = events.find((e: any) => e.type === 'PushEvent');
    
    if (pushEvent && pushEvent.payload && pushEvent.payload.commits && pushEvent.payload.commits.length > 0) {
      const latestCommit = pushEvent.payload.commits[0];
      const repoName = pushEvent.repo.name;
      const createdDate = pushEvent.created_at;
      
      return NextResponse.json({
        repo: repoName.split('/')[1] || repoName,
        message: latestCommit.message,
        sha: latestCommit.sha.substring(0, 7),
        date: createdDate,
        url: `https://github.com/${repoName}/commit/${latestCommit.sha}`
      });
    }

    // Default response if no PushEvent found
    return NextResponse.json({
      repo: 'roast-my-resume',
      message: 'Refactored CSS modules and added command palette',
      sha: 'a1b2c3d',
      date: new Date().toISOString(),
      url: `https://github.com/${username}/roast-my-resume`
    });

  } catch (error) {
    console.warn('Failed to fetch real-time github activity, returning fallback commit:', error);
    // Graceful fallback for offline development or rate limits
    return NextResponse.json({
      repo: 'roast-my-resume',
      message: 'Initial project scaffolding and vector DB design',
      sha: 'scaffold',
      date: new Date().toISOString(),
      url: '#'
    });
  }
}
