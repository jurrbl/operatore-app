import { Component, OnInit } from '@angular/core';
import { SidebarComponent } from '../../sidebar/sidebar.component';
import { RouterModule } from '@angular/router';
import { NgClass } from '@angular/common';
import { AuthService } from '../../auth/auth.service';
import { DataStorageService } from '../../shared/data-storage.service';
import { Router } from '@angular/router';
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [SidebarComponent, RouterModule, NgClass, RouterModule],
 
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit {
  sidebarOpen = true;
  animate = true;
  username = '';
  countPerizie = 0;

  constructor(
    private authService: AuthService,
    private dataStorage: DataStorageService,
    private router: Router
  ) {}


  ngOnInit(): void {
    // ✅ Richiesta a /me per ottenere i dati utente
    this.dataStorage.inviaRichiesta('get', '/auth/me')?.subscribe({
      next: (res: any) => {
        console.log('👤 Utente da /auth/me:', res);
        this.authService.setUser(res);
        this.username = res.username || res.googleUsername || '';

        // ✅ Dopo aver ottenuto l'utente, carico le perizie
        this.dataStorage.inviaRichiesta('get', '/operator/perizie')?.subscribe({
          next: (res: any) => {
            this.authService.setPerizie(res.perizie ?? res);
            this.countPerizie = res.nPerizie ?? res.length ?? 0;
          },
          error: (err) => {
            console.error('❌ Errore durante /operator/perizie:', err);
          }
        });
      },
      error: (err) => {
        console.error('❌ Errore durante /me:', err);
      }
    });



    
  }

  // ✅ Upload immagine singola su Cloudinary
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

  // ✅ Salvataggio foto collegata a una perizia
  salvaFotoNelBackend(periziaId: string, url: string, commento: string): void {
    const foto = { url, commento };
    this.dataStorage.inviaRichiesta('post', `/operator/perizie/${periziaId}/foto`, foto)?.subscribe({
      next: () => console.log('✅ Foto salvata nel backend'),
      error: (err) => console.error('❌ Errore salvataggio foto nel backend:', err),
    });
  }

  // ✅ Upload immagini multiple con commento
  async onFotoChange(event: any, periziaId: string): Promise<void> {
    const files: FileList = event.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const imageUrl = await this.uploadToCloudinary(file);
        const commento = prompt(`Inserisci un commento per ${file.name}`) || '';
        this.salvaFotoNelBackend(periziaId, imageUrl, commento);
      } catch (err) {
        console.error('❌ Errore upload:', err);
      }
    }
  }

  // ✅ Aggiunta nuova perizia (da usare dove serve nel form)
  salvaNuovaPerizia(periziaData: any): void {
    this.dataStorage.inviaRichiesta('post', '/operator/perizie', periziaData)?.subscribe({
      next: (res: any) => {
        console.log('✅ Perizia salvata con successo:', res);
        this.authService.setPerizie([...this.authService.getPerizie(), res]);
        this.countPerizie++;
      },
      error: (err) => {
        console.error('❌ Errore nel salvataggio:', err);
      }
    });
  }
}
