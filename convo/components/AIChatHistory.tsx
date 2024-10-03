import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFunctions, httpsCallable } from 'firebase/functions';

function AIChatHistory() {
  const [isMatching, setIsMatching] = useState(false);
  const navigate = useNavigate();

  const handleStartChat = async () => {
    setIsMatching(true);
    const functions = getFunctions();
    const matchUsers = httpsCallable(functions, 'matchUsers');

    try {
      const result = await matchUsers();
      const data = result.data as { status: string; chatRoomId?: string; message: string };

      if (data.status === 'matched' && data.chatRoomId) {
        navigate(`/chat/${data.chatRoomId}`);
      } else {
        console.log(data.message);
        // Handle waiting status or other scenarios
      }
    } catch (error) {
      console.error('Error matching users:', error);
    } finally {
      setIsMatching(false);
    }
  };

  return (
    <div>
      <h1>AI Chat History</h1>
      <button onClick={handleStartChat} disabled={isMatching}>
        {isMatching ? 'Matching...' : 'Start New Chat'}
      </button>
      {/* Add your chat history list here */}
    </div>
  );
}

export default AIChatHistory;