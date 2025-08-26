#!/usr/bin/env python3
"""
Simple GPIO Button Handler for Raspberry Pi
Writes to a timestamped file for each button press
"""

import RPi.GPIO as GPIO
import time
import json
import logging
from datetime import datetime

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(message)s')
logger = logging.getLogger(__name__)

class SimpleGPIOButtons:
    def __init__(self):
        # Button pin configuration
        self.button_pins = {
            'button1': 27,  # Red
            'button2': 23,  # Green  
            'button3': 22,  # Blue
            'button4': 17   # Yellow
        }
        
        self.debounce_time = 0.2
        self.last_press_time = {}
        
        self.setup_gpio()
        logger.info("Simple GPIO Button Handler initialized")

    def setup_gpio(self):
        """Initialize GPIO pins"""
        try:
            GPIO.setmode(GPIO.BCM)
            
            for button_name, pin in self.button_pins.items():
                GPIO.setup(pin, GPIO.IN, pull_up_down=GPIO.PUD_UP)
                self.last_press_time[button_name] = 0
                logger.info(f"Initialized {button_name} on GPIO pin {pin}")
                
        except Exception as e:
            logger.error(f"Failed to set up GPIO: {e}")
            raise

    def is_debounced(self, button_name):
        """Check debounce timing"""
        current_time = time.time()
        if current_time - self.last_press_time[button_name] < self.debounce_time:
            return False
        self.last_press_time[button_name] = current_time
        return True

    def send_button_event(self, button_name):
        """Write button event to a unique file each time"""
        try:
            timestamp = int(time.time() * 1000)
            event_data = {
                'button': button_name,
                'timestamp': timestamp,
                'source': 'python_gpio'
            }
            
            # Write to main communication file
            with open('/tmp/gpio_button_events.json', 'w') as f:
                json.dump(event_data, f)
            
            # Also write to a timestamped file to ensure file system detects change
            unique_file = f'/tmp/gpio_event_{timestamp}.json'
            with open(unique_file, 'w') as f:
                json.dump(event_data, f)
            
            logger.info(f"Button event written: {button_name} -> {unique_file}")
            
        except Exception as e:
            logger.error(f"Failed to write button event: {e}")

    def run(self):
        """Main monitoring loop"""
        logger.info("Starting button monitoring...")
        logger.info("Press buttons to test. Ctrl+C to exit.")
        
        try:
            while True:
                for button_name, pin in self.button_pins.items():
                    try:
                        if GPIO.input(pin) == GPIO.LOW:
                            if self.is_debounced(button_name):
                                logger.info(f"{button_name} pressed on pin {pin}")
                                self.send_button_event(button_name)
                    except Exception as e:
                        logger.error(f"Error reading {button_name}: {e}")
                
                time.sleep(0.01)
                
        except KeyboardInterrupt:
            logger.info("Stopped by user")
        finally:
            GPIO.cleanup()
            logger.info("GPIO cleanup completed")

if __name__ == "__main__":
    handler = SimpleGPIOButtons()
    handler.run()
