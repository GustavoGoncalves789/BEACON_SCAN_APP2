import { Component, OnInit } from '@angular/core';
import { BluetoothSerial } from '@awesome-cordova-plugins/bluetooth-serial/ngx';
import { BLE } from '@ionic-native/ble/ngx';
import { AlertController, MenuController, NavController } from '@ionic/angular';
import { BleSimulationService } from '../mock_ble/ble-simulation.service';
import { Platform } from '@ionic/angular';

@Component({
  selector: 'app-epi',
  templateUrl: './epi.page.html',
  styleUrls: ['./epi.page.scss'],
})
export class EpiPage implements OnInit {
  devicesSelected: any[] = [];
  isScanning: boolean = false;
  scanInterval: any;

  constructor(
    private menu: MenuController,
    private navCtrl: NavController,
    private bluetoothSerial: BluetoothSerial,
    private ble: BLE,
    private alertContrl: AlertController,
    private bleSimulationService: BleSimulationService,
    private platform: Platform
  ) {
    this.selectedDiv = 'NerBy';
    this.buttonsBottom = 'Scanner';

    this.ngOnInit();
    // // Manually start simulation when the page initializes
    this.bleSimulationService.startSimulation();
  }

  activateBluetoothError: string = '';
  scanDevicesError: string = '';
  devices: any[] = [];
  platform_is: string = '';

  ngOnInit() {
    if (this.platform.is('android')) {
      console.log('Running on Android');
      this.platform_is = 'ANDROID';
    } else if (this.platform.is('ios')) {
      console.log('Running on iOS');
      this.platform_is = 'IOS';
    } else {
      console.log('Running on another platform');
      this.platform_is = 'OTHER';
    }
  }

  isDeviceSelected(deviceId: string): boolean {
    return this.devicesSelected.some(device => device.id === deviceId);
  }

  async toggleScan() {
    if (this.isScanning) {
      clearInterval(this.scanInterval);
      this.isScanning = false;
      this.scanDevicesError = 'Scanning stopped';
      console.log('Scanning stopped');
    } else {
      this.scanInterval = setInterval(() => {
        this.compareDevices();
        this.activateBluetooth();
        this.scanDevicesError = `Scanning started ${this.getTimestamp()}`;
      }, 10000);
      this.isScanning = true;
      console.log('Scanning started');
    }
  }

  updatedDevicesSelected: any[] = [];
  logCompareDevices: string = '';

  compareDevices() {
    this.scanForDevices().then(() => {
      this.updatedDevicesSelected = [];

      this.updatedDevicesSelected = this.devicesSelected.filter(deviceS =>
        this.devices.some(device => device.rssi === deviceS.rssi)
      );

      this.devices.forEach(device => {
        const matchingDevice = this.devicesSelected.find(deviceS => deviceS.rssi === device.rssi);

        this.logCompareDevices = '';
        this.scanDevicesError = '';

        if (!matchingDevice) {
          this.logCompareDevices = `${this.getTimestamp()} - Added device: ${device.name}`;
          this.updatedDevicesSelected.push(device);
          this.scanDevicesError = `${this.getTimestamp()} - Added device: ${device.name}`;
        } else {
          this.scanDevicesError = `${this.getTimestamp()} - Device already exists: ${device.name}`;
        }

        if (device.rssi < -70 || device.rssi < -60) {
          console.log(`${this.getTimestamp()} - Alert of proximity: ${device.name}, rssi: ${device.rssi}`);
          this.logCompareDevices = `${this.getTimestamp()} - Alert of proximity: ${device.name}, rssi: ${device.rssi}`;
          this.scanDevicesError = `${this.getTimestamp()} - Alerta de proximidade com o dispositivo ${device.name}, rssi: ${device.rssi}`;
        } else {
          console.log(`${this.getTimestamp()} - No alert of proximity: ${device.name}, rssi: ${device.rssi}`);
          this.logCompareDevices = `${this.getTimestamp()} - No alert of proximity: ${device.name}, rssi: ${device.rssi}`;
          this.scanDevicesError = `${this.getTimestamp()} - Nenhum alerta de proximidade com o dispositivo ${device.name}, rssi: ${device.rssi}`;
        }
      });

      this.devicesSelected = this.updatedDevicesSelected;
    }).catch(error => {
      console.error(`${this.getTimestamp()} - Error during scanning:`, error);
    });
  }

  selectedDiv: string = '';
  buttonsBottom: string = '';

  selectDiv(divName: string) {
    this.selectedDiv = divName;
    console.log(this.selectedDiv)
  }

  selectButtons(buttonName: string) {
    this.buttonsBottom = buttonName;
    console.log(this.buttonsBottom)
    if (this.buttonsBottom == 'Peripheral') {
      this.navCtrl.navigateForward('radar-ble');
    }
  }

  disconnected() {
    this.bluetoothSerial.disconnect();
    console.log('Dispositivo desconectado');
  }

  scanForDevices(): Promise<any> {
    return new Promise<void>((resolve, reject) => {
      if (this.platform_is == 'ANDROID' || this.platform_is == 'IOS') {
        this.devices = [];
        this.ble.scan([], 5).subscribe(
          device => {
            console.log(device);
            this.devices.push(device);
          },
          error => {
            this.scanDevicesError = 'Erro ao escanear dispositivos: ' + error;
            reject(error);
          },
          () => {
            resolve();
          }
        );
      } else {
        console.log('Simulating BLE scan');
        console.log(this.platform_is);
        this.devices = [];
        this.bleSimulationService.getDevices().subscribe(
          (simulatedDevices) => {
            this.devices = simulatedDevices;
            console.log(this.devices);
            resolve();
          },
          (error) => {
            console.error('Error getting simulated devices:', error);
            reject(error);
          }
        );
      }
    });
  }

  getTimestamp(): string {
    const now = new Date();
    return `${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;
  }

  selectDevice(device: any) {
    this.devicesSelected.push(device);
    console.log(this.devicesSelected);
  }

  connect(address: any) {
    this.bluetoothSerial.connect(address).subscribe(successs => {
      this.deviceConnected()
    }, error => {
      console.log('error')
    })
  }

  activateBluetooth() {
    this.bluetoothSerial.isEnabled().then(response => {
      this.isEnabled('IsOn');
    }).catch(error => {
      this.activateBluetoothError = 'Erro ao ativar o Bluetooth: ' + error.message;
      this.isEnabled('IsOff');
    })
  }

  async isEnabled(msg: any) {
    const alert = await this.alertContrl.create({
      header: 'Alerta',
      message: msg,
      buttons: [{
        text: 'Okay',
        handler: () => {
          console.log('Okay')
        }
      }]
    });
  }

  deviceConnected() {
    this.bluetoothSerial.subscribe('/n').subscribe(success => {
      this.handler(success)
    })
  }

  handler(value: any) {
    console.log(value)
  }

  openMenu() {
    this.menu.toggle('first');
    console.log('Menu aberto')
  }

  navigate_to_home() {
    this.navCtrl.navigateForward('home')
  }

  navHome() {
    this.navCtrl.navigateForward('home')
  }

  navRadarBLE() {
    this.navCtrl.navigateForward('radar-ble')
  }

  navEPIPage() {
    this.navCtrl.navigateForward('epi')
  }
}
