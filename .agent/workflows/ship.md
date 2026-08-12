# /ship

Workflow à exécuter avant tout déploiement vers Netlify (ou avant de dire à Alan que c'est prêt à déployer).

## Étapes

1. Vérifier dans `PROGRESS.md` qu'aucune tâche affectant le chemin critique (géoloc → scan → résultat) n'est encore "en cours" ou non vérifiée par qa-verifier
2. Déléguer à qa-verifier une passe complète sur la checklist de `.agent/rules/verification.md`, même si des tâches individuelles ont déjà été vérifiées séparément — une passe d'intégration globale peut révéler des interactions entre parties qui n'apparaissent pas isolément
3. Vérifier que le manifest PWA et le service worker n'introduisent pas de régression sur le chargement en navigateur classique (pas seulement en mode installé)
4. Si tout est validé : préparer le déploiement statique (build si nécessaire selon la stack finale, sinon fichiers prêts tels quels)
5. Rapporter à Alan un résumé court : ce qui est déployé, ce qui a changé depuis le dernier déploiement, tout point de vigilance identifié pendant la passe finale
6. Mettre à jour `PROGRESS.md` avec le statut post-déploiement

## Ce que ce workflow ne fait pas

Il ne pousse jamais vers un environnement de production sans passage par l'étape 2 (qa-verifier), même si Alan demande d'aller vite — vitesse et fiabilité de base ne sont pas en conflit ici vu la taille du projet, il n'y a pas de raison de sauter la vérification pour gagner quelques minutes.
