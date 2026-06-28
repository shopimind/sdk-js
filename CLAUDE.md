# CLAUDE.md — @shopimind/sdk-js

Guide de développement pour les équipes ShopiMind et les assistants IA travaillant sur ce dépôt.
Versionné dans git, **non publié sur npm** (`package.json` → `"files": ["dist"]`).

## Finalité
`@shopimind/sdk-js` est le **SDK JavaScript/TypeScript officiel de l'API ShopiMind** : un client bas-niveau,
typé, qui reflète fidèlement `client_api`. C'est **la brique unique que tout le monde consomme** — kit
d'intégration, connecteurs, et tout développeur tiers bâtissant son intégration. Le SDK ne porte aucune
logique métier : il fabrique un client HTTP sécurisé, expose les ressources de l'API et fournit les
primitives de sécurité des communications.

## Sens de la dépendance (à ne jamais inverser)
`client_api` (OpenAPI `/api-json`) ← **SDK** ← consommateurs (kit, connecteurs, …).
Le SDK ne référence **jamais** un consommateur ; il ne cible que des routes exposées par l'OpenAPI de
`client_api`, restreint au sous-ensemble choisi.
Garde-fou : `src/openapi-coverage.test.ts` (lancé par `yarn test`) épingle chaque endpoint émis par le SDK
contre un snapshot de `/api-json` et échoue si une route n'y existe pas. L'`ALLOWLIST` ne sert qu'à couvrir
temporairement une route réellement servie mais pas encore documentée dans l'OpenAPI.

## Architecture (src/)
- `core/` — le moteur : `client` (fabrique + transport durci), `retry`, `envelope`, `methods` (pipeline +
  chunking), `exception` / `api-error` (erreurs), `request-validator` / `webhook-signature` (sécurité).
- `helpers/` — `SpmHelpers` : `chunk`, `mergeResponses`, `extractCounts`, `isRetryable`, `formatError`, `unwrapOrThrow`.
- `types/` — contrat de types (enveloppe, options, entités). Utilisés par le core, les helpers et les ressources.
- `resources/` — une classe `SpmXxx` par ressource ; délègue entièrement au pipeline du core.

## Invariants à préserver (= le contrat public)
- **Enveloppe `{ ok, statusCode, data, error }` — le SDK ne `throw` JAMAIS** sur échec HTTP (encodé dans
  `ok` / `error`). Seul `SpmHelpers.unwrapOrThrow` lève (`SpmApiError`), en mode opt-in.
- **Double-nesting** : la charge métier des lectures est à `res.data.data` (l'API enveloppe `{ statusCode, data }`).
  Les réponses bulk portent les compteurs au top-level (`sent_count`, …), pas sous `data`.
- **Dépendance runtime unique : `axios`.** Rien d'autre.
- **Surface publique = 28 exports nommés stables** (`SpmClient, SpmClientException, SpmApiError,
  SpmRequestValidator, SpmWebhookSignature, SpmHelpers` + 22 ressources). Tout changement = bump semver.
- **Méthodes ressources STATIQUES** : `SpmXxx.method(client, …)` (1er argument = le client de `getClient`).
- **Deux primitives de sécurité, une par canal** :
  - `SpmRequestValidator` — canal **connecteur** : corps « imploded » trié au 1er niveau + HMAC-SHA256 +
    comparaison md5 à temps constant. Utilisé par les connecteurs CMS.
  - `SpmWebhookSignature` — canal **intégration** : HMAC `${ts}.${body}` horodaté + anti-rejeu + timing-safe.
- `{ chunk: true }` → enveloppe *chunked* agrégée (`sent_count` / `rejected_count` / `failed_count` / `chunks`).
  `CHUNK_SIZE` par ressource.
- Routes spéciales à connaître : `Orders.get → orders/id/{id}`, `Orders.getByReference → orders/reference/{enc}`,
  `Events.trigger → events/trigger/{enc}`, `CustomDataRecords.bulkSave → POST …/{defId}` (corps = tableau brut).

## Sécurité du transport (déjà en place — ne pas affaiblir)
TLS vérifié, **redirections non suivies** (`maxRedirects: 0`, anti-fuite `spm-api-key`), baseURL `https` hors
loopback (refus du `http` distant), plafonds de taille réponse/corps (25 Mio), comparaisons HMAC à temps
constant, `parseFormData` filtre `__proto__` / `constructor` / `prototype`. Ne jamais logguer la clé API.

## Stack & commandes
- TypeScript **strict**, ESM (`NodeNext`), Node ≥ 18.17. Gestionnaire : **yarn** (`yarn.lock` committé).
- `yarn build` (tsc -b) · `yarn test` (vitest, inclut la couverture OpenAPI) · `yarn clean`.
- Toujours **build + test verts** avant de pousser.

## Branches & versions (PAS de git-flow)
- Une seule branche longue : **`main`** (toujours verte / publiable). Branches courtes `feat/` / `fix/` / `chore/`
  → PR → merge.
- Versions = **tags / Releases `vX.Y.Z`** (semver). Pas de branche `master`.

## Publication (npm)
- `ci.yml` (push/PR `main`) : build + test.
- `publish.yml` (Release publiée) : publication npm **via OIDC, sans token**.
- Publier : bump `version` dans `package.json` → commit `chore(release): vX.Y.Z` → Release GitHub → publication
  automatique. Le workflow saute la publication si la version existe déjà.
- Contenu publié : `"files": ["dist"]` → seul `dist/` (+ `package.json`, `README.md`, `LICENSE`). Vérifier avec
  `npm pack --dry-run`.

## Conventions
- **Commits et commentaires de code en anglais.** `README.md` en anglais (utilisateur du SDK).
- TS strict, **pas de `any` opportuniste** (hors bords JSON/axios déjà cantonnés).
- Dans la **prose**, toujours écrire la marque **« ShopiMind »** (S et M majuscules).
- Toute nouvelle route doit exister dans `/api-json` (sinon allowlist justifiée). Ne jamais référencer un consommateur.
