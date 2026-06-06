import { useState } from "react";
import "./App.css";

function App() {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loadingProductId, setLoadingProductId] = useState(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const quickPrompts = [
    "Birthday gift for my mother under Rs. 5000",
    "Romantic anniversary gift between Rs. 3000 and Rs. 8000",
    "Same day flowers in Colombo",
    "Gift for a 10 year old child",
  ];

  const handleSend = async () => {
    if (!message.trim() || loading) return;

    const userMessage = message;
    setMessages((prev) => [...prev, { role: "user", text: userMessage }]);
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage }),
      });

      const data = await response.json();

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: data.reply || "I found some Kapruka options for you.",
          products: data.products || [],
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "Sorry, I could not connect to the shopping assistant.",
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
    } catch {
      alert("Failed to load product details");
    } finally {
      setLoadingProductId(null);
    }
  };

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-logo">K</div>
          <div>
            <h2>Kapruka</h2>
            <p>AI Concierge</p>
          </div>
        </div>

        <button className="sidebar-link active">💬 Shopping Chat</button>
        <button className="sidebar-link">🎁 Gift Finder</button>
        <button className="sidebar-link">📦 Track Order</button>
        <button className="sidebar-link">❤️ Saved Picks</button>

        <div className="mcp-card">
          <span>LIVE MCP</span>
          <strong>7 tools connected</strong>
          <p>Search, delivery, checkout and tracking.</p>
        </div>
      </aside>

      <main className="main">
        <header className="header">
          <div>
            <span className="eyebrow">Sri Lanka’s AI shopping concierge</span>
            <h1>Find the perfect Kapruka gift.</h1>
            <p>
              Ask by occasion, budget, recipient, city, or delivery date.
            </p>
          </div>
          <div className="online-pill">● Online</div>
        </header>

        <div className="quick-prompts">
          {quickPrompts.map((prompt) => (
            <button key={prompt} onClick={() => setMessage(prompt)}>
              {prompt}
            </button>
          ))}
        </div>

        <section className="chat-card">
          <div className="chat-messages">
            {messages.length === 0 && (
              <div className="empty-state">
                <div className="empty-icon">🎁</div>
                <h3>What are we shopping for?</h3>
                <p>
                  Try: “I need a birthday gift for my mother under Rs. 5000”
                </p>
              </div>
            )}

            {messages.map((msg, index) => (
              <div className="message-block" key={index}>
                <div className={`bubble ${msg.role}`}>{msg.text}</div>

                {msg.products?.length > 0 && (
                  <div className="product-grid">
                    {msg.products.map((product) => (
                      <article className="product-card" key={product.id}>
                        <div className="product-image">
                          <img src={product.image} alt={product.name} />
                          <span>In stock</span>
                        </div>

                        <div className="product-body">
                          <h3>{product.name}</h3>
                          <div className="product-row">
                            <strong>LKR {product.price?.toLocaleString()}</strong>
                            <small>{product.category || "Kapruka"}</small>
                          </div>

                          <div className="product-actions">
                            <button onClick={() => handleViewDetails(product.id)}>
                              {loadingProductId === product.id
                                ? "Loading..."
                                : "View Details"}
                            </button>
                            <a
                              href={product.url}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Open
                            </a>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="bubble assistant">Searching Kapruka products...</div>
            )}
          </div>

          <div className="chat-input">
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ask for gifts, flowers, cakes, delivery or checkout..."
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSend();
              }}
            />
            <button onClick={handleSend} disabled={loading}>
              {loading ? "Wait..." : "Send"}
            </button>
          </div>
        </section>
      </main>

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

            <span className="modal-label">
              {selectedProduct.category?.name || "Kapruka Product"}
            </span>

            <h2>{selectedProduct.name}</h2>

            <p className="modal-price">
              LKR {selectedProduct.price?.amount?.toLocaleString()}
            </p>

            <p className="modal-description">{selectedProduct.description}</p>

            <div className="modal-grid">
              <div>
                <span>Stock</span>
                <strong>
                  {selectedProduct.in_stock ? "Available" : "Out of stock"}
                </strong>
              </div>
              <div>
                <span>Vendor</span>
                <strong>{selectedProduct.attributes?.vendor || "Kapruka"}</strong>
              </div>
              <div>
                <span>Category</span>
                <strong>{selectedProduct.category?.name || "General"}</strong>
              </div>
            </div>

            <div className="modal-actions">
              <button>Check Delivery</button>
              <a href={selectedProduct.url} target="_blank" rel="noreferrer">
                View on Kapruka
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;