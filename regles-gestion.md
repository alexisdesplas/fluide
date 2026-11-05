# Règles de gestion — Fluide

Relevé du 05/11/2026 sur la v0.7.3 (commit `e2377f1`), mis à jour pour la v0.7.4. **Le code fait foi** : ce registre décrit ce que fait l'app, pas ce qu'elle devrait faire. Les différences avec l'intention sont listées dans [Écarts](#écarts).

## Lire ce registre

- **Règle de gestion** : une contrainte, un calcul ou une décision qui porte sur le métier ou les données de l'utilisateur, et qu'on peut vérifier. Sont exclus le visuel, l'accessibilité, la navigation et l'infrastructure.
- **Identifiant** : `RG-<domaine>-<numéro>`. Il ne change jamais. Une règle retirée garde son numéro, marqué « Retirée » ; une nouvelle règle prend le numéro suivant de son domaine.
- **État** :
  - **Active** : la règle s'applique.
  - **Sans accès** : le code existe, mais aucun écran n'y mène.
  - **E-xx** : la règle s'applique, avec un écart décrit plus bas.
- **Source** : le fichier et la fonction, plutôt qu'un numéro de ligne qui bougerait. Les fichiers sont dans `js/`, sauf `schema.sql` dans `supabase/`.
- **Mise à jour** : toute PR qui ajoute, change ou retire une règle met à jour ce fichier.

**Vérification.** Toute la logique a été relue (`store.js`, `compte.js`, les vues, `schema.sql`). Une partie des règles de `store.js` a aussi été exécutée sous Node : équivalences de séries, plafond hebdomadaire, double progression, génération et classement des programmes, deload, matériel du jour, AMRAP, supersets. Les règles d'écran et de Supabase ont été relues, pas exécutées, sauf les 5 corrections de la v0.7.4, essayées aussi dans l'app.

## Décompte

| Domaine | Préfixe | Règles |
|---|---|---:|
| Volume et objectif Fluide | VOL | 16 |
| Blocs et deload | BLC | 9 |
| Programme recommandé | PRG | 21 |
| Plan corde à sauter | COR | 11 |
| Exercices et catalogue | EXE | 9 |
| Charges | CHG | 12 |
| Performance et progression | PER | 8 |
| Séance en cours | SEA | 33 |
| Matériel du jour | MAT | 10 |
| Séances types | TPL | 8 |
| Pas du jour | PAS | 8 |
| Compte et données | CPT | 9 |
| **Total** | | **154** |

Dont 3 sans accès (RG-SEA-28 à 30).

## Volume et objectif Fluide

| ID | Règle | Source | État |
|---|---|---|---|
| RG-VOL-01 | Dix muscles sont suivis : Pecs, Dos, Épaules, Biceps, Triceps, Quadris, Ischios, Fessiers, Mollets, Abdos. Les séries d'Avant-bras, d'Échauffement et de Mobilité ne comptent pas dans l'objectif. | `store.js` › `MUSCLES`, `weeklySets` | Active |
| RG-VOL-02 | Chaque muscle a un statut qui fixe son repère de séries par semaine : Maintenir 4-8 (cible par défaut 6), Progresser 10-16 (12), Point faible 16-22 (18). | `store.js` › `STATUS` | Active |
| RG-VOL-03 | Changer de statut remet la cible à la valeur par défaut du statut. La cible se règle ensuite de 0 à 30, même hors repère. | `views/profile.js` › `muscleView` | Active |
| RG-VOL-04 | Un muscle à cible 0 sort de l'objectif de la semaine et des programmes générés. | `store.js` › `weeklyGoal`, `generateProgram` | Active |
| RG-VOL-05 | Par défaut, Pecs, Dos, Épaules et Quadris sont en Progresser, les autres en Maintenir. | `store.js` › `seed` | Active |
| RG-VOL-06 | L'objectif d'un muscle (force, hypertrophie, endurance) fixe ses reps et son repos ; le statut fixe son volume. Force : 4-6 reps et 3 min sur le premier exercice d'un gros muscle dans la séance, 5-8 reps et 2 min 30 sinon. Endurance : 15-20 reps et 45 s. Hypertrophie : voir RG-PRG-09. | `store.js` › `GOALS`, `prescription` | Active |
| RG-VOL-07 | Changer l'objectif d'un muscle recale aussitôt les reps et le repos de ses exercices en séries dans les séances types. EMOM et Tabata ne bougent pas. | `store.js` › `setMuscle` | Active |
| RG-VOL-08 | Sur l'écran de réglage d'un muscle, rien ne change avant « Enregistrer » ; le retour annule. | `views/profile.js` › `muscleView` | Active |
| RG-VOL-09 | La semaine va du lundi au dimanche. Le compteur inclut la séance en cours, rattachée à sa date de début. | `store.js` › `weeklySets`, `startOfWeek` | Active |
| RG-VOL-10 | Objectif de la semaine = somme de min(séries faites, cible) ÷ somme des cibles. Le plafond par muscle empêche un muscle en trop de compenser un muscle en retard. Un muscle est « à la cible » dès que ses séries atteignent sa cible. | `store.js` › `weeklyGoal` | Active |
| RG-VOL-11 | Un Tabata compte 1 série par tranche de 4 rounds entamée : 8 rounds = 2 séries. | `store.js` › `roundsToSets` | Active |
| RG-VOL-12 | Un EMOM compte 1 série par tranche de 3 rounds entamée : 3 rounds = 1 série, 10 rounds = 4 séries. | `store.js` › `roundsToSets` | Active |
| RG-VOL-13 | En AMRAP, un tour vaut une série pour le muscle de chaque exercice du circuit. | `store.js` › `entrySets`, `endAmrap` | Active |
| RG-VOL-14 | Seules les séries validées comptent : les séries prévues mais non faites ne comptent pas. Une séance supprimée sort de l'objectif. | `views/workout.js` › `finishView` ; `store.js` › `deleteSession` | Active |
| RG-VOL-15 | Stats alerte sur un muscle hors Maintenir, à cible non nulle, resté sous 80 % de sa cible les 2 semaines pleines précédentes, s'il existe au moins une séance d'avant la semaine dernière. | `views/progress.js` › `progressView` | Active |
| RG-VOL-16 | Le volume prévu suppose chaque séance type faite une fois par semaine. Dans Réglages Fluide, un écart de plus de 2 séries avec la cible est signalé. | `store.js` › `plannedSetsOf` ; `views/profile.js` › `matrixView` | Active |

