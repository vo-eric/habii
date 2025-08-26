"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
electron_1.contextBridge.exposeInMainWorld('electronAPI', {
    // Add any IPC methods you might need later
    getVersion: () => process.versions.electron,
    getPlatform: () => process.platform,
    // GPIO button events
    onButtonPressed: (callback) => {
        electron_1.ipcRenderer.on('button-pressed', (_, data) => {
            callback(data);
        });
    },
    // Remove button event listener
    removeButtonListener: () => {
        electron_1.ipcRenderer.removeAllListeners('button-pressed');
    },
});
