declare module 'rc-image/lib/PreviewGroup' {
  interface PreviewGroupPreview {
    onChange?: (current: number, prevCurrent: number) => void;
  }
}

declare module 'rc-image/es/PreviewGroup' {
  interface PreviewGroupPreview {
    onChange?: (current: number, prevCurrent: number) => void;
  }
}
