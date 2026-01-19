declare module 'rc-image/lib/PreviewGroup' {
  interface PreviewGroupPreview {
    onChange?: (current: number, prevCurrent: number) => void;
    onVisibleChange?: (value: boolean, prevValue: boolean, current: number) => void;
  }
}

declare module 'rc-image/es/PreviewGroup' {
  interface PreviewGroupPreview {
    onChange?: (current: number, prevCurrent: number) => void;
    onVisibleChange?: (value: boolean, prevValue: boolean, current: number) => void;
  }
}

declare module '@lobehub/ui/es/Image/type' {
  interface PreviewGroupPreviewOptions {
    onChange?: (current: number, prevCurrent: number) => void;
    onVisibleChange?: (value: boolean, prevValue: boolean, current: number) => void;
  }
}

declare module '@lobehub/ui/lib/Image/type' {
  interface PreviewGroupPreviewOptions {
    onChange?: (current: number, prevCurrent: number) => void;
    onVisibleChange?: (value: boolean, prevValue: boolean, current: number) => void;
  }
}

export {};