## Blocs et deload

| ID | Règle | Source | État |
|---|---|---|---|
| RG-BLC-01 | Un bloc dure N semaines (de 2 à 10, 6 par défaut) puis 1 semaine de deload. Il commence le lundi de la semaine où il est lancé. | `store.js` › `cyclePosition`, `startCycle` ; `views/profile.js` › `cycleSheet` | Active |
| RG-BLC-02 | Trois types de bloc, avec leur RPE cible : Volume 7, Intensité 8,5, Spécialisation 8. | `store.js` › `CYCLES` | E-08 |
| RG-BLC-03 | En deload, les séries prévues sont divisées par deux, arrondies au supérieur, avec 1 au minimum. | `store.js` › `startWorkout` | Active |
| RG-BLC-04 | En deload, les rounds d'EMOM et de Tabata sont divisés par deux, arrondis au supérieur, avec 2 au minimum. | `store.js` › `intervalEntry` | Active |
| RG-BLC-05 | En deload, le RPE cible passe à 6 et aucune indication de progression n'est donnée. | `views/workout.js` › `workoutView` ; `store.js` › `startWorkout` | Active |
| RG-BLC-06 | Le deload peut être avancé à la semaine en cours, après confirmation, sauf si le bloc est déjà en deload ou terminé. | `store.js` › `deloadNow` ; `views/profile.js` › `profileView` | Active |
| RG-BLC-07 | Après la semaine de deload, le bloc est « terminé » et un bilan est demandé. Aucun nouveau bloc ne démarre tout seul. | `store.js` › `cyclePosition` ; `views/today.js` › `cycleCard` | Active |
| RG-BLC-08 | Lancer un nouveau bloc archive le précédent avec la semaine atteinte. Le type suivant est présélectionné : Volume, puis Intensité, puis Spécialisation, puis Volume. | `store.js` › `startCycle` ; `views/profile.js` › `cycleSheet` | Active |
| RG-BLC-09 | Une séance garde le bloc, la semaine et l'état de deload du moment où elle a démarré. | `store.js` › `startWorkout`, `finishWorkout` | Active |

## Programme recommandé

