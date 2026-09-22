import { Component } from '@angular/core';
import { Header } from '../header/header';
import { LucideList, LucideSearch } from '@lucide/angular';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  imports: [Header, LucideSearch, LucideList, RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  
}
