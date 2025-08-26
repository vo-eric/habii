#!/bin/bash
# GPIO Button Service Starter for Raspberry Pi

echo "Starting GPIO Button Service..."

# Check if we're on a Raspberry Pi
if ! grep -q "Raspberry Pi" /proc/device-tree/model 2>/dev/null; then
    echo "Not running on Raspberry Pi, skipping GPIO service"
    exit 0
fi

# Kill any existing GPIO service
pkill -f gpio_buttons.py

# Start the Python GPIO service in background
python3 /home/pi/gpio_buttons.py &
GPIO_PID=$!

echo "GPIO Service started with PID: $GPIO_PID"

# Start the Habii app
export DISPLAY=:0
/home/pi/Habii-1.0.0-arm64.AppImage &
APP_PID=$!

echo "Habii app started with PID: $APP_PID"

# Wait for app to exit
wait $APP_PID

# Clean up GPIO service
echo "Cleaning up GPIO service..."
kill $GPIO_PID 2>/dev/null

echo "Services stopped"