| ID | Règle | Source | État |
|---|---|---|---|
| RG-PRG-01 | De 2 à 6 séances de muscu par semaine, dans Ta semaine comme dans Réglages ; une ancienne valeur hors bornes y est ramenée. De 30 à 90 min par séance, par pas de 15 min, échauffement compris (60 min par défaut). | `store.js` › `SESSIONS_PER_WEEK`, `SESSION_MINUTES`, `migrate` ; `views/templates.js` › `weekView` ; `views/profile.js` › `profileView` | Active |
| RG-PRG-02 | Sept programmes sont générés, plus un mode personnalisé sans génération. Nombre de séances demandées : Full body × 2 : 2 ; Full body : 3 ; Push / Pull / Legs : 3 ; Haut / Bas : 4 ; Haut / Bas + PPL : 5 ; Un muscle par séance : 5 ; PPL × 2 : 6. | `store.js` › `SPLITS` | Active |
| RG-PRG-03 | Un programme tient s'il demande au plus les séances disponibles. Seuls ceux-là sont listés, avec le personnalisé. Si aucun ne tient, seul le premier du classement est montré, avec son alerte. | `store.js` › `recommend` ; `views/templates.js` › `programView` | Active |
| RG-PRG-04 | Classement : d'abord ceux qui tiennent. Score = % de la cible couverte, +15 si chaque muscle revient au moins 2 fois, +10 si le nombre de séances est exact, −20 par muscle passé sous son plancher. À égalité, le plus proche des séances disponibles. | `store.js` › `recommend` | Active |
| RG-PRG-05 | Le premier du classement porte « Recommandé » s'il tient dans la semaine. | `views/templates.js` › `programView` | Active |
| RG-PRG-06 | Séries d'un muscle par séance = cible ÷ nombre de séances où il revient, arrondi, avec 1 au minimum. | `store.js` › `generateProgram` | Active |
| RG-PRG-07 | Pas plus de 4 séries par exercice dans un programme généré : au-delà, elles se répartissent sur plusieurs exercices (12 séries = 3 exercices de 4). | `store.js` › `generateProgram` | Active |
| RG-PRG-08 | Dans une séance générée, les gros muscles (Pecs, Dos, Quadris, Ischios, Fessiers) passent en premier. | `store.js` › `generateProgram` | Active |
| RG-PRG-09 | En hypertrophie : premier exercice de la séance sur un gros muscle 6-10 reps et 2 min 30 ; autres exercices d'un gros muscle 8-12 reps et 2 min ; petits muscles 10-15 reps et 1 min 15. En bloc Intensité : 4-6 reps sur ce premier exercice, 6-10 sinon. | `store.js` › `prescription` | Active |
| RG-PRG-10 | Le premier exercice d'un gros muscle est pris à la barre ou à la Smith quand c'est possible. | `store.js` › `generateProgram` | Active |
| RG-PRG-11 | Un exercice n'est candidat que s'il est du bon muscle, sans douleur, hors Melting pot et faisable avec le matériel de la salle. Les favoris passent en premier. | `store.js` › `generateProgram`, `byUsefulness` | Active |
| RG-PRG-12 | Un exercice différent à chaque passage, tant que le muscle en a d'autres disponibles. | `store.js` › `generateProgram` | Active |
| RG-PRG-13 | Charge de départ : la dernière charge maximale, sinon celle déjà prévue dans une séance type, sinon 20 kg (gros muscle) ou 8 kg (petit muscle), calée sur les pas du matériel. | `store.js` › `generateProgram` | Active |
| RG-PRG-14 | Durée estimée d'une séance : 45 s plus le repos par série, intervalle × rounds pour un EMOM, (effort + repos) × rounds + 1 min pour un Tabata, plus 5 min d'échauffement. | `store.js` › `estimate` | Active |
| RG-PRG-15 | Séance trop longue : les repos perdent d'abord 30 s, sans descendre sous 60 s (un repos déjà plus court reste tel quel). | `store.js` › `fitTime` | Active |
| RG-PRG-16 | Puis des séries sont retirées : Maintenir avant Progresser avant Point faible, petits muscles avant gros. Tant que possible, aucun muscle ne passe sous son plancher, soit le minimum entre sa cible et le bas de son repère, réparti sur ses séances. | `store.js` › `fitTime`, `generateProgram` | Active |
| RG-PRG-17 | Si le temps ne suffit toujours pas, le muscle passe sous son plancher : une alerte l'indique avec le temps nécessaire, et le programme est classé plus bas. | `store.js` › `fitTime`, `recommend` ; `views/templates.js` › `reasons` | Active |
| RG-PRG-18 | Les puces Points forts et Points faibles écrivent le statut (Maintenir, Point faible) et remettent la cible par défaut. Retirer un muscle d'une liste le remet en Progresser. L'objectif du muscle ne change pas. | `views/templates.js` › `strengthChips` ; `store.js` › `setMatrix` | Active |
| RG-PRG-19 | L'aperçu d'un programme se modifie, mais rien ne rejoint les séances avant « Utiliser ce programme ». Changer de programme repart de zéro. | `store.js` › `setDrafts` ; `views/templates.js` › `programView` | Active |
| RG-PRG-20 | Remplacer des séances types existantes demande une confirmation. L'historique, les courbes et l'objectif de la semaine restent. | `views/templates.js` › `programView` | Active |
| RG-PRG-21 | Les séances s'étalent sur la semaine selon leur nombre : 2 = lundi et jeudi ; 3 = lundi, mercredi, vendredi ; 4 = lundi, mardi, jeudi, vendredi ; 5 = lundi, mardi, mercredi, vendredi, samedi ; 6 = du lundi au samedi. | `store.js` › `SPREAD`, `weekPlan` | Active |

## Plan corde à sauter

| ID | Règle | Source | État |
|---|---|---|---|
| RG-COR-01 | Le plan dure 18 semaines, tous les jours : 5 séances faciles, 1 jour long, 1 jour récup, avec des blocs propres à chaque semaine. | `store.js` › `CORDE`, `ENDURANCE` | Active |
| RG-COR-02 | Deload les semaines 3, 7, 11 et 15. Le jour long de la semaine 18 est l'heure non-stop. | `store.js` › `ENDURANCE`, `CORDE` | Active |
| RG-COR-03 | Le jour récup est identique toute la durée du plan : 5 × 1 min, 30 s de repos. | `store.js` › `ENDURANCE` | Active |
| RG-COR-04 | La semaine du plan avance chaque lundi, reste bornée de S1 à S18 et peut être reculée pour refaire une semaine. | `store.js` › `enduranceWeek`, `setEnduranceWeek` | Active |
| RG-COR-05 | Le challenge est actif d'office, avec une S1 commencée le lundi 19/10/2026. « Aucun », choisi à la main, est conservé. | `store.js` › `seed`, `migrate`, `CORDE_START` | E-06 |
| RG-COR-06 | Activer le plan sans date de départ connue fait démarrer S1 le lundi de la semaine en cours. | `views/templates.js` › `weekView` ; `views/profile.js` › `profileView` | Active |
| RG-COR-07 | Les jours de muscu, la séance corde du jour (facile ou récup) remplace l'échauffement, bloc par bloc. | `views/workout.js` › `workoutView` ; `store.js` › `enduranceToday` | Active |
| RG-COR-08 | Le jour long se fait à part : ce jour-là, l'échauffement des Réglages reprend. | `views/workout.js` › `workoutView` ; `views/today.js` › `warmupLine` | Active |
| RG-COR-09 | Le jour long tombe le plus loin possible des séances jambes, de préférence un jour sans muscu et le week-end. Le jour récup suit, et les autres jours sont faciles. | `store.js` › `weekPlan` | Active |
| RG-COR-10 | Avec un objectif d'endurance, les jambes travaillent 2 fois par semaine au plus. Au-delà, la séance garde le haut du corps et les abdos, et « Full body » devient « Haut ». | `store.js` › `generateProgram` | Active |
| RG-COR-11 | Le travail des mollets devient 2 × 15 montées sur pointes, 3 fois par semaine, d'abord les jours jambes : jamais un exercice assis, repos de 1 min, jamais retirées pour gagner du temps. Les mollets sortent du calcul de couverture. | `store.js` › `generateProgram`, `recommend` | Active |

