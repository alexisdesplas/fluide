---
target: écran de séance
total_score: 26
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
target_identity: "file:/Users/alexisdesplas/Documents/PROJET/perso/fluid/.claude/worktrees/ameliorations-retours-dd8ccb/js/views/workout.js"
target_fingerprint: "sha256:f7d64b196833946845fe565c833349a89af33bdaecfe78be6c1c85b85282deb8"
target_path: /Users/alexisdesplas/Documents/PROJET/perso/fluid/.claude/worktrees/ameliorations-retours-dd8ccb/js/views/workout.js
timestamp: 2026-11-04T20-55-53Z
slug: js-views-workout-js
---
⚠️ DEGRADED: B en ligne de commande dans le contexte principal (pas de sous-agent ni d'injection navigateur). A en sous-agent.

## Note : 26/40 (Acceptable), contre 25
| # | Critère | Note | Problème principal |
|---|---|---|---|
| 1 | Visibilité | 3 | Fin de repos : ligne de 11 px et flash de 1,6 s. |
| 2 | Monde réel | 3 | PDC, 1RM est. non expliqués ; rowing à 0 kg. |
| 3 | Contrôle | 3 | Le bouton principal change de sens sous le doigt. |
| 4 | Cohérence | 2 | Options intermittent ; charge et reps de tailles différentes. |
| 5 | Prévention | 2 | Double tap = série enregistrée par erreur. |
| 6 | Reconnaissance | 2 | Pas de ligne « La dernière fois ». |
| 7 | Efficacité | 3 | Série suivante préparée pendant le repos. |
| 8 | Minimalisme | 2 | Temps en double pendant le repos ; RPE expliqué deux fois. |
| 9 | Rattrapage | 3 | Annuler, correction, confirmations. |
| 10 | Aide | 3 | Explications sur place, jamais effacées pour un habitué. |

## Problèmes prioritaires
- [P1] Bouton principal qui change de sens (Exercice suivant → Série faite) : verrou de 700 ms. /impeccable harden
- [P1] Fin de repos trop discrète : état « À toi » persistant, grand titre vert, temps de dépassement, contour du bouton. /impeccable bolder
- [P1] Chiffres de l'AMRAP qui débordent du petit anneau (164 px pour 163) : réduire dans .ring.sm. /impeccable polish
- [P2] Saisie chargée : charge et reps côte à côte, « La dernière fois », RPE expliqué une fois. /impeccable distill
- [P2] Fin d'exercice sans le volume de la semaine par muscle. /impeccable delight

## Profils
Une main : double tap, Recommencer à côté de Pause, toast Annuler sur les lignes. Bêta-testeur : « Touche ce qui manque », « Pas utilisé » sur une tuile cochée, PDC / 1RM / Melting pot. VoiceOver : puces RPE sans nom de groupe, valeur du stepper non annoncée, AMRAP muet jusqu'à la fin.

## Questions
1. Écran du matériel plein écran à chaque séance, ou une ligne « Tout ton matériel · Changer » ?
2. « À toi » vu à deux mètres, en silencieux ?
3. Quand ressens-tu le volume par muscle si la séance ne le montre jamais ?
