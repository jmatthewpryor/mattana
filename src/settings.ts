

export enum SyncNotificationPreference {
  NEVER = 'never',
  ERROR = 'error',
  ALWAYS = 'always',
}

export interface MatterSettings {
  accessToken: string | null | undefined;
  refreshToken: string | null | undefined;
  qrSessionToken?: string | null | undefined;
  lastSync?: string | null | undefined;
  highlightTemplate?: string | null | undefined;
}

export const DEFAULT_SETTINGS: MatterSettings = {
  accessToken: null,
  refreshToken: null,
  qrSessionToken: null,
  lastSync: null,
  highlightTemplate: null,
}

export const SETTINGS_KEY_ACCESS_TOKEN = "MatterSettings.AccessToken";
export const SETTINGS_KEY_REFRESH_TOKEN = "MatterSettings.RefreshToken";
