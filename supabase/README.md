# Compte Fluide sur Supabase

Connexion sans mot de passe : un code à 6 chiffres arrive par e-mail et se tape dans l'app (un lien magique ouvrirait Safari, pas l'app installée sur l'écran d'accueil, qui a son propre stockage).

1. **Créer le projet** sur https://supabase.com (gratuit), région Europe (Paris ou Francfort).
2. **Table** : SQL Editor › New query › coller `schema.sql` › Run.
3. **E-mail avec le code** : Authentication › Emails › Templates › *Magic Link*. Remplacer le contenu par :
   - Sujet : `Ton code Fluide`
   - Corps : `<h2>Ton code Fluide</h2><p style="font-size:28px;letter-spacing:4px"><b>{{ .Token }}</b></p><p>Valable une heure. Si tu n'as rien demandé, ignore cet e-mail.</p>`
   - Même chose pour le template *Confirm signup* (premier passage d'une adresse).
4. **Adresse du site** : Authentication › URL Configuration › Site URL = `https://alexis-fluide.vercel.app`.
5. **Clés** : Project Settings › API (ou *API Keys*) : copier l'URL du projet et la clé publique (`anon` ou `sb_publishable_…`) dans `js/config.js`. Jamais la clé `service_role` / `sb_secret_…`.

Limites du plan gratuit : environ 2 e-mails par heure avec l'envoi intégré de Supabase (suffisant pour un compte perso ; pour les bêta-testeurs, brancher un SMTP comme Resend dans Authentication › Emails › SMTP). Un projet sans aucune activité pendant 7 jours est mis en pause : un usage quotidien suffit à l'éviter.
