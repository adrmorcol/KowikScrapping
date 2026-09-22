import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetalleEmpresa } from './detalle-empresa';

describe('DetalleEmpresa', () => {
  let component: DetalleEmpresa;
  let fixture: ComponentFixture<DetalleEmpresa>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetalleEmpresa],
    }).compileComponents();

    fixture = TestBed.createComponent(DetalleEmpresa);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
