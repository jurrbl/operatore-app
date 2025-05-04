import { Routes } from '@angular/router';

import { LoginComponent } from './login/login.component';
import { ForgotPasswordComponent } from './ForgotPassword/ForgotPassword.component';
import { ResetPasswordComponent } from './ResetPassword/ResetPassword.component';

export const authRoutes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'reset-password', component: ResetPasswordComponent }
];
