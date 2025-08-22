import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Add any IPC methods you might need later
  getVersion: () => process.versions.electron,
  getPlatform: () => process.platform,
});
