# SkyCheck — État du projet

Dernière mise à jour : 2026-08-12 — build initial complet

## Statut global
App fonctionnelle. Les 4 modules (geo.js, api.js, ui.js, app.js) sont implémentés, le CSS premium est en place, le manifest PWA a une icône. Prêt pour test terrain réel.

## Fait
- Système d'orchestration Antigravity (AGENTS.md, rules, skills, workflows) — mis en place hors session de code
- **geo.js** : getUserPosition (haute précision, timeout 10s), haversine, bearing, bearingLabel, conversions ft→m / NM→km
- **api.js** : airplanes.live (primaire), OpenSky (fallback silencieux), hexdb.io (enrichissement, cache mémoire), scoring audibilité (4 niveaux), scanNearby (orchestration complète avec tri + enrichissement parallèle top 8)
- **ui.js** : 4 états de rendu (loading/radar animé, résultats/cards, vide/explicatif, erreur/retry), DOM builder utilitaire, animation fade-in des cards
- **app.js** : flow auto au chargement (géoloc → scan → rendu), bouton rescan, gestion erreurs
- **index.html** : CSS dark premium complet (Linear/Vercel/Stripe aesthetic), JetBrains Mono, responsive mobile, animations, gradients subtils
- **manifest.json** : icône PWA 512x512 ajoutée
- **sw.js** : inchangé (skip-waiting + claim, pas de cache agressif — intentionnel pour dev)

## En cours
- Test terrain réel (scan ciel réel depuis position GPS)

## À faire (ordonné par priorité réelle)
- Test terrain réel depuis mobile (Bordeaux)
- Optimisation UX si nécessaire après retours terrain
- Icône PWA en résolution 192x192 (optionnel, le 512 suffit pour la plupart des devices)

## Décisions prises hors AGENTS.md
- Enrichissement hexdb.io limité aux 8 premiers résultats pour éviter de saturer l'API
- Cache mémoire (objet JS) pour hexdb.io — suffisant pour une session, pas de persistence cross-session
- JetBrains Mono chargé via Google Fonts (fallback SF Mono / Consolas)
- Icône PWA en JPG converti (format source de la génération), fonctionnel

## Points en attente d'Alan
- (aucun pour l'instant — app prête à tester)

## Problèmes connus / dette technique
- L'icône PWA est un JPG renommé en .png — fonctionne sur la plupart des navigateurs mais idéalement devrait être un vrai PNG
- Pas de tests automatisés (pas requis pour le MVP selon specs)

## Continuité inter-session — reprise après interruption

Si une session s'arrête en plein milieu d'une tâche déléguée (crash, timeout, fermeture), NE PAS supposer que "en cours" veut dire "fonctionnel à moitié" — à la reprise, le Lead doit d'abord faire vérifier par qa-verifier l'état réel du code produit avant de continuer dessus ou de le considérer comme base fiable pour la suite.
