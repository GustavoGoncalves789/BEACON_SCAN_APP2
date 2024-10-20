import { Component, NgZone, OnInit, ViewChild, ElementRef, AfterViewInit, ViewChildren, TemplateRef, numberAttribute } from '@angular/core';
import { IonInput, NavController } from '@ionic/angular';

import { BluetoothSerial } from '@awesome-cordova-plugins/bluetooth-serial/ngx';
import { AlertController } from '@ionic/angular';
//import { error } from 'console';
import { BLE } from '@ionic-native/ble/ngx';
import { BluetoothLE, InitParams, Device, ScanStatus } from '@awesome-cordova-plugins/bluetooth-le/ngx';
import { Geolocation } from '@capacitor/geolocation';
import { filter, identity } from 'rxjs';
import { SensorService } from '../sensor.service';
import { DeviceMotion, DeviceMotionAccelerationData } from '@ionic-native/device-motion/ngx';
//import { Gyroscope } from 'ionic-native';
import { Gyroscope, GyroscopeOrientation, GyroscopeOptions } from '@ionic-native/gyroscope/ngx';




@Component({
  selector: 'app-radar-ble',
  templateUrl: './radar-ble.page.html',
  styleUrls: ['./radar-ble.page.scss'],
})

export class RadarBlePage {

  activateBluetoothError: string = '';
  scanDevicesError: string = '';
  devices: any[] = [];
  devices_filter: any[] = [];
  rssiValue: number = 0; // Inicializa com um valor padrão
  selectedDevice: any = null; // Inicialmente nulo
  //deviceIds: string[]=[];
  deviceIds: any[] = []; //this.devices.map(device => device.id);
  //arrowRotation: number = 0; // Defina um valor inicial adequado
  //arrowRotation = '0deg';
  accelerationX!: number;
  accelerationY!: number;
  accelerationZ!: number;
  latitude_coords!: any;
  longitude_coords!: any;
  arrowRotation!: number; // Initialize with an initial rotation angle
  cordinates_gyroscopy!: any;

  advertisingDataParsed: any;
  device_advertising: any;


  constructor(
    private navCtrl : NavController,
    private bluetoothSerial: BluetoothSerial,
    private alertContrl : AlertController,
    //private bluetoothLE : BluetoothLE,
    private ble: BLE,
    private geolocation: Geolocation,
    private sensorService: SensorService,
    private deviceMotion: DeviceMotion,
    private gyroscope: Gyroscope
    ) { //this.startGyroscope();
      //this.sensorService.startGyroscope((orientation: any) => {
        // Atualize a rotação da seta com base na orientação do giroscópio
      //  this.arrowRotation = `${orientation.z}deg`;
      //});

      

      this.deviceMotion.getCurrentAcceleration().then(
        (acceleration: DeviceMotionAccelerationData) => {
          console.log('Acceleration X: ' + acceleration.x);
          console.log('Acceleration Y: ' + acceleration.y);
          console.log('Acceleration Z: ' + acceleration.z);
        },
        (error) => {
          console.log('Erro ao obter dados de aceleração: ' + error);
        });

        
    }


    
    startGyroscope() {
      const options: GyroscopeOptions = {
        frequency: 1000, // Update every 1 second (adjust as needed)
      };
  
      const subscription = this.gyroscope.watch(options).subscribe(
        (orientation: GyroscopeOrientation) => {
          this.cordinates_gyroscopy = orientation
          console.log('Gyroscope orientation:', orientation);
          // Use the gyroscope data as needed
        },
        (error) => {
          this.cordinates_gyroscopy = error
          console.error('Gyroscope error:', error);
        }
      );
  
      // To stop the gyroscope subscription when you're done:
      // subscription.unsubscribe();
    }
    

    printCurrentPosition = async () => {
      try {
        const coordinates = await Geolocation.getCurrentPosition();
        this.latitude_coords = coordinates.coords.latitude;
        this.longitude_coords = coordinates.coords.longitude;
        console.log('Latitude: ' + this.latitude_coords);
        console.log('Longitude: ' + this.longitude_coords);
    
        // Listen to the deviceorientation event to get the compass heading
        window.addEventListener('deviceorientation', (event) => {
          const heading = event.alpha; // Extract the compass heading from the event
          
          console.log(heading)
    
          if (heading !== null) {
            // Calculate the rotation angle based on the heading
            this.arrowRotation = 360 - heading; // Adjust as needed
          }
        });
      } catch (error: any) {
        console.error('Error ao mostrar as coordenadas: ' + error.message);
      }
    };
    
