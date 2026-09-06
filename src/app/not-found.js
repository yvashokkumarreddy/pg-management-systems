"use client";

import {
  ArrowLeft,
  Home,
} from "lucide-react";

import { useRouter } from "next/navigation";


export default function NotFoundPage() {
  const router = useRouter();

  return (
    <div className="error-page">
      <div className="error-page-card">

        <div className="error-page-code">
          404
        </div>

        <h1>
          Page not found
        </h1>

        <p>
          The page you're looking for
          doesn't exist or may have been moved.
        </p>

        <div className="error-page-actions">

          <button
            type="button"
            className="error-page-secondary"
            onClick={() =>
              router.back()
            }
          >
            <ArrowLeft size={17} />

            Go back
          </button>

          <button
            type="button"
            className="error-page-primary"
            onClick={() =>
              router.push("/dashboard")
            }
          >
            <Home size={17} />

            Go to dashboard
          </button>

        </div>

      </div>
    </div>
  );
}