## Exercices et catalogue

| ID | Règle | Source | État |
|---|---|---|---|
| RG-EXE-01 | Ordre de proposition : Favori, Neutre, Je n'aime pas, Douleur ; puis les exercices déjà faits ; puis les plus courants ; puis l'ordre alphabétique. | `store.js` › `byUsefulness` | Active |
| RG-EXE-02 | Sans recherche ni filtre de muscle, le catalogue montre les favoris puis les 5 exercices les plus utiles de chaque muscle. Avec un filtre ou une recherche, jusqu'à 150 par groupe. Le Melting pot n'y figure jamais. | `views/templates.js` › `catalogue` | Active |
| RG-EXE-03 | Un exercice en Douleur n'entre ni dans un programme généré, ni dans une adaptation au matériel, ni dans la liste de « Remplacer » sans recherche. Il reste cherchable, ne peut pas être mis en favori, et une alerte s'affiche en séance. | `store.js` › `proposable`, `alternatives`, `variants`, `generateProgram` ; `views/workout.js` › `swapSheet`, `workoutView` | Active |
| RG-EXE-04 | Un exercice marqué « Pas dans ma salle » n'est plus proposé par les programmes et les alternatives, ni dans la liste de « Remplacer » sans recherche, pas plus qu'un exercice au matériel décoché. Une recherche les retrouve. | `store.js` › `proposable`, `available`, `setAbsent` ; `views/workout.js` › `swapSheet` ; `views/templates.js` › `catalogue` | Active |
| RG-EXE-05 | Créer un exercice n'est possible que si la recherche ne trouve pas ce nom exact. Il demande un des 10 muscles et un matériel ; le nom prend une majuscule. | `views/templates.js` › `pickerView` ; `store.js` › `createExercise` | Active |
| RG-EXE-06 | Le matériel de la salle garde au moins une famille cochée. Par défaut : machines et poulies, barres, haltères, poids du corps. | `store.js` › `DEFAULT_GEAR` ; `views/profile.js` › `profileView` | Active |
| RG-EXE-07 | La famille « Machines et poulies » couvre les machines, les poulies et la Smith. Barres, haltères, kettlebells, élastiques et poids du corps sont chacun une famille. | `store.js` › `GEAR` | Active |
| RG-EXE-08 | Le même mouvement avec un autre matériel se reconnaît au nom sans son matériel, sur le même muscle, hors douleur et exercice indisponible. Un seul exercice est retenu par matériel, le plus utile. | `store.js` › `variants`, `movement` | Active |
| RG-EXE-09 | Changer le matériel d'un exercice recale ses charges dans toutes les séances types. | `store.js` › `setEquip` | Active |

## Charges

| ID | Règle | Source | État |
|---|---|---|---|
| RG-CHG-01 | Les charges sont stockées en kg. Machine et poulie s'affichent et se saisissent en lbs, le reste en kg. | `store.js` › `inLbs`, `toLbs`, `fromLbs` ; `views/templates.js` › `charge` | Active |
| RG-CHG-02 | Barre et Smith vont de 0 à 300 kg par 2,5 ; poids du corps et élastique de 0 à 100 kg par 2,5. | `store.js` › `SCALES` | Active |
| RG-CHG-03 | Les haltères se comptent à l'unité : par 1 kg jusqu'à 10, puis par 2 kg jusqu'à 60. | `store.js` › `SCALES` | Active |
| RG-CHG-04 | Kettlebells : 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 28, 32, 36, 40, 44, 48 kg (et 0). | `store.js` › `SCALES` | Active |
| RG-CHG-05 | Machine et poulie : pile par 5 lbs jusqu'à 300 lbs, soit 2,3 · 4,5 · 6,8… kg. | `store.js` › `SCALES` | Active |
| RG-CHG-06 | La pile se règle par exercice : par 5 lbs jusqu'à un seuil (de 5 à 250), puis par 10, 15 ou 20. Les charges prévues sont recalées aussitôt. | `store.js` › `setStack`, `stackScale` | Active |
| RG-CHG-07 | Poulie démultipliée ½ : la saisie reste la valeur de la pile, chaque série garde son ratio, et volume et 1RM comptent la charge réelle. | `store.js` › `effWeight`, `logSet` | Active |
| RG-CHG-08 | Toute charge est calée sur la valeur autorisée la plus proche : création, programme, migration, changement de matériel. | `store.js` › `nearestWeight`, `migrate` | Active |
| RG-CHG-09 | Passer aux haltères divise la charge par deux ; en revenir la multiplie par deux. | `store.js` › `convertWeight` | Active |
| RG-CHG-10 | Une charge de 0 signifie poids du corps et s'affiche « PDC ». | `views/templates.js` › `charge` | Active |
| RG-CHG-11 | Remplaçant jamais fait en séance : kettlebell à 16 kg (gros muscle) ou 12 kg (petit), poids du corps à 0, sinon charge convertie depuis l'exercice remplacé. | `store.js` › `swapExercise` | Active |
| RG-CHG-12 | Remplaçant déjà fait en séance : il reprend sa dernière charge maximale, calée sur ses pas. | `store.js` › `swapExercise`, `pileFor` | Active |

