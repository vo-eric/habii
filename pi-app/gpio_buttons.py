#!/usr/bin/env python3
"""
GPIO Button Handler for Raspberry Pi
Fallback Python script for handling button presses on Adafruit 2.8" Capacitive Screen

This script monitors GPIO pins for button presses and communicates with the Electron app
via a simple file-based communication system.
"""

import RPi.GPIO as GPIO
import time
import json
import os
import logging
from datetime import datetime

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(message)s')
logger = logging.getLogger(__name__)

class GPIOButtonHandler:
    def __init__(self):
        # Button pin configuration for Adafruit 2.8" Capacitive Screen
        self.button_pins = {
            'button1': 27,  # Usually top button
            'button2': 23,  # Usually right button  
            'button3': 22,  # Usually bottom button
            'button4': 17   # Usually left button
        }
        
        # Communication file path (Electron app will monitor this)
        self.comm_file = '/tmp/gpio_button_events.json'
        
        # Debounce timing (prevent multiple triggers)
        self.debounce_time = 0.2
        self.last_press_time = {}
        
        self.setup_gpio()
        logger.info("GPIO Button Handler initialized")

    def setup_gpio(self):
        """Initialize GPIO pins for button input"""
        try:
            # Set GPIO mode
            GPIO.setmode(GPIO.BCM)
            
            # Set up each button pin
            for button_name, pin in self.button_pins.items():
                GPIO.setup(pin, GPIO.IN, pull_up_down=GPIO.PUD_UP)
                # Initialize last press time
                self.last_press_time[button_name] = 0
                logger.info(f"Initialized {button_name} on GPIO pin {pin}")
                
            logger.info("GPIO setup completed successfully")
            
        except Exception as e:
            logger.error(f"Failed to set up GPIO: {e}")
            raise

    def is_debounced(self, button_name):
        """Check if enough time has passed since last button press"""
        current_time = time.time()
        if current_time - self.last_press_time[button_name] < self.debounce_time:
            return False
        self.last_press_time[button_name] = current_time
        return True

    def send_button_event(self, button_name):
        """Send button press event to the communication file"""
        try:
            event_data = {
                'button': button_name,
                'timestamp': int(time.time() * 1000),  # Milliseconds
                'datetime': datetime.now().isoformat(),
                'source': 'python_gpio'
            }
            
            # Write event to communication file
            with open(self.comm_file, 'w') as f:
                json.dump(event_data, f)
            
            logger.info(f"Button event sent: {button_name}")
            
        except Exception as e:
            logger.error(f"Failed to send button event: {e}")

    def check_buttons(self):
        """Check all button states"""
        for button_name, pin in self.button_pins.items():
            try:
                # Read button state (LOW = pressed with pull-up resistor)
                if GPIO.input(pin) == GPIO.LOW:
                    if self.is_debounced(button_name):
                        logger.info(f"{button_name} pressed on pin {pin}")
                        self.send_button_event(button_name)
                        
            except Exception as e:
                logger.error(f"Error reading {button_name}: {e}")

    def run(self):
        """Main loop to monitor button presses"""
        logger.info("Starting button monitoring loop...")
        logger.info("Press Ctrl+C to exit")
        
        try:
            while True:
                self.check_buttons()
                time.sleep(0.01)  # Check every 10ms
                
        except KeyboardInterrupt:
            logger.info("Button monitoring stopped by user")
        except Exception as e:
            logger.error(f"Unexpected error in main loop: {e}")
        finally:
            self.cleanup()

    def cleanup(self):
        """Clean up GPIO resources"""
        try:
            GPIO.cleanup()
            # Remove communication file
            if os.path.exists(self.comm_file):
                os.remove(self.comm_file)
            logger.info("GPIO cleanup completed")
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
        
        # Create and run the button handler
        button_handler = GPIOButtonHandler()
        button_handler.run()
        
    except FileNotFoundError:
        logger.error("Could not read Raspberry Pi model information")
    except Exception as e:
        logger.error(f"Failed to start GPIO button handler: {e}")

if __name__ == "__main__":
    main()
