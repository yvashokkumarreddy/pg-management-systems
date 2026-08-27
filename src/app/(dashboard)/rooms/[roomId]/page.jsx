export default async function RoomPage({ params }) {
  const { roomId } = await params;

  return (
    <main>
      <h1>Room {roomId}</h1>
    </main>
  );
}
