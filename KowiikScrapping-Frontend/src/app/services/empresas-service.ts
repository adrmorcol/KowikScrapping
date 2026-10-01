import { inject, Injectable, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BusquedaEmpresaModel } from '../interfaces/busqueda-empresa-model';
import { BusquedaRadio } from '../components/buscador-empresas/busqueda-radio';
import { EmpresaModel, EstadoEmpresa } from '../interfaces/empresa-model';

import { finalize, map } from 'rxjs';
import { DireccionModel } from '../interfaces/direccion-model';

@Injectable({
  providedIn: 'root',
})
export class EmpresasService {
  
  private service = inject(BusquedaRadio);
  private http = inject(HttpClient);
  empresasResponse = signal<EmpresaModel[]>([]);

  async buscar(busquedaModel: BusquedaEmpresaModel) {
    this.service.cargando.set(true);

    this.http.post<EmpresaModel[]>('/api/empresas/buscar', busquedaModel)
    .pipe(finalize(() => this.service.cargando.set(false)))
    .subscribe({
      next: empresas => this.empresasResponse.set(empresas),
      error: (err: HttpErrorResponse) => {
        console.log('No se ha podido conectar con el servidor');
      }
    });
  }

  buscarDireccion(direccion: string) {
    return this.http.get<any>('https://photon.komoot.io/api', {
      params: { q: direccion, limit: 5, lat: 38.82, lon: -0.6 },
    }).pipe(
      map(res => res.features.map((f: any): DireccionModel => ({
        nombre: [f.properties.name, f.properties.street, f.properties.city, f.properties.state]
          .filter(Boolean).join(', '),
        lat: f.geometry.coordinates[1],
        lng: f.geometry.coordinates[0],
      })))
    );
  }

  empresaSeleccionada = signal<EmpresaModel | null>(null);

  seleccionarEmpresa(empresa: EmpresaModel) {
    
    this.empresaSeleccionada.set(empresa);
    
    this.http.post<EmpresaModel>('/api/empresas/ficha', empresa)
    .subscribe(completa => {
      const actual = this.empresaSeleccionada();
      // Si mientras se analizaba se ha pulsado otra empresa, no la pisamos
      if (actual?.id !== completa.id) return;
      // El estado puede haber cambiado mientras se hacía el scraping: nos quedamos con el más reciente
      this.empresaSeleccionada.set({ ...completa, estado: actual.estado });
    });
  }

  /**
   * Marca la empresa seleccionada como verificada o no apta.
   * Si ya tenía ese estado, la devuelve a pendiente (así el botón sirve para quitarlo).
   */
  cambiarEstado(estado: EstadoEmpresa) {
    const empresa = this.empresaSeleccionada();
    if (!empresa) return;

    const nuevo: EstadoEmpresa = empresa.estado === estado ? 'pendiente' : estado;

    this.http.post<{ id: string, estado: EstadoEmpresa }>('/api/empresas/estado', { empresa, estado: nuevo })
    .subscribe({
      next: ({ id, estado }) => {
        // Actualizamos la ficha abierta y la tarjeta del listado
        this.empresaSeleccionada.update(e => e?.id === id ? { ...e, estado } : e);
        this.empresasResponse.update(lista => lista.map(e => e.id === id ? { ...e, estado } : e));
      },
      error: (err: HttpErrorResponse) => {
        console.log('No se ha podido guardar el estado', err.error?.error ?? err.message);
      }
    });
  }

}
