import { NextResponse } from "next/server";
import { requireApiKey } from "../../../../lib/auth";
import { AssistantIndisponible, suggererPlat } from "../../../../lib/assistant";
import { reponseErreur } from "../../../../lib/reponses";

/**
 * POST /api/foods/suggestion { "ingredients": "tomates, riz, poulet" }
 *
 * Propose un plat sans l'enregistrer : le client décide ensuite de le créer
 * par POST /api/foods. Protégé par la clé, comme le reste de l'API, pour que
 * personne ne consomme le quota Mistral à la place du propriétaire.
 */
export async function POST(request) {
  const unauthorizedResponse = requireApiKey(request);

  if (unauthorizedResponse) {
    return unauthorizedResponse;
  }

  try {
    const body = await request.json();
    const data = await suggererPlat(body?.ingredients);

    return NextResponse.json({ data });
  } catch (erreur) {
    if (erreur instanceof AssistantIndisponible) {
      console.error("Assistant indisponible :", erreur.message);
      return NextResponse.json({ error: "Assistant unavailable" }, { status: 503 });
    }
    return reponseErreur(erreur);
  }
}
