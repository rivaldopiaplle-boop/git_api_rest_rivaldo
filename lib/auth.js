import { NextResponse } from "next/server";

export function requireApiKey(request) {
  const expectedKey = process.env.API_KEY?.trim();

  if (!expectedKey) {
    return NextResponse.json(
      { error: "API_KEY is not configured" },
      { status: 500 },
    );
  }

  const providedKey = request.headers.get("x-api-key")?.trim();

  if (!providedKey || providedKey !== expectedKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}