## Performance et progression

| ID | Règle | Source | État |
|---|---|---|---|
| RG-PER-01 | 1RM estimé (Epley) = charge × (1 + reps ÷ 30). Une série de 1 rep vaut sa charge. | `store.js` › `e1rm` | Active |
| RG-PER-02 | Double progression : si, à la dernière séance, toutes les séries prévues ont atteint le haut de la fourchette à la charge maximale, on propose le cran de charge suivant et le bas de la fourchette. Jamais au poids du corps. | `store.js` › `suggestion` | Active |
| RG-PER-03 | Sinon : même charge et 1 rep de plus que le minimum réalisé, sans dépasser le haut de la fourchette. | `store.js` › `suggestion` | Active |
| RG-PER-04 | Sans historique : la charge prévue et le bas de la fourchette, sans indication. | `store.js` › `suggestion` | Active |
| RG-PER-05 | Un record compare le meilleur 1RM de la séance à tout ce qui précède. La première fois sur un exercice n'est pas un record, et un EMOM ou un Tabata n'en bat pas. | `store.js` › `sessionRecords` | Active |
| RG-PER-06 | Les rounds d'EMOM et de Tabata n'entrent ni dans les courbes ni dans le 1RM de l'exercice : leurs charges sont sous-maximales. | `store.js` › `exerciseHistory` | Active |
| RG-PER-07 | Volume d'une série = charge réelle × reps. | `store.js` › `setVolume` | Active |
| RG-PER-08 | Le RPE est optionnel et se note de 7 à 10. 10 − RPE donne les reps en réserve. | `views/workout.js` › `rpeField`, `rir` | Active |

## Séance en cours

