import fetch from "node-fetch";
import { ENDPOINTS, FeedEntry, FeedResponse, authedRequest } from "./api";
import { DEFAULT_SETTINGS, MatterSettings, SETTINGS_KEY_ACCESS_TOKEN, SETTINGS_KEY_REFRESH_TOKEN } from "./settings";
import { LocalStorage } from "@raycast/api";

export default class MatterFetcher {
  settings: MatterSettings = DEFAULT_SETTINGS;

  constructor(settings: MatterSettings) {
    this.settings = settings;
  }

  async sync(): Promise<FeedEntry[]> {
    let feedEntries: FeedEntry[] = [];

    try {
      feedEntries = await this._getFeedItems();
      this.settings.lastSync = new Date().toISOString();
    } catch (error) {
      console.error(error);
      throw error;
    }

    return feedEntries;
  }

  private async _getFeedItems(): Promise<FeedEntry[]> {
    let url: string | null = ENDPOINTS.HIGHLIGHTS_FEED;
    let feedEntries: FeedEntry[] = [];

    // Load all feed items new to old.
    while (url !== null) {
      const response: FeedResponse = (await this._authedRequest(url)) as FeedResponse;
      feedEntries = feedEntries.concat(response.feed);
      url = response.next;
    }

    // Reverse the feed items so that chronological ordering is preserved.
    feedEntries = feedEntries.reverse();

    return feedEntries;
  }

  private async _authedRequest(url: string) {
    try {
      return await authedRequest(this.settings.accessToken, url);
    } catch (e) {
      console.error(e);
      await this._refreshTokenExchange();
      return await authedRequest(this.settings.accessToken, url);
    }
  }

  private async _refreshTokenExchange() {
    const response = await fetch(ENDPOINTS.REFRESH_TOKEN_EXCHANGE, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refresh_token: this.settings.refreshToken }),
    });
    const payload: any = await response.json();
    console.log(`Attempt to refresh token:`);
    console.log(payload);
    this.settings.accessToken = payload.access_token;
    this.settings.refreshToken = payload.refresh_token;
    await LocalStorage.setItem(SETTINGS_KEY_ACCESS_TOKEN, payload.access_token);
    await LocalStorage.setItem(SETTINGS_KEY_REFRESH_TOKEN, payload.refresh_token);

    if (!this.settings.accessToken) {
      throw new Error("Authentication failed. Unable to sync with Matter, please sign in again");
    }
  }
}
