#!/usr/bin/env python3
"""
GPIO Button Bridge for Raspberry Pi
Monitors GPIO pins and communicates with Electron app via WebSocket
"""

import RPi.GPIO as GPIO
import time
import json
import websocket
import threading
import logging
from datetime import datetime

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(message)s')
logger = logging.getLogger(__name__)

class GPIOButtonBridge:
    def __init__(self, websocket_url="ws://localhost:8080"):
        # Button pin configuration for Adafruit 2.8" Capacitive Screen
        self.button_pins = {
            'button1': 27,  # Usually top button
            'button2': 23,  # Usually right button  
            'button3': 22,  # Usually bottom button
            'button4': 17   # Usually left button
        }
        
        self.websocket_url = websocket_url
        self.ws = None
        self.debounce_time = 0.2
        self.last_press_time = {}
        
        self.setup_gpio()
        logger.info("GPIO Button Bridge initialized")

    def setup_gpio(self):
        """Initialize GPIO pins for button input"""
        try:
            GPIO.setmode(GPIO.BCM)
            
            for button_name, pin in self.button_pins.items():
                GPIO.setup(pin, GPIO.IN, pull_up_down=GPIO.PUD_UP)
                self.last_press_time[button_name] = 0
                logger.info(f"Initialized {button_name} on GPIO pin {pin}")
                
            logger.info("GPIO setup completed successfully")
            
        except Exception as e:
            logger.error(f"Failed to set up GPIO: {e}")
            raise

    def connect_websocket(self):
        """Connect to WebSocket server"""
        try:
            self.ws = websocket.WebSocket()
            self.ws.connect(self.websocket_url)
            logger.info(f"Connected to WebSocket at {self.websocket_url}")
            return True
        except Exception as e:
            logger.error(f"Failed to connect to WebSocket: {e}")
            return False

    def is_debounced(self, button_name):
        """Check if enough time has passed since last button press"""
        current_time = time.time()
        if current_time - self.last_press_time[button_name] < self.debounce_time:
            return False
        self.last_press_time[button_name] = current_time
        return True

    def send_button_event(self, button_name):
        """Send button press event via WebSocket"""
        try:
            event_data = {
                'type': 'button-pressed',
                'data': {
                    'button': button_name,
                    'timestamp': int(time.time() * 1000),
                    'source': 'python_gpio'
                }
            }
            
            if self.ws:
                self.ws.send(json.dumps(event_data))
                logger.info(f"Button event sent: {button_name}")
            else:
                logger.warning("WebSocket not connected, cannot send event")
                
        except Exception as e:
            logger.error(f"Failed to send button event: {e}")

    def check_buttons(self):
        """Check all button states"""
        for button_name, pin in self.button_pins.items():
            try:
                if GPIO.input(pin) == GPIO.LOW:
                    if self.is_debounced(button_name):
                        logger.info(f"{button_name} pressed on pin {pin}")
                        self.send_button_event(button_name)
                        
            except Exception as e:
                logger.error(f"Error reading {button_name}: {e}")

    def run(self):
        """Main loop to monitor button presses"""
        logger.info("Starting button monitoring loop...")
        
        # Try to connect to WebSocket
        if not self.connect_websocket():
            logger.error("Could not connect to WebSocket, exiting")
            return
        
        try:
            while True:
                self.check_buttons()
                time.sleep(0.01)
                
        except KeyboardInterrupt:
            logger.info("Button monitoring stopped by user")
        except Exception as e:
            logger.error(f"Unexpected error in main loop: {e}")
        finally:
            self.cleanup()

    def cleanup(self):
        """Clean up resources"""
        try:
            if self.ws:
                self.ws.close()
            GPIO.cleanup()
            logger.info("Cleanup completed")
        except Exception as e:
            logger.error(f"Error during cleanup: {e}")

def main():
    """Main function"""
    try:
        # Check if we're running on a Raspberry Pi
        with open('/proc/device-tree/model', 'r') as f:
            model = f.read().lower()
            if 'raspberry pi' not in model:
                logger.error("This script is designed to run on a Raspberry Pi")
                return
                
        logger.info(f"Running on: {model.strip()}")
        
        # Create and run the button bridge
        button_bridge = GPIOButtonBridge()
        button_bridge.run()
        
    except FileNotFoundError:
        logger.error("Could not read Raspberry Pi model information")
    except Exception as e:
        logger.error(f"Failed to start GPIO button bridge: {e}")

if __name__ == "__main__":
    main()
