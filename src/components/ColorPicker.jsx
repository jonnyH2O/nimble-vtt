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

    const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });

    useEffect(() => {
        if (isOpen && containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            // Default to showing below and aligned to right of button (standard behavior previously)
            // But check if it fits? For now, just replicate "bottom-right" alignment but in fixed coords
            // Actually, let's align left edge with button left edge, or better, center?
            // Original was "right-0" which means right edge with button right edge.

            // Calculate position
            const top = rect.bottom + 8; // 8px gap
            const left = rect.left; // Align left, or can calculate to align right if needed.

            // Adjust if logic for right alignment is preferred:
            // left: rect.right - popupWidth (we don't know popup width easily without rendering)

            // Let's stick to align left for now, or just try to be smart. 
            // The screenshot showed it cut off on the LEFT side because it was extending left?
            // "right-0" means right-aligned. 

            setPopupPosition({
                top,
                left: rect.left
            });
        }
    }, [isOpen]);

    return (
        <div className="relative" ref={containerRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-8 h-8 rounded border border-gray-600 flex items-center justify-center hover:border-gray-400 transition-colors"
                style={{ backgroundColor: color }}
                aria-label="Select color"
            />

            {isOpen && (
                <div
                    className="fixed mt-2 p-2 bg-gray-800 rounded-lg shadow-xl border border-gray-700 z-[9999] grid grid-cols-4 gap-2 w-max"
                    style={{
                        top: popupPosition.top,
                        left: popupPosition.left,
                    }}
                >
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
