import { useState } from "react";
import "./App.css";

function App() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!message.trim() || loading) return;

    const userMessage = message;

    setMessages((prev) => [...prev, { role: "user", text: userMessage }]);

    setMessage("");
    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: userMessage }),
      });

      const data = await response.json();

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: data.reply || "Sorry, I could not find a response.",
          products: data.products || [],
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "Sorry, I could not connect to the backend.",
          products: [],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <div className="chat-container">
        <h1>Kapruka AI Shopping Agent</h1>

        <div className="chat-box">
          {messages.map((msg, index) => (
            <div key={index}>
              <div className={`message ${msg.role}`}>{msg.text}</div>

              {msg.products?.length > 0 && (
                <div className="product-grid">
                  {msg.products.map((product) => (
                    <div className="product-card" key={product.id}>
                      <img src={product.image} alt={product.name} />
                      <h3>{product.name}</h3>
                      <p>LKR {product.price?.toLocaleString()}</p>
                      <a href={product.url} target="_blank" rel="noreferrer">
                        View Product
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="message assistant">Searching Kapruka products...</div>
          )}
        </div>

        <div className="input-row">
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ask for gifts, cakes, flowers..."
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSend();
            }}
          />
          <button onClick={handleSend} disabled={loading}>
            {loading ? "Wait..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;