import { Component, inject } from '@angular/core';
import { EmpresasService } from '../../../services/empresas-service';
import { Empresa } from '../empresa/empresa';

@Component({
  selector: 'app-listado-empresas',
  imports: [Empresa],
  templateUrl: './listado-empresas.html',
  styleUrl: './listado-empresas.css',
})
export class ListadoEmpresas {
  service = inject(EmpresasService);
}