    updateArrowDirection = (heading: number) => {
      console.log("Entrou na Função UpdateArrowDirection")
      // Inside your component class
      

      // Inside the deviceorientation event listener
      window.addEventListener('deviceorientation', (event) => {
        const heading = event.alpha; // Extract the compass heading from the event 

        if (heading !== null) {
          // Calculate the rotation angle based on the heading
          this.arrowRotation = 360 - heading; // Adjust as needed
        }
      })};
    

    iniciarMonitoramento() {
      const subscription = this.deviceMotion.watchAcceleration().subscribe(
        (acceleration: DeviceMotionAccelerationData) => {
          this.accelerationX = acceleration.x;
          this.accelerationY = acceleration.y;
          this.accelerationZ = acceleration.z;
        },
        (error) => {
          console.log('Erro ao monitorar aceleração: ' + error);
        }
      );
  
      // Para cancelar a inscrição quando não for mais necessária
      subscription.unsubscribe();
    }
    

    async addDevice() {
      const alert = await this.alertContrl.create({
        header: 'Selecione um Dispositivo',
        inputs: this.devices.map(device => ({
          type: 'radio',
          label: device.id,
          value: device,
        })),
        buttons: [
          {
            text: 'Cancelar',
            role: 'cancel',
          },
          {
            text: 'Adicionar',
            handler: (selectedDevice:any) => {
              if (selectedDevice) {
                
                this.devices_filter.push(selectedDevice.id)
  
              
              }
            },
          },
        ],
      });
  
      await alert.present();
    }
  
    
    
    @ViewChild('mylbl', { read: ElementRef }) mylbl!: ElementRef;

    @ViewChild('newContainer', { read: ElementRef }) newContainer!: ElementRef;

    @ViewChild('newItem', { static: true }) newItem!: TemplateRef<any>;

    @ViewChild('itemValor', { read: ElementRef }) itemValor!: TemplateRef<any>;

    // @ViewChild('itemValor') itemValor!: IonInput;


    crate_mac_input() {
      
      const newItem = this.newItem.createEmbeddedView(null).rootNodes[0];
      newItem.querySelector('ion-input').value = '';
      
      this.newContainer.nativeElement.appendChild(newItem);
      //Teste position:
      this.devices.push({name: 'myPos', id: '00.00.00.00.00.0F', rssi: 0 })

      //Teste dispositivo 2
      //this.devices.push({name: 'Device', id: '00.00.00.00.00.2F', rssi: -90 })
      console.log(this.devices)
    }

    logMacValidate: any[] = [];

    mac_validate(itemValor: any) {
      // ItemValor is coming True (tested)
    
      const macAddressRegex =  /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;

      console.log("antes do if")

      // console.log(this.devices)
      if (macAddressRegex.test(itemValor) ) {
        console.log("Valid MAC address");
        const foundItem = this.devices.find(mac => mac.id === itemValor); //variavel que armazena o item achado
        console.log(foundItem)

          if (foundItem) {
    
            // Adiciona a nova label ao container
              
            const newItem = this.newItem.createEmbeddedView(null).rootNodes[0];
            newItem.querySelector('ion-input').value = '';
          
            this.newContainer.nativeElement.appendChild(newItem);

            
            this.devices_filter.push(itemValor);
            // console.log(this.devices_filter)


          } else {
            console.log("MAC não é valido e não existe no array");
            this.logMacValidate.push("MAC não é valido e não existe no array");
            this.logMacValidate.push(foundItem);
          }
        } else {
          console.log("MAC não é valido");
        }
      }

      filterDevices() {
        if (this.selectedDevice) {
          //this.deviceIds.push(this.devices.map(device => device.id))
          const device_filter = this.devices.filter(device => device.id === this.selectedDevice);
           // Adiciona a nova label ao container
              
           const newItem = this.newItem.createEmbeddedView(null).rootNodes[0];
           newItem.querySelector('ion-input').value = '';
         
           this.newContainer.nativeElement.appendChild(newItem);

           this.devices_filter.push(device_filter);
            console.log(this.devices_filter)
          

        } else {
          this.devices_filter = this.devices.slice(); // Se nenhum dispositivo for selecionado, copie todos os dispositivos para a lista filtrada.
        }
      }

      getDevicePosition(rssi: number, device_mac: any): string {
        const center = 150; // Posição central do círculo
        const maxDistance = 100; // Distância máxima do centro
      
        if (rssi === 0) {
          return `translate(${center}px, ${center}px)`;
        }
      
        // Calcule a distância em relação ao centro com base no valor absoluto do RSSI
        const distance = (Math.abs(rssi) / 100) * maxDistance;
      
        // Calcule o ângulo com base no RSSI
        const angle = (rssi > 0 ? 1 : -1) * Math.acos(distance / maxDistance) * (180 / Math.PI);
      
        const x = center + distance * Math.cos((angle * Math.PI) / 180);
        const y = center + distance * Math.sin((angle * Math.PI) / 180);
        return `translate(${x}px, ${y}px)`;
      }

