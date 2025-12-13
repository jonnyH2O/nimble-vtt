import React, { useMemo } from 'react';

/**
 * SmolderingParticles Component
 *
 * Generates animated particles that rise upward with red, orange, and yellow colors
 * to create a smoldering effect on tokens
 *
 * @param {number} tokenSize - Size of the token in pixels (default 80)
 * @param {number} particleCount - Number of particles to generate
 */
export function SmolderingParticles({ tokenSize = 80, particleCount = 30 }) {
  // Generate particle data on mount, scaled to token size
  const particles = useMemo(() => {
    const colors = [
      'rgba(239, 68, 68, 1)',    // red-500
      'rgba(249, 115, 22, 1)',   // orange-500
      'rgba(234, 179, 8, 1)',    // yellow-500
      'rgba(220, 38, 38, 1)',    // red-600
      'rgba(251, 146, 60, 1)',   // orange-400
      'rgba(252, 211, 77, 1)'    // yellow-300
    ];

    // Scale factor based on token size (80px is the base size)
    const scaleFactor = tokenSize / 80;

    return Array.from({ length: particleCount }, (_, i) => {
      // Distribute particles around the token perimeter with some randomness
      const baseAngle = (i / particleCount) * Math.PI * 2;
      const angleVariation = (Math.random() - 0.5) * 0.3; // Add some randomness to angle
      const angle = baseAngle + angleVariation;

      // Scale radius based on token size (base radius is ~40px for 80px token)
      const baseRadius = (tokenSize / 2) - 5; // Slightly inside the token edge
      const radius = baseRadius + (Math.random() - 0.5) * 10 * scaleFactor;

      // Starting position on token edge
      const startX = Math.cos(angle) * radius;
      const startY = Math.sin(angle) * radius;

      // Random drift scaled to token size
      const driftX = (Math.random() - 0.5) * 30 * scaleFactor;

      return {
        id: i,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: (Math.random() * 3 + 2) * scaleFactor, // Scale particle size with token
        startX,
        startY,
        driftX,
        delay: (i * 0.1) + (Math.random() * 0.5), // More evenly distributed delays: 0-3.5s
        duration: Math.random() * 1 + 2, // 2-3s duration
        riseDistance: 80 * scaleFactor // Scale rise distance with token size
      };
    });
  }, [particleCount, tokenSize]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-visible">
      {particles.map((particle) => (
        <div
          key={particle.id}
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            marginLeft: `${particle.startX}px`,
            marginTop: `${particle.startY}px`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            backgroundColor: particle.color,
            borderRadius: '50%',
            boxShadow: `0 0 ${particle.size * 3}px ${particle.color}`,
            '--drift-x': `${particle.driftX}px`,
            '--rise-distance': `-${particle.riseDistance}px`,
            animation: `smolderRise ${particle.duration}s ease-out ${particle.delay}s infinite backwards`,
            willChange: 'transform, opacity'
          }}
        />
      ))}
    </div>
  );
}
