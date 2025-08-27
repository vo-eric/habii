# Habii 🐕

A shared digital pet companion that brings people together through real-time synchronized animations. Think Tamagotchi - but with a lovable dog that everyone can interact with simultaneously!

## 🌟 Features

### 🎮 Multi-Platform Experience

- **Web App**: Access from any browser with real-time sync
- **Desktop App**: Native Electron application for Windows, macOS, and Linux
- **Raspberry Pi**: Specialized build with GPIO button support and capacitive touchscreen

### 🔄 Real-Time Synchronization

- **Shared Animations**: When one user triggers an action, everyone sees it instantly
- **Cross-Platform Sync**: Web users and desktop users interact in the same virtual space
- **Room-Based**: Multiple creatures can exist simultaneously in different rooms

### 🎯 Interactive Features

- **Touch/Click Interactions**: Pet, feed, play with your digital companion
- **Physical Buttons**: On Raspberry Pi, use GPIO buttons for tactile interaction
- **Custom Media**: Display custom images/videos on button press
- **Sound Effects**: Synchronized audio feedback across all platforms

### 🐕 Creature Behaviors

- **Walking**: Ambient movement animation
- **Eating**: Feeding animations with sound effects
- **Playing**: Interactive play sessions
- **Sleeping**: Rest periods with gentle animations
- **Petting**: Happy responses to touch
- **Pooping**: Natural creature behaviors

## 🏗️ Architecture

```
🌐 Production Environment
├── Vercel (Web App) ────────┐
├── Desktop App (Pi) ───────┼── Shared WebSocket Server (Render)
└── Desktop App (PC) ───────┘    ├── Real-time sync
                                 ├── Creature rooms
                                 └── Animation events

💻 Platform Components
├── Web App (Next.js)
├── Desktop App (Electron + Next.js)
├── WebSocket Server (Socket.IO + Express)
├── Firebase (Auth + Database)
└── Raspberry Pi (GPIO + Touchscreen)
```

## 🍓 Raspberry Pi Setup (yes I know it's a strawberry)

### Hardware Requirements

- **Raspberry Pi 4** (recommended) or Pi 3B+
- **Capacitive touchscreen**
- **GPIO buttons** (optional, for physical interaction)
- **Speakers** for audio feedback

### GPIO Button Configuration

The desktop app supports GPIO buttons for physical interaction:

- **Button 1** (Pin 27): Trigger custom media display
- **Button 2** (Pin 17): Pet the creature
- **Button 3** (Pin 22): Feed the creature

## 🎵 Sound System

The app includes synchronized sound effects that play locally when animations are triggered:

- **Eating**: Crunching/feeding sounds
- **Playing**: Playful barking and toy sounds
- **Sleeping**: Gentle breathing sounds
- **Petting**: Happy/content sounds
- **Pooping**: Natural creature sounds

### Key Technologies

- **Frontend**: Next.js, React
- **Desktop**: Electron, TypeScript
- **Real-time**: Socket.IO, WebSocket
- **Backend**: Firebase (Auth, Firestore, Functions)
- **Pi Integration**: GPIO

**Habii** - Bringing people together, one digital pet at a time! 🐕✨
