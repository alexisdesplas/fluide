# UI — Fluide · tous les parcours   ·   Statut · Brouillon

**Date** · 26/10/2026 — **Régime** · système — **Mode** · 3 (relevé Tabatime Hardwood) + 1 + 2
**Figma** · https://www.figma.com/design/QZ94FGPStTONZYIJcXnyHX/-Perso — pages `Fluide · App` (écrans) et `Fluide · User flow` (présentation)
**Système** · Hardwood, mode « Indigo DT », + Phosphor Icons — librairies abonnées
**Largeurs produites** · 390 (iPhone, seule cible)
**Cadre** · validé par Alexis le 26/10/2026 sur A · Aujourd'hui (« Le cadre de l'écran Aujourd'hui me va »)

## Écrans produits (relevés sur le fichier)
| Section | États | A · écarts | Capturé |
|---|---|---|---|
| A · Aujourd'hui | haut, défilé, séance en cours, premier lancement, objectif rempli, semaine de deload, bloc terminé, aucune séance type | 0 | oui |
| B · Séance en salle | échauffement, série à faire, repos, machine prise, première fois, +2,5 kg, douleur, exercice remplacé, exercice terminé, tout fait, hors programme, aucune alternative, terminer la séance (écran dédié), terminer avec séries non faites, abandon sans série, bilan avec records | 0 | oui |
| C · Réglages | haut, défilé, Réglages Fluide nominal, point faible et écart, changer de bloc, passer en deload, mes exercices, avis douleur, filtre vide, importer, fichier illisible | 0 (1 libellé répété à bon droit : « Cible (repère 10-16) ») | oui |
| D · Séances | liste, aucune séance, nouvelle séance, détail, détail sans exercice, séance déjà en cours, réglage d'un exercice, exercice en douleur, ajouter un exercice, recherche sans résultat, choisir le muscle, modifier la séance, supprimer la séance type | 0 | oui |
| E · Progrès | nominal, aucune séance, semaine dernière et muscle en retard, détail d'un exercice, exercice fait une seule fois, historique, historique vide, détail d'une séance, supprimer une séance | 0 | oui |

B · composition : amplitude 4,0 à 5,8 selon l'écran (11 → 44 ou 64), une famille d'accent (indigo) ; vert, orange et rouge sont des états.

