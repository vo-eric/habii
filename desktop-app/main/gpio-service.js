"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gpioService = exports.GPIOService = void 0;
// GPIO Service for Raspberry Pi button handling
class GPIOService {
    constructor() {
        this.buttons = {};
        this.mainWindow = null;
        this.isRaspberryPi = false;
        // Check if we're running on a Raspberry Pi
        this.isRaspberryPi = this.checkIfRaspberryPi();
        console.log(`GPIO Service: Running on Raspberry Pi: ${this.isRaspberryPi}`);
    }
    checkIfRaspberryPi() {
        try {
            const fs = require('fs');
            const modelInfo = fs
                .readFileSync('/proc/device-tree/model', 'utf8')
                .toLowerCase();
            return modelInfo.includes('raspberry pi');
        }
        catch (error) {
            // If we can't read the model file, assume we're not on a Pi
            return false;
        }
    }
    setMainWindow(window) {
        this.mainWindow = window;
    }
    async initializeButtons() {
        if (!this.isRaspberryPi) {
            console.log('GPIO Service: Not on Raspberry Pi, skipping GPIO setup');
            this.setupKeyboardSimulation();
            return;
        }
        try {
            // Try Node.js GPIO first
            const { Gpio } = require('onoff');
            // Button pin configuration for Adafruit 2.8" Capacitive Screen
            const buttonPins = {
                button1: 27, // Usually top button
                button2: 23, // Usually right button
                button3: 22, // Usually bottom button
                button4: 17, // Usually left button
            };
            console.log('GPIO Service: Setting up GPIO pins for buttons...');
            // Initialize each button
            for (const [buttonName, pin] of Object.entries(buttonPins)) {
                try {
                    // Set up as input with internal pull-up resistor
                    this.buttons[buttonName] = new Gpio(pin, 'in', 'falling', {
                        debounceTimeout: 50,
                    });
                    // Watch for button presses
                    this.buttons[buttonName].watch((err, value) => {
                        if (err) {
                            console.error(`GPIO Service: Error watching ${buttonName}:`, err);
                            return;
                        }
                        // Button pressed (falling edge means button was pressed)
                        console.log(`GPIO Service: ${buttonName} pressed on pin ${pin}`);
                        this.sendButtonEvent(buttonName);
                    });
                    console.log(`GPIO Service: ${buttonName} initialized on pin ${pin}`);
                }
                catch (error) {
                    console.error(`GPIO Service: Failed to initialize ${buttonName} on pin ${pin}:`, error);
                }
            }
            console.log('GPIO Service: Button initialization complete');
        }
        catch (error) {
            console.error('GPIO Service: Failed to initialize buttons:', error);
            // Fallback to Python GPIO bridge
            this.setupPythonBridge();
        }
    }
    setupPythonBridge() {
        const fs = require('fs');
        const commFile = '/tmp/gpio_button_events.json';
        // Watch for button events from Python script
        let lastProcessedTimestamp = 0;
        let lastFileModTime = 0;
        const checkForEvents = () => {
            try {
                if (fs.existsSync(commFile)) {
                    const stats = fs.statSync(commFile);
                    const currentFileModTime = stats.mtime.getTime();
                    // Only process if file was modified since last check
                    if (currentFileModTime > lastFileModTime) {
                        const fileContent = fs.readFileSync(commFile, 'utf8');
                        const eventData = JSON.parse(fileContent);
                        // Process if this is a new event
                        if (eventData.button &&
                            eventData.timestamp &&
                            eventData.timestamp > lastProcessedTimestamp) {
                            this.sendButtonEvent(eventData.button);
                            lastProcessedTimestamp = eventData.timestamp;
                        }
                        lastFileModTime = currentFileModTime;
                    }
                }
            }
            catch (error) {
                // Ignore errors, file might not exist or be malformed
            }
            // Check again in 100ms
            setTimeout(checkForEvents, 100);
        };
        // Start monitoring
        checkForEvents();
    }
    setupKeyboardSimulation() {
        console.log('GPIO Service: Setting up keyboard simulation for testing...');
        if (!this.mainWindow)
            return;
        // Listen for keypress events to simulate button presses during development
        this.mainWindow.webContents.on('before-input-event', (event, input) => {
            if (input.type === 'keyDown') {
                switch (input.key) {
                    case '1':
                        this.sendButtonEvent('button1');
                        break;
                    case '2':
                        this.sendButtonEvent('button2');
                        break;
                    case '3':
                        this.sendButtonEvent('button3');
                        break;
                    case '4':
                        this.sendButtonEvent('button4');
                        break;
                }
            }
        });
        console.log('GPIO Service: Keyboard simulation ready (press 1-4 keys)');
    }
    sendButtonEvent(buttonName) {
        if (!this.mainWindow)
            return;
        console.log(`GPIO Service: Sending button event: ${buttonName}`);
        // Send event to renderer process
        this.mainWindow.webContents.send('button-pressed', {
            button: buttonName,
            timestamp: Date.now(),
        });
    }
    cleanup() {
        console.log('GPIO Service: Cleaning up buttons...');
        try {
            // Cleanup GPIO resources
            for (const [buttonName, button] of Object.entries(this.buttons)) {
                if (button && typeof button.unexport === 'function') {
                    button.unexport();
                    console.log(`GPIO Service: ${buttonName} cleaned up`);
                }
            }
            this.buttons = {};
        }
        catch (error) {
            console.error('GPIO Service: Error during cleanup:', error);
        }
    }
}
exports.GPIOService = GPIOService;
exports.gpioService = new GPIOService();
