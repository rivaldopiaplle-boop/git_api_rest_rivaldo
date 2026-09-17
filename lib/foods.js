import crypto from "node:crypto";
import prisma from "./prisma";

const MAX_NAME_LENGTH = 200;
const MAX_DESCRIPTION_LENGTH = 1000;
const MAX_TAG_LENGTH = 50;

export class ValidationError extends Error {
  constructor(details) {
    super("Validation error");
    this.name = "ValidationError";
    this.status = 400;
    this.details = details;
  }
}

function toTrimmedString(value) {
  if (value == null) return "";
  return String(value).trim();
}

function parseTags(value) {
  if (value == null || value === "") return [];

  const items = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(",")
      : [value];

  return items
    .map((item) => toTrimmedString(item))
    .filter(Boolean)
    .map((item) => item.slice(0, MAX_TAG_LENGTH));
}

function parseCalories(value) {
  if (value == null || value === "") return null;

  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 0 || !Number.isInteger(parsed)) {
    return { error: "Calories must be a non-negative integer" };
  }

  return { value: parsed };
}

export function sanitizeFood(food, { includeApiKey = false } = {}) {
  if (!food) return food;

  if (includeApiKey) {
    return food;
  }

  const { apiKey, ...publicFood } = food;
  return publicFood;
}

export function normalizeFoodInput(input) {
  const errors = {};

  if (!input || typeof input !== "object") {
    return {
      errors: { body: "Body must be an object" },
      data: null,
    };
  }

  const name = toTrimmedString(input.name);
  const category = toTrimmedString(input.category);
  const description = toTrimmedString(input.description);
  const tags = parseTags(input.tags);
  const caloriesResult = parseCalories(input.calories);

  if (!name) {
    errors.name = "Name is required";
  } else if (name.length > MAX_NAME_LENGTH) {
    errors.name = "Name too long";
  }

  if (!category) {
    errors.category = "Category is required";
  }

  if (description.length > MAX_DESCRIPTION_LENGTH) {
    errors.description = "Description too long";
  }

  if (caloriesResult?.error) {
    errors.calories = caloriesResult.error;
  }

  if (
    input.tags != null &&
    !Array.isArray(input.tags) &&
    typeof input.tags !== "string"
  ) {
    errors.tags = "Tags must be an array of strings";
  } else if (Array.isArray(input.tags)) {
    const invalidTag = input.tags.find(
      (tag) =>
        typeof tag !== "string" ||
        !tag.trim() ||
        tag.trim().length > MAX_TAG_LENGTH,
    );

    if (invalidTag !== undefined) {
      errors.tags = "Each tag must be 1-50 characters";
    }
  }

  if (typeof input.tags === "string" && input.tags.length > 0) {
    const invalidTag = input.tags
      .split(",")
      .map((tag) => tag.trim())
      .find((tag) => !tag || tag.length > MAX_TAG_LENGTH);

    if (invalidTag !== undefined) {
      errors.tags = "Each tag must be 1-50 characters";
    }
  }

  if (Object.keys(errors).length > 0) {
    return { errors, data: null };
  }

  return {
    errors: null,
    data: {
      name,
      category,
      description,
      calories: caloriesResult?.value ?? null,
      tags,
    },
  };
}

function raiseValidationError(errors) {
  throw new ValidationError(errors);
}

export async function listFoods({ includeApiKey = false } = {}) {
  const foods = await prisma.food.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  return foods.map((food) => sanitizeFood(food, { includeApiKey }));
}

export async function getFoodById(id, { includeApiKey = false } = {}) {
  const food = await prisma.food.findUnique({ where: { id } });
  return sanitizeFood(food, { includeApiKey });
}

export async function createFood(input) {
  const normalized = normalizeFoodInput(input);

  if (normalized.errors) {
    raiseValidationError(normalized.errors);
  }

  return prisma.food.create({
    data: {
      ...normalized.data,
      apiKey: crypto.randomBytes(24).toString("hex"),
    },
  });
}

/**
 * `fusionner` distingue les deux verbes : PUT remplace la ressource et exige un
 * corps complet, PATCH ne touche que les champs envoyés. Sans cette option, une
 * modification partielle échouait sur la validation des champs absents.
 */
export async function updateFood(id, input, { fusionner = false } = {}) {
  const existing = await prisma.food.findUnique({ where: { id } });

  if (!existing) {
    return null;
  }

  const aNormaliser = fusionner
    ? {
        name: existing.name,
        category: existing.category,
        description: existing.description,
        calories: existing.calories,
        tags: existing.tags,
        ...input,
      }
    : input;

  const normalized = normalizeFoodInput(aNormaliser);

  if (normalized.errors) {
    raiseValidationError(normalized.errors);
  }

  return prisma.food.update({
    where: { id },
    data: normalized.data,
  });
}

export async function deleteFood(id) {
  const existing = await prisma.food.findUnique({ where: { id } });

  if (!existing) {
    return null;
  }

  await prisma.food.delete({ where: { id } });
  return existing;
}
