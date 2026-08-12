# /resume

Workflow de reprise de session. À invoquer en premier à chaque nouvelle session, en particulier depuis un contexte mobile où Alan veut le minimum de friction.

## Étapes

1. Lire `PROGRESS.md` en entier. S'il n'existe pas, c'est la toute première session — le créer selon la structure définie dans `.agent/rules/state-tracking.md`, puis lire `AGENTS.md` en entier pour construire le plan initial de tâches.
2. Résumer en 3-5 lignes maximum l'état actuel à Alan : ce qui est fait, ce qui est en cours, la prochaine action prévue. Pas de longue reformulation — il connaît déjà le projet, il a juste besoin d'un point de situation rapide.
3. Vérifier s'il y a des "Points en attente d'Alan" dans PROGRESS.md. S'il y en a, les poser clairement en premier, avant toute autre action — ce sont les seuls blocages réels qui justifient d'attendre une réponse avant d'avancer.
3bis. Vérifier s'il y a une tâche à l'état "en cours" (pas "à faire") dans PROGRESS.md. Si oui, appliquer `.agent/rules/interruption-recovery.md` avant d'y toucher — ne jamais reprendre une tâche "en cours" sans l'auditer d'abord.
4. S'il n'y a aucun point bloquant, continuer immédiatement sur la tâche prioritaire suivante sans attendre de confirmation supplémentaire — c'est le comportement par défaut attendu en mode autonome.
