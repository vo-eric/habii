# Firebase Auth Setup Guide

## Current Issues

1. **"Email sign-up is not enabled"** - Firebase Auth needs to be configured
2. **Google Auth not working** - Electron security policies blocking popups

## Steps to Fix Firebase Auth

### 1. Enable Email/Password Authentication

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `habii-235d1`
3. Go to **Authentication** → **Sign-in method**
4. Enable **Email/Password** provider
5. Make sure **Email link (passwordless sign-in)** is also enabled if needed

### 2. Configure Google Authentication

1. In the same **Sign-in method** page
2. Enable **Google** provider
3. Add your authorized domains:
   - `localhost`
   - `127.0.0.1`
   - `habii-235d1.firebaseapp.com`
   - `habii-web-app.vercel.app`

### 3. Configure Authorized Domains

1. In **Authentication** → **Settings** → **Authorized domains**
2. Add these domains:
   - `localhost`
   - `127.0.0.1`
   - `habii-235d1.firebaseapp.com`
   - `habii-web-app.vercel.app`

### 4. Test Authentication

After configuring Firebase Auth:

1. Rebuild the app: `bun run build:renderer`
2. Test the app: `./test-prod.sh`
3. Try both email/password and Google authentication

## Alternative: Use Firebase Auth Emulator

For development, you can use Firebase Auth Emulator:

1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login: `firebase login`
3. Start emulator: `firebase emulators:start --only auth`
4. Update your app to use the emulator in development mode

## Current Status

The app is now properly configured to use Firebase Auth. The authentication should work once you:

1. Enable Email/Password auth in Firebase Console
2. Configure Google auth properly
3. Add the necessary authorized domains

The Electron app is configured to handle auth popups properly, and the Firebase configuration is correct.
