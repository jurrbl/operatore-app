import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';

import { AuthService } from '../../../auth/auth.service';
import { DataStorageService } from '../../../shared/data-storage.service';
import { PerizieService } from '../../../shared/perizie.service';

@Component({
  selector: 'app-perizie-table',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './perizie.component.html',
  styleUrls: ['./perizie.component.css'],
})
export class PerizieComponent implements OnInit {
  search = signal('');
  selectedStatus = signal('');
  currentPage = signal(1);
  perPage = 5;
  Math = Math;
  mostraAlertRevisione = false;
  periziaDaMostrare: any = null;
  messaggioAlert = '';
  alertSuccesso = true;
  lightboxUrl: string | null = null;
  revisioneNotificata = signal(false);
  primaPeriziaRevisionata: any = null;
  larevisione: any;
  perizie = signal<any[]>([]);
  selectedPerizia: any = null;
  immaginiSelezionate: { file: File; commento: string }[] = [];

  periziaModifica: any = null;

  nuovaPerizia: any = {
    indirizzo: '',
    dataOra: '',
    descrizione: '',
    stato: '',
    revisioneAdmin: '',
  };

  constructor(
    public authService: AuthService,
    public perizieService: PerizieService,
    private dataStorage: DataStorageService,
    private route: ActivatedRoute,
    private location: Location,
    private router: Router
  ) {}

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (token) {
      localStorage.setItem('token', token);
      const urlWithoutToken = this.route.snapshot.pathFromRoot
        .map((route) =>
          route.url.map((segment) => segment.toString()).join('/')
        )
        .join('/');
      this.location.replaceState(urlWithoutToken);
    }

    this.fetchPerizieDalServer();

