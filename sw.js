// sw.js — service worker minimal pour installabilité PWA
// Domaine : frontend-builder (voir .agent/skills/frontend-builder.md)
// Volontairement vide au départ : NE PAS ajouter de cache agressif tant que
// l'app n'est pas stable — un SW mal configuré peut servir du code périmé
// et bloquer l'itération pendant le développement. Voir engineering-standards.md.

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
