import { describe, expect, it } from "vitest";
import { playableSongs } from "./api";

const track = (uri: string, name = uri) => ({
  uri,
  name,
  artists: [{ name: "A" }, { name: "B" }],
  album: { images: [{ url: `${uri}.jpg` }] },
});

describe("playableSongs", () => {
  it("reads both the item and legacy track fields", () => {
    const songs = playableSongs([{ item: track("spotify:track:1") }, { track: track("spotify:track:2") }]);
    expect(songs.map((s) => s.uri)).toEqual(["spotify:track:1", "spotify:track:2"]);
    expect(songs[0]).toMatchObject({ subtitle: "A, B", imageUrl: "spotify:track:1.jpg" });
  });

  it("skips local files, removed tracks and duplicates", () => {
    const songs = playableSongs([
      { item: track("spotify:track:1") },
      { item: null },
      { is_local: true, item: track("spotify:local:x") },
      { item: track("spotify:track:1") },
    ]);
    expect(songs.map((s) => s.uri)).toEqual(["spotify:track:1"]);
  });

  it("uses the show name and images for episodes", () => {
    const [song] = playableSongs([
      { item: { uri: "spotify:episode:9", name: "Ep", images: [{ url: "e.jpg" }], show: { name: "Contes" } } },
    ]);
    expect(song).toMatchObject({ subtitle: "Contes", imageUrl: "e.jpg" });
  });
});