    const qifsha = this.authService.getPerizie();
    console.log('Perizie salvate in AuthService:', qifsha);
  }
  async fetchPerizieDalServer() {
    try {
      const response: any = await this.dataStorage
        .inviaRichiesta('get', '/operator/perizie')
        ?.toPromise();
      if (response?.perizie) {
        const perizieConDate = response.perizie.map((p: any) => ({
          ...p,
          dataOra: new Date(p.dataOra),
          revisioneAdmin: p.revisioneAdmin || '',
        }));
        console.log('Perizie ricevute dal server:', perizieConDate);

        this.perizie.set(perizieConDate);
        this.authService.setPerizie(perizieConDate);

        // 👇 Cerca la prima perizia revisionata
        const revisionata = perizieConDate.find(
          (p: any) =>
            p.revisioneAdmin && p.revisioneAdmin !== 'In Attesa Di Revisione'
        );
        if (revisionata && !this.revisioneNotificata()) {
          this.primaPeriziaRevisionata = revisionata;
          this.revisioneNotificata.set(true);
        }
      }
    } catch (err) {
      console.error('❌ Errore caricamento perizie:', err);
    }
  }

  vaiAllaPeriziaRevisione() {
    this.selectedPerizia = this.periziaDaMostrare;
    this.mostraAlertRevisione = false;
    setTimeout(() => {
      const el = document.getElementById('dettaglio');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }

  async aggiungiPerizia() {
    try {
      const { indirizzo, dataOra, descrizione, stato } = this.nuovaPerizia;
      const currentUser = this.authService.getUser();
      const coords = await this.getCoordinateDaIndirizzo(indirizzo);

      const immaginiUploadate = await Promise.all(
        this.immaginiSelezionate.map(async (img) => {
          const url = await this.uploadToCloudinary(img.file);
          return { url, commento: img.commento };
        })
      );

      const nuova = {
        coordinate: coords,
        dataOra,
        descrizione,
        stato,
        indirizzo,
        codiceOperatore: currentUser._id,
        fotografie: [],
        revisioneAdmin: {
          id: currentUser._id,
          username: currentUser.username,
          profilePicture: currentUser.profilePicture || '',
          commento: 'In attesa di revisione',
        },
        dataRevisione: null,
      };

      const nuovaSalvata: any = await this.perizieService.salvaPerizia(nuova);

      const nuovaPerizia = {
        ...nuovaSalvata,
        dataOra: new Date(nuovaSalvata.dataOra),
        fotografie: immaginiUploadate,
        revisioneAdmin: nuovaSalvata.revisioneAdmin || '',
      };

      this.perizie.set([nuovaPerizia, ...this.perizie()]);
      this.authService.setPerizie(this.perizie());

      for (const img of immaginiUploadate) {
        await this.dataStorage
          .inviaRichiesta(
            'post',
            `/operator/perizie/${nuovaPerizia._id}/foto`,
            {
              url: img.url,
              commento: img.commento,
            }
          )
          ?.toPromise();
      }

      this.messaggioAlert = 'Perizia aggiunta con successo!';
      this.alertSuccesso = true;
      this.immaginiSelezionate = [];
      this.nuovaPerizia = {
        indirizzo: '',
        dataOra: '',
        descrizione: '',
        stato: '',
        revisioneAdmin: '',
      };
      this.currentPage.set(1);
      setTimeout(() => (this.messaggioAlert = ''), 5000);
    } catch (error: any) {
      console.error('❌ Errore nel salvataggio:', error);
      this.messaggioAlert = error.message || 'Errore durante il salvataggio';
      this.alertSuccesso = false;
      setTimeout(() => (this.messaggioAlert = ''), 5000);
    }
  }

  async uploadToCloudinary(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'rilievi_preset');
    const response = await fetch(
      'https://api.cloudinary.com/v1_1/dvkczvtfs/image/upload',
      {
        method: 'POST',
        body: formData,
      }
    );
    const data = await response.json();
    if (!data.secure_url) throw new Error('Upload immagine fallito');
    return data.secure_url;
  }

  onFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input?.files) {
      this.immaginiSelezionate = Array.from(input.files).map((file) => ({
        file,
        commento: '',
      }));
    }
  }

  async getCoordinateDaIndirizzo(
    indirizzo: string
  ): Promise<{ latitudine: number; longitudine: number }> {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      indirizzo
    )}`;
    const response = await fetch(url);
    const data = await response.json();
    if (!data.length) throw new Error('Indirizzo non trovato');
    return {
      latitudine: parseFloat(data[0].lat),
      longitudine: parseFloat(data[0].lon),
    };
  }

  apriLightbox(url: string) {
    this.lightboxUrl = url;
  }

  chiudiLightbox() {
    this.lightboxUrl = null;
  }

  onSearchChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    const value = target.value;
    this.updateSearch(value); // string
  }

  onStatusChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const value = target.value;
    this.updateStatus(value);
  }

  updateSearch(value: string): void {
    this.search.set(value); // oppure this.searchTerm = value;
  }
  updateStatus(value: string): void {
    this.selectedStatus.set(value); // oppure this.status = value;
  }

  mostraDettagli(perizia: any) {
    this.selectedPerizia = {
      ...perizia,
      revisioneAdmin: perizia.revisioneAdmin || '',
    };
  }

  chiudiDettagli() {
    this.selectedPerizia = null;
  }

  avviaModifica(perizia: any) {
    this.periziaModifica = { ...perizia };
  }

  annullaModifica() {
    this.periziaModifica = null;
  }

  async salvaModifica() {
    try {
      const coords = await this.getCoordinateDaIndirizzo(
        this.periziaModifica.indirizzo
      );
      const aggiornata = await this.dataStorage
        .inviaRichiesta(
          'put',
          `/operator/perizie/${this.periziaModifica._id}`,
          {
            descrizione: this.periziaModifica.descrizione,
            indirizzo: this.periziaModifica.indirizzo,
            coordinate: coords,
            revisioneAdmin: this.periziaModifica.revisioneAdmin || '',
          }
        )
        ?.toPromise();

      const nuovaLista = this.perizie().map((p) => {
        if (p._id === this.periziaModifica._id) {
          return {
            ...p,
            ...this.periziaModifica,
            coordinate: coords,
          };
        }
        return p;
      });

      this.perizie.set(nuovaLista);
      this.authService.setPerizie(nuovaLista);
      this.periziaModifica = null;

      this.messaggioAlert = 'Perizia modificata con successo!';
      this.alertSuccesso = true;
      setTimeout(() => (this.messaggioAlert = ''), 4000);
    } catch (err) {
      console.error('❌ Errore durante la modifica:', err);
      this.messaggioAlert = 'Errore durante la modifica.';
      this.alertSuccesso = false;
      setTimeout(() => (this.messaggioAlert = ''), 4000);
    }
  }

  async eliminaPerizia(id: string) {
    try {
      await this.dataStorage
        .inviaRichiesta('delete', `/operator/perizie/${id}`)
        ?.toPromise();
      const nuovaLista = this.perizie().filter((p) => p._id !== id);
      this.perizie.set(nuovaLista);
      this.authService.setPerizie(nuovaLista);

      this.messaggioAlert = 'Perizia eliminata con successo!';
      this.alertSuccesso = true;
      setTimeout(() => (this.messaggioAlert = ''), 4000);
    } catch (err) {
      console.error('❌ Errore durante l’eliminazione:', err);
      this.messaggioAlert = 'Errore durante l’eliminazione.';
      this.alertSuccesso = false;
      setTimeout(() => (this.messaggioAlert = ''), 4000);
    }
  }

  filtered = computed(() => {
    const searchTerm = this.search().toLowerCase().trim();
    const statusFilter = this.selectedStatus();
    return this.perizie().filter(
      (p) =>
        (p.codicePerizia?.toLowerCase().includes(searchTerm) ||
          p.descrizione?.toLowerCase().includes(searchTerm)) &&
        (statusFilter === '' || p.stato === statusFilter)
    );
  });

  paginated = computed(() => {
    const start = (this.currentPage() - 1) * this.perPage;
    return this.filtered().slice(start, start + this.perPage);
  });

  totalPages = computed(() => Math.ceil(this.filtered().length / this.perPage));

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  prevPage() {
    this.goToPage(this.currentPage() - 1);
  }

  nextPage() {
    this.goToPage(this.currentPage() + 1);
  }
}
