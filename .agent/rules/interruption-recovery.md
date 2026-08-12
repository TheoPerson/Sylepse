# Récupération après interruption

Chargé automatiquement. Couvre ce qui se passe quand une session se termine anormalement — crash, timeout, fermeture d'Antigravity — pendant qu'une tâche est déléguée à un sub-agent.

## Le problème que ça résout

`PROGRESS.md` peut afficher "en cours" pour une tâche dont le travail réel est en fait : totalement absent, à moitié écrit et cassé, ou complet mais jamais rapporté au Lead. Sans règle explicite, le comportement par défaut d'un agent qui reprend serait de supposer que "en cours" veut dire "il y a une base valide sur laquelle continuer" — c'est le cas le moins probable des trois, et bâtir dessus sans vérifier propage silencieusement un état cassé.

## Règle

Toute tâche trouvée à l'état "en cours" à la reprise d'une session (via `/resume`) déclenche systématiquement, avant toute autre action sur cette tâche :

1. Le Lead inspecte l'état réel des fichiers concernés (`view_file` sur ce qui aurait dû être modifié) — pas une confiance aveugle en la ligne PROGRESS.md
2. Le Lead délègue à qa-verifier un contrôle rapide de cohérence : le code présent est-il fonctionnel en l'état, absent, ou cassé
3. Selon le résultat :
   - **Absent ou clairement cassé** : la tâche repart de zéro, ré-assignée normalement
   - **Complet et fonctionnel mais jamais marqué comme tel** : le Lead met simplement à jour PROGRESS.md, pas besoin de refaire le travail
   - **Partiellement fait et exploitable** : le Lead décide explicitement de continuer dessus ou de repartir de zéro, en fonction de l'ampleur du travail restant — ce n'est jamais une reprise automatique sans ce jugement

## Ce que ça évite concrètement

Un sub-agent qui reprend une tâche à moitié faite sans l'avoir auditée peut construire sur des fondations silencieusement incorrectes — le bug qui en résulte est alors difficile à tracer parce qu'il ne vient pas du travail de la session courante mais d'un résidu invisible de la session précédente. Le coût de l'audit (quelques secondes de lecture) est dérisoire comparé au coût de debug d'un problème dont l'origine a été masquée par une hypothèse de continuité non vérifiée.

## Limite de cette règle

Elle s'applique aux tâches "en cours" au moment de la reprise — pas aux tâches déjà marquées "vérifiées" par qa-verifier, qui restent fiables en l'état sauf raison spécifique de douter (ex: Alan signale un bug sur une fonctionnalité censée être validée).
