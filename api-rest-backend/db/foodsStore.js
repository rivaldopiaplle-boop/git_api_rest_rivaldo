const fs = require("fs").promises;
const path = require("path");
const crypto = require("crypto");
const { v4: uuidv4 } = require("uuid");

const DATA_FILE = path.join(__dirname, "..", "data", "foods.json");

let cache = null;

function nowIso() {
  return new Date().toISOString();
}

function generateApiKey() {
  return crypto.randomBytes(24).toString("hex");
}

function stripSecret(food) {
  if (!food) return food;
  const { apiKey, ...publicFood } = food;
  return publicFood;
}

function normalizeFood(input, existing = {}) {
  return {
    id: existing.id || uuidv4(),
    name: input.name.trim(),
    category: input.category.trim(),
    description: input.description || "",
    calories:
      input.calories != null
        ? Number(input.calories)
        : (existing.calories ?? null),
    tags: Array.isArray(input.tags) ? input.tags : existing.tags || [],
    apiKey: existing.apiKey || generateApiKey(),
    createdAt: existing.createdAt || nowIso(),
    updatedAt: nowIso(),
  };
}

async function readRaw() {
  try {
    const txt = await fs.readFile(DATA_FILE, "utf8");
    return JSON.parse(txt || "[]");
  } catch (err) {
    if (err.code === "ENOENT") return [];
    throw err;
  }
}

async function ensureCache() {
  if (cache) return cache;

  const data = await readRaw();
  let dirty = false;

  cache = data.map((item) => {
    if (!item.apiKey) {
      dirty = true;
      return { ...item, apiKey: generateApiKey() };
    }
    return item;
  });

  if (dirty) {
    await save();
  }

  return cache;
}

async function save() {
  if (!cache) {
    cache = [];
  }
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(cache, null, 2), "utf8");
}

async function listFoods({ includeApiKey = false } = {}) {
  const data = await ensureCache();
  return includeApiKey ? data : data.map(stripSecret);
}

async function getFoodById(id, { includeApiKey = false } = {}) {
  const data = await ensureCache();
  const food = data.find((item) => item.id === id);
  if (!food) return null;
  return includeApiKey ? food : stripSecret(food);
}

async function getApiKeyById(id) {
  const data = await ensureCache();
  const food = data.find((item) => item.id === id);
  return food ? food.apiKey : null;
}

async function createFood(input) {
  const data = await ensureCache();
  const food = normalizeFood(input);
  cache = [...data, food];
  await save();
  return food;
}

async function updateFood(id, input) {
  const data = await ensureCache();
  const index = data.findIndex((item) => item.id === id);
  if (index === -1) return null;

  const updated = normalizeFood(input, data[index]);
  updated.id = data[index].id;
  updated.apiKey = data[index].apiKey;
  updated.createdAt = data[index].createdAt;

  cache[index] = updated;
  await save();
  return updated;
}

async function deleteFood(id) {
  const data = await ensureCache();
  const index = data.findIndex((item) => item.id === id);
  if (index === -1) return null;

  const deleted = data[index];
  cache.splice(index, 1);
  await save();
  return deleted;
}

module.exports = {
  listFoods,
  getFoodById,
  getApiKeyById,
  createFood,
  updateFood,
  deleteFood,
};
