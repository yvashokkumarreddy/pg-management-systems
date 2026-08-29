"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api/client";

export default function LoginForm() {
  const router = useRouter();

  const [form, setForm] = useState({
    email: "",
    password: "",
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

    if (!form.email.trim()) {
      setError("Enter your email address.");
      return;
    }

    if (!form.password) {
      setError("Enter your password.");
      return;
    }

    try {
      setSubmitting(true);

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
      setError(
        err.status === 401
          ? "Email or password is incorrect."
          : err.message
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <h2>Welcome back</h2>

      <p className="auth-subtitle">
        Sign in to continue to your PG management workspace.
      </p>

      {error ? <div className="pg-error">{error}</div> : null}

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
          autoComplete="current-password"
          value={form.password}
          onChange={updateField}
          className="pg-input"
          placeholder="Enter your password"
        />
      </div>

      <button
        type="submit"
        className="pg-button pg-button-primary"
        style={{ width: "100%" }}
        disabled={submitting}
      >
        {submitting ? "Signing in..." : "Sign in"}
      </button>

      <div className="auth-footer">
        New owner? <Link href="/register">Create an account</Link>
      </div>
    </form>
  );
}