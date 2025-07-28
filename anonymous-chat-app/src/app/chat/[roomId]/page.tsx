'use client';

import { useParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { getSocket } from '@/lib/socket';
import { Socket } from 'socket.io-client';

type ChatMessage = {
  user: string;
  text: string;
  timestamp: string;
};

export default function ChatRoom() {
  const params = useParams();
  const roomId = Array.isArray(params.roomId) ? params.roomId[0] : params.roomId;

  const [username, setUsername] = useState('');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const socketRef = useRef<Socket | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!roomId) return;

    let stored = localStorage.getItem('anon-username');
    if (!stored) {
      const animals = ['Tiger', 'Fox', 'Panda', 'Wolf'];
      const colors = ['Blue', 'Red', 'Green', 'Purple'];
      stored =
        colors[Math.floor(Math.random() * colors.length)] +
        animals[Math.floor(Math.random() * animals.length)] +
        Math.floor(Math.random() * 100);
      localStorage.setItem('anon-username', stored);
    }
    setUsername(stored);

    const socket = getSocket();
    socketRef.current = socket;

    socket.emit('join-room', roomId, stored);

    socket.on('receive-message', (msg: ChatMessage) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      socket.off('receive-message');
      socket.off('previous-messages');
    };
  }, [roomId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
  if (!message.trim()) return;

  const msgObj: ChatMessage = {
    user: username,
    text: message.trim(),
    timestamp: new Date().toISOString(),
  };

  // ✅ Immediately add message to local state
  setMessages((prev) => [...prev, msgObj]);

  // ✅ Send to server
  socketRef.current?.emit('send-message', roomId, msgObj);

  setMessage('');
};



  return (
    <div className="min-h-screen bg-white p-4 flex flex-col max-w-2xl mx-auto">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-black">
          Room ID: <span className="text-blue-700 break-all">{roomId}</span>
        </h2>
        <p className="text-black mt-1">
          Logged in as: <b>{username}</b>
        </p>
      </div>

      <div className="flex-1 border rounded-lg p-4 h-[60vh] overflow-y-auto bg-gray-50 shadow space-y-2">
        {messages.length === 0 ? (
          <p className="text-gray-500">No messages yet</p>
        ) : (
          <>
            {messages.map((msg, idx) => {
              const isOwn = msg.user === username;
              return (
                <div
                  key={idx}
                  className={`flex flex-col w-fit max-w-[80%] ${
                    isOwn ? 'ml-auto items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`px-3 py-2 rounded-md text-sm ${
                      isOwn ? 'bg-blue-100 text-blue-900' : 'bg-gray-200 text-gray-900'
                    }`}
                  >
                    <b>{msg.user}:</b> {msg.text}
                  </div>
                  <span className="text-xs text-gray-500 mt-1">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              );
            })}
            <div ref={chatEndRef} />
          </>
        )}
      </div>

      <div className="mt-4 flex gap-2">
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          className="flex-1 border border-gray-300 px-4 py-2 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder-gray-500"
          placeholder="Type a message..."
        />

        <button
          onClick={sendMessage}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-md shadow focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          Send
        </button>
      </div>
    </div>
  );
}
