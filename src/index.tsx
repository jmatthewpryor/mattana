import { List, Image, LocalStorage, Detail, ActionPanel, Action, Form } from "@raycast/api";
import { useEffect, useState } from "react";
import { Actions } from "./components/Actions";
import { SETTINGS_KEY_ACCESS_TOKEN, SETTINGS_KEY_REFRESH_TOKEN } from "./settings";
import MatterFetcher from "./fetcher";
import { FeedEntry } from "./api";
import { fetchQRSessionToken, pollQRLoginExchange } from "./auth";
import { format, parseISO } from "date-fns";

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
  const [sessionToken, setSessionToken] = useState<string | null>();
  const { accessToken, refreshToken, loaded, handleExchange } = useAuth();
  const isAuthed = accessToken && refreshToken && loaded;
  const [date, setDate] = useState<Date>(new Date());

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
  }, [date, sessionToken, accessToken]);

  async function fetchQueue() {
    try {
      setFetching(true);
      console.log(`About to FETCH : ${accessToken} / ${refreshToken}`);
      const fetcher: MatterFetcher = new MatterFetcher({ accessToken, refreshToken });
      const items: FeedEntry[] = (await fetcher.sync())
      .filter((value)=>{
        let shouldShow = false;
        if (value.content?.my_annotations && value.content.my_annotations.length) {
          value.content.my_annotations.forEach((annotation) => {
            const created_date: Date = parseISO(annotation.created_date);
            if (date && created_date.getTime() > date.getTime()) {
              shouldShow= true;
            }
          });
          return shouldShow;
        } else {
          return shouldShow;
        }
      })
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
    setDate(new Date());
  }

  return (
    <>
      {accessToken || !loaded ? (
        <List
          isLoading={fetching}
          actions={
            <ActionPanel>
              <Action.PickDate
                title="Set Search Date"
                onChange={(value) => {
                  setDate(value ? value : new Date(0));
                }}
              />
              <Action title="Open Extension Preferences" onAction={appReset} />
            </ActionPanel>
          }
        >
          {state?.items?.length == 0 && (
            <List.EmptyView
              icon={{ source: "https://placekitten.com/500/500" }}
              title={`No highlights found after ${format(
                date,
                "MMMM do, yyyy"
              )}, consider setting date to an earlier time.`}
            />
          )}
          {state &&
            state.items?.map((item: FeedEntry) => (
              <List.Item
                key={item.id}
                icon={{
                  source: item.content.photo_thumbnail_url
                    ? item.content.photo_thumbnail_url
                    : item.content.publisher.domain_photo,
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
            ))}
        </List>
      ) : (
        <Detail
          markdown={`# Set up your access key\n Open up the Matter mobile app, go to account settings->Connect Accounts then use either Obsidian / Roam Research to scan the QR Code below.\n
    \n![](https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${sessionToken})`}
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
