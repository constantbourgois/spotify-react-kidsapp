import { useEffect, useState } from "react";
import { KidApp } from "./components/KidApp";
import { ParentSettings } from "./components/ParentSettings";
import { PinGate } from "./components/PinGate";
import { useSettings } from "./settings";
import { CLIENT_ID, completeLoginFromUrl, loadTokens, LOGOUT_EVENT, startLogin } from "./spotify/auth";

// Module scope so React StrictMode's double effect cannot exchange the code twice.
const startup = completeLoginFromUrl();

export function App() {
  const [status, setStatus] = useState<"loading" | "loggedOut" | "loggedIn">("loading");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [settings, updateSettings] = useSettings();
  const [parentMode, setParentMode] = useState<"closed" | "pin" | "open">("closed");

  useEffect(() => {
    startup
      .catch((e: Error) => setLoginError(e.message))
      .finally(() => setStatus(loadTokens() ? "loggedIn" : "loggedOut"));
    const onLogout = () => {
      setStatus("loggedOut");
      setParentMode("closed");
    };
    window.addEventListener(LOGOUT_EVENT, onLogout);
    return () => window.removeEventListener(LOGOUT_EVENT, onLogout);
  }, []);

  if (status === "loading") {
    return (
      <div className="message">
        <div className="spinner" />
      </div>
    );
  }

  if (status === "loggedOut") {
    return (
      <div className="login">
        <h1>Ma musique</h1>
        <p>
          Espace parent : connecte ton compte Spotify une seule fois.
          <br />
          L'appli reste connectée ensuite.
        </p>
        {CLIENT_ID ? (
          <button className="primary-btn primary-btn--spotify" onClick={() => startLogin()}>
            Se connecter avec Spotify
          </button>
        ) : (
          <p className="warning">VITE_SPOTIFY_CLIENT_ID n'est pas configuré.</p>
        )}
        {loginError && <p className="warning">{loginError}</p>}
      </div>
    );
  }

  const openParent = () => setParentMode(settings.pin ? "pin" : "open");

  return (
    <>
      {settings.playlist && (
        <KidApp playlist={settings.playlist} target={settings.target} onParent={openParent} />
      )}
      {(!settings.playlist || parentMode === "open") && (
        <ParentSettings
          settings={settings}
          onChange={updateSettings}
          onClose={settings.playlist ? () => setParentMode("closed") : undefined}
        />
      )}
      {parentMode === "pin" && settings.pin && (
        <PinGate pin={settings.pin} onUnlock={() => setParentMode("open")} onCancel={() => setParentMode("closed")} />
      )}
    </>
  );
}
