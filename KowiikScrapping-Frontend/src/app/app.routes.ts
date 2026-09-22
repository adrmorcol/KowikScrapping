import { Routes } from '@angular/router';
import { Home } from './components/home/home';
import { Header } from './components/header/header';
import { Login } from './components/login/login';
import { Register } from './components/register/register';
import { PaginaBusqueda } from './components/buscador-empresas/pagina-busqueda/pagina-busqueda';
import { PaginaRegistros } from './registro-empresas/pagina-registros/pagina-registros';

export const routes: Routes = [
    { path: 'home', component: Home},
    { path: 'header', component: Header},
    { path: 'login', component: Login},
    { path: 'register', component: Register},
    { path: 'buscadorEmpresas', component: PaginaBusqueda},
    { path: 'paginaRegistros', component: PaginaRegistros},
    { path: '**', component: Home},
];
