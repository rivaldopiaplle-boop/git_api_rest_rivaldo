import {
  createFoodAction,
  deleteFoodAction,
  updateFoodAction,
} from "./actions";
import { listFoods } from "../lib/foods";

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
    return "No tags";
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
          <h1 className="title">Food admin with a clean Prisma singleton.</h1>
          <p className="lead">
            One app, one database, one route layer. The admin uses server
            actions directly on Prisma, while the API stays protected for REST
            Client tests.
          </p>
        </div>

        <div className="stats">
          <div className="stat">
            <strong>{totalFoods}</strong>
            <span>Foods stored in PostgreSQL</span>
          </div>
          <div className="stat">
            <strong>{totalCalories}</strong>
            <span>Total calories across records</span>
          </div>
          <div className="stat">
            <strong>{tagCount}</strong>
            <span>Distinct tags in the catalog</span>
          </div>
        </div>
      </section>

      {message ? (
        <div className={`banner ${message.kind}`}>{message.text}</div>
      ) : null}

      <section className="grid">
        <article className="panel">
          <div className="panel-inner">
            <div className="panel-header">
              <h2 className="panel-title">Create a food</h2>
            </div>

            <form action={createFoodAction} className="form-grid">
              <div className="field">
                <label htmlFor="name">Name</label>
                <input
                  id="name"
                  name="name"
                  placeholder="Roasted vegetables"
                  required
                  maxLength={200}
                />
              </div>

              <div className="field">
                <label htmlFor="category">Category</label>
                <input
                  id="category"
                  name="category"
                  placeholder="Dinner"
                  required
                />
              </div>

              <div className="field">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  placeholder="Short description"
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
                <button type="submit">Create food</button>
                <span className="field-title">Tags are comma separated.</span>
              </div>
            </form>
          </div>
        </article>

        <section className="panel">
          <div className="panel-inner">
            <div className="panel-header">
              <h2 className="panel-title">Stored foods</h2>
              <span className="field-title">
                Protected API keeps the same x-api-key contract.
              </span>
            </div>

            <div className="foods">
              {foods.length === 0 ? (
                <div className="food-card">
                  <strong>No foods yet.</strong>
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
                    <span className="pill">API key kept</span>
                  </div>

                  <div className="meta">
                    <div>
                      <strong>Description:</strong>{" "}
                      {food.description || "No description"}
                    </div>
                    <div>
                      <strong>API key:</strong> {food.apiKey}
                    </div>
                    <div>
                      <strong>Updated:</strong>{" "}
                      {new Date(food.updatedAt).toLocaleString("fr-FR")}
                    </div>
                  </div>

                  <details className="edit-box">
                    <summary className="field-title">Edit this food</summary>

                    <form
                      action={updateFoodAction}
                      className="form-grid"
                      style={{ marginTop: 16 }}
                    >
                      <input type="hidden" name="id" value={food.id} />

                      <div className="field">
                        <label htmlFor={`name-${food.id}`}>Name</label>
                        <input
                          id={`name-${food.id}`}
                          name="name"
                          defaultValue={food.name}
                          required
                          maxLength={200}
                        />
                      </div>

                      <div className="field">
                        <label htmlFor={`category-${food.id}`}>Category</label>
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
                        <button type="submit">Save changes</button>
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
    </main>
  );
}
