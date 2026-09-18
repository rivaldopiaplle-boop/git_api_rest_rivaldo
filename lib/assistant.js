import { ValidationError, normalizeFoodInput } from "./foods";

const MAX_INGREDIENTS_LENGTH = 300;
// Le plus petit modèle suffit pour un plat, et c'est celui que l'offre gratuite
// laisse passer : mistral-small y répond « Rate limit exceeded » dès le premier appel.
const MODELE = process.env.MISTRAL_MODELE?.trim() || "ministral-8b-latest";

/** L'assistant n'est pas configuré, ou Mistral n'a pas répondu : l'API reste utilisable sans lui. */
export class AssistantIndisponible extends Error {
  constructor(message) {
    super(message);
    this.name = "AssistantIndisponible";
  }
}

const CONSIGNE = `Tu es un assistant culinaire. À partir des ingrédients donnés, propose UN plat réaliste.
Réponds uniquement par un objet JSON, en français, avec exactement ces champs :
{"name": "nom du plat", "category": "Entrée | Plat principal | Dessert | Accompagnement | Boisson",
 "description": "deux phrases au plus : ce qu'est le plat et comment le préparer",
 "calories": nombre entier estimé par portion, "tags": ["trois étiquettes courtes"]}`;

/**
 * Propose un plat à partir d'une liste d'ingrédients.
 *
 * La réponse du modèle passe par la même validation qu'un plat saisi à la main :
 * un modèle de langage peut renvoyer un champ manquant ou des calories négatives,
 * et rien de ce qu'il produit n'entre en base sans avoir été vérifié.
 */
export async function suggererPlat(ingredients) {
  const texte = String(ingredients ?? "").trim();

  if (!texte) {
    throw new ValidationError({ ingredients: "Ingredients are required" });
  }
  if (texte.length > MAX_INGREDIENTS_LENGTH) {
    throw new ValidationError({ ingredients: "Ingredients too long" });
  }

  const cle = process.env.MISTRAL_API_KEY?.trim();
  if (!cle) {
    throw new AssistantIndisponible("MISTRAL_API_KEY is not configured");
  }

  let reponse;
  try {
    reponse = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${cle}` },
      body: JSON.stringify({
        model: MODELE,
        temperature: 0.4,
        max_tokens: 300,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: CONSIGNE },
          { role: "user", content: `Ingrédients : ${texte}` },
        ],
      }),
      signal: AbortSignal.timeout(20000),
    });
  } catch {
    throw new AssistantIndisponible("Mistral did not answer");
  }

  if (!reponse.ok) {
    throw new AssistantIndisponible(`Mistral answered ${reponse.status}`);
  }

  let proposition;
  try {
    const corps = await reponse.json();
    proposition = JSON.parse(corps.choices[0].message.content);
  } catch {
    throw new AssistantIndisponible("Mistral answer is not valid JSON");
  }

  const { errors, data } = normalizeFoodInput(proposition);
  if (errors) {
    throw new AssistantIndisponible("Mistral answer is not a valid dish");
  }

  return { ...data, tags: [...new Set([...data.tags, "assistant"])] };
}