| ID | Règle | Source | État |
|---|---|---|---|
| RG-SEA-01 | Une seule séance à la fois : tant qu'une séance est en cours, on ne peut qu'y revenir. | `views/templates.js` › `templateView` ; `views/today.js` › `todayView` | Active |
| RG-SEA-02 | Une séance type sans exercice ne se démarre pas. | `views/templates.js` › `templateView` ; `views/today.js` › `nextTemplate` | Active |
| RG-SEA-03 | Prochaine séance proposée : la séance type non vide faite le moins récemment. | `views/today.js` › `nextTemplate` | Active |
| RG-SEA-04 | Une série validée lance le repos, sauf la dernière du dernier exercice. | `store.js` › `logSet` | Active |
| RG-SEA-05 | Le repos s'ajuste de −15 s ou +15 s, et un tap lance la suite sans attendre. | `views/workout.js` › `workoutView` | Active |
| RG-SEA-06 | Fin de repos : bip et « À toi », avec le temps écoulé depuis la fin, jusqu'à la prochaine action. | `views/workout.js` › `workoutView` | Active |
| RG-SEA-07 | Après une action, le bouton principal est verrouillé 700 ms : un double tap ne note pas une série de plus. | `views/workout.js` › `guard`, `setCursor`, `done` | Active |
| RG-SEA-08 | « Annuler » reste disponible 5 s après chaque série. La série sort ; si c'était la dernière notée, son repos s'arrête. | `views/workout.js` › `done` ; `store.js` › `deleteSet` ; `ui.js` › `toast` | Active |
| RG-SEA-09 | Toute série validée de la séance en cours se corrige (charge, reps, RPE) ou se retire, sur un écran dédié. Rien ne change avant « Enregistrer ». | `views/workout.js` › `editSetView` ; `store.js` › `editSet`, `deleteSet` | Active |
| RG-SEA-10 | Superset ou triset : 2 ou 3 exercices en séries qui se suivent. EMOM et Tabata ne se lient pas. | `store.js` › `GROUP_MAX`, `canLink` | Active |
| RG-SEA-11 | Pas de repos entre les exercices d'un groupe ; le repos du dernier tombe après le tour. | `store.js` › `logSet`, `restAfter` | Active |
| RG-SEA-12 | Le format (Séries, EMOM, Tabata) se change avant la première série et sans chrono lancé, pour cette séance seulement. En EMOM ou Tabata, l'exercice sort de son superset. Un exercice en AMRAP n'a pas ce choix. | `store.js` › `setEntryFormat` ; `views/workout.js` › `canFormat` | Active |
| RG-SEA-13 | Valeurs par défaut : EMOM 10 rounds de 5 reps toutes les 60 s ; Tabata 8 rounds de 20 s d'effort et 10 s de repos, 10 reps. | `store.js` › `FORMAT_DEFAULTS` | Active |
| RG-SEA-14 | Repasser en Séries pendant une séance donne 3 × 8-12 reps et 1 min 30 de repos (2 séries en deload). | `store.js` › `setEntryFormat` | Active |
| RG-SEA-15 | Les chronos se calculent depuis l'heure de départ : ils survivent à la mise en veille. | `store.js` › `intervalState`, `amrapLeft` | Active |
| RG-SEA-16 | Lancer un chrono EMOM, Tabata ou AMRAP coupe le repos en cours. | `store.js` › `startClock`, `startAmrap` | Active |
| RG-SEA-17 | Arrêter un chrono demande une confirmation. Les rounds déjà notés restent. | `views/workout.js` › `workoutView` | Active |
| RG-SEA-18 | Remplacer un exercice vaut pour cette séance seulement : le programme ne bouge pas. | `store.js` › `swapExercise` | Active |
| RG-SEA-19 | Si des séries ou des rounds sont déjà faits, ils restent sur l'exercice d'origine, et le remplaçant reprend le reste dans le même format (1 au minimum). Le chrono en cours s'arrête. | `store.js` › `swapExercise` | E-13 |
| RG-SEA-20 | « Pas dans ma salle » coché au remplacement : l'exercice choisi le remplace aussi dans la séance type. | `views/workout.js` › `swapSheet` ; `store.js` › `keepSwap` | Active |
| RG-SEA-21 | Mettre en favori un exercice pris à la place le garde dans la séance type, avec son format. | `views/workout.js` › `favBtn` ; `store.js` › `keepSwap` | Active |
| RG-SEA-22 | Melting pot : un exercice caché par muscle, proposé en Tabata au remplacement. Ses rounds comptent pour ce muscle. Il n'est jamais proposé par un programme ni comme alternative. | `store.js` › `meltingPot`, `alternatives` ; `views/workout.js` › `swapSheet` | Active |
| RG-SEA-23 | Terminer sans série validée propose d'abandonner : rien n'est enregistré. | `views/workout.js` › `finishSheet`, `abandonSheet` ; `store.js` › `finishWorkout` | Active |
| RG-SEA-24 | Seuls les exercices avec au moins une série sont enregistrés. Une séance enregistrée marque le jour comme « séance faite ». | `store.js` › `finishWorkout` | Active |
| RG-SEA-25 | Le ressenti (Difficile, Correct, En forme) et le journal sont optionnels. | `views/workout.js` › `finishView` | E-07 |
| RG-SEA-26 | Une séance en cours peut être supprimée avec ses séries validées, après confirmation : rien n'est enregistré. | `views/workout.js` › `discardSheet` ; `store.js` › `discardWorkout` | Active |
| RG-SEA-27 | Une séance enregistrée peut être supprimée après confirmation : elle disparaît de l'historique, des courbes et de l'objectif. | `views/workout.js` › `summaryView` ; `views/progress.js` › `sessionView` ; `store.js` › `deleteSession` | Active |
| RG-SEA-28 | Modifier la séance en cours : séries de 1 à 12 sans passer sous les séries faites (rounds jusqu'à 60), ordre, liens, retrait confirmé si des séries sont faites, au moins un exercice gardé. | `views/workout.js` › `editWorkoutView` ; `store.js` › `setEntrySets`, `moveEntry`, `removeEntry` | Sans accès (E-10) |
| RG-SEA-29 | Exercice hors programme : tout le catalogue, en Séries, EMOM ou Tabata, ajouté après l'exercice en cours et jamais au milieu d'un superset. | `views/workout.js` › `extraSheet` ; `store.js` › `addExtra` | Sans accès (E-10) |
| RG-SEA-30 | En fin de séance modifiée, les changements peuvent être reportés dans la séance type. Une machine prise reste une exception. | `views/workout.js` › `finishView` ; `store.js` › `keepInTemplate` | Sans accès (E-10) |
| RG-SEA-31 | Durée de l'échauffement hors corde : la borne haute lue dans le réglage (« 3-5 min » donne 5 min), 5 min si rien n'est lisible. | `views/workout.js` › `workoutView` | Active |
| RG-SEA-32 | La mobilité dépend du premier exercice : hanches et chevilles pour Quadris, Ischios, Fessiers et Mollets, sinon épaules et coudes. 2 ou 3 séries d'approche sont indiquées. | `views/workout.js` › `workoutView` | Active |
| RG-SEA-33 | Recommencer l'échauffement demande une confirmation après 30 s de chrono. | `views/workout.js` › `workoutView` | Active |

## Matériel du jour

| ID | Règle | Source | État |
|---|---|---|---|
| RG-MAT-01 | La séance part du matériel de la salle. Il se change tant qu'aucune série n'est notée, avec au moins une famille cochée, pour cette séance seulement. | `store.js` › `startWorkout`, `setWorkoutGear` ; `views/workout.js` › `workoutView` | Active |
| RG-MAT-02 | Un exercice impossible passe au même mouvement avec un autre matériel, sinon au meilleur exercice du même muscle, jamais à un exercice déjà prévu dans la séance. | `store.js` › `setWorkoutGear` | Active |
| RG-MAT-03 | Un exercice ainsi remplacé revient à celui du programme dès que son matériel est recoché. | `store.js` › `setWorkoutGear` | Active |
| RG-MAT-04 | Un exercice déjà commencé ne bouge pas. | `store.js` › `setWorkoutGear` | Active |
| RG-MAT-05 | Sans équivalent, l'exercice reste et l'écran le signale : à remplacer en séance, ou recocher le matériel. | `views/workout.js` › `workoutView` | Active |
| RG-MAT-06 | Sans machines ni barres, on progresse en densité : kettlebell en AMRAP, poids du corps en EMOM, haltères en Tabata. Les autres matériels restent en séries. | `store.js` › `GEAR_FORMATS`, `outdoorGear`, `gearFormats` | Active |
| RG-MAT-07 | Tous les exercices kettlebell forment un seul circuit AMRAP, à la place du premier d'entre eux, sans repos, à 10 reps par défaut. | `store.js` › `gearFormats` | Active |
| RG-MAT-08 | Durée de l'AMRAP : environ 80 s par série prévue, entre 8 et 20 min. | `store.js` › `gearFormats` | Active |
| RG-MAT-09 | Quand le temps est écoulé, ou à l'arrêt confirmé, les tours faits deviennent les séries de chaque exercice du circuit. | `store.js` › `endAmrap` | Active |
| RG-MAT-10 | En salle équipée, formats et ordre reviennent à ceux du programme. | `store.js` › `restoreFormats` | Active |

## Séances types

| ID | Règle | Source | État |
|---|---|---|---|
| RG-TPL-01 | Le nom d'une séance type est obligatoire, 40 caractères au plus. | `views/templates.js` › `nameSheet`, `templateView` | Active |
| RG-TPL-02 | Un exercice ajouté arrive en 3 × 8-12 reps et 1 min 30 de repos, à sa dernière charge maximale, sinon à 20 kg calés sur le matériel. | `store.js` › `addItem` | Active |
| RG-TPL-03 | Bornes en Séries : 1 à 10 séries, 1 à 50 reps, repos de 15 s à 10 min par 15 s. | `views/templates.js` › `itemView` | Active |
| RG-TPL-04 | Les reps minimum ne dépassent jamais les reps maximum : changer l'une ajuste l'autre. | `views/templates.js` › `itemView` | Active |
| RG-TPL-05 | Bornes EMOM : 2 à 60 rounds, intervalle de 30 s à 5 min, 1 à 50 reps. Bornes Tabata : 2 à 30 rounds, effort de 10 s à 2 min, repos de 5 s à 2 min. | `views/templates.js` › `itemView` | Active |
| RG-TPL-06 | Changer de format garde la charge et pose les valeurs par défaut du format. En EMOM ou Tabata, l'exercice quitte son superset. | `store.js` › `setItemFormat` | Active |
| RG-TPL-07 | Changer d'exercice garde séries, reps, repos et groupe. La charge part de la dernière performance, sinon de la charge convertie. | `store.js` › `replaceItemExercise` | Active |
| RG-TPL-08 | Supprimer une séance type demande une confirmation. Les séances faites restent dans l'historique et les courbes. | `views/templates.js` › `templateView` ; `store.js` › `deleteTemplate` | Active |

## Pas du jour

| ID | Règle | Source | État |
|---|---|---|---|
| RG-PAS-01 | La cible de pas vaut 8 000 par défaut et se règle de 2 000 à 30 000 par 500. | `store.js` › `seed` ; `views/profile.js` › `profileView` | Active |
| RG-PAS-02 | Un nombre de pas reçu est un entier de 0 à 60 000, sinon il est refusé. | `views/today.js` › `parseSteps` ; `schema.sql` › `fluide_envoyer_pas` | Active |
| RG-PAS-03 | La moyenne porte sur les 7 derniers jours, sans compter les jours vides ou à 0. | `store.js` › `stepsAverage` | Active |
| RG-PAS-04 | Le serveur garde une ligne par compte et par jour. | `schema.sql` › `fluide_pas` | Active |
| RG-PAS-05 | Les pas reçus remplacent ceux du jour concerné. | `compte.js` › `pullSteps` ; `schema.sql` › `fluide_envoyer_pas` | Active |
| RG-PAS-06 | Une clé Raccourci par compte, qui ne sert qu'à écrire les pas. Seule son empreinte SHA-256 est gardée côté serveur, et la remplacer invalide l'ancienne. | `schema.sql` › `fluide_nouvelle_cle`, `fluide_envoyer_pas` | Active |
| RG-PAS-07 | Le serveur accepte un jour compris entre 7 jours avant et le lendemain, à l'heure de Paris ; sans jour indiqué, c'est aujourd'hui. | `schema.sql` › `fluide_envoyer_pas` | Active |
| RG-PAS-08 | La première reprise porte sur les 7 derniers jours, les suivantes sur ce qui a changé depuis. | `compte.js` › `pullSteps` | Active |

## Compte et données

| ID | Règle | Source | État |
|---|---|---|---|
| RG-CPT-01 | Le compte est optionnel. Connexion par e-mail et mot de passe de 8 caractères au moins. | `views/compte.js` | Active |
| RG-CPT-02 | L'adresse doit être validée avant la première connexion, par le lien reçu ou par l'administrateur. | `compte.js` › `signUp` ; `views/compte.js` › `confirmView` | Active |
| RG-CPT-03 | Chaque compte a une ligne de données et ne peut lire ou modifier que la sienne. | `schema.sql` › `fluide_state` | Active |
| RG-CPT-04 | À la connexion : compte vide, le téléphone y est envoyé ; téléphone sans séance ni habitude, le compte est repris ; données des deux côtés, l'utilisateur choisit. | `compte.js` › `afterSignIn`, `hasLocalData` | Active |
| RG-CPT-05 | Chaque enregistrement part vers le compte 2 s après la dernière modification. | `compte.js` › `PUSH_DELAY`, `onPersist` | Active |
| RG-CPT-06 | À l'ouverture, au retour au premier plan et au retour du réseau, la version la plus récente gagne. | `compte.js` › `syncNow`, `syncState` | Active |
| RG-CPT-07 | Une session refusée par le compte déconnecte sans toucher aux données du téléphone. | `compte.js` › `token` | Active |
| RG-CPT-08 | Se déconnecter laisse les données sur le téléphone et sur le compte. Ce qui change ensuite ne part plus. | `compte.js` › `signOut` ; `views/compte.js` | Active |
| RG-CPT-09 | Un import doit contenir exercices, séances types et séances. Il demande une confirmation et remplace toutes les données ; un fichier illisible ne change rien. | `views/profile.js` › `upload` ; `store.js` › `replaceState` | Active |

## Écarts

Différences entre le code et l'intention écrite (commentaires, textes d'écran, `memoire.md`).

