"use client";

import {
  Home,
  RefreshCw,
  TriangleAlert,
} from "lucide-react";

import { useRouter } from "next/navigation";


export default function ErrorPage({
  error,
  reset,
}) {
  const router = useRouter();

  return (
    <div className="error-page">

      <div className="error-page-card">

        <div className="error-page-icon">
          <TriangleAlert
            size={28}
          />
        </div>

        <div className="error-page-code">
          500
        </div>

        <h1>
          Something went wrong
        </h1>

        <p>
          We couldn't complete your request.
          Please try again.
        </p>


        <div className="error-page-actions">

          <button
            type="button"
            className="error-page-secondary"
            onClick={() =>
              router.push("/dashboard")
            }
          >
            <Home size={17} />

            Go to dashboard
          </button>


          <button
            type="button"
            className="error-page-primary"
            onClick={() =>
              reset()
            }
          >
            <RefreshCw size={17} />

            Try again
          </button>

        </div>

      </div>

    </div>
  );
}