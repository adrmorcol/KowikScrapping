import { effect, Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class BusquedaRadio {
  coordenadas = signal({lat: 38.91393927010367, lng: -0.549343228340149});
  radioMetros = signal(500);
  cargando = signal(false);
}
