import type { Metadata } from "next";
import Link from "next/link";
import { SceneDemo } from "../SceneDemo";

export const metadata: Metadata = {
  title: "Create a Scene | Temporary Name",
  description: "Use Gemini and Google Cloud Agent Builder to turn a screenplay into an interactive 3D blockout.",
};

export default function CreatePage() {
  return (
    <main className="route-page">
      <header className="site-header">
        <Link className="brand" href="/" aria-label="Temporary Name home">
          <span>Temporary Name</span>
        </Link>
        <nav className="desktop-nav" aria-label="Create page navigation">
          <Link href="/#how-it-works">How it works</Link>
          <Link href="/#showcase">Showcase</Link>
        </nav>
        <div className="header-actions">
          <Link className="text-link" href="/">Back to home</Link>
        </div>
      </header>

      <section className="create-section route-create">
        <div className="create-intro">
          <h1 className="route-title">Your script, in three dimensions.</h1>
          <p>Let a Gemini-powered Google ADK agent stage your screenplay, then explore the resulting Three.js blockout from multiple camera angles.</p>
        </div>
        <SceneDemo />
      </section>
    </main>
  );
}
