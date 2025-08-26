# Raspberry Pi GPIO Button Setup

This directory contains the GPIO button handling setup for the Raspberry Pi with Adafruit 2.8" Capacitive Screen.

## Features

- **Node.js GPIO Handling** (Primary): Integrated into the Electron app using the `onoff` library
- **Python GPIO Fallback**: Standalone Python script for reliable button detection
- **4 Button Support**: Handles all 4 buttons on the Adafruit screen
- **Color-Changing UI**: Visual feedback with color changes for each button press

## Button Configuration

The following GPIO pins are used for the 4 buttons:

- **Button 1 (Top)**: GPIO Pin 27 → Red color
- **Button 2 (Right)**: GPIO Pin 23 → Green color  
- **Button 3 (Bottom)**: GPIO Pin 22 → Blue color
- **Button 4 (Left)**: GPIO Pin 17 → Yellow color

## Setup Instructions

### 1. Hardware Setup
Ensure your Adafruit 2.8" Capacitive Screen is properly mounted on the Raspberry Pi 4 with buttons connected to the specified GPIO pins.

### 2. Node.js Method (Recommended)

The Node.js GPIO handling is integrated into the main Electron app:

```bash
# Install dependencies (from desktop-app directory)
cd desktop-app
npm install

# Build and run the app
npm run build:pi
```

The app will automatically:
- Detect if it's running on a Raspberry Pi
- Initialize GPIO pins for button detection
- Provide keyboard fallback (keys 1-4) for development

### 3. Python Fallback Method

If the Node.js method doesn't work reliably, use the Python script:

```bash
# Install Python GPIO library
sudo apt update
sudo apt install python3-rpi.gpio

# Run the Python GPIO handler
cd pi-app
sudo python3 gpio_buttons.py
```

The Python script will:
- Monitor GPIO pins for button presses
- Write button events to `/tmp/gpio_button_events.json`
- Provide debouncing to prevent multiple triggers

## Development Testing

### Keyboard Simulation
When not running on a Raspberry Pi, use keyboard keys for testing:
- Press `1` for Button 1 (Red)
- Press `2` for Button 2 (Green)
- Press `3` for Button 3 (Blue)  
- Press `4` for Button 4 (Yellow)

### Testing on Raspberry Pi
1. Deploy the built app to your Raspberry Pi
2. Run the app: `./Habii-1.0.0-arm64.AppImage`
3. Press the physical buttons to see color changes

## Troubleshooting

### GPIO Permission Issues
If you get permission errors, ensure your user is in the `gpio` group:
```bash
sudo usermod -a -G gpio $USER
# Logout and login again
```

### Node.js GPIO Issues
If the `onoff` library doesn't work:
1. Check that GPIO pins are not already in use
2. Verify the Raspberry Pi model is supported
3. Fall back to the Python script

### Button Not Responding
1. Check physical connections to GPIO pins
2. Verify the correct pin numbers in the configuration
3. Check for any shorts or loose connections
4. Use a multimeter to test button continuity

## File Structure

```
pi-app/
├── gpio_buttons.py      # Python fallback script
├── README.md           # This file
└── (future expansion)
```

The main Node.js implementation is in:
```
desktop-app/
├── main/gpio-service.ts           # GPIO service
├── main/background.ts             # Main Electron process
├── main/preload.ts               # IPC bridge
└── renderer/src/components/
    └── ButtonColorChanger.tsx    # React component
```

## Communication Flow

1. **GPIO Detection**: Hardware button press detected
2. **Event Generation**: Button event created with timestamp
3. **IPC Communication**: Event sent to renderer process
4. **UI Update**: Color change animation triggered
5. **Visual Feedback**: User sees immediate response

## Next Steps

- Add haptic feedback if available
- Implement button combinations
- Add configurable button mappings
- Create button press analytics
- Add sound effects for button presses
