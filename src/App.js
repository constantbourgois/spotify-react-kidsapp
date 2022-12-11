import './App.scss';

import { useState } from "react";
import { useEffect } from "react";
import { useCallback } from 'react';

import Player from './Player';
import Moods from './Moods';
import { fetchTracks } from './Spoti';
import { getTrack } from './Spoti';


function App(props) {
  const [showPlayer, setShowPlayer] = useState(false);
  const [isLoading, setLoading] = useState(true);
  const [Mood, setMood] = useState();
  const [SongsArray, setSongsArray] = useState();
  const [currentTrack, setCurrentTrack] = useState();
  const [firstPlay, setFirstPlay] = useState(true);

  // declare the async data fetching function
  const fetchData = useCallback(async () => {
    const data = await fetchTracks();
    setSongsArray(data);
    setLoading(false);
  }, [])

  const callBackendAPI = useCallback(async () => {
    const response = await fetch('/express_backend');
    const body = await response.json();

    if (response.status !== 200) {
      throw Error(body.message) 
    }
    console.log(body);
    return body;
  }, []);

  // the useEffect is only there to call `fetchData` at the right time
  useEffect(() => {
    fetchData()
      // make sure to catch any error
      .catch(console.error);
      callBackendAPI();
  }, [fetchData, callBackendAPI])

  const openPlayer = mood => {
    setShowPlayer(true);
    setMood(mood);
    (async () => {
      const t = await getTrack(SongsArray, mood);
      const newAudioElem = new Audio(t); //get the audio
      setCurrentTrack(newAudioElem);
      newAudioElem.play(); // 

    })()
  };



  if (isLoading) {
    return (<div className="App-header"><svg xmlns="http://www.w3.org/2000/svg" width="57" height="57" viewBox="0 0 57 57" stroke="#fff">
      <g fill="none" fillRule="evenodd">
        <g transform="translate(1 1)" strokeWidth="2">
          <circle cx="5" cy="50" r="5">
            <animate attributeName="cy" begin="0s" dur="2.2s" values="50;5;50;50" calcMode="linear" repeatCount="indefinite" />
            <animate attributeName="cx" begin="0s" dur="2.2s" values="5;27;49;5" calcMode="linear" repeatCount="indefinite" />
          </circle>
          <circle cx="27" cy="5" r="5">
            <animate attributeName="cy" begin="0s" dur="2.2s" from="5" to="5" values="5;50;50;5" calcMode="linear" repeatCount="indefinite" />
            <animate attributeName="cx" begin="0s" dur="2.2s" from="27" to="27" values="27;49;5;27" calcMode="linear" repeatCount="indefinite" />
          </circle>
          <circle cx="49" cy="50" r="5">
            <animate attributeName="cy" begin="0s" dur="2.2s" values="50;50;5;50" calcMode="linear" repeatCount="indefinite" />
            <animate attributeName="cx" from="49" to="49" begin="0s" dur="2.2s" values="49;5;27;49" calcMode="linear" repeatCount="indefinite" />
          </circle>
        </g>
      </g>
    </svg></div>)
  }
  else {
    return (
      <div className="App">
        <header className="App-header">
          <Moods openPlayer={openPlayer} />
          <Player firstPlay={firstPlay} setFirstPlay={setFirstPlay} currentTrack={currentTrack} songsArray={SongsArray} selectedMood={Mood} showPlayer={showPlayer} />
        </header>
      </div>
    );
  }
}

export default App;
