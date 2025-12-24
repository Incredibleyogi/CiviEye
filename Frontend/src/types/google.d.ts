/* eslint-disable @typescript-eslint/no-explicit-any */
// Google Identity Services types
interface GoogleCredentialResponse {
  credential: string;
  select_by: string;
}

interface GooglePromptMomentNotification {
  isDisplayMoment: () => boolean;
  isDisplayed: () => boolean;
  isNotDisplayed: () => boolean;
  getNotDisplayedReason: () => string;
  isSkippedMoment: () => boolean;
  getSkippedReason: () => string;
  isDismissedMoment: () => boolean;
  getDismissedReason: () => string;
  getMomentType: () => string;
}

interface GoogleIdConfiguration {
  client_id: string;
  auto_select?: boolean;
  callback?: (response: GoogleCredentialResponse) => void;
  login_uri?: string;
  native_callback?: (response: GoogleCredentialResponse) => void;
  cancel_on_tap_outside?: boolean;
  prompt_parent_id?: string;
  nonce?: string;
  context?: string;
  state_cookie_domain?: string;
  ux_mode?: 'popup' | 'redirect';
  allowed_parent_origin?: string | string[];
  intermediate_iframe_close_callback?: () => void;
}

interface GoogleButtonConfiguration {
  type: 'standard' | 'icon';
  theme?: 'outline' | 'filled_blue' | 'filled_black';
  size?: 'large' | 'medium' | 'small';
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
  shape?: 'rectangular' | 'pill' | 'circle' | 'square';
  logo_alignment?: 'left' | 'center';
  width?: string;
  locale?: string;
}

interface GoogleAccountsId {
  initialize: (config: GoogleIdConfiguration) => void;
  prompt: (momentListener?: (notification: GooglePromptMomentNotification) => void) => void;
  renderButton: (parent: HTMLElement, config: GoogleButtonConfiguration) => void;
  disableAutoSelect: () => void;
  storeCredential: (credential: { id: string; password: string }, callback?: () => void) => void;
  cancel: () => void;
  revoke: (hint: string, callback?: (response: { successful: boolean; error?: string }) => void) => void;
}

interface GoogleAccounts {
  id: GoogleAccountsId;
}

interface Google {
  accounts: GoogleAccounts;
}

declare const google: Google | undefined;
