import { useState } from "react";
import "./App.css";

function App() {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loadingProductId, setLoadingProductId] = useState(null);
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

    const handleViewDetails = async (productId) => {
      setLoadingProductId(productId);

      try {
        const response = await fetch(`http://localhost:5000/product/${productId}`);
        const data = await response.json();
        setSelectedProduct(data);
      } catch (error) {
        alert("Failed to load product details");
      } finally {
        setLoadingProductId(null);
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
                     <button
                        className="details-btn"
                        onClick={() => handleViewDetails(product.id)}
                      >
                        {loadingProductId === product.id ? "Loading..." : "View Details"}
                      </button>
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

      {selectedProduct && (
  <div className="modal-overlay">
    <div className="modal">
      <button className="close-btn" onClick={() => setSelectedProduct(null)}>
        ×
      </button>

      <img
        src={selectedProduct.images?.[0]}
        alt={selectedProduct.name}
        className="modal-image"
      />

      <h2>{selectedProduct.name}</h2>
      <p className="modal-price">
        LKR {selectedProduct.price?.amount?.toLocaleString()}
      </p>
      <p>{selectedProduct.description}</p>
      <p>
        <strong>Stock:</strong>{" "}
        {selectedProduct.in_stock ? "Available" : "Out of stock"}
      </p>
      <p>
        <strong>Category:</strong> {selectedProduct.category?.name}
      </p>
    </div>
  </div>
)}
    </div>
  );
}

export default App;