import { useCallback, useEffect, useState } from "react";
import type { Device, PlaylistSummary } from "../spotify/api";
import { getDevices, getMe, getMyPlaylists } from "../spotify/api";
import { logout } from "../spotify/auth";
import { BROWSER_TARGET } from "../spotify/usePlayback";
import type { Settings } from "../settings";
import { Cover } from "./Cover";
import { Bunny } from "./Logo";

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
  const [query, setQuery] = useState("");

  useEffect(() => {
    getMe().then(setMe, () => {});
    getMyPlaylists().then(setPlaylists, () => setLoadError(true));
  }, []);

  const refreshDevices = useCallback(() => {
    setDevices(null);
    getDevices().then(setDevices, () => setDevices([]));
  }, []);
  useEffect(refreshDevices, [refreshDevices]);

  const shown = playlists?.filter((p) => normalize(p.name).includes(normalize(query))) ?? [];

  const otherDevices = devices?.filter((d) => d.name !== "txikimusik" && d.name !== "Ma musique") ?? [];

  const choose = (playlist: PlaylistSummary) => onChange({ playlist });

  return (
    <div className="overlay">
      <div className="settings">
        <header className="settings__header">
          <h1>
            <Bunny size={36} />
            Espace parent
          </h1>
          <p className="settings__account">
            Connecté{me?.display_name ? ` : ${me.display_name}` : ""} ·{" "}
            <button
              className="link-btn"
              onClick={() => {
                if (confirm("Se déconnecter de Spotify sur cet appareil ?")) logout();
              }}
            >
              Se déconnecter
            </button>
          </p>
          {onClose && (
            <button className="primary-btn" onClick={onClose}>
              Retour à la musique
            </button>
          )}
        </header>
        {me?.product && me.product !== "premium" && (
          <p className="warning">La lecture nécessite un abonnement Spotify Premium.</p>
        )}

        <div className="settings__body">
          <section className="settings__playlists">
            <div className="settings__title">
              <h2>Playlist de l'enfant</h2>
              {settings.playlist && <span className="playlist-chosen">{settings.playlist.name}</span>}
            </div>
            {!settings.playlist && (
              <p className="hint">Choisis la playlist dans laquelle l'enfant pourra piocher ses chansons.</p>
            )}
            {loadError && <p className="warning">Impossible de charger les playlists.</p>}
            {!playlists && !loadError && <p>Chargement…</p>}
            {playlists && playlists.length === 0 && <p>Aucune playlist trouvée sur ce compte.</p>}
            {playlists && playlists.length > 8 && (
              <input
                className="playlist-search"
                type="search"
                placeholder="Rechercher une playlist"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Rechercher une playlist"
              />
            )}
            {playlists && playlists.length > 0 && (
              <div className="playlist-list">
                {shown.map((p) => (
                  <button
                    key={p.id}
                    className={`playlist${settings.playlist?.id === p.id ? " playlist--selected" : ""}`}
                    aria-pressed={settings.playlist?.id === p.id}
                    onClick={() => choose(p)}
                  >
                    <Cover url={p.imageUrl} />
                    <span>{p.name}</span>
                  </button>
                ))}
                {shown.length === 0 && <p className="hint">Aucune playlist ne correspond à « {query} ».</p>}
              </div>
            )}
          </section>

          <div className="settings__side">
            <section>
              <div className="settings__title">
                <h2>Où jouer la musique</h2>
                <button className="link-btn" onClick={refreshDevices}>
                  Actualiser
                </button>
              </div>
              <div className="device-list">
                <label className="device">
                  <input
                    type="radio"
                    name="device"
                    checked={settings.target === BROWSER_TARGET}
                    onChange={() => onChange({ target: BROWSER_TARGET, targetName: "Ce navigateur" })}
                  />
                  Sur cet appareil
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
              <p className="hint">Une enceinte n'apparaît que si Spotify est ouvert dessus.</p>
            </section>

            <section>
              <h2>Code parent</h2>
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
                  aria-label={settings.pin ? "Nouveau code" : "Code à 4 chiffres"}
                />
                <button className="primary-btn" type="submit" disabled={pinDraft.length !== 4}>
                  {settings.pin ? "Changer" : "Enregistrer"}
                </button>
                {settings.pin && (
                  <button type="button" className="link-btn" onClick={() => onChange({ pin: null })}>
                    Supprimer
                  </button>
                )}
              </form>
              <p className="hint">
                {settings.pin ? "Un code protège cet espace." : "4 chiffres, pour que l'enfant ne change pas les réglages."}
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Recherche insensible à la casse et aux accents (« comptine » trouve « Comptines à danser »). */
function normalize(text: string): string {
  return text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();
}
