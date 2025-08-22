#!/bin/bash

# Habii Desktop App Startup Script for Raspberry Pi
# This script sets up the proper environment and runs the Habii app

echo "Starting Habii Desktop App..."

# Set display environment
export DISPLAY=:0

# Navigate to the app directory
cd ~/habii

# Make sure the app is executable
chmod +x Habii-1.0.0-arm64.AppImage

# Run the Habii app
echo "Launching Habii..."
./Habii-1.0.0-arm64.AppImage

echo "Habii app exited."
