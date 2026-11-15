# UI — Refonte en 3 onglets · écrans clés

- **Date** : 15/11/2026 · **Statut** : Brouillon, à affiner avec Alexis
- **Régime** : système (Hardwood, mode Indigo DT) · **Mode** : 3 (relevé des écrans Fluide existants) + 2 (deux propositions locales)
- **Figma** : /Perso `QZ94FGPStTONZYIJcXnyHX`, page `Fluide · App`, section `A′ · Aujourd'hui — refonte 3 onglets · 390 · Hardwood · Brouillon` (sous la section F · Compte)
- **Largeur** : 390 uniquement (memoire.md)

## Décisions de cadrage (Alexis, 15/11/2026)
- 3 onglets : Progrès · **Aujourd'hui** (centre, par défaut) · Réglages. L'onglet Séances disparaît.
- Séance du jour **hybride** : le programme (split) reste la base ; Fluide prend la séance type dont les muscles sont les plus en retard sur la cible de la semaine, en évitant ceux de la veille, et ajuste les séries à ce qu'il reste à faire.
- Le lieu se choisit **sur Aujourd'hui** (tuiles), la séance affichée se réécrit aussitôt ; « Démarrer » lance sans feuille.
- Séances types et programme recommandé passent dans **Réglages › Programme**.
- « Stats » redevient « Progrès ».
- Figma d'abord, avec une composition revue (pas seulement la navigation).

## Écrans produits
| Écran | Nœud | Amplitude typo | Notes |
|---|---|---|---|
| Aujourd'hui — à la salle | `391:26376` | 4 (44 / 11) | La séance est le titre ; « Démarrer » collé au-dessus des onglets |
| Progrès — semaine en cours | `391:26686` | 4 (44 / 11) | Objectif Fluide en tête, muscles triés du plus en retard |
| Réglages — avec le programme | `391:26914` | 2,55 | Écran outil : sections Programme, Bloc, Ton Fluide |

## Composition
- **Aujourd'hui** : zone dominante = nom de la séance en Display/sm 44 (« Bas A »), plus de carte autour. La raison du choix en accent (« Tes jambes sont les plus en retard… »). Liste « Au programme » sans carte, rythmée à l'espacement (28 entre groupes, 8 entre lignes). Action principale collée en bas, dans la zone du pouce. L'objectif de la semaine descend sous le pli et mène à Progrès.
- **Progrès** : le 56 % en Display/sm porte l'écran ; la légende dit que la séance du jour part du haut de la liste par muscle (lien explicite entre les deux onglets).
- **Réglages** : même grammaire qu'avant, nouvel ordre : Programme, Bloc, Ton Fluide (Réglages Fluide, Mes exercices, Mes lieux), puis le reste.
- Accent : une seule famille (indigo). Orange de l'échauffement = couleur d'état.

## Propositions locales (section `⚠ Propositions locales`)
| Proposition | Nœud | Pourquoi |
|---|---|---|
| ⚠ Proposition — Barre d'onglets · 3 | `391:26344` | Hardwood n'a pas de barre d'onglets ; dérivée de la barre à 4, gardée à côté tant que la refonte n'est pas validée |
| ⚠ Proposition — Tuile de lieu | `391:26374` | Choix rapide à 3 options avec une ligne de matériel ; ni Radio (trop haut pour 3 lieux) ni segmenté (réservé aux vues) |

## Contenu utilisé
Données des écrans Fluide existants (Bas A, volume par muscle 47 / 84, bloc Volume S3 / 6, corde S2) et des lieux par défaut d'Alexis (salle complète, haltères 5 kg, traction et dips).

## Écarts constatés
- Les écrans Fluide composent les cartes et textes en frames locales liées aux variables Hardwood, pas en instances : le comptage A « hors système » n'est pas à zéro, comme sur tous les écrans existants. Convention du fichier gardée.
- `accent/bord` n'existe pas dans la librairie : le bord de la tuile choisie prend `accent/texte`.
- Pas de style `Body/md/Semibold` dans la librairie : la tuile choisie reste en Medium, le bord de 2 px marque le choix.
- Microcopie : « Tout le matériel » devient « Tout équipée » sur la tuile Salle (tenait sur deux lignes) — `placeSummary` à aligner dans le code.

