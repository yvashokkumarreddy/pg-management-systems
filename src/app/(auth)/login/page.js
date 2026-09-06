import LoginForm from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <main className="auth-page">
      <section className="auth-visual">
        <div>
          <div className="auth-brand">
            <div className="auth-brand-mark">PG</div>

            <div>
              <strong>PG Manager</strong>
              <div
                style={{
                  color: "#8d9297",
                  fontSize: "12px",
                  marginTop: "2px",
                }}
              >
                Owner workspace
              </div>
            </div>
          </div>

          <h1>
            A focused operating system for running your PG.
          </h1>

          <p>
            Manage rooms, tenants, joining-day rent cycles, payments,
            deposits, private documents and your public PG profile from one
            secure workspace.
          </p>
        </div>

        <small style={{ color: "#777c80" }}>
          Secure owner-scoped management
        </small>
      </section>

      <section className="auth-form-column">
        <LoginForm />
      </section>
    </main>
  );
}