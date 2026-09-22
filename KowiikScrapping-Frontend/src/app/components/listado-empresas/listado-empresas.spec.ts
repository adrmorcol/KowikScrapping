import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListadoEmpresas } from './listado-empresas';

describe('ListadoEmpresas', () => {
  let component: ListadoEmpresas;
  let fixture: ComponentFixture<ListadoEmpresas>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListadoEmpresas],
    }).compileComponents();

    fixture = TestBed.createComponent(ListadoEmpresas);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
