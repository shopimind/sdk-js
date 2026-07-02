/**
 * check:openapi — diff du contrat (LOT H · H2).
 *
 * Compare le snapshot `OPENAPI_PATHS` (openapi-snapshot.ts, source de vérité du
 * test de couverture) à un `openapi.json` fraîchement produit côté client_api
 * (cf. nestjs `yarn dump:openapi`) :
 *   - route du snapshot ABSENTE du openapi.json  → ERREUR (exit 1) : le contrat a
 *     rétréci, une route dont dépend potentiellement le SDK a disparu ;
 *   - route NOUVELLE dans openapi.json non présente au snapshot → INFO (exit 0) :
 *     à intégrer éventuellement au snapshot / au SDK.
 *
 * Les routes que le SDK n'émet pas mais qui existent dans le snapshot ne sont
 * PAS un problème ici (le snapshot est un sur-ensemble volontaire de la surface
 * SDK). Ce script vérifie la relation snapshot ↔ contrat réel ; la relation
 * SDK ⊆ snapshot est vérifiée par `openapi-coverage.test.ts`.
 *
 * ─── COMMENT LE LANCER ───────────────────────────────────────────────────────
 *   yarn build && yarn check:openapi ./openapi.json
 *   # chemin via variable d'env :
 *   OPENAPI_JSON=./openapi.json yarn check:openapi
 *   # défaut : ./openapi.json à la racine du repo
 *
 * Le script est compilé par `tsc -b` (type-checké) et exécuté depuis `dist/`.
 */
import { readFileSync } from 'node:fs';
import { resolve, basename } from 'node:path';
import { OPENAPI_PATHS, extractOpenapiPaths } from './openapi-snapshot.js';

export interface OpenapiDiff {
  removed: string[]; // dans le snapshot, absentes du openapi.json
  added: string[]; // dans le openapi.json, absentes du snapshot
}

/** Calcule le diff entre le snapshot SDK et les routes d'un document OpenAPI. */
export function diffOpenapi(doc: unknown): OpenapiDiff {
  const live = extractOpenapiPaths(doc);
  const removed = [...OPENAPI_PATHS].filter((p) => !live.has(p)).sort();
  const added = [...live].filter((p) => !OPENAPI_PATHS.has(p)).sort();
  return { removed, added };
}

/** Résout le chemin du openapi.json (argv[2] > $OPENAPI_JSON > ./openapi.json). */
function resolveSpecPath(): string {
  const fromArg = process.argv[2];
  const fromEnv = process.env.OPENAPI_JSON;
  return resolve(process.cwd(), fromArg ?? fromEnv ?? 'openapi.json');
}

function run(): void {
  const specPath = resolveSpecPath();

  let doc: unknown;
  try {
    doc = JSON.parse(readFileSync(specPath, 'utf8'));
  } catch (err) {
    console.error(
      `[check:openapi] impossible de lire/parser ${specPath} : ${
        (err as Error).message
      }`,
    );
    console.error(
      '[check:openapi] génère-le d\'abord côté client_api : `yarn dump:openapi`.',
    );
    process.exit(2);
  }

  const { removed, added } = diffOpenapi(doc);

  if (added.length > 0) {
    console.log(
      `[check:openapi] INFO — ${added.length} route(s) dans openapi.json absente(s) du snapshot SDK :`,
    );
    for (const r of added) console.log('  + ' + r);
  }

  if (removed.length > 0) {
    console.error(
      `[check:openapi] ERREUR — ${removed.length} route(s) du snapshot SDK ABSENTE(s) du contrat OpenAPI (${specPath}) :`,
    );
    for (const r of removed) console.error('  - ' + r);
    console.error(
      '[check:openapi] le contrat a rétréci. Vérifie que client_api expose ' +
        'toujours ces routes, ou mets à jour OPENAPI_PATHS (et la surface SDK) ' +
        'dans src/openapi-snapshot.ts.',
    );
    process.exit(1);
  }

  console.log(
    `[check:openapi] OK — les ${OPENAPI_PATHS.size} routes du snapshot sont présentes dans le contrat` +
      (added.length > 0 ? ` (+${added.length} nouvelle(s), voir ci-dessus).` : '.'),
  );
}

// Exécution directe (le npm script pointe sur le fichier compilé dist/check-openapi.js).
// Détection d'entrypoint ESM robuste cross-plateforme via le basename de argv[1].
const invoked = process.argv[1] ? basename(process.argv[1]) : '';
if (invoked === 'check-openapi.js' || invoked === 'check-openapi.ts') {
  run();
}
