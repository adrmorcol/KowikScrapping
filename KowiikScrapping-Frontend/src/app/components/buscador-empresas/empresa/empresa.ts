import { Component, inject, input } from '@angular/core';
import { EmpresaModel } from '../../../interfaces/empresa-model';
import { BusquedaRadio } from '../busqueda-radio';
import { DecimalPipe } from '@angular/common';
import { EmpresasService } from '../../../services/empresas-service';

@Component({
  selector: 'app-empresa',
  imports: [DecimalPipe],
  templateUrl: './empresa.html',
  styleUrl: './empresa.css',
})
export class Empresa {
  empresa = input.required<EmpresaModel>();
  service = inject(EmpresasService);
  
}
