# Auxiliaire

Auxiliaire is a private auxiliary intelligence for daily readiness: Today, Capture, Auxiliaire, Knowledge, Review, Watchlist, and Patterns.

## Stack

- Next.js 16
- React 19
- Firebase Auth and Firestore
- Groq chat completions
- Groq Whisper speech-to-text

## Local Setup

```bash
npm install
npm run dev
```

The app uses a base path in web mode:

```text
http://localhost:3000/pm-os/dashboard
```

## Environment

Create `.env.local` with:

```bash
GROQ_API_KEY=...
GROQ_CHAT_MODEL=llama-3.3-70b-versatile
GROQ_STT_MODEL=whisper-large-v3-turbo
FIREBASE_PROJECT_ID=some-great-projects
```

`.env.local` is ignored by Git.
