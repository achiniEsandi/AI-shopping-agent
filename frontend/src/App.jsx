import React, { useState } from "react";
import "./App.css";
import Button from "./components/Button";
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
  Minus,
  Sparkles,
  MapPin,
  CalendarDays,
  Clock,
  ChevronLeft,
  ChevronRight,
  Loader2,
  X,
  CheckCircle2,
  ShieldCheck,
  Compass,
  ArrowRight,
  Heart,
  Trash2,
  Copy,
  Check,
  Menu
} from "lucide-react";

function App() {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loadingProductId, setLoadingProductId] = useState(null);
  const [deliveryCity, setDeliveryCity] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [deliveryResult, setDeliveryResult] = useState(null);
  const [deliveryLoading, setDeliveryLoading] = useState(false);
  
  // Search input and catalog search states
  const [searchQuery, setSearchQuery] = useState("");
  const [catalogSearchResults, setCatalogSearchResults] = useState(null); // null: chat mode, array: search results
  const [catalogSearchLoading, setCatalogSearchLoading] = useState(false);
  const [activeSearchQuery, setActiveSearchQuery] = useState("");

  // User Authentication & Management States
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem("kapruka_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authTab, setAuthTab] = useState("login"); // 'login' | 'register' | 'profile'
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authTier, setAuthTier] = useState("Standard");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Hi! I’m your Kapruka luxury concierge. Tell me the occasion, recipient, budget, and delivery city — I’ll curate the best options for you.",
      products: [],
    },
  ]);
  const [loading, setLoading] = useState(false);

  // Textarea Ref & Auto-Grow Effect to prevent scroll overflow arrows
  const textareaRef = React.useRef(null);
  React.useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);
  
  // Dynamic shopping intelligence states
  const [latestIntent, setLatestIntent] = useState(null);
  const [latestProducts, setLatestProducts] = useState([]);

  // 1. Add to Cart and Saved Picks state
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartConfirmation, setCartConfirmation] = useState(null);

  const [savedPicks, setSavedPicks] = useState([]);
  const [isSavedPicksOpen, setIsSavedPicksOpen] = useState(false);

  // 2. Active Orders Tracking State
  const [isTrackingOpen, setIsTrackingOpen] = useState(false);
  const [trackOrderNumber, setTrackOrderNumber] = useState("");
  const [trackingData, setTrackingData] = useState(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingError, setTrackingError] = useState(null);

  // 3. Mobile responsiveness Sidebar State
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(false);

  // 4. Guided Checkout Wizard States (within Cart Drawer)
  const [checkoutStep, setCheckoutStep] = useState(0); // 0: Cart Review, 1: Recipient, 2: Delivery, 3: Gift Message, 4: Confirm, 5: Success
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [recipientAddress, setRecipientAddress] = useState("");
  const [recipientCity, setRecipientCity] = useState("");
  const [deliveryLocationType, setDeliveryLocationType] = useState("house");
  const [deliveryInstructions, setDeliveryInstructions] = useState("");
  
  const [senderName, setSenderName] = useState("");
  const [senderAnonymous, setSenderAnonymous] = useState(false);
  const [giftMessage, setGiftMessage] = useState("");

  const [citySuggestions, setCitySuggestions] = useState([]);
  const [searchingCities, setSearchingCities] = useState(false);

  const [chkDeliveryLoading, setChkDeliveryLoading] = useState(false);
  const [chkDeliveryResult, setChkDeliveryResult] = useState(null);
  const [chkDeliveryError, setChkDeliveryError] = useState(null);

  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutResult, setCheckoutResult] = useState(null);
  const [checkoutError, setCheckoutError] = useState(null);

  const [copiedLink, setCopiedLink] = useState(false);

  const quickPrompts = [
    "Show more anniversary gift options",
    "What are the delivery fees?",
    "Birthday gift for my mother under Rs. 5000",
    "Same-day flowers in Colombo",
  ];

  // Cart helper calculations
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleSend = async (customMsg = null) => {
    const textToSend = customMsg || message;
    if (!textToSend.trim() || loading) return;

    setMessages((prev) => [...prev, { role: "user", text: textToSend }]);
    if (!customMsg) {
      setMessage("");
    } else {
      setSearchQuery("");
    }
    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: textToSend }),
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
        if (data.intent.city) {
          setDeliveryCity(data.intent.city);
          setRecipientCity(data.intent.city);
        }
        if (data.intent.deliveryDate) {
          setDeliveryDate(data.intent.deliveryDate);
        }
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

  const handleOccasionSelect = (promptText) => {
    setMessage(promptText);
    setIsRightPanelOpen(false);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleCatalogSearch = async (query) => {
    if (!query || !query.trim()) return;
    const cleanQuery = query.trim();
    setCatalogSearchLoading(true);
    setActiveSearchQuery(cleanQuery);
    setCatalogSearchResults([]);

    try {
      const response = await fetch(
        `http://localhost:5000/test-search?q=${encodeURIComponent(cleanQuery)}`
      );
      const data = await response.json();
      setCatalogSearchResults(data || []);
    } catch (err) {
      console.error("Catalog search failed", err);
      setCatalogSearchResults([]);
    } finally {
      setCatalogSearchLoading(false);
    }
  };

  const handleClearCatalogSearch = () => {
    setSearchQuery("");
    setCatalogSearchResults(null);
    setActiveSearchQuery("");
  };

  const handleViewDetails = async (productId) => {
    setLoadingProductId(productId);

    try {
      const response = await fetch(`http://localhost:5000/product/${productId}`);
      const data = await response.json();
      setSelectedProduct(data);
      setDeliveryResult(null); // Reset modal-level delivery result
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
    setSearchQuery("");
    setCatalogSearchResults(null);
    setActiveSearchQuery("");
    setIsMobileSidebarOpen(false);
  };

  const handleAuthSubmit = async (e) => {
    if (e) e.preventDefault();
    setAuthError("");
    setAuthLoading(true);

    const endpoint = authTab === "login" ? "login" : "register";
    const payload = authTab === "login" 
      ? { email: authEmail, password: authPassword }
      : { name: authName, email: authEmail, password: authPassword, tier: authTier };

    try {
      const response = await fetch(`http://localhost:5000/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Authentication failed");
      }

      // Success
      setCurrentUser(data);
      localStorage.setItem("kapruka_user", JSON.stringify(data));
      setIsAuthModalOpen(false);
      resetAuthForm();
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleQuickLogin = async (email, password) => {
    setAuthError("");
    setAuthLoading(true);
    try {
      const response = await fetch("http://localhost:5000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Login failed");
      setCurrentUser(data);
      localStorage.setItem("kapruka_user", JSON.stringify(data));
      setIsAuthModalOpen(false);
      resetAuthForm();
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleUpgradeTier = async (newTier) => {
    if (!currentUser) return;
    setAuthLoading(true);
    setAuthError("");
    try {
      const response = await fetch("http://localhost:5000/upgrade-tier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: currentUser.email, tier: newTier }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Upgrade failed");
      setCurrentUser(data);
      localStorage.setItem("kapruka_user", JSON.stringify(data));
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem("kapruka_user");
    setIsAuthModalOpen(false);
    resetAuthForm();
  };

  const resetAuthForm = () => {
    setAuthName("");
    setAuthEmail("");
    setAuthPassword("");
    setAuthTier("Standard");
    setAuthError("");
  };

  const getUserInitials = () => {
    if (!currentUser || !currentUser.name) return "";
    return currentUser.name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("");
  };

  const handleVoiceSearch = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Voice search is not supported in this browser. Please use Google Chrome or Microsoft Edge.");
      return;
    }

    if (isListening) {
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    setIsListening(true);

    recognition.onstart = () => {
      console.log("Speech recognition started");
    };

    recognition.onspeechend = () => {
      recognition.stop();
      setIsListening(false);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
      alert("Voice search error: " + event.error);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      if (transcript) {
        setMessage((prev) => {
          const prefix = prev.trim() ? " " : "";
          return prev + prefix + transcript;
        });
      }
      setIsListening(false);
    };

    recognition.start();
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

  // Add to Cart Handlers
  const handleAddToCart = (product, isFromModal = false) => {
    let item;
    if (isFromModal) {
      item = {
        id: product.id,
        name: product.name,
        price: product.price?.amount || product.price,
        image: product.images?.[0] || product.image_url || product.image,
        currency: product.price?.currency || product.currency || "LKR",
      };
    } else {
      item = {
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        currency: product.currency || "LKR",
      };
    }

    setCart((prevCart) => {
      const existing = prevCart.find((i) => i.id === item.id);
      if (existing) {
        return prevCart.map((i) =>
          i.id === item.id ? { ...i, quantity: Math.min(99, i.quantity + 1) } : i
        );
      }
      return [...prevCart, { ...item, quantity: 1 }];
    });

    // Visual Toast Confirmation
    setCartConfirmation(item.name);
    setTimeout(() => {
      setCartConfirmation(null);
    }, 2500);
  };

  const handleRemoveFromCart = (productId) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
  };

  const handleUpdateQuantity = (productId, delta) => {
    setCart((prevCart) =>
      prevCart.map((item) => {
        if (item.id === productId) {
          const newQty = item.quantity + delta;
          return { ...item, quantity: Math.max(1, Math.min(99, newQty)) };
        }
        return item;
      })
    );
  };

  // Saved Picks Toggle Handler
  const handleSavePick = (product, isFromModal = false) => {
    const pId = product.id;
    const isAlreadySaved = savedPicks.some((item) => item.id === pId);

    if (isAlreadySaved) {
      setSavedPicks((prev) => prev.filter((item) => item.id !== pId));
    } else {
      let item;
      if (isFromModal) {
        item = {
          id: product.id,
          name: product.name,
          price: product.price?.amount || product.price,
          image: product.images?.[0] || product.image_url || product.image,
          currency: product.price?.currency || product.currency || "LKR",
        };
      } else {
        item = {
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.image,
          currency: product.currency || "LKR",
        };
      }
      setSavedPicks((prev) => [...prev, item]);
    }
  };

  const isProductSaved = (productId) => {
    return savedPicks.some((item) => item.id === productId);
  };

  // Autocomplete City Dropdown Caller
  const handleCityChange = async (val) => {
    setRecipientCity(val);
    if (val.trim().length < 2) {
      setCitySuggestions([]);
      return;
    }
    setSearchingCities(true);
    try {
      const response = await fetch(
        `http://localhost:5000/delivery-cities?query=${encodeURIComponent(val)}`
      );
      const data = await response.json();
      setCitySuggestions(data.cities || []);
    } catch (err) {
      console.error("Failed to fetch cities", err);
    } finally {
      setSearchingCities(false);
    }
  };

  // Check Delivery Status during Checkout
  const handleCheckDeliveryInCheckout = async () => {
    if (!recipientCity.trim()) {
      setChkDeliveryError("Recipient city is required to check delivery");
      return;
    }
    if (!deliveryDate) {
      setChkDeliveryError("Delivery date is required");
      return;
    }
    if (cart.length === 0) {
      setChkDeliveryError("Cart is empty");
      return;
    }

    setChkDeliveryLoading(true);
    setChkDeliveryResult(null);
    setChkDeliveryError(null);

    try {
      const productId = cart[0].id; // Validate delivery using the first item
      const params = new URLSearchParams({
        city: recipientCity,
        productId,
        date: deliveryDate,
      });

      const response = await fetch(
        `http://localhost:5000/delivery-check?${params.toString()}`
      );
      if (!response.ok) throw new Error("Failed to check delivery");
      const data = await response.json();
      setChkDeliveryResult(data);
    } catch (err) {
      setChkDeliveryError(err.message || "Failed to check delivery availability");
    } finally {
      setChkDeliveryLoading(false);
    }
  };

  // Create Checkout Guest Order Caller
  const handleCreateCheckoutLink = async () => {
    if (cart.length === 0) {
      setCheckoutError("Cart is empty");
      return;
    }
    if (!recipientName.trim()) {
      setCheckoutError("Recipient Name is required");
      return;
    }
    if (!recipientPhone.trim() || recipientPhone.trim().length < 7) {
      setCheckoutError("Recipient Phone is required (at least 7 characters)");
      return;
    }
    if (!recipientAddress.trim() || recipientAddress.trim().length < 3) {
      setCheckoutError("Recipient Address is required (at least 3 characters)");
      return;
    }
    if (!recipientCity.trim()) {
      setCheckoutError("Recipient City is required");
      return;
    }
    if (!deliveryDate) {
      setCheckoutError("Delivery Date is required");
      return;
    }
    if (!senderName.trim()) {
      setCheckoutError("Sender Name is required");
      return;
    }

    setCheckoutLoading(true);
    setCheckoutError(null);
    setCheckoutResult(null);

    const payload = {
      cart: cart.map((item) => ({
        product_id: item.id,
        quantity: item.quantity,
        icing_text: null,
      })),
      recipient: {
        name: recipientName.trim(),
        phone: recipientPhone.trim(),
      },
      delivery: {
        address: recipientAddress.trim(),
        city: recipientCity.trim(),
        date: deliveryDate,
        location_type: deliveryLocationType,
        instructions: deliveryInstructions.trim() || null,
      },
      sender: {
        name: senderName.trim(),
        anonymous: senderAnonymous,
      },
      gift_message: giftMessage.trim() || null,
      currency: "LKR",
    };

    try {
      const response = await fetch("http://localhost:5000/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to generate guest checkout order");
      }

      const data = await response.json();
      if (!data || !data.checkout_url) {
        throw new Error(data?.error || "Invalid response from checkout service");
      }

      setCheckoutResult(data);
      // Clear Cart on successful order link generation
      setCart([]);
      setCheckoutStep(5); // Show success screen
    } catch (err) {
      setCheckoutError(err.message || "An error occurred during order checkout");
    } finally {
      setCheckoutLoading(false);
    }
  };

  // Order Tracking Caller
  const handleTrackOrder = async () => {
    if (!trackOrderNumber.trim()) {
      setTrackingError("Please enter a valid Kapruka order number");
      return;
    }

    setTrackingLoading(true);
    setTrackingError(null);
    setTrackingData(null);

    try {
      const response = await fetch(
        `http://localhost:5000/track-order/${encodeURIComponent(trackOrderNumber.trim())}`
      );
      const data = await response.json();
      if (data && data.error) {
        setTrackingError(data.error);
      } else if (!data || data.order_number === undefined) {
        setTrackingError("Order number not found or server tracking failed");
      } else {
        setTrackingData(data);
      }
    } catch {
      setTrackingError("Failed to communicate with Kapruka tracking server");
    } finally {
      setTrackingLoading(false);
    }
  };

  const getNextRecommendedStep = () => {
    if (cart.length === 0) {
      return "Browse products in the catalog or ask the concierge, then add products to your cart.";
    }
    if (checkoutStep === 0) {
      return "Items are in your cart! Click on the Cart icon in the topbar to proceed to checkout.";
    }
    if (checkoutStep >= 1 && checkoutStep <= 3) {
      return `Complete Step ${checkoutStep} of checkout: ${
        checkoutStep === 1 ? "Recipient details" : checkoutStep === 2 ? "Delivery address & verification" : "Gift card information"
      }.`;
    }
    if (checkoutStep === 4) {
      return "Confirm your guest checkout details and generate the payment link.";
    }
    if (checkoutStep === 5) {
      return "Click the checkout link to complete the payment on Kapruka. Once paid, use the order number in the 'Active Orders' tab to track progress.";
    }
    return "Describe the product category and budget constraints to query the catalog.";
  };

  return (
    <div className="luxury-layout">
      {/* Mobile Sidebar Navigation Drawer Overlay */}
      {isMobileSidebarOpen && (
        <div className="mobile-overlay" onClick={() => setIsMobileSidebarOpen(false)}></div>
      )}

      {/* Mobile Right Panel Drawer Overlay */}
      {isRightPanelOpen && (
        <div className="mobile-overlay" onClick={() => setIsRightPanelOpen(false)} style={{ zIndex: 90 }}></div>
      )}

      {/* Sidebar */}
      <aside className={`left-sidebar ${isMobileSidebarOpen ? "open" : ""}`}>
        <div className="sidebar-brand">
          <div className="sidebar-logo">
            <Gift size={20} className="logo-icon" />
          </div>
          <div>
            <h2>Kapruka AI</h2>
            <p>Luxury Concierge</p>
          </div>
          <button className="mobile-sidebar-close" onClick={() => setIsMobileSidebarOpen(false)} title="Close Sidebar">
            <X size={18} />
          </button>
        </div>

        <nav className="sidebar-nav">
          <button className="sidebar-nav-btn active" onClick={handleNewConversation}>
            <Plus size={16} /> New Conversation
          </button>
          
          <button className="sidebar-nav-btn" onClick={() => {
            setIsSavedPicksOpen(true);
            setIsMobileSidebarOpen(false);
          }}>
            <Heart size={16} fill={savedPicks.length > 0 ? "var(--primary)" : "none"} /> Saved Picks 
            {savedPicks.length > 0 && <span className="sidebar-badge">{savedPicks.length}</span>}
          </button>

          <button className="sidebar-nav-btn" onClick={() => {
            setIsCartOpen(true);
            setCheckoutStep(0);
            setIsMobileSidebarOpen(false);
          }}>
            <ShoppingBag size={16} /> Shopping Cart 
            {cart.length > 0 && <span className="sidebar-badge">{cartCount}</span>}
          </button>

          <button className="sidebar-nav-btn" onClick={() => {
            setIsTrackingOpen(true);
            setIsMobileSidebarOpen(false);
          }}>
            <Package size={16} /> Active Orders
          </button>
          
          <button className="sidebar-nav-btn">
            <Compass size={16} /> Gift Explorer
          </button>
          
          <button className="sidebar-nav-btn">
            <Settings size={16} /> Preferences
          </button>
        </nav>

        <div className="upgrade-card">
          <div className="upgrade-header">
            <Sparkles size={16} className="upgrade-sparkle" />
            <span>{currentUser ? `${currentUser.tier} Tier` : "Diamond Tier"}</span>
          </div>
          <p>
            {currentUser 
              ? currentUser.tier === "Diamond"
                ? "You are enjoying our highest tier benefits, including zero delivery fee & personal concierges."
                : `Upgrade to Diamond Tier to unlock dedicated concierge agents & free shipping.`
              : "Unlock dedicated personal concierge agents & priority same-day delivery."}
          </p>
          <button onClick={() => {
            if (currentUser) {
              setAuthTab("profile");
            } else {
              setAuthTab("login");
            }
            setIsAuthModalOpen(true);
          }}>
            {currentUser 
              ? currentUser.tier === "Diamond" ? "Manage Tier" : "Upgrade Now"
              : "Track / Upgrade Tier"}
          </button>
        </div>

        <div className="profile-card" onClick={() => {
          setAuthTab(currentUser ? "profile" : "login");
          setIsAuthModalOpen(true);
        }}>
          <div className="avatar">
            {currentUser ? (
              <div className="avatar-initials">{getUserInitials()}</div>
            ) : (
              <UserCircle size={24} />
            )}
          </div>
          <div>
            <strong>{currentUser ? currentUser.name : "Guest Shopper"}</strong>
            <p>
              {currentUser ? (
                <span className={`tier-tag ${currentUser.tier.toLowerCase()}`}>{currentUser.tier} Member</span>
              ) : (
                "Anonymous Guest"
              )}
            </p>
          </div>
        </div>
      </aside>

      {/* Topbar */}
      <header className="topbar">
        <div className="topbar-left">
          <button className="mobile-menu-btn" onClick={() => setIsMobileSidebarOpen(true)} title="Open Menu">
            <Menu size={20} />
          </button>
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
          <form className="luxury-search-box" onSubmit={(e) => {
            e.preventDefault();
            handleCatalogSearch(searchQuery);
          }}>
            <Search size={16} className="search-icon" />
            <input 
              placeholder="Search live catalog..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button 
                type="button" 
                className="search-clear-btn" 
                onClick={handleClearCatalogSearch}
                title="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </form>

          <button className="icon-btn" onClick={() => setIsSavedPicksOpen(true)} title="Saved Picks">
            <Heart size={18} fill={savedPicks.length > 0 ? "var(--primary)" : "none"} />
            {savedPicks.length > 0 && <span className="topbar-badge">{savedPicks.length}</span>}
          </button>

          <button className="icon-btn cart-btn-relative" onClick={() => {
            setIsCartOpen(true);
            setCheckoutStep(0);
          }} title="View Cart">
            <ShoppingBag size={18} />
            {cart.length > 0 && <span className="topbar-badge">{cartCount}</span>}
          </button>

          <button className="icon-btn right-panel-toggle-btn" onClick={() => setIsRightPanelOpen(true)} title="Concierge Insights">
            <Compass size={18} />
          </button>
        </div>
      </header>

      {/* Main shell split in two */}
      <main className="main-shell" style={catalogSearchResults !== null ? { gridTemplateColumns: "1fr" } : {}}>
        {catalogSearchResults !== null ? (
          <section className="catalog-search-results-section">
            <header className="results-header">
              <div className="results-title-area">
                <Button 
                  variant="secondary" 
                  icon={ChevronLeft} 
                  onClick={handleClearCatalogSearch}
                  className="back-to-chat-btn"
                >
                  Back to Chat
                </Button>
                <h2>Search Results for "{activeSearchQuery}"</h2>
              </div>
              <span className="results-count">
                {catalogSearchLoading ? "Searching..." : `${catalogSearchResults.length} items found`}
              </span>
            </header>

            <div className="results-content-scroll">
              {catalogSearchLoading ? (
                <div className="results-loading-state">
                  <Loader2 size={36} className="animate-spin text-muted" />
                  <p>Searching live Kapruka catalog via MCP...</p>
                </div>
              ) : catalogSearchResults.length === 0 ? (
                <div className="results-empty-state">
                  <Search size={48} className="empty-state-icon" />
                  <h3>No matching catalog products</h3>
                  <p>We couldn't find any direct matches in the live catalog. Try asking our AI concierge in the chat for custom suggestions!</p>
                  <Button variant="primary" icon={MessageCircle} onClick={handleClearCatalogSearch}>
                    Open AI Chat Concierge
                  </Button>
                </div>
              ) : (
                <div className="results-grid">
                  {catalogSearchResults.map((product) => (
                    <article className="stitched-card" key={product.id}>
                      <div className="stitched-image">
                        <img src={product.image} alt={product.name} />
                        
                        <button 
                          className={`card-heart-btn ${isProductSaved(product.id) ? "saved" : ""}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSavePick(product, false);
                          }}
                          title={isProductSaved(product.id) ? "Remove from Saved" : "Save Pick"}
                        >
                          <Heart size={14} fill={isProductSaved(product.id) ? "var(--primary)" : "none"} />
                        </button>

                        <div className="badge-row">
                          <span className="badge badge-mcp">
                            <ShieldCheck size={10} /> Live MCP
                          </span>
                          <span className="badge badge-stock">
                            <CheckCircle2 size={10} /> In stock
                          </span>
                        </div>
                        {product.inStock && (
                          <div className="delivery-badge">
                            <Sparkles size={10} /> SAME DAY
                          </div>
                        )}
                      </div>

                      <div className="stitched-body">
                        <h3>{product.name}</h3>

                        <div className="stitched-footer">
                          <strong>LKR {product.price?.toLocaleString()}</strong>
                          <div className="card-actions">
                            <button 
                              onClick={() => handleAddToCart(product, false)} 
                              className="btn-add-cart" 
                              title="Add to Cart"
                            >
                              <ShoppingBag size={14} />
                            </button>
                            <button onClick={() => handleViewDetails(product.id)} className="btn-details">
                              {loadingProductId === product.id ? (
                                <Loader2 size={12} className="animate-spin" />
                              ) : (
                                <>Details <ChevronRight size={12} /></>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>
        ) : (
          <>
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
                            
                            <button 
                              className={`card-heart-btn ${isProductSaved(product.id) ? "saved" : ""}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSavePick(product, false);
                              }}
                              title={isProductSaved(product.id) ? "Remove from Saved" : "Save Pick"}
                            >
                              <Heart size={14} fill={isProductSaved(product.id) ? "var(--primary)" : "none"} />
                            </button>

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
                              <div className="card-actions">
                                <button 
                                  onClick={() => handleAddToCart(product, false)} 
                                  className="btn-add-cart" 
                                  title="Add to Cart"
                                >
                                  <ShoppingBag size={14} />
                                </button>
                                <button onClick={() => handleViewDetails(product.id)} className="btn-details">
                                  {loadingProductId === product.id ? (
                                    <Loader2 size={12} className="animate-spin" />
                                  ) : (
                                    <>Details <ChevronRight size={12} /></>
                                  )}
                                </button>
                              </div>
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
                ref={textareaRef}
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

              <button 
                type="button"
                className={`mini-action ${isListening ? "voice-active" : ""}`} 
                onClick={handleVoiceSearch}
                title={isListening ? "Listening..." : "Voice Search"}
              >
                {isListening ? (
                  <span className="voice-pulse"></span>
                ) : (
                  <Mic size={18} />
                )}
              </button>
              
              <button className="send-action" onClick={() => handleSend()} disabled={loading} title="Send Message">
                <Send size={16} />
              </button>
            </div>
          </div>
        </section>

        {/* Dynamic Concierge Insights Sidebar */}
        <aside className={`right-panel ${isRightPanelOpen ? "open" : ""}`}>
          <div className="panel-block">
            <div className="panel-header-row">
              <h2>Concierge Insights</h2>
              <button className="mobile-right-panel-close" onClick={() => setIsRightPanelOpen(false)} title="Close Panel">
                <X size={16} />
              </button>
              {latestIntent && latestIntent.language && (
                <span className={`lang-badge ${latestIntent.language}`}>
                  {latestIntent.language === "sinhala" && "සිංහල"}
                  {latestIntent.language === "singlish" && "Singlish"}
                  {latestIntent.language === "tamil" && "தமிழ்"}
                  {latestIntent.language === "tanglish" && "Tanglish"}
                  {latestIntent.language === "english" && "English"}
                </span>
              )}
            </div>

            {latestIntent ? (
              <div className="insight-card">
                <div className="insight-item">
                  <span className="insight-label">Target Recipient</span>
                  <strong className="insight-value">{recipient}</strong>
                </div>

                <div className="insight-item">
                  <span className="insight-label">Occasion</span>
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
                  <span className="insight-label">Insights Breakdown</span>
                  <div className="insights-breakdown-grid">
                    <div className="breakdown-stat">
                      <span>Matches</span>
                      <strong>{latestProducts.length}</strong>
                    </div>
                    <div className="breakdown-stat">
                      <span>In Cart</span>
                      <strong>{cartCount}</strong>
                    </div>
                    <div className="breakdown-stat">
                      <span>Saved Picks</span>
                      <strong>{savedPicks.length}</strong>
                    </div>
                  </div>
                </div>

                <div className="insight-item border-top">
                  <span className="insight-label">Cart Subtotal</span>
                  <strong className="insight-value">LKR {cartTotal.toLocaleString()}</strong>
                </div>
                
                <div className="insight-item border-top">
                  <span className="insight-label">Next Recommended Step</span>
                  <p className="insight-next-step">{getNextRecommendedStep()}</p>
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
            <h2>Logistics Status</h2>

            <div className="logistics-item">
              <MapPin size={18} className="logistics-icon" />
              <div>
                <strong>Delivery Destination</strong>
                <p>{recipientCity || deliveryCity || "Not set yet"}</p>
              </div>
            </div>

            <div className="logistics-item">
              <CalendarDays size={18} className="logistics-icon" />
              <div>
                <strong>Selected Date</strong>
                <p>{deliveryDate || "Choose date during checkout"}</p>
              </div>
            </div>

            <div className="logistics-item">
              <ShieldCheck size={18} className="logistics-icon" />
              <div>
                <strong>Availability Check</strong>
                <p>
                  {chkDeliveryResult?.available 
                    ? `Available (Fee: LKR ${chkDeliveryResult.rate})` 
                    : deliveryResult?.available 
                      ? `Available (Fee: LKR ${deliveryResult.rate})` 
                      : "Check availability inside checkout/modal"
                  }
                </p>
              </div>
            </div>
          </div>

          <div className="occasion-calendar-card">
            <div className="calendar-header">
              <CalendarDays size={14} className="calendar-title-icon" />
              <span>Gifting Calendar</span>
            </div>
            <div className="occasions-list">
              <div className="occasion-item-card active" onClick={() => handleOccasionSelect("Father's Day cakes and luxury hampers for my Thatha")}>
                <div className="occasion-date">
                  <span className="month">JUN</span>
                  <span className="day">21</span>
                </div>
                <div className="occasion-info">
                  <h4>Father's Day</h4>
                  <p>Celebrate Father's Day with cakes & gourmet hampers</p>
                  <span className="quick-action-tag">Tap to ask Concierge</span>
                </div>
              </div>

              <div className="occasion-item-card" onClick={() => handleOccasionSelect("Poson Poya traditional white flowers and fruits basket")}>
                <div className="occasion-date">
                  <span className="month">JUN</span>
                  <span className="day">25</span>
                </div>
                <div className="occasion-info">
                  <h4>Poson Poya</h4>
                  <p>Send traditional white flowers & fresh fruit platters</p>
                  <span className="quick-action-tag">Tap to ask Concierge</span>
                </div>
              </div>

              <div className="occasion-item-card" onClick={() => handleOccasionSelect("Esala Perahera festival celebration hampers and sweet boxes")}>
                <div className="occasion-date">
                  <span className="month">AUG</span>
                  <span className="day">18</span>
                </div>
                <div className="occasion-info">
                  <h4>Esala Perahera</h4>
                  <p>Send festive hampers & sweet boxes to Kandy</p>
                  <span className="quick-action-tag">Tap to ask Concierge</span>
                </div>
              </div>
            </div>
          </div>
        </aside>
          </>
        )}
      </main>

      {/* Selected Product Modal Details */}
      {selectedProduct && (
        <div className="modal-overlay" onClick={() => setSelectedProduct(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setSelectedProduct(null)} title="Close Modal">
              <X size={18} />
            </button>

            <img
              src={selectedProduct.images?.[0] || selectedProduct.image_url}
              alt={selectedProduct.name}
              className="modal-image"
            />

            <div className="modal-header-row">
              <span className="modal-label">
                {selectedProduct.category?.name || selectedProduct.category || "Kapruka Catalog Product"}
              </span>

              <button 
                className={`modal-heart-btn ${isProductSaved(selectedProduct.id) ? "saved" : ""}`}
                onClick={() => handleSavePick(selectedProduct, true)}
                title={isProductSaved(selectedProduct.id) ? "Remove from Saved" : "Save Pick"}
              >
                <Heart size={16} fill={isProductSaved(selectedProduct.id) ? "var(--primary)" : "none"} />
              </button>
            </div>

            <h2>{selectedProduct.name}</h2>

            <p className="modal-price">
              LKR {(selectedProduct.price?.amount || selectedProduct.price)?.toLocaleString()}
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
              <h3>Check Delivery Availability</h3>

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
                  min={new Date().toISOString().split('T')[0]}
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

                  {deliveryResult.rate !== undefined && (
                    <p>Delivery Fee: LKR {deliveryResult.rate.toLocaleString()}</p>
                  )}

                  {deliveryResult.checked_date && (
                    <p>Date: {deliveryResult.checked_date}</p>
                  )}

                  {deliveryResult.perishable_warning && (
                    <p className="warning-note">{deliveryResult.perishable_warning}</p>
                  )}
                </div>
              )}
            </div>

            <div className="modal-actions">
              <button 
                onClick={() => {
                  handleAddToCart(selectedProduct, true);
                  setSelectedProduct(null);
                }}
                className="btn-add-cart-primary"
              >
                <ShoppingBag size={14} /> Add to Cart
              </button>
              
              <a href={selectedProduct.url} target="_blank" rel="noreferrer">
                View on Kapruka <ArrowRight size={14} />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Cart Drawer */}
      <div className={`drawer-overlay ${isCartOpen ? "open" : ""}`} onClick={() => setIsCartOpen(false)}>
        <div className="drawer cart-drawer" onClick={(e) => e.stopPropagation()}>
          <header className="drawer-header">
            <div className="drawer-header-left">
              <ShoppingBag size={20} />
              <h2>Your Cart</h2>
              {cart.length > 0 && <span className="drawer-badge">{cartCount}</span>}
            </div>
            <button className="drawer-close-btn" onClick={() => setIsCartOpen(false)}>
              <X size={18} />
            </button>
          </header>

          <div className="drawer-content">
            {checkoutStep === 0 ? (
              // Step 0: Cart list review
              cart.length === 0 ? (
                <div className="drawer-empty-state">
                  <ShoppingBag size={48} className="empty-state-icon" />
                  <h3>Your cart is empty</h3>
                  <p>Browse our catalog and ask your concierge to curate selections for you!</p>
                  <Button variant="primary" icon={Compass} onClick={() => setIsCartOpen(false)}>
                    Continue Browsing
                  </Button>
                </div>
              ) : (
                <div className="cart-list-container">
                  <div className="cart-items-scroll">
                    {cart.map((item) => (
                      <div className="cart-item-row" key={item.id}>
                        <img src={item.image} alt={item.name} className="cart-item-img" />
                        <div className="cart-item-info">
                          <h4>{item.name}</h4>
                          <span className="cart-item-price">LKR {item.price.toLocaleString()}</span>
                          <div className="cart-item-qty-row">
                            <div className="qty-controls">
                              <button onClick={() => handleUpdateQuantity(item.id, -1)} className="qty-btn" title="Decrease">
                                <Minus size={12} />
                              </button>
                              <span className="qty-val">{item.quantity}</span>
                              <button onClick={() => handleUpdateQuantity(item.id, 1)} className="qty-btn" title="Increase">
                                <Plus size={12} />
                              </button>
                            </div>
                            <button onClick={() => handleRemoveFromCart(item.id)} className="cart-remove-btn" title="Remove Item">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="drawer-footer">
                    <div className="summary-row">
                      <span>Subtotal</span>
                      <strong>LKR {cartTotal.toLocaleString()}</strong>
                    </div>
                    <div className="summary-row">
                      <span>Delivery Fee</span>
                      <span className="fee-placeholder">Calculated at checkout step</span>
                    </div>
                    <div className="summary-row total">
                      <span>Grand Total</span>
                      <strong>LKR {cartTotal.toLocaleString()}*</strong>
                    </div>
                    <p className="total-hint">*Delivery fee excluded</p>
                    <Button variant="primary" className="w-full mt-4" icon={ArrowRight} iconPosition="right" onClick={() => setCheckoutStep(1)}>
                      Proceed to Checkout
                    </Button>
                  </div>
                </div>
              )
            ) : (
              // Checkout Wizard Flow (Steps 1 to 5)
              <div className="checkout-wizard">
                {/* Step indicators */}
                <div className="checkout-steps-nav">
                  {[1, 2, 3, 4].map((stepNum) => (
                    <div 
                      key={stepNum} 
                      className={`step-dot-container ${checkoutStep === stepNum ? "active" : ""} ${checkoutStep > stepNum ? "completed" : ""}`}
                    >
                      <div className="step-dot">{stepNum}</div>
                      {stepNum < 4 && <div className="step-dot-line"></div>}
                    </div>
                  ))}
                </div>

                <div className="step-title-row">
                  <h3>
                    {checkoutStep === 1 && "Recipient Details"}
                    {checkoutStep === 2 && "Delivery Location"}
                    {checkoutStep === 3 && "Gift Card & Message"}
                    {checkoutStep === 4 && "Confirm Guest Checkout"}
                    {checkoutStep === 5 && "Checkout Created!"}
                  </h3>
                  {checkoutStep <= 4 && (
                    <span className="step-indicator-text">Step {checkoutStep} of 4</span>
                  )}
                </div>

                <div className="checkout-form-scroll">
                  {checkoutStep === 1 && (
                    <div className="form-group-list">
                      <div className="form-group">
                        <label>Recipient Name *</label>
                        <input 
                          value={recipientName} 
                          onChange={(e) => setRecipientName(e.target.value)}
                          placeholder="e.g. Priyantha Silva" 
                        />
                      </div>
                      <div className="form-group">
                        <label>Recipient Phone (E.164 or Local SL) *</label>
                        <input 
                          value={recipientPhone} 
                          onChange={(e) => setRecipientPhone(e.target.value)}
                          placeholder="e.g. +94771234567 or 0771234567" 
                        />
                      </div>
                      <div className="form-group">
                        <label>Street Address *</label>
                        <textarea 
                          value={recipientAddress} 
                          onChange={(e) => setRecipientAddress(e.target.value)}
                          placeholder="Building, street, block, house number..."
                          rows={3}
                        />
                      </div>
                      <div className="form-group suggestions-relative">
                        <label>Delivery City *</label>
                        <input 
                          value={recipientCity} 
                          onChange={(e) => handleCityChange(e.target.value)}
                          placeholder="Type city name, e.g. Colombo 03" 
                        />
                        {searchingCities && <span className="suggestions-loader"><Loader2 size={12} className="animate-spin" /></span>}
                        {citySuggestions.length > 0 && (
                          <div className="suggestions-dropdown">
                            {citySuggestions.map((c) => (
                              <div 
                                key={c.name} 
                                className="suggestion-item"
                                onClick={() => {
                                  setRecipientCity(c.name);
                                  setCitySuggestions([]);
                                }}
                              >
                                <strong>{c.name}</strong>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {checkoutStep === 2 && (
                    <div className="form-group-list">
                      <div className="form-group">
                        <label>Delivery Date *</label>
                        <input 
                          type="date"
                          value={deliveryDate} 
                          onChange={(e) => setDeliveryDate(e.target.value)}
                          min={new Date().toISOString().split('T')[0]}
                        />
                      </div>
                      <div className="form-group">
                        <label>Location Type</label>
                        <select 
                          value={deliveryLocationType} 
                          onChange={(e) => setDeliveryLocationType(e.target.value)}
                        >
                          <option value="house">House</option>
                          <option value="apartment">Apartment</option>
                          <option value="office">Office</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Delivery Instructions (Optional)</label>
                        <textarea 
                          value={deliveryInstructions} 
                          onChange={(e) => setDeliveryInstructions(e.target.value)}
                          placeholder="Special instructions, gate codes, etc."
                          rows={2}
                        />
                      </div>

                      <div className="checkout-delivery-check">
                        <Button 
                          variant="secondary" 
                          className="w-full"
                          onClick={handleCheckDeliveryInCheckout}
                          loading={chkDeliveryLoading}
                          icon={ShieldCheck}
                        >
                          Verify Delivery & Check Fee
                        </Button>
                        {chkDeliveryResult && (
                          <div className={`delivery-result-box ${chkDeliveryResult.available ? "success" : "danger"}`}>
                            <strong>{chkDeliveryResult.available ? "Delivery Available!" : "Delivery Not Available"}</strong>
                            {chkDeliveryResult.rate !== undefined && <p>Fee: LKR {chkDeliveryResult.rate.toLocaleString()}</p>}
                            {chkDeliveryResult.perishable_warning && <p className="warning-text">{chkDeliveryResult.perishable_warning}</p>}
                          </div>
                        )}
                        {chkDeliveryError && (
                          <div className="delivery-result-box danger">
                            <strong>Check Failed</strong>
                            <p>{chkDeliveryError}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {checkoutStep === 3 && (
                    <div className="form-group-list">
                      <div className="form-group">
                        <label>Sender Name *</label>
                        <input 
                          value={senderName} 
                          onChange={(e) => setSenderName(e.target.value)}
                          placeholder="Your name shown on gift card" 
                        />
                      </div>
                      <div className="form-group checkbox-row">
                        <input 
                          type="checkbox" 
                          id="senderAnon" 
                          checked={senderAnonymous} 
                          onChange={(e) => setSenderAnonymous(e.target.checked)}
                        />
                        <label htmlFor="senderAnon">Send anonymously (Hide sender name on gift card)</label>
                      </div>
                      <div className="form-group">
                        <label>Gift Card Message (Optional, max 300 characters)</label>
                        <textarea 
                          value={giftMessage} 
                          onChange={(e) => setGiftMessage(e.target.value)}
                          placeholder="Write a greeting or message here..."
                          maxLength={300}
                          rows={4}
                        />
                        <span className="char-counter">{giftMessage.length} / 300</span>
                      </div>
                    </div>
                  )}

                  {checkoutStep === 4 && (
                    <div className="checkout-confirmation">
                      <div className="confirm-section">
                        <h4>Order Items</h4>
                        <div className="confirm-items">
                          {cart.map((item) => (
                            <div key={item.id} className="confirm-item-row">
                              <span>{item.name} x {item.quantity}</span>
                              <strong>LKR {(item.price * item.quantity).toLocaleString()}</strong>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="confirm-section border-top">
                        <h4>Recipient Details</h4>
                        <p><strong>Name:</strong> {recipientName}</p>
                        <p><strong>Phone:</strong> {recipientPhone}</p>
                        <p><strong>Address:</strong> {recipientAddress}, {recipientCity}</p>
                      </div>

                      <div className="confirm-section border-top">
                        <h4>Logistics & Gift Card</h4>
                        <p><strong>Delivery Date:</strong> {deliveryDate}</p>
                        <p><strong>Location:</strong> {deliveryLocationType}</p>
                        <p><strong>Sender:</strong> {senderName} {senderAnonymous && "(Anonymous)"}</p>
                        {giftMessage && <p><strong>Message:</strong> "{giftMessage}"</p>}
                      </div>

                      <div className="confirm-section border-top total-details">
                        <div className="confirm-row">
                          <span>Items Total</span>
                          <span>LKR {cartTotal.toLocaleString()}</span>
                        </div>
                        <div className="confirm-row">
                          <span>Delivery Fee</span>
                          <span>LKR {chkDeliveryResult?.rate ? chkDeliveryResult.rate.toLocaleString() : "0"}</span>
                        </div>
                        <div className="confirm-row grand-total">
                          <span>Grand Total</span>
                          <strong>LKR {(cartTotal + (chkDeliveryResult?.rate || 0)).toLocaleString()}</strong>
                        </div>
                      </div>

                      {checkoutError && (
                        <div className="checkout-error-banner">
                          <strong>Checkout Error</strong>
                          <p>{checkoutError}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {checkoutStep === 5 && checkoutResult && (
                    <div className="checkout-success-view">
                      <div className="success-icon-container">
                        <CheckCircle2 size={48} className="success-icon animate-pulse" />
                      </div>
                      <h3>Checkout Link Generated!</h3>
                      <p className="success-desc">A guest checkout session has been registered. Click the link below to pay and finalize your order on Kapruka.</p>
                      
                      <div className="success-details-card">
                        <div className="success-detail-row">
                          <span>Order Reference</span>
                          <strong>{checkoutResult.order_ref}</strong>
                        </div>
                        <div className="success-detail-row">
                          <span>Grand Total</span>
                          <strong>LKR {checkoutResult.summary?.grand_total?.toLocaleString()}</strong>
                        </div>
                        <div className="success-detail-row">
                          <span>Expires At</span>
                          <span className="expiry-val">
                            {new Date(checkoutResult.expires_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>

                      <div className="checkout-actions">
                        <Button 
                          href={checkoutResult.checkout_url} 
                          variant="primary" 
                          className="w-full text-center block"
                          icon={ArrowRight}
                          iconPosition="right"
                        >
                          Proceed to Payment
                        </Button>
                        <Button 
                          onClick={() => {
                            navigator.clipboard.writeText(checkoutResult.checkout_url);
                            setCopiedLink(true);
                            setTimeout(() => setCopiedLink(false), 2000);
                          }}
                          variant="secondary"
                          className="w-full mt-2"
                          icon={copiedLink ? Check : Copy}
                        >
                          {copiedLink ? "Copied!" : "Copy Checkout URL"}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {checkoutStep <= 4 && (
                  <footer className="checkout-wizard-footer">
                    {checkoutStep > 1 ? (
                      <Button variant="secondary" icon={ChevronLeft} iconPosition="left" onClick={() => setCheckoutStep(prev => prev - 1)}>
                        Back
                      </Button>
                    ) : (
                      <Button variant="secondary" onClick={() => setCheckoutStep(0)}>
                        Cancel
                      </Button>
                    )}

                    {checkoutStep < 4 ? (
                      <Button 
                        variant="primary" 
                        icon={ChevronRight}
                        iconPosition="right"
                        onClick={() => {
                          if (checkoutStep === 1) {
                            if (!recipientName.trim() || !recipientPhone.trim() || !recipientAddress.trim() || !recipientCity.trim()) {
                              alert("Please fill out all required recipient fields.");
                              return;
                            }
                          }
                          if (checkoutStep === 2) {
                            if (!deliveryDate) {
                              alert("Please select a delivery date.");
                              return;
                            }
                          }
                          if (checkoutStep === 3) {
                            if (!senderName.trim()) {
                              alert("Please enter a sender name.");
                              return;
                            }
                          }
                          setCheckoutStep(prev => prev + 1);
                        }}
                      >
                        Continue
                      </Button>
                    ) : (
                      <Button 
                        variant="primary" 
                        onClick={handleCreateCheckoutLink}
                        loading={checkoutLoading}
                      >
                        Create Checkout Link
                      </Button>
                    )}
                  </footer>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Saved Picks Drawer */}
      <div className={`drawer-overlay ${isSavedPicksOpen ? "open" : ""}`} onClick={() => setIsSavedPicksOpen(false)}>
        <div className="drawer saved-drawer" onClick={(e) => e.stopPropagation()}>
          <header className="drawer-header">
            <div className="drawer-header-left">
              <Heart size={20} fill="var(--primary)" />
              <h2>Saved Picks</h2>
              {savedPicks.length > 0 && <span className="drawer-badge">{savedPicks.length}</span>}
            </div>
            <button className="drawer-close-btn" onClick={() => setIsSavedPicksOpen(false)}>
              <X size={18} />
            </button>
          </header>

          <div className="drawer-content">
            {savedPicks.length === 0 ? (
              <div className="drawer-empty-state">
                <Heart size={48} className="empty-state-icon" />
                <h3>No saved picks yet</h3>
                <p>Browse products and heart your favorite gift choices to view them here.</p>
                <Button variant="primary" icon={Compass} onClick={() => setIsSavedPicksOpen(false)}>Browse Catalog</Button>
              </div>
            ) : (
              <div className="saved-list-container">
                <div className="saved-items-scroll">
                  {savedPicks.map((item) => (
                    <div className="saved-item-row" key={item.id}>
                      <img src={item.image} alt={item.name} className="saved-item-img" />
                      <div className="saved-item-info">
                        <h4>{item.name}</h4>
                        <span className="saved-item-price">LKR {item.price.toLocaleString()}</span>
                        <div className="saved-item-actions">
                          <button onClick={() => handleAddToCart(item, false)} className="btn-add-cart-mini">
                            <ShoppingBag size={12} /> Add to Cart
                          </button>
                          <button onClick={() => handleSavePick(item, false)} className="btn-remove-saved" title="Remove from Saved">
                            <Trash2 size={12} /> Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Order Tracking Modal */}
      {isTrackingOpen && (
        <div className="modal-overlay" onClick={() => {
          setIsTrackingOpen(false);
          setTrackOrderNumber("");
          setTrackingData(null);
          setTrackingError(null);
        }}>
          <div className="modal tracking-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => {
              setIsTrackingOpen(false);
              setTrackOrderNumber("");
              setTrackingData(null);
              setTrackingError(null);
            }} title="Close Tracking">
              <X size={18} />
            </button>

            <h2>Track Your Order</h2>
            <p className="modal-subtitle">Enter the Kapruka order number (sent to your email after checkout payment, e.g. VIMP34456CB2) to view live status.</p>

            <div className="tracking-search-bar">
              <input 
                value={trackOrderNumber}
                onChange={(e) => setTrackOrderNumber(e.target.value)}
                placeholder="Kapruka Order Number (e.g. VIMP34456CB2)"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleTrackOrder();
                }}
              />
              <Button onClick={handleTrackOrder} loading={trackingLoading} icon={Package}>
                Track Order
              </Button>
            </div>

            {trackingError && (
              <div className="tracking-error-box">
                <strong>Tracking Failed</strong>
                <p>{trackingError}</p>
              </div>
            )}

            {trackingLoading && (
              <div className="tracking-loading-state">
                <Loader2 size={24} className="animate-spin text-muted" />
                <p>Retrieving order details from live Kapruka systems...</p>
              </div>
            )}

            {trackingData && (
              <div className="tracking-details-scroll">
                <div className="tracking-status-header">
                  <div className="status-label">
                    <span>Current Status</span>
                    <strong className={`status-badge ${trackingData.status || "received"}`}>
                      {trackingData.status_display || trackingData.status}
                    </strong>
                  </div>
                  <div className="status-info">
                    <p><strong>Order Number:</strong> {trackingData.order_number}</p>
                    <p><strong>Order Date:</strong> {trackingData.order_date}</p>
                    <p>
                      <strong>Grand Total:</strong>{" "}
                      {typeof trackingData.amount === "object" && trackingData.amount !== null
                        ? `${trackingData.amount.currency} ${Number(trackingData.amount.value).toLocaleString()}`
                        : trackingData.amount}
                    </p>
                  </div>
                </div>

                <div className="tracking-recipient-box">
                  <h4>Delivery Address</h4>
                  <p><strong>Recipient:</strong> {trackingData.recipient?.name} ({trackingData.recipient?.phone})</p>
                  <p><strong>Address:</strong> {trackingData.recipient?.address}, {trackingData.recipient?.city}</p>
                  <p><strong>Delivery Date:</strong> {trackingData.delivery_date}</p>
                  {trackingData.special_instructions && <p><strong>Instructions:</strong> {trackingData.special_instructions}</p>}
                  {trackingData.greeting_message && <p><strong>Greeting Message:</strong> "{trackingData.greeting_message}"</p>}
                </div>

                <div className="tracking-items">
                  <h4>Order Items</h4>
                  {trackingData.items?.map((item, idx) => (
                    <div className="tracking-item-row" key={idx}>
                      <span>{item.name} x {item.quantity}</span>
                      <strong>LKR {(item.selling_price * item.quantity).toLocaleString()}</strong>
                    </div>
                  ))}
                </div>

                <div className="tracking-timeline-section">
                  <h4>Progress Timeline</h4>
                  <div className="timeline-container">
                    {trackingData.progress?.map((step, idx) => (
                      <div className="timeline-node" key={idx}>
                        <div className="timeline-circle active"></div>
                        <div className="timeline-info">
                          <strong>{step.step}</strong>
                          <span>{step.timestamp}</span>
                        </div>
                      </div>
                    ))}
                    {(!trackingData.progress || trackingData.progress.length === 0) && (
                      <p className="no-timeline">Order received. Awaiting dispatch logistics.</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {!trackingData && !trackingLoading && !trackingError && (
              <div className="tracking-empty-state">
                <Package size={48} className="empty-state-icon" />
                <p>Awaiting order lookup. Enter your order number above.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Toast Alert Confirmation */}
      {cartConfirmation && (
        <div className="toast-confirmation">
          <CheckCircle2 size={16} className="toast-icon" />
          <span>Added <strong>{cartConfirmation}</strong> to Cart!</span>
        </div>
      )}

      {/* User Auth & Profile Modal */}
      {isAuthModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAuthModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button 
              className="close-btn" 
              onClick={() => setIsAuthModalOpen(false)}
              title="Close Modal"
            >
              <X size={18} />
            </button>

            {authTab === "profile" && currentUser ? (
              // Logged-in Profile View
              <div className="profile-dashboard-view">
                <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "20px" }}>
                  <div className="avatar-initials" style={{ width: "56px", height: "56px", fontSize: "18px" }}>
                    {getUserInitials()}
                  </div>
                  <div style={{ textAlign: "left" }}>
                    <h2 style={{ margin: 0 }}>{currentUser.name}</h2>
                    <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "var(--text-muted)" }}>
                      {currentUser.email}
                    </p>
                    <span className={`tier-tag ${currentUser.tier.toLowerCase()}`} style={{ marginTop: "6px" }}>
                      {currentUser.tier} Member
                    </span>
                  </div>
                </div>

                {/* Tier Upgrade Management Board */}
                <div className="tier-management-card">
                  <h3>Manage Membership Tier</h3>
                  <div className="tier-options-list">
                    {[
                      { name: "Standard", desc: "Basic concierge suggestions, standard delivery fees." },
                      { name: "Silver", desc: "Silver catalog concierges, 5% off delivery fees." },
                      { name: "Gold", desc: "Gold Concierge priority, 20% off delivery fees." },
                      { name: "Diamond", desc: "Dedicated 1-on-1 concierge, zero delivery fees." }
                    ].map((tierOpt) => {
                      const isActive = currentUser.tier.toLowerCase() === tierOpt.name.toLowerCase();
                      return (
                        <div 
                          key={tierOpt.name} 
                          className={`tier-option-row ${isActive ? "active" : ""}`}
                        >
                          <div className="tier-option-details">
                            <strong>
                              {tierOpt.name} Tier
                              {isActive && <span style={{ color: "var(--success)", fontSize: "11px", fontWeight: "bold" }}>● Active</span>}
                            </strong>
                            <p>{tierOpt.desc}</p>
                          </div>
                          {!isActive && (
                            <Button 
                              variant="primary" 
                              className="btn-tier-upgrade"
                              onClick={() => handleUpgradeTier(tierOpt.name)}
                              disabled={authLoading}
                            >
                              Upgrade
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="logout-btn-container">
                  <Button 
                    variant="secondary" 
                    onClick={handleLogout} 
                    className="w-full"
                    icon={UserCircle}
                  >
                    Log Out of Account
                  </Button>
                </div>
              </div>
            ) : (
              // Login / Register Views
              <div className="auth-form-view">
                <div className="auth-tabs">
                  <button 
                    className={`auth-tab-btn ${authTab === "login" ? "active" : ""}`}
                    onClick={() => { setAuthTab("login"); setAuthError(""); }}
                  >
                    Sign In
                  </button>
                  <button 
                    className={`auth-tab-btn ${authTab === "register" ? "active" : ""}`}
                    onClick={() => { setAuthTab("register"); setAuthError(""); }}
                  >
                    Create Account
                  </button>
                </div>

                {/* Quick Logins Section */}
                {authTab === "login" && (
                  <div className="quick-login-section">
                    <h4>Demo Accounts (Quick Login)</h4>
                    <div className="quick-login-grid">
                      <button 
                        className="quick-user-btn"
                        onClick={() => handleQuickLogin("john@kapruka.com", "password123")}
                        disabled={authLoading}
                      >
                        <div className="quick-user-info">
                          <strong>John Jayawardene</strong>
                          <span>john@kapruka.com</span>
                        </div>
                        <span className="tier-tag diamond">Diamond Tier</span>
                      </button>
                      <button 
                        className="quick-user-btn"
                        onClick={() => handleQuickLogin("sarah@kapruka.com", "password123")}
                        disabled={authLoading}
                      >
                        <div className="quick-user-info">
                          <strong>Sarah Perera</strong>
                          <span>sarah@kapruka.com</span>
                        </div>
                        <span className="tier-tag gold">Gold Tier</span>
                      </button>
                      <button 
                        className="quick-user-btn"
                        onClick={() => handleQuickLogin("dilshan@kapruka.com", "password123")}
                        disabled={authLoading}
                      >
                        <div className="quick-user-info">
                          <strong>Dilshan Silva</strong>
                          <span>dilshan@kapruka.com</span>
                        </div>
                        <span className="tier-tag standard">Standard Tier</span>
                      </button>
                    </div>
                  </div>
                )}

                <form onSubmit={handleAuthSubmit} className="form-group-list" style={{ textAlign: "left" }}>
                  {authTab === "register" && (
                    <div className="form-group">
                      <label>Full Name</label>
                      <input 
                        required
                        value={authName}
                        onChange={(e) => setAuthName(e.target.value)}
                        placeholder="e.g. John Jayawardene"
                        disabled={authLoading}
                      />
                    </div>
                  )}

                  <div className="form-group">
                    <label>Email Address</label>
                    <input 
                      required
                      type="email"
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      placeholder="e.g. john@kapruka.com"
                      disabled={authLoading}
                    />
                  </div>

                  <div className="form-group">
                    <label>Password</label>
                    <input 
                      required
                      type="password"
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      placeholder="••••••••"
                      disabled={authLoading}
                    />
                  </div>

                  {authTab === "register" && (
                    <div className="form-group">
                      <label>Desired Membership Tier</label>
                      <select 
                        value={authTier}
                        onChange={(e) => setAuthTier(e.target.value)}
                        disabled={authLoading}
                      >
                        <option value="Standard">Standard Tier</option>
                        <option value="Silver">Silver Tier</option>
                        <option value="Gold">Gold Tier</option>
                        <option value="Diamond">Diamond Tier</option>
                      </select>
                    </div>
                  )}

                  {authError && (
                    <div className="checkout-error-banner" style={{ margin: "10px 0 0 0" }}>
                      <strong>Error</strong>
                      <p>{authError}</p>
                    </div>
                  )}

                  <div style={{ marginTop: "18px" }}>
                    <Button 
                      type="submit" 
                      variant="primary" 
                      className="w-full"
                      loading={authLoading}
                      icon={authTab === "login" ? ShieldCheck : Sparkles}
                    >
                      {authTab === "login" ? "Sign In" : "Register Account"}
                    </Button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;