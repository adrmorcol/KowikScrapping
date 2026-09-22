import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PaginaBusqueda } from './pagina-busqueda';

describe('PaginaBusqueda', () => {
  let component: PaginaBusqueda;
  let fixture: ComponentFixture<PaginaBusqueda>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaginaBusqueda],
    }).compileComponents();

    fixture = TestBed.createComponent(PaginaBusqueda);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
