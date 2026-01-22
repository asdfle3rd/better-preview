import { createContext, useContext, type ReactNode } from "react";

export interface ImageAsset {
  src: string;
  srcSet: string;
}

export interface ImageContextType {
  images: Record<string, ImageAsset>;
}

const ImageContext = createContext<ImageContextType | null>(null);

export const useImages = () => {
  const context = useContext(ImageContext);
  if (!context) {
    throw new Error("useImages must be used within a ImageProvider");
  }
  return context;
};

export const ImageProvider = ({
  children,
  images,
}: {
  children: ReactNode;
  images: Record<string, ImageAsset>;
}) => {
  return (
    <ImageContext.Provider value={{ images }}>{children}</ImageContext.Provider>
  );
};
