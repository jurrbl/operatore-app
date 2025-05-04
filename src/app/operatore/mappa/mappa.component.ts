import { Component, OnInit, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import * as maplibregl from 'maplibre-gl';
import { AuthService } from '../../../auth/auth.service';
import { CommonModule } from '@angular/common';
import { PerizieService } from '../../../shared/perizie.service';
@Component({
  selector: 'app-mappa',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mappa.component.html',
  styleUrls: ['./mappa.component.css']
})
export class MappaComponent implements OnInit, AfterViewInit {
  @ViewChild('mapContainer', { static: false }) mapContainerRef!: ElementRef;
  map!: maplibregl.Map;
  perizieTotali: any[] = [];
  perizieFiltrate: any[] = [];
  periziaSelezionata: any = null;
  userImage: string = '/assets/default-profile.jpg';

  constructor(private authService: AuthService,  private perizieService: PerizieService) {}

  ngOnInit(): void {
    const user = this.authService.getUser();
    if (user?.profilePicture) {
      this.userImage = user.profilePicture;
    }
  
    this.perizieService.getPerizie().subscribe({
      next: (response) => {
        this.perizieTotali = response.perizie || [];
        this.perizieFiltrate = [...this.perizieTotali]; // 🔥 tutte le perizie proprie
      },
      error: (err) => {
        console.error('Errore caricamento perizie', err);
      }
    });
  }

  ngAfterViewInit(): void {
    const defaultCenter: [number, number] = [7.6869, 45.0703];

    this.map = new maplibregl.Map({
      container: this.mapContainerRef.nativeElement,
      style: {
        version: 8,
        sources: {
          osm: {
            type: 'raster',
            tiles: ['https://a.tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256
          }
        },
        layers: [
          {
            id: 'osm',
            type: 'raster',
            source: 'osm'
          }
        ]
      },
      center: defaultCenter,
      zoom: 5
    });

    this.map.addControl(new maplibregl.NavigationControl());
    setTimeout(() => this.renderMarkers(), 500);
  }

  filtraPerizie(stato: string): void {
    if (stato === 'tutte') {
      this.perizieFiltrate = [...this.perizieTotali];
    } else {
      this.perizieFiltrate = this.perizieTotali.filter(p => p.stato?.toLowerCase() === stato.toLowerCase());
    }
    setTimeout(() => this.renderMarkers(), 0);
  }

  vaiAlDettaglio(perizia: any): void {
    this.periziaSelezionata = perizia;

    if (this.map && perizia.coordinate) {
      const lat = Number(perizia.coordinate.latitudine);
      const lon = Number(perizia.coordinate.longitudine);
      this.map.flyTo({
        center: [lon, lat],
        zoom: 16,
        speed: 1.2,
        curve: 1
      });
    }

    setTimeout(() => {
      const el = document.getElementById('dettaglio');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }

  renderMarkers(): void {
    if (!this.map) return;

    // Rimuove tutti i marker esistenti
    const markerElements = document.querySelectorAll('.maplibregl-marker');
    markerElements.forEach(el => el.remove());

    const bounds = new maplibregl.LngLatBounds();
    let markerCount = 0;

    this.perizieFiltrate.forEach(perizia => {
      const { codicePerizia, descrizione, coordinate, dataOra, fotografie = [] } = perizia;

      if (!coordinate) return;

      const lat = parseFloat(coordinate.latitudine);
      const lon = parseFloat(coordinate.longitudine);
      if (isNaN(lat) || isNaN(lon)) return;

      const lngLat: [number, number] = [lon, lat];
      bounds.extend(lngLat);
      markerCount++;

      const markerEl = document.createElement('div');
      markerEl.style.width = '40px';  // un po' più grande per equilibrio visivo
      markerEl.style.height = '40px';
      markerEl.style.backgroundColor = 'white';
      markerEl.style.borderRadius = '50%';

      markerEl.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)';
      markerEl.style.border = '2px solid white';
      markerEl.style.cursor = 'pointer';

      const img = document.createElement('img');
      img.src = this.userImage || 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
      img.alt = 'Foto';
      img.style.width = '100%';
      img.style.height = '100%';
      img.style.objectFit = 'cover';
      img.style.position = 'relative';
      img.style.zIndex = '1';
      img.onerror = () => {
        img.src = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
      };
      markerEl.appendChild(img);


      const popupContent = `
        <div class="maplibregl-popup-content">
          <div class="popup-wrapper" style="background-color: #111; padding: 16px; color: white; border-radius: 8px; max-width: 280px; font-family: 'Poppins', sans-serif;">
            <div class="popup-details" style="font-size:14px;">
              <p><strong>ID:</strong> ${codicePerizia}</p>
              <p><strong>Data:</strong> ${new Date(dataOra).toLocaleString()}</p>
              <p><strong>Descrizione:</strong> ${descrizione}</p>
              <button class="popup-btn" style="margin-top:10px; background-color: black; color: white; border: 1px solid white; padding: 6px 12px; border-radius: 6px; font-size: 12px; cursor: pointer;"
                onmouseover="this.style.backgroundColor='white';this.style.color='black';"
                onmouseout="this.style.backgroundColor='black';this.style.color='white';"
                data-id="${codicePerizia}">
                🔍 Dettaglio
              </button>
            </div>
          </div>
        </div>
      `;

      const popup = new maplibregl.Popup({ offset: 25 }).setHTML(popupContent);

      new maplibregl.Marker({
        element: markerEl,
        anchor: 'bottom'
      })
      .setLngLat(lngLat)
      .setPopup(popup)
      .addTo(this.map);

      markerEl.addEventListener('click', () => {
        this.map.flyTo({
          center: lngLat,
          zoom: 16,
          speed: 1.2,
          curve: 1
        });
      });

      popup.on('open', () => {
        setTimeout(() => {
          const btn = popup.getElement().querySelector(`.popup-btn[data-id="${codicePerizia}"]`);
          if (btn) {
            btn.addEventListener('click', () => {
              this.vaiAlDettaglio(perizia);
            });
          }
        }, 0);
      });
    });

    if (markerCount > 0) {
      this.map.fitBounds(bounds, { padding: 60, duration: 1000 });
    } else {
      console.warn('Nessun marker valido da visualizzare.');
    }
  }

  hideImage(event: Event) {
    const target = event.target as HTMLImageElement;
    if (target) {
      target.style.display = 'none';
    }
  }
}
