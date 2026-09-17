import { NextResponse } from "next/server";
import { ValidationError } from "./foods";

/**
 * Traduit une erreur en réponse HTTP.
 *
 * La validation existait déjà dans lib/foods.js, mais son erreur traversait les
 * routes sans être attrapée : le client recevait un 500 muet au lieu d'un 400
 * qui dit ce qui n'allait pas. Une erreur inattendue reste un 500, sans détail :
 * un message interne n'a rien à faire chez le client.
 */
export function reponseErreur(erreur) {
  if (erreur instanceof ValidationError) {
    return NextResponse.json({ error: "Validation error", details: erreur.details }, { status: 400 });
  }

  if (erreur instanceof SyntaxError) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  console.error("Erreur non prévue :", erreur);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
