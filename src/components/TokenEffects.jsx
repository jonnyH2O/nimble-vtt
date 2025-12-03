
import React from 'react';
import { getTokenEffects } from '../effects/conditionEffects';


/**
 * TokenEffects Component
 *
 * Reusable component that applies all condition-based visual effects to tokens
 *
 * @param {Object} props
 * @param {Object} props.token - The token object with conditions array
 * @param {React.ReactNode} props.children - Child elements to wrap with effects
 * @param {string} props.context - Context for effects ('token' or 'sidebar')
 * @param {string} props.className - Additional CSS classes
 */
export function TokenEffects({ token, children, context = 'token', className = '' }) {
  const effects = getTokenEffects(token?.conditions, context);


  const combinedStyles = {
    ...effects.styles,
    position: 'relative'
  };


  return (
    <div style={combinedStyles} className={className}>
      {children}

      {/* Render all overlays on top but with pointer-events-none */}
      {effects.overlays.map((overlay, idx) => (
        <div
          key={idx}
          className="absolute inset-0 rounded-full pointer-events-none"
          style={overlay.style}
        />
      ))}
    </div>
  );
}


/**
 * TokenEffectOverlay Component
 *
 * Renders condition effect overlays inside the token border
 * This should be placed inside the border container, after the image/content
 */
export function TokenEffectOverlay({ token, context = 'token' }) {
  const effects = getTokenEffects(token?.conditions, context);

  if (effects.overlays.length === 0) return null;

  return (
    <>
      {effects.overlays.map((overlay, idx) => (
        <div
          key={idx}
          className="absolute inset-0 rounded-full pointer-events-none"
          style={overlay.style}
        />
      ))}
    </>
  );
}


