// MINED // Firebase Configuration Template
// Copy your Firebase config from your Firebase Console
// https://console.firebase.google.com

const FIREBASE_CONFIG = {
  // Get these values from Firebase Console:
  // Project Settings → Service Accounts → Database Secrets
  
  apiKey: "YOUR_API_KEY_HERE",
  authDomain: "your-project.firebaseapp.com",
  databaseURL: "https://your-project.firebaseio.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};

// ─── How to Get Your Firebase Config ───
/*
1. Go to https://console.firebase.google.com
2. Create a new project (or use existing)
3. Enable Realtime Database
   - Choose "test mode" for development
   - Later, set up proper security rules
4. Go to Project Settings (gear icon)
5. Click "Service Accounts"
6. Click "Database Secrets"
7. Reveal your database secret token
8. Copy the config values above

Then in the app:
- Go to Settings
- Click "Firebase Configuration"
- Fill in these values
- Click "Connect Firebase"

Your data will auto-sync to the cloud!
*/

// ─── Security Rules (Recommended) ───
/*
In Firebase Console > Realtime Database > Rules:

{
  "rules": {
    "mined_state": {
      ".read": "auth != null",
      ".write": "auth != null"
    }
  }
}

This requires authentication. For public access:

{
  "rules": {
    "mined_state": {
      ".read": true,
      ".write": true
    }
  }
}
*/
