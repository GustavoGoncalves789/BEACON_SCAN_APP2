import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { EpiPage } from './epi.page';

const routes: Routes = [
  {
    path: '',
    component: EpiPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class EpiPageRoutingModule {}
