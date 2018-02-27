export enum GALLERY_TYPE {
  YOUTUBE = 'youtube',
  IMG = 'img',
  VIDEO = 'video'
}

export interface GalleryItem {
  type: GALLERY_TYPE;
  url: string;
  defaultUrl: string;
  isDownload?: boolean;
  [key: string]: any;
}
