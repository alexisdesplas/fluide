# Raccourci « Pas du jour » — reprendre les pas de l'app Santé dans Fluide

Fluide est une app web : elle n'a pas accès à Santé (HealthKit). Un Raccourci iOS lit les pas du jour dans Santé et les copie dans le presse-papiers ; dans Fluide, le bouton **Coller depuis Santé** les enregistre. Rien ne passe par un serveur.

## 1. Créer le Raccourci

Dans l'app **Raccourcis**, onglet **Raccourcis**, touche **+**, puis nomme-le **Pas du jour**. Ajoute ces actions dans l'ordre (cherche-les par leur nom dans la barre de recherche du bas) :

1. **Rechercher des échantillons de santé**
   - Touche « Type » et choisis **Nombre de pas**.
   - Ajoute le filtre **Date de début** · **est aujourd'hui**.
   - Touche « Afficher plus », puis **Regrouper par** · **Jour**. Les pas comptés à la fois par l'iPhone et l'Apple Watch sont alors fusionnés comme dans Santé.
2. **Calculer des statistiques** (le nom peut varier selon la version d'iOS : cherche « statistique »)
   - Opération **Somme**, entrée **Échantillons de santé**.
3. **Arrondir le nombre**
   - **Arrondir** · **Unités**. Fluide n'accepte qu'un nombre entier.
4. **Copier dans le presse-papiers**
   - Entrée : **Nombre arrondi**.

Lance le Raccourci une fois avec ▶︎ : iOS demande l'accès aux pas dans Santé, accepte.

**Vérifier** : le nombre copié doit être celui de Santé > Activité > Pas pour aujourd'hui. S'il est plus élevé (pas comptés deux fois), ajoute à l'action 1 le filtre **Source** · **est** · ton iPhone (ou ta montre, celle que tu portes toute la journée).

## 2. Coller dans Fluide

1. Lance **Pas du jour** (widget Raccourcis, bouton Action, ou Réglages > Accessibilité > Toucher > Toucher le dos).
2. Ouvre Fluide, écran **Aujourd'hui**, carte **Pas du jour**.
3. Touche **Coller depuis Santé**, puis **Coller** dans la bulle de Safari.

Fluide affiche « 8 432 pas repris de Santé » et remplace le nombre du jour. Si le presse-papiers contient autre chose qu'un nombre entier (de 0 à 60 000), rien n'est enregistré et un message le dit.

## 3. En automatique (facultatif)

Onglet **Automatisation** > **+** > **Heure de la journée**, par exemple 21:00, chaque jour, **Exécuter immédiatement**, action **Exécuter le raccourci** · **Pas du jour**. Le presse-papiers contient alors tes pas du soir : il reste à toucher **Coller depuis Santé** à la prochaine ouverture de Fluide.

## 4. Essai à faire : ouvrir Fluide directement

Ajoute en dernière action **Ouvrir l'URL** avec `https://alexis-fluide.vercel.app/#/pas/` suivi de la variable **Nombre arrondi** (exemple : `…/#/pas/8432`), puis lance le Raccourci.

- **Fluide s'ouvre en plein écran** (l'app de l'écran d'accueil, sans barre Safari) avec « 8 432 pas repris de Santé » : le lien suffit, plus besoin de coller. Garde l'action.
- **Safari s'ouvre** avec « 8 432 pas enregistrés dans Safari, pas dans l'app de l'écran d'accueil » : Safari et l'app de l'écran d'accueil ne partagent pas leurs données, ces pas sont perdus pour Fluide. Supprime l'action et garde le presse-papiers.

Note le résultat dans `memoire.md` (hypothèse « Ouvrir l'URL → app ou Safari »).
