"use server";

import { redirect } from "next/navigation";
import {
  ValidationError,
  createFood,
  deleteFood,
  updateFood,
} from "../lib/foods";

function buildQuery(kind, message) {
  const params = new URLSearchParams();
  params.set(kind, message);
  return `/?${params.toString()}`;
}

function extractPayload(formData) {
  return {
    id: String(formData.get("id") || "").trim(),
    name: String(formData.get("name") || "").trim(),
    category: String(formData.get("category") || "").trim(),
    description: String(formData.get("description") || "").trim(),
    calories: String(formData.get("calories") || "").trim(),
    tags: String(formData.get("tags") || "").trim(),
  };
}

export async function createFoodAction(formData) {
  let destination = buildQuery("status", "Food created successfully");

  try {
    const payload = extractPayload(formData);
    await createFood(payload);
  } catch (error) {
    if (error instanceof ValidationError) {
      destination = buildQuery(
        "error",
        Object.values(error.details).join(" | "),
      );
    } else {
      destination = buildQuery("error", "Unable to create food");
    }
  }

  redirect(destination);
}

export async function updateFoodAction(formData) {
  let destination = buildQuery("status", "Food updated successfully");

  try {
    const payload = extractPayload(formData);
    const updated = await updateFood(payload.id, payload);

    if (!updated) {
      destination = buildQuery("error", "Food not found");
    }
  } catch (error) {
    if (error instanceof ValidationError) {
      destination = buildQuery(
        "error",
        Object.values(error.details).join(" | "),
      );
    } else {
      destination = buildQuery("error", "Unable to update food");
    }
  }

  redirect(destination);
}

export async function deleteFoodAction(formData) {
  let destination = buildQuery("status", "Food deleted successfully");

  try {
    const payload = extractPayload(formData);
    const deleted = await deleteFood(payload.id);

    if (!deleted) {
      destination = buildQuery("error", "Food not found");
    }
  } catch {
    destination = buildQuery("error", "Unable to delete food");
  }

  redirect(destination);
}
