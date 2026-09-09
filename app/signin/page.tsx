import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Sign In | Spiller",
  description: "Sign in to continue creating screenplay-driven 3D scenes.",
};

export default function SigninPage() {
  return (
    <main className="auth-page">
      <header className="auth-header">
        <Link className="brand" href="/" aria-label="Spiller home">
          <span>Spiller</span>
        </Link>
        <Link className="sign-in" href="/signup">New here? <strong>Get started</strong></Link>
      </header>
      <section className="auth-shell signin-shell">
        <div className="auth-copy">
          <h1 className="route-title">Continue building your world.</h1>
          <p>Sign in to return to your scenes, shot plans, and shared previews.</p>
        </div>
        <form className="auth-form">
          <div className="form-heading"><span>Sign in</span></div>
          <label>Email address<input name="email" type="email" autoComplete="email" placeholder="you@studio.com" required /></label>
          <label>Password<input name="password" type="password" autoComplete="current-password" placeholder="Your password" required /></label>
          <Link className="forgot-link" href="/signup">Forgot your password?</Link>
          <button className="button auth-submit" type="button" disabled>Sign in unavailable</button>
        </form>
      </section>
    </main>
  );
}
