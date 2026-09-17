/**
 * Lancer l'API en une commande.
 *
 *   node demarrer.mjs
 *
 * Il monte la base PostgreSQL dans Docker, applique les migrations, amorce le jeu
 * de démonstration, construit l'application, la démarre et attend qu'elle
 * réponde. Le serveur reste au premier plan : Ctrl+C l'arrête.
 *
 *   node demarrer.mjs --tests     démarre, joue les tests d'API en HTTP, s'arrête
 *   node demarrer.mjs --arreter   arrête la base et supprime ses données
 */
import { spawn, spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const options = process.argv.slice(2);
const veutTests = options.includes("--tests");
const veutArreter = options.includes("--arreter");
const ADRESSE = "http://localhost:3000";

/** Les valeurs de travail vivent dans .env, qui n'est pas suivi par Git. */
function environnement() {
  if (!existsSync(".env")) {
    writeFileSync(".env", readFileSync(".env.example", "utf8"));
    console.log("  .env créé depuis .env.example");
  }

  const variables = {};
  for (const ligne of readFileSync(".env", "utf8").split("\n")) {
    const propre = ligne.trim();
    if (!propre || propre.startsWith("#")) continue;
    const coupure = propre.indexOf("=");
    if (coupure < 0) continue;
    variables[propre.slice(0, coupure).trim()] = propre
      .slice(coupure + 1)
      .trim()
      .replace(/^"|"$/g, "");
  }

  for (const attendue of ["API_KEY", "DATABASE_URL", "DIRECT_URL"]) {
    if (!variables[attendue]) {
      console.error(`  .env ne contient pas ${attendue}. Voir .env.example.`);
      process.exit(1);
    }
  }
  return variables;
}

/**
 * Sur Windows, npm et npx sont des fichiers .cmd, que Node refuse de lancer
 * sans shell depuis sa version 20. Ailleurs, pas de shell : les arguments
 * restent des arguments.
 */
function avecShell(commande) {
  return process.platform === "win32" && (commande === "npm" || commande === "npx");
}

function etape(commande, arguments_, variables) {
  const resultat = spawnSync(commande, arguments_, {
    stdio: "inherit",
    shell: avecShell(commande),
    env: { ...process.env, ...variables },
  });
  if (resultat.error) console.error(`  ${commande} n'a pas pu être lancé : ${resultat.error.code}`);
  return resultat.status === 0;
}

async function attendreApi() {
  for (let essai = 0; essai < 90; essai += 1) {
    try {
      const reponse = await fetch(`${ADRESSE}/api/health`, { signal: AbortSignal.timeout(3000) });
      const sante = await reponse.json();
      if (sante.database === "connected") return true;
    } catch {
      // L'application démarre encore.
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  return false;
}

console.log("\n  API REST : Next.js, Prisma, PostgreSQL\n");
const variables = environnement();

if (veutArreter) {
  etape("docker", ["compose", "down", "-v"], variables);
  console.log("\n  Base arrêtée, données supprimées.\n");
  process.exit(0);
}

console.log("-- Base de données");
if (!etape("docker", ["compose", "up", "-d", "--wait"], variables)) {
  console.error("\n  La base n'a pas démarré. Docker Desktop est-il ouvert ?\n");
  process.exit(1);
}

console.log();
console.log("-- Client Prisma, migrations et jeu de démonstration");
if (
  // Le client Prisma est un paquet généré : après une réinstallation, il faut le refaire.
  !etape("npx", ["prisma", "generate"], variables) ||
  !etape("npx", ["prisma", "migrate", "deploy"], variables) ||
  !etape("npx", ["prisma", "db", "seed"], variables)
) {
  console.error("\n  Les migrations ou l'amorçage ont échoué.\n");
  process.exit(1);
}

console.log("\n-- Construction");
if (!etape("npm", ["run", "build"], variables)) {
  console.error("\n  La construction a échoué.\n");
  process.exit(1);
}

console.log("\n-- Démarrage");
const serveur = spawn("npm", ["run", "start"], {
  stdio: veutTests ? "ignore" : "inherit",
  shell: avecShell("npm"),
  env: { ...process.env, ...variables },
});

if (!(await attendreApi())) {
  console.error("\n  L'application n'a pas répondu en 90 secondes.\n");
  serveur.kill();
  process.exit(1);
}
console.log(`  OK  L'application répond sur ${ADRESSE}`);

if (veutTests) {
  console.log("\n-- Tests de l'API");
  const reussi = etape("node", ["--test", "tests/**/*.test.mjs"], { ...variables, BASE_URL: ADRESSE });
  serveur.kill();
  console.log(reussi ? "\n  Tests passés.\n" : "\n  Tests en échec.\n");
  process.exit(reussi ? 0 : 1);
}

console.log("\n  Administration : " + ADRESSE);
console.log("  API : " + ADRESSE + "/api/foods, avec l'en-tête x-api-key");
console.log("  Tests : node demarrer.mjs --tests");
console.log("  Arrêt de la base : node demarrer.mjs --arreter");
console.log("\n  Ctrl+C pour arrêter le serveur.\n");