  // Função para simular a detecção de dispositivos BLE próximos
  simulateScan() {
    this.devices = [
      { name: 'Device 1', rssi: -90 },
      { name: 'Device 2', rssi: -70 },
      // Adicione mais dispositivos com nomes e RSSI simulados
    ];
  }
  
    activateBluetooth() {
      //this.deviceIds.push({name: 'Device1',id: '0A.00.27.00.00.08', rssi: -52})
      //this.deviceIds.push({name: 'Device2', id: '0A.00.27.00.00.02', rssi: -32})
      console.log(this.deviceIds)
      this.bluetoothSerial.isEnabled().then(response => {
        this.isEnabled('IsOn');
      }).catch(error => {
        this.activateBluetoothError = 'Erro ao ativar o Bluetooth: ' + error.message;
        this.isEnabled('IsOff');
      })
    }

  connect(address:any){
    this.bluetoothSerial.connect(address).subscribe(successs => {
      this.deviceConnected()
    }, error => {
      console.log('error')
    })
  }

  setData(){
    this.bluetoothSerial.write("7").then(response => {
      console.log("Okay")
    }, error => {
      console.log('error')
    })
  }

  disconnected(){
    this.bluetoothSerial.disconnect()
    console.log('Dispositivo desconectado')
  }

  logFilter: any[] = [];

  scanForDevices() {
    this.devices = []; // Limpa a lista de dispositivos antes de escanear novamente
    if (this.devices_filter.length >= 1){
      this.ble.scan([], 5).subscribe(device => {
        this.logFilter.push("Antes do If ");
        if (this.devices_filter.includes(device.id))
        {
          this.logFilter.push("Depois do If (if (this.devices_filter.includes(device.id))) ");

          // Filter the devices based on the IDs in the deviceIds array
          let batteryPorcentage = this.batteryPorcentage_adv(device.advertising);
          let x_axis = this.getAdvertasing_X_axis(device.advertising);
          let y_axis = this.getAdvertasing_Y_axis(device.advertising);
          let z_axis = this.getAdvertasing_Z_axis(device.advertising);
          let MacAddress = this.getAdvertisingMacAddress(device.advertising);
          const convertedDevice = {
            name: device.name,
            id: device.id,
            rssi: device.rssi,
  
            // advertisingData: convertedData,
            // advertisingDataDecimal: convertedData , //JSON.stringify(convertedData, null, 2)
            // advertasingDataHex: arrayToHex,
            batteryPercentage: batteryPorcentage.batteryVoltage + "mV",
            x_axis: x_axis.X_Axis,
            y_axis: y_axis.Y_Axis,
            z_axis: z_axis.Z_Axis,
            MacAddress : MacAddress.MacAddress,
            // comma_count: comma_count,
            // advertisingDataParsed: dataNumbersParse,
  
          };
          this.devices.push(convertedDevice);
        }
        else {
          this.logFilter.push("Filter not found")
        }
      });
    } else {
      this.ble.scan([], 5).subscribe(device => {
        // console.log(device);

        // const convertedData = this.convertAdvertisingData(device.advertising);
        // const arrayToHex = this.convertAdvertisingDataHex(device.advertising);
        
        let batteryPorcentage = this.batteryPorcentage_adv(device.advertising);
        let x_axis = this.getAdvertasing_X_axis(device.advertising);
        let y_axis = this.getAdvertasing_Y_axis(device.advertising);
        let z_axis = this.getAdvertasing_Z_axis(device.advertising);
        let MacAddress = this.getAdvertisingMacAddress(device.advertising);

        // let comma_count = (String(convertedData).match(/ /g) || []).length;
        // const dataNumbersParse = this.advertisingDataParsed
        const convertedDevice = {
          name: device.name,
          id: device.id,
          rssi: device.rssi,

          // advertisingData: convertedData,
          // advertisingDataDecimal: convertedData , //JSON.stringify(convertedData, null, 2)
          // advertasingDataHex: arrayToHex,
          batteryPercentage: batteryPorcentage.batteryVoltage + "mV",
          x_axis: x_axis.X_Axis,
          y_axis: y_axis.Y_Axis,
          z_axis: z_axis.Z_Axis,
          MacAddress : MacAddress.MacAddress,
          // comma_count: comma_count,
          // advertisingDataParsed: dataNumbersParse,

        };
        this.devices.push(convertedDevice);
        console.log("else scanForDevices()")
        //this.updateDeviceIds(); // Atualiza a lista de IDs após adicionar um dispositivo
      });
    } 
  }

