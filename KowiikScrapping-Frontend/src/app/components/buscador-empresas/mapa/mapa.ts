import { AfterViewInit, Component, effect, ElementRef, inject, input, signal, ViewChild } from '@angular/core';
import * as L from 'leaflet';
import { BusquedaRadio } from '../busqueda-radio';

@Component({
  selector: 'app-mapa',
  imports: [],
  templateUrl: './mapa.html',
  styleUrl: './mapa.css',
})
export class Mapa {
  @ViewChild('mapa') mapaRef!: ElementRef<HTMLDivElement>;
  service = inject(BusquedaRadio);

  private puntoSeleccionado?: L.LatLng;
  private mapa?: L.Map;
  private marcador?: L.CircleMarker;
  private area?: L.Circle;

  constructor() {
    effect(() => {
      this.service.radioMetros();
      this.dibujarArea();
    })
  }

  ngAfterViewInit() {
    this.puntoSeleccionado = L.latLng(38.91393927010367, -0.549343228340149);
    this.crearMapa();
    this.dibujarMarcador();
    this.dibujarArea();
  }

  private crearMapa() {
    this.mapa = L.map(this.mapaRef.nativeElement).setView(this.puntoSeleccionado!, 19);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.mapa);
    this.mapa.on('click', (e: L.LeafletMouseEvent) => this.seleccionarPunto(e.latlng));
  }

  private seleccionarPunto(punto: L.LatLng) {
    this.puntoSeleccionado = punto;
    this.dibujarMarcador();
    this.dibujarArea();
  }

  private dibujarMarcador() {
    if (!this.mapa || !this.puntoSeleccionado) return;

    this.marcador?.remove();
    this.marcador = L.circleMarker(this.puntoSeleccionado!, {
      radius: 7,
      color: '#FFFFFF',
      weight: 2,
      fillColor: '#2F6F5E',
      fillOpacity: 1,
      bubblingMouseEvents: false
    }).addTo(this.mapa!);
  }

  private dibujarArea() {
    if (!this.mapa || !this.puntoSeleccionado) return;

    this.area?.remove();
      this.area = L.circle(this.puntoSeleccionado!, {
        radius: this.service.radioMetros(),
        color: '#2F6F5E',
        weight: 1.5,
        dashArray: '6 6',
        fillColor: '#2F6F5E',
        fillOpacity: 0.08,
        interactive: false
      }
    ).addTo(this.mapa!);
  }


  
}
