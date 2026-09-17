/**
 * Les tests parlent à l'application démarrée, en HTTP, comme le fera son client.
 *
 *   BASE_URL=http://localhost:3000 API_KEY=... node --test tests/
 *
 * Ils vérifient ce qui compte pour une API : la clé exigée, la validation
 * refusée côté serveur, et le cycle complet d'une ressource.
 */
import assert from "node:assert/strict";
import test, { after, before } from "node:test";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const CLE = process.env.API_KEY;
const creees = [];

function entetes(avecCle = true) {
  return {
    "Content-Type": "application/json",
    ...(avecCle ? { "x-api-key": CLE } : {}),
  };
}

before(() => {
  assert.ok(CLE, "API_KEY doit être posée pour interroger l'API");
});

after(async () => {
  // Les tests ne laissent rien derrière eux dans la base.
  for (const id of creees) {
    await fetch(`${BASE}/api/foods/${id}`, { method: "DELETE", headers: entetes() });
  }
});

test("la sonde de santé interroge la base", async () => {
  const reponse = await fetch(`${BASE}/api/health`);
  assert.equal(reponse.status, 200);
  const sante = await reponse.json();
  assert.equal(sante.status, "ok");
  assert.equal(sante.database, "connected");
});

test("sans clé, la liste est refusée", async () => {
  const reponse = await fetch(`${BASE}/api/foods`, { headers: entetes(false) });
  assert.equal(reponse.status, 401);
});

test("avec une mauvaise clé, la liste est refusée", async () => {
  const reponse = await fetch(`${BASE}/api/foods`, {
    headers: { "Content-Type": "application/json", "x-api-key": "mauvaise-cle" },
  });
  assert.equal(reponse.status, 401);
});

test("avec la clé, la liste répond et le jeu de démonstration est là", async () => {
  const reponse = await fetch(`${BASE}/api/foods`, { headers: entetes() });
  assert.equal(reponse.status, 200);
  const { data } = await reponse.json();
  assert.ok(Array.isArray(data));
  assert.ok(data.length > 0, "la base amorcée ne doit pas être vide");
});

test("un nom vide est refusé par le serveur", async () => {
  const reponse = await fetch(`${BASE}/api/foods`, {
    method: "POST",
    headers: entetes(),
    body: JSON.stringify({ name: "   ", category: "test" }),
  });
  assert.equal(reponse.status, 400);
});

test("le cycle complet d'une ressource : créer, lire, modifier, supprimer", async () => {
  const nom = `Plat de test ${Date.now()}`;

  const creation = await fetch(`${BASE}/api/foods`, {
    method: "POST",
    headers: entetes(),
    body: JSON.stringify({ name: nom, category: "tests", calories: 120, tags: "ci, integration" }),
  });
  assert.equal(creation.status, 201);
  const { data: cree } = await creation.json();
  creees.push(cree.id);
  assert.equal(cree.name, nom);
  assert.deepEqual(cree.tags, ["ci", "integration"]);

  const lecture = await fetch(`${BASE}/api/foods/${cree.id}`, { headers: entetes() });
  assert.equal(lecture.status, 200);
  const { data: lu } = await lecture.json();
  assert.equal(lu.id, cree.id);

  const modification = await fetch(`${BASE}/api/foods/${cree.id}`, {
    method: "PATCH",
    headers: entetes(),
    body: JSON.stringify({ calories: 240 }),
  });
  assert.equal(modification.status, 200);
  const { data: modifie } = await modification.json();
  assert.equal(modifie.calories, 240);

  const suppression = await fetch(`${BASE}/api/foods/${cree.id}`, { method: "DELETE", headers: entetes() });
  assert.ok([200, 204].includes(suppression.status), `suppression : ${suppression.status}`);
  creees.pop();

  const apres = await fetch(`${BASE}/api/foods/${cree.id}`, { headers: entetes() });
  assert.equal(apres.status, 404);
});

test("une ressource inconnue répond 404", async () => {
  const reponse = await fetch(`${BASE}/api/foods/00000000-0000-0000-0000-000000000000`, { headers: entetes() });
  assert.equal(reponse.status, 404);
});
