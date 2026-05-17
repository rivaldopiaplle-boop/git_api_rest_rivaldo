const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();

const apiKey = require("./middlewares/apiKey");
const foodsRouter = require("./routers/foods");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// simple health
app.get("/", (req, res) =>
  res.json({ status: "ok", env: process.env.NODE_ENV || "development" }),
);

// protect api with apiKey middleware
app.use("/api", apiKey);

app.use("/api/foods", foodsRouter);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal Server Error" });
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

module.exports = app;
