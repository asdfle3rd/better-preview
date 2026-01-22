import React, { useRef, createRef, useMemo } from "react";
import FeatureSection from "./FeatureSection";
import ThemeProvider from "./ThemeProvider";
import { ImageProvider, type ImageAsset } from "./ImageContext";
import { gsap } from "gsap";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";

gsap.registerPlugin(ScrollToPlugin);

interface Feature {
  id: string;
  slug: string;
  data: {
    title: string;
    image: string;
  };
  body: string;
}

interface MainProps {
  features: Feature[];
  images: Record<string, ImageAsset>;
}

const Main: React.FC<MainProps> = ({ features, images }) => {
  const heroRef = useRef<HTMLDivElement>(null);
  const featureSectionRefs = useMemo(
    () => features.map(() => createRef<HTMLElement>()),
    [features],
  );

  const handleScroll = () => {
    if (featureSectionRefs.length < 1) {
      return;
    }
    const allSectionRefs = [heroRef, ...featureSectionRefs];
    const currentScrollPosition = window.scrollY + window.innerHeight;
    let nextSectionElement: HTMLElement | null = null;

    for (const sectionRef of allSectionRefs) {
      if (sectionRef.current) {
        const sectionTop = sectionRef.current.offsetTop;
        const sectionBottom =
          sectionRef.current.offsetTop + sectionRef.current.offsetHeight;
        if (
          sectionTop > window.scrollY + 0.2 * window.innerHeight &&
          sectionBottom > currentScrollPosition
        ) {
          nextSectionElement = sectionRef.current;
          break;
        }
      }
    }

    if (nextSectionElement) {
      gsap.to(window, {
        duration: 1.0,
        scrollTo: nextSectionElement,
        ease: "power2.inOut",
      });
    } else {
      gsap.to(window, {
        duration: 1.5,
        scrollTo: 0,
        ease: "power2.inOut",
      });
    }
  };

  return (
    <ImageProvider images={images}>
      <ThemeProvider>
        <main
          onClick={handleScroll}
          className="bg-white dark:bg-black text-black cursor-pointer dark:text-white font-sans"
        >
          <div
            ref={heroRef}
            className="hero-section w-screen h-screen grid grid-rows-[repeat(3, 1fr)] place-items-center text-center px-6"
          >
            <div className="flex flex-col row-start-2 row-span-1 justify-center h-full">
              <h1 className="text-6xl md:text-8xl font-black mb-4 uppercase">
                Better Preview
              </h1>
              <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
                A simple, pixel-perfect WordPress preview environment.
              </p>
              <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
                Revisiting past Revisions included.
              </p>
            </div>

            <div className="hero-hint grid grid-rows-[repeat(3, 1fr)] row-start-3 row-span-1 flex flex-col items-center justify-between h-full group">
              <div className="animate-bounce row-start-1 row-span-1 ">
                <div className="text-sm text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 group-hover:text-accent dark:group-hover:text-silver-plat transition-colors">
                  Next-Gen UX
                </div>
                <div className="grid grid-cols-2 gap-2 w-24 mx-auto opacity-50 mb-4">
                  <div className="w-2 h-2 rounded-full bg-slate-600 dark:bg-slate-400 mx-auto"></div>
                  <div className="w-2 h-2 rounded-full bg-slate-600 dark:bg-slate-400 mx-auto"></div>
                  <div className="w-2 h-2 rounded-full bg-slate-600 dark:bg-slate-400 mx-auto"></div>
                  <div className="w-2 h-2 rounded-full bg-slate-600 dark:bg-slate-400 mx-auto"></div>
                </div>
              </div>

              <div className="text-sm text-slate-500 row-start-3 row-span-1 dark:text-slate-400 uppercase tracking-widest mb-2 group-hover:text-accent dark:group-hover:text-silver-plat transition-colors">
                Click to scroll
                <svg
                  className="w-6 h-6 text-slate-500 dark:text-slate-400 mx-auto group-hover:text-accent dark:group-hover:text-silver-plat transition-colors"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 9l-7 7-7-7"
                  ></path>
                </svg>
              </div>
            </div>
          </div>

          <div className="feature-sections flex flex-col cursor-default">
            {features.map((feature, index) => (
              <FeatureSection
                key={feature.id}
                ref={featureSectionRefs[index]}
                feature={feature}
                index={index}
              />
            ))}
          </div>
        </main>
      </ThemeProvider>
    </ImageProvider>
  );
};

export default Main;
