# UI · Superset et triset en séance

- Date : 18/11/2026
- Régime : système (DA pop, section `A‴` de `Fluide · App`), mode 3 · répliquer l'écran de séance existant
- Figma : fichier /Perso `QZ94FGPStTONZYIJcXnyHX`, page `Fluide · App`, section `A‴ · DA pop — tous les écrans`
- Largeur : 390 (iPhone)
- Statut : référence validée par Alexis le 18/11/2026, série composée (section `A‴`, rangée y = 7108), présentée en parcours 11 du User flow, codée en v0.12.0

## Problème

Un superset s'affiche aujourd'hui comme des exercices séparés. Seuls « Superset A1 » dans l'en-tête et « puis {exercice}, sans repos » sous le titre le signalent. On ne voit jamais le tour entier, ni où on en est (tour 2 / 4, A1 fait, A2 à faire), et le repos ne montre que le premier exercice du tour suivant.

## Comportement actuel relevé dans le code (`logSet`, `js/store.js`)

- Série validée sur un exercice groupé : on passe au membre suivant du groupe qui a moins de séries que celui-ci, sans repos.
- Tour fini : repos = repos du **dernier** membre, puis retour au premier membre encore ouvert.
- Un membre qui a fini ses séries sort des tours ; les autres continuent (séries inégales).
- Dernier tour du dernier groupe de la séance : pas de repos.
- Passer un membre en EMOM ou Tabata le sort du superset (message dans Options).
- « Remplacer » garde le groupe : l'exercice de remplacement prend la place dans le superset.
- Les flèches Exercice précédent / suivant permettent de faire A2 avant A1.
- Le circuit AMRAP (kettlebells hors salle) réutilise le groupe avec son propre écran : hors périmètre.

## États à composer (un par frame)

| # | État | Ce que l'écran doit montrer |
|---|---|---|
| 1 | Tour 1, A1 à faire | Le bloc du tour (A1 en cours, A2 à suivre), saisie de A1 |
| 2 | A2 à faire, sans repos | A1 coché avec sa série, A2 en cours, « repos 2:00 après le tour » |
| 3 | Repos après le tour | Chrono, puis le tour suivant entier préparé : A1 et A2 avec leurs charges |
| 4 | Tour 2 / 4, A1 à faire | Progression des tours, séries précédentes visibles |
| 5 | Dernier tour | « Dernier tour » signalé, pas de repos si c'est la fin de séance |
| 6 | Superset terminé | Bilan des deux exercices (séries, volume, record), « Ensuite : {exercice} » |
| 7 | Triset | Trois lignes dans le bloc du tour, C1 → C2 → C3 |
| 8 | Séries inégales | A2 fini avant A1 : A2 coché « terminé », A1 seul au dernier tour, repos de A1 |
| 9 | Exercice remplacé | A2 remplacé (machine prise) : le bloc garde la place, nouveau nom |
| 10 | Corriger une série du tour | Toucher la série de A1 pendant A2 ouvre l'écran « Corriger une série » |
| 11 | Ordre inversé | A1 pris : on fait A2 d'abord, le tour se complète quand même |
| 12 | Sortie du superset | Un membre passé en EMOM ou Tabata : message, le bloc devient un exercice seul |

## Écran de référence · « Superset · A2 à faire » (`396:7766`)

- Base : clone de « Série à faire · superset » (`393:35397`), règles de page reprises telles quelles (gap 24 entre blocs, titre sur deux lignes réservées, commandes en bas).
- Nouveau : **bande du tour** à la place du sous-titre, faite des lignes de série de l'écran Repos (`392:28616`), une case par exercice du superset. A1 fait : coche verte, charge × reps en premier, nom dessous ; A2 en cours : pastille « A2 » jaune (couleur de l'action), « À toi ».
- La case d'une série faite se touche pour la corriger (même geste que la liste du Repos).
- Sous la charge : « Puis repos 2:00, et tour 3. » ; bouton « Série faite, repos ».
- Comptages : valeurs en dur 0, faux contenu 0, amplitude 8 (13 → 104 px), aucun retour à la ligne non voulu, contenu à 727 px pour des commandes à 730 (3 px de marge). Plissement à vérifier à l'œil (l'outil ne descend pas sous 0,5).
- Tailles 13, 17, 22 et 26 px héritées de l'écran source, hors grille 4/8 : à corriger sur tout l'écran de séance, pas seulement ici.

## Écrans produits (section `A‴`, rangée y = 7108)

| Écran | Nœud | Écarts (en dur · faux contenu) | Amplitude |
|---|---|---|---|
| Superset · tour 1, A1 à faire | `396:7888` | 0 · 0 | 8 |
| Superset · A2 à faire (référence) | `396:7766` | 0 · 0 | 8 |
| Superset · repos après le tour | `396:8619` | 0 · 0 | 12,9 |
| Superset · dernier tour | `396:8008` | 0 · 0 | 8 |
| Superset · superset terminé | `396:8738` | 0 · 0 | 9,2 |
| Superset · triset, D2 à faire | `396:8129` | 0 · 0 | 8 |
| Superset · séries inégales | `396:8256` | 0 · 0 | 8 |
| Superset · exercice remplacé | `396:8377` | 0 · 0 | 8 |
| Superset · corriger une série du tour | `396:8823` | 0 · 0 | 10,5 |
| Superset · ordre inversé | `396:8498` | 0 · 0 | 8 |
| Superset · options, superset et format | `396:8888` | 0 · 0 | 10,5 |

Retour d'Alexis sur l'écran Options (`396:8986`) : pouvoir mettre l'exercice en superset avec l'exercice suivant ou un autre. Section « Superset, pour cette séance » ajoutée à la feuille (avec A1 comme prévu, avec l'exercice suivant, seul). Dans le code, la feuille Options ouvre une feuille « Superset » qui liste les exercices restants.

User flow : parcours 11 « Aujourd'hui — supersets et trisets », 11 écrans à 100 %, nominal en ligne 0 (tour 1 → A2 → repos → dernier tour → bilan), écarts en ligne 1.

## Contrôle anti-patterns

Aucun signal sur les écrans produits. Restent hors grille 4/8 les tailles 13, 17, 22 et 26 px héritées de l'écran de séance (à corriger sur toute la série, pas ici).

## Questions ouvertes

1. Bande du tour sous le titre, à la place du sous-titre (choix pris pour l'écran de référence) : à valider.
2. Au repos, faut-il préparer les deux charges (A1 et A2) ou seulement la première ?
3. Le nombre de tours affiché (« tour 2 / 4 ») : celui du membre qui a le plus de séries (choix pris) ?
