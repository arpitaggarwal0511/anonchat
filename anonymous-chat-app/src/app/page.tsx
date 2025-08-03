'use client';

import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import Footer from './Footer';

export default function Home() {
  const router = useRouter();

  const createRoom = () => {
    const roomId = uuidv4();
    router.push(`/chat/${roomId}`);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-8">
      <h1 className="text-4xl font-bold mb-6 text-gray-800 text-center">
        🔐 Anonymous Chat Rooms
      </h1>

      <button
        onClick={createRoom}
        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 transition"
      >
        ➕ Create New Room
      </button>

      <>
        <Footer />
      </>

    </div>


  );
}
