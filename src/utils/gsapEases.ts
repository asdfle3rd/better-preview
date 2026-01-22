import { gsap } from "gsap";

/**
 * Modern "Critically Damped" Spring Ease
 * @param {number} bounce - Controls the overshoot. 0 is pure damping (Apple feel).
 * @returns {function} - A GSAP-compatible ease function
 */
const createCriticalSpring = (bounce = 0) => {
  return (t: number) => {
    // We assume the natural settling time is around t=1 for the math, 
    // so we stretch t to a useful physics range (0 -> 10)
    const fluidT = t * 10; 
    
    if (t === 0) return 0;
    if (t === 1) return 1;

    // Critically Damped Spring Formula: y = 1 - e^(-t) - t * e^(-t)
    const decay = Math.exp(-fluidT);
    
    if (bounce === 0) {
      // Pure Critical Damping
      return 1 - decay - (fluidT * decay);
    }
    
    // Modern Snap (Subtle Underdamping)
    return 1 - Math.exp(-fluidT * 0.8) * Math.cos(fluidT * 0.3);
  };
};

// --- REGISTER IT ---

// 1. The "silk" Ease (Pure Fluidity)
// Use this for: Modals, Page Transitions, Large sections moving
gsap.registerEase("silk", createCriticalSpring(0));

// 2. The "snap" Ease (Subtle Energy)
// Use this for: Buttons, Hover effects, Small UI elements
gsap.registerEase("snap", createCriticalSpring(0.1));
