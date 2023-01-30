import { getTrack } from "./Spoti";

import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import { IconContext } from "react-icons";
import { GrPlay } from "react-icons/gr";
import { GrChapterNext } from "react-icons/gr";
import { GrStop } from "react-icons/gr";
import { fetchTracks } from "./Spoti";
import { useState } from "react";
import { useEffect } from "react";

const style = {
  width: "100vw",
  height: "100vh",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  top: 0,
  left: 0,
  backgroundColor: "#282c34",
  position: "absolute",
};

const Buttons = (props) => {
  const [currentTrack, setCurrentTrack] = useState();
  const [nextTrack, setNextTrack] = useState();
  const mood = props.mood;
  const firstPlay = props.firstPlay;
  const setFirstPlay = props.setFirstPlay;

  console.log(props);
  let playingTrack;

  if (firstPlay === true) {
    // if it's the first time a track is played
    playingTrack = props.currentTrack;
  } else {
    // otherwise
    playingTrack = currentTrack;
  }

  useEffect(() => {
    if (currentTrack) {
      currentTrack.play();
    }
    if (nextTrack) {
      console.log(currentTrack, nextTrack);
    }
  }, [nextTrack, currentTrack]);

  function stopPlay() {
    playingTrack.pause();
  }

  function startPlay() {
    playingTrack.play();
  }

  function nextPlay() {
    playingTrack.pause();

    if (firstPlay === true) {
      setCurrentTrack(props.nextTrack);
    } else if (firstPlay === false) {
      setCurrentTrack(nextTrack);
    }
    //currentTrack.play();

    // get the next track
    (async () => {
      const SongsArray = await fetchTracks(props.token);
      const t = await getTrack(SongsArray, mood);
      const newAudioElem = new Audio(t); //get the audio
      setNextTrack(newAudioElem);
    })();

    setFirstPlay(false);
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Grid
        alignItems="center"
        justifyContent="center"
        height="100vh"
        container
        spacing={2}
      >
        <IconContext.Provider
          value={{
            size: "4em",
            color: "white",
            className: "global-class-name",
          }}
        >
          <Grid onClick={startPlay} textAlign="center" item xs={4}>
            <button>
              <GrPlay />
            </button>
          </Grid>
          <Grid onClick={stopPlay} textAlign="center" item xs={4}>
            <button>
              <GrStop />
            </button>
          </Grid>
          <Grid onClick={nextPlay} textAlign="center" item xs={4}>
            <button>
              <GrChapterNext />
            </button>
          </Grid>
        </IconContext.Provider>
      </Grid>
    </Box>
  );
};

export default function Player(props) {
  const [nextTrack, setNextTrack] = useState(null);
  const mood = props.selectedMood;

  useEffect(() => {
    if (props.selectedMood) {
      //console.log(props.firstPlay);
      //props.setFirstPlay(false);
      (async () => {
        // get the next track
        const SongsArray = await fetchTracks(props.token);
        const t = await getTrack(SongsArray, props.selectedMood);
        const newAudioElem = new Audio(t); //get the audio
        setNextTrack(newAudioElem);
      })();
    }
    console.log("mood", props.selectedMood);
  }, [props.selectedMood, props.token]);

  if (props.showPlayer === true) {
    return (
      <div className="player" style={style}>
        <Buttons
          firstPlay={props.firstPlay}
          setFirstPlay={props.setFirstPlay}
          currentTrack={props.currentTrack}
          nextTrack={nextTrack}
          mood={mood}
          token={props.token}
        />
      </div>
    );
  }
}
