const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const fileUpload = require("express-fileupload");
const routes = require("./main.router");
require("dotenv").config();

const mongoose = require("mongoose");
const authRouter = require("./model/auth.controller");

// Prefer .env, fallback to local MongoDB
const mongoUri =
  process.env.MONGODB_URI || "mongodb://localhost:27017/restaurant";

mongoose
  .connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log(`MongoDB connected! Using URI: ${mongoUri}`))
  .catch((err) => console.error("MongoDB connection error:", err));

const app = express();

app.use(fileUpload());
app.use(bodyParser.json());

// Allow all origins for dev; restrict in production as needed
app.use(cors());
// For production, restrict to your frontend domain:
// app.use(cors({ origin: "https://your-frontend-domain.com" }));

app.use(express.urlencoded({ extended: false }));

app.options("*", (req, res) => {
  res.set({
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  res.sendStatus(200);
});

app.get("/", (req, res) => {
  return res.status(200).send({
    message: "Use route /api/food-recommendation with POST method",
  });
});

app.use("/api", routes);
app.use("/api/auth", authRouter);

app.get("/version", (req, res) =>
  res.status(200).send(require("./package.json").version)
);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`API available at http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/`);
});

module.exports = app;
