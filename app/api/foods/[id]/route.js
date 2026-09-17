import { NextResponse } from "next/server";
import { requireApiKey } from "../../../../lib/auth";
import { deleteFood, getFoodById, updateFood } from "../../../../lib/foods";
import { reponseErreur } from "../../../../lib/reponses";

export async function GET(request, { params }) {
  const unauthorizedResponse = requireApiKey(request);

  if (unauthorizedResponse) {
    return unauthorizedResponse;
  }

  try {
    // Next 15 fournit les paramètres de route en promesse.
    const { id } = await params;
    const url = new URL(request.url);
    const includeApiKey = url.searchParams.get("includeApiKey") === "true";
    const item = await getFoodById(id, { includeApiKey });

    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ data: item });
  } catch (erreur) {
    return reponseErreur(erreur);
  }
}

/** PUT remplace la ressource : le corps doit être complet. */
export async function PUT(request, { params }) {
  return enregistrer(request, params, { fusionner: false });
}

/** PATCH ne touche que les champs envoyés : le reste est conservé. */
export async function PATCH(request, { params }) {
  return enregistrer(request, params, { fusionner: true });
}

async function enregistrer(request, params, { fusionner }) {
  const unauthorizedResponse = requireApiKey(request);

  if (unauthorizedResponse) {
    return unauthorizedResponse;
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const updated = await updateFood(id, body, { fusionner });

    if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ data: updated });
  } catch (erreur) {
    return reponseErreur(erreur);
  }
}

export async function DELETE(request, { params }) {
  const unauthorizedResponse = requireApiKey(request);

  if (unauthorizedResponse) {
    return unauthorizedResponse;
  }

  try {
    const { id } = await params;
    const deleted = await deleteFood(id);

    if (!deleted) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ message: "Deleted" });
  } catch (erreur) {
    return reponseErreur(erreur);
  }
}