## Contrôle mécanique
- Retours à la ligne non voulus : aucun. Chevauchements : aucun hors action collante (voulu, le contenu défile dessous).
- Chaînes répétées : seulement des calques masqués hérités des instances (Réessayer, Premium).
- Captures regardées à 1 sur les trois écrans.

## Pistes de DA (15/11/2026) — régime composition, à choisir par Alexis

Alexis veut retravailler l'UI au passage et a fourni deux jeux de références. Deux pistes composées sur les mêmes trois écrans clés : **Aujourd'hui**, **Séance / Série à faire**, **Séance / Repos** (les deux écrans de séance sont ceux qu'Alexis a pointés, `202:310` et `202:669`). Tout est en proposition : aucune instance Hardwood, variables dans deux collections locales, textes sans style lié (dette à lever une fois la piste choisie, par `flux-direction-artistique` puis `flux-design-system`).

### Piste 1 · Lime — section `A″ · DA lime` (`392:27253`)
| Écran | Nœud | Amplitude |
|---|---|---|
| Aujourd'hui | `392:27254` | 5,3 (64 / 12) |
| Série à faire | `392:27379` | 6,7 (80 / 12) |
| Repos | `392:27479` | 6 (72 / 12) |

- Collection `⚠ Proposition — Fluide Lime` : noir verdâtre `#0D0F0D`, cartes `#191C19` / `#252924`, lime `#D4F05A` (15:1 sur la page), texte discret `#8F958C` (≥ 4,5:1 partout).
- **Ce qu'on prend des références** (dashboard Recovery, scan glycémie, filtre à air) : un seul accent lime réservé à l'action et à la sélection ; bento de tuiles très arrondies (20 / 28) ; contraste de graisses (surtitre en Light 28, nom en Bold 64, chiffres en Light 80) ; action en pilule avec pastille ronde ; barre d'onglets flottante en pilule.
- **Ce qu'on laisse** : photos et dégradés flous (aucun contenu photo dans Fluide, et illisible en salle), verre dépoli, thème clair, les valeurs hex des références.
- Inter gardée.

### Piste 2 · Pop — section `A‴ · DA pop` (`392:27571`)
| Écran | Nœud | Amplitude |
|---|---|---|
| Aujourd'hui | `392:27572` | 9,3 (112 / 12) |
| Série à faire | `392:27672` | 11,3 (136 / 12) |
| Repos | `392:27766` | 11,3 (136 / 12) |

- Collection `⚠ Proposition — Fluide Pop` : noir `#0A0A0A`, cartes `#161616` / `#222222`, jaune `#F1F15C` (16:1), rose `#F49AC1` (9,7:1), bleu `#58B4F7` (8,8:1).
- **Ce qu'on prend** (app de course jaune / rose / bleu) : titres en condensée italique capitale (Barlow Condensed ExtraBold Italic) ; un chiffre géant par écran ; trois couleurs à rôle fixe — jaune = action et charge, rose = objectif de la semaine et retard, bleu = lieu et repos ; grille de points pour compter (repos : 24 points de 5 s) ; onglets en icônes seules, l'actif sur pilule sombre.
- **Ce qu'on laisse** : la carte du parcours, les pictos colorés par tuile, la règle graduée, les capitales sur les textes courants (les noms d'exercices du programme restent en Inter bas de casse).
- **Écart assumé à la règle « un seul accent »** : trois teintes, tenables seulement si les rôles restent fixes sur toute l'app.

### Contrôle des deux pistes
- Retours à la ligne non voulus : aucun. Cibles tactiles : toutes ≥ 44 px après correction (Terminer, Remplacer, Options, Modifier passés de 36-40 à 44).
- Contenu sous l'action collante : voulu sur Aujourd'hui (défile), aucun sur les écrans de séance.
- Captures regardées à 1 sur les six écrans.
- Onglets en icônes seules (piste pop) et pilule (piste lime) : libellés accessibles à prévoir dans le code (`aria-label`).

### Décisions d'Alexis sur les pistes (15/11/2026)
- **Piste pop retenue.** La piste lime est écartée (section `A″` gardée pour mémoire).
- **Repos : règle graduée retenue** (`392:27987`) — chrono 168 px bleu, règle de 25 traits (un trait = 5 s, repères 0:00 à 2:00), curseur blanc à 1:24, traits restants en bleu, écoulés en gris. Écartées, à droite de la section : grille de points (`392:27766`), anneau de points (`392:27876`), chiffre qui se vide (`392:28104`).
- **Boutons retravaillés** sur tous les écrans pop :

