//set up the server
require('dotenv').config();
const express = require('express'); //Line 1
const app = express(); //Line 2
const port = process.env.PORT || 5000; //Line 3
const cors = require('cors');
const axios = require('axios');
app.use(cors());
const spotifyPreviewFinder = require('spotify-preview-finder');
const { createPath } = require('../node_modules/react-router-dom/dist/index');


if (process.env.NODE_ENV === 'production') {
  app.use(express.static('build'));
}

// prepare the first call to spotify api


const client_id = process.env.REACT_APP_SPOTIFY_CLIENT_ID;
const client_secret = process.env.REACT_APP_SPOTIFY_CLIENT_SECRET;

const headers = {
  'Authorization': 'Basic ' + (Buffer.from(client_id + ':' + client_secret).toString('base64')),
  'Content-Type': 'application/x-www-form-urlencoded'
}
const data = 'grant_type=client_credentials';

function getToken() {
  return (
    axios.post('https://accounts.spotify.com/api/token', data, {
      headers: headers
    })
      .then(function (response) {
        console.log(response.data.access_token);
        return response.data.access_token;

      }).catch(function (err) {

        // Log any errors
        console.log('something went wrong', err);

      })
  )
}

(async () => {
  const t = await getToken();
  // create a GET route
  await app.get('/moods', (req, res) => {

    res.send({ token: `${t}` });
  });
})()

app.get('/gettoken', async (_, res) => {
  try {
    const t = await getToken();
    if (t) {
      return res.send(t);
    } else {
      return res.status(500).json({ error: 'Failed to retrieve token' });
    }
  } catch (error) {
    return res.status(500).json({ error: 'Failed to retrieve token' });
  }
});

app.get('/getpreviewurl', (req, res) => {

  const { song, artist } = req.query;

  async function enhancedSearch(song,artist) {
    try {
      // Search with both song name and artist for higher accuracy
      const result = await spotifyPreviewFinder(song, artist, 2);

      if (result.success) {
       
        res.json({ results: result.results });
      } else {
        console.error('Error:', result.error);
      }
    } catch (error) {
      console.error('Error:', error.message);
    }
  }
  enhancedSearch(song,artist);

});

app.listen(port, () => console.log(`Listening on port ${port}`)); //Line 6



