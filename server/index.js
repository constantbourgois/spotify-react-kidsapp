import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dist = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "dist");
const app = express();

app.use(express.static(dist));
app.get("/{*splat}", (_req, res) => res.sendFile(path.join(dist, "index.html")));

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Listening on port ${port}`));