| Rang | Forme | Usage |
|---|---|---|
| Primaire | pilule jaune 64 px, libellé condensé italique capitale 26 px | une seule par écran : Démarrer, Série faite, Lancer la série |
| Secondaire | pilule `fond/eleve` 44 px, icône au trait épais 18 px + libellé condensé 18 px | Remplacer, Options, Modifier |
| Contour | pilule sans fond, bord 1,5 px `bord/fort` (#5E5E5E, 3:1 sur la page) | Terminer : sortie, à l'écart |
| Rond | cercle `fond/eleve` 44 à 56 px, glyphe au trait épais | −, +, exercice précédent / suivant, −15, +15 |

- Reste à dessiner : états appuyé et désactivé des boutons ; durée de repos autre que 2:00 sur la règle (1:00 = 13 traits, 3:00 = 37 traits : pas du trait à vérifier).

- **Fonte de texte : Barlow** (Regular, Medium, SemiBold) à la place d'Inter, pour aller avec Barlow Condensed ExtraBold Italic. Essai fait sur un même bloc avec Inter, Barlow, Barlow Semi Condensed et Archivo : Barlow partage le dessin des titres ; Semi Condensed est trop serrée à 12-13 px ; Archivo et Inter sont plus larges et plus rondes. Corps montés d'un pixel : 13 / 16, 14 / 20, 16 / 20. La barre d'état garde la fonte d'iOS.
- **Retiré du fichier** à la demande d'Alexis : la section `A″ · DA lime` et sa collection de variables, les trois variantes de compte à rebours écartées, la planche d'essai des fontes. La section `A‴ · DA pop` est maintenant en y 8188 ; les nœuds lime cités plus haut n'existent plus.
- Alexis a retiré les légendes de matériel sous les pilules de lieu d'Aujourd'hui.

### Écrans de la DA pop (état au 15/11/2026, section `A‴ · DA pop`, y 8188)
| Écran | Nœud | Amplitude | Ce qui domine |
|---|---|---|---|
| Aujourd'hui | `392:27572` | 8,6 (112 / 13) | « BAS A » en jaune |
| Séance / Série à faire | `392:27672` | 10,5 (136 / 13) | la charge « 62,5 » en jaune |
| Séance / Repos · règle graduée | `392:27987` | 12,9 (168 / 13) | le chrono « 1:24 » en bleu |
| Progrès | `392:28320` | 9,2 (120 / 13) | « 56 % » en rose |
| Réglages | `392:28509` | 4,3 (56 / 13) | le titre ; écran outil, en tuiles |

- **Progrès** : choix de la semaine en deux pilules (l'active en blanc) ; objectif de la semaine en rose avec, à droite du pourcentage, séances, tonnage et pas ; **par muscle, un point = une série** (points roses faits, gris à faire), triés du plus en retard ; muscle à la cible en rose. La courbe par exercice et l'historique, sous le pli, ne sont pas dessinés.
- **Réglages** : sections Programme (Haut / Bas avec pastille « Recommandé », Séances types), Bloc (semaine 3 sur 6, sept segments dont le deload, Changer de bloc et Deload maintenant en boutons secondaires), Ton Fluide (Réglages Fluide, Mes exercices, Mes lieux). Une tuile par ligne, chevron à droite. Le reste (objectif, niveau, corde, routine, compte, données) n'est pas dessiné.
- Rôles de couleur tenus : pas de jaune hors action et charge (la pastille « Recommandé » est en blanc), rose réservé à l'objectif de la semaine, bleu au lieu et au repos.
- Contrôle : aucun débordement, cibles ≥ 44 px, fontes Barlow et Barlow Condensed seulement (barre d'état iOS à part). Captures regardées à 1.

### Correction des séries déjà faites (retour d'Alexis, 15/11/2026)
- Défaut relevé par Alexis sur Repos : les séries faites étaient réduites à une ligne de texte, alors que dans l'app toute série validée se corrige ou se retire (`#/seance/serie/:i/:k`).
- **Repos** (`392:27987`) : la tuile « Prépare la série 3 » et la ligne « Déjà fait » sont remplacées par une liste de trois lignes de 44 px : séries 1 et 2 (coche rose, charge × reps, RPE, crayon) qui ouvrent la correction ; série 3 « à venir » (pastille bleue, crayon) qui prépare la suivante.
- **Corriger une série** (`392:28643`, nouvel écran dédié, placé après Repos) : retour rond vers la séance, « Corriger la série 1 », exercice et heure de validation, charge au stepper, reps, effort ressenti, « Retirer » en contour et « Enregistrer » en primaire. La confirmation de retrait (feuille) n'est pas dessinée.
- Reste ouvert : sur **Série à faire**, la série précédente n'apparaît que dans le conseil (« Série 1 : 62,5 kg × 10 »), sans accès à la correction.

### Progrès · vue globale (demande d'Alexis, 15/11/2026)
- Alexis valide la vue de la semaine et le volume par groupe musculaire, et demande en plus une vue d'ensemble : objectifs remplis sur les dernières semaines, nombre de séances, etc.
- **Nouvel écran** `392:28740` (après la vue semaine `392:28320`). Le choix en tête devient **Semaine / Global** sur les deux vues (« Semaine dernière » disparaît : une semaine passée s'ouvrirait en touchant sa colonne dans la vue globale — à confirmer).
- Contenu, sur les 8 dernières semaines : objectifs remplis en rose (« 5 / 8 ») avec séances (28), moyenne par semaine (3,5) et tonnage (142 t) ; **semaine par semaine**, une colonne par semaine où un point = un muscle à sa cible (10 points), le nombre de séances dessous, la date du lundi en rose quand l'objectif est rempli ; deux tuiles de régularité par muscle (toujours à la cible, souvent en retard).
- Données d'exemple cohérentes entre elles (5 semaines à 10 muscles sur 10, 28 séances au total, semaine en cours à 1 muscle sur 10 et 3 séances, comme sur la vue semaine). Ce ne sont pas les vraies données d'Alexis.

### Retours d'Alexis du 15/11/2026 (suite) — Réglages, Progrès, couleurs, corde, connexion

**Inventaire de la section `A‴ · DA pop` (15 écrans + planche de couleurs), dans l'ordre de la page**

| Écran | Nœud |
|---|---|
| Aujourd'hui | `392:27572` |
| Séance / Série à faire | `392:27672` |
| Séance / Repos · règle graduée | `392:27987` |
| Séance / Corriger une série | `392:28643` |
| Progrès · semaine | `392:28320` |
| Progrès · vue globale | `392:28740` |
| Progrès · exos | `392:29156` |
| Progrès · un exercice | `392:29415` |
| Progrès · séances | `392:29634` |
| Progrès · une séance | `392:29780` |
| Progrès · supprimer une séance | `392:29858` |
| Réglages | `392:28509` |
| Compte · se connecter | `392:29930` |
| Séance / Corde à sauter · effort | `392:29971` |
| Séance / Corde à sauter · repos | `392:30174` |
| Planche « Couleurs · une par sens » | `392:29517` |

**Réglages** (demande : tout voir et naviguer facilement). Grille de six tuiles en trois groupes, chacune avec sa valeur du moment et un fond doux à la couleur de son sens : Rythme (Ta semaine, Programme — violet), Muscles (Points forts et faibles, Objectif par muscle — rose), Exercices et matériel (Exercices favoris — jaune, Équipement — bleu). Dessous, « Et aussi » : **Objectif additionnel** (corde, 1 h non-stop — placé là à la demande d'Alexis, il remplace la ligne « Corde à sauter »), Bloc, Compte et données.

**Progrès** : quatre vues en pilules — Semaine, Global, Exos, Séances.
- *Exos* (demande : voir les progrès sur certains exercices) : liste des exercices suivis, favoris d'abord, avec 1RM estimé en jaune, courbe miniature, tendance (verte si ça monte, orange si ça baisse), « Tous les exercices ». Détail d'un exercice sur écran dédié : 1RM estimé / Charge max / Volume, chiffre géant, écart sur 6 semaines, courbe, séances avec le record marqué.
- *Séances* (demande : voir ses séances et pouvoir les supprimer) : liste par mois avec ressenti ; détail d'une séance (durée, séries, volume, exercices, journal) ; « Supprimer la séance » en rouge, puis feuille de confirmation « Supprimer définitivement / Garder la séance ».

**Couleurs** (demandes : une ou deux couleurs de plus, puis « exhaustives et permissives pour faire varier les écrans en fonction de leur sens »). Sept couleurs, chacune en trois niveaux (vif, moyen à 45 %, doux à 16 % sur le noir), variables `accent/{couleur}`, `-moyen`, `-doux` :

| Couleur | Vif | Contraste sur le noir | Sens |
|---|---|---|---|
| Jaune | #F1F15C | 16,5:1 | action, charge, séance du jour |
| Rose | #F49AC1 | 9,7:1 | objectif de la semaine, volume par muscle |
| Bleu | #58B4F7 | 8,8:1 | repos, récupération, lieu |
| Vert | #6FE08A | 12,0:1 | fait, progression, record |
| Orange | #FF9B50 | 9,5:1 | effort, échauffement, baisse |
| Violet | #B9A2FF | 9,1:1 | programme, bloc, méthode Fluide |
| Rouge | #FF6B5E | 7,1:1 | supprimer, douleur, erreur |

Le texte vif sur son fond doux reste ≥ 5,8:1. L'ancienne règle « trois rôles fixes » est remplacée par « un écran prend la couleur de ce qu'il montre ». Appliqué : coches de séries et exercice fait en vert, conseil de progression en vert, échauffement en orange, tuiles de Réglages teintées.

**Corde à sauter** (demande : même fonctionnement que le Tabata). Chrono par bloc avec la règle graduée : effort en orange (« Effort 3 / 10 », 0:41, règle 0:00 à 1:00), repos en bleu (0:22, règle 0:00 à 0:30). Dix segments pour les efforts (faits en vert). Consigne et temps restant au total dans une tuile douce. Actions : recommencer le bloc, Pause, passer au bloc suivant. Sur un bloc d'une minute ou moins, un trait de la règle = 1 s (5 s au-delà).

**Connexion** : écran `Compte · se connecter` — retour vers Réglages, « Ton compte Fluide » (Fluide en violet), champs e-mail et mot de passe en pilule, « Me connecter », « Mot de passe oublié ? », « Créer mon compte ». Les dix autres écrans de compte (création, validation, session expirée…) ne sont pas déclinés.

**Barre d'onglets, Aujourd'hui démarqué** (demandes d'Alexis, 15/11/2026 : « démarquer l'onglet du centre », puis « juste une icône, sport ou séance », puis « gros icône en avant »). Trois onglets en icône seule. Au centre, un rond de 76 px avec un haltère de 38 px, qui dépasse de 12 px au-dessus de la barre et porte un liseré noir de 4 px ; Progrès et Réglages en ronds de 56 px, icône de 24 px. Aujourd'hui non sélectionné = aplat jaune, icône noire (la couleur de la séance du jour, bien en avant) ; sélectionné = aplat blanc, ce qui évite deux aplats jaunes avec « Démarrer » juste au-dessus. **Onglets de côté** : plus de disque blanc quand ils sont sélectionnés (Alexis : « ça fait bizarre sur les autres pages », deux disques pleins côte à côte) — l'icône passe en blanc et un point de 6 px se pose dessous ; non sélectionnée, elle est grise. Le même point marque le rond central quand on est sur Aujourd'hui. Sur Aujourd'hui, Alexis a placé « Démarrer » à y 672 : le rond mord de quelques pixels dans le bas du bouton, son liseré noir fait l'encoche. Appliqué aux six écrans à onglets. Une première version en pilule avec libellé « AUJOURD'HUI » a été écartée par Alexis. Les trois onglets étant en icône seule, libellés accessibles à prévoir dans le code (`aria-label`).

**Essai en cours — barre en bandeau gris foncé** (idée d'Alexis, 15/11/2026). Sur Aujourd'hui, Alexis a transformé la barre en bandeau pleine largeur collé en bas (y 746, 390 × 98 px), en gris foncé #1D1D1D, avec le liseré du rond central dans le même gris. Reproduit sur Progrès · semaine (`392:28320`) pour comparer, puis **rejeté par Alexis** (« non j'aime pas en fait ») : retiré de Progrès. Le bandeau posé par Alexis sur Aujourd'hui est encore en place (variable `fond/barre`), à lui de dire s'il part aussi.

**Essais en cours — la barre sur Progrès** (Alexis : bien sur Aujourd'hui, « bof » sur Progrès). Constat : sur Aujourd'hui le rond s'appuie sur le bouton « Démarrer » ; sur Progrès, le gros rond jaune flotte seul sur le noir, à côté d'un écran rose. Trois essais posés sous l'écran Progrès, à choisir :
| Essai | Nœud | Idée |
|---|---|---|
| A, B, C | retirés | disque sombre à haltère jaune · anneau jaune sans aplat · capsule flottante : écartés par Alexis (« autre proposition ») |
| D, E | retirés | rond blanc · rond à la couleur de la page : écartés, Alexis demande de rester cohérent sur les couleurs (le jaune est la couleur de la séance, le blanc celle de la sélection, le rose celle de l'objectif) |
| F | `392:31617` | rond jaune ramené à 64 px, aligné sur les deux autres icônes, sans dépasser de la barre |
| G | `392:31803` | pilule jaune de 112 × 56 px avec l'haltère : la forme des boutons de l'app (« Démarrer », pilules de Progrès), alignée |
| H | `392:31989` | rond jaune de 76 px posé sur un halo jaune doux de 108 px |

**Tranché par Alexis, directement dans Figma (15/11/2026)** — les essais F, G, H et le bandeau gris sont retirés. Version retenue : **le bouton central est un rond blanc à haltère noir sur toutes les pages** (la règle « reste jaune » que j'avais notée ne tient donc plus). Sur Progrès (4 vues) et Réglages, il fait 64 px avec un haltère de 32 px, aligné sur le bas de la barre, sans dépasser ; sur Aujourd'hui, il garde 76 px et dépasse pour mordre dans « Démarrer ». Onglet de côté sélectionné : icône blanche et point dessous. Mise au propre après son passage : blanc relié à `texte/fort` (il était en dur, et relié par erreur à une variable claire `fond/page` #F4F5F9 sur Réglages), liseré à 4 px, 66 px ramenés à 64 pour tenir la grille de 4.

Tranché par Alexis (15/11/2026) : **le rond reste à 76 px sur Aujourd'hui** et à 64 px sur les autres pages. Le grand rond qui dépasse est donc l'état « tu es sur Aujourd'hui » ; ailleurs il se range dans la barre. À prévoir dans le code : une transition de taille et de position du rond au changement d'onglet (64 ↔ 76 px, remontée de 12 px), coupée si l'utilisateur a demandé moins d'animations.

Les quatre autres écrans à onglets (Progrès global, exos, séances, Réglages) gardent la barre flottante avec le rond jaune, en attendant le choix.

### Page `Fluide · User flow` refaite en DA pop (demande d'Alexis, 15/11/2026)

- **Tranché par Alexis** : l'ancien flow (6 parcours, 85 écrans Hardwood à 50 %, calés sur les 4 anciens onglets) est **supprimé** ; le nouveau montre les écrans pop, avec des parcours adaptés aux 3 onglets. Les 85 écrans Hardwood restent dans la page `Fluide · App`.
- Section `User flow — Fluide, 3 parcours · DA pop · écrans de Fluide · App à 100 %` (`392:32332`, 4270 × 8600). Écrans clonés **à 100 %**, verrouillés ; police Barlow ; légende « Comment lire ce flow » ; pastilles, libellés et légende dans des groupes.

| Parcours | Écrans | Flèches (le geste) |
|---|---|---|
| 1 · Aujourd'hui (onglet du centre) | Aujourd'hui → Corde · effort → Corde · repos → Série à faire → Repos ; dessous, Corriger une série | Démarrer Bas A · Fin de l'effort · Dix efforts faits · Série faite · Lancer la série 3 (retour) · Toucher une série faite |
| 2 · Progrès (onglet de gauche) | Semaine → Vue globale → Exos → Un exercice ; dessous, Séances → Une séance → Supprimer une séance | Pilule Global · Pilule Exos · Toucher un exercice · Pilule Séances · Toucher une séance · Supprimer la séance |
| 3 · Réglages (onglet de droite) | Réglages → Se connecter | Compte et données |

- Pastilles (sens gardé de l'ancien flow) : vert nominal (11), orange cas limite avec contour (Corriger une série), bleu geste qui enregistre (Série à faire, Supprimer une séance, Se connecter), violet pilotage Fluide avec contour (Réglages). Une phrase par pastille, sur une ligne.
- Contrôle : 15 écrans, 15 pastilles de 56 px (une ligne), 13 flèches, libellés ≤ 236 px dans la gouttière de 300 ; capture de la section regardée.
- Manques visibles dans ce flow, faute d'écrans pop : choix du lieu « chez moi » et séance réécrite, fin de séance et bilan, Tabata / EMOM / AMRAP, remplacer un exercice, Ta semaine et programme, réglage d'un muscle, exercices favoris, équipement d'un lieu, objectif additionnel, bloc, création et validation de compte.

**Contrôle** : aucun texte hors des marges, fontes Barlow et Barlow Condensed seulement, cibles tactiles ≥ 44 px (les lignes de 38 px relevées sont des listes non tactiles : programme d'Aujourd'hui, exercices d'une séance). Captures regardées sur chaque écran.

### Tous les écrans en DA pop — 100 écrans (demande d'Alexis, 15/11/2026)

Section `A‴ · DA pop — tous les écrans · 390 · Brouillon` (`392:27571`) de `Fluide · App`. Les écrans sont rangés sur une grille : x = 80 + colonne × 470, y = 80 + rangée × 1004. La planche de couleurs est sous la dernière rangée. Construits avec une boîte à outils unique (mêmes boutons, tuiles, tailles), en frames locales liées aux variables `⚠ Proposition — Fluide Pop` — pas encore en composants.

| Rangée | Domaine | Écrans, dans l'ordre des colonnes |
|---|---|---|
| 0 | Aujourd'hui (12) | à la salle · chez moi · au street · changer de séance (feuille) · séance en cours · premier lancement · objectif rempli · semaine de deload · après une pause · semaine de reprise · bloc terminé · jour long de corde |
| 1 | Séance, chemin (17) | échauffement avant de partir · corde effort · corde repos · corde en pause · échauffement jour long à part · matériel du jour · série à faire · première fois · progression · tempo lent · superset · repos · repos terminé « à toi » · corriger une série · retirer une série (feuille) · exercice terminé · toutes les séries faites |
| 2 | Séance, écarts et fins (14) | remplacer l'exercice (feuille) · aucune alternative · options · voir le mouvement · exercice en douleur · Tabata prêt · effort · repos · EMOM · circuit AMRAP · terminer la séance · séries non faites · abandon sans série · bilan |
| 3 | Progrès (13) | semaine · semaine sans séance · une semaine passée · pas du jour · vue globale · exos · exos, rien à tracer · un exercice · un exercice fait une fois · séances · aucune séance · une séance · supprimer une séance |
| 4 | Réglages, rythme et programme (14) | Réglages · ta semaine · programme recommandé · aperçu · remplacer les séances (feuille) · séances types · une séance type · modifier · supprimer (feuille) · réglage d'un exercice · en Tabata · ajouter un exercice · recherche sans résultat · réordonner au doigt |
| 5 | Réglages, muscles et matériel (14) | points forts et faibles · objectif par muscle · réglage d'un muscle · exercices favoris · avis sur un exercice · aucun exercice évité · équipement · équipement d'un lieu · objectif additionnel · bloc · nouveau bloc · passer en deload (feuille) · préparer la reprise · toi |
| 6 | Compte et données (16) | sans compte · se connecter · identifiants incorrects · créer mon compte · compte déjà existant · adresse à valider · mot de passe oublié · e-mail envoyé · nouveau mot de passe · quelles données garder · connecté, à jour · session expirée · se déconnecter (feuille) · pas du jour automatiques · importer une sauvegarde (feuille) · fichier illisible (feuille) |

**Décisions prises en dessinant** (à valider par Alexis là où ce n'est pas lui qui l'a demandé)
- Aujourd'hui : pilule « Changer » à côté de « Séance du jour », qui ouvre la feuille des séances types. « Démarrer » reste collé en bas ; le fond des commandes commence à y 653.
- Pendant la séance, le titre de l'exercice réserve deux lignes (72 px) : la charge, les reps et le bouton principal sont à la même hauteur d'un exercice à l'autre (retour d'Alexis sur des blocs de tailles différentes).
- Bouton rond « Voir le mouvement » à côté de Remplacer et Options, ajouté aussi sur les deux écrans clés.
- Charges machine et poulie en lbs avec les kg à côté (« 90 lbs · 40,8 kg »), barre et haltères en kg.
- Pas du jour : écran dédié ouvert depuis Progrès (ils avaient quitté Aujourd'hui).
- Séance type : l'ordre des exercices se change en glissant au doigt, par une poignée à gauche de chaque ligne ; plus de flèches (demande d'Alexis). État « en train de glisser » dessiné.
- Réglages : bouton de compte en haut à droite du titre (nuage vert quand le compte est à jour), en plus de la ligne « Compte et données » (retour d'Alexis : l'accès était sous le pli).
- Feuilles : seulement pour confirmer (retirer, supprimer, remplacer, déconnexion, import) et pour les choix rapides (changer de séance, remplacer, options, mouvement), comme le veut la règle du projet.

**Contrôle sur les 100 écrans** : tous en 390 × 844 ; polices Barlow et Barlow Condensed seulement (barre d'état iOS à part) ; aucun texte hors cadre ; aucune rangée trop pleine ; aucun contenu sous une barre d'actions. Une capture regardée sur environ un écran sur deux ; les autres sont contrôlés par mesure seulement.

**User flow complet** — page `Fluide · User flow`, section `User flow — Fluide, 10 parcours sous 3 onglets · DA pop` (`393:40925`, 5650 × 33888). Il remplace le flow à 3 parcours décrit plus haut. 100 écrans clonés à 100 %, 100 pastilles sur une ligne, 47 flèches avec leur geste, 55 contours (orange et violet).

| Onglet | Parcours | Écrans |
|---|---|---|
| Aujourd'hui | 1 · choisir et lancer la séance | 12 |
| Aujourd'hui | 2 · mener la séance | 10 |
| Aujourd'hui | 3 · écarts pendant la séance | 14 |
| Aujourd'hui | 4 · autres formats, autres fins | 7 |
| Progrès | 5 · la semaine et l'ensemble | 5 |
| Progrès | 6 · exercices et séances | 8 |
| Réglages | 7 · rythme et programme | 14 |
| Réglages | 8 · muscles, exercices, matériel | 10 |
| Réglages | 9 · bloc et reprise | 4 |
| Réglages | 10 · compte et données | 16 |

Un écran sans flèche dans le flow est un état (vide, erreur, variante) : sa pastille dit quand il apparaît.

**Ce qui reste**
- Aucun des 85 nouveaux écrans n'a été validé un par un par Alexis ; les textes sont provisoires.
- Pas de composants : une retouche de bouton ou de barre d'onglets se refait écran par écran tant que la librairie n'existe pas.
- États appuyé, désactivé et chargement des boutons non dessinés.
- Le flow est fait de clones : un écran modifié dans `Fluide · App` doit être recloné dans le flow.

## Questions ouvertes
- Ta semaine : clarifié avec Alexis le 15/11/2026 — il parlait du réglage existant, **combien de séances par semaine**. Un seul nombre, pas de réglage de jours à part. La tuile affiche « 4 séances · par semaine · 60 min chacune ». L'écran de réglage en DA pop n'est pas dessiné.
- Corde : boutons « recommencer » et « passer » en icône seule, à confirmer ; pause, fin de séance corde et jour long non dessinés.
- Vue globale : période fixe de 8 semaines, ou au choix (bloc en cours, 3 mois) ? Comment compter une semaine de deload ou de reprise, où la cible est divisée par deux (hypothèse déjà ouverte dans memoire.md) ? Autres chiffres attendus (pas, corde, records) ? à demander.
- Série à faire : où mettre l'accès aux séries déjà faites (la place manque sous les tuiles Reps et Effort) ? à demander.
- Chiffres tabulaires de Barlow à vérifier pour les chronos (sinon le temps « danse » à chaque seconde).
- Progrès, Réglages et les autres écrans de séance ne sont pas encore déclinés en DA pop.
- Pas du jour : la saisie quittait Aujourd'hui ; dans Progrès (tuile « Pas moy. 7 j » qui ouvre la saisie) ou ailleurs ? à demander.
- Barre d'onglets : marquer davantage l'onglet central (Aujourd'hui) ? à demander.
- Changer de séance : feuille rapide avec les séances types, ou écran dédié ? à demander.
- États à composer après validation : chez moi (séance réécrite), séance en cours, semaine remplie, premier lancement, reprise, deload, jour long de corde, muscle travaillé la veille.

## Contrôle anti-patterns
- Composant recréé sous un autre nom : non (3 recherches, la barre et la tuile n'existent pas dans Hardwood).
- Tout séparé par des cartes : réduit sur Aujourd'hui ; Progrès et Réglages gardent leurs cartes (données groupées).
- Seul état composé = nominal : **oui, volontairement** — cadre visuel à valider avant la série.
- Réglages sous l'amplitude 3 : écran outil, assumé.
