"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api/client";

export default function RegisterForm() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function updateField(event) {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");

    if (!form.name.trim()) {
      setError("Enter your name.");
      return;
    }

    if (!form.email.trim()) {
      setError("Enter your email address.");
      return;
    }

    if (form.password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setSubmitting(true);

      await apiRequest("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
        }),
      });

      /*
       * Registration creates the account.
       * Login afterwards so the browser receives the normal
       * Supabase cookie-based session.
       */
      await apiRequest("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: form.email.trim(),
          password: form.password,
        }),
      });

      router.replace("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <h2>Create account</h2>

      <p className="auth-subtitle">
        Create your owner account to start managing your PG.
      </p>

      {error ? <div className="pg-error">{error}</div> : null}

      <div className="pg-field">
        <label htmlFor="name">Name</label>

        <input
          id="name"
          name="name"
          value={form.name}
          onChange={updateField}
          className="pg-input"
          placeholder="Your name"
        />
      </div>

      <div className="pg-field">
        <label htmlFor="email">Email</label>

        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={updateField}
          className="pg-input"
          placeholder="owner@example.com"
        />
      </div>

      <div className="pg-field">
        <label htmlFor="password">Password</label>

        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          value={form.password}
          onChange={updateField}
          className="pg-input"
          placeholder="Minimum 8 characters"
        />
      </div>

      <div className="pg-field">
        <label htmlFor="confirmPassword">Confirm password</label>

        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          value={form.confirmPassword}
          onChange={updateField}
          className="pg-input"
          placeholder="Repeat your password"
        />
      </div>

      <button
        type="submit"
        className="pg-button pg-button-primary"
        style={{ width: "100%" }}
        disabled={submitting}
      >
        {submitting ? "Creating account..." : "Create account"}
      </button>

      <div className="auth-footer">
        Already registered? <Link href="/login">Sign in</Link>
      </div>
    </form>
  );
}