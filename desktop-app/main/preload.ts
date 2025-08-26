import { contextBridge, ipcRenderer } from 'electron';

// Define the button event type
interface ButtonEvent {
  button: string;
  timestamp: number;
}

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Add any IPC methods you might need later
  getVersion: () => process.versions.electron,
  getPlatform: () => process.platform,

  // GPIO button events
  onButtonPressed: (callback: (event: ButtonEvent) => void) => {
    ipcRenderer.on('button-pressed', (_, data: ButtonEvent) => {
      callback(data);
    });
  },

  // Remove button event listener
  removeButtonListener: () => {
    ipcRenderer.removeAllListeners('button-pressed');
  },
});
