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
- **Ta semaine** : séances de muscu dispo, temps par séance, objectif longue durée ; le programme recommandé s'y règle.
- **Points forts / faibles** : muscles qui prennent vite (maintenir) / qui suivent moins (point faible). **À définir** : muscle gardé en séries longues 12-20 reps.
- **Objectif longue durée** : sport d'endurance préparé à côté (corde à sauter 1 h non-stop) ; il pèse sur la récup des jambes.

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

- 29/10/2026 — Retours en salle : matériel par exercice (barre, haltères, poulie, machine, Smith, kettlebell, élastique, poids du corps) qui fixe les pas de charge — pile machine et poulie par 5 lbs affichée en kg (2,3 · 4,5 · 6,8…), haltères comptés à l'unité. « Machine prise » propose le même exercice avec un autre matériel ou un autre exercice du muscle, et reste visible pendant tout l'exercice ; séries déjà faites gardées sur l'exercice d'origine.
- 29/10/2026 — Bouton de repos : vert, se remplit avec le temps, affiche la suite et le temps restant, un tap lance la série sans attendre.
- 29/10/2026 — Base de 1040 exercices (`js/exercices.js`) : noms et classement d'après la bibliothèque SmartWorkout, rangés dans les muscles Fluide (+ Avant-bras, Échauffement, Mobilité hors objectif). Catalogue filtrable par muscle et matériel. Les 36 anciens exercices sont renommés, l'historique suit.
- 29/10/2026 — Vidéos SmartWorkout : ni copiées ni liées (protégées, et le lien sortait de l'app, rejeté par Alexis). Mouvement montré dans l'app avec les photos libres de free-exercise-db (domaine public) qui alternent : 311 exercices, dont tous les habituels.
- 29/10/2026 — Échauffement : « C'est parti » lance un chrono (durée lue dans le réglage « Corde à sauter 3-5 min », borne haute), Reset / Pause / Passer, puis mobilité et séries d'approche. Anneaux alignés sur Tabatime (frame `136:14658`) : 312 px, trait 34 px, chrono 64 px ; orange pour l'échauffement.
- 29/10/2026 — Animations 3D Gym visual gardées partout (décision d'Alexis) : les visuels de SmartWorkout sont ceux de Gym visual (gymvisual.com), aussi servis par ExerciseDB (static.exercisedb.dev, GIF 180 px) ; liste reprise du dépôt hasaneyldrm/exercises-dataset (1 324 exercices). 334 exercices Fluide en GIF (`edb:ID` dans `js/exercices.js`), 112 en photos free-exercise-db, le reste sans visuel. Licence Gym visual à régulariser (GIF 3,60 $ l'unité, 0,90 $ dès 10) : les GIF sont chargés depuis leur CDN, rien n'est copié dans le dépôt.
- 29/10/2026 — Figma remis au niveau du code : Accueil sans bouton Réglages ; noms de la base d'exercices partout ; icône « voir le mouvement » à côté du nom d'exercice ; Repos avec anneau 208 px et bouton vert qui se remplit (composant local « ⚠ Proposition — Bouton de repos ») ; nouvel état « Échauffement — chrono en cours » (anneau orange 312 px, Reset / Pause / Passer) ; Machine prise avec le choix du matériel puis les autres exercices du muscle ; catalogue filtré par muscle et matériel, matériel en sous-ligne ; réglage d'exercice avec section Matériel et « Voir le mouvement » ; charges machine / poulie en kg · lbs. Page User flow : copies d'écrans remplacées, chrono ajouté en B.1.
- 30/10/2026 — Programme recommandé (Alexis pas satisfait du choix de split à la main) : écran dédié « Ta semaine » (séances de muscu 2-6, temps par séance 30-90 min échauffement compris, objectif longue durée). Chaque split est généré pour cette semaine puis classé : tient dans les séances dispo, part de la cible Fluide couverte, chaque muscle 2 fois, jambes 2 fois max avec un sport d'endurance. Séance trop longue : repos raccourcis, puis séries retirées sur les muscles à maintenir et l'isolation d'abord. Objectif « Corde à sauter · 1 h non-stop » (plan de 18 semaines, tous les jours) : mollets remplacés par 2 × 15 montées sur pointes debout 3 fois par semaine, semaine type avec le jour long le plus loin possible des jambes, récup le lendemain. Premier exercice d'un gros muscle pris à la barre ou à la Smith. Seuls les programmes qui tiennent dans les séances dispo sont listés (demande d'Alexis). Pas encore dans Figma.
- 30/10/2026 — Programme recommandé sans alerte quand il peut s'adapter (retour d'Alexis) : le temps se tient d'abord en descendant les muscles vers le bas de leur fourchette Fluide (plancher hebdo réparti sur les séances), affiché comme une adaptation ; alerte seulement si un muscle passe sous sa fourchette, et ce programme est classé plus bas. Avec la corde, jambes 2 fois max : la 3e séance de full body devient « Haut C ». « Ta semaine » ajoute points forts (muscles qui prennent vite → maintenir), points faibles (→ point faible), les autres en progresser ; ces puces écrivent les réglages Fluide. « À définir » : séries 12-20 reps, 1 min de repos, sans changer le volume (la définition vient surtout du gras en moins). Profil donné par Alexis : points forts fessiers, mollets, bras ; bras à définir.

- 30/10/2026 — Plan corde (18 semaines, artifact d'Alexis) intégré : séances faciles et jour long par semaine, deload S3/S7/S11/S15, récup 5 × 1 min / 30 s. « Semaine du plan » dans Ta semaine (S1-S18, avance chaque lundi, se recule pour refaire une semaine) ; Alexis en S2 le 30/10. L'échauffement de la muscu devient la séance corde du jour (facile ou récup) avec un chrono par blocs effort / repos ; le jour long se fait à part et l'échauffement des réglages reprend ce jour-là. Alexis préfère faire sa séance corde en échauffement (revient sur la proposition « corde facile à part »).

## Hypothèses ouvertes
- Séance corde facile avant les jours jambes (jusqu'à 30 min en fin de plan) : à surveiller, la décaler après la séance si les jambes fatiguent.
- Programme recommandé : pondération du classement (couverture, fréquence 2×, jambes ≤ 2 avec la corde) à ajuster à l'usage.
- Propositions locales : promotion dans Hardwood ou non.
- Clips filmés par Alexis, stockés sur l'iPhone, à la place des photos.
- Pas des haltères de la salle (1 kg jusqu'à 10, puis 2 kg) à confirmer.

