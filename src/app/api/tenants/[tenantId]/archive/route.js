export async function PATCH(request, { params }) {
  const { tenantId } = await params;

  return Response.json({
    success: true,
    data: { tenantId, status: "ARCHIVED" }
  });
}
