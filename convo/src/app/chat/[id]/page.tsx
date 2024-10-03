'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '../../../lib/firebase';
import { doc as firestoreDoc, onSnapshot, collection, addDoc, query, orderBy, serverTimestamp, DocumentData, updateDoc } from 'firebase/firestore';

interface Message {
  id: string;
  text: string;
  userId: string;
  createdAt: Date;
}

export default function ChatPage({ params }: { params: { id: string } }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
  const router = useRouter();

  useEffect(() => {
    const chatRoomRef = firestoreDoc(db, 'chatRooms', params.id);
    const unsubscribe = onSnapshot(chatRoomRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        const expiresAt = data.expiresAt.toDate();
        const now = new Date();
        if (now > expiresAt) {
          // Reset user status when chat expires
          const user = auth.currentUser;
          if (user) {
            const updateUserMatch = async () => {
              const userDocRef = firestoreDoc(db, 'users', user.uid);
              await updateDoc(userDocRef, {
                isMatched: false,
                matchedWith: null,
              });
            };
            updateUserMatch(); // Remove 'await' from here
            router.push('/interests');
          }
        } else {
          setTimeLeft(Math.floor((expiresAt.getTime() - now.getTime()) / 1000));
        }
      }
    });

    return () => unsubscribe();
  }, [params.id, router]);

  useEffect(() => {
    const messagesRef = collection(db, 'chatRooms', params.id, 'messages');
    const q = query(messagesRef, orderBy('createdAt'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate()
      } as Message)));
    });

    return () => unsubscribe();
  }, [params.id]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() === '') return;

    const user = auth.currentUser;
    if (!user) {
      console.error('User not authenticated');
      return;
    }

    await addDoc(collection(db, 'chatRooms', params.id, 'messages'), {
      text: newMessage,
      createdAt: serverTimestamp(),
      userId: user.uid
    });

    setNewMessage('');
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <header className="bg-purple-600 text-white p-4">
        <h1 className="text-2xl font-bold">Chat Room</h1>
        <p className="text-sm">
          Time left: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
        </p>
      </header>
      <div className="flex-grow overflow-y-auto p-4">
        {messages.map((message) => (
          <div 
            key={message.id} 
            className={`mb-2 p-2 rounded-lg ${
              message.userId === auth.currentUser?.uid 
                ? 'bg-purple-500 text-white self-end' 
                : 'bg-white text-gray-800 self-start'
            }`}
          >
            {message.text}
          </div>
        ))}
      </div>
      <form onSubmit={sendMessage} className="p-4 bg-white">
        <div className="flex">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-grow mr-2 p-2 border rounded"
            placeholder="Type a message..."
          />
          <button 
            type="submit" 
            className="bg-purple-600 text-white px-4 py-2 rounded"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}