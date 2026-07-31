# Auxiliaire

Auxiliaire is decision memory for product managers and builders. It preserves the evidence behind a decision, keeps the resulting actions connected to their source, and brings the original assumptions back when the outcome can be reviewed.

```text
CAPTURE → CONFIRM → ACT → LEARN
```

## Try the product

- Open `/demo` for a seeded, zero-auth sample workspace.
- The sample follows an enterprise-pricing decision from meeting evidence through ranked actions, a forecast, web research, and later review.
- Demo mutations stay in the current browser tab and never write to Firebase.
- Private workspaces use Google authentication, Firebase sync, and authenticated AI endpoints.

## Product thesis

Notes, tasks, research, and retrospectives usually live in separate tools. The missing object is the evidence chain:

1. What did we observe?
2. What did we decide and assume?
3. What next step followed?
4. What actually happened?

Auxiliaire makes that chain the product. AI proposes structure, but the raw input is preserved and the user approves mutations.

## Core surfaces

- **Today** — one recommended move, a realistic attention budget, and the complete action lifecycle.
- **Capture** — text, URL, voice, and PWA share-target capture with transparent AI processing status.
- **Memory** — source-linked notes, knowledge, decisions, research history, and contextual retrieval.
- **Review** — a simple review queue plus optional decision calibration, tension detection, change reports, and future-context capsules.

## Stack

- Next.js 16 and React 19
- Firebase Authentication and Firestore
- IndexedDB audio storage
- Groq chat completions, Whisper transcription, and Compound web research
- Tailwind CSS 4, Framer Motion, and Lucide
- Node test runner through `tsx`

## Local setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000` or go directly to `http://localhost:3000/demo`.

## Verification

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

`npm run verify` runs all four. GitHub Actions runs the same checks on pushes and pull requests.

Model-quality fixtures are deliberately separate from deterministic CI:

```bash
npm run eval:captures
```

This requires `GROQ_API_KEY` and records classification, extraction, theme, and confidence regressions from `evals/capture-fixtures.json`.

## Privacy and data boundaries

- Browser storage is a convenience cache and is **not described as encrypted storage**.
- Private-workspace records sync to Firestore collections protected by owner-only rules.
- AI requests send only the selected capture/context to Groq when the user initiates processing.
- Audio is saved locally before transcription.
- Version 2 exports include workspace records and IndexedDB audio attachments.
- Settings supports complete workspace/account deletion and explains each provider boundary.

See [architecture.md](./architecture.md) for the current system design and [CASE_STUDY.md](./CASE_STUDY.md) for product decisions and trade-offs.
