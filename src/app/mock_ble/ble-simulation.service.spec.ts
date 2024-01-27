import { TestBed } from '@angular/core/testing';

import { BleSimulationService } from './ble-simulation.service';

describe('BleSimulationService', () => {
  let service: BleSimulationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BleSimulationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
