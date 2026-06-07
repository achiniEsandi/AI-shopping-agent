import React, { useState } from "react";
import "./App.css";
import {
  MessageCircle,
  Gift,
  ShoppingBag,
  Package,
  Settings,
  Search,
  Bell,
  UserCircle,
  Send,
  Mic,
  Plus,
  Sparkles,
  MapPin,
  CalendarDays,
  Clock,
  ChevronRight,
  Loader2,
  X,
  CheckCircle2,
  ShieldCheck,
  Compass,
  ArrowRight
} from "lucide-react";

function App() {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loadingProductId, setLoadingProductId] = useState(null);
  const [deliveryCity, setDeliveryCity] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [deliveryResult, setDeliveryResult] = useState(null);
  const [deliveryLoading, setDeliveryLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Hi! I’m your Kapruka luxury concierge. Tell me the occasion, recipient, budget, and delivery city — I’ll curate the best options for you.",
      products: [],
    },
  ]);
  const [loading, setLoading] = useState(false);
  
  // Dynamic shopping intelligence states
  const [latestIntent, setLatestIntent] = useState(null);
  const [latestProducts, setLatestProducts] = useState([]);

  const quickPrompts = [
    "Show more anniversary gift options",
    "What are the delivery fees?",
    "Birthday gift for my mother under Rs. 5000",
    "Same-day flowers in Colombo",
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
          text: data.reply || "I curated a few Kapruka options for you.",
          products: data.products || [],
        },
      ]);
      
      // Update dynamic insights
      if (data.intent) {
        setLatestIntent(data.intent);
      }
      if (data.products) {
        setLatestProducts(data.products);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "Sorry, I couldn’t connect to the concierge service.",
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

  const handleNewConversation = () => {
    setMessages([
      {
        role: "assistant",
        text: "Hi! I’m your Kapruka luxury concierge. Tell me the occasion, recipient, budget, and delivery city — I’ll curate the best options for you.",
        products: [],
      },
    ]);
    setLatestIntent(null);
    setLatestProducts([]);
    setSelectedProduct(null);
    setMessage("");
  };

  const getRecipientAndOccasion = () => {
    if (!latestIntent) return { recipient: "General", occasion: "Gift Shopping" };
    const queryText = (latestIntent.query || "").toLowerCase();
    const messageText = messages.map(m => m.text).join(" ").toLowerCase();
    const fullText = `${queryText} ${messageText}`;
    
    let recipient = "General";
    if (fullText.includes("mother") || fullText.includes("mom") || fullText.includes("ammi") || fullText.includes("amma")) recipient = "Mother";
    else if (fullText.includes("father") || fullText.includes("dad") || fullText.includes("thatha")) recipient = "Father";
    else if (fullText.includes("wife") || fullText.includes("girlfriend") || fullText.includes("love") || fullText.includes("husband") || fullText.includes("boyfriend")) recipient = "Partner";
    else if (fullText.includes("kid") || fullText.includes("child") || fullText.includes("toy") || fullText.includes("son") || fullText.includes("daughter")) recipient = "Children";
    else if (fullText.includes("friend")) recipient = "Friend";
    
    let occasion = "Gift Shopping";
    if (fullText.includes("birthday")) occasion = "Birthday";
    else if (fullText.includes("anniversary")) occasion = "Anniversary";
    else if (fullText.includes("romantic") || fullText.includes("valentine")) occasion = "Romantic Gift";
    else if (fullText.includes("wedding") || fullText.includes("marriage")) occasion = "Wedding";
    
    return { recipient, occasion };
  };

  const { recipient, occasion } = getRecipientAndOccasion();

  const handleCheckDelivery = async () => {
  if (!deliveryCity.trim()) {
    alert("Please enter a delivery city");
    return;
  }

  setDeliveryLoading(true);
  setDeliveryResult(null);

  try {
    const params = new URLSearchParams({
      city: deliveryCity,
      productId: selectedProduct.id,
    });

    if (deliveryDate) {
      params.append("date", deliveryDate);
    }

    const response = await fetch(
      `http://localhost:5000/delivery-check?${params.toString()}`
    );

    const data = await response.json();
    setDeliveryResult(data);
  } catch {
    alert("Failed to check delivery");
  } finally {
    setDeliveryLoading(false);
  }
};

  return (
    <div className="luxury-layout">
      {/* Sidebar */}
      <aside className="left-sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-logo">
            <Gift size={20} className="logo-icon" />
          </div>
          <div>
            <h2>Kapruka AI</h2>
            <p>Luxury Concierge</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button className="active" onClick={handleNewConversation}>
            <Plus size={16} /> New Conversation
          </button>
          <button>
            <Clock size={16} /> History
          </button>
          <button>
            <Compass size={16} /> Gift Explorer
          </button>
          <button>
            <Package size={16} /> Active Orders
          </button>
          <button>
            <Settings size={16} /> Preferences
          </button>
        </nav>

        <div className="upgrade-card">
          <div className="upgrade-header">
            <Sparkles size={16} className="upgrade-sparkle" />
            <span>Diamond Tier</span>
          </div>
          <p>Unlock dedicated personal concierge agents & priority same-day delivery.</p>
          <button>Upgrade Now</button>
        </div>

        <div className="profile-card">
          <div className="avatar">
            <UserCircle size={24} />
          </div>
          <div>
            <strong>Guest Shopper</strong>
            <p>Premium Member</p>
          </div>
        </div>
      </aside>

      {/* Topbar */}
      <header className="topbar">
        <div className="topbar-left">
          <div className="app-title-container">
            <span className="app-title-prefix">KAPRUKA</span>
            <h1 className="app-title-main">CONCIERGE</h1>
            <span className="app-title-stage">Discovery Stage</span>
          </div>
          <span className="ai-active">
            <span className="glow-dot"></span> AI Active
          </span>
        </div>

        <div className="topbar-right">
          <div className="search-box">
            <Search size={16} className="search-icon" />
            <input placeholder="Search catalog..." />
          </div>

          <button className="icon-btn">
            <Bell size={18} />
          </button>
          <button className="icon-btn">
            <ShoppingBag size={18} />
          </button>
        </div>
      </header>

      {/* Main shell split in two */}
      <main className="main-shell">
        <section className="chat-section">
          <div className="chat-scroll">
            {messages.map((msg, index) => (
              <div
                className={`chat-row ${msg.role}`}
                key={index}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className={`chat-bubble ${msg.role}`}>
                  {msg.role === "assistant" && (
                    <div className="engine-label">
                      <Sparkles size={12} className="engine-icon animate-pulse" /> Recommendation Engine
                    </div>
                  )}

                  <p>{msg.text}</p>

                  {msg.products?.length > 0 && (
                    <div className="stitched-product-grid">
                      {msg.products.slice(0, 6).map((product) => (
                        <article className="stitched-card" key={product.id}>
                          <div className="stitched-image">
                            <img src={product.image} alt={product.name} />
                            <div className="badge-row">
                              <span className="badge badge-mcp">
                                <ShieldCheck size={10} /> Live MCP
                              </span>
                              <span className="badge badge-stock">
                                <CheckCircle2 size={10} /> In stock
                              </span>
                            </div>
                            <div className="delivery-badge">
                              <Sparkles size={10} /> SAME DAY
                            </div>
                          </div>

                          <div className="stitched-body">
                            <h3>{product.name}</h3>

                            <div className="stitched-footer">
                              <strong>LKR {product.price?.toLocaleString()}</strong>
                              <button onClick={() => handleViewDetails(product.id)}>
                                {loadingProductId === product.id ? (
                                  <Loader2 size={12} className="animate-spin" />
                                ) : (
                                  <>Details <ChevronRight size={12} /></>
                                )}
                              </button>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="chat-row assistant">
                <div className="chat-bubble assistant">
                  <div className="engine-label">
                    <Loader2 size={12} className="animate-spin engine-icon" /> Recommendation Engine
                  </div>
                  <p>Searching Kapruka’s live catalog...</p>
                </div>
              </div>
            )}
          </div>

          {/* Chat command/input center */}
          <div className="command-area">
            <div className="quick-replies">
              {quickPrompts.map((prompt) => (
                <button key={prompt} onClick={() => setMessage(prompt)}>
                  {prompt}
                </button>
              ))}
            </div>

            <div className="command-input">
              <button className="mini-action" title="Add attachments">
                <Plus size={18} />
              </button>

              <textarea
                value={message}
                rows={1}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ask your concierge something..."
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />

              <button className="mini-action" title="Voice Search">
                <Mic size={18} />
              </button>
              
              <button className="send-action" onClick={handleSend} disabled={loading} title="Send Message">
                <Send size={16} />
              </button>
            </div>
          </div>
        </section>

        {/* Dynamic Concierge Insights Sidebar */}
        <aside className="right-panel">
          <div className="panel-block">
            <h2>Concierge Insights</h2>

            {latestIntent ? (
              <div className="insight-card">
                <div className="insight-item">
                  <span className="insight-label">
                    Target Recipient
                  </span>
                  <strong className="insight-value">{recipient}</strong>
                </div>

                <div className="insight-item">
                  <span className="insight-label">
                    Occasion
                  </span>
                  <strong className="insight-value">{occasion}</strong>
                </div>

                <div className="insight-item border-top">
                  <span className="insight-label">Budget Range</span>
                  <strong className="insight-value">
                    {latestIntent.minPrice || latestIntent.maxPrice ? (
                      <>
                        {latestIntent.minPrice ? `LKR ${latestIntent.minPrice.toLocaleString()}` : "LKR 0"} - {latestIntent.maxPrice ? `LKR ${latestIntent.maxPrice.toLocaleString()}` : "∞"}
                      </>
                    ) : (
                      "Flexible"
                    )}
                  </strong>
                  {latestIntent.maxPrice && latestProducts.length > 0 && (
                    <div className="budget-box">
                      <div className="budget-progress-container">
                        <span>Budget Utilization</span>
                        <strong>
                          {(() => {
                            const avgPrice = latestProducts.reduce((sum, p) => sum + (p.price || 0), 0) / latestProducts.length;
                            const pct = Math.min(100, Math.round((avgPrice / latestIntent.maxPrice) * 100));
                            return `${pct}%`;
                          })()}
                        </strong>
                      </div>
                      <div className="budget-bar">
                        <div style={{
                          width: `${(() => {
                            const avgPrice = latestProducts.reduce((sum, p) => sum + (p.price || 0), 0) / latestProducts.length;
                            return Math.min(100, Math.round((avgPrice / latestIntent.maxPrice) * 100));
                          })()}%`
                        }}></div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="insight-item border-top">
                  <span className="insight-label">Results Found</span>
                  <strong className="insight-value">{latestProducts.length} Items Matching</strong>
                </div>
                
                <div className="insight-item border-top">
                  <span className="insight-label">Next Recommended Step</span>
                  <p className="insight-next-step">
                    {selectedProduct 
                      ? "Check delivery availability or proceed to Kapruka catalog details." 
                      : latestProducts.length > 0 
                        ? "Select a product card to check real-time courier schedule & fees." 
                        : "Describe the product category and budget constraints to query the catalog."
                    }
                  </p>
                </div>
              </div>
            ) : (
              <div className="insight-empty">
                <Sparkles size={24} className="empty-icon animate-pulse" />
                <h3>Awaiting Intent</h3>
                <p>Provide details like occasion, recipient, or budget to view shopping insights.</p>
              </div>
            )}
          </div>

          <div className="panel-block">
            <h2>Logistics</h2>

            <div className="logistics-item">
              <MapPin size={18} className="logistics-icon" />
              <div>
                <strong>Colombo & Suburbs</strong>
                <p>Express Same-Day delivery eligible</p>
              </div>
            </div>

            <div className="logistics-item">
              <CalendarDays size={18} className="logistics-icon" />
              <div>
                <strong>Delivery Date</strong>
                <p>Choose exact date during checkout</p>
              </div>
            </div>
          </div>

          <div className="quote-box">
            <p>
              “I’m monitoring live Kapruka catalogs via MCP, prioritizing matched budgets, in-stock products, and delivery slots.”
            </p>
          </div>
        </aside>
      </main>

      {/* Selected Product Modal Details */}
      {selectedProduct && (
        <div className="modal-overlay">
          <div className="modal">
            <button className="close-btn" onClick={() => setSelectedProduct(null)} title="Close Modal">
              <X size={18} />
            </button>

            <img
              src={selectedProduct.images?.[0] || selectedProduct.image_url}
              alt={selectedProduct.name}
              className="modal-image"
            />

            <span className="modal-label">
              {selectedProduct.category?.name || "Kapruka Catalog Product"}
            </span>

            <h2>{selectedProduct.name}</h2>

            <p className="modal-price">
              LKR {selectedProduct.price?.amount?.toLocaleString()}
            </p>

            <p className="modal-description">{selectedProduct.description}</p>

            <div className="modal-details-grid">
              <div className="detail-pill">
                <span>Stock Status</span>
                <strong>{selectedProduct.in_stock ? "Available" : "Call to Verify"}</strong>
              </div>
              <div className="detail-pill">
                <span>MCP Lookup</span>
                <strong>Verified Live</strong>
              </div>
            </div>

            <div className="delivery-check-box">
  <h3>Check Delivery</h3>

  <div className="delivery-fields">
    <input
      value={deliveryCity}
      onChange={(e) => setDeliveryCity(e.target.value)}
      placeholder="Enter city, e.g. Kandy"
    />

    <input
      type="date"
      value={deliveryDate}
      onChange={(e) => setDeliveryDate(e.target.value)}
    />

    <button onClick={handleCheckDelivery} disabled={deliveryLoading}>
      {deliveryLoading ? "Checking..." : "Check"}
    </button>
  </div>

  {deliveryResult && (
    <div className={`delivery-result ${deliveryResult.available ? "ok" : "no"}`}>
      <strong>
        {deliveryResult.available ? "Delivery Available" : "Delivery Not Available"}
      </strong>

      {deliveryResult.rate && (
        <p>Delivery Fee: LKR {deliveryResult.rate.toLocaleString()}</p>
      )}

      {deliveryResult.checked_date && (
        <p>Date: {deliveryResult.checked_date}</p>
      )}

      {deliveryResult.perishable_warning && (
        <p>{deliveryResult.perishable_warning}</p>
      )}
    </div>
  )}
</div>

            <div className="modal-actions">
              <button>Check Delivery</button>
              <a href={selectedProduct.url} target="_blank" rel="noreferrer">
                View on Kapruka <ArrowRight size={14} />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;