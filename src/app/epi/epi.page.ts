import { Component, OnInit } from '@angular/core';
import { BluetoothSerial } from '@awesome-cordova-plugins/bluetooth-serial/ngx';
import { BLE } from '@ionic-native/ble/ngx';
import { AlertController, MenuController, NavController } from '@ionic/angular';
// import { SpeechRecognition } from '@ionic-native/speech-recognition/ngx';


@Component({
  selector: 'app-epi',
  templateUrl: './epi.page.html',
  styleUrls: ['./epi.page.scss'],
})
export class EpiPage implements OnInit {

  devicesSelected: any[] = [];

  constructor(
    private menu : MenuController,
    private navCtrl : NavController,
    private bluetoothSerial: BluetoothSerial,
    private ble: BLE,
    private alertContrl : AlertController,
    // private speechRecognition: SpeechRecognition,
    ) 
    {
      this.selectedDiv = 'NerBy';
      this.buttonsBottom = 'Scanner';


      // setInterval(() => {
      //   this.devicesSelected.forEach(device => {
      //     this.ble.readRSSI(device.id).then(rssi => {
      //       if (rssi > -70 || rssi > -60) { // Replace SOME_VALUE with the RSSI threshold
      //         console.log("Alert");
      //         alert('Alerta de proximidade com o dispositivo ' + device.name)
      //       }
      //     }).catch(err => {
      //       console.log("Error reading RSSI: ", err);
      //     });
      //   });
      // }, 1500);
      
      // setInterval(() => {
      //   this.devicesSelected.forEach(device => {
      //     this.ble.readRSSI(device.id).then(rssi => {
      //       if (rssi > -70 || rssi > -60) { // Replace SOME_VALUE with the RSSI threshold
      //         console.log("Alert");
      //         alert('Alerta de proximidade com o dispositivo ' + device.name)
      //         this.scanDevicesError = 'Alerta de proximidade com o dispositivo ' + device.name;
      //       }
      //     }).catch(err => {
      //       console.log("Error reading RSSI: ", err);
      //       this.scanDevicesError = 'Erro ao escanear dispositivos: ' + err.message;
      //     });
      //   });
      // }, 1500);

      setInterval(() => {
        // this.scanForDevices();
        // this.activateBluetooth();
        this.devices.forEach(device => {
          this.devicesSelected.forEach(deviceS => {
            if (device.rssi != deviceS.rssi){
              this.devicesSelected.pop();
              this.devicesSelected.push(deviceS);
            } else {
              this.scanDevicesError = 'device.rssi == deviceS.rss ' + deviceS.rssi + ' == ' + device.rssi;
            }
            if (deviceS.rssi < -70 || deviceS.rssi < -60) { // Replace SOME_VALUE with the RSSI threshold
              console.log("Alert of proximity", deviceS.name);
              // alert('Alerta de proximidade com o dispositivo ' + device.name)
              this.scanDevicesError = 'Alerta de proximidade com o dispositivo ' + deviceS.name;
            } else {
              console.log("No alert of proximity", deviceS.name);
              this.scanDevicesError = 'Nenhum alerta de proximidade com o dispositivo ' + deviceS.name;
            }
        });
      })   
      }, 4500);
      
    }

  activateBluetoothError: string = '';
  scanDevicesError: string = '';
  devices: any[] = [];

  ngOnInit() {
  }

  isDeviceSelected(deviceId: string): boolean {
    return this.devicesSelected.some(device => device.id === deviceId);
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
      this.navCtrl.navigateForward('radar-ble')
    }
  }

  disconnected(){
    this.bluetoothSerial.disconnect()
    console.log('Dispositivo desconectado')
  }

  scanForDevices() {
    this.devices = [{name: 'Beacon A', id: '00:00:00:00:00:0A', rssi: '-50'}, {name: 'Beacon B', id: '00:00:00:00:00:0B', rssi: '-60'}, {name: 'Beacon C', id: '00:00:00:00:00:0C', rssi: '-70'}];
    // this.devices = []; // Limpa a lista de dispositivos antes de escanear novamente
    this.ble.scan([], 5).subscribe(device => {
      console.log(device);
      this.devices.push(device);
    });
  }

  selectDevice(device: any) 
  {
    this.devicesSelected.push(device);
    console.log(this.devicesSelected);
  }

  connect(address:any){
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

  async isEnabled(msg:any) {
    const alert = await this.alertContrl.create({
      header: 'Alerta',
      message: msg,
      buttons: [{
        text: 'Okay',
        handler: () => {
          console.log('Okay')
        }
      }]
    })
  }

  deviceConnected(){
    this.bluetoothSerial.subscribe('/n').subscribe(success =>{
      this.handler(success)
    })
  }

  handler(value:any){
    console.log(value)
  }

  openMenu() {
    this.menu.toggle('first');
    console.log('Menu aberto')
  }

  navigate_to_home(){
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
