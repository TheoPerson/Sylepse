# State Tracking — PROGRESS.md

Chargé automatiquement. Explique comment et pourquoi maintenir l'état persistant du projet.

## Le problème que ça résout

Une session Antigravity ne se souvient pas automatiquement de ce qui s'est passé dans une session précédente une fois fermée. Pour un usage "solo ghosted, je reviens quand je veux depuis mon tel", ça veut dire que sans un mécanisme d'état écrit sur disque, chaque reprise repartirait de zéro — exactement l'inverse de l'autonomie recherchée. `PROGRESS.md` (à la racine du projet, à créer par le Lead dès la première session s'il n'existe pas) est ce mécanisme.

## Structure attendue de PROGRESS.md

```
# SkyCheck — État du projet

Dernière mise à jour : [date/heure]

## Statut global
[une ligne : où en est le projet — MVP en cours / MVP terminé, polish en cours / production-ready]

## Fait
- [tâche] — vérifiée par qa-verifier le [date]
- ...

## En cours
- [tâche] — assignée à [agent] — [contexte utile pour reprendre sans tout ré-expliquer]

## À faire (ordonné par priorité réelle, pas par ordre d'idée)
- [tâche]
- ...

## Décisions prises hors AGENTS.md
- [décision] — [raison] — [date]

## Points en attente d'Alan
- [question précise] — [pourquoi ça bloque]

## Problèmes connus / dette technique
- [problème] — [impact] — [pourquoi pas encore résolu]
```

## Règles d'usage

- Le Lead lit `PROGRESS.md` en entier avant toute autre action, à chaque début de session
- Toute tâche marquée "Fait" doit avoir été validée par qa-verifier — jamais une auto-déclaration par l'agent qui a produit le travail
- "Points en attente d'Alan" ne doit contenir QUE des points qui remplissent réellement les critères de `.agent/rules/engineering-standards.md` (section "quand s'arrêter") — pas une liste de questions de confort
- Mise à jour au fil de l'eau, pas en fin de session groupée — si la session s'interrompt brutalement, l'état écrit doit rester exploitable
- Le fichier reste concis : c'est un état, pas un journal exhaustif de chaque micro-action. Les décisions et leur raison comptent, pas le détail de chaque commande exécutée
- Une tâche à l'état "en cours" trouvée à la reprise d'une session n'est jamais reprise telle quelle sans audit — voir `.agent/rules/interruption-recovery.md`
