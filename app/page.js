import {
  createFoodAction,
  deleteFoodAction,
  suggestFoodAction,
  updateFoodAction,
} from "./actions";
import { listFoods } from "../lib/foods";

// La page lit la base à chaque visite. Sans cette ligne, Next.js la pré-rend
// pendant la construction, donc interroge la base à ce moment-là : chez
// Vercel, où aucune base n'est joignable pendant le build, la construction
// échouait avec « Error occurred prerendering page "/" ».
export const dynamic = "force-dynamic";

function getMessage(searchParams) {
  const success =
    typeof searchParams?.status === "string" ? searchParams.status : "";
  const error =
    typeof searchParams?.error === "string" ? searchParams.error : "";

  if (error) {
    return { kind: "error", text: error };
  }

  if (success) {
    return { kind: "success", text: success };
  }

  return null;
}

function formatTags(tags) {
  if (!Array.isArray(tags) || tags.length === 0) {
    return "Aucune étiquette";
  }

  return tags.join(", ");
}

export default async function Home({ searchParams }) {
  const foods = await listFoods({ includeApiKey: true });
  const message = getMessage(searchParams);
  const totalFoods = foods.length;
  const totalCalories = foods.reduce(
    (sum, food) => sum + (Number.isFinite(food.calories) ? food.calories : 0),
    0,
  );
  const tagCount = new Set(foods.flatMap((food) => food.tags || [])).size;

  return (
    <main className="shell">
      <section className="hero">
        <div>
          <p className="eyebrow">Next.js + Prisma + PostgreSQL</p>
          <h1 className="title">
            Une API protégée par clé, et son administration.
          </h1>
          <p className="lead">
            Une seule application : les routes de l'API d'un côté, cette
            administration de l'autre, Prisma et PostgreSQL en dessous.
            L'administration passe par des actions serveur, l'API garde son
            contrat par clé.
          </p>
          <nav className="liens" aria-label="À propos de ce projet">
            <a
              className="lien principal"
              href="https://github.com/rivaldopiaplle-boop/git_api_rest_rivaldo"
              target="_blank"
              rel="noreferrer"
            >
              Voir le code sur GitHub
            </a>
            <a
              className="lien"
              href="https://git-portfolio-rivaldo.vercel.app"
              target="_blank"
              rel="noreferrer"
            >
              Portfolio de Rivaldo Piaplle
            </a>
          </nav>
        </div>

        <div className="stats">
          <div className="stat">
            <strong>{totalFoods}</strong>
            <span>plats en base PostgreSQL</span>
          </div>
          <div className="stat">
            <strong>{totalCalories}</strong>
            <span>calories au total</span>
          </div>
          <div className="stat">
            <strong>{tagCount}</strong>
            <span>étiquettes différentes</span>
          </div>
        </div>
      </section>

      {message ? (
        <div className={`banner ${message.kind}`}>{message.text}</div>
      ) : null}

      <section className="grid">
        <div className="colonne">
          <article className="panel">
            <div className="panel-inner">
              <div className="panel-header">
                <h2 className="panel-title">Assistant de recettes</h2>
              </div>
              <p className="field-title">
                Des ingrédients, et Mistral AI propose un plat. Sa réponse passe
                par la même validation qu'une saisie à la main avant d'entrer en
                base.
              </p>
              <form action={suggestFoodAction} className="form-grid">
                <div className="field">
                  <label htmlFor="ingredients">Ingrédients</label>
                  <input
                    id="ingredients"
                    name="ingredients"
                    placeholder="riz, poulet, poivrons, citron vert"
                    required
                    maxLength={300}
                  />
                </div>
                <div className="actions">
                  <button type="submit">Proposer et ajouter</button>
                  <span className="field-title">
                    Une dizaine de secondes au plus.
                  </span>
                </div>
              </form>
            </div>
          </article>

          <article className="panel">
            <div className="panel-inner">
              <div className="panel-header">
                <h2 className="panel-title">Ajouter un plat</h2>
              </div>

              <form action={createFoodAction} className="form-grid">
                <div className="field">
                  <label htmlFor="name">Nom</label>
                  <input
                    id="name"
                    name="name"
                    placeholder="Légumes rôtis"
                    required
                    maxLength={200}
                  />
                </div>

                <div className="field">
                  <label htmlFor="category">Catégorie</label>
                  <input
                    id="category"
                    name="category"
                    placeholder="Plat principal"
                    required
                  />
                </div>

                <div className="field">
                  <label htmlFor="description">Description</label>
                  <textarea
                    id="description"
                    name="description"
                    placeholder="Description courte"
                    maxLength={1000}
                  />
                </div>

                <div className="field">
                  <label htmlFor="calories">Calories</label>
                  <input
                    id="calories"
                    name="calories"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="320"
                  />
                </div>

                <div className="field">
                  <label htmlFor="tags">Tags</label>
                  <input
                    id="tags"
                    name="tags"
                    placeholder="warm, healthy, quick"
                  />
                </div>

                <div className="actions">
                  <button type="submit">Ajouter</button>
                  <span className="field-title">
                    Les étiquettes se séparent par des virgules.
                  </span>
                </div>
              </form>
            </div>
          </article>
        </div>

        <section className="panel">
          <div className="panel-inner">
            <div className="panel-header">
              <h2 className="panel-title">Plats enregistrés</h2>
              <span className="field-title">
                L'API garde son contrat : en-tête x-api-key exigé.
              </span>
            </div>

            <div className="foods">
              {foods.length === 0 ? (
                <div className="food-card">
                  <strong>Aucun plat pour l'instant.</strong>
                  <p className="lead">
                    Create the first one on the left to bootstrap the seed.
                  </p>
                </div>
              ) : null}

              {foods.map((food) => (
                <article className="food-card" key={food.id}>
                  <div className="food-top">
                    <div>
                      <h3 className="food-name">{food.name}</h3>
                      <div className="pill-row">
                        <span className="pill">{food.category}</span>
                        <span className="pill">{food.calories ?? 0} kcal</span>
                        <span className="pill">{formatTags(food.tags)}</span>
                      </div>
                    </div>
                    <span className="pill">clé conservée</span>
                  </div>

                  <div className="meta">
                    <div>
                      <strong>Description :</strong>{" "}
                      {food.description || "Aucune description"}
                    </div>
                    <div>
                      <strong>Clé d'API :</strong> {food.apiKey}
                    </div>
                    <div>
                      <strong>Modifié le :</strong>{" "}
                      {new Date(food.updatedAt).toLocaleString("fr-FR")}
                    </div>
                  </div>

                  <details className="edit-box">
                    <summary className="field-title">Modifier ce plat</summary>

                    <form
                      action={updateFoodAction}
                      className="form-grid"
                      style={{ marginTop: 16 }}
                    >
                      <input type="hidden" name="id" value={food.id} />

                      <div className="field">
                        <label htmlFor={`name-${food.id}`}>Nom</label>
                        <input
                          id={`name-${food.id}`}
                          name="name"
                          defaultValue={food.name}
                          required
                          maxLength={200}
                        />
                      </div>

                      <div className="field">
                        <label htmlFor={`category-${food.id}`}>Catégorie</label>
                        <input
                          id={`category-${food.id}`}
                          name="category"
                          defaultValue={food.category}
                          required
                        />
                      </div>

                      <div className="field">
                        <label htmlFor={`description-${food.id}`}>
                          Description
                        </label>
                        <textarea
                          id={`description-${food.id}`}
                          name="description"
                          defaultValue={food.description || ""}
                          maxLength={1000}
                        />
                      </div>

                      <div className="field">
                        <label htmlFor={`calories-${food.id}`}>Calories</label>
                        <input
                          id={`calories-${food.id}`}
                          name="calories"
                          type="number"
                          min="0"
                          step="1"
                          defaultValue={food.calories ?? ""}
                        />
                      </div>

                      <div className="field">
                        <label htmlFor={`tags-${food.id}`}>Tags</label>
                        <input
                          id={`tags-${food.id}`}
                          name="tags"
                          defaultValue={
                            Array.isArray(food.tags) ? food.tags.join(", ") : ""
                          }
                        />
                      </div>

                      <div className="actions">
                        <button type="submit">Enregistrer</button>
                        <button
                          type="submit"
                          formAction={deleteFoodAction}
                          className="danger"
                        >
                          Delete
                        </button>
                      </div>
                    </form>
                  </details>
                </article>
              ))}
            </div>
          </div>
        </section>
      </section>
      <footer className="pied">
        <p>
          Projet de démonstration :{" "}
          <a
            href="https://github.com/rivaldopiaplle-boop/git_api_rest_rivaldo"
            target="_blank"
            rel="noreferrer"
          >
            le code sur GitHub
          </a>{" "}
          ·{" "}
          <a
            href="https://git-portfolio-rivaldo.vercel.app"
            target="_blank"
            rel="noreferrer"
          >
            le portfolio de Rivaldo Piaplle
          </a>
        </p>
      </footer>
    </main>
  );
}
