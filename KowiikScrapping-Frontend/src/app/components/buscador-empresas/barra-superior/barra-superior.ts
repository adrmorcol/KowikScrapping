import { Component, inject, signal, } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BusquedaRadio } from '../busqueda-radio';
@Component({
  selector: 'app-barra-superior',
  imports: [RouterLink],
  templateUrl: './barra-superior.html',
  styleUrl: './barra-superior.css',
})

export class BarraSuperior {
  service = inject(BusquedaRadio);
}
