export async function GET() {
  return Response.json({
    success: true,
    data: {
      totalExpected: 0,
      totalCollected: 0,
      totalOutstanding: 0,
      pending: 0,
      partial: 0,
      paid: 0,
      overdue: 0
    }
  });
}
