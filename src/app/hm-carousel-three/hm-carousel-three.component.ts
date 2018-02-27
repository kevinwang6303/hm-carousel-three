import 'rxjs/add/observable/fromEvent';
import 'rxjs/add/observable/interval';
import 'rxjs/add/operator/bufferCount';
import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/merge';
import 'rxjs/add/operator/switchMap';
import 'rxjs/add/operator/takeUntil';

import {
  AfterContentInit,
  AfterViewInit,
  Component,
  ContentChild,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnDestroy,
  Output,
  Renderer2,
  TemplateRef,
  ViewChild,
  ViewEncapsulation,
  PLATFORM_ID,
  Inject,
} from '@angular/core';
import { ContentChildren } from '@angular/core';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import { Subscription } from 'rxjs/Subscription';

import { CarouselItemDirective } from './carousel-item.directive';
import { isPlatformBrowser } from '@angular/common';


// if the pane is paned .25, switch to the next pane.
const PANBOUNDARY = 0.15;

export enum RUN_DIRECTION {
  LEFT = 'left',
  RIGHT = 'right'
}

@Component({
  selector: 'hm-carousel-three',
  templateUrl: './hm-carousel-three.component.html',
  styleUrls: ['./hm-carousel-three.component.css']
})
export class HmCarouselThreeComponent implements AfterViewInit, AfterContentInit, OnDestroy {
  @ViewChild('parentChild') parentChild;
  @ViewChild('prev') private btnPrev: ElementRef;
  @ViewChild('next') private btnNext: ElementRef;
  @ContentChildren(CarouselItemDirective) items: CarouselItemDirective[];
  @ContentChild('carouselPrev') contentPrev: TemplateRef<any>;
  @ContentChild('carouselNext') contentNext: TemplateRef<any>;
  @ContentChild('carouselDot') dotElm: TemplateRef<any>;
  @ContentChild('carouselProgress') progressElm: TemplateRef<any>;

  @Input('infinite') infinite = false;
  @Input('mourse-enable') mourseEnable = false;
  @Input('autoplay-speed') speed = 5000;
  @Input('between-delay') delay = 8000;
  @Input('autoplay-direction') direction: RUN_DIRECTION = RUN_DIRECTION.RIGHT;
  private _showNum = 1;
  private isAutoNum = false;
  @Input('show-num')
  set showNum(value: number | 'auto') {
    if (value === 'auto') {
      this.isAutoNum = true;
      this._showNum = this.getWindowWidthToNum();
    } else {
      this._showNum = value;
    }
  }
  @Input('scroll-num') scrollNum = 1;
  @Input('drag-many') isDragMany = false;
  private _viewIndex = 0;
  @Input('current-index')
  set currentIndex(value) {
    this._viewIndex = value;
    if (this.itemsElm) {
      this.drawView(this._viewIndex);
    }
  }
  get currentIndex() {
    return this._viewIndex;
  }
  private _autoplay = false;
  @Input('autoplay')
  set autoplay(value) {
    if (this.itemsElm) {
      this.progressWidth = 0;
      if (value) {
        this.sub$ = this.doNext.subscribe();
      } else {
        if (this.sub$) {
          this.sub$.unsubscribe();
        }
      }
    }
    this._autoplay = value;
  }
  get autoplay() {
    return this._autoplay;
  }

  @Output('index-change') indexChanged = new EventEmitter();
  private _porgressWidth = 0;
  set progressWidth(value) {
    if (this.progressElm !== undefined && this.autoplay) {
      this._porgressWidth = value;
    }
  }
  get progressWidth() {
    return this._porgressWidth;
  }

  private rootElm: HTMLAnchorElement;
  private containerElm: HTMLAnchorElement;
  private itemsElm: Array<HTMLAnchorElement>;
  private hammer: HammerManager;
  private elmWidth = 0;

  private isInContainer = false;
  private restart = new BehaviorSubject<any>(null);
  private stopEvent = new Subject<any>();

  private mostRightIndex = 0;

  private doNext: Observable<any>;
  private sub$: Subscription;

