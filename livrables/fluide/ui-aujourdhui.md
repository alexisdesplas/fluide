# UI — Fluide · A · Aujourd'hui   ·   Statut · Brouillon

**Date** · 26/10/2026 — **Régime** · système — **Mode** · 3 (réplique des écrans Hardwood de Tabatime) + 1 + 2
**Figma** · https://www.figma.com/design/QZ94FGPStTONZYIJcXnyHX/-Perso — page `Fluide · App` (sous `Tabatime · App`, intercalaire `── SPORT`)
**Système** · Hardwood, mode « Indigo DT » — atteint par : librairie abonnée (+ Phosphor Icons)
**Largeurs produites** · 390 (iPhone, seule largeur de l'app)
**Couverture composants** · 4/7 (Mobile Navigation Bar non requise ici ; Button, Pill, icônes Phosphor, Progress Bar trouvés — Progress Bar inutilisable, voir Écarts)

## Règles de page relevées — mode 3
| Règle | Valeur relevée | Nœud où elle a été lue |
|---|---|---|
| Gouttières écran racine | 20 | Tabatime `Séance / Prêt` 136:14631 (titre x=20) |
| Titre d'écran racine | Heading/xl 28/32, y=57 ; sous-titre Body/md discret | 141:16710, 141:16720 |
| Bouton icône rond | 40, fond/carte, x=330 y=78 | `Bouton réglages` 136:14646 |
| Cartes | frame fond/carte, bord/discret 1, radius/md, padding 16, gap 12 | `Aperçu de la séance` 121:10092 |
| Échelle d'espacement | 4 · 8 · 12 · 16 | `Contenu` 121:10091 et descendants |
| Chrome iOS | barre d'état 47, indicateur d'accueil y=831 | 136:14632, 136:15181 |

## Écrans produits
| Écran | Largeurs | États composés | A · écarts | B · amplitude / accents / plissement | Capturé |
|---|---|---|---|---|---|
| Aujourd'hui — haut · 390 · Hardwood | 390 | nominal milieu de semaine, haut de page | 0 | 4,0 / 1 / OK (le 56 % domine) | oui, à 1 |
| Aujourd'hui — défilé · 390 · Hardwood | 390 | nominal, bas de page (par muscle + bloc) | 0 | 4,0 / 1 / OK (les barres dominent) | oui, à 1 |

## Composition
**La zone qui domine** · le compteur « Objectif Fluide · semaine » en Display/sm 44, en tête d'écran.
**L'accent** · accent/texte (indigo) : action principale « Démarrer » et progression. Le vert etat/succes ne marque qu'un muscle à la cible.
**La rupture de grille** · aucune, c'est assumé : écran outil consulté entre deux séries.
**Le détail métier** · le rappel d'échauffement à la corde à sauter dans la carte de séance, la durée estimée, le muscle à la cible en vert.
**Régime** · outil.

## Composants
| Composant requis | Source | Où dans l'écran |
|---|---|---|
| Button (primary lg, ghost md) | système, set `4ed30e882ea429ee314bec15c8474660e2ff8ab8` | Prochaine séance, Titre de bloc |
| Pill (soft, accent) | système, set `e81db1c75e4bcb7f8385f19898529ed4747d3b78` | Objectif Fluide, Bloc en cours |
| Icônes CalendarCheck, ListBullets, ChartLine, SlidersHorizontal, Lightning | Phosphor Icons | Barre d'onglets, Rappel échauffement |
| Barre de progression | **proposition locale** | `⚠ Proposition — Barre de progression` ×12 |
| Barre d'onglets | **proposition locale** | `⚠ Proposition — Barre d'onglets` |
| Bouton icône rond | proposition reprise de Tabatime (déjà signalée) | `Bouton réglages` |

## Propositions locales — dette ouverte
| Proposition | Requêtes essayées | Atomes utilisés | Promotion |
|---|---|---|---|
| Barre d'onglets | « tabs », « Navigation », « segmented control » | variables fond/page, bord/discret, accent/texte, texte/discret ; Caption/sm/Medium ; Phosphor 24 | à décider par Alexis → flux-design-system |
| Barre de progression à valeur libre | « progress bar » (trouvée) — remplacée car valeur figée | fond/discret, accent/texte, etat/succes, radius/full | corriger Progress Bar dans Hardwood plutôt que promouvoir |

## Contenu utilisé
| Zone | Contenu posé | Source | Cas extrême couvert |
|---|---|---|---|
| Séance « Bas A », 5 exercices, 14 séries, ~52 min | séance type livrée avec l'app (seed) | code `js/store.js` | — |
| 56 %, 47 / 84 séries, valeurs par muscle | jeu de démonstration milieu de semaine | **contenu à fournir** — à remplacer par tes vraies séances | Fessiers à 0, Triceps à la cible |
| Cibles 12 / 6 séries | réglages Fluide par défaut (Pecs, Dos, Épaules, Quadris en progresser) | code `js/store.js` | — |
| Bloc Volume S3/6, RPE 7 | trame cycles du skill coach-fluide | `references/cycles.md` | — |

## Écarts constatés
| Écart | Où | Ce qu'on fait |
|---|---|---|
| Progress Bar Hardwood : largeur de `value` non surchargeable en instance, la barre reste à 40 % | toutes les barres | proposition locale ; à corriger dans le système |
| Card Hardwood (fond blanc, radius 14) non utilisée : Tabatime compose ses cartes en frames liées aux variables | cartes | le relevé de Tabatime fait autorité |
| Stepper et contrôle segmenté de l'app (pas du jour, réglages) absents du système | écrans C · Réglages Fluide | à traiter quand l'écran C sera composé (2 propositions de plus → seuil de 3 atteint) |

## Contrôle mécanique
- A · écarts : 0 / 0 (chrome iOS exclu, comme sur Tabatime ; un remplissage invisible non lié corrigé sur l'icône Lightning)
- B · amplitude 4,0 (11 → 44) · 1 famille d'accent (indigo ; vert = état) · plissement : OK, le pourcentage domine
- `figma_lint_design` : 0 critique ; 13 avertissements, tous dans la barre d'état iOS reprise de Tabatime
- Capture à 0,12 non faite (outil indisponible à cette échelle via le serveur officiel) : plissement jugé sur capture à 1

## Questions ouvertes
- Valides-tu ce cadre (ordre : compteur Fluide → prochaine séance → par muscle → bloc) avant que je compose B · Séance en salle, C · Réglages Fluide, D · Séances, E · Progrès ? — bloque la série
- Les cibles par défaut (Pecs, Dos, Épaules, Quadris en « Progresser ») sont-elles les tiennes ? — bloque le contenu réel
- Barre d'onglets et barre de progression : on les propose dans Hardwood ou elles restent locales à Fluide ? — bloque la promotion

## Contrôle anti-patterns
- Composant recréé alors qu'il existe : Progress Bar — recréée volontairement, raison écrite en Écarts.
- Faux contenu : les chiffres de la semaine sont un jeu de démo, marqué `contenu à fournir`.
- Une seule largeur : normal, l'app ne vise que l'iPhone.
- Aucun autre signal.
