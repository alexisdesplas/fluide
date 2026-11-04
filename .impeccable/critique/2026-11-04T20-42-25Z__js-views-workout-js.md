---
target: écran de séance
total_score: 25
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
target_identity: "file:/Users/alexisdesplas/Documents/PROJET/perso/fluid/.claude/worktrees/ameliorations-retours-dd8ccb/js/views/workout.js"
target_fingerprint: "sha256:0f3405d9f25ea91036c940b83373681a065e38ab81fac0fcf1b87920b05ee5c7"
target_path: /Users/alexisdesplas/Documents/PROJET/perso/fluid/.claude/worktrees/ameliorations-retours-dd8ccb/js/views/workout.js
timestamp: 2026-11-04T20-42-25Z
slug: js-views-workout-js
---
Method: dual-agent (A: design review · B: detector + browser)

## Note de santé : 25/40 (Acceptable)
| # | Critère | Note | Problème principal |
|---|---|---|---|
| 1 | Visibilité de l'état | 3 | Durée et volume en 12 px ; l'écran de correction cache le repos. |
| 2 | Monde réel | 3 | « Reset » en anglais ; S3, RPE, deload non expliqués. |
| 3 | Contrôle et liberté | 2 | Arrêter l'AMRAP / le chrono / Reset en un tap, sans confirmation. |
| 4 | Cohérence | 2 | Doublons : deux sorties à l'échauffement, OK + Enregistrer, deux Passer ; « Suivant » à deux sens. |
| 5 | Prévention des erreurs | 2 | Suivant à 12 px de Série faite ; cibles de 24 à 32 px. |
| 6 | Reconnaissance | 3 | Titre tronqué sur le matériel après un changement. |
| 7 | Efficacité | 2 | Charge non réglable pendant le repos ; « Modifier la séance » sans accès. |
| 8 | Minimalisme | 3 | En-tête d'environ 200 px avant le contenu. |
| 9 | Rattrapage | 3 | Pas d'annulation juste après Série faite. |
| 10 | Aide | 2 | RPE, deload, Corde · S3, Pile non expliqués. |

## Spécificité
Parcours propre à Fluide (matériel du jour, double progression, AMRAP) ; rendu visuel générique. Détecteur : overused-font (Inter, choix Hardwood), monotonous-spacing (index.html, faible), text-occlusion sur l'anneau (fausse alerte ; le centre est sous le SVG dans l'ordre d'empilement).

## Problèmes prioritaires
- [P1] Arrêts définitifs en un tap (Arrêter l'AMRAP, Arrêter le chrono, Reset) : confirmer, annuler après Série faite. /impeccable harden
- [P1] Cibles < 44 px (Terminer 24 px, boutons sm et puces 32 px, petits boutons + et − 36 px) : 44 px dans .workout, −15/+15 près du bouton de repos. /impeccable adapt
- [P1] Charge et reps invisibles pendant le repos : ligne « Série 2 : 60 kg × 6 » réglable sous l'anneau. /impeccable layout
- [P2] Titre tronqué sur le matériel, en-tête surchargé : titre sur deux lignes, Format, Favori et Pile dans une feuille d'options. /impeccable distill
- [P2] Commandes en double ou ambiguës : Exercice suivant / précédent, une action par intention, accès à Modifier la séance. /impeccable clarify

## Signaux d'alerte par profil
- Une main : petites cibles, Série faite collé à Suivant, bip muet en silencieux, circuit AMRAP hors écran.
- Bêta-testeur : S3, deload, RPE et Machine prise non expliqués ; puces sans allure de cases à cocher ; noms d'exercices avec des majuscules à chaque mot.
- VoiceOver : aucune annonce vocale (aria-live absent), phases codées par la couleur seule, bouton de repos qui ressemble à un bouton désactivé.

## Mineures
Pas de Passer avant le départ de l'échauffement ; conseil d'approche caché pendant le chrono ; « Exercice terminé » discret ; volume enterré dans le pied de page ; rose « danger » en AMRAP ; « Série 2 » sans verbe ; espacement de 3 px hors grille ; styles en dur dans workout.js.

## Questions
1. Faire du repos l'écran où l'on prépare la série suivante ?
2. Montrer le RPE dès le premier jour à un bêta-testeur ?
3. Pourquoi l'écran du matériel ressemble-t-il à un formulaire de réglages ?
