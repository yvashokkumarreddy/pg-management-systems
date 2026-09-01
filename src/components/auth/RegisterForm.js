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


export default function RegisterForm() {
  const router =
    useRouter();

  const [
    form,
    setForm,
  ] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
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

    const name =
      form.name.trim();

    const email =
      form.email
        .trim()
        .toLowerCase();


    if (!name) {
      setError(
        "Enter your name."
      );

      return;
    }

    if (!email) {
      setError(
        "Enter your email address."
      );

      return;
    }

    if (
      form.password.length <
      8
    ) {
      setError(
        "Password must contain at least 8 characters."
      );

      return;
    }

    if (
      form.password !==
      form.confirmPassword
    ) {
      setError(
        "Passwords do not match."
      );

      return;
    }


    try {
      setSubmitting(
        true
      );

      await apiRequest(
        "/api/auth/register",
        {
          method:
            "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body:
            JSON.stringify({
              name,
              email,
              password:
                form.password,
            }),
        }
      );


      /*
       * Registration creates the
       * application account.
       *
       * Sign in afterwards so the
       * normal Supabase cookie-based
       * browser session is created.
       */
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
        "Registration error:",
        err
      );


      if (
        err?.status ===
        409
      ) {
        setError(
          "An account with this email already exists."
        );

        return;
      }


      if (
        err?.status ===
        400
      ) {
        setError(
          "Please check your details and try again."
        );

        return;
      }


      if (
        err?.status ===
        429
      ) {
        setError(
          "Too many attempts. Please try again shortly."
        );

        return;
      }


      setError(
        "Unable to create your account right now. Please try again."
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
        Create account
      </h2>

      <p className="auth-subtitle">
        Create your owner
        account to start
        managing your PG.
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
        <label htmlFor="name">
          Name
        </label>

        <input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          required
          disabled={
            submitting
          }
          value={
            form.name
          }
          onChange={
            updateField
          }
          className="pg-input"
          placeholder="Your name"
        />
      </div>


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
          autoComplete="new-password"
          minLength={8}
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
          placeholder="Minimum 8 characters"
        />
      </div>


      <div className="pg-field">
        <label htmlFor="confirmPassword">
          Confirm password
        </label>

        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          disabled={
            submitting
          }
          value={
            form.confirmPassword
          }
          onChange={
            updateField
          }
          className="pg-input"
          placeholder="Repeat your password"
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
          ? "Creating account..."
          : "Create account"}
      </button>


      <div className="auth-footer">
        Already registered?{" "}

        <Link href="/login">
          Sign in
        </Link>
      </div>
    </form>
  );
}