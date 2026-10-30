# Compte Fluide sur Supabase

Connexion par e-mail et mot de passe, tout se passe dans l'app (le trousseau iCloud remplit le mot de passe). Pas de code ni de lien magique : sans domaine d'envoi à soi, Supabase n'envoie que des liens, qui s'ouvrent dans Safari et pas dans l'app installée sur l'écran d'accueil.

1. **Créer le projet** sur https://supabase.com (gratuit), région Europe. Security : *Enable Data API* coché, *Automatically expose new tables* décoché, *Enable automatic RLS* coché.
2. **Table** : SQL Editor › New query › coller `schema.sql` › Run.
3. **Validation des adresses** : Authentication › Sign In / Providers › Email › *Confirm email* coché. À la création, un e-mail avec un lien part à l'adresse (l'app affiche « Ton adresse va être validée »). Pour valider à la main : Authentication › Users › la ligne › menu ⋯ › *Confirm email* ; ou SQL Editor : `update auth.users set email_confirmed_at = now() where email = 'adresse';`.
4. **Retour des liens (confirmation, mot de passe oublié)** : Authentication › URL Configuration › Site URL = `https://alexis-fluide.vercel.app` ; Redirect URLs : `https://alexis-fluide.vercel.app/**` et `http://localhost:8765/**` pour tester en local.
5. **Clés** : Project Settings › API Keys : l'URL du projet et la clé publique (`sb_publishable_…` ou `anon`) dans `js/config.js`. Jamais la clé `sb_secret_…` / `service_role`.
6. **Pas du jour automatiques** : SQL Editor › New query › coller la fin de `schema.sql`, à partir de « Pas du jour envoyés par le Raccourci », › Run (le début est déjà en place : le relancer en entier échouerait sur les règles existantes). Le Raccourci appelle `fluide_envoyer_pas` avec une clé Raccourci créée dans Réglages › Compte › Pas du jour automatiques (guide : `livrables/fluide/raccourci-pas.md`).

Limites du plan gratuit : l'envoi intégré de Supabase (mot de passe oublié) n'écrit qu'aux membres de l'équipe du projet, environ 2 e-mails par heure. Pour les bêta-testeurs, il faudra un domaine et un SMTP (Resend…) dans Authentication › Emails › SMTP Settings. Un projet sans aucune activité pendant 7 jours est mis en pause : un usage quotidien suffit à l'éviter.
