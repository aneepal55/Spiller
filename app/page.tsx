import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Spiller | Turn Scripts Into Scenes",
  description:
    "Transform screenplay pages into interactive 3D pre-visualizations in under 60 seconds.",
};

export default function Home() {
  return (
    <main>
      <header className="site-header">
        <Link className="brand" href="#top" aria-label="Spiller home">
          <span>Spiller</span>
        </Link>
        <nav className="desktop-nav" aria-label="Main navigation">
          <Link href="#how-it-works">How it works</Link>
          <Link href="#showcase">Showcase</Link>
          <Link href="#about">Why it works</Link>
        </nav>
        <div className="header-actions">
          <Link className="sign-in" href="/signin">Sign in</Link>
          <Link className="button button-small" href="/signup">Get started</Link>
        </div>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <h1>Turn scripts into <em>scenes.</em></h1>
          <p className="hero-lede">
            Go from screenplay to an explorable 3D production environment, complete
            with cameras, lighting, and staging, in under 60 seconds.
          </p>
          <div className="hero-actions">
            <Link className="button" href="/create">Explore the 3D demo</Link>
            <Link className="text-link" href="#how-it-works">
              See how it works <span className="text-link-arrow" aria-hidden="true">↓</span>
            </Link>
          </div>
        </div>

        <div className="scene-shell" aria-label="Interactive 3D scene preview">
          <div className="scene-viewport placeholder-surface">
            <div className="placeholder-message">
              <span className="placeholder-frame" aria-hidden="true" />
              <strong>Image placeholder</strong>
              <small>Scene preview will appear here</small>
            </div>
          </div>
        </div>
      </section>

      <section className="process-section" id="how-it-works">
        <div className="section-heading">
          <div>
            <h2>Three steps. One living scene.</h2>
          </div>
          <p>
            Spiller handles the technical translation so your team can stay
            focused on the story, the shot, and the feeling.
          </p>
        </div>
        <div className="process-grid">
          <article className="process-card">
            <h3>Upload your script</h3>
            <p>Paste 1–3 pages or start with a sample. We identify the setting, characters, action, and key visual beats.</p>
            <small>Screenplay input</small>
          </article>
          <article className="process-card">
            <h3>Gemini directs</h3>
            <p>A Google Cloud Agent Builder agent turns the script into a structured plan for actors, props, scale, lighting, and spatial relationships.</p>
            <small>Gemini + Google ADK</small>
          </article>
          <article className="process-card">
            <h3>Explore the blockout</h3>
            <p>Three.js renders the validated plan so you can orbit, zoom, and compare wide, close, and overhead camera setups.</p>
            <small>Interactive 3D preview</small>
          </article>
        </div>
      </section>

      <section className="showcase-section" id="showcase">
        <div className="showcase-copy">
          <h2>See the shot before you step on set.</h2>
          <p>
            Turn creative intent into a shared visual language. Directors can test
            compositions, producers can understand scope, and crews can align before
            the first call sheet.
          </p>
          <div className="mini-stats">
            <div><strong>&lt;60s</strong><span>Scene generation</span></div>
            <div><strong>3D</strong><span>Browser native</span></div>
            <div><strong>1 link</strong><span>Instantly shareable</span></div>
          </div>
        </div>
        <div className="shot-board" aria-label="Shot planning board preview">
          <div className="board-placeholder placeholder-surface">
            <div className="placeholder-message">
              <span className="placeholder-frame" aria-hidden="true" />
              <strong>Image placeholder</strong>
              <small>Storyboard preview will appear here</small>
            </div>
          </div>
        </div>
      </section>

      <section className="about-section" id="about">
        <div className="about-quote">
          <span className="quote-mark">“</span>
          <blockquote>
            Pre-visualization shouldn’t be reserved for tentpole budgets. Every
            story deserves a place to become visible.
          </blockquote>
          <p>Built for filmmakers, creative teams, and the next story worth telling.</p>
        </div>
        <div className="about-list">
          <article><h3>Move faster</h3><p>Explore bold choices before production time and money are on the line.</p></article>
          <article><h3>Speak visually</h3><p>Replace abstract notes with a shared, explorable scene everyone can understand.</p></article>
          <article><h3>Pitch with impact</h3><p>Bring the world of your screenplay into the room, not just the words on the page.</p></article>
        </div>
      </section>

      <footer>
        <Link className="brand footer-brand" href="#top">
          <span>Spiller</span>
        </Link>
        <div><Link href="#how-it-works">How it works</Link><Link href="/create">Explore the 3D demo</Link><Link href="/signup">Get started</Link></div>
      </footer>
    </main>
  );
}
