import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'co.litigapp.app',
  appName: 'LitigApp',
  webDir: 'dist/litigapp-web/browser',
  ios: {
    contentInset: 'automatic',
    backgroundColor: '#1d4ed8',
  },
  android: {
    backgroundColor: '#1d4ed8',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#1d4ed8',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
  },
};

export default config;
