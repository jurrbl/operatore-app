import { Component } from '@angular/core';
import { Router, Event, NavigationStart, NavigationEnd, ActivationStart, ActivationEnd, RoutesRecognized, RouterModule } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterModule],
  template: `<router-outlet></router-outlet>`
})
export class AppComponent {
  constructor(private router: Router) {
    this.router.events
      .pipe(
        filter(
          (e: Event) =>
            e instanceof NavigationStart ||
            e instanceof RoutesRecognized ||
            e instanceof ActivationStart ||
            e instanceof ActivationEnd ||
            e instanceof NavigationEnd
        )
      )
      .subscribe(e => {
        if (e instanceof NavigationStart) {
          console.log('🔄 NavigationStart:', e.url);
        } else if (e instanceof RoutesRecognized) {
          console.log('🛣 RoutesRecognized:', e.url);
        } else if (e instanceof ActivationStart) {
          console.log('▶️ ActivationStart:', e.snapshot.routeConfig?.path);
        } else if (e instanceof ActivationEnd) {
          console.log('⏹ ActivationEnd:', e.snapshot.routeConfig?.path);
        } else if (e instanceof NavigationEnd) {
          console.log('✅ NavigationEnd:', e.urlAfterRedirects);
        }
      });
  }
}