### Ouverts

| ID | Type | Constat | Comment c'est vérifié | Règles |
|---|---|---|---|---|
| E-06 | Décision | Tout nouveau compte hérite du challenge corde d'Alexis, avec sa date de départ : un bêta-testeur qui arrive le 05/11/2026 démarre en S3, sans l'avoir choisi. | Exécuté | RG-COR-05 |
| E-07 | Décision | L'écran de fin de séance dit : « Plusieurs séances « Difficile » d'affilée et le coach propose un deload ». Aucun code de l'app ne lit le ressenti, sauf pour l'afficher. Le coach est la skill externe `coach-fluide` : le bêta-testeur n'y a pas accès. | Relu | RG-SEA-25 |
| E-08 | Décision | Les descriptions des blocs promettent plus que le code. Intensité annonce un « volume réduit » et Spécialisation « le reste en maintien », mais rien ne les applique. Changer de bloc ne modifie que le RPE cible et les programmes générés ensuite, pas les séances types en place. | Relu | RG-BLC-02 |
| E-09 | Décision | « Objectif du moment » et « Niveau » se règlent dans les Réglages mais n'agissent sur rien. Âge et poids non plus (déjà noté dans `memoire.md`). | Relu | Hors registre : aucune règle n'en découle |
| E-10 | Décision | Hors programme et Modifier la séance n'ont plus d'accès depuis le 31/10 (décision confirmée le 04/11), mais le code reste, et le README comme le glossaire décrivent encore Hors programme. À retirer, ou à rouvrir. | Relu | RG-SEA-28 à 30 |
| E-11 | Doc | Le bouton « Coller depuis Santé » n'existe plus dans le code, alors que `memoire.md` et le guide `livrables/fluide/raccourci-pas.md` l'indiquent encore : un utilisateur sans compte suit donc une procédure impossible. | Relu | RG-PAS-02 |
| E-12 | Doc | Autres passages périmés. Glossaire : « À définir, 12-20 reps », devenu l'objectif endurance à 15-20 reps, et « Machine prise », devenu « Remplacer ». README : « Les données restent sur l'iPhone ». `store.js` › `generateProgram` : le commentaire « 1 ou 2 exercices » contredit RG-PRG-07. `compte.js` › `hasLocalData` lit encore `state.corde`, retiré. | Relu | — |
| E-13 | Bug | Remplacer un exercice en plein AMRAP crée un exercice en séries à l'intérieur du circuit : l'exercice d'origine y reste, et le remplaçant ne suit plus le format AMRAP. Trouvé en corrigeant E-03, pas corrigé : il faut d'abord décider ce que doit faire ce geste. | Exécuté | RG-SEA-19 |

### Corrigés en v0.7.4

Les règles concernées décrivent désormais le comportement corrigé. Vérifié sous Node et dans l'app.

| ID | Constat d'origine | Correction |
|---|---|---|
| E-01 | Une puce Points forts ou Points faibles effaçait l'objectif du muscle. | `setMatrix` garde l'objectif. |
| E-02 | Un round d'EMOM ou de Tabata pouvait battre un record. | `sessionRecords` ignore ces formats, y compris pour les séances déjà enregistrées. |
| E-03 | Remplacer un EMOM ou un Tabata commencé transférait les rounds faits au remplaçant. | Les rounds restent sur l'exercice d'origine, le remplaçant reprend le reste. |
| E-04 | « Remplacer » proposait les exercices absents, en douleur ou au matériel décoché. | Ils ne sortent plus que par une recherche ; `alternatives()` ne retombe plus sur eux. |
| E-05 | Le nombre de séances allait de 1 à 7 dans Réglages et de 2 à 6 dans Ta semaine. | 2 à 6 partout, et les anciennes valeurs sont ramenées dans ces bornes. |
