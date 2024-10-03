import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { db } from '@/lib/firebase';
import { collection, addDoc, onSnapshot, query, where, orderBy } from 'firebase/firestore';

interface Message {
  id: string;
  sender: string;
  content: string;
  timestamp: Date;
}

interface TimedChatProps {
  matchId: string;
  onChatEnd: () => void;
}

const TimedChat: React.FC<TimedChatProps> = ({ matchId, onChatEnd }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
  const { data: session } = useSession();

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, 'chatSessions', matchId, 'messages'), orderBy('timestamp')),
      (snapshot) => {
        const newMessages = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        } as Message));
        setMessages(newMessages);
      }
    );

    return () => unsubscribe();
  }, [matchId]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timer);
          onChatEnd();
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onChatEnd]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (inputMessage.trim() === '' || !session?.user?.email) return;

    await addDoc(collection(db, 'chatSessions', matchId, 'messages'), {
      sender: session.user.email,
      content: inputMessage,
      timestamp: new Date(),
    });

    setInputMessage('');
  };

  return (
    <div className="timed-chat">
      <div className="timer">Time left: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</div>
      <div className="messages">
        {messages.map((message) => (
          <div key={message.id} className={`message ${message.sender === session?.user?.email ? 'sent' : 'received'}`}>
            {message.content}
          </div>
        ))}
      </div>
      <form onSubmit={sendMessage}>
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Type a message..."
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
};

export default TimedChat;