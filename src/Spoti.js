const API_BASE_URL = "https://spotify-react-kidsapp-e9ca39c0274b.herokuapp.com";

// Get a Spotify token
export async function getToken() {
  try {
    const url = `${API_BASE_URL}/gettoken`;
    const resp = await fetch(url);
    if (!resp.ok) return null;
    const data = await resp.text();
    return data
  } catch (err) {
    console.warn('fetching preview url failed', err);
    return [];
  }
}

// Random query for Spotify search
function getRandomSearch() {
  const characters = 'abcdefghijklmnopqrstuvwxyz';
  const randomCharacter = characters.charAt(
    Math.floor(Math.random() * characters.length)
  );
  return `%25${randomCharacter}%25`;
}

// Batch: lookup Reccobeats tracks from Spotify IDs
async function fetchReccoTracksBySpotifyIds(spotifyIds) {
  try {
    const url = `https://api.reccobeats.com/v1/track?ids=${spotifyIds}`;
    const resp = await fetch(url);
    if (!resp.ok) return [];
    const data = await resp.json();
    // Rebuild with both Spotify + Recco IDs
    return spotifyIds.map((spotifyId, i) => ({
      spotify_id: spotifyId,
      recco_id: data.content[i]?.id || null,
    }));
  } catch (err) {
    console.warn('Reccobeats batch track lookup failed', err);
    return [];
  }
}

// Batch: fetch audio features for multiple Reccobeats IDs
async function fetchReccoAudioFeaturesByIds(reccoIds) {
  const idChunks = chunkArray(reccoIds, 40);

  const responses = await Promise.all(
    idChunks.map(async (chunk) => {
      const resp = await fetch(
        `https://api.reccobeats.com/v1/audio-features?ids=${chunk.join(',')}`
      );
      const data = await resp.json();

      // Normalize: ensure array of { recco_id, ...features }
      return (data.content || []).map((feat) => ({
        recco_id: feat.id,
        ...feat,
      }));
    })
  );

  return responses.flat();
}


function chunkArray(arr, size) {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

export async function fetchTracks(token, retryCount = 0, maxRetries = 5) {
  const seen = new Set();
  let candidateTracks = [];

  // Step 1: Collect raw Spotify tracks until we have at least 50 candidates
  while (candidateTracks.length < 50) {
    if (retryCount >= maxRetries) {
      console.warn("Max retries reached, returning current track list");
      return candidateTracks;
    }

    const q = getRandomSearch();
    const requestOptions = {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    };

    const response = await fetch(
      `https://api.spotify.com/v1/search?q=${q}&type=track&limit=50&offset=0`,
      requestOptions
    );

    const songs = await response.json();
    const newTracks = songs?.tracks?.items || [];

    if (!newTracks.length) {
      console.log("Spotify returned no tracks, retrying...");
      retryCount++;
      continue;
    }

    for (const track of newTracks) {
      if (!seen.has(track.id)) {
        candidateTracks.push(track);
        seen.add(track.id);
      }
    }

    if (candidateTracks.length >= 50) break;
  }

  // Step 2: Batch fetch reccoIds (max 40 per request)
  const spotifyIds = candidateTracks.map((t) => t.id);
  const idChunks = chunkArray(spotifyIds, 40);

  const reccoResults = await Promise.all(
    idChunks.map((chunk) => fetchReccoTracksBySpotifyIds(chunk))
  );

  // Flatten all normalized results
  const normalized = reccoResults.flat();

  // Build map: Spotify ID -> Recco ID
  const reccoBySpotify = {};
  for (const { spotify_id, recco_id } of normalized) {
    if (recco_id) reccoBySpotify[spotify_id] = recco_id;
  }

  // Keep only tracks with valid recco_id
  const filteredTracks = candidateTracks.filter((t) => reccoBySpotify[t.id]);
  filteredTracks.forEach((t) => (t.recco_id = [reccoBySpotify[t.id]]));

  // Step 3: Batch fetch audio features
  const allIds = filteredTracks.map((t) => t.recco_id[0]);
  const audioFeatures = await fetchReccoAudioFeaturesByIds(allIds);

  // Build map: recco_id -> features
  const featuresById = {};
  for (const feat of audioFeatures) {
    featuresById[feat.recco_id] = feat;
  }

  // Step 4: Attach preview_url + audio_features
  await Promise.all(
    filteredTracks.map(async (track) => {
      /*track.preview_url = await getPreviewUrl(
        track.artists[0].name,
        track.name
      );*/
      track.audio_features = featuresById[track.recco_id[0]] || null;
    })
  );

  const filteredTracksWithMood = setFeaturesByMood(filteredTracks);
  return filteredTracksWithMood;
}



// Pick a track based on mood
async function getPreviewUrl(artist, title) {
  try {
    const url = `${API_BASE_URL}/getpreviewurl?song=${title}&artist=${artist}`;
    const resp = await fetch(url);
    if (!resp.ok) return [];
    const data = await resp.json();
    return data.results[0].previewUrls[0];
  } catch (err) {
    console.warn('fetching preview url failed', err);
    return [];
  }
}

async function setFeaturesByMood(tracks) {
  tracks = tracks.sort((a, b) => a.audio_features.valence - b.audio_features.valence);

  // The "happy" track is selected as the median track by valence (emotional positivity).
  // This is a proxy and may not always correspond to a truly "happy" mood.
  tracks.orderedTracks = {};
  const medianValenceIndex = Math.floor(tracks.length / 2);
  const happyPreview = await getPreviewUrl(
    tracks[medianValenceIndex].artists[0].name,
    tracks[medianValenceIndex].name
  );
  tracks.orderedTracks.happy = happyPreview || null;

  const sadPreview = await getPreviewUrl(
    tracks[0].artists[0].name,
    tracks[0].name
  );
  tracks.orderedTracks.sad = sadPreview || null;

  const proccTracks = tracks;

  const proccTrack = proccTracks.reduce((prev, curr) =>
    curr.audio_features.danceability > prev.audio_features.danceability ? curr : prev
  )
  const excitedPreview = await getPreviewUrl(
    proccTrack.artists[0].name,
    proccTrack.name
  );
  tracks.orderedTracks.excited = excitedPreview || null;
  return tracks;

}
export async function getTrack(tracks, mood) {

  if (tracks && mood) {

    switch (mood) {
      case 'happy':
        return tracks.orderedTracks.happy;
      case 'sad':
        return tracks.orderedTracks.sad;
      case 'excited':
        return tracks.orderedTracks.excited;
      default:
        return null;
    }
  }
}
