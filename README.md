# Autonomous Screenplay-to-3D Pre-Visualization & Pitching Engine

## Partner Track

Replit Track

## Core Technologies

- Gemini Enterprise Agent Builder
- Replit API
- Three.js (WebGL)

## What It Is

An AI-powered tool that transforms one page of a movie screenplay into a live, interactive 3D video game scene in under 60 seconds.

It allows studio executives and creative teams to test camera angles, lighting, and stage setups from a phone or laptop before committing millions of dollars to a film shoot.

## How It Works

1. **Input:** Paste 1–3 pages of a screenplay into the app, or select a sample scene.
2. **Gemini Directs:** Gemini reads the screenplay and generates standalone 3D WebGL code with Three.js for the actors, lighting, environment, and cameras.
3. **Replit Hosts:** The app sends the generated code to Replit through its API, creating a live web link that users can open and explore in 3D.

## Local Development

Requires Node.js 22.13 or newer.

```bash
npm install
npm run dev
```

Open `http://localhost:3000` in your browser.

## Production Build

```bash
npm run build
```

## Deploy to Vercel

Import this repository in Vercel and use the automatically detected settings:

- Framework Preset: Next.js
- Root Directory: `./`
- Build Command: `npm run build`
- Output Directory: leave blank (Next.js default)
- Install Command: `npm install`

The current demo does not require environment variables.
