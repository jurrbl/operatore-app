import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { AuthService } from '../../../auth/auth.service';
import { DataStorageService } from '../../../shared/data-storage.service';
import { formatDistanceToNow } from 'date-fns';
import { it } from 'date-fns/locale';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgFor } from '@angular/common';
import { NgIf } from '@angular/common';
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, NgFor, NgIf],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit {
  name: string = '';
  role: string = '';
  username: string = '';
  email: string = '';
  phone: string = '';
  profilePicture: string = 'assets/img/default-avatar.png';
  token: string | null = null;
  countPerizie: number = 0;
  lastSeen: string = 'Mai';
  sortOrder: 'asc' | 'desc' = 'desc';
  filtroStato: string = 'tutte';

  cronologiaPerizie: Array<{
    dataOra: Date;
    stato: string;
    dataRevisione?: Date;
    revisioneAdmin?: {
      id: string;
      username: string;
      profilePicture?: string;
    };
  }> = [];

  constructor(
    private route: ActivatedRoute,
    private location: Location,
    private authService: AuthService,
    private dataStorageService: DataStorageService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.handleTokenFromUrl();
    this.populateUserData();
    this.populateCronologiaPerizie();
  }

  private handleTokenFromUrl(): void {
    this.token = this.route.snapshot.queryParamMap.get('token');
    console.log('Token from URL:', this.token);
    if (this.token) {
      localStorage.setItem('token', this.token);
      const cleanUrl = this.route.snapshot.pathFromRoot
        .map((route) =>
          route.url.map((segment) => segment.toString()).join('/')
        )
        .join('/');
      this.location.replaceState(cleanUrl);
    }
  }

  private populateUserData(): void {
    const user = this.authService.getUser();
    console.log('User from AuthService:', user);
    if (user) {
      this.username = user.username || 'Utente';
      this.email = user.email || '–';
      this.phone = user.phone || '–';
      this.profilePicture =
        user.profilePicture ||
        'https://cdn-icons-png.flaticon.com/512/149/149071.png';
      this.role = user.role || 'Utente';
      this.countPerizie = this.authService.getPerizie()?.length || 0;

      this.lastSeen = user.lastSeen
        ? formatDistanceToNow(new Date(user.lastSeen), {
            addSuffix: true,
            locale: it,
          })
        : 'Mai';
    } else {
      this.router.navigate(['/login']);
    }
  }

  private populateCronologiaPerizie(): void {
    const currentUser = this.authService.getUser();
    const tutteLePerizie = this.authService.getPerizie() || [];

    console.log('✅ Tutte le perizie:', tutteLePerizie);
    console.log('✅ Current User ID:', currentUser?._id);

    if (!currentUser || tutteLePerizie.length === 0) {
      this.cronologiaPerizie = [];
      return;
    }

    let perizieUtente = tutteLePerizie
      .filter((p) => {
        const idOperatore =
          typeof p.codiceOperatore === 'string'
            ? p.codiceOperatore
            : (p.codiceOperatore as any)?._id?.toString();

        return idOperatore === currentUser._id;
      })
      .map((p) => ({
        dataOra: new Date(p.dataOra),
        stato: p.stato,
        dataRevisione: p.dataRevisione ? new Date(p.dataRevisione) : undefined,
        revisioneAdmin: p.revisioneAdmin
          ? {
              id: (p.revisioneAdmin as any).id,
              username: (p.revisioneAdmin as any).username,
              profilePicture: (p.revisioneAdmin as any).profilePicture || '',
            }
          : undefined,
      }));

    if (this.filtroStato !== 'tutte') {
      perizieUtente = perizieUtente.filter((p) => p.stato === this.filtroStato);
    }

    this.cronologiaPerizie = perizieUtente.sort((a, b) => {
      return this.sortOrder === 'asc'
        ? a.dataOra.getTime() - b.dataOra.getTime()
        : b.dataOra.getTime() - a.dataOra.getTime();
    });

    console.log('✅ Cronologia caricata:', this.cronologiaPerizie);
  }

  cambiaOrdine() {
    this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    this.populateCronologiaPerizie();
  }

  filtraPerStato(stato: string) {
    this.filtroStato = stato;
    this.populateCronologiaPerizie();
  }

  redirectToEmail(email: string): void {
    window.location.href = `mailto:${email}`;
  }
}
