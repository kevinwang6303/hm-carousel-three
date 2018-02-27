import { Component } from '@angular/core';
import { GalleryItem, GALLERY_TYPE } from './hm-carousel-three/model/gallery-item';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'app';
  avatars: GalleryItem[] = [
    {
      name: 'jenny',
      type: GALLERY_TYPE.IMG,
      url: 'assets/images/01.jpg',
      defaultUrl: 'assets/images/01.jpg',
      isDownload: true
    },
    {
      name: 'kristy',
      type: GALLERY_TYPE.IMG,
      url: 'assets/images/03.jpg',
      defaultUrl: 'assets/images/03.jpg',
      isDownload: true
    },

    {
      name: 'matthew',
      type: GALLERY_TYPE.IMG,
      url: 'assets/images/02.jpg',
      defaultUrl: 'assets/images/02.jpg',
      isDownload: true
    },
    {
      name: 'jenny',
      type: GALLERY_TYPE.IMG,
      url: 'assets/images/03.jpg',
      defaultUrl: 'assets/images/03.jpg',
      isDownload: true
    },
    {
      name: 'chris',
      type: GALLERY_TYPE.IMG,
      url: 'assets/images/01.jpg',
      defaultUrl: 'assets/images/01.jpg',
      isDownload: true
    },
    {
      name: 'jenny',
      type: GALLERY_TYPE.IMG,
      url: 'assets/images/02.jpg',
      defaultUrl: 'assets/images/02.jpg',
      isDownload: true
    }
  ];
}
