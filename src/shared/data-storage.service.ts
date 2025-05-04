import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment'; // 👈 usa l'environment

@Injectable({
  providedIn: 'root',
})
export class DataStorageService {
  private REST_API_SERVER = environment.apiUrl; // ✅ esempio: 'https://backend-rilievi.onrender.com/api'

  constructor(private httpClient: HttpClient) {}

  public inviaRichiesta(
    method: string,
    resource: string,
    params: any = {}
  ): Observable<Object> | undefined {
    const endpoint = `${this.REST_API_SERVER}${resource.startsWith('/') ? '' : '/'}${resource}`;

    const options = {
      withCredentials: true
    };

    switch (method.toLowerCase()) {
      case 'get':
        return this.httpClient.get(endpoint, { params, ...options });
      case 'delete':
        return this.httpClient.delete(endpoint, { body: params, ...options });
      case 'post':
        return this.httpClient.post(endpoint, params, { ...options });
      case 'patch':
        return this.httpClient.patch(endpoint, params, { ...options });
      case 'put':
        return this.httpClient.put(endpoint, params, { ...options });
      default:
        return undefined;
    }
  }
}
