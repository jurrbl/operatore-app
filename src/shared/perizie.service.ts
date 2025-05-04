import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Perizia {
  codicePerizia: string;
  dataOra: Date;
  coordinate: {
    latitudine: number;
    longitudine: number;
  };
  descrizione: string;
  stato: 'in_corso' | 'completata' | 'annullata';
}

@Injectable({
  providedIn: 'root'
})
export class PerizieService {
  private baseUrl = 'https://backend-rilievi.onrender.com/api/operator/perizie';

  constructor(private http: HttpClient) {}

  // ✅ Ottieni tutte le perizie dell'operatore loggato
  getPerizie(): Observable<{ perizie: Perizia[] }> {
    return this.http.get<{ perizie: Perizia[] }>(this.baseUrl, {
      withCredentials: true
    });
  }

  // ✅ Salva nuova perizia
  salvaPerizia(perizia: any): Promise<any> {
    return this.http.post<any>(this.baseUrl, perizia, {
      withCredentials: true
    }).toPromise();
  }


  aggiungiFoto(periziaId: string, foto: { url: string; commento: string }): Promise<any> {
    return this.http.post<any>(
      `${this.baseUrl}/${periziaId}/foto`,
      foto,
      { withCredentials: true }
    ).toPromise();
  }


  modificaPerizia(id: string, aggiornamenti: Partial<Perizia>): Promise<any> {
    return this.http.put<any>(
      `${this.baseUrl}/${id}`,
      aggiornamenti,
      { withCredentials: true }
    ).toPromise();
  }


  eliminaPerizia(id: string): Promise<any> {
    return this.http.delete<any>(
      `${this.baseUrl}/${id}`,
      { withCredentials: true }
    ).toPromise();
  }
}
