import { TestBed } from '@angular/core/testing';

import { BusquedaRadio } from './busqueda-radio';

describe('BusquedaRadio', () => {
  let service: BusquedaRadio;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BusquedaRadio);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
