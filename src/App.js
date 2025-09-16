import "./App.scss";

import { useState } from "react";
import { useEffect } from "react";

import Player from "./Player";
import Moods from "./Moods";
import { fetchTracks } from "./Spoti";
import { getTrack } from "./Spoti";
import { getToken } from "./Spoti";
import loadingIcon from "./loading-icon.svg";

function App(props) {
  const [showPlayer, setShowPlayer] = useState(false);
  const [isLoading, setLoading] = useState(true);
  const [Mood, setMood] = useState();
  const [SongsArray, setSongsArray] = useState();
  const [currentTrack, setCurrentTrack] = useState();
  const [firstPlay, setFirstPlay] = useState(true);
  const [firstToken, setFirstToken] = useState();

  useEffect(() => {
    (async () => {

      const token = await getToken();
      setFirstToken(token);
      const data = await fetchTracks(token);
      setSongsArray(data);
      setLoading(false);

    })();
  }, []);

  const openPlayer = (mood) => {
    setShowPlayer(true);
    setMood(mood);
    (async () => {
      const t = await getTrack(SongsArray, mood);
       console.log(t);
      const newAudioElem = new Audio(t); //get the audio
      setCurrentTrack(newAudioElem);
      newAudioElem.play(); //
    })();
  };

  if (isLoading) {
    return (
      <div className="App-header">
        <img src={loadingIcon} alt="loadingIcon"></img>
      </div>
    );
  } else {
    return (
      <div className="App">
        <header className="App-header">
          <Moods openPlayer={openPlayer} />
          <Player
            token={firstToken}
            firstPlay={firstPlay}
            setFirstPlay={setFirstPlay}
            currentTrack={currentTrack}
            songsArray={SongsArray}
            selectedMood={Mood}
            showPlayer={showPlayer}
          />
        </header>
      </div>
    );
  }
}

export default App;
