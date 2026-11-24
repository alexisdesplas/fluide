# Raccourci « Pas du jour » — reprendre les pas de l'app Santé dans Fluide

Fluide est une app web : elle n'a pas accès à Santé (HealthKit). Un Raccourci iOS lit les pas du jour dans Santé, puis :

- **connecté à ton compte Fluide** : il les envoie lui-même au compte, et Fluide les reprend à l'ouverture, sans rien toucher (section 5) ;
- **sans compte** : il les copie dans le presse-papiers, et le bouton **Coller depuis Santé** les enregistre (sections 1 à 3).

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

## 5. Mode automatique (compte Fluide connecté)

Le Raccourci envoie tes pas à ton compte avec une **clé Raccourci** : elle ne sert qu'à écrire tes pas, et se remplace ou se supprime à tout moment. Ton mot de passe ne va jamais dans le Raccourci.

**Une fois** (l'administrateur du projet Supabase) : passer la fin de `supabase/schema.sql`, à partir de « Pas du jour envoyés par le Raccourci » (voir `supabase/README.md`, étape 6).

**Dans Fluide** : Réglages › Compte › **Pas du jour automatiques** › **Créer ma clé Raccourci** › **Copier la clé**.

**Dans le Raccourci « Pas du jour »**, garde les actions 1 à 3 de la section 1 (rechercher, somme, arrondir), remplace « Copier dans le presse-papiers » par :

4. **Obtenir le contenu de l'URL**
   - URL : `https://rkxhntyvbbhswafyrxty.supabase.co/rest/v1/rpc/fluide_envoyer_pas`
   - Touche « Afficher plus » : **Méthode** · **POST**.
   - **En-têtes** : ajoute `apikey` = `sb_publishable_VpHZ23r-RNFNixR4ccQfuQ_LPkj-rq-` (la clé publique de l'app, la même que dans `js/config.js`).
   - **Corps de la requête** · **JSON**, deux champs :
     - `cle` · **Texte** · colle ta clé Raccourci ;
     - `pas` · **Nombre** · variable **Nombre arrondi**.

Lance-le avec ▶︎ : la réponse est le nombre de pas envoyé. Ouvre Fluide : la carte Pas du jour affiche le nombre et « Reçus de Santé à … par le Raccourci ». Si la réponse parle de « Clé Raccourci inconnue », recopie la clé depuis Fluide.

Le jour est celui de Paris au moment de l'envoi. Un nouvel envoi le même jour remplace le précédent, et remplace aussi un nombre tapé à la main.

**Sans aucune action** : onglet **Automatisation** › **+** › **Heure de la journée** (par exemple 12:00, 18:00 et 21:00, une automatisation par heure), **Quotidien**, **Exécuter immédiatement**, « Me notifier lors de l'exécution » décoché, action **Exécuter le raccourci** · **Pas du jour**. Fluide se met à jour à la prochaine ouverture.

**À vérifier** : iOS bloque l'accès à Santé quand l'iPhone est verrouillé. Si l'automatisation part pendant que l'iPhone est verrouillé, elle peut échouer (Raccourcis › Automatisation montre les exécutions). Plusieurs heures dans la journée limitent le risque ; sinon, essaie le déclencheur **Chargeur** › « Est connecté ».
