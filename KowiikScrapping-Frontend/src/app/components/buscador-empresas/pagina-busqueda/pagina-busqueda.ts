import { Component } from '@angular/core';
import { BarraSuperior } from '../barra-superior/barra-superior';
import { ListadoEmpresas } from '../listado-empresas/listado-empresas';
import { Mapa } from '../mapa/mapa';
import { DetalleEmpresa } from '../detalle-empresa/detalle-empresa';
import { Header } from '../../header/header';

@Component({
  selector: 'app-pagina-busqueda',
  imports: [BarraSuperior, ListadoEmpresas, Mapa, DetalleEmpresa, Header],
  templateUrl: './pagina-busqueda.html',
  styleUrl: './pagina-busqueda.css',
})
export class PaginaBusqueda {}
