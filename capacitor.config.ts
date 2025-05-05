import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',      // sostituisci con il tuo appId
  appName: 'operatore-app',       // sostituisci con il tuo appName
  webDir: 'www/browser',          // punta alla cartella che contiene index.html
  // se ti serve qualcosa di server-side, qui puoi aggiungere:
  // server: { url: 'http://192.168.x.y:8100', cleartext: true }
};

export default config;
