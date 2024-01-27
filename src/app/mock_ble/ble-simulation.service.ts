// ble-simulation.service.ts
import { Injectable, OnInit } from '@angular/core';
import { Observable, Subject, timer } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BleSimulationService implements OnInit {
  private devicesSubject: Subject<any[]> = new Subject<any[]>();
  private scanInterval: any;

  ngOnInit() {
    this.startSimulation();
  }

  startSimulation() {
    this.scanInterval = timer(0, 10000).subscribe(() => {
      const simulatedDevices = this.generateSimulatedDevices();
      this.devicesSubject.next(simulatedDevices);
    });
  }

  stopSimulation() {
    if (this.scanInterval) {
      this.scanInterval.unsubscribe();
    }
  }

  getDevices(): Observable<any[]> {
    return this.devicesSubject.asObservable();
  }

  private generateSimulatedDevices(): any[] {
    const devices = [
      { name: 'SimDeviceA', rssi: this.getRandomRssi() },
      { name: 'SimDeviceB', rssi: this.getRandomRssi() },
      { name: 'SimDeviceC', rssi: this.getRandomRssi() },
    ];

    return devices;
  }

  private getRandomRssi(): number {
    return Math.floor(Math.random() * ( -50 - (-80) + 1)) + (-80);
  }
}
