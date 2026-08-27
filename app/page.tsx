import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Temporary Name | Turn Scripts Into Scenes",
  description:
    "Transform screenplay pages into interactive 3D pre-visualizations in under 60 seconds.",
};

export default function Home() {
  return (
    <main>
      <header className="site-header">
        <Link className="brand" href="#top" aria-label="Temporary Name home">
          <span>Temporary Name</span>
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
            <span className="button button-disabled" aria-disabled="true">Creating coming soon</span>
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
            <h2>Four steps. One living scene.</h2>
          </div>
          <p>
            Temporary Name handles the technical translation so your team can stay
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
            <h3>AI builds the scene</h3>
            <p>Gemini translates the scene into production-ready Three.js code, arranging actors, props, and spatial relationships.</p>
            <small>Scene direction</small>
          </article>
          <article className="process-card">
            <h3>Plan cameras & lighting</h3>
            <p>Explore suggested lenses, framing, camera positions, and practical lighting setups tailored to the action.</p>
            <small>Shot planning</small>
          </article>
          <article className="process-card">
            <h3>Explore the scene</h3>
            <p>Open a live Replit link on any device. Orbit, reposition, compare setups, and share the vision with your team.</p>
            <small>Interactive preview</small>
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
          <span>Temporary Name</span>
        </Link>
        <div><Link href="#how-it-works">How it works</Link><span className="footer-disabled">Creating coming soon</span><Link href="/signup">Get started</Link></div>
      </footer>
    </main>
  );
}
