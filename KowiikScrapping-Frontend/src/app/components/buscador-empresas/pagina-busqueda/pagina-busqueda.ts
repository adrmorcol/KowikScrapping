import { Component, inject, signal } from '@angular/core';
import { BarraSuperior } from '../barra-superior/barra-superior';
import { ListadoEmpresas } from '../listado-empresas/listado-empresas';
import { Mapa } from '../mapa/mapa';
import { DetalleEmpresa } from '../detalle-empresa/detalle-empresa';
import { Header } from '../../compartidos/header/header';
import { CapaCarga } from '../../compartidos/capa-carga/capa-carga';
import { BusquedaRadio } from '../busqueda-radio';

@Component({
  selector: 'app-pagina-busqueda',
  imports: [BarraSuperior, ListadoEmpresas, Mapa, DetalleEmpresa, Header, CapaCarga],
  templateUrl: './pagina-busqueda.html',
  styleUrl: './pagina-busqueda.css',
})

export class PaginaBusqueda {
  service = inject(BusquedaRadio);
}
