import { inject, Injectable, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { finalize, tap } from 'rxjs';
import { EmpresaGuardadaModel } from '../interfaces/empresa-model';
import { EmpresasService } from './empresas-service';

@Injectable({
  providedIn: 'root',
})
export class RegistroService {

  private http = inject(HttpClient);
  private empresasService = inject(EmpresasService);

  empresas = signal<EmpresaGuardadaModel[]>([]);
  cargando = signal(false);
  error = signal<string | null>(null);

  /** Trae de la base de datos todas las empresas guardadas. */
  cargar() {
    this.cargando.set(true);
    this.error.set(null);

    this.http.get<EmpresaGuardadaModel[]>('/api/empresas')
    .pipe(finalize(() => this.cargando.set(false)))
    .subscribe({
      next: empresas => this.empresas.set(empresas),
      error: (err: HttpErrorResponse) => this.error.set(err.error?.error ?? 'No se ha podido conectar con el servidor'),
    });
  }

  /** Guarda los cambios hechos a mano. Devuelve el Observable para que la tabla sepa si ha ido bien. */
  guardar(empresa: EmpresaGuardadaModel) {
    return this.http.post<EmpresaGuardadaModel>('/api/empresas/editar', empresa).pipe(
      tap(guardada => {
        this.empresas.update(lista => lista.map(e => e.id === guardada.id ? guardada : e));

        // Si esa empresa está en el buscador o en la ficha abierta, que también se vea el cambio
        const { analizadaEn, editadaEn, actualizadaEn, ...datos } = guardada;
        this.empresasService.empresasResponse.update(lista =>
          lista.map(e => e.id === datos.id ? { ...datos, distancia: e.distancia } : e));
        this.empresasService.empresaSeleccionada.update(e =>
          e?.id === datos.id ? { ...datos, distancia: e.distancia } : e);
      })
    );
  }

}
