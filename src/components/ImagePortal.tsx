import React from "react";
import ReactDOM from "react-dom";
import { type ImageAsset } from "./ImageContext";

interface ImagePortalProps {
  imageAsset: ImageAsset;
  alt: string;
  onClose: () => void;
}

const ImagePortal: React.FC<ImagePortalProps> = ({
  imageAsset,
  alt,
  onClose,
}) => {
  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 w-screen h-screen backdrop-blur-md bg-black bg-opacity-75 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="p-4 bg-accent dark:bg-silver-plat border-2 border-black dark:border-white shadow-[8px_8px_0_0_rgba(0,0,0,1)] dark:shadow-[8px_8px_0_0_#BFC1C2] max-h-full"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
      >
        <img
          src={imageAsset.src}
          srcSet={imageAsset.srcSet}
          alt={alt}
          className="w-full h-auto max-h-[90vh]"
          sizes="90vw"
        />
      </div>
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white text-2xl"
      >
        &times;
      </button>
    </div>,
    document.body,
  );
};

export default ImagePortal;
