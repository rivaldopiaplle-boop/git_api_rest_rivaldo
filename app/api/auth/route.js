import { NextResponse } from "next/server";
import { requireApiKey } from "../../../lib/auth";

export async function GET(request) {
  const unauthorizedResponse = requireApiKey(request);

  if (unauthorizedResponse) {
    return unauthorizedResponse;
  }

  return NextResponse.json({
    status: "ok",
    message: "API key accepted",
  });
}
