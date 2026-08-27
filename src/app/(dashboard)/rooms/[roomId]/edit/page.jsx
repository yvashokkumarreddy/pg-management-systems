export default async function EditRoomPage({ params }) {
  const { roomId } = await params;

  return (
    <main>
      <h1>Edit Room {roomId}</h1>
    </main>
  );
}
