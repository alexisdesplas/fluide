# Mémoire — Fluide

App perso de musculation (PWA iPhone) pilotée par le **Système Fluide** (skill `coach-fluide`) : créer ses séances, remplir ce qu'on fait à la salle, suivre ses perfs et l'objectif Fluide de la semaine.

## Fichiers
- Code : ce dossier, `index.html` + `js/` + `css/`, sans build ni dépendance (même convention que Tabatime). Test local : `python3 -m http.server 8765`.
- Dépôt public : https://github.com/alexisdesplas/fluide (branche `main`), hébergement Vercel (projet `fluide` relié au dépôt) : https://alexis-fluide.vercel.app/ — chaque push déploie, incrémenter `CACHE` dans `sw.js`.
- Figma : fichier /Perso `QZ94FGPStTONZYIJcXnyHX`, page `Fluide · App` (après `Tabatime · App`, sous l'intercalaire `── SPORT`).
- Livrables UI : `livrables/fluide/`.

## Design system
- Hardwood, mode « Indigo DT » (comme les écrans Hardwood de Tabatime). Police Inter. Icônes Phosphor (Stroke, Regular).
- Largeur : 390 (iPhone) uniquement.
- Imports de librairie : passent par le serveur Figma officiel (`use_figma`) ; via Bridge ils expirent.

## Glossaire métier
- **Réglages Fluide** : pour chaque muscle, Maintenir (4-8 séries/sem), Progresser (10-16), Point faible (16-22) + cible de séries.
- **Objectif Fluide de la semaine** : séries faites / cibles, plafonné par muscle.
- **Bloc** : 6 semaines + 1 semaine de deload (volume divisé par deux).
- **Machine prise** : alternative du même muscle pour la séance seulement. **Hors programme** : exercice ajouté depuis le catalogue, en séries, EMOM ou Tabata.
- **Programme (split)** : façon de répartir les muscles sur la semaine ; génère les séances types.
- **Favori** : exercice marqué d'une étoile, proposé en premier partout.

## Décisions
- 26/10/2026 — « Fluid » = Système Fluide (skill coach-fluide), pas un design system.
- 26/10/2026 — Demandes d'Alexis : créer le programme, remplir la séance, choisir programme ou autre exercice du catalogue, alternatives si machine prise, compteur hebdo de l'objectif Fluide, écran de réglages maintenir / progresser.
- 26/10/2026 — Progress Bar Hardwood inutilisable (valeur figée) → proposition locale.
- 26/10/2026 — Cadre de A · Aujourd'hui validé par Alexis ; B à E composés, cas d'usage et cas limites exhaustifs (54 écrans).
- 26/10/2026 — Présentation en user flow sur la page `Fluide · User flow` (5 couloirs). Pastilles : vert nominal, orange cas limite, bleu geste qui enregistre, violet pilotage Fluide.
- 26/10/2026 — Composants locaux marqués `⚠ Proposition` dans la section dédiée de `Fluide · App` (onglets, stepper, segmenté, puce, feuille, barre de progression, toast, courbe).
- 26/10/2026 — Code aligné sur Figma : confirmations en feuille (plus de confirm()), feuille sans alternative avec « hors programme » et « attendre la machine », mode Modifier pour renommer, réordonner (↑ ↓ 44 px) et supprimer une séance type.
- 26/10/2026 — Fin de séance en écran dédié (pas une feuille) : Alexis préfère les écrans dédiés aux feuilles pour les saisies (comme les réglages de Tabatime). Feuilles réservées aux confirmations et aux choix rapides.
- 26/10/2026 — Formats EMOM et Tabata par exercice (séance type et hors programme), chrono par round ; favoris (étoile) à la place de « J'aime » ; feuilles redessinées d'après la Bottom sheet du fichier Wireframe — Mobile (titre à gauche, croix, validation en bas).
- 26/10/2026 — Programmes : choix d'un split (full body, haut / bas, PPL, PPL × 2, haut / bas + PPL, un muscle par séance, personnalisé) qui génère les séances types selon la matrice Fluide, avec aperçu et confirmation de remplacement.
- 26/10/2026 — Équivalence validée par Alexis : Tabata 8 rounds = 2 séries, EMOM 3 rounds = 1 série pour l'objectif Fluide.
- 28/10/2026 — Repo GitHub public `fluide` pour le versionning, hébergement Vercel (GitHub Pages retiré le jour même). Techno gardée : PWA sans build (choix d'Alexis, plutôt que SwiftUI ou Expo). Données sur l'iPhone seulement, export par la feuille de partage iOS.
- 28/10/2026 — Cibles par défaut de la matrice validées par Alexis (Pecs, Dos, Épaules, Quadris en Progresser, le reste en Maintenir).
- 28/10/2026 — Passe de test contre le user flow Figma : échauffement aligné sur B.1 (Terminer, sous-titre, durée, mobilité selon le haut ou le bas du corps) ; après la dernière série on reste sur l'exercice (repos « Ensuite {exercice} », puis « Exercice terminé » B.4, « Séance bouclée » B.5) ; bilan avec bloc et semaine, records avec trophée, lignes ouvrant la courbe de l'exercice.
- 28/10/2026 — Bugs corrigés : repos en cours qui bloquait le lancement d'un EMOM / Tabata ; total de fin de séance qui comptait les rounds comme des séries ; « Meilleur 1rm » ; pluriels (0 / 1 série, 1 exercice, 1 séance) ; poids du corps affiché « PDC » au lieu de 0 ; exercice jamais fait avec un état vide.
- 28/10/2026 — Service worker v7 : cache rempli et requêtes revalidées hors cache HTTP, rechargement automatique quand une nouvelle version prend la main.

## Hypothèses ouvertes
- Propositions locales : promotion dans Hardwood ou non.

