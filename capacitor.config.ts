import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'co.litigapp.app',
  appName: 'LitigApp',
  webDir: 'dist/litigapp-web/browser',
  server: {
    androidScheme: 'https',
    url: 'http://192.168.10.134:4200',
    cleartext: true,
  },
};

export default config;
