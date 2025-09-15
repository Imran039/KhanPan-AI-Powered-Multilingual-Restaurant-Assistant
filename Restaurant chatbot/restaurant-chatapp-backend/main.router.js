const {
  getFoodRecommendation,
  createOrder,
  getUserOrders,
  getCurrentOrder,
  deleteOrder,
  markOrderDelivered,
} = require("./model/model.controller");

const router = require("express").Router();

router.post("/food-recommendation", getFoodRecommendation);
router.post("/order", createOrder);
router.get("/orders/:userId", getUserOrders);
router.get("/orders/current/:userId", getCurrentOrder);
router.delete("/order/:orderId", deleteOrder);
router.patch("/api/order/:orderId/deliver", markOrderDelivered);

module.exports = router;
