import React, { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { dark } from "react-syntax-highlighter/dist/esm/styles/prism";
import "./index.css";
import { toast } from "react-toastify";

function ChatApp({
  onSignOut,
  user,
  showMenu,
  setShowMenu,
  menuRef,
  onShowLogin,
}) {
  const [messages, setMessages] = useState([
    {
      sender: "ai",
      text: "Hello! I'm your food recommendation assistant. How can I help you today?",
    },
  ]);

  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [selectedMenuItems, setSelectedMenuItems] = useState({});
  const [lastMenu, setLastMenu] = useState(null);
  const messageEndRef = useRef(null);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [showOrderHistory, setShowOrderHistory] = useState(false);
  const [showModifyOrder, setShowModifyOrder] = useState(false);
  const [orderHistory, setOrderHistory] = useState([]);
  const [expandedOrderIdx, setExpandedOrderIdx] = useState(null);
  const [orderSearch, setOrderSearch] = useState("");
  const [orderFilter, setOrderFilter] = useState("all");
  const [modalOrder, setModalOrder] = useState(null);

  // Helper to filter orders by date
  const filterOrdersByDate = (orders, filter) => {
    const now = new Date();
    if (filter === "today") {
      return orders.filter((o) => {
        const d = new Date(o.createdAt);
        return d.toDateString() === now.toDateString();
      });
    } else if (filter === "7days") {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return orders.filter((o) => new Date(o.createdAt) >= weekAgo);
    } else if (filter === "month") {
      return orders.filter(
        (o) =>
          new Date(o.createdAt).getMonth() === now.getMonth() &&
          new Date(o.createdAt).getFullYear() === now.getFullYear()
      );
    }
    return orders;
  };

  // Helper to filter orders by search
  const filterOrdersBySearch = (orders, search) => {
    if (!search.trim()) return orders;
    const s = search.trim().toLowerCase();
    return orders.filter((order) =>
      order.items.some((item) => item.name.toLowerCase().includes(s))
    );
  };

  // Helper to highlight search matches
  const highlight = (text, search) => {
    if (!search) return text;
    const regex = new RegExp(`(${search})`, "gi");
    return text.split(regex).map((part, i) =>
      regex.test(part) ? (
        <mark key={i} style={{ background: "#fef08a", padding: 0 }}>
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  // Filtered and searched orders
  const filteredOrders = filterOrdersBySearch(
    filterOrdersByDate(orderHistory, orderFilter),
    orderSearch
  );

  const scrollToBottom = () => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Find the last AI message that is a menu
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].sender === "ai") {
        const menu = tryParseMenu(messages[i].text);
        if (menu) {
          setLastMenu(menu);
          return;
        }
      }
    }
    setLastMenu(null);
    // eslint-disable-next-line
  }, [messages]);

  // Fetch current order on load if user is logged in
  useEffect(() => {
    const fetchCurrentOrder = async () => {
      if (!user || !user.id) {
        setCurrentOrder(null);
        return;
      }
      try {
        const token = localStorage.getItem("khanpan_jwt");
        const res = await fetch(
          `${process.env.REACT_APP_API_URL}/api/orders/current/${user.id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (res.ok) {
          const data = await res.json();
          setCurrentOrder(data.order);
        } else {
          setCurrentOrder(null);
        }
      } catch {
        setCurrentOrder(null);
      }
    };
    fetchCurrentOrder();
  }, [user]);

  // Fetch order history when modal is opened
  useEffect(() => {
    const fetchOrderHistory = async () => {
      if (!user || !showOrderHistory) return;
      try {
        const token = localStorage.getItem("khanpan_jwt");
        const res = await fetch(
          `${process.env.REACT_APP_API_URL}/api/orders/${user.id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (res.ok) {
          const data = await res.json();
          setOrderHistory(data.orders || []);
        } else {
          setOrderHistory([]);
        }
      } catch {
        setOrderHistory([]);
      }
    };
    fetchOrderHistory();
  }, [user, showOrderHistory]);

  // When currentOrder changes, pre-fill selectedMenuItems with its quantities
  useEffect(() => {
    if (currentOrder && lastMenu) {
      const newSelected = {};
      currentOrder.items.forEach((item) => {
        const menuItem = lastMenu.find((m) => m.name === item.name);
        if (menuItem) newSelected[menuItem.index] = item.quantity;
      });
      setSelectedMenuItems(newSelected);
    }
  }, [currentOrder, lastMenu]);

  const handleQuickReply = (text) => {
    setMessages((prev) => [...prev, { sender: "user", text }]);
    setInput("");
    setTimeout(() => handleSubmitQuick(text), 0);
  };

  // Separate handler to mimic handleSubmit for quick replies
  const handleSubmitQuick = async (quickText) => {
    setIsTyping(true);
    try {
      const conversationHistory = messages
        .map((msg) => ({
          role: msg.sender === "user" ? "user" : "assistant",
          content: msg.text,
        }))
        .concat([{ role: "user", content: quickText }]);

      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/food-recommendation`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: quickText,
            history: conversationHistory,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const data = await response.json();
      setMessages((prev) => [
        ...prev,
        { sender: "ai", text: data.text, isGenerating: false },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: "Sorry, there was an error processing your request",
          isGenerating: false,
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { sender: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    // Include latest message in history
    const conversationHistory = [...messages, userMessage].map((msg) => ({
      role: msg.sender === "user" ? "user" : "assistant",
      content: msg.text,
    }));

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/food-recommendation`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: input,
            history: conversationHistory,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      setMessages((prev) => [
        ...prev,
        { sender: "ai", text: data.text, isGenerating: false },
      ]);
    } catch (error) {
      console.error("Error:", error);
      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: "Sorry, there was an error processing your request",
          isGenerating: false,
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const MarkdownComponent = ({ code, inline, className, children, props }) => {
    const match = /language-(?<lang>.*)/.exec(className || "");
    return !inline && match ? (
      <SyntaxHighlighter
        style={dark}
        language={match.groups.lang}
        PreTag="div"
        {...props}
      >
        {String(children).replace(/\n$/, "")}
      </SyntaxHighlighter>
    ) : (
      <code>{children}</code>
    );
  };

  // Helper to detect if a string is a JSON array (menu)
  const tryParseMenu = (text) => {
    try {
      // Try direct parse
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed) && parsed[0]?.name && parsed[0]?.price) {
        return parsed;
      }
    } catch (e) {
      // Try to extract JSON array from text
      const match = text.match(/\[.*\]/s);
      if (match) {
        try {
          const parsed = JSON.parse(match[0]);
          if (Array.isArray(parsed) && parsed[0]?.name && parsed[0]?.price) {
            return parsed;
          }
        } catch {}
      }
    }
    return null;
  };

  // Helper to detect if an AI message contains dish recommendations (numbered list)
  const isRecommendationList = (text) => {
    // Looks for lines like '1. Dish Name:'
    return /\d+\.\s+\w+/.test(text);
  };

  // Handle menu item quantity
  const handleQuantityChange = (index, delta) => {
    setSelectedMenuItems((prev) => {
      const next = { ...prev };
      next[index] = Math.max(0, (next[index] || 0) + delta);
      // Remove if 0
      if (next[index] === 0) delete next[index];
      return { ...next };
    });
  };

  // Update quick reply options
  const quickReplies = [
    "List Menu",
    "Vegan",
    "Vegetarian",
    "Non Veg",
    "Low Cholesterol",
    "Budget Friendly",
  ];

  // Handle order submission
  const handleOrder = async () => {
    if (!user) {
      toast.info("Login to place an order");
      if (onShowLogin) onShowLogin();
      return;
    }
    if (!lastMenu || Object.keys(selectedMenuItems).length === 0) return;
    const orderedItems = lastMenu
      .filter((item) => selectedMenuItems[item.index] > 0)
      .map((item) => ({
        name: item.name,
        price: Number(item.price),
        quantity: selectedMenuItems[item.index],
      }));
    const subtotal = orderedItems.reduce(
      (sum, item) => sum + Number(item.price) * (item.quantity || 1),
      0
    );
    const tax = +(subtotal * 0.05).toFixed(2); // 5% GST
    const total = +(subtotal + tax).toFixed(2);

    // Send order to backend
    try {
      const token = localStorage.getItem("khanpan_jwt");
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: user._id || user.id, // support both _id and id
          items: orderedItems,
          total,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Order failed");
      }
      toast.success("Order placed!");
      fetchCurrentOrder(user.id);
    } catch (err) {
      toast.error(err.message || "Order failed");
    }

    const orderText = `I would like to order: ${orderedItems
      .map((item) => item.name)
      .join(", ")}`;
    const confirmation = `Order placed for: ${orderedItems
      .map((item) => item.name)
      .join(", ")}
Subtotal: $${subtotal}
Tax (5%): $${tax}
Total: $${total}`;
    setMessages((prev) => [
      ...prev,
      { sender: "user", text: orderText },
      { sender: "ai", text: confirmation },
    ]);
    setSelectedMenuItems({});
    setLastMenu(null);
    setTimeout(() => handleSubmitQuick(orderText), 0);
  };

  // Add handlers for modifying and saving order
  const handleModifyQuantity = (idx, delta) => {
    setCurrentOrder((prev) => {
      if (!prev) return prev;
      const items = prev.items.map((item, i) =>
        i === idx
          ? { ...item, quantity: Math.max(1, item.quantity + delta) }
          : item
      );
      return { ...prev, items };
    });
  };

  const handleSaveModifiedOrder = async () => {
    if (!currentOrder) return;
    try {
      const token = localStorage.getItem("khanpan_jwt");
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: user.id,
          items: currentOrder.items,
          total: currentOrder.items.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0
          ),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Order update failed");
      }
      toast.success("Order updated!");
      setShowModifyOrder(false);
    } catch (err) {
      toast.error(err.message || "Order update failed");
    }
  };

  // Add cancel order handler
  const handleCancelOrder = async () => {
    if (!currentOrder) return;
    if (!window.confirm("Are you sure you want to cancel this order?")) return;
    try {
      const token = localStorage.getItem("khanpan_jwt");
      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/api/order/${currentOrder._id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to cancel order");
      }
      toast.success("Order cancelled.");
      setCurrentOrder(null);
      setSelectedMenuItems({});
      setShowModifyOrder(false);
      setMessages((prev) => [
        ...prev,
        { from: "bot", text: "Your order has been deleted." },
      ]);
    } catch (err) {
      toast.error(err.message || "Failed to cancel order");
    }
  };

  // Fetch current order for a user
  const fetchCurrentOrder = async (userId) => {
    if (!userId) {
      setCurrentOrder(null);
      return;
    }
    try {
      const token = localStorage.getItem("khanpan_jwt");
      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/api/orders/current/${userId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.ok) {
        const data = await res.json();
        setCurrentOrder(data.order);
      } else {
        setCurrentOrder(null);
      }
    } catch {
      setCurrentOrder(null);
    }
  };

  // Add handler for modifying menu quantity in modal
  const handleModifyMenuQuantity = (name, delta) => {
    setModalOrder((prev) => {
      if (!prev) return prev;
      const items = [...prev.items];
      const idx = items.findIndex((it) => it.name === name);
      if (idx >= 0) {
        const newQty = Math.max(0, items[idx].quantity + delta);
        if (newQty === 0) {
          items.splice(idx, 1);
        } else {
          items[idx] = { ...items[idx], quantity: newQty };
        }
      } else if (delta > 0 && lastMenu) {
        const menuItem = lastMenu.find((it) => it.name === name);
        if (menuItem)
          items.push({
            name: menuItem.name,
            price: Number(menuItem.price),
            quantity: 1,
          });
      }
      return { ...prev, items };
    });
  };

  // When opening the modal, clone currentOrder
  const handleOpenModifyOrder = () => {
    setModalOrder(
      currentOrder ? JSON.parse(JSON.stringify(currentOrder)) : null
    );
    setShowModifyOrder(true);
  };

  // On save, send modalOrder to backend and update currentOrder
  const handleSaveModifiedMenuOrder = async () => {
    if (!modalOrder) return;
    // Only keep items with quantity > 0
    const items = modalOrder.items.filter((item) => item.quantity > 0);
    try {
      const token = localStorage.getItem("khanpan_jwt");
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: user.id,
          items,
          total: items.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0
          ),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Order update failed");
      }
      toast.success("Order updated!");
      setShowModifyOrder(false);
      setCurrentOrder({ ...modalOrder, items });
      setMessages((prev) => [
        ...prev,
        { from: "bot", text: "Your order has been modified." },
      ]);
    } catch (err) {
      toast.error(err.message || "Order update failed");
    }
  };

  // Compute order total for selected items
  const selectedOrderTotal =
    lastMenu && Object.keys(selectedMenuItems).length > 0
      ? lastMenu
          .filter((item) => selectedMenuItems[item.index] > 0)
          .reduce(
            (sum, item) => sum + item.price * selectedMenuItems[item.index],
            0
          )
      : 0;

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <style jsx global>{`
        .typing-animation {
          animation: typing 1.5s infinite;
        }

        @keyframes typing {
          0% {
            opacity: 0.3;
          }
          50% {
            opacity: 1;
          }
          100% {
            opacity: 0.3;
          }
        }
      `}</style>
      <header className="bg-blue-600 text-white p-4 flex items-center justify-between flex-wrap">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          {/* Hamburger menu */}
          {user && (
            <button
              className="hamburger-btn"
              style={{
                background: "transparent",
                border: "none",
                outline: "none",
                cursor: "pointer",
                marginRight: 12,
              }}
              onClick={() => setShowMenu((v) => !v)}
              aria-label="Menu"
            >
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
          )}
          <h1 className="text-2xl font-bold w-full sm:w-auto text-center">
            Food Recommendation Assistant
          </h1>
        </div>
        <div className="flex items-center gap-4 w-full sm:w-auto justify-center sm:justify-end mt-2 sm:mt-0">
          {user ? (
            <>
              <span className="text-sm hidden sm:inline-block">
                Welcome, {user.name ? user.name.split(" ")[0] : user.email}
              </span>
              {/* Sign Out button removed from here */}
            </>
          ) : (
            <button
              onClick={onShowLogin}
              className="w-full sm:w-auto block px-3 py-1 bg-white text-blue-600 sm:rounded rounded-none hover:bg-blue-100 text-sm font-semibold shadow mt-2 sm:mt-0"
            >
              Log In
            </button>
          )}
        </div>
      </header>
      {/* Hamburger dropdown menu */}
      {user && showMenu && (
        <div className="sidebar-menu" ref={menuRef}>
          <div className="sidebar-menu-content flex flex-col gap-2">
            {currentOrder && currentOrder.status === "In progress" && (
              <>
                <button
                  className="sidebar-menu-item"
                  onClick={handleOpenModifyOrder}
                >
                  Modify Current Order
                </button>
                <button
                  className="sidebar-menu-item"
                  onClick={handleCancelOrder}
                >
                  Cancel Current Order
                </button>
              </>
            )}
            <button
              className="sidebar-menu-item"
              onClick={() => setShowOrderHistory(true)}
            >
              Order History
            </button>
            <button
              className="sidebar-menu-item text-red-600 hover:bg-red-100"
              onClick={() => {
                if (onSignOut) onSignOut();
              }}
            >
              Sign Out
            </button>
          </div>
        </div>
      )}

      {/* Modify Current Order Modal */}
      {showModifyOrder && currentOrder && lastMenu && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h2 className="text-xl font-bold mb-2">Modify Current Order</h2>
            <div className="mb-2 text-lg font-semibold">
              Total: $
              {modalOrder
                ? modalOrder.items.reduce(
                    (sum, item) => sum + item.price * item.quantity,
                    0
                  )
                : 0}
            </div>
            <ul className="mb-4 modal-menu-list">
              {lastMenu.map((item, idx) => {
                const orderItem = modalOrder
                  ? modalOrder.items.find((it) => it.name === item.name)
                  : null;
                const qty = orderItem ? orderItem.quantity : 0;
                return (
                  <li key={idx} className="flex items-center gap-2 mb-2">
                    <button
                      className="px-2 py-1 bg-gray-200 rounded text-lg font-bold"
                      onClick={() => handleModifyMenuQuantity(item.name, -1)}
                      disabled={qty <= 0}
                    >
                      −
                    </button>
                    <span
                      style={{
                        minWidth: 24,
                        display: "inline-block",
                        textAlign: "center",
                      }}
                    >
                      {qty}
                    </span>
                    <button
                      className="px-2 py-1 bg-gray-200 rounded text-lg font-bold"
                      onClick={() => handleModifyMenuQuantity(item.name, 1)}
                    >
                      +
                    </button>
                    <span className="item-pill">{item.name}</span>
                    <span className="text-gray-500">(${item.price})</span>
                  </li>
                );
              })}
            </ul>
            <div className="flex gap-2 justify-end">
              <button
                className="px-3 py-1 bg-gray-300 rounded"
                onClick={() => setShowModifyOrder(false)}
              >
                Cancel
              </button>
              <button
                className="px-3 py-1 bg-blue-600 text-white rounded"
                onClick={handleSaveModifiedMenuOrder}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order History Modal */}
      {showOrderHistory && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: 520, width: "100%" }}>
            <h2 className="text-xl font-bold mb-2">Order History</h2>
            <div className="flex gap-2 mb-2 items-center">
              <input
                type="text"
                className="border rounded px-2 py-1 flex-1"
                placeholder="Search by item name..."
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
              />
              <select
                className="border rounded px-2 py-1"
                value={orderFilter}
                onChange={(e) => setOrderFilter(e.target.value)}
              >
                <option value="all">All</option>
                <option value="today">Today</option>
                <option value="7days">Last 7 days</option>
                <option value="month">This Month</option>
              </select>
            </div>
            <div className="mb-2 text-gray-600 text-sm">
              {filteredOrders.length} order
              {filteredOrders.length !== 1 ? "s" : ""} found
            </div>
            {filteredOrders.length === 0 ? (
              <div className="text-gray-500">No orders found.</div>
            ) : (
              <ul className="mb-4 order-history-list">
                {filteredOrders.map((order, idx) => (
                  <li key={order._id || idx} className="mb-2 border-b pb-2">
                    <button
                      className="w-full text-left flex justify-between items-center font-semibold hover:bg-gray-100 rounded px-2 py-1"
                      onClick={() =>
                        setExpandedOrderIdx(
                          idx === expandedOrderIdx ? null : idx
                        )
                      }
                    >
                      <span>
                        {new Date(order.createdAt).toLocaleString()} &mdash; $
                        {order.total}
                      </span>
                      <span>{expandedOrderIdx === idx ? "▲" : "▼"}</span>
                    </button>
                    {expandedOrderIdx === idx && (
                      <ul className="pl-4 mt-2">
                        {order.items.map((item, i) => (
                          <li
                            key={i}
                            className="flex justify-between mb-1 items-center"
                          >
                            <span className="item-pill">
                              {highlight(item.name, orderSearch)} x
                              {item.quantity}
                            </span>
                            <span>${item.price * item.quantity}</span>
                          </li>
                        ))}
                        <li className="flex justify-between mt-2 pt-2 border-t font-semibold">
                          <span>Order Total:</span>
                          <span>${order.total}</span>
                        </li>
                        <li className="flex justify-between mt-2 pt-2 border-t font-semibold">
                          <span>Status:</span>
                          <span
                            className="ml-2 px-2 py-1 rounded text-xs font-semibold"
                            style={{
                              background:
                                order.status === "Delivered"
                                  ? "#d1fae5"
                                  : "#fef08a",
                              color:
                                order.status === "Delivered"
                                  ? "#065f46"
                                  : "#92400e",
                            }}
                          >
                            {order.status}
                          </span>
                        </li>
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            )}
            <div className="flex gap-2 justify-end">
              <button
                className="px-3 py-1 bg-gray-300 rounded"
                onClick={() => setShowOrderHistory(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick replies */}
      <div className="mt-2 flex gap-2 flex-wrap px-2 sm:px-4">
        {quickReplies.map((reply) => (
          <button
            key={reply}
            className="px-3 py-1 bg-blue-200 text-blue-800 rounded hover:bg-blue-300 mb-2"
            onClick={() => handleQuickReply(reply)}
          >
            {reply}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((message, index) => {
          // Try to parse menu JSON for AI messages
          let menu = null;
          let showOrderButton = false;
          if (message.sender === "ai") {
            menu = tryParseMenu(message.text);
            // If not a menu, but looks like a recommendation list, show order button
            if (!menu && isRecommendationList(message.text)) {
              showOrderButton = true;
            }
          }
          return (
            <div
              key={index}
              className={`mb-4 ${
                message.sender === "user" ? "text-right" : "text-left"
              }`}
            >
              <div
                className={`inline-block p-2 rounded-lg ${
                  message.sender === "user"
                    ? "bg-blue-500 text-white"
                    : "ai-message"
                }`}
              >
                {message.sender === "user" ? (
                  message.text
                ) : menu ? (
                  <div>
                    <div className="mb-2 font-semibold">Menu:</div>
                    <ul className="mb-2">
                      {menu.map((item) => (
                        <li
                          key={item.index}
                          className="flex items-center gap-2 mb-1"
                        >
                          <button
                            className="px-2 py-1 bg-gray-200 rounded text-lg font-bold"
                            onClick={() => handleQuantityChange(item.index, -1)}
                            disabled={!selectedMenuItems[item.index]}
                            style={{ minWidth: 28 }}
                          >
                            −
                          </button>
                          <span
                            style={{
                              minWidth: 24,
                              display: "inline-block",
                              textAlign: "center",
                            }}
                          >
                            {selectedMenuItems[item.index] || 0}
                          </span>
                          <button
                            className="px-2 py-1 bg-gray-200 rounded text-lg font-bold"
                            onClick={() => handleQuantityChange(item.index, 1)}
                            style={{ minWidth: 28 }}
                          >
                            +
                          </button>
                          <span>
                            {item.index}) <b>{item.name}</b>: {item.description}{" "}
                            (${item.price})
                          </span>
                        </li>
                      ))}
                    </ul>
                    {currentOrder && currentOrder.status === "In progress" ? (
                      <div className="flex gap-2">
                        <button
                          className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                          onClick={handleOpenModifyOrder}
                        >
                          Modify Order
                        </button>
                        <button
                          className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                          onClick={handleCancelOrder}
                        >
                          Cancel Order
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                          onClick={handleOrder}
                          disabled={
                            Object.keys(selectedMenuItems).length === 0 ||
                            selectedOrderTotal === 0 ||
                            (currentOrder &&
                              currentOrder.status === "In progress")
                          }
                        >
                          Place Order
                        </button>
                        {currentOrder &&
                          currentOrder.status === "In progress" && (
                            <div className="text-red-500 text-sm mt-1">
                              You have an order in progress. Please wait for it
                              to be delivered before placing a new order.
                            </div>
                          )}
                      </>
                    )}
                  </div>
                ) : (
                  <>
                    <ReactMarkdown components={MarkdownComponent}>
                      {message.text || "Thinking..."}
                    </ReactMarkdown>
                    {/* Show Place an Order button if this is a recommendation list */}
                    {showOrderButton && (
                      <div className="mt-2">
                        <button
                          className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                          onClick={() => handleQuickReply("List Menu")}
                        >
                          Place an Order
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}

        {isTyping && (
          <div className="text-left">
            <div className="inline-block p-2 rounded-lg bg-gray-300">
              Typing...
            </div>
          </div>
        )}
        <div ref={messageEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-4 bg-white">
        <div className="flex items-center">
          <input
            type="text"
            className="flex-1 p-2 border rounded-l-lg focus:outline-none"
            value={input}
            placeholder="Ask about food recommendations..."
            onChange={(e) => setInput(e.target.value)}
          />
          <button className="p-2 bg-blue-500 text-white rounded-r-lg hover:bg-blue-600 focus:outline-none">
            <Send size={24} />
          </button>
        </div>
      </form>
      <style>{`
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(24,28,40,0.25);
  z-index: 3000;
  display: flex;
  align-items: center;
  justify-content: center;
}
.modal-card {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(24,28,40,0.18);
  padding: 2rem 1.5rem 1.5rem 1.5rem;
  min-width: 320px;
  max-width: 95vw;
  animation: scaleIn 0.33s cubic-bezier(.4,2,.6,1) both;
}
.modal-menu-list {
  max-height: 320px;
  overflow-y: auto;
}
.order-history-list {
  max-height: 320px;
  overflow-y: auto;
}
.item-pill {
  display: inline-block;
  background: linear-gradient(90deg, #e0e7ff 0%, #f0fdfa 100%);
  color: #3730a3;
  font-weight: 500;
  border-radius: 999px;
  padding: 2px 14px;
  margin-right: 6px;
  font-size: 15px;
  letter-spacing: 0.01em;
}
`}</style>
    </div>
  );
}

export default ChatApp;
