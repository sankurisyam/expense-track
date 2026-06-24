import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchPreferences, updatePreferences } from "../services/api";

function Settings() {
  const { theme } = useParams();
  const navigate = useNavigate();
  const [preferences, setPreferences] = useState({ theme: "light" });
  const [status, setStatus] = useState("");

  useEffect(() => {
    let active = true;

    fetchPreferences()
      .then((data) => {
        if (!active) return;
        setPreferences(data);
        if (data.theme) {
          document.documentElement.dataset.theme = data.theme;
        }
      })
      .catch((error) => {
        if (active) setStatus(error.message || "Unable to load settings");
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    // Handle route-based theme change: /settings/dark or /settings/light
    if (!theme) return;
    const valid = theme === "dark" || theme === "light";
    if (!valid) {
      navigate("/settings", { replace: true });
      return;
    }

    (async () => {
      try {
        const updated = await updatePreferences({ theme });
        setPreferences(updated);
        document.documentElement.dataset.theme = updated.theme;
        setStatus(`Theme switched to ${updated.theme}.`);
      } catch (err) {
        setStatus(err.message || "Unable to update theme");
      }
    })();
  }, [theme, navigate]);

  const currentTheme = preferences.theme || "light";
  const nextTheme = currentTheme === "dark" ? "light" : "dark";

  async function handleToggleTheme() {
    setStatus("");

    try {
      const updated = await updatePreferences({ theme: nextTheme });
      setPreferences(updated);
      document.documentElement.dataset.theme = updated.theme;
      setStatus(`Theme switched to ${updated.theme}.`);
    } catch (error) {
      setStatus(error.message || "Unable to update theme");
    }
  }

  return (
    <div className="page settings-page">
      <header className="page-header">
        <span className="eyebrow">Preferences</span>
        <h1>Settings</h1>
        <p>Personalize the workspace for comfortable expense tracking.</p>
      </header>

      <section className="settings-panel">
        <div className="settings-row">
          <div>
            <span className="eyebrow">Appearance</span>
            <h3>Theme mode</h3>
            <p>Current theme: <strong>{currentTheme}</strong></p>
          </div>
          <button className="btn btn-primary" onClick={handleToggleTheme}>
            Switch to {nextTheme === "dark" ? "Dark" : "Light"} mode
          </button>
        </div>
      </section>

      {status && <p className="status-banner success">{status}</p>}
    </div>
  );
}

export default Settings;
