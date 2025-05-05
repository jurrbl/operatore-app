import { Component, AfterViewInit, Inject, PLATFORM_ID, OnDestroy } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Browser } from '@capacitor/browser';
import { App as CapacitorApp } from '@capacitor/app';
import { NavController, Platform } from '@ionic/angular';
import { LoginEffectsService } from '../login-effects.service';
import { DataStorageService } from '../../shared/data-storage.service';
import { AuthService } from '../auth.service';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent implements AfterViewInit, OnDestroy {
  loginForm: FormGroup;
  registerForm: FormGroup;
  private urlListener: any;
  isBrowser: boolean;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private loginEffectsService: LoginEffectsService,
    private dataStorage: DataStorageService,
    private authService: AuthService,
    private navCtrl: NavController,
    private platform: Platform,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);

    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });

    this.registerForm = this.fb.group({
      username: ['', Validators.required],
      email:    ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  ngAfterViewInit(): void {
    if (this.isBrowser) {
      this.loginEffectsService.applyLoginEffects();
    }

    // Solo su device, intercettiamo il redirect OAuth
    this.urlListener = CapacitorApp.addListener(
      'appUrlOpen',
      (event: any) => {
        // event.url contiene l’URL di callback OAuth
        if (event.url.includes('/home')) {
          // chiudi il browser in-app e naviga
          Browser.close();
          this.router.navigate(['/home']);
        }
      }
    );
  }

  ngOnDestroy(): void {
    // Rimuoviamo il listener quando il component viene distrutto
    if (this.urlListener && this.urlListener.remove) {
      this.urlListener.remove();
    }
  }

  onForgotPassword(): void {
    const email = this.loginForm.get('email')?.value;
    if (!email) {
      alert('Inserisci prima un’email');
      return;
    }
    this.authService.forgotPassword(email).subscribe({
      next: () => alert('📧 Email inviata con la nuova password temporanea'),
      error: err => {
        console.error('Errore invio nuova password', err);
        alert('Errore durante l’invio. Riprova.');
      }
    });
  }

  toggleForm(event?: Event): void {
    if (event) event.preventDefault();
    if (!this.isBrowser) return;
    const main = document.querySelector('main');
    if (main) {
      main.classList.add('animating');
      setTimeout(() => {
        main.classList.toggle('sign-up-mode');
        main.classList.remove('animating');
      }, 100);
    }
  }

  onSubmit(): void {
    if (this.loginForm.invalid) return;
    const { email, password } = this.loginForm.value;

    this.dataStorage
      .inviaRichiesta('post', '/auth/login', { email, password })!
      .subscribe({
        next: (res: any) => {
          console.log('✅ Login effettuato:', res);
          localStorage.removeItem('perizie');
          localStorage.setItem('token', res.token);
          localStorage.setItem('user', JSON.stringify(res.user));

          // usa sempre Angular router per evitare doppie attivazioni
          this.router.navigate(['/home', 'dashboard'], {
            replaceUrl: true
          });
        },
        error: err => {
          console.error('❌ Errore login:', err);
          alert(err.error?.message || 'Email o password errati.');
        }
      });
  }
  

  onRegister(): void {
    if (this.registerForm.invalid) return;
    const { username, email, password } = this.registerForm.value;

    this.dataStorage.inviaRichiesta('post','/auth/register',{ username, email, password })!
      .subscribe({
        next: (res: any) => {
          console.log('✅ Utente registrato:', res);
          alert('Registrazione avvenuta con successo!');
          this.toggleForm();
        },
        error: err => {
          console.error('❌ Errore registrazione:', err);
          alert(err.error?.message || 'Errore durante la registrazione.');
        }
      });
  }

  /** 
   * Apre in-app la WebView di OAuth e passa il redirectUrl corretto
   */
  async signInWithGoogle(): Promise<void> {
    // Per web useremo window.location.origin, su device il custom scheme
    const base = !this.isBrowser
      ? 'capacitor://localhost'
      : window.location.origin;

    const redirectUrl = `${base}/home`;
    const authUrl = `${environment.apiUrl}/auth/google?redirectUrl=${encodeURIComponent(redirectUrl)}`;

    await Browser.open({ url: authUrl, windowName: '_self' });
  }
}
