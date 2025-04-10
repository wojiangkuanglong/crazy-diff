import { ipcMain } from 'electron';

import type { BrowserWindowOrNull, WindowCreationByIPC } from 'shared/types';

export function registerWindowCreationByIPC({
  channel,
  callback,
  window: createWindow,
}: WindowCreationByIPC) {
  let window: BrowserWindowOrNull;

  ipcMain.handle(channel, (event) => {
    if (!createWindow || window) return;

    window = createWindow() as NonNullable<BrowserWindowOrNull>;

    window.on('closed', () => {
      window = null;
    });

    callback?.(window, event);
  });
}
