# Fluide

Carnet de musculation installable sur iPhone (PWA), piloté par le **Système Fluide** : programme, séances en salle, objectif de séries de la semaine et réglages par muscle.

- **Aujourd'hui** : la séance du jour, l'objectif Fluide de la semaine (séries faites / cibles), le bloc en cours et le deload.
- **Séance en salle** : séries à remplir (charge, reps, RPE), repos chronométré, EMOM et Tabata avec bip, alternative si la machine est prise, exercice hors programme depuis le catalogue, fin de séance avec ressenti et journal.
- **Séances** : choix d'un programme (Full body, Haut / Bas, PPL, PPL × 2, Haut / Bas + PPL, un muscle par séance, personnalisé) qui génère les séances types, puis réglage de chaque exercice.
- **Progrès** : volume par muscle, courbes par exercice, historique des séances.
- **Réglages Fluide** : pour chaque muscle, Maintenir (4-8 séries / sem), Progresser (10-16) ou Point faible (16-22).

## Installer sur iPhone

1. Ouvrir https://alexisdesplas.github.io/fluide/ dans **Safari**.
2. Bouton Partager → **Sur l'écran d'accueil**.
3. Lancer l'appli depuis l'icône : plein écran, fonctionne hors connexion.

Les données restent sur l'iPhone (localStorage). Pour les sauvegarder : Réglages → Exporter, puis Importer pour les restaurer.

## Fichiers

- `index.html` : point d'entrée
- `js/app.js` : routeur et onglets ; `js/store.js` : données et règles Fluide ; `js/ui.js` : composants ; `js/views/` : un fichier par onglet
- `css/app.css` : styles (Hardwood, mode Indigo DT, police Inter)
- `sw.js` : cache hors connexion (changer `CACHE` à chaque mise à jour)
- `manifest.webmanifest`, `icons/` : installation
- `livrables/`, `memoire.md` : notes de conception

## Développer

Aucune dépendance, aucun build. Pour tester en local : `python3 -m http.server 8765` puis ouvrir http://localhost:8765.
Chaque push sur `main` met à jour le site GitHub Pages.
