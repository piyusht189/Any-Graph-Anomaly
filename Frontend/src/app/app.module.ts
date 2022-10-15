import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ArenaComponent } from './components/arena/arena.component';
import { DataTransformationServicesService } from './services/data-transformation-services.service';
import { PipelineServicesService } from './services/pipeline-services.service';
import { RestServicesService } from './services/rest-services.service';
import { UtilServicesService } from './services/util-services.service';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { LeafletModule } from '@asymmetrik/ngx-leaflet';
import { SelectDropDownModule } from 'ngx-select-dropdown'
import { NodeAnomalyServices } from './services/node-anomaly-services.service';
import { EdgeAnomalyServices } from './services/edge-anomaly-services.service';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { LayerServicesServices } from './services/layer-services.services'
import {NgxLeafletFullscreenModule} from '@runette/ngx-leaflet-fullscreen'


@NgModule({
  declarations: [
    AppComponent,
    ArenaComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    LeafletModule,
    SelectDropDownModule,
    NgbModule,
    NgxLeafletFullscreenModule
  ],
  providers: [DataTransformationServicesService, 
              PipelineServicesService, 
              RestServicesService, 
              UtilServicesService, 
              NodeAnomalyServices, 
              EdgeAnomalyServices,
              LayerServicesServices],
  bootstrap: [AppComponent]
})
export class AppModule { }
