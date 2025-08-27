"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path_1 = require("path");
const child_process_1 = require("child_process");
const fs_1 = require("fs");
const http_1 = require("http");
const promises_1 = require("fs/promises");
const path_2 = require("path");
const gpio_service_1 = require("./gpio-service");
// Next.js process for renderer (only used in development)
let nextjsProcess = null;
let staticServer = null;
function startNextJSServer() {
    const isDev = process.env.NODE_ENV === 'development';
    if (isDev) {
        // In development, start Next.js dev server
        const rendererPath = (0, path_1.join)(__dirname, '..', 'renderer');
        // Check if the renderer directory exists
        if (!(0, fs_1.existsSync)(rendererPath)) {
            console.error('Renderer directory not found:', rendererPath);
            return;
        }
        // Check if package.json exists in renderer directory
        const packageJsonPath = (0, path_1.join)(rendererPath, 'package.json');
        if (!(0, fs_1.existsSync)(packageJsonPath)) {
            console.error('package.json not found in renderer directory:', packageJsonPath);
            return;
        }
        try {
            nextjsProcess = (0, child_process_1.spawn)('bun', ['run', 'dev'], {
                cwd: rendererPath,
                stdio: 'inherit',
                shell: true,
                env: {
                    ...process.env,
                    NODE_ENV: 'development',
                },
            });
            nextjsProcess.on('error', (error) => {
                console.error('Failed to start Next.js server:', error);
            });
            nextjsProcess.on('exit', (code, signal) => {
                console.log(`Next.js server exited with code ${code} and signal ${signal}`);
            });
            console.log('🚀 Next.js dev server starting on port 8888...');
        }
        catch (error) {
            console.error('Error spawning Next.js process:', error);
        }
    }
    // In production, we serve static files directly - no server needed
}
function startStaticServer() {
    const isDev = process.env.NODE_ENV === 'development';
    if (isDev)
        return; // Only start static server in production
    const staticPath = (0, path_1.join)(__dirname, '..', 'renderer', 'out');
    console.log('Static server: Static path:', staticPath);
    if (!(0, fs_1.existsSync)(staticPath)) {
        console.error('Static files directory not found:', staticPath);
        return;
    }
    const port = 8889; // Use different port than dev server
    staticServer = (0, http_1.createServer)(async (req, res) => {
        console.log('Static server: Request for:', req.url);
        try {
            let filePath = req.url || '/';
            // Handle root path
            if (filePath === '/') {
                filePath = '/index.html';
            }
            // Remove leading slash and resolve path
            const fullPath = (0, path_1.join)(staticPath, filePath.replace(/^\//, ''));
            console.log('Static server: Full path:', fullPath);
            // Check if the path is a directory
            if ((0, fs_1.existsSync)(fullPath) && !(0, path_2.extname)(fullPath)) {
                // It's a directory, try to serve index.html from it
                const indexPath = (0, path_1.join)(fullPath, 'index.html');
                if ((0, fs_1.existsSync)(indexPath)) {
                    const content = await (0, promises_1.readFile)(indexPath, 'utf8');
                    res.writeHead(200, { 'Content-Type': 'text/html' });
                    res.end(content);
                    return;
                }
            }
            // Check if file exists
            if (!(0, fs_1.existsSync)(fullPath)) {
                // Try with .html extension for SPA routing
                const htmlPath = fullPath + '.html';
                if ((0, fs_1.existsSync)(htmlPath)) {
                    const content = await (0, promises_1.readFile)(htmlPath, 'utf8');
                    res.writeHead(200, { 'Content-Type': 'text/html' });
                    res.end(content);
                    return;
                }
                // Fallback to index.html for SPA routing
                const indexPath = (0, path_1.join)(staticPath, 'index.html');
                if ((0, fs_1.existsSync)(indexPath)) {
                    const content = await (0, promises_1.readFile)(indexPath, 'utf8');
                    res.writeHead(200, { 'Content-Type': 'text/html' });
                    res.end(content);
                    return;
                }
                res.writeHead(404);
                res.end('Not found');
                return;
            }
            const content = await (0, promises_1.readFile)(fullPath);
            const ext = (0, path_2.extname)(fullPath);
            // Set appropriate content type
            const contentType = {
                '.html': 'text/html',
                '.css': 'text/css',
                '.js': 'application/javascript',
                '.json': 'application/json',
                '.png': 'image/png',
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.gif': 'image/gif',
                '.svg': 'image/svg+xml',
                '.ico': 'image/x-icon',
            }[ext] || 'text/plain';
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content);
        }
        catch (error) {
            console.error('Static server error:', error);
            res.writeHead(500);
            res.end('Internal server error');
        }
    });
    staticServer.listen(port, () => {
        console.log(`🌐 Static server running on port ${port}`);
    });
}
// Removed embedded WebSocket server - using production server instead
function createWindow() {
    console.log('Creating main window...');
    const mainWindow = new electron_1.BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: (0, path_1.join)(__dirname, 'preload.js'),
            webSecurity: false, // Allow cross-origin requests for auth
            allowRunningInsecureContent: true, // Allow mixed content for auth
        },
        icon: (0, path_1.join)(__dirname, '../renderer/public/favicon.ico'),
        titleBarStyle: 'hidden', // Hide the title bar
        frame: false, // Remove the window frame completely
        fullscreen: true, // Start in fullscreen mode
        show: false, // Don't show until ready
    });
    // Handle new window requests (for auth popups)
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        console.log('New window requested:', url);
        // Allow auth-related popups
        if (url.includes('accounts.google.com') ||
            url.includes('firebaseapp.com') ||
            url.includes('google.com') ||
            url.includes('localhost')) {
            return { action: 'allow' };
        }
        return { action: 'deny' };
    });
    // Load the renderer
    const isDev = process.env.NODE_ENV === 'development';
    if (isDev) {
        console.log('Loading development URL: http://localhost:8888');
        mainWindow.loadURL('http://localhost:8888');
        mainWindow.webContents.openDevTools();
    }
    else {
        console.log('Loading production URL: http://localhost:8889');
        mainWindow.loadURL('http://localhost:8889');
    }
    // Show window when ready
    mainWindow.once('ready-to-show', () => {
        console.log('Window ready to show');
        mainWindow.show();
        // Initialize GPIO service after window is ready
        gpio_service_1.gpioService.setMainWindow(mainWindow);
        gpio_service_1.gpioService.initializeButtons();
    });
    // Add error handling for page load
    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
        console.error('Page load failed:', {
            errorCode,
            errorDescription,
            validatedURL,
        });
    });
    mainWindow.webContents.on('did-finish-load', () => {
        console.log('Page finished loading');
    });
    return mainWindow;
}
// App event handlers
electron_1.app.whenReady().then(() => {
    const isDev = process.env.NODE_ENV === 'development';
    if (isDev) {
        // Start Next.js server (development only)
        startNextJSServer();
        // In development, wait for Next.js server to start
        setTimeout(() => {
            createWindow();
        }, 3000);
    }
    else {
        // In production, start static server and create window
        startStaticServer();
        setTimeout(() => {
            createWindow();
        }, 1000); // Give static server time to start
    }
    electron_1.app.on('activate', () => {
        if (electron_1.BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});
electron_1.app.on('window-all-closed', () => {
    // Clean up Next.js process
    if (nextjsProcess) {
        console.log('Cleaning up Next.js process...');
        nextjsProcess.kill();
        nextjsProcess = null;
    }
    // Clean up static server
    if (staticServer) {
        console.log('Cleaning up static server...');
        staticServer.close();
        staticServer = null;
    }
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
electron_1.app.on('before-quit', () => {
    // Clean up GPIO service
    gpio_service_1.gpioService.cleanup();
    // Clean up Next.js process
    if (nextjsProcess) {
        console.log('Cleaning up Next.js process before quit...');
        nextjsProcess.kill();
        nextjsProcess = null;
    }
    // Clean up static server
    if (staticServer) {
        console.log('Cleaning up static server before quit...');
        staticServer.close();
        staticServer = null;
    }
});
