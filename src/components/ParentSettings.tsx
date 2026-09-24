import { useCallback, useEffect, useState } from "react";
import type { Device, PlaylistSummary } from "../spotify/api";
import { getDevices, getMe, getMyPlaylists } from "../spotify/api";
import { logout } from "../spotify/auth";
import { BROWSER_TARGET } from "../spotify/usePlayback";
import type { Settings } from "../settings";
import { Cover } from "./Cover";

type Props = {
  settings: Settings;
  onChange: (patch: Partial<Settings>) => void;
  onClose?: () => void;
};

export function ParentSettings({ settings, onChange, onClose }: Props) {
  const [me, setMe] = useState<{ display_name: string | null; product?: string } | null>(null);
  const [playlists, setPlaylists] = useState<PlaylistSummary[] | null>(null);
  const [devices, setDevices] = useState<Device[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [pinDraft, setPinDraft] = useState("");

  useEffect(() => {
    getMe().then(setMe, () => {});
    getMyPlaylists().then(setPlaylists, () => setLoadError(true));
  }, []);

  const refreshDevices = useCallback(() => {
    setDevices(null);
    getDevices().then(setDevices, () => setDevices([]));
  }, []);
  useEffect(refreshDevices, [refreshDevices]);

  const otherDevices = devices?.filter((d) => d.name !== "Ma musique") ?? [];

  return (
    <div className="overlay overlay--scroll">
      <div className="settings">
        <header className="settings__header">
          <h1>Espace parent</h1>
          {onClose && (
            <button className="primary-btn" onClick={onClose}>
              Retour à la musique
            </button>
          )}
        </header>

        <section>
          <h2>Compte Spotify</h2>
          <p>
            Connecté{me?.display_name ? ` en tant que ${me.display_name}` : ""}. La connexion reste active sur cet
            appareil.
          </p>
          {me?.product && me.product !== "premium" && (
            <p className="warning">La lecture nécessite un abonnement Spotify Premium.</p>
          )}
          <button
            className="link-btn"
            onClick={() => {
              if (confirm("Se déconnecter de Spotify sur cet appareil ?")) logout();
            }}
          >
            Se déconnecter
          </button>
        </section>

        <section>
          <h2>Playlist de l'enfant</h2>
          {!settings.playlist && <p>Choisis la playlist dans laquelle l'enfant pourra piocher ses chansons.</p>}
          {loadError && <p className="warning">Impossible de charger les playlists.</p>}
          {!playlists && !loadError && <p>Chargement…</p>}
          {playlists && playlists.length === 0 && <p>Aucune playlist trouvée sur ce compte.</p>}
          <div className="playlist-list">
            {playlists?.map((p) => (
              <button
                key={p.id}
                className={`playlist${settings.playlist?.id === p.id ? " playlist--selected" : ""}`}
                onClick={() => onChange({ playlist: p })}
              >
                <Cover url={p.imageUrl} />
                <span>{p.name}</span>
              </button>
            ))}
          </div>
        </section>

        <section>
          <h2>Où jouer la musique</h2>
          <div className="device-list">
            <label className="device">
              <input
                type="radio"
                name="device"
                checked={settings.target === BROWSER_TARGET}
                onChange={() => onChange({ target: BROWSER_TARGET, targetName: "Ce navigateur" })}
              />
              Sur cet appareil (dans le navigateur)
            </label>
            {otherDevices.map((d) => (
              <label className="device" key={d.id}>
                <input
                  type="radio"
                  name="device"
                  checked={settings.target === d.id}
                  onChange={() => onChange({ target: d.id, targetName: d.name })}
                />
                {d.name} <small>({d.type})</small>
              </label>
            ))}
            {settings.target !== BROWSER_TARGET && !otherDevices.some((d) => d.id === settings.target) && (
              <label className="device">
                <input type="radio" name="device" checked readOnly />
                {settings.targetName} <small>(hors ligne)</small>
              </label>
            )}
          </div>
          <p className="hint">
            Pour une enceinte ou un autre appareil, ouvre Spotify dessus pour qu'il apparaisse ici.{" "}
            <button className="link-btn" onClick={refreshDevices}>
              Actualiser
            </button>
          </p>
        </section>

        <section>
          <h2>Code parent</h2>
          <p>
            {settings.pin
              ? "Un code protège cet espace."
              : "Ajoute un code à 4 chiffres pour que l'enfant ne puisse pas changer les réglages."}
          </p>
          <form
            className="pin-form"
            onSubmit={(e) => {
              e.preventDefault();
              if (/^\d{4}$/.test(pinDraft)) {
                onChange({ pin: pinDraft });
                setPinDraft("");
              }
            }}
          >
            <input
              inputMode="numeric"
              pattern="\d{4}"
              maxLength={4}
              placeholder="••••"
              value={pinDraft}
              onChange={(e) => setPinDraft(e.target.value.replace(/\D/g, ""))}
              aria-label="Nouveau code"
            />
            <button className="primary-btn" type="submit" disabled={pinDraft.length !== 4}>
              {settings.pin ? "Changer le code" : "Enregistrer"}
            </button>
            {settings.pin && (
              <button type="button" className="link-btn" onClick={() => onChange({ pin: null })}>
                Supprimer le code
              </button>
            )}
          </form>
        </section>
      </div>
    </div>
  );
}
