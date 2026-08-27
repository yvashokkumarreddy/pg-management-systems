export async function PUT(request, { params }) {
  const { paymentId } = await params;

  return Response.json({
    success: true,
    data: { paymentId }
  });
}