  private prePanMove: boolean;
  public dots: Array<number>;
  private nextListener: () => void;
  private prevListener: () => void;


  // 自己指定的寬度
  @Input('custom-width') customWidth = 0;
  // 因為大於指定寬度的話左右縮減，左邊要推到中間
  private pushLeft = 0;
  // 主要顯示的class
  @Input('main-class') mainClass;
  // 其他顯示的class
  @Input('other-class') otherClass;
  // 右邊的樣式
  @Input('right-item') rightItem;
  // 左邊的樣式
  @Input('left-item') leftItem;

  @HostListener('window:resize', ['$event'])
  private onResize(event) {
    this.setViewWidth();
    this.drawView(this.currentIndex);
  }

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private _renderer: Renderer2) { }

  ngAfterContentInit(): void {
    this.initVariable();
    // console.log(this.progressElm);
  }

  ngAfterViewInit() {
    this.setViewWidth(true);
    if (isPlatformBrowser(this.platformId)) {
      this.hammer = this.bindHammer();
    }
    this.drawView(this.currentIndex);
    this.bindClick();
  }

  ngOnDestroy() {
    if (this.btnNext && this.btnPrev) {
      this.nextListener();
      this.prevListener();
    }
    if (isPlatformBrowser(this.platformId)) {
      this.hammer.destroy();
    }
    if (this.autoplay) {
      this.sub$.unsubscribe();
    }
  }

  private initVariable() {
    this.rootElm = this.parentChild.nativeElement;
    this.containerElm = this.rootElm.children[0] as HTMLAnchorElement;
    this.itemsElm = Array.from(this.containerElm.children) as HTMLAnchorElement[];

    this.mostRightIndex = this.itemsElm.length - this._showNum;
    if (this.dotElm) {
      this.dots = new Array(this.itemsElm.length - (this._showNum - 1)).map((x, i) => i);
    }

    let startEvent: any = this.restart; // .merge(this.mourseLeave); // .map(() => console.log('start'))
    let stopEvent: any = this.stopEvent;
    if (this.mourseEnable) {
      const mourseOver = Observable.fromEvent(this.containerElm, 'mouseover')
        .map(() => {
          this.isInContainer = true;
          // console.log('over');
        });
      const mourseLeave = Observable.fromEvent(this.containerElm, 'mouseleave')
        .map(() => {
          this.isInContainer = false;
          // console.log('levae');
        });
      startEvent = startEvent.merge(mourseLeave);
      stopEvent = stopEvent.merge(mourseOver);
    }
    // const debounceTime = this.delay < this.speed ? this.delay : this.delay - this.speed;
    this.doNext = startEvent
      .debounceTime(this.delay)
      .switchMap(() =>
        this.runProgress(20)
          .do(() => {
            // console.log('next');
            if (this.direction === RUN_DIRECTION.LEFT) {
              this.currentIndex -= this.scrollNum;
            } else {
              this.currentIndex += this.scrollNum;
            }
          })
          .takeUntil(stopEvent.map(() => {
            // console.log('stop');
            this.progressWidth = 0;
          }))
      );

    if (this.autoplay) {
      this.sub$ = this.doNext.subscribe();
    }
  }

  private setViewWidth(isInit?: boolean) {
    if (this.isAutoNum) {
      this._showNum = this.getWindowWidthToNum();
      this.mostRightIndex = this.itemsElm.length - this._showNum;
      if (this.dotElm) {
        this.dots = new Array(this.itemsElm.length - (this._showNum - 1)).map((x, i) => i);
      }
    }
    this._renderer.addClass(this.containerElm, 'grab');
    // when init check view has scroll bar
    const totalWidth = 0;
    if (isInit) {
      // remain one elm height
      this._renderer.addClass(this.containerElm, 'hm-carousel-display-npwrap');
    }

    // 如果父寬度跟有設定寬度的話才會指定
    if (this.customWidth && this.customWidth < this.rootElm.clientWidth) {
      this.elmWidth = this.customWidth;
    } else {
      this.elmWidth = (totalWidth + this.rootElm.clientWidth) / this._showNum;
    }

    this._renderer.removeClass(this.containerElm, 'hm-carousel-display-npwrap');
    this._renderer.setStyle(this.containerElm, 'width', `${this.elmWidth * this.itemsElm.length}px`);
    this._renderer.setStyle(this.containerElm, 'position', 'relative');
    this.itemsElm.forEach((elm: HTMLAnchorElement, index) => {
      this._renderer.setStyle(elm, 'width', `${this.elmWidth}px`);

      // 這邊比較不活，需求是要16:9，可擴充成傳進來的
      if (this.customWidth) {
        this._renderer.setStyle(elm, 'height', `${this.elmWidth * 9 / 16}px`);
      }
    });
  }

  private bindHammer() {
    const hm = new Hammer(this.containerElm);
    hm.get('pan').set({ direction: Hammer.DIRECTION_HORIZONTAL });

    hm.on('panleft panright panend pancancel tap', (e: HammerInput) => {
      this._renderer.removeClass(this.containerElm, 'transition');
      this._renderer.addClass(this.containerElm, 'grabbing');
      if (this.autoplay) {
        this.stopEvent.next();
      }
      switch (e.type) {
        case 'tap':
          this.callClick(e.center.x);
          this.callRestart();
          this._renderer.removeClass(this.containerElm, 'grabbing');
          break;
        case 'panend':
        case 'pancancel':
          this._renderer.removeClass(this.containerElm, 'grabbing');
        // tslint:disable-next-line:no-switch-case-fall-through
        case 'panleft':
        case 'panright':
          this.handlePan(e);
          break;
      }
    });

    return hm;
  }

  private bindClick() {
    if (this.btnNext && this.btnPrev) {
      this.nextListener = this._renderer.listen(this.btnNext.nativeElement, 'click', () => {
        this.setIndex(this.currentIndex + 1);
      });
      this.prevListener = this._renderer.listen(this.btnPrev.nativeElement, 'click', () => {
        this.setIndex(this.currentIndex - 1);
      });
    }
  }

  private callRestart() {
    if (this.autoplay && !this.isInContainer) {
      this.restart.next(null);
    }
  }

  private callClick(positionX) {
    const toIndex = this.currentIndex + Math.floor(positionX / this.elmWidth);
    Array.from(this.items)[toIndex].clickEvent.emit(toIndex);
  }

  private drawView(index: number) {
    this._renderer.addClass(this.containerElm, 'transition');
    if (this.autoplay || this.infinite) {
      this.playCycle(index);
    } else {
      this._viewIndex = Math.max(0, Math.min(index, this.mostRightIndex));
    }

    // 把要推的寬度設定，拖拉也會用到
    let leftValue = -this.currentIndex * this.elmWidth;
    if (this.customWidth < this.rootElm.clientWidth) {
      this.pushLeft = (this.rootElm.clientWidth - this.customWidth) / 2;
      leftValue += this.pushLeft;
    }
    this._renderer.setStyle(this.containerElm, 'left', `${leftValue}px`);

    // resize init會觸發，把主要跟旁邊的設定css
    if (this.customWidth) {
      this.itemsElm.forEach((elm: HTMLAnchorElement, itemIndex) => {
        // 要全部清掉，不然會重複
        this._renderer.removeClass(elm, this.mainClass);
        this._renderer.removeClass(elm, this.otherClass);
        this._renderer.removeClass(elm, this.rightItem);
        this._renderer.removeClass(elm, this.leftItem);
        if (itemIndex === this.currentIndex) {
          this._renderer.addClass(elm, this.mainClass);
        } else {
          this._renderer.addClass(elm, this.otherClass);
        }
      });

      // 如果只要一個的話就不用設定
      if (this.itemsElm.length > 1) {
        // 第一個只要設定右邊
        if (this.currentIndex === 0) {
          this._renderer.addClass(this.itemsElm[this.currentIndex + 1], this.rightItem);
          // 最後一個只要設定左邊
        } else if (this.currentIndex === this.mostRightIndex) {
          this._renderer.addClass(this.itemsElm[this.currentIndex - 1], this.leftItem);
        } else {
          this._renderer.addClass(this.itemsElm[this.currentIndex + 1], this.rightItem);
          this._renderer.addClass(this.itemsElm[this.currentIndex - 1], this.leftItem);
        }
      }
    }
    this.indexChanged.emit(this.currentIndex);
  }

  private playCycle(index: any) {
    switch (this.direction) {
      case RUN_DIRECTION.LEFT:
        if (index === -this.scrollNum) {
          this._viewIndex = this.mostRightIndex;
        } else if (index > this.mostRightIndex || index < 0) {
          this._viewIndex = 0;
        }
        break;
      case RUN_DIRECTION.RIGHT:
        if (index === this.mostRightIndex + this.scrollNum) {
          this._viewIndex = 0;
        } else if (index < 0 || this._viewIndex >= this.mostRightIndex) {
          this._viewIndex = this.mostRightIndex;
        }
        break;
    }
  }

  private handlePan(e: HammerInput) {
    // console.log(e.deltaX / this.elmWidth);
    // console.log(moveNum);
    switch (e.type) {
      case 'panleft':
      case 'panright':
        // Slow down at the first and last pane.
        if (this.outOfBound(e.type) && (!this.infinite)) {
          e.deltaX *= 0.5;
        }

        // 拖起來的時候也要推，不然會瞬間少推的部分
        let leftValue = -this.currentIndex * this.elmWidth + e.deltaX;
        if (this.customWidth < this.rootElm.clientWidth) {
          leftValue += this.pushLeft;
        }
        this._renderer.setStyle(this.containerElm, 'left', `${leftValue}px`);

        this.prePanMove = false;
        if (!this.isDragMany) {
          if (Math.abs(e.deltaX) > this.elmWidth * 0.5) {
            if (e.deltaX > 0) {
              this.currentIndex -= this.scrollNum;
            } else {
              this.currentIndex += this.scrollNum;
            }
            this._renderer.removeClass(this.containerElm, 'grabbing');
            this.callRestart();
            this.hammer.stop(true);
            // remember prv action, to avoid hammer stop, then click
            this.prePanMove = true;
          }
        }
        break;
      case 'panend':
      case 'pancancel':
        this.callRestart();

        if (Math.abs(e.deltaX) > this.elmWidth * PANBOUNDARY) {
          const moveNum = this.isDragMany ?
            Math.ceil(Math.abs(e.deltaX) / this.elmWidth) : this.scrollNum;
          if (e.deltaX > 0) {
            this.currentIndex -= moveNum;
          } else {
            this.currentIndex += moveNum;
          }
          break;
        } else {
          if (!this.isDragMany && this.prePanMove) {
            this.callClick(e.center.x);
          }
        }
        this.drawView(this.currentIndex);
        this.prePanMove = false;
        break;
    }
  }

  setIndex(index: number) {
    if (this.autoplay) {
      this.stopEvent.next();
      this.restart.next('do restart');
    }
    this.currentIndex = index;
  }

  private outOfBound(type) {
    switch (type) {
      case 'panleft':
        return this.currentIndex === this.mostRightIndex;
      case 'panright':
        return this.currentIndex === 0;
    }
  }

  private runProgress(betweenTime): Observable<any> {
    const howTimes = this.speed / betweenTime;
    const everyIncrease = 100 / this.speed * betweenTime;
    // console.log('progress');
    return Observable.interval(betweenTime)
      .map(t => {
        // console.log(t % howTimes);
        // const persent = ;
        this.progressWidth = (t % howTimes) * everyIncrease;
      })
      .bufferCount(Math.round(this.speed / betweenTime), 0);
  }
  private getWindowWidthToNum() {
    const initNum = 3;
    // 610
    // if use window do check to avoid ssr problem.
    if (window) {
      const windowWidth = window.innerWidth;
      if (windowWidth > 300) {
        return Math.floor(initNum + (windowWidth / 200));
      }
    }
    return initNum;
  }

}
