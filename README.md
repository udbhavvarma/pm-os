# Auxiliaire

Auxiliaire is a private, local-first daily operating loop:

```text
CAPTURE → CLARIFY → ACT → REVIEW
```

The product has five surfaces: Today, Inbox, Library, Review, and Settings. Core capture and organization remain dependable, while Groq Cloud provides processing, guidance, contextual questions, and transcription.

## Stack

- Next.js 16
- React 19
- Firebase Auth and Firestore
- IndexedDB audio storage
- Groq Cloud chat completions
- Groq Whisper transcription
- Groq Compound web research with source-aware Library enrichment

## Local Setup

```bash
npm install
npm run dev
```

The app runs from the domain root in web mode:

```text
http://localhost:3000/today
```

## Environment

Create `.env.local` with:

```bash
FIREBASE_PROJECT_ID=some-great-projects
NEXT_PUBLIC_ALLOWED_EMAIL=you@example.com
ALLOWED_EMAIL=you@example.com
GROQ_API_KEY=your-groq-cloud-key
GROQ_CHAT_MODEL=llama-3.3-70b-versatile
GROQ_STT_MODEL=whisper-large-v3-turbo
GROQ_WEB_MODEL=groq/compound-mini
```

`.env.local` is ignored by Git.

Deploy `firestore.rules` with the Firebase project so every workspace collection is restricted to its authenticated owner.
