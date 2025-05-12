import React, {useEffect, useState} from "react";
import { writeText } from '@tauri-apps/plugin-clipboard-manager';
import "./App.css";
import {twMerge} from "tailwind-merge";

type Podcast = {
  id: number;
  title: string;
}

type Episode = {
  id: number;
  guid: string;
  title: string;
}

const SelectedItem: React.FC<React.PropsWithChildren<{ onReset: () => void }>> = ({ children, onReset })=> {
  return (
    <div className="flex gap-4">
      <div className={"flex-1 bg-neutral-500/10 rounded px-4 py-3"}>{children}</div>
      <Button onClick={onReset}>×</Button>
    </div>
  );
}

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({ className, ...props }) => (
  <input {...props} className={twMerge("bg-neutral-300 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200 px-4 py-3 rounded", className)} {...props} />
);

const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ className, children, ...props }) => (
  <button {...props} className={twMerge("bg-neutral-500/20 hover:bg-neutral-500/30 px-4 py-3 rounded cursor-pointer", className)}>{children}</button>
);

const isError = (obj: any)=> {
  return obj.code && obj.message;
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
    <main className="mx-6 my-4 flex flex-col gap-4">
      <h1 className="text-2xl">Podigee GUID Browser</h1>

      {!apiKey ? (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setApiKey(e.currentTarget.apikey.value);
          }}
          className="flex gap-4 py-1"
        >
          <Input
            name="apikey"
            placeholder="Podigee API-Key"
            className={"flex-1"}
          />
          <Button type="submit">→</Button>
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
      {isError(podcasts) && (
        <div className={"border rounded border-red-500 bg-red-500/10 text-red-500 px-4 py-3"}>
          Fehler: {(podcasts as any).code}<br />{(podcasts as any).message}<br />{(podcasts as any).reason}
        </div>
      )}
      {podcasts.length > 0 && (
        selectedPodcast ? (
          <SelectedItem
            onReset={() => {
              setSelectedPodcast(null);
              setEpisodes([]);
            }}
          >Podcast: {selectedPodcast.title}</SelectedItem>
        ) : (
          <div className="">
            {podcasts.map((podcast) => (
              <Button className="w-full text-left" key={podcast.id} onClick={() => { setSelectedPodcast(podcast); }}>
                {podcast.title}
              </Button>
            ))}
          </div>
        )
      )}

      {episodes.length > 0 && (
        <table className={"[&_td]:bg-neutral-500/10 [&_td]:px-4 [&_td]:py-1"}>
          <tbody>
            {episodes.map(episode => (
              <tr key={episode.id} className={"[&:first-child>td:first-child]:rounded-tl [&:first-child>td:last-child]:rounded-tr [&:last-child>td:first-child]:rounded-bl [&:last-child>td:last-child]:rounded-br"}>
                <td>{episode.id}</td>
                <td>{episode.title} {episode.title} {episode.title}</td>
                <td>
                  <Button
                    className={"w-full"}
                    onClick={async () => {
                      await writeText(episode.guid);
                      setToast("GUID in die Zwischenablage kopiert");
                      window.setTimeout(() => {
                        setToast(null);
                      }, 3000);
                    }}
                  >{episode.guid}</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className={twMerge("absolute bottom-4 left-4 bg-neutral-900 dark:bg-neutral-100 text-neutral-100 dark:text-neutral-900 px-4 py-3 rounded-lg shadow-lg transition",
        !toast && "opacity-0 -translate-x-[100%]"
      )}>{toast}</div>
    </main>
  );
}

export default App;
