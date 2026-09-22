import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InfoEmpresaMapa } from './info-empresa-mapa';

describe('InfoEmpresaMapa', () => {
  let component: InfoEmpresaMapa;
  let fixture: ComponentFixture<InfoEmpresaMapa>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InfoEmpresaMapa],
    }).compileComponents();

    fixture = TestBed.createComponent(InfoEmpresaMapa);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
