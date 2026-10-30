# Fluide — contexte pour Claude Code

Carnet de musculation en PWA pour l'iPhone d'Alexis, piloté par le Système Fluide (skill `coach-fluide`). Pas de build, pas de dépendances : HTML/CSS/JS en modules ES.

- Lire `memoire.md` d'abord : glossaire métier, décisions, hypothèses ouvertes.
- Figma : fichier /Perso `QZ94FGPStTONZYIJcXnyHX`, pages `Fluide · App` et `Fluide · User flow`. Le code est aligné sur ces écrans.
- Dépôt public : https://github.com/alexisdesplas/fluide (branche `main`, versionning). Hébergement Vercel, projet `fluide` relié au dépôt : chaque push sur `main` déploie https://alexis-fluide.vercel.app/ (`vercel.json` met les en-têtes no-cache, `.vercelignore` exclut les notes).
- À chaque mise à jour, incrémenter `CACHE` dans `sw.js` et y lister tout nouveau fichier.
- Données : localStorage, clé `fluid-v1`. Compte optionnel sur Supabase (code par e-mail, une ligne JSON par compte, `js/compte.js`, mise en place dans `supabase/README.md`), vide tant que `js/config.js` n'a pas l'URL et la clé publique. Export / import JSON dans Réglages.
- Tester en local : `python3 -m http.server 8765` (config `fluide` dans `.claude/launch.json`), viewport 390.
- Interface en français. Écrans dédiés pour les saisies, feuilles seulement pour confirmations et choix rapides.
