import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HmCarouselThreeComponent } from './hm-carousel-three.component';

describe('HmCarouselThreeComponent', () => {
  let component: HmCarouselThreeComponent;
  let fixture: ComponentFixture<HmCarouselThreeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HmCarouselThreeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HmCarouselThreeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
