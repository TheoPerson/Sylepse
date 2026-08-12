# Standards d'ingénierie

Chargé automatiquement. S'applique à tout code produit dans ce projet, par le Lead ou tout sub-agent.

## Code

- JS vanilla ES2020+, pas de TypeScript sauf si un besoin réel de typage complexe émerge (peu probable vu le scope) — ne pas ajouter la couche de complexité de build que TS implique sans raison concrète
- Un fichier par responsabilité claire une fois que le projet dépasse le stade single-file (ex: `api.js` pour les intégrations, `geo.js` pour Haversine/bearing, `ui.js` pour le rendu, `sw.js` pour le service worker) — mais ne pas fragmenter prématurément un MVP qui tient encore dans un seul fichier lisible
- Commentaires uniquement là où le "pourquoi" n'est pas évident du code lui-même (ex: pourquoi ce seuil de scoring, pourquoi ce fallback silencieux) — pas de commentaires qui répètent ce que la ligne fait déjà
- Gestion d'erreur explicite sur tout appel réseau : timeout, réponse vide, réponse malformée doivent chacun avoir un comportement défini, jamais un throw non catché qui casse l'UI
- Pas de dépendance externe (npm package, CDN lib) sans raison concrète — le vanilla JS suffit à ce scope pour la quasi-totalité des besoins

## Sécurité

- Aucune clé API secrète n'est nécessaire pour ce projet (toutes les sources de données utilisées sont sans authentification) — si un sub-agent introduit une intégration qui en nécessite une, il doit s'arrêter et remonter au Lead avant d'implémenter, pas after-the-fact
- Toute donnée venant des APIs externes (airplanes.live, OpenSky, hexdb.io) est traitée comme non fiable en format : valider la structure avant de l'utiliser dans le rendu, ne jamais injecter une valeur brute d'API dans le DOM sans passer par un mécanisme sûr (textContent plutôt que innerHTML pour toute donnée externe)
- Pas de tracking, pas d'analytics tiers, pas de cookie non essentiel — le projet n'en a pas besoin et ça ajoute une surface de confiance à gérer pour rien

## Quand s'arrêter et demander confirmation à Alan (via mise à jour PROGRESS.md + flag explicite)

- Introduction d'un service tiers qui nécessite une inscription, une clé payante, ou une limite de quota qui pourrait affecter l'usage réel
- Changement de l'architecture "zéro backend" décidée dans AGENTS.md
- Toute action qui touche à un compte externe d'Alan (Netlify, domaine, etc.) au-delà du déploiement statique déjà scopé
- Ambiguïté réelle sur le comportement produit attendu qui n'est pas tranchée dans AGENTS.md et où deux interprétations raisonnables mèneraient à des UX différentes

Pour tout le reste : décider, documenter la décision et sa raison dans `PROGRESS.md`, avancer. Ne pas transformer une décision technique normale en question pour Alan par excès de prudence — ça va à l'encontre du mode ghosted qu'il a demandé.

## Performance

- Le rayon de scan par défaut (15-20 NM) et le débit d'appel (max 1 req/sec sur airplanes.live) sont déjà calibrés dans AGENTS.md — ne pas les modifier pour "améliorer" sans donnée concrète montrant que c'est nécessaire
- Le temps entre ouverture de l'app et résultat affiché est la métrique de performance qui compte réellement ici (objectif produit : <3s) — optimiser pour ça avant toute micro-optimisation de rendu qui n'a pas d'impact perceptible sur ce chemin
