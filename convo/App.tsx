import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import AIChatHistory from './components/AIChatHistory';
import ChatRoom from './components/ChatRoom';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AIChatHistory />} />
        <Route path="/chat/:roomId" element={<ChatRoom />} />
      </Routes>
    </Router>
  );
}

export default App;