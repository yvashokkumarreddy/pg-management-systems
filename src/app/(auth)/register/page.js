import RegisterForm from "@/components/auth/RegisterForm";

export default function RegisterPage() {
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
            Everything required to operate your PG in one place.
          </h1>

          <p>
            Keep occupancy, tenant records, rent history, deposits,
            documents and your property profile organized from day one.
          </p>
        </div>

        <small style={{ color: "#777c80" }}>
          Secure owner-scoped management
        </small>
      </section>

      <section className="auth-form-column">
        <RegisterForm />
      </section>
    </main>
  );
}