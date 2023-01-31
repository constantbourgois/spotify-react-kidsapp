//set up the server
require('dotenv').config();
const express = require('express'); //Line 1
const app = express(); //Line 2
const port = process.env.PORT || 5000; //Line 3

if (process.env.NODE_ENV === 'production') {
  app.use(express.static('build'));
}

// prepare the first call to spotify api
const axios = require('axios');

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

( async () => {
  const t = await getToken();
  // create a GET route
  await app.get('/moods', (req, res) => { 

    res.send({ token: `${t}` }); 
  }); 
})()

app.listen(port, () => console.log(`Listening on port ${port}`)); //Line 6

/*
 const getToken = async () => {

  const Token = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      body: 'grant_type=client_credentials',
      headers: {
          'Authorization': 'Basic ' + (Buffer.from(client_id + ':' + client_secret).toString('base64')),
          'Content-Type': 'application/x-www-form-urlencoded'
      }
  }).then(function (resp) {
      // Return the response as JSON
      return resp.json();

  }).then(function (data) {

      return data.access_token;

  }).catch(function (err) {

      // Log any errors
      console.log('something went wrong', err);

  });

  return Token;
}
*/

