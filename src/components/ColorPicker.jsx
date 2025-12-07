import React, { useState, useRef, useEffect } from 'react';

const COLORS = [
    '#ffffff', // White
    '#cbd5e1', // Slate 300
    '#64748b', // Slate 500
    '#1e293b', // Slate 800
    '#3b82f6', // Blue 500
    '#6366f1', // Indigo 500
    '#a855f7', // Purple 500
    '#d946ef', // Fuchsia 500
    '#14b8a6', // Teal 500
    '#22c55e', // Green 500
    '#84cc16', // Lime 500
    '#a16207', // Yellow 700 (Brown-ish)
    '#ef4444', // Red 500
    '#f97316', // Orange 500
    '#eab308', // Yellow 500
    '#78350f', // Amber 900 (Dark Brown)
];

export default function ColorPicker({ color, onChange }) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <div className="relative" ref={containerRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-8 h-8 rounded border border-gray-600 flex items-center justify-center hover:border-gray-400 transition-colors"
                style={{ backgroundColor: color }}
                aria-label="Select color"
            />

            {isOpen && (
                <div className="absolute top-full right-0 mt-2 p-2 bg-gray-800 rounded-lg shadow-xl border border-gray-700 z-50 grid grid-cols-4 gap-2 w-max">
                    {COLORS.map((c) => (
                        <button
                            key={c}
                            onClick={() => {
                                onChange(c);
                                setIsOpen(false);
                            }}
                            className={`w-8 h-8 rounded-full border-2 hover:scale-110 transition-transform ${color === c ? 'border-white' : 'border-transparent'
                                }`}
                            style={{ backgroundColor: c }}
                            title={c}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
