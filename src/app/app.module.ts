import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';


import { AppComponent } from './app.component';
import { HmCarouselThreeModule } from './hm-carousel-three/hm-carousel-three.module';


@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    HmCarouselThreeModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
