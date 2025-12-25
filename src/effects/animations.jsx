import React from 'react';


// Centralized Animation Registry
// All CSS keyframe animations in one place


export const ANIMATIONS = {
  heartbeat: `
    @keyframes heartbeat {
      0% {
        opacity: 0.32;
      }
      10% {
        opacity: 0.6;
      }
      20% {
        opacity: 0.32;
      }
      30% {
        opacity: 0.65;
      }
      40% {
        opacity: 0.32;
      }
      100% {
        opacity: 0.32;
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
  `,

  turnRingRotate: `
    @keyframes turnRingRotate {
      0% {
        transform: translate(-50%, -50%) rotate(0deg);
      }
      100% {
        transform: translate(-50%, -50%) rotate(360deg);
      }
    }
  `,

  turnDotRotate: `
    @keyframes turnDotRotate {
      0% {
        transform: rotate(45deg);
      }
      100% {
        transform: rotate(405deg);
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




