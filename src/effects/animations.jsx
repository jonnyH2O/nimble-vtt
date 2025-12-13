import React from 'react';


// Centralized Animation Registry
// All CSS keyframe animations in one place


export const ANIMATIONS = {
  heartbeat: `
    @keyframes heartbeat {
      0% {
        opacity: 0.42;
      }
      10% {
        opacity: 0.7;
      }
      20% {
        opacity: 0.42;
      }
      30% {
        opacity: 0.75;
      }
      40% {
        opacity: 0.42;
      }
      100% {
        opacity: 0.42;
      }
    }
  `,


  flicker: `
    @keyframes flicker {
      0%, 100% {
        opacity: 0.8;
      }
      50% {
        opacity: 0.4;
      }
    }
  `,


  pulse: `
    @keyframes pulse {
      0%, 100% {
        transform: scale(1);
      }
      50% {
        transform: scale(1.05);
      }
    }
  `,


  shimmer: `
    @keyframes shimmer {
      0%, 100% {
        opacity: 0.6;
      }
      50% {
        opacity: 1;
      }
    }
  `,


  glow: `
    @keyframes glow {
      0%, 100% {
        filter: brightness(1);
      }
      50% {
        filter: brightness(1.3);
      }
    }
  `,

  smolderRise: `
    @keyframes smolderRise {
      0% {
        transform: translateY(0) translateX(0) scale(1);
        opacity: 0;
      }
      10% {
        opacity: 0.9;
      }
      100% {
        transform: translateY(var(--rise-distance, -80px)) translateX(var(--drift-x)) scale(0.2);
        opacity: 0;
      }
    }
  `
};


/**
 * Component that injects all animation styles into the page
 * Use this once at the root of your app
 */
export function AnimationStyles() {
  return <style>{Object.values(ANIMATIONS).join('\n')}</style>;
}




