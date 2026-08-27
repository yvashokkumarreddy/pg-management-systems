export async function PATCH(request, { params }) {
  const { roomId } = await params;

  return Response.json({
    success: true,
    data: { roomId, status: "ARCHIVED" }
  });
}