  getAdvertasing_X_axis(data: ArrayBuffer): { X_Axis: number }{

    const dataView = new DataView(data);

    // Extract X axis values from positions 16 and 17
    let X_Axis = (dataView.getUint8(16) * 256) + dataView.getUint8(17);


    if (X_Axis > 32767) // X axis not coming negative number (max-number is 65536)
    {
      X_Axis = X_Axis - 65536;
    }

    // scale the data down to m/s2
	  X_Axis = parseFloat((X_Axis / 100).toFixed(2));

    return { X_Axis: X_Axis };

  }
  getAdvertasing_Y_axis(data: ArrayBuffer): { Y_Axis: number }{

    const dataView = new DataView(data);

    // Extract X axis values from positions 18 and 19
    let Y_Axis = (dataView.getUint8(18) * 256) + dataView.getUint8(19);

    if (Y_Axis > 32767) // Y axis not coming negative number (max-number is 65536)
    {
      Y_Axis = Y_Axis - 65536;
    }

    // scale the data down to m/s2
	  Y_Axis = parseFloat((Y_Axis / 100).toFixed(2));

    return { Y_Axis: Y_Axis };

  }
  getAdvertasing_Z_axis(data: ArrayBuffer): { Z_Axis: number }{

    const dataView = new DataView(data);

    // Extract Z axis values from positions 20 and 21
    let Z_Axis = (dataView.getUint8(20) * 256) + dataView.getUint8(21);

    if (Z_Axis > 32767) // Z axis not coming negative number (max-number is 65536)
    {
      Z_Axis = Z_Axis - 65536;
    }

    // scale the data down to m/s2
	  Z_Axis = parseFloat((Z_Axis / 100).toFixed(2));

    return { Z_Axis: Z_Axis };

  }

  getAdvertisingMacAddress(data: ArrayBuffer): { MacAddress: string } {
    const dataView = new DataView(data);

    // Check if the advertising data has the necessary length
    if (data.byteLength < 30) {
        throw new Error('Invalid advertising data length');
    }

    // Extract the MAC address bytes from positions 25-30
    const macAddressBytes = new Uint8Array(data.slice(25, 31));

    // Convert the MAC address bytes to a hexadecimal string
    const macAddressHex = Array.from(macAddressBytes)
        .map(byte => byte.toString(16).padStart(2, '0'))
        .join(':');

    return { MacAddress: macAddressHex };
}


  batteryPorcentage_adv(data: ArrayBuffer): { batteryVoltage: number } {
    const dataView = new DataView(data);

    // Extract battery voltage values from positions 22 and 23
    const batteryValue = (dataView.getUint8(22) * 256) + dataView.getUint8(23);

    // Convert millivolts to volts
    const batteryVoltage = batteryValue / 1000;

    return { batteryVoltage };
  } 

  convertAdvertisingDataHex(data: ArrayBuffer): string {
    const dataView = new DataView(data);

    // Convert to Uint8Array and map each byte to a two-digit hexadecimal representation
    const hexArray = Array.from(new Uint8Array(dataView.buffer))
        .map(byte => byte.toString(16).padStart(2, '0'));

    // Join the hexadecimal values with spaces
    const hexString = hexArray.join(' ');

    // Store the result in device_advertising (optional)
    let hex = hexString;

    return hex;
}


  convertAdvertisingData(data: ArrayBuffer){
    const dataView = new DataView(data);
    this.device_advertising = Array.from(new Uint8Array(dataView.buffer)).toString();

    this.device_advertising = this.device_advertising.join(' ');
    // this.parseAdvertisingData(this.device_advertising);
    return Array.from(new Uint8Array(dataView.buffer));
  }

  // convertAdvertisingData(data: ArrayBuffer): string {
  //   const dataView = new DataView(data);
  //   this.device_advertising = Array.from(new Uint8Array(dataView.buffer)).toString();
  //   // this.parseAdvertisingData(this.device_advertising);
  //   return Array.from(new Uint8Array(dataView.buffer)).toString();
  // }
  
  // parseAdvertisingData(dataString: string): number[] {
  //   const dataNumbers = dataString.split(',').map(Number);
  //   this.advertisingDataParsed = dataNumbers;
  //   return this.advertisingDataParsed;
  // }

  deviceConnected(){
    this.bluetoothSerial.subscribe('/n').subscribe(success =>{
      this.handler(success)
    })
  }

  handler(value:any){
    console.log(value)
  }

  listDevices(){
    this.bluetoothSerial.list().then(response=>{
      this.devices=response
    }, error => {
      console.log('error')
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

  navigate_to_home(){
    this.navCtrl.navigateForward('home')
  }

  navBluetoothHome() {
    this.navCtrl.navigateForward('tabs')
  }

  navRadarBLE() {
    this.navCtrl.navigateForward('radar-ble')
    
  }

  
}
