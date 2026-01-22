import { forwardRef, useImperativeHandle, useState } from "react";
import { useImages } from "./ImageContext";
import { useFadeInAnimation } from "../hooks/useFadeInAnimation";
import ImagePortal from "./ImagePortal";

interface Feature {
  id: string;
  slug: string;
  data: {
    title: string;
    image: string;
  };
  body: string;
}

interface FeatureSectionProps {
  feature: Feature;
  index: number;
}

const FeatureSection = forwardRef<HTMLElement | null, FeatureSectionProps>(
  ({ feature, index }, ref) => {
    const { images } = useImages();
    const isEven = index % 2 === 0;
    const fadeInRef = useFadeInAnimation();
    const [isPortalOpen, setIsPortalOpen] = useState(false);

    // Combine the refs
    useImperativeHandle<HTMLElement | null, HTMLElement | null>(
      ref,
      () => fadeInRef.current,
    );

    const imageName = feature.data.image.split(".")[0];
    const imageAsset = images[imageName];

    const openPortal = () => setIsPortalOpen(true);
    const closePortal = () => setIsPortalOpen(false);

    return (
      <section
        ref={fadeInRef}
        className="feature-section container mx-auto py-2 sm:py-6 md:py-12 xl:p-36 px-6 h-fit flex items-center"
      >
        <div
          className={`flex cursor-default flex-col md:flex-row items-center gap-12 py-4 md:py-8 xl:p-18 px-6 ${
            isEven ? "md:flex-row-reverse" : ""
          }`}
        >
          <div className="md:w-1/2">
            <h2 className="text-3xl md:text-4xl font-black uppercase mb-4 text-black dark:text-white">
              {feature.data.title}
            </h2>
            <div className="prose prose-lg max-w-none text-slate-600 dark:text-slate-300">
              {feature.body}
            </div>
          </div>
          <div className="md:w-1/2" onClick={(e)=>{e.stopPropagation(); openPortal();}}>
            {imageAsset && (
              <div className="p-4 bg-accent dark:bg-silver-plat border-2 border-black dark:border-white shadow-[8px_8px_0_0_rgba(0,0,0,1)] dark:shadow-[8px_8px_0_0_#BFC1C2] cursor-pointer">
                <img
                  src={imageAsset.src}
                  srcSet={imageAsset.srcSet}
                  alt={feature.data.title}
                  className="w-full border-2 border-black dark:border-white"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  loading="lazy"
                  decoding="async"
                />
              </div>
            )}
          </div>
        </div>
        {isPortalOpen && imageAsset && (
          <ImagePortal
            imageAsset={imageAsset}
            alt={feature.data.title}
            onClose={closePortal}
          />
        )}
      </section>
    );
  },
);

FeatureSection.displayName = "FeatureSection";

export default FeatureSection;
