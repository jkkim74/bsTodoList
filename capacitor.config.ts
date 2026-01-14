import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.braindump.app',
  appName: 'Brain Dumping',
  webDir: 'dist',
  server: {
    // Production: use app assets
    // androidScheme: 'https',
    // Development: comment out for local testing
     url: 'https://webapp-tvo.pages.dev',
     cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#4F46E5',
      androidSplashResourceName: 'splash',
      iosSplashResourceName: 'splash',
      showSpinner: false,
      androidSpinnerStyle: 'small',
      iosSpinnerStyle: 'small',
      spinnerColor: '#FFFFFF'
    },
    StatusBar: {
      style: 'Dark',
      backgroundColor: '#4F46E5'
    }
  }
};

export default config;
