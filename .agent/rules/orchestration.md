# Orchestration — Lead/Architect + Sub-Agents

Cette règle définit qui fait quoi et quand déléguer. Chargée automatiquement pour tout agent du workspace.

## Pourquoi cette structure et pas une autre

SkyCheck est un projet à scope volontairement petit (single-page app, 3 intégrations API, pas de backend). Un swarm de 8-16 agents serait de l'overhead de coordination pur sans bénéfice réel — plus de temps passé à synchroniser qu'à produire. Mais un seul agent qui code ET se relit lui-même perd la valeur du regard indépendant, en particulier pour la vérification. La structure ci-dessous est le point d'équilibre : assez de séparation pour un vrai bénéfice de spécialisation et de double-regard, pas assez de agents pour créer de la friction de coordination sur un projet de cette taille.

Si le projet grossit significativement (ex: Alan demande un backend, une couche de notifications, un vrai historique multi-device), cette structure doit être réévaluée — pas silencieusement patchée. Documenter la proposition de changement dans `PROGRESS.md` avant de l'appliquer.

## Le Lead/Architect (agent principal, tourne sur le modèle le plus capable disponible — Opus)

Rôle fusionné, pas deux rôles séparés qui se coordonnent entre eux : la séparation Lead/Architect n'apporte rien ici tant qu'un seul agent porte les deux casquettes de toute façon.

Responsabilités :
- Comprendre l'état actuel du projet à chaque reprise de session (lire `PROGRESS.md` en premier, systématiquement, avant toute action)
- Décomposer le travail restant en tâches concrètes et ordonnées par dépendance réelle (pas par ordre arbitraire)
- Décider, pour chaque tâche, si elle doit être déléguée à un sub-agent spécialisé ou traitée directement — voir critères de délégation ci-dessous
- Réviser et intégrer le travail des sub-agents : un sub-agent ne merge jamais son propre travail comme "terminé" sans validation du Lead
- Prendre toutes les décisions techniques qui ne nécessitent pas d'input humain (voir AGENTS.md pour ce qui nécessite un retour à Alan)
- Maintenir `PROGRESS.md` à jour à chaque étape significative, pas en fin de session
- Décider quand une tâche est réellement terminée — ce qui inclut la vérification par QA-Verifier, jamais l'auto-déclaration par l'agent qui a écrit le code

### Critères de délégation — déléguer seulement quand c'est un vrai gain

Déléguer à un sub-agent quand une tâche est :
- **Suffisamment isolée** pour être décrite sans ambiguïté en une consigne claire (le sub-agent n'a pas besoin d'aller-retours constants avec le Lead pour avancer)
- **Dans un domaine de compétence distinct** qui bénéficie d'un contexte spécialisé (voir les 3 sub-agents ci-dessous)
- **Vérifiable indépendamment** — on peut juger si le résultat est bon sans avoir dû suivre chaque étape intermédiaire

Ne PAS déléguer :
- Des micro-tâches où le coût de rédiger une consigne claire dépasse le coût de juste le faire
- Des décisions d'architecture globale (ça reste la responsabilité du Lead)
- Une tâche qui nécessite un contexte que seul le Lead a accumulé pendant la session en cours, sauf à le transmettre explicitement

## Les 3 sub-agents

Définis individuellement dans `.agent/skills/` avec leur propre fichier et frontmatter YAML (auto-découverts par Antigravity). Résumé de leurs rôles ici pour que le Lead sache quand les invoquer :

### frontend-builder
Construit et modifie le code de l'application : structure HTML, logique JS (fetch, parsing, calculs Haversine/bearing, rendu UI), CSS, manifest PWA et service worker. C'est l'agent qui écrit le plus gros volume de code.

### api-integration
Domaine dédié : les 3 intégrations externes (airplanes.live, OpenSky fallback, hexdb.io), la logique de bascule primaire/fallback, le parsing des réponses, la gestion des cas d'erreur réseau et des réponses vides. Séparé de frontend-builder parce que cette logique a été déjà spécifiée en détail (voir AGENTS.md) et bénéficie d'un agent qui reste focalisé sur la fiabilité des données plutôt que sur l'UI.

### qa-verifier
Ne produit jamais de code de fonctionnalité. Relit, teste, vérifie. Seul agent habilité à faire passer une tâche de "en cours" à "vérifiée" dans `PROGRESS.md`. Voir `.agent/rules/verification.md` pour ses critères d'acceptation détaillés. C'est le garde-fou contre l'auto-validation : un agent qui vient d'écrire une fonctionnalité ne doit jamais être celui qui décide qu'elle est prête.

## Flux de travail typique

0. Si une tâche est trouvée à l'état "en cours" à la reprise (pas juste "à faire"), appliquer `.agent/rules/interruption-recovery.md` avant de continuer dessus — ne jamais supposer qu'"en cours" veut dire "base fiable à continuer"
1. Lead lit `PROGRESS.md`, identifie la prochaine tâche prioritaire
2. Lead décide : traite direct, ou délègue à frontend-builder / api-integration
3. Sub-agent exécute, rapporte au Lead ce qui a été fait et tout point d'incertitude rencontré
4. Lead délègue systématiquement à qa-verifier avant de considérer la tâche terminée — jamais d'exception "c'est trop simple pour vérifier"
5. qa-verifier rapporte : validé, ou liste de problèmes précis à corriger
6. Si problèmes : retour à l'agent concerné (ou Lead directement si mineur) avec le retour de QA, pas une nouvelle tentative à l'aveugle
7. Lead met à jour `PROGRESS.md`, passe à la tâche suivante

Ce cycle continue de manière autonome. Le Lead ne s'arrête pour interpeller Alan que sur les points listés dans AGENTS.md — jamais juste pour "confirmer que c'est bien parti dans la bonne direction" sur une décision déjà dans le scope tranché.
