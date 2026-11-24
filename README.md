# Fluide

Carnet de musculation installable sur iPhone (PWA), piloté par le **Système Fluide** : programme, séances en salle, objectif de séries de la semaine, surcharge progressive et réglages par muscle.

Version en ligne : https://alexis-fluide.vercel.app/ · notes de version : [releases](https://github.com/alexisdesplas/fluide/releases).

## Trois onglets

- **Aujourd'hui** : la séance du jour (ou une autre, « Changer »), le lieu (salle, chez moi, street : la séance s'adapte au matériel), l'objectif Fluide de la semaine et le bloc en cours.
- **Progrès** : la semaine (un point par série, par muscle), les exercices (1RM estimé, courbes, repères athlétiques et déséquilibres), l'historique des séances.
- **Réglages** : ta semaine et le programme recommandé, les séances types, points forts et faibles, objectif par muscle (volume, force / hypertrophie / endurance, séance Tabata du muscle), mouvements à faire progresser, exercices favoris, équipement des lieux, bloc et deload, reprise après une pause, compte et sauvegarde.

## En séance

- Séries à remplir (charge, reps, RPE), repos chronométré avec bip, supersets et trisets, EMOM, Tabata et AMRAP au chrono.
- **Surcharge progressive** : la charge de la prochaine fois est enregistrée dans tes séances types après chaque séance. Elle monte dès qu'une série dépasse la fourchette, recalée d'après ce que tu as fait, et redescend si c'est trop lourd ; au repère athlétique (poids, taille, âge), elle ne monte plus.
- **Tabata d'exercices variés** : collé depuis le coach, un mouvement par round affiché en grand, rounds notés tout seuls au chrono.
- « Remplacer » si la machine est prise, séries corrigeables, fin de séance avec ressenti et journal, bilan avec records et charges de la prochaine fois.

## Coller du coach

Réglages › Programme › **Coller du coach** : un texte JSON préparé par le coach (`"type": "fluide-templates"`) ajoute des séances, complète tes séances types, règle un muscle, met des exercices en favori ou pose un Tabata comme séance d'un muscle. Aperçu avant « Appliquer ». Le format est décrit en tête de `parseTemplates` dans `js/store.js`.

## Installer sur iPhone

1. Ouvrir https://alexis-fluide.vercel.app/ dans **Safari**.
2. Bouton Partager → **Sur l'écran d'accueil**.
3. Lancer l'appli depuis l'icône : plein écran, fonctionne hors connexion.

Les données vivent sur l'iPhone (localStorage, clé `fluid-v1`). Compte optionnel (Supabase, `js/compte.js`, mise en place dans `supabase/README.md`) pour les retrouver sur un autre appareil. Sauvegarde par fichier : Réglages › Compte et données › Exporter / Importer.

## Fichiers

- `index.html` : point d'entrée
- `js/app.js` : routeur et onglets ; `js/store.js` : données et règles Fluide ; `js/athletic.js` : repères athlétiques ; `js/exercices.js` : base de 1040 exercices ; `js/ui.js` : composants ; `js/views/` : un fichier par écran
- `js/version.js` : numéro affiché en bas des Réglages (release GitHub du même numéro)
- `css/app.css` : styles (DA pop, Barlow et Barlow Condensed)
- `sw.js` : cache hors connexion (changer `CACHE` et lister tout nouveau fichier à chaque mise à jour)
- `manifest.webmanifest`, `icons/` : installation
- `livrables/`, `memoire.md` : notes de conception

## Développer

Aucune dépendance, aucun build. Pour tester en local : `python3 -m http.server 8765` puis ouvrir http://localhost:8765 (largeur 390).
Hébergé sur Vercel (projet `fluide`, relié au dépôt GitHub) : chaque push sur `main` déploie en production.
