const service = require("./model.service");
const Order = require("./order.model");

const getFoodRecommendation = async (req, res) => {
  try {
    const { text = "Hi", history = [] } = req.body;

    const parsedHistory = Array.isArray(history)
      ? history
      : (() => {
          try {
            return JSON.parse(history);
          } catch (err) {
            console.warn("Invalid history format, using empty:", err);
            return [];
          }
        })();

    const cleanedText = text.trim();
    console.log(" User Request:", cleanedText);
    console.log(" History:", parsedHistory);

    const foodRecommendation = await service.getFoodRecommendation({
      userRequest: cleanedText,
      history: parsedHistory,
    });

    res.set({
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });

    return res.status(200).json({ text: foodRecommendation });
  } catch (error) {
    console.error(" Controller error:", error);

    res.set({
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });

    return res.status(500).json({ text: "Server error. Please try again." });
  }
};

// Create order
async function createOrder(req, res) {
  try {
    const { userId, items, total } = req.body;
    if (!userId || !Array.isArray(items) || typeof total !== "number") {
      return res
        .status(400)
        .json({ message: "Missing required order fields." });
    }
    const order = await Order.create({
      user: userId,
      items,
      total,
      status: "In progress",
    });
    res.status(201).json({ message: "Order placed successfully", order });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error placing order", error: err.message });
  }
}

// Get all orders for a user
async function getUserOrders(req, res) {
  try {
    const userId = req.params.userId;
    if (!userId) return res.status(400).json({ message: "Missing userId" });
    const orders = await Order.find({ user: userId }).sort({ createdAt: -1 });
    res.json({ orders });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching orders", error: err.message });
  }
}

// Get current order (within 3 hours)
async function getCurrentOrder(req, res) {
  try {
    const userId = req.params.userId;
    if (!userId) return res.status(400).json({ message: "Missing userId" });
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);
    const order = await Order.findOne({
      user: userId,
      createdAt: { $gte: threeHoursAgo },
    }).sort({ createdAt: -1 });
    res.json({ order });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching current order", error: err.message });
  }
}

// Delete order by ID
async function deleteOrder(req, res) {
  try {
    const orderId = req.params.orderId;
    if (!orderId) return res.status(400).json({ message: "Missing orderId" });
    await Order.findByIdAndDelete(orderId);
    res.json({ message: "Order deleted" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error deleting order", error: err.message });
  }
}

// Add a controller to update order status to 'Delivered'
async function markOrderDelivered(req, res) {
  try {
    const { orderId } = req.params;
    const order = await Order.findByIdAndUpdate(
      orderId,
      { status: "Delivered" },
      { new: true }
    );
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json({ message: "Order marked as Delivered", order });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error updating order status", error: err.message });
  }
}

module.exports = {
  getFoodRecommendation,
  createOrder,
  getUserOrders,
  getCurrentOrder,
  deleteOrder,
  markOrderDelivered,
};
