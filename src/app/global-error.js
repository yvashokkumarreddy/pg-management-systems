"use client";

import {
  Home,
  RefreshCw,
  TriangleAlert,
} from "lucide-react";


export default function GlobalError({
  error,
  reset,
}) {
  return (
    <html lang="en">
      <body>

        <div className="global-error-page">

          <div className="global-error-card">

            <div className="global-error-icon">
              <TriangleAlert
                size={28}
              />
            </div>


            <div className="global-error-code">
              500
            </div>


            <h1>
              Something went wrong
            </h1>


            <p>
              We couldn't load the application.
              Please try again.
            </p>


            <div className="global-error-actions">

              <button
                type="button"
                className="global-error-secondary"
                onClick={() => {
                  window.location.href =
                    "/dashboard";
                }}
              >
                <Home size={17} />

                Go to dashboard
              </button>


              <button
                type="button"
                className="global-error-primary"
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

      </body>
    </html>
  );
}