# AGENTS.md — SkyCheck

Ce fichier est chargé automatiquement par tout agent qui travaille dans ce workspace, avant qu'il commence à agir. Il définit le projet, l'objectif, les contraintes non-négociables, et le mode opératoire attendu. Ne redemande rien de ce qui est précisé ici — c'est déjà tranché.

## Qui est le porteur du projet

Alan (JUG_SEC). Solo dev, pas d'équipe. Basé Mérignac/Bordeaux, France. Gère ce projet en mode ghosted/remote depuis son téléphone la plupart du temps — n'intervient que quand une décision humaine réelle est nécessaire (crédentials, choix de compte tiers, validation finale de scope). Style de communication attendu quand tu lui parles : direct, terse, résumé d'abord, pas de remplissage, pas de liste de questions — tu décides et tu avances, tu ne demandes que si bloqué sur une vraie inconnue.

## Le projet — SkyCheck

**Objectif produit** : app web on-demand pour identifier un avion/réacteur entendu en temps réel IRL. Alan (ou n'importe quel utilisateur) entend un bruit d'avion → ouvre l'app (idéalement installée en PWA sur l'écran d'accueil) → géolocalisation automatique → scan du ciel dans un rayon autour de sa position → résultat en moins de 3 secondes : modèle d'appareil, compagnie, altitude, distance, direction.

**Cas négatif = résultat valide, pas une erreur.** Si rien n'apparaît en ADS-B, c'est probablement un hélicoptère (souvent sans transpondeur civil actif), un aéronef militaire (filtré), ou un drone. L'UI doit le dire explicitement, jamais afficher un état d'erreur générique dans ce cas.

## Décisions techniques déjà tranchées — ne pas rouvrir sans raison forte et documentée

- **Architecture** : frontend pur. Aucun backend, aucun serveur qui tourne en continu. Statique, déployé sur Netlify.
- **Stack** : HTML/CSS/JS vanilla. Pas de framework, pas de build step lourd — la simplicité de déploiement et de maintenance solo prime sur toute sophistication technique non justifiée par un besoin réel.
- **Géolocalisation** : `navigator.geolocation.getCurrentPosition()`, haute précision. Déclenchée automatiquement à l'ouverture, pas de bouton "activer" intermédiaire — la friction entre "j'entends un bruit" et "j'ai un résultat" doit être minimale.
- **Source de données vols (primaire)** : airplanes.live — `GET https://api.airplanes.live/v2/point/{lat}/{lon}/{radiusNM}`. Gratuit, sans clé, 1 req/sec, endpoint géo-radius natif. Rayon de départ : 15-20 NM (~28-37km).
- **Source de données vols (fallback)** : OpenSky Network anonyme — `GET https://opensky-network.org/api/states/all?lamin=&lomin=&lamax=&lomax=`. Quota anonyme strict (100 req/jour), résolution 10s. À utiliser uniquement si airplanes.live timeout ou erreur — silencieusement, sans que l'utilisateur ait à s'en soucier.
- **Enrichissement modèle avion** : hexdb.io — `GET https://hexdb.io/api/v1/aircraft/{icao24}`. Gratuit, sans clé. Fiabilité correcte sur type/manufacturer, moins fiable sur route — ne pas afficher de donnée route si absente plutôt que d'inventer.
- **Scoring "probablement audible"** : basé sur altitude + distance combinées, pas un seul critère seul. Formule de référence (ajustable si les tests réels sur le terrain montrent qu'elle est mal calibrée, mais documenter tout changement) :
  - alt < 1000m ET distance < 8km → très probable
  - alt < 3000m ET distance < 15km → probable
  - alt < 6000m ET distance < 25km → possible
  - sinon → peu probable
- **PWA** : requis. Manifest + service worker minimal pour installation "Add to Home Screen". C'est ce qui rend le use case réel utilisable (accès 1-tap depuis le bruit entendu jusqu'au résultat).
- **Esthétique** : dark UI premium, monospace, référence Linear/Vercel/Stripe. Cohérent avec le branding JUG_SEC existant.
- **Persistence** : aucune requise pour le MVP. localStorage optionnel plus tard pour historique local — pas de priorité avant que le cœur fonctionnel soit solide.

## Ce qui N'EST PAS dans le scope, sauf demande explicite d'Alan

- Compte utilisateur, authentification, base de données
- Notifications push / polling en arrière-plan
- Toute dépendance à une clé API payante ou nécessitant une inscription bloquante
- Tout framework front lourd (React/Vue/etc.) tant que le vanilla suffit au besoin réel

## Mode opératoire attendu

Voir `.agent/rules/orchestration.md` pour la structure Lead/sub-agents et `.agent/rules/engineering-standards.md` pour les standards de code, test et sécurité. Ces fichiers sont chargés automatiquement au même titre que celui-ci — ne pas dupliquer leur contenu ici, les lire.

**Principe général** : autonomie maximale, décisions techniques tranchées sans revenir vers Alan sauf si la décision touche à des credentials, un choix de service tiers payant, ou un changement de scope produit. Toute décision d'architecture ou de compromis technique doit être documentée dans `PROGRESS.md` (voir `.agent/rules/state-tracking.md`) au moment où elle est prise, pas reconstituée après coup.
