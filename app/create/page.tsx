import type { Metadata } from "next";
import Link from "next/link";
import { SceneDemo } from "../SceneDemo";

export const metadata: Metadata = {
  title: "Create a Scene | Temporary Name",
  description: "Turn a screenplay excerpt into an interactive 3D scene.",
};

export default function CreatePage() {
  return (
    <main className="route-page">
      <header className="site-header">
        <Link className="brand" href="/" aria-label="Temporary Name home">
          <span className="brand-mark" aria-hidden="true"><span /><span /><span /></span>
          <span>Temporary Name</span>
        </Link>
        <nav className="desktop-nav" aria-label="Create page navigation">
          <Link href="/#how-it-works">How it works</Link>
          <Link href="/#showcase">Showcase</Link>
        </nav>
        <div className="header-actions">
          <Link className="sign-in" href="/">← Back home</Link>
          <Link className="button button-small" href="/signup">Get started</Link>
        </div>
      </header>

      <section className="create-section route-create">
        <div className="create-intro">
          <h1 className="route-title">From first draft to first shot.</h1>
          <p>Paste a short scene, choose a visual direction, and build the foundation of your 3D set.</p>
        </div>
        <SceneDemo />
      </section>
    </main>
  );
}
