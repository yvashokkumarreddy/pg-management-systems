export async function GET(request, { params }) {
  const { tenantId } = await params;

  return Response.json({
    success: true,
    data: { tenantId, documents: [] }
  });
}
