import { Routes } from '@angular/router';
import { Home } from './components/home/home';
import { Header } from './components/compartidos/header/header';
import { Login } from './components/login/login';
import { Register } from './components/register/register';
import { PaginaBusqueda } from './components/buscador-empresas/pagina-busqueda/pagina-busqueda';

export const routes: Routes = [
    { path: 'home', component: Home},
    { path: 'header', component: Header},
    { path: 'login', component: Login},
    { path: 'register', component: Register},
    { path: 'buscadorEmpresas', component: PaginaBusqueda},
    { path: '**', component: Home},
];
