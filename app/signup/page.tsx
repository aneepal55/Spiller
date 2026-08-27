import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Get Started | Temporary Name",
  description: "Create an account and start turning scripts into 3D scenes.",
};

export default function SignupPage() {
  return (
    <main className="auth-page">
      <header className="auth-header">
        <Link className="brand" href="/" aria-label="Temporary Name home">
          <span>Temporary Name</span>
        </Link>
        <Link className="sign-in" href="/signin">Already have an account? <strong>Sign in</strong></Link>
      </header>
      <section className="auth-shell">
        <div className="auth-copy">
          <h1 className="route-title">Bring your next scene into view.</h1>
          <p>Create an account to build, explore, and share screenplay-driven 3D environments.</p>
          <div className="auth-benefits">
            <span>Generate scenes in under 60 seconds</span>
            <span>Test cameras, staging, and lighting</span>
            <span>Share a live link with your team</span>
          </div>
        </div>
        <form className="auth-form">
          <div className="form-heading"><span>Create your account</span></div>
          <label>Full name<input name="name" type="text" autoComplete="name" placeholder="Your name" required /></label>
          <label>Work email<input name="email" type="email" autoComplete="email" placeholder="you@studio.com" required /></label>
          <label>Password<input name="password" type="password" autoComplete="new-password" placeholder="8+ characters" minLength={8} required /></label>
          <button className="button auth-submit" type="button" disabled>Create account unavailable</button>
          <p>By continuing, you agree to our Terms and Privacy Policy.</p>
        </form>
      </section>
    </main>
  );
}
