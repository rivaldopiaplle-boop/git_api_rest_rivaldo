const express = require("express");
const store = require("../db/foodsStore");

function validateFood(body) {
  const errors = {};
  if (!body || typeof body !== "object") {
    errors.body = "Body must be an object";
    return errors;
  }
  if (!body.name || typeof body.name !== "string" || !body.name.trim()) {
    errors.name = "Name is required";
  } else if (body.name.length > 200) {
    errors.name = "Name too long";
  }
  if (
    !body.category ||
    typeof body.category !== "string" ||
    !body.category.trim()
  ) {
    errors.category = "Category is required";
  }
  if (body.description && body.description.length > 1000) {
    errors.description = "Description too long";
  }
  if (body.calories != null) {
    const c = Number(body.calories);
    if (!Number.isFinite(c) || c < 0)
      errors.calories = "Calories must be a non-negative number";
  }
  if (body.tags) {
    if (!Array.isArray(body.tags))
      errors.tags = "Tags must be an array of strings";
    else if (
      body.tags.some((t) => typeof t !== "string" || !t.trim() || t.length > 50)
    )
      errors.tags = "Each tag must be 1-50 chars";
  }
  return errors;
}

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const includeApiKey =
      String(req.query.includeApiKey || "").toLowerCase() === "true";
    const data = await store.listFoods({ includeApiKey });
    res.json({ data });
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const errors = validateFood(req.body);
    if (Object.keys(errors).length)
      return res
        .status(400)
        .json({ error: "Validation error", details: errors });
    const item = await store.createFood(req.body);
    res.status(201).json({ data: item, apiKey: item.apiKey });
  } catch (err) {
    next(err);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const id = req.params.id;
    const errors = validateFood(req.body);
    if (Object.keys(errors).length)
      return res
        .status(400)
        .json({ error: "Validation error", details: errors });
    const updated = await store.updateFood(id, req.body);
    if (!updated) return res.status(404).json({ error: "Not found" });
    res.json({ data: updated });
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const id = req.params.id;
    const deleted = await store.deleteFood(id);
    if (!deleted) return res.status(404).json({ error: "Not found" });
    res.json({ message: "Deleted" });
  } catch (err) {
    next(err);
  }
});

router.get("/:id/api-key", async (req, res, next) => {
  try {
    const apiKey = await store.getApiKeyById(req.params.id);
    if (!apiKey) return res.status(404).json({ error: "Not found" });
    res.json({ id: req.params.id, apiKey });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
