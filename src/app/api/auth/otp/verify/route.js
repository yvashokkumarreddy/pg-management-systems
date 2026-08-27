export async function POST(request) {
  const body = await request.json();

  return Response.json({
    success: true,
    data: {
      phone: body.phone,
      message: "OTP verification placeholder."
    }
  });
}
