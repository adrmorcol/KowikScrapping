import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CapaCarga } from './capa-carga';

describe('CapaCarga', () => {
  let component: CapaCarga;
  let fixture: ComponentFixture<CapaCarga>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CapaCarga],
    }).compileComponents();

    fixture = TestBed.createComponent(CapaCarga);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
