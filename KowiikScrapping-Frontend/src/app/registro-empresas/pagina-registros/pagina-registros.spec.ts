import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PaginaRegistros } from './pagina-registros';

describe('PaginaRegistros', () => {
  let component: PaginaRegistros;
  let fixture: ComponentFixture<PaginaRegistros>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaginaRegistros],
    }).compileComponents();

    fixture = TestBed.createComponent(PaginaRegistros);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
