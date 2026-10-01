import { Component, inject } from '@angular/core';
import { BusquedaRadio } from '../../buscador-empresas/busqueda-radio';

@Component({
  selector: 'app-capa-carga',
  imports: [],
  templateUrl: './capa-carga.html',
  styleUrl: './capa-carga.css',
})
export class CapaCarga {
  service = inject(BusquedaRadio);

}
