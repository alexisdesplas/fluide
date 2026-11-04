# Compte Fluide sur Supabase

Connexion par e-mail et mot de passe, tout se passe dans l'app (le trousseau iCloud remplit le mot de passe). Pas de code ni de lien magique : sans domaine d'envoi à soi, Supabase n'envoie que des liens, qui s'ouvrent dans Safari et pas dans l'app installée sur l'écran d'accueil.

1. **Créer le projet** sur https://supabase.com (gratuit), région Europe. Security : *Enable Data API* coché, *Automatically expose new tables* décoché, *Enable automatic RLS* coché.
2. **Table** : SQL Editor › New query › coller `schema.sql` › Run.
3. **Validation des adresses** : Authentication › Sign In / Providers › Email › *Confirm email* coché. À la création, un e-mail avec un lien part à l'adresse (l'app affiche « Ton adresse va être validée »). Pour valider à la main : Authentication › Users › la ligne › menu ⋯ › *Confirm email* ; ou SQL Editor : `update auth.users set email_confirmed_at = now() where email = 'adresse';`.
4. **Retour des liens (confirmation, mot de passe oublié)** : Authentication › URL Configuration › Site URL = `https://alexis-fluide.vercel.app` ; Redirect URLs : `https://alexis-fluide.vercel.app/**` et `http://localhost:8765/**` pour tester en local.
5. **Clés** : Project Settings › API Keys : l'URL du projet et la clé publique (`sb_publishable_…` ou `anon`) dans `js/config.js`. Jamais la clé `sb_secret_…` / `service_role`.
6. **Pas du jour automatiques** : SQL Editor › New query › coller la fin de `schema.sql`, à partir de « Pas du jour envoyés par le Raccourci », › Run (le début est déjà en place : le relancer en entier échouerait sur les règles existantes). Le Raccourci appelle `fluide_envoyer_pas` avec une clé Raccourci créée dans Réglages › Compte › Pas du jour automatiques (guide : `livrables/fluide/raccourci-pas.md`).
7. **Connexion avec Google** (bouton « Continuer avec Google », tant qu'il n'est pas activé l'app le dit et propose l'e-mail) :
   - Google Cloud Console (https://console.cloud.google.com) › un projet › *APIs & Services* › *OAuth consent screen* : type *External*, nom « Fluide », ton e-mail. Tant que l'app reste en mode *Testing*, ajoute les comptes Google autorisés dans *Test users*.
   - *Credentials* › *Create credentials* › *OAuth client ID* › type *Web application*. *Authorized redirect URIs* : `https://rkxhntyvbbhswafyrxty.supabase.co/auth/v1/callback` (l'adresse est aussi affichée dans Supabase, étape suivante).
   - Supabase › Authentication › Sign In / Providers › **Google** › activer, coller le *Client ID* et le *Client secret* › Save. Le secret ne va jamais dans le dépôt.
   - Les Redirect URLs de l'étape 4 couvrent le retour dans l'app. Le premier passage par Google crée le compte (adresse déjà validée par Google) ; une adresse déjà inscrite par e-mail retrouve le même compte.
   - Sur l'iPhone, l'app installée ouvre Google dans une fenêtre Safari : à tester, le retour peut rester dans cette fenêtre au lieu de revenir dans l'app (même limite que les liens par e-mail).

Limites du plan gratuit : l'envoi intégré de Supabase (mot de passe oublié) n'écrit qu'aux membres de l'équipe du projet, environ 2 e-mails par heure. Pour les bêta-testeurs, il faudra un domaine et un SMTP (Resend…) dans Authentication › Emails › SMTP Settings. Un projet sans aucune activité pendant 7 jours est mis en pause : un usage quotidien suffit à l'éviter.
