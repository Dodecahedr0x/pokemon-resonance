import { version } from '../../lib/store.js';

// The engine calls renderParams() to redraw the Settings (page display,
// panel button, reset…): the React page is then rebuilt with the
// up-to-date settings.
export const [refreshSettings, useSettingsVersion] = version();
