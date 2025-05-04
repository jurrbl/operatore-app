import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { provideHttpClient } from '@angular/common/http';
import {
  provideRouter,
  withPreloading,
  PreloadAllModules,
} from '@angular/router';
import {
  IonicRouteStrategy,
  provideIonicAngular,
} from '@ionic/angular/standalone';
import { RouteReuseStrategy } from '@angular/router';
import { routes } from './app/app.routes';
import './styles.css';
import './tailwind.css';

bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(), // ✅ Aggiungi questo se manca
    provideRouter(routes, withPreloading(PreloadAllModules)),
    provideIonicAngular(),
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
  ],
});
