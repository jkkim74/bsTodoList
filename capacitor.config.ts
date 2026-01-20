import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.braindump.app',
  appName: 'Brain Dumping',
  webDir: 'dist',
  
  // 🔥 프로덕션: server 설정 주석 처리 (로컬 빌드 사용)
  // 개발 중 Live Reload가 필요한 경우에만 활성화
  // server: {
  //   url: 'https://webapp-tvo.pages.dev',
  //   cleartext: true
  // },
  
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
  },
  // 🔥 OAuth Deep Link Configuration
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true
  },
  ios: {
    contentInset: 'automatic',
    allowsLinkPreview: true
  }
};

export default config;
