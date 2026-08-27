export default async function EditTenantPage({ params }) {
  const { tenantId } = await params;

  return (
    <main>
      <h1>Edit Tenant {tenantId}</h1>
    </main>
  );
}
