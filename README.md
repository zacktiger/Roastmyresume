# Roast My Resume (Ask My Resume)

An interactive, AI-powered developer portfolio built with Next.js, Framer Motion, and Google Gemini.

## Features
- **AI Portfolio Chat:** Converse with Kshitij's AI Resume Agent grounded by local vector embeddings.
- **Custom Resume Roaster:** Upload any PDF/TXT resume and get a cynical, snarky recruiter roast.
- **Bullet Roast Sandbox:** A gamified playground to grade and improve individual resume bullet points.
- **Global Command Palette:** Keyboard-accessible shortcut menu (⌘K) to quickly search builds and trigger actions.

## Technology Stack
- **Framework:** Next.js 16 (React 19)
- **AI Engine:** Google Gemini API (`gemini-2.5-flash` & `gemini-embedding-2`)
- **Styling:** CSS Modules (Vanilla CSS)
- **Libraries:** Framer Motion (animations), cmdk (command palette), Lucide React (icons)

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

3. **Generate resume embeddings:**
   Pre-bake semantic search vectors for the portfolio chatbot:
   ```bash
   npm run generate-embeddings
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.
