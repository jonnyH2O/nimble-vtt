import React from 'react';

/**
 * TurnStartRing Component
 *
 * Creates an animated rotating ring effect around a token when its turn starts.
 * Features a spinning arc and glowing dot that circle the token border.
 *
 * @param {number} tokenSize - Size of the token in pixels (default 80)
 * @param {number} tokenBorderWidth - Width of the token's border (to position ring inside it)
 * @param {string} arcColor - Color for the rotating arc (default 'var(--color-slider-track)')
 * @param {string} dotColor - Color for the glowing dot (default 'var(--color-slider)')
 */
export function TurnStartRing({
  tokenSize = 80,
  tokenBorderWidth = 4,
  arcColor = 'var(--color-slider-track)',
  dotColor = 'var(--color-slider)'
}) {
  // Calculate ring dimensions that scale properly
  const ringWidth = Math.max(1, Math.round(tokenBorderWidth * 0.5));

  // Arc should extend outside the token to cover the border area
  // It needs to be larger than tokenSize to sit on the outside edge
  const arcSize = tokenSize + tokenBorderWidth;

  // Dot size scales with token size
  const dotSize = Math.max(4, Math.round(tokenBorderWidth * 0.9));

  // Dot position - should be centered on the arc line
  // The arc's center line is at (tokenSize + tokenBorderWidth) / 2
  // But we need to subtract half the arc's border width to center on it
  const dotRadius = (tokenSize + tokenBorderWidth) / 2 - ringWidth / 2;

  return (
    <div
      className="absolute pointer-events-none rounded-full"
      style={{
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: `${tokenSize}px`,
        height: `${tokenSize}px`,
        zIndex: 20
      }}
    >
      {/* Rotating arc overlay - positioned on outside edge of token border */}
      <div
        className="rounded-full"
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: `${arcSize}px`,
          height: `${arcSize}px`,
          border: `${ringWidth}px solid transparent`,
          borderTop: `${ringWidth}px solid ${arcColor}`,
          borderRight: `${ringWidth}px solid ${arcColor}`,
          borderRadius: '50%',
          animation: 'turnRingRotate 2s linear infinite',
          willChange: 'transform'
        }}
      />

      {/* Rotating dot */}
      <span
        style={{
          display: 'block',
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: `${dotRadius}px`,
          height: 0,
          background: 'transparent',
          transformOrigin: 'left center',
          animation: 'turnDotRotate 2s linear infinite',
          willChange: 'transform'
        }}
      >
        {/* Glowing dot at the end of the span, centered on the arc */}
        <span
          style={{
            content: '',
            position: 'absolute',
            width: `${dotSize}px`,
            height: `${dotSize}px`,
            borderRadius: '50%',
            background: dotColor,
            top: '0%',
            right: 0,
            transform: 'translate(50%, -50%)',
            boxShadow: `0 0 ${Math.max(8, dotSize * 2)}px ${dotColor}`
          }}
        />
      </span>
    </div>
  );
}
