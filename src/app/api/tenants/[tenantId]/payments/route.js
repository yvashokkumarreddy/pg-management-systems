export async function GET(request, { params }) {
  const { tenantId } = await params;

  return Response.json({
    success: true,
    data: { tenantId, payments: [] }
  });
}

export async function POST(request, { params }) {
  const { tenantId } = await params;

  return Response.json(
    {
      success: true,
      data: { tenantId, payment: null }
    },
    { status: 201 }
  );
}
