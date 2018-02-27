import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HmCarouselThreeComponent } from './hm-carousel-three.component';
import { SafePipe } from './pipe/safe.pipe';
import { CarouselItemDirective } from './carousel-item.directive';
import 'hammerjs';
@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [
    HmCarouselThreeComponent,
    CarouselItemDirective,
    SafePipe
  ],
  exports: [
    HmCarouselThreeComponent,
    CarouselItemDirective,
    SafePipe
  ]
})
export class HmCarouselThreeModule { }
