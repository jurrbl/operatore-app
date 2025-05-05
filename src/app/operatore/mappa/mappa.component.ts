import { Component, OnInit, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import * as maplibregl from 'maplibre-gl';
import { AuthService } from '../../../auth/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // ✅ import FormsModule
import { PerizieService } from '../../../shared/perizie.service';

@Component({
  selector: 'app-mappa',
  standalone: true,
  imports: [CommonModule, FormsModule], // ✅ aggiunto FormsModule
  templateUrl: './mappa.component.html',
  styleUrls: ['./mappa.component.css']
})
export class MappaComponent implements OnInit, AfterViewInit {
  @ViewChild('mapContainer', { static: false }) mapContainerRef!: ElementRef;
  map!: maplibregl.Map;
  perizieTotali: any[] = [];
  perizieFiltrate: any[] = [];
  periziaSelezionata: any = null;
  popupAperti: maplibregl.Popup[] = [];
  immagineIngrandita: string | null = null;
  userImage: string = '/assets/default-profile.jpg';

  constructor(private authService: AuthService, private perizieService: PerizieService) {}

  ngOnInit(): void {
    const user = this.authService.getUser();
    if (user?.profilePicture) {
      this.userImage = user.profilePicture;
    }

    this.perizieService.getPerizie().subscribe({
      next: (response) => {
        this.perizieTotali = response.perizie || [];
        this.perizieFiltrate = [...this.perizieTotali];
      },
      error: (err) => {
        console.error('Errore caricamento perizie', err);
      }
    });
  }

  ngAfterViewInit(): void {
    const defaultCenter: [number, number] = [7.6869, 45.0703];

    const mapContainer = this.mapContainerRef.nativeElement;
    if (mapContainer.parentElement) {
      mapContainer.parentElement.style.overflow = 'visible';
    }
    mapContainer.style.overflow = 'visible';

    this.map = new maplibregl.Map({
      container: mapContainer,
      style: {
        version: 8,
        sources: {
          osm: {
            type: 'raster',
            tiles: ['https://a.tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256
          }
        },
        layers: [{
          id: 'osm',
          type: 'raster',
          source: 'osm'
        }]
      },
      center: defaultCenter,
      zoom: 5
    });

    this.map.addControl(new maplibregl.NavigationControl());

    this.map.on('load', () => {
      this.map.resize();
      this.renderMarkers();
    });
  }

  filtraPerizie(stato: string): void {
    this.perizieFiltrate = (stato === 'tutte')
      ? [...this.perizieTotali]
      : this.perizieTotali.filter(p => p.stato?.toLowerCase() === stato.toLowerCase());
    this.renderMarkers();
  }

  vaiAlDettaglio(perizia: any): void {
    // ✅ Assicurati che esista revisioneAdmin per evitare errori nel binding
    if (!perizia.revisioneAdmin) {
      perizia.revisioneAdmin = { commento: '' };
    }

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
    document.querySelectorAll('.maplibregl-marker').forEach(el => el.remove());

    const bounds = new maplibregl.LngLatBounds();
    let markerCount = 0;

    this.perizieFiltrate.forEach((perizia, index) => {
      const { codicePerizia, descrizione, coordinate, dataOra } = perizia;
      if (!coordinate) return;

      const lat = parseFloat(coordinate.latitudine);
      const lon = parseFloat(coordinate.longitudine);
      if (isNaN(lat) || isNaN(lon)) return;

      const lngLat: [number, number] = [lon, lat];
      bounds.extend(lngLat);
      markerCount++;

      const markerEl = document.createElement('div');
      markerEl.style.cssText = `
        width: 40px;
        height: 40px;
        background-color: white;
        border-radius: 50%;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        border: 2px solid white;
        cursor: pointer;
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
        position: absolute;
        top: 0;
        left: 0;
        transform: translate(-50%, -100%);
      `;

      const img = document.createElement('img');
      img.src = this.userImage || 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
      img.alt = 'Foto';
      img.style.cssText = `
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: 50%;
      `;
      img.onerror = () => {
        img.src = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
      };
      markerEl.appendChild(img);

      const popupContent = `
        <div style="
          background-color: #1e1e24;
          color: #f4f4f5;
          padding: 16px;
          border: 2px solid #4b5563;
          border-radius: 8px;
          font-family: 'Segoe UI', sans-serif;
          font-size: 14px;
          max-width: 250px;">
          <p><strong>ID:</strong> ${codicePerizia}</p>
          <p><strong>Data:</strong> ${new Date(dataOra).toLocaleString()}</p>
          <p><strong>Descrizione:</strong> ${descrizione}</p>
          <button data-id="${codicePerizia}" style="
            margin-top: 10px;
            background-color: black;
            color: white;
            border: 1px solid white;
            padding: 6px 12px;
            border-radius: 6px;
            font-size: 12px;
            cursor: pointer;">
            🔍 Dettaglio
          </button>
        </div>
      `;

      const popup = new maplibregl.Popup({ offset: 25 }).setHTML(popupContent);

      const marker = new maplibregl.Marker({ element: markerEl, anchor: 'bottom' })
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
        setTimeout(() => {
          popup.addTo(this.map);
          const el = popup.getElement();
          if (el) el.style.zIndex = '9999';
        }, 500);
      });

      popup.on('open', () => {
        const el = popup.getElement();
        if (el) el.style.zIndex = '9999';

        const btn = el.querySelector(`button[data-id="${codicePerizia}"]`);
        if (btn) {
          btn.addEventListener('click', () => this.vaiAlDettaglio(perizia));
        }
      });

      requestAnimationFrame(() => {
        const box = markerEl.getBoundingClientRect();
        const style = getComputedStyle(markerEl);
        console.log(`🧪 Marker ${index + 1} (${codicePerizia}):`);
        console.log('  ↳ Posizione:', lngLat);
        console.log('  ↳ Bounding box:', box);
        console.log('  ↳ Style:', {
          position: style.position,
          transform: style.transform,
          top: style.top,
          left: style.left,
          width: style.width,
          height: style.height
        });
      });
    });

    if (markerCount > 0) {
      this.map.fitBounds(bounds, { padding: 60, duration: 1000 });
    } else {
      console.warn('Nessun marker valido da visualizzare.');
    }
  }

  chiudiPopupAperti(): void {
    this.popupAperti.forEach(p => p.remove());
    this.popupAperti = [];
  }

  chiudiImmagine(): void {
    this.immagineIngrandita = null;
    const modal = document.querySelector('#modalContainer') as HTMLElement;
    if (modal) modal.style.display = 'none';
  }

  hideImage(event: Event) {
    const target = event.target as HTMLImageElement;
    if (target) target.style.display = 'none';
  }
}
