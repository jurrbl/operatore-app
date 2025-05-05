import { Component, OnInit, OnDestroy } from '@angular/core';
import { SidebarComponent }     from '../../sidebar/sidebar.component';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { NgClass }              from '@angular/common';
import { filter, Subject, takeUntil } from 'rxjs';
import { IonicModule } from '@ionic/angular';
import { AuthService }          from '../../auth/auth.service';
import { DataStorageService }   from '../../shared/data-storage.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [SidebarComponent, RouterModule, NgClass, IonicModule,],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit, OnDestroy {
  sidebarOpen  = true;
  animate      = true;
  username     = '';
  countPerizie = 0;

  private destroy$ = new Subject<void>();

  constructor(
    private authService:  AuthService,
    private dataStorage:  DataStorageService,
    private router:       Router
  ) {}

  ngOnInit(): void {
    // Quando NavigationEnd su '/home', ricarica i dati
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd && (e as NavigationEnd).urlAfterRedirects === '/home'),
      takeUntil(this.destroy$)
    ).subscribe(() => this.loadData());

    // Caricamento iniziale
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadData(): void {
    // 1) Ottieni utente
    this.dataStorage.inviaRichiesta('get', '/auth/me')?.subscribe({
      next: (user: any) => {
        this.authService.setUser(user);
        this.username = user.username || user.googleUsername || '';

        // 2) Ottieni perizie
        this.dataStorage.inviaRichiesta('get', '/operator/perizie')?.subscribe({
          next: (res: any) => {
            const perizie = res.perizie ?? res;
            this.authService.setPerizie(perizie);
            this.countPerizie = res.nPerizie ?? perizie.length ?? 0;
          },
          error: err => console.error('❌ Errore during /operator/perizie:', err)
        });
      },
      error: err => console.error('❌ Errore during /auth/me:', err)
    });
  }

  // … gli altri metodi rimangono identici …
  async uploadToCloudinary(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'rilievi_preset');
    const res = await fetch('https://api.cloudinary.com/v1_1/dvkczvtfs/image/upload', {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    return data.secure_url;
  }

  salvaFotoNelBackend(periziaId: string, url: string, commento: string): void {
    const foto = { url, commento };
    this.dataStorage.inviaRichiesta('post', `/operator/perizie/${periziaId}/foto`, foto)
      ?.subscribe({
        next: () => console.log('✅ Foto salvata nel backend'),
        error: err => console.error('❌ Errore salvataggio foto nel backend:', err),
      });
  }

  async onFotoChange(event: any, periziaId: string): Promise<void> {
    const files: FileList = event.target.files;
    if (!files?.length) return;
    for (let i = 0; i < files.length; i++) {
      try {
        const imageUrl = await this.uploadToCloudinary(files[i]);
        const commento = prompt(`Inserisci un commento per ${files[i].name}`) || '';
        this.salvaFotoNelBackend(periziaId, imageUrl, commento);
      } catch (err) {
        console.error('❌ Errore upload:', err);
      }
    }
  }

  salvaNuovaPerizia(periziaData: any): void {
    this.dataStorage.inviaRichiesta('post', '/operator/perizie', periziaData)
      ?.subscribe({
        next: (res: any) => {
          console.log('✅ Perizia salvata con successo:', res);
          const updated = [...this.authService.getPerizie(), res];
          this.authService.setPerizie(updated);
          this.countPerizie++;
        },
        error: err => console.error('❌ Errore nel salvataggio:', err)
      });
  }
}
