export default async function TenantPage({ params }) {
  const { tenantId } = await params;

  return (
    <main>
      <h1>Tenant {tenantId}</h1>
    </main>
  );
}
