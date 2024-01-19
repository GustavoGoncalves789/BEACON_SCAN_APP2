import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { EpiPageRoutingModule } from './epi-routing.module';

import { EpiPage } from './epi.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    EpiPageRoutingModule
  ],
  declarations: [EpiPage]
})
export class EpiPageModule {}