## User flow
Page `Fluide · User flow`, une section, légende « Comment lire ce flow », 5 couloirs (Aujourd'hui, Séance en salle, Réglages Fluide, Séances, Progrès), clones à 50 %, pastille par écran.
Couleurs pour Fluide : vert nominal · orange cas limite (vide, douleur, erreur, machine prise) · bleu geste qui enregistre · violet pilotage Fluide.

## Propositions locales — dette ouverte
| Proposition | Pourquoi | Promotion |
|---|---|---|
| Barre d'onglets (4 variantes) | Hardwood n'a pas d'onglets mobiles | à décider → flux-design-system |
| Stepper (grand, compact) | pas de stepper dans Hardwood | à décider |
| Contrôle segmenté + Segment (4 options max) | repris de Tabatime, absent du système | à décider |
| Puce (RPE, ressenti, muscle) | Suggestion Chip envoie une question, pas un choix | à décider |
| Feuille + voile | pas de feuille modale dans Hardwood | à décider |
| Barre de progression à valeur libre | la Progress Bar Hardwood fige sa valeur en instance | corriger Hardwood plutôt |
| Toast, courbe, frise des exercices | rien d'équivalent | à décider |

Au-delà de 3 propositions par écran sur B et C : le seuil de flux-ui est dépassé, le prochain pas est `flux-design-system` pour les faire entrer dans Hardwood.

## Écarts constatés entre Figma et le code
Résolus le 26/10/2026, code et Figma alignés :
| Point | Décision |
|---|---|
| Confirmations (abandon, deload, import, suppression de séance et de séance type) | feuille partout, plus aucun `confirm()` natif : le geste qui engage en premier (rouge s'il est irréversible), la sortie sans risque en dessous |
| Feuille « Machine prise » sans alternative | « Ajouter un exercice hors programme » (ouvre le catalogue) et « Attendre la machine » |
| Fin de séance (ressenti et journal) | écran dédié au lieu d'une feuille, demandé par Alexis le 26/10/2026 : barre Hardwood avec « Enregistrer », récapitulatif (séries faites / prévues, volume, records), ressenti en Radio Card Hardwood (Difficile, Correct, En forme, optionnel), journal en Text Field, brouillon gardé si l'app se ferme, alerte quand des séries manquent |
| Réordonner les exercices | mode **Modifier** dans la barre de navigation de la séance (remplace « Renommer ») : nom, flèches ↑ ↓ de 44 px, suppression de la séance type. Hors de ce mode, une ligne s'ouvre au toucher. Retenu parce qu'il tient d'une main entre deux séries, ce qu'un glisser-déposer au doigt ne garantit pas |

Nouveaux écrans : D · « modifier la séance » et « supprimer la séance type » (D passe à 13 états, 56 écrans au total), ajoutés au couloir 4 du user flow.

## Ajouts du 26/10/2026 — EMOM, Tabata, favoris, feuilles
| Point | Décision |
|---|---|
| Formats d'exercice | chaque exercice d'une séance type, ou ajouté hors programme, se fait en **Séries**, **EMOM** ou **Tabata**. Pendant la séance, le format a son chrono (EMOM : la minute ; Tabata : 20 s d'effort, 10 s de repos), un bip à chaque changement, et « Round fait » note charge et reps du round |
| Objectif Fluide | **Tabata de 8 rounds = 2 séries** ; **EMOM = 1 série par tranche de 3 rounds**. Les rounds n'entrent pas dans le 1RM ni dans la charge proposée (sous-maximaux). Règle validée par Alexis le 26/10/2026 |
| Favoris | « J'aime » devient **Favori ★** : étoile de 44 px au toucher dans le catalogue, le hors programme et Mes exercices ; groupe « ★ Favoris » en tête ; jamais d'étoile sur un exercice en douleur |
| Feuilles | d'après la Bottom sheet du fichier Wireframe — Mobile : poignée, **titre à gauche**, **croix 44 px à droite**, aucune action dans l'en-tête, validation en **bouton primary en bas du corps** avec un libellé explicite (« Lancer le bloc », « Créer la séance »…), intitulés de champ en surtitre |

Nouveaux écrans : B · Tabata prêt, Tabata effort, Tabata repos, EMOM en cours ; D · réglage EMOM, réglage Tabata. 63 écrans, 0 écart au comptage.
Nouvelles propositions locales : Ligne de catalogue (Favori oui/non), En-tête de feuille.

## Ajout du 26/10/2026 — Programmes (splits)
| Point | Décision |
|---|---|
| Choisir un programme | écran dédié « Programme » (Séances › Changer, ou état vide) : Full body (3 j), Haut / Bas (4 j), Push / Pull / Legs (3 j), PPL × 2 (6 j), Haut / Bas + PPL (5 j), Un muscle par séance (5 j), Personnalisé |
| Génération | séries de chaque muscle = cible des réglages Fluide ÷ nombre de séances où il revient ; 4 séries max par exercice ; gros muscles d'abord (premier exercice lourd) ; favoris d'abord, jamais un exercice en douleur, un exercice différent à chaque passage ; reps selon le bloc (intensité : 4-6 / 6-10) ; charge reprise de la dernière perf |
| Aperçu | séances générées, durée estimée, alerte au-delà de 75 min, séries par semaine face aux cibles |
| Remplacement | confirmation en feuille ; l'historique, les courbes et l'objectif restent |

Nouveaux écrans D : programme, programme aperçu, remplacer les séances (D passe à 18 états, 66 écrans au total).

## Contenu utilisé
Séances, exercices, cibles et cycles viennent du code (`js/store.js`) et du skill coach-fluide. Les chiffres de la semaine, perfs et dates sont un **jeu de démonstration — contenu à fournir** (tes vraies séances).

## Questions ouvertes
- Les propositions locales entrent-elles dans Hardwood ou restent-elles propres à Fluide ?
- Les cibles par défaut de la matrice sont-elles les tiennes ?
