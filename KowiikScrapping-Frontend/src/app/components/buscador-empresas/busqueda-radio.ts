import { effect, Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class BusquedaRadio {
  radioMetros = signal(500);
}
