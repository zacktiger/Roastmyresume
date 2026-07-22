# Roast My Resume

Brutally honest AI feedback on your resume, built with Next.js, Framer Motion, and Google Gemini.

## Features
- **Bullet Grader:** Paste a single resume bullet point and get an instant 0–100 impact score, a recruiter verdict, and a roast. Zero friction, no upload required.
- **Full Resume Roast:** Upload a PDF or TXT resume and watch a cynical tech recruiter tear it apart section by section, then hand back a concrete redemption plan.

Resumes are never stored on the server. Uploaded files are streamed to the Google Gemini API to generate the roast and are not retained afterwards.

## Technology Stack
- **Framework:** Next.js 16 (React 19)
- **AI Engine:** Google Gemini API (`gemini-2.5-flash`)
- **Styling:** CSS Modules (Vanilla CSS)
- **Libraries:** Framer Motion (animations), Lucide React (icons)

## Getting Started

1. **Clone the repository and install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   Create a `.env` file in the root directory:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.
