import { NextResponse } from "next/server";
import { requireApiKey } from "../../../lib/auth";
import { createFood, listFoods } from "../../../lib/foods";
import { reponseErreur } from "../../../lib/reponses";

export async function GET(request) {
  const unauthorizedResponse = requireApiKey(request);

  if (unauthorizedResponse) {
    return unauthorizedResponse;
  }

  try {
    const url = new URL(request.url);
    const includeApiKey = url.searchParams.get("includeApiKey") === "true";
    const data = await listFoods({ includeApiKey });

    return NextResponse.json({ data });
  } catch (erreur) {
    return reponseErreur(erreur);
  }
}

export async function POST(request) {
  const unauthorizedResponse = requireApiKey(request);

  if (unauthorizedResponse) {
    return unauthorizedResponse;
  }

  try {
    const body = await request.json();
    const item = await createFood(body);

    return NextResponse.json({ data: item, apiKey: item.apiKey }, { status: 201 });
  } catch (erreur) {
    return reponseErreur(erreur);
  }
}
