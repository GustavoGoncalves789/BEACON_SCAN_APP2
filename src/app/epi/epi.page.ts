import { Component, OnInit } from '@angular/core';
import { BluetoothSerial } from '@awesome-cordova-plugins/bluetooth-serial/ngx';
import { BLE } from '@ionic-native/ble/ngx';
import { AlertController, MenuController, NavController } from '@ionic/angular';

@Component({
  selector: 'app-epi',
  templateUrl: './epi.page.html',
  styleUrls: ['./epi.page.scss'],
})
export class EpiPage implements OnInit {


  constructor(
    private menu : MenuController,
    private navCtrl : NavController,
    private bluetoothSerial: BluetoothSerial,
    private ble: BLE,
    private alertContrl : AlertController,
    ) 
    {
      this.selectedDiv = 'NerBy';
      this.buttonsBottom = 'Scanner';
    }

  activateBluetoothError: string = '';
  scanDevicesError: string = '';
  devices: any[] = [];

  ngOnInit() {
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
    this.devices = []; // Limpa a lista de dispositivos antes de escanear novamente
    this.ble.scan([], 5).subscribe(device => {
      console.log(device);
      this.devices.push(device);
    });
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
