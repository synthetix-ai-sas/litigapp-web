import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'co.litigapp.app',
  appName: 'LitigApp',
  webDir: 'dist/litigapp-web/browser',
  server: {
    androidScheme: 'https',
  },
};

export default config;
