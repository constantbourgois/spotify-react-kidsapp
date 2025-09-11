import { Buffer } from 'buffer';

export async function getToken() {
    const client_id = process.env.REACT_APP_SPOTIFY_CLIENT_ID;
    const client_secret = process.env.REACT_APP_SPOTIFY_CLIENT_SECRET;
    const Token = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        body: 'grant_type=client_credentials',
        headers: {
            'Authorization': 'Basic ' + (Buffer.from(client_id + ':' + client_secret).toString('base64')),
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    }).then(resp => resp.json())
      .then(data => data.access_token)
      .catch(err => {
          console.log('something went wrong', err);
      });

    return Token;
}

function getRandomSearch() {
    const characters = 'abcdefghijklmnopqrstuvwxyz';
    const randomCharacter = characters.charAt(Math.floor(Math.random() * characters.length));
    return '%25' + randomCharacter + '%25'; // %25 = URL encoded "%"
}

export async function fetchTracks(token) {
    const randomOffset = 0;
    const q = getRandomSearch();

    const myHeaders = new Headers();
    myHeaders.append("Authorization", `Bearer ${token}`);

    const requestOptions = { method: 'GET', headers: myHeaders };

    // Search for tracks on Spotify
    const Songs = await (await fetch(
        `https://api.spotify.com/v1/search?q=${q}&offset=${randomOffset}&limit=50&type=track`,
        requestOptions
    )).json();

    const tracks = Songs["tracks"]["items"];

    // Helper: fetch audio features from Reccobeats
    async function fetchAudioFeatures(track) {
        const query = encodeURIComponent(`${track.name} ${track.artists[0].name}`);
        try {
            const response = await fetch(`https://api.reccobeats.com/audio-features?query=${query}`);
            if (!response.ok) throw new Error("Reccobeats fetch failed");
            const audio_features = await response.json();

            // Map values back into track object
            track.audio_features = audio_features;
            track.valence = audio_features['valence'] || 0;
            track.danceability = audio_features['danceability'] || 0;
            track.energy = audio_features['energy'] || 0;
        } catch (error) {
            console.error("Reccobeats error:", error);
            track.audio_features = {};
            track.valence = 0;
            track.danceability = 0;
            track.energy = 0;
        }
    }

    // Attach audio features to each track
    await Promise.all(tracks.map(track => fetchAudioFeatures(track)));

    console.log("Tracks fetched:", tracks.length);
    return tracks;
}

export async function getTrack(Songs, mood) {
    let songsArray = Songs;
    let songUrl;

    if (songsArray && mood) {
        // sort the songs by valence
        songsArray = songsArray.sort((a, b) => a.valence - b.valence);

        switch (mood) {
            case "happy":
                songUrl = songsArray[Math.floor(songsArray.length / 2)]['preview_url'];
                return songUrl;
            case "sad":
                songUrl = songsArray[0]['preview_url'];
                return songUrl;
            case "excited":
                // get the song with highest danceability
                const dancingSong = songsArray.reduce((previous, current) => {
                    return current.danceability > previous.danceability ? current : previous;
                });
                songUrl = dancingSong['preview_url'];
                return songUrl;
            default:
                return songUrl;
        }
    }
}
