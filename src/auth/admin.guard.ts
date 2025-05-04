import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class AdminGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(): boolean {
    const user = this.auth.getUser();
    if (user?.role === 'admin') {
      return true;
    }
    if (user) {
      this.router.navigate(['/home']);
    } else {
      this.router.navigate(['/login']);
    }
    return false;
  }
  
}
