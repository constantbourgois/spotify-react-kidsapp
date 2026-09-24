# Ma musique

Une appli Spotify pour enfant : un parent se connecte une fois et choisit une playlist ; l'enfant
parcourt les chansons en grille (6 par écran), touche celles qu'il veut, puis appuie sur **Écouter**
pour ouvrir le lecteur.

- **Connexion parent persistante** : OAuth Spotify (PKCE, sans secret). Le jeton de rafraîchissement
  est gardé sur l'appareil, la session ne se ferme que si le parent se déconnecte ou révoque l'accès.
- **Espace parent protégé par un code** (icône cadenas) : playlist, appareil de lecture, déconnexion.
- **Lecture** dans le navigateur (Web Playback SDK) ou sur un autre appareil Spotify Connect
  (enceinte, téléphone, ordinateur).

## Pré-requis

- Un compte **Spotify Premium** (obligatoire pour piloter la lecture via l'API).
- Une app sur <https://developer.spotify.com/dashboard> :
  - API : *Web API* et *Web Playback SDK*
  - Redirect URIs : `http://127.0.0.1:5173/` (dev) et l'URL de production, ex. `https://mon-app.herokuapp.com/`
  - En mode développement, ajoutez le compte du parent dans *User Management*.

## Lancer en local

```
cp .env.example .env.local   # renseigner VITE_SPOTIFY_CLIENT_ID
npm install
npm run dev                  # http://127.0.0.1:5173 (pas "localhost", refusé par Spotify)
npm test
```

## Production

`npm run build` puis `npm start` sert `dist/` avec Express (compatible Heroku). Définir
`VITE_SPOTIFY_CLIENT_ID` dans l'environnement **avant** le build : la valeur est intégrée au bundle.

Sur tablette, « Ajouter à l'écran d'accueil » ouvre l'appli en plein écran.

## Limites connues

- La lecture dans le navigateur ne fonctionne pas sur Safari iOS : choisissez alors un autre appareil
  dans l'espace parent.
- Un appareil Spotify Connect inactif depuis longtemps disparaît de la liste : ouvrez Spotify dessus.
- Seules les playlists du compte (créées ou collaboratives) sont proposées.
