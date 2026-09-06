"use client";

import {
  useState,
} from "react";

import Link from "next/link";
import {
  useRouter,
} from "next/navigation";

import {
  apiRequest,
} from "@/lib/api/client";


export default function LoginForm() {
  const router =
    useRouter();

  const [
    form,
    setForm,
  ] = useState({
    email: "",
    password: "",
  });

  const [
    error,
    setError,
  ] = useState("");

  const [
    submitting,
    setSubmitting,
  ] = useState(false);


  function updateField(
    event
  ) {
    const {
      name,
      value,
    } =
      event.target;

    setForm(
      (current) => ({
        ...current,
        [name]:
          value,
      })
    );

    setError("");
  }


  async function handleSubmit(
    event
  ) {
    event.preventDefault();

    if (submitting) {
      return;
    }

    setError("");

    const email =
      form.email
        .trim()
        .toLowerCase();

    if (!email) {
      setError(
        "Enter your email address."
      );

      return;
    }

    if (!form.password) {
      setError(
        "Enter your password."
      );

      return;
    }

    try {
      setSubmitting(
        true
      );

      await apiRequest(
        "/api/auth/login",
        {
          method:
            "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body:
            JSON.stringify({
              email,
              password:
                form.password,
            }),
        }
      );

      router.replace(
        "/dashboard"
      );

      router.refresh();
    } catch (err) {
      console.error(
        "Login error:",
        err
      );

      if (
        err?.status ===
          400 ||
        err?.status ===
          401
      ) {
        setError(
          "Email or password is incorrect."
        );

        return;
      }

      if (
        err?.status ===
        429
      ) {
        setError(
          "Too many login attempts. Please try again shortly."
        );

        return;
      }

      setError(
        "Unable to sign in right now. Please try again."
      );
    } finally {
      setSubmitting(
        false
      );
    }
  }


  return (
    <form
      className="auth-form"
      onSubmit={
        handleSubmit
      }
    >
      <h2>
        Welcome back
      </h2>

      <p className="auth-subtitle">
        Sign in to continue
        to your PG management
        workspace.
      </p>


      {error ? (
        <div
          className="pg-error"
          role="alert"
        >
          {error}
        </div>
      ) : null}


      <div className="pg-field">
        <label htmlFor="email">
          Email
        </label>

        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          disabled={
            submitting
          }
          value={
            form.email
          }
          onChange={
            updateField
          }
          className="pg-input"
          placeholder="owner@example.com"
        />
      </div>


      <div className="pg-field">
        <label htmlFor="password">
          Password
        </label>

        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          disabled={
            submitting
          }
          value={
            form.password
          }
          onChange={
            updateField
          }
          className="pg-input"
          placeholder="Enter your password"
        />
      </div>


      <button
        type="submit"
        className="pg-button pg-button-primary"
        style={{
          width:
            "100%",
        }}
        disabled={
          submitting
        }
      >
        {submitting
          ? "Signing in..."
          : "Sign in"}
      </button>


      <div className="auth-footer">
        New owner?{" "}

        <Link href="/register">
          Create an account
        </Link>
      </div>
    </form>
  );
}