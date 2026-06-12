import type { ImagePreview } from '../types';

type ImagePreviewDialogProps = {
  image: ImagePreview | null;
  onClose: () => void;
};

export function ImagePreviewDialog({ image, onClose }: ImagePreviewDialogProps) {
  if (!image) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0b141a]/95 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Image preview"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full bg-[#202c33] text-xl text-[#e9edef] transition hover:bg-[#2a3942] focus:outline-none focus:ring-2 focus:ring-[#00a884]"
        aria-label="Close image preview"
      >
        x
      </button>
      <img
        src={image.src}
        alt={image.alt}
        className="max-h-[92vh] max-w-[96vw] object-contain"
        onClick={(event) => event.stopPropagation()}
      />
    </div>
  );
}
