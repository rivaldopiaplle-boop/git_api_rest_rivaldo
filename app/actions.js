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
  let destination = buildQuery("status", "Plat ajouté.");

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
      destination = buildQuery("error", "Le plat n'a pas pu être ajouté.");
    }
  }

  redirect(destination);
}

export async function updateFoodAction(formData) {
  let destination = buildQuery("status", "Plat modifié.");

  try {
    const payload = extractPayload(formData);
    const updated = await updateFood(payload.id, payload);

    if (!updated) {
      destination = buildQuery("error", "Plat introuvable.");
    }
  } catch (error) {
    if (error instanceof ValidationError) {
      destination = buildQuery(
        "error",
        Object.values(error.details).join(" | "),
      );
    } else {
      destination = buildQuery("error", "Le plat n'a pas pu être modifié.");
    }
  }

  redirect(destination);
}

export async function deleteFoodAction(formData) {
  let destination = buildQuery("status", "Plat supprimé.");

  try {
    const payload = extractPayload(formData);
    const deleted = await deleteFood(payload.id);

    if (!deleted) {
      destination = buildQuery("error", "Plat introuvable.");
    }
  } catch {
    destination = buildQuery("error", "Le plat n'a pas pu être supprimé.");
  }

  redirect(destination);
}
