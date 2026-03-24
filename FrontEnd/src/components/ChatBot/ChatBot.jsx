import { useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { CartContext } from "../../context/CartContext";
import { ChatProvider, useChatContext } from "../../context/ChatContext";
import ChatWindow from "./ChatWindow";
import "./ChatBot.css";

// Fetch all products matching a query — returns array sorted by score
async function findProductsByQuery(query) {
  try {
    const token = localStorage.getItem("token");
    const res = await fetch("/api/products", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    const products = data.data || data.products || data || [];
    const q = query.toLowerCase();
    const scored = products
      .map((p) => {
        const text =
          `${p.name} ${p.variety || ""} ${p.category || ""}`.toLowerCase();
        const score = q
          .split(" ")
          .filter((w) => w.length > 1 && text.includes(w)).length;
        return { product: p, score };
      })
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score);
    return scored.map((s) => s.product);
  } catch (e) {
    return [];
  }
}

// Inner component — has access to all contexts
const ChatFAB = () => {
  const {
    isOpen,
    toggleChat,
    unreadCount,
    setCartAction,
    handleCartVoiceAction,
  } = useChatContext();
  const { addToCart, cartItems, removeFromCart } = useContext(CartContext);
  const navigate = useNavigate();

  // Drag functionality
  const handleDragStart = (e) => {
    // Only drag with left mouse button
    if (e.button !== 0) return;

    const fab = e.currentTarget;
    fab.classList.add("dragging");

    const shiftX = e.clientX - fab.getBoundingClientRect().left;
    const shiftY = e.clientY - fab.getBoundingClientRect().top;

    const moveAt = (clientX, clientY) => {
      let newLeft = clientX - shiftX;
      let newTop = clientY - shiftY;

      // Keep within viewport bounds
      const maxX = window.innerWidth - 70;
      const maxY = window.innerHeight - 70;

      newLeft = Math.max(10, Math.min(newLeft, maxX - 10));
      newTop = Math.max(10, Math.min(newTop, maxY - 10));

      fab.style.left = newLeft + "px";
      fab.style.top = newTop + "px";
      fab.style.right = "auto";
      fab.style.bottom = "auto";
    };

    const onMouseMove = (e) => {
      moveAt(e.clientX, e.clientY);
    };

    document.addEventListener("mousemove", onMouseMove);

    const onMouseUp = () => {
      document.removeEventListener("mousemove", onMouseMove);
      fab.classList.remove("dragging");

      // Save position to localStorage
      const rect = fab.getBoundingClientRect();
      localStorage.setItem(
        "chatbotPosition",
        JSON.stringify({
          left: rect.left,
          top: rect.top,
        }),
      );
    };

    document.addEventListener("mouseup", onMouseUp, { once: true });
    fab.ondragstart = () => false;
  };

  useEffect(() => {
    // Restore saved position
    const savedPosition = localStorage.getItem("chatbotPosition");
    if (savedPosition) {
      try {
        const { left, top } = JSON.parse(savedPosition);
        const fab = document.querySelector(".chatbot-fab");
        if (fab) {
          fab.style.left = left + "px";
          fab.style.top = top + "px";
          fab.style.right = "auto";
          fab.style.bottom = "auto";
        }
      } catch (e) {
        console.error("Error restoring chatbot position:", e);
      }
    }
  }, []);

  useEffect(() => {
    const handleCart = async ({
      action,
      productQuery,
      quantity,
      product: resolvedProduct,
    }) => {
      // Direct add with already-resolved product (from clarification button click)
      if (action === "addResolved") {
        for (let i = 0; i < quantity; i++) addToCart(resolvedProduct);
        return `✅ Added **${quantity}x ${resolvedProduct.name}** to your cart! 🛒`;
      }

      // Add to cart
      if (action === "add") {
        const matches = await findProductsByQuery(productQuery);

        if (matches.length === 0) {
          return `❌ Sorry, I couldn't find **"${productQuery}"** in our store.`;
        }

        // Check if multiple different products match — ask user to pick
        if (matches.length > 1) {
          const isAmbiguous = matches
            .slice(0, 5)
            .some(
              (p) =>
                p.name.toLowerCase() !== matches[0].name.toLowerCase() ||
                (p.variety && p.variety !== matches[0].variety),
            );

          if (isAmbiguous) {
            return {
              type: "clarify",
              message: `I found multiple **${productQuery}** products. Which one would you like to add?`,
              products: matches.slice(0, 5),
              quantity,
            };
          }
        }

        // Single clear match — add directly
        const product = matches[0];
        for (let i = 0; i < quantity; i++) addToCart(product);
        return `✅ Added **${quantity}x ${product.name}** to your cart! 🛒`;
      }

      // Remove from cart
      if (action === "remove") {
        if (!productQuery) return "❌ Please specify which product to remove.";
        const item = cartItems.find((i) =>
          i.name.toLowerCase().includes(productQuery.toLowerCase()),
        );
        if (!item) return `❌ **"${productQuery}"** is not in your cart.`;
        removeFromCart(item._id);
        return `✅ Removed **${item.name}** from your cart.`;
      }

      return "❌ Sorry, I could not complete that cart action.";
    };

    setCartAction(handleCart);
  }, [addToCart, removeFromCart, cartItems, setCartAction]);

  return (
    <>
      <ChatWindow onNavigate={navigate} onCartAction={handleCartVoiceAction} />
      <button
        className={`chatbot-fab ${isOpen ? "chatbot-fab--open" : ""}`}
        onClick={toggleChat}
        onMouseDown={handleDragStart}
        aria-label="Open Dairy Assistant"
        title="Chat with Dairy Assistant (Drag to move)"
      >
        <div className="fab-ring"></div>
        <div className="fab-ring-2"></div>
        {isOpen ? (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="fab-icon fab-icon-close"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        ) : (
          <>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="fab-icon fab-icon-bot"
            >
              {/* Bot head - modern rounded square */}
              <rect x="4" y="4" width="16" height="14" rx="4" ry="4" />
              {/* Bot eyes - digital style */}
              <path d="M8 9h2" />
              <path d="M14 9h2" />
              <circle cx="9" cy="9" r="1" fill="currentColor" />
              <circle cx="15" cy="9" r="1" fill="currentColor" />
              {/* Bot mouth - subtle smile */}
              <path d="M9 13c1.5 1 4.5 1 6 0" />
              {/* Headphones */}
              <path d="M4 10H2v4a2 2 0 0 0 2 2h1" />
              <path d="M20 10h2v4a2 2 0 0 1-2 2h-1" />
              {/* Antenna */}
              <line x1="12" y1="4" x2="12" y2="2" />
              <circle cx="12" cy="1.5" r="1" fill="currentColor" />
            </svg>
            <div className="fab-wave"></div>
          </>
        )}
        {!isOpen && unreadCount > 0 && (
          <span className="chatbot-fab-badge">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>
    </>
  );
};

const ChatBot = () => {
  const { user } = useContext(AuthContext);
  if (!user) return null;
  return (
    <ChatProvider>
      <ChatFAB />
    </ChatProvider>
  );
};

export default ChatBot;
