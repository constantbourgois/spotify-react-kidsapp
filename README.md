# txikimusik

A Spotify app for kids, in the [Txiki](https://txikiapp.eus) brand: a parent signs in once and picks a
playlist; the child browses its songs in a grid (6 per screen) and taps the one they want. It starts
right away, and next / previous carry on through the playlist.

Live at <https://txikimusik.vercel.app/>. The interface is in French.

- **Persistent parent sign-in**: Spotify OAuth (PKCE, no client secret). The refresh token is kept on
  the device, so the session only ends if the parent signs out or revokes access.
- **Parent space behind a PIN** (padlock icon): playlist, playback device, sign-out.
- **Playback** in the browser (Web Playback SDK) or on another Spotify Connect device (speaker, phone,
  computer).

## Screenshots (iPhone)

<table>
  <tr>
    <td align="center"><img src="docs/screenshots/iphone-connexion.png" width="220" alt="Sign-in screen with the txiki logo and mascots"><br>Sign-in</td>
    <td align="center"><img src="docs/screenshots/iphone-grille.png" width="220" alt="Grid of six songs, the one playing marked with a yellow equalizer"><br>Picking a song</td>
    <td align="center"><img src="docs/screenshots/iphone-lecteur.png" width="220" alt="Player: cover ringed with the logo colors, controls and song queue"><br>Player</td>
  </tr>
  <tr>
    <td align="center"><img src="docs/screenshots/iphone-code-parent.png" width="220" alt="Parent PIN keypad"><br>Parent PIN</td>
    <td align="center"><img src="docs/screenshots/iphone-espace-parent.png" width="220" alt="Parent space on a single screen: playlist, device, PIN"><br>Parent space</td>
    <td></td>
  </tr>
</table>

<table>
  <tr>
    <td align="center"><img src="docs/screenshots/iphone-grille-paysage.png" width="380" alt="Song grid in landscape"><br>Grid, landscape</td>
    <td align="center"><img src="docs/screenshots/iphone-lecteur-paysage.png" width="380" alt="Player in landscape"><br>Player, landscape</td>
  </tr>
</table>

Taken with Playwright (iPhone 15 profile) and mocked Spotify responses: the song titles are real, the
covers are placeholders.

## Requirements

- A **Spotify Premium** account (required to control playback through the API).
- An app on <https://developer.spotify.com/dashboard>:
  - APIs: *Web API* and *Web Playback SDK*
  - Redirect URIs: `https://txikimusik.vercel.app` (production) and `http://127.0.0.1:5173/callback`
    (local development)
  - In development mode, add the parent's account under *User Management*.

## Run locally

```
cp .env.example .env.local   # set VITE_SPOTIFY_CLIENT_ID, and VITE_REDIRECT_URI=http://127.0.0.1:5173/callback
npm install
npm run dev                  # http://127.0.0.1:5173 (not "localhost", which Spotify rejects)
npm test
```

The redirect URI must match one registered in the Spotify app character for character, trailing slash
included. Without `VITE_REDIRECT_URI`, the app uses its own origin followed by `/`.

## Production

Deployed on Vercel (project `txikimusik`). Two variables must be set in Vercel **before** the build,
since they are baked into the bundle: `VITE_SPOTIFY_CLIENT_ID` and `VITE_REDIRECT_URI`
(`https://txikimusik.vercel.app`, no trailing slash, exactly as registered in the Spotify app).
`vercel.json` serves the single-page app and redirects the former `palomaplayer.vercel.app` address.

Elsewhere, `npm run build` then `npm start` serves `dist/` with Express.

On a tablet, "Add to Home Screen" opens the app full screen.

## Known limitations

- Browser playback does not work in Safari on iOS: pick another device in the parent space instead.
- A Spotify Connect device that has been idle for a long time drops off the list: open Spotify on it.
- Only the account's own playlists (created or collaborative) are offered.
