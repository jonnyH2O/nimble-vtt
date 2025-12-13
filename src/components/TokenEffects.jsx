
import React from 'react';
import { getTokenEffects } from '../effects/conditionEffects';
import { SmolderingParticles } from '../effects/SmolderingParticles';


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
 * @param {number} props.tokenSize - Size of the token in pixels (for scaling particle effects)
 */
export function TokenEffects({ token, children, context = 'token', className = '', tokenSize = 80 }) {
  const effects = getTokenEffects(token?.conditions, context);


  const combinedStyles = {
    ...effects.styles,
    position: 'relative'
  };


  return (
    <div style={combinedStyles} className={className}>
      {children}

      {/* Render all overlays on top but with pointer-events-none */}
      {effects.overlays.map((overlay, idx) => {
        // Handle particle-based overlays
        if (overlay.type === 'particles' && overlay.component === 'SmolderingParticles') {
          return <SmolderingParticles key={idx} tokenSize={tokenSize} />;
        }

        // Handle standard box-shadow/style overlays
        return (
          <div
            key={idx}
            className="absolute inset-0 rounded-full pointer-events-none"
            style={overlay.style}
          />
        );
      })}
    </div>
  );
}


/**
 * TokenEffectOverlay Component
 *
 * Renders condition effect overlays inside the token border
 * This should be placed inside the border container, after the image/content
 *
 * @param {number} tokenSize - Size of the token in pixels (for scaling particle effects)
 */
export function TokenEffectOverlay({ token, context = 'token', tokenSize = 80 }) {
  const effects = getTokenEffects(token?.conditions, context);

  if (effects.overlays.length === 0) return null;

  return (
    <>
      {effects.overlays.map((overlay, idx) => {
        // Handle particle-based overlays
        if (overlay.type === 'particles' && overlay.component === 'SmolderingParticles') {
          return <SmolderingParticles key={idx} tokenSize={tokenSize} />;
        }

        // Handle standard box-shadow/style overlays
        return (
          <div
            key={idx}
            className="absolute inset-0 rounded-full pointer-events-none"
            style={overlay.style}
          />
        );
      })}
    </>
  );
}


