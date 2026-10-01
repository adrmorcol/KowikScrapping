import { Routes } from '@angular/router';
import { Home } from './components/home/home';
import { Header } from './components/compartidos/header/header';
import { PaginaBusqueda } from './components/buscador-empresas/pagina-busqueda/pagina-busqueda';
import { PaginaRegistros } from './components/registro-empresas/pagina-registros/pagina-registros';

export const routes: Routes = [
    { path: 'home', component: Home},
    { path: 'header', component: Header},
    { path: 'buscadorEmpresas', component: PaginaBusqueda},
    { path: 'paginaRegistros', component: PaginaRegistros},
    { path: '**', component: Home},
];
