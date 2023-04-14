import { List, Image, LocalStorage, Detail, ActionPanel, Action } from "@raycast/api";
import { useEffect, useState } from "react";
import { Actions } from "./components/Actions";
import { SETTINGS_KEY_ACCESS_TOKEN, SETTINGS_KEY_REFRESH_TOKEN } from "./settings";
import MatterFetcher from "./fetcher";
import { FeedEntry } from "./api";
import { fetchQRSessionToken, pollQRLoginExchange } from "./auth";

interface State {
  items?: FeedEntry[];
  error?: Error;
}

function useAuth() {
  const [loaded, setLoaded] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>();
  const [refreshToken, setRefreshToken] = useState<string | null>();

  useEffect(() => {
    loadSettings();
    setLoaded(true);
  }, []);

  const loadSettings = async () => {
    setAccessToken(await LocalStorage.getItem<string>(SETTINGS_KEY_ACCESS_TOKEN));
    setRefreshToken(await LocalStorage.getItem<string>(SETTINGS_KEY_REFRESH_TOKEN));
  };

  const handleExchange = async (response: any) => {
    console.log(`Got Exchange response :`);
    console.log(response);
    if (response.access_token && response.refresh_token) {
      setAccessToken(response.access_token);
      setRefreshToken(response.refresh_token);
      await LocalStorage.setItem(SETTINGS_KEY_ACCESS_TOKEN, response.access_token);
      await LocalStorage.setItem(SETTINGS_KEY_REFRESH_TOKEN, response.refresh_token);
    }
  };

  return {
    loaded,
    accessToken,
    refreshToken,
    handleExchange,
  };
}

export default function Command() {
  const [fetching, setFetching] = useState(true);
  const [state, setState] = useState<State>({});
  // 1 = queue, 2 = favorites
  const [filter, setFilter] = useState<Date>();
  const [sessionToken, setSessionToken] = useState<string | null>();
  const { accessToken, refreshToken, loaded, handleExchange } = useAuth();
  const isAuthed = accessToken && refreshToken && loaded;

  const setupQR = async () => {
    const _sessionToken = await fetchQRSessionToken();
    setSessionToken(_sessionToken);
    const response = await pollQRLoginExchange(_sessionToken);
    handleExchange(response);
  };

  useEffect(() => {
    if (!isAuthed && loaded) {
      setupQR();
    }
  }, [isAuthed, loaded]);

  useEffect(() => {
    if (accessToken) fetchQueue();
  }, [filter, sessionToken, accessToken]);

  async function fetchQueue() {
    try {
      console.log(`About to FETCH : ${accessToken} / ${refreshToken}`);
      const fetcher: MatterFetcher = new MatterFetcher({ accessToken, refreshToken });
      const items: FeedEntry[] = await fetcher.sync();
      setState({ items });
      setFetching( false );
    } catch (error) {
      console.error(error);
      await LocalStorage.removeItem(SETTINGS_KEY_ACCESS_TOKEN);
      await LocalStorage.removeItem(SETTINGS_KEY_REFRESH_TOKEN);
      setState({
        error: error instanceof Error ? error : new Error("Something went wrong with fetching the articles"),
      });
    }
  }

  function appReset() {
    setFilter(new Date());
  }

  return (
    <>
      {accessToken || !loaded ? (
        <List isLoading={fetching}>
          {state
            ? state.items?.map((item: FeedEntry) => (
                <List.Item
                  key={item.id}
                  icon={{
                    source: "",
                    mask: Image.Mask.Circle,
                  }}
                  title={item.content.title}
                  actions={<Actions item={item} />}
                  accessories={[
                    {
                      text: "",
                    },
                  ]}
                />
              ))
            : ""}
        </List>
      ) : (
        <Detail
          markdown={`API key incorrect. Please update it in extension preferences and try again. Get more information on how to get your Matter token [here](https://www.raycast.com/zan/matter). Once you have your token, you can update it in the extension preferences by pressing enter.
    \n![](https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${sessionToken})\nTOK ${sessionToken}`}
          actions={
            <ActionPanel>
              <Action title="Open Extension Preferences" onAction={appReset} />
            </ActionPanel>
          }
        />
      )}
    </>
  );
}
