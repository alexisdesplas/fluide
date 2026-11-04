# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Alexis, d'abord** : pratique la musculation en salle plusieurs fois par semaine, prépare en parallèle un challenge de corde à sauter (1 h non-stop). Designer, il conçoit l'app pour lui et la teste en séance.
- **Quelques bêta-testeurs** : des proches invités par une fiche avec QR code (`livrables/fluide/fiche-beta.html`). Ils ne connaissent pas forcément le Système Fluide : l'app doit expliquer ses notions (maintenir, progresser, point faible, deload) dans l'interface, sans manuel.

Le job : savoir quoi faire aujourd'hui à la salle, le noter vite entre deux séries, et voir si la semaine tient ses objectifs par muscle.

## Product Purpose

Fluide est un carnet de musculation installé sur l'iPhone, piloté par le Système Fluide (skill `coach-fluide`). Il génère le programme, accompagne la séance en salle (séries, repos, formats EMOM / Tabata / AMRAP) et suit l'objectif de séries de la semaine.

Réussite : une séance se mène de bout en bout sans sortir le téléphone plus que nécessaire, et l'objectif Fluide de la semaine est atteint muscle par muscle sans y penser.

## Positioning

Deux mécanismes ensemble, qu'une app de suivi classique (Hevy, Strong) n'a pas :

1. **Le volume par muscle comme boussole** : chaque muscle a une cible de séries par semaine (Maintenir 4-8, Progresser 10-16, Point faible 16-22) et un objectif (force, hypertrophie, endurance). Le programme, les séances types et le compteur hebdomadaire se règlent dessus.
2. **L'adaptation au jour comme quotidien** : matériel disponible, machine prise, exercice absent de la salle, temps par séance, deload, plan de corde à sauter. La séance du jour s'ajuste sans toucher au programme.

## Operating Context

- **En salle, téléphone en main entre deux séries** : souvent une seule main, attention partagée, musique dans les écouteurs, parfois mains moites. Le repos se chronomètre, un bip annonce la fin.
- **Avant la séance** : choix du matériel du jour, échauffement (corde à sauter quand le plan est en cours).
- **Hors salle** : réglages du programme, de la semaine et des muscles ; consultation des progrès ; pas du jour envoyés par un Raccourci iOS.
- **Rituels Fluide** : blocs de 6 semaines suivis d'une semaine de deload ; double progression (reps puis charge) ; ressenti noté en fin de séance.

## Capabilities and Constraints

- PWA installée depuis Safari sur l'écran d'accueil, largeur iPhone 390, fonctionne hors connexion. HTML / CSS / JS en modules ES, sans build ni dépendance. Hébergée sur Vercel depuis `main`.
- Données dans le localStorage, compte optionnel sur Supabase (e-mail et mot de passe ; Google en préparation). Export / import JSON.
- Limites de l'app web sur iPhone : pas de vibration, bip muet en mode silencieux, liens et connexions externes qui s'ouvrent dans Safari plutôt que dans l'app.
- Charges en kg (barre, haltères, kettlebell) et en lbs pour les piles de machines et poulies ; pas de la pile réglable par machine, poulies démultipliées ½ possibles.
- Terminologie : voir le glossaire de `memoire.md` (Réglages Fluide, Objectif Fluide de la semaine, Bloc, Machine prise, Hors programme, Ta semaine, Points forts / faibles, Objectif longue durée).
- Interface en français, code en anglais.
- Écrans dédiés pour les saisies ; feuilles du bas seulement pour les confirmations et les choix rapides.

## Brand Commitments

- Nom : **Fluide**. Ton : français, tutoiement, phrases courtes et concrètes, pas de jargon sans explication.
- Les écrans sont alignés sur Figma (fichier /Perso `QZ94FGPStTONZYIJcXnyHX`, pages `Fluide · App` et `Fluide · User flow`) et sur le design system Hardwood déjà en place dans le code. Toute évolution visuelle part de ces sources.

## Evidence on Hand

- Fiche bêta et QR code : `livrables/fluide/fiche-beta.html`, `fiche-beta.png`, `qr-fluide.png`.
- Retours de séance d'Alexis, consignés dans `memoire.md` (Décisions).
- Aucun témoignage, chiffre d'usage ni avis de bêta-testeur pour l'instant : ne pas en inventer.

## Product Principles

1. **La séance d'abord** : en salle, chaque écran sert l'action suivante (série faite, repos, exercice suivant) ; le reste attend.
2. **Le programme ne bouge pas sans accord** : les adaptations du jour valent pour la séance, le report dans la séance type se demande.
3. **Expliquer Fluide dans l'interface** : un bêta-testeur doit comprendre chaque notion là où elle apparaît.
4. **Rien ne se perd** : une saisie se corrige, une séance survit à la fermeture de l'app, les données se sauvegardent.
5. **Honnête sur ses limites** : ce que l'app web ne peut pas faire sur iPhone se dit, plutôt que de faire semblant.
