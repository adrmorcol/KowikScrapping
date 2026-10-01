import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Header } from '../../compartidos/header/header';
import { RegistroService } from '../../../services/registro-service';
import { EmpresaGuardadaModel, EstadoEmpresa } from '../../../interfaces/empresa-model';

type Filtro = EstadoEmpresa | 'todas';

/** Copia de la empresa que se está editando (el decisor siempre existe para poder enlazar sus inputs). */
type Borrador = EmpresaGuardadaModel & {
  decisor: { nombre: string | null, cargo: string | null, email: string | null, telefono: string | null }
};

@Component({
  selector: 'app-pagina-registros',
  imports: [Header, FormsModule, DatePipe, RouterLink],
  templateUrl: './pagina-registros.html',
  styleUrl: './pagina-registros.css',
})
export class PaginaRegistros implements OnInit {
  service = inject(RegistroService);

  // Filtros de arriba
  busqueda = signal('');
  filtro = signal<Filtro>('todas');

  filtros: { valor: Filtro, texto: string }[] = [
    { valor: 'todas', texto: 'Todas' },
    { valor: 'verificada', texto: 'Verificadas' },
    { valor: 'pendiente', texto: 'Pendientes' },
    { valor: 'no_apta', texto: 'No aptas' },
  ];

  contadores = computed(() => {
    const lista = this.service.empresas();
    return {
      todas: lista.length,
      verificada: lista.filter(e => e.estado === 'verificada').length,
      pendiente: lista.filter(e => e.estado === 'pendiente').length,
      no_apta: lista.filter(e => e.estado === 'no_apta').length,
    };
  });

  filtradas = computed(() => {
    const texto = this.busqueda().trim().toLowerCase();
    const filtro = this.filtro();

    return this.service.empresas().filter(e => {
      if (filtro !== 'todas' && e.estado !== filtro) return false;
      if (!texto) return true;
      return [e.nombre, e.razonSocial, e.cif, e.sector, e.localidad, e.provincia, e.telefono, e.email, e.web, e.decisor?.nombre]
        .some(valor => valor?.toLowerCase().includes(texto));
    });
  });

  // Edición: solo una fila a la vez
  editandoId = signal<string | null>(null);
  borrador: Borrador | null = null;
  guardando = signal(false);
  errorEdicion = signal<string | null>(null);

  ngOnInit() {
    this.service.cargar();
  }

  editar(empresa: EmpresaGuardadaModel) {
    this.borrador = {
      ...empresa,
      decisor: { ...(empresa.decisor ?? { nombre: null, cargo: null, email: null, telefono: null }) },
    };
    this.errorEdicion.set(null);
    this.editandoId.set(empresa.id);
  }

  cancelar() {
    this.borrador = null;
    this.errorEdicion.set(null);
    this.editandoId.set(null);
  }

  guardar() {
    if (!this.borrador || this.guardando()) return;

    this.guardando.set(true);
    this.errorEdicion.set(null);

    this.service.guardar(this.borrador).subscribe({
      next: () => {
        this.guardando.set(false);
        this.cancelar();
      },
      error: err => {
        this.guardando.set(false);
        this.errorEdicion.set(err.error?.error ?? 'No se ha podido guardar');
      },
    });
  }

  /** "https://www.ejemplo.es/" → "ejemplo.es", para que la columna no sea enorme. */
  dominio(web: string) {
    return web.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '');
  }

  /** Las webs sin http delante no funcionarían como enlace. */
  enlace(web: string) {
    return /^https?:\/\//.test(web) ? web : `https://${web}`;
  }
}
