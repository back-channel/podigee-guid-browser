import React, {useEffect, useState} from "react";
import { writeText } from '@tauri-apps/plugin-clipboard-manager';
import "./App.css";

type Podcast = {
  id: number;
  title: string;
}

type Episode = {
  id: number;
  guid: string;
  title: string;
}

function SelectedItem({ children, onReset }: { children: React.ReactNode, onReset: () => void }) {
  return (
    <div className="selected-item">
      <div>{children}</div>
      <span className="remove-button" aria-role="button" onClick={() => { onReset(); }}>×</span>
    </div>

  );
}

function App() {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [selectedPodcast, setSelectedPodcast] = useState<Podcast | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  async function apiRequest(path: string) {
    if (!apiKey) return Promise.reject("Missing API key");
    const response = await fetch(`https://app.podigee.com/api/v1${path}`, {
      headers: {
        "Content-Type": "application/json",
        "Token": apiKey,
      }
    });
    return response.json();
  }


  async function fetchPodcasts() {
    return apiRequest('/podcasts');
  }

  async function fetchEpisodes(podcast: Podcast) {
    return apiRequest(`/episodes?podcast_id=${podcast.id}`)
  }

  useEffect(() => {
    fetchPodcasts().then((podcasts) => setPodcasts(podcasts));
  }, [apiKey]);

  useEffect(() => {
    if (apiKey && selectedPodcast) {
      fetchEpisodes(selectedPodcast).then((episodes) => setEpisodes(episodes));
    }
  }, [apiKey, selectedPodcast]);

  return (
    <main className="container">
      <h1>Podigee GUID Browser</h1>

      <div className="row">
      </div>

      {!apiKey ? (
        <form
          className="row"
          onSubmit={async (e) => {
            e.preventDefault();
            setApiKey(e.currentTarget.apikey.value);
          }}
        >
          <input
            name="apikey"
            placeholder="Podigee API Key"
          />
          <button type="submit">Browse</button>
        </form>
        ) : (
          <SelectedItem
            onReset={() => {
              setApiKey(null);
              setPodcasts([]);
              setSelectedPodcast(null);
              setEpisodes([]);
            }}
          >API-Key: {apiKey.substring(0, 4) + '…'}</SelectedItem>
        )
      }

      {podcasts.length > 0 && (
        selectedPodcast ? (
          <SelectedItem
            onReset={() => {
              setSelectedPodcast(null);
              setEpisodes([]);
            }}
          >Podcast: {selectedPodcast.title}</SelectedItem>
        ) : (
          <div className="podcast-list">
            {podcasts.map((podcast) => (
              <button className="podcast-item" key={podcast.id} onClick={() => { setSelectedPodcast(podcast); }}>
                {podcast.title}
              </button>
            ))}
          </div>
        )
      )}

      {episodes.length > 0 && (
        <table>
          <thead><tr><th>ID</th><th>Title</th><th>GUID</th></tr></thead>
          <tbody>
          {episodes.map(episode => (
            <tr key={episode.id}>
              <td>{episode.id}</td>
              <td>{episode.title}</td>
              <td>
                <span
                  className="copyable"
                  onClick={async () => {
                    await writeText(episode.guid);
                    setToast("Copied to clipboard");
                    window.setTimeout(() => {
                      setToast(null);
                    }, 3000);
                  }}
                >{episode.guid}</span>
              </td>
            </tr>
          ))}
          </tbody>
        </table>
      )}

      {toast && (
        <div className="toast">{toast}</div>
      )}
    </main>
  );
}

export default App;
