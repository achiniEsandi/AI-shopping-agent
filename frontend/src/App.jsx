import { useState } from "react";
import "./App.css";

function App() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

  const handleSend = () => {
    if (!message.trim()) return;

    setMessages([
      ...messages,
      { role: "user", text: message },
      { role: "assistant", text: "AI response will appear here soon." },
    ]);

    setMessage("");
  };

  return (
    <div className="app">
      <div className="chat-container">
        <h1>Kapruka AI Shopping Agent</h1>

        <div className="chat-box">
          {messages.map((msg, index) => (
            <div key={index} className={`message ${msg.role}`}>
              {msg.text}
            </div>
          ))}
        </div>

        <div className="input-row">
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ask for gifts, cakes, flowers..."
          />
          <button onClick={handleSend}>Send</button>
        </div>
      </div>
    </div>
  );
}

export default App;