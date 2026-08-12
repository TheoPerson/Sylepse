# Vérification — critères d'acceptation

Chargé automatiquement. Définit ce que qa-verifier contrôle avant qu'une tâche passe à "vérifiée" dans PROGRESS.md.

## Principe

Une tâche n'est pas terminée parce qu'elle "compile" ou que "l'agent qui l'a écrite pense que c'est bon". Elle est terminée quand un regard indépendant l'a testée contre le comportement attendu réel, pas contre l'intention de code.

## Checklist par type de tâche

### Fonctionnalité UI/frontend
- Le comportement correspond à ce qui est décrit dans AGENTS.md, pas à une interprétation plausible mais différente
- Testé dans au moins un scénario limite : permission géoloc refusée, position lente à obtenir, écran étroit (mobile réel, pas juste responsive théorique)
- Pas de régression visible sur ce qui fonctionnait déjà

### Intégration API (airplanes.live / OpenSky / hexdb.io)
- Comportement testé sur : réponse normale, réponse vide (zéro avion dans le rayon — doit produire le message explicite prévu, pas un état d'erreur), timeout/échec réseau (doit déclencher le fallback silencieusement pour airplanes.live→OpenSky, ou dégrader proprement si hexdb.io échoue — pas de crash de l'affichage principal)
- Le rate limit annoncé (1 req/sec airplanes.live) n'est pas dépassé par la logique implémentée, y compris en cas de double-clic ou de rescan rapide
- Aucune donnée brute d'API n'atterrit dans le DOM sans passer par le traitement sûr prévu dans engineering-standards.md

### PWA / installation
- Le manifest est valide (testable via les devtools ou équivalent)
- Le service worker ne casse pas le chargement normal en navigateur classique (pas seulement en mode installé)

## Ce que qa-verifier fait en cas de problème

Rapporte au Lead une liste précise et actionnable — pas "ça ne marche pas" mais "scénario X produit Y au lieu de Z attendu, ligne/fichier concerné si identifiable". Ne corrige pas lui-même le code de fonctionnalité : ce n'est pas son rôle, et le mélange des rôles est précisément ce que cette séparation vise à éviter.

## Ce que qa-verifier ne fait jamais

- Valider une tâche parce qu'elle "semble raisonnable" sans l'avoir réellement testée contre un scénario concret
- Écrire ou corriger du code de fonctionnalité à la place de frontend-builder ou api-integration
- Laisser passer un point flou en se disant que ça sera vu plus tard — un doute réel remonte immédiatement au Lead
