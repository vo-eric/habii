import { app, BrowserWindow, ipcMain } from 'electron';
import { join } from 'path';
import { spawn, ChildProcess } from 'child_process';
import { existsSync } from 'fs';
import { createServer } from 'http';
import { readFile } from 'fs/promises';
import { extname } from 'path';
import { gpioService } from './gpio-service';

// Next.js process for renderer (only used in development)
let nextjsProcess: ChildProcess | null = null;
let staticServer: any = null;

function startNextJSServer() {
  const isDev = process.env.NODE_ENV === 'development';

  if (isDev) {
    // In development, start Next.js dev server
    const rendererPath = join(__dirname, '..', 'renderer');

    // Check if the renderer directory exists
    if (!existsSync(rendererPath)) {
      console.error('Renderer directory not found:', rendererPath);
      return;
    }

    // Check if package.json exists in renderer directory
    const packageJsonPath = join(rendererPath, 'package.json');
    if (!existsSync(packageJsonPath)) {
      console.error(
        'package.json not found in renderer directory:',
        packageJsonPath
      );
      return;
    }

    try {
      nextjsProcess = spawn('bun', ['run', 'dev'], {
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
        console.log(
          `Next.js server exited with code ${code} and signal ${signal}`
        );
      });

      console.log('🚀 Next.js dev server starting on port 8888...');
    } catch (error) {
      console.error('Error spawning Next.js process:', error);
    }
  }
  // In production, we serve static files directly - no server needed
}

function startStaticServer() {
  const isDev = process.env.NODE_ENV === 'development';

  if (isDev) return; // Only start static server in production

  const staticPath = join(__dirname, '..', 'renderer', 'out');
  console.log('Static server: Static path:', staticPath);

  if (!existsSync(staticPath)) {
    console.error('Static files directory not found:', staticPath);
    return;
  }

  const port = 8889; // Use different port than dev server

  staticServer = createServer(async (req, res) => {
    console.log('Static server: Request for:', req.url);

    try {
      let filePath = req.url || '/';

      // Handle root path
      if (filePath === '/') {
        filePath = '/index.html';
      }

      // Remove leading slash and resolve path
      const fullPath = join(staticPath, filePath.replace(/^\//, ''));
      console.log('Static server: Full path:', fullPath);

      // Check if the path is a directory
      if (existsSync(fullPath) && !extname(fullPath)) {
        // It's a directory, try to serve index.html from it
        const indexPath = join(fullPath, 'index.html');
        if (existsSync(indexPath)) {
          const content = await readFile(indexPath, 'utf8');
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(content);
          return;
        }
      }

      // Check if file exists
      if (!existsSync(fullPath)) {
        // Try with .html extension for SPA routing
        const htmlPath = fullPath + '.html';
        if (existsSync(htmlPath)) {
          const content = await readFile(htmlPath, 'utf8');
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(content);
          return;
        }

        // Fallback to index.html for SPA routing
        const indexPath = join(staticPath, 'index.html');
        if (existsSync(indexPath)) {
          const content = await readFile(indexPath, 'utf8');
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(content);
          return;
        }

        res.writeHead(404);
        res.end('Not found');
        return;
      }

      const content = await readFile(fullPath);
      const ext = extname(fullPath);

      // Set appropriate content type
      const contentType =
        {
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
    } catch (error) {
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

  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: join(__dirname, 'preload.js'),
      webSecurity: false, // Allow cross-origin requests for auth
      allowRunningInsecureContent: true, // Allow mixed content for auth
    },
    icon: join(__dirname, '../renderer/public/favicon.ico'),
    titleBarStyle: 'hidden', // Hide the title bar
    frame: false, // Remove the window frame completely
    fullscreen: true, // Start in fullscreen mode
    show: false, // Don't show until ready
  });

  // Handle new window requests (for auth popups)
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    console.log('New window requested:', url);

    // Allow auth-related popups
    if (
      url.includes('accounts.google.com') ||
      url.includes('firebaseapp.com') ||
      url.includes('google.com') ||
      url.includes('localhost')
    ) {
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
  } else {
    console.log('Loading production URL: http://localhost:8889');
    mainWindow.loadURL('http://localhost:8889');
  }

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    console.log('Window ready to show');
    mainWindow.show();

    // Initialize GPIO service after window is ready
    gpioService.setMainWindow(mainWindow);
    gpioService.initializeButtons();
  });

  // Add error handling for page load
  mainWindow.webContents.on(
    'did-fail-load',
    (event, errorCode, errorDescription, validatedURL) => {
      console.error('Page load failed:', {
        errorCode,
        errorDescription,
        validatedURL,
      });
    }
  );

  mainWindow.webContents.on('did-finish-load', () => {
    console.log('Page finished loading');
  });

  return mainWindow;
}

// App event handlers
app.whenReady().then(() => {
  const isDev = process.env.NODE_ENV === 'development';

  if (isDev) {
    // Start Next.js server (development only)
    startNextJSServer();

    // In development, wait for Next.js server to start
    setTimeout(() => {
      createWindow();
    }, 3000);
  } else {
    // In production, start static server and create window
    startStaticServer();
    setTimeout(() => {
      createWindow();
    }, 1000); // Give static server time to start
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
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
    app.quit();
  }
});

app.on('before-quit', () => {
  // Clean up GPIO service
  gpioService.cleanup();

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
