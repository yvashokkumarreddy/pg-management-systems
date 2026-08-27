export async function GET() {
  return Response.json({
    success: true,
    data: {
      vacantRooms: 0,
      partiallyFilledRooms: 0,
      fullRooms: 0,
      totalVacantBeds: 0
    }
  });
}
