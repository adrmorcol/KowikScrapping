import { Component, inject, input } from '@angular/core';
import { EmpresasService } from '../../../services/empresas-service';

@Component({
  selector: 'app-detalle-empresa',
  imports: [],
  templateUrl: './detalle-empresa.html',
  styleUrl: './detalle-empresa.css',
})
export class DetalleEmpresa {
  service = inject(EmpresasService);
}
