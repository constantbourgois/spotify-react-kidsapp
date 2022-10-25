
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import { TbMoodCrazyHappy } from "react-icons/tb";
import { TbMoodHappy } from "react-icons/tb";
import { TbMoodSad } from "react-icons/tb";
import { IconContext } from "react-icons";
import Button from "./Button"


export default function Moods(props) {

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Grid align="center" height="100vh" container spacing={2}>
        <IconContext.Provider
          value={{ size: "4em", color: "white", className: "global-class-name" }}
        >
          <Grid item xs={12}>
            <h1>What's your mood?</h1>
          </Grid>
          <Grid item xs={4}>
            <Button mood="excited" openPlayer={props.openPlayer}>
              <TbMoodCrazyHappy />
            </Button>
          </Grid>
          <Grid item xs={4}>
            <Button mood="sad" openPlayer={props.openPlayer}>
              <TbMoodSad />
            </Button>
          </Grid>
          <Grid item xs={4}>
            <Button mood="happy" openPlayer={props.openPlayer}>
              <TbMoodHappy />
            </Button>
          </Grid>
        </IconContext.Provider>
      </Grid>
    </Box>
  );

}