import { Component, inject, signal, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BusquedaRadio } from '../busqueda-radio';
import { EmpresasService } from '../../../services/empresas-service';
import { BusquedaEmpresaModel } from '../../../interfaces/busqueda-empresa-model';
@Component({
  selector: 'app-barra-superior',
  imports: [RouterLink],
  templateUrl: './barra-superior.html',
  styleUrl: './barra-superior.css',
})

export class BarraSuperior {
  service = inject(BusquedaRadio);
  empresasService = inject(EmpresasService);
  
  buscar() {
    const { lat, lng } = this.service.coordenadas();
    const busqueda: BusquedaEmpresaModel = {
      lat: lat,
      lng: lng,
      radio: this.service.radioMetros()
    }

    this.empresasService.buscar(busqueda);
  }

  buscarDireccion(direccion: string) {
    if (!direccion.trim()) return;
    
    this.empresasService.buscarDireccion(direccion).subscribe(res => {
      if (res.length) {
        this.service.coordenadas.set({ lat: res[0].lat, lng: res[0].lng });
      }
    })
  }

  
}
