import React, { useState } from 'react';

/**
 * Tooltip Component
 * 
 * Displays a hover tooltip with text and an optional keyboard shortcut.
 * Matches the visual style of the provided design: dark background, white text, 
 * and a distinct box for the shortcut key.
 * 
 * @param {Object} props
 * @param {string} props.text - The main text to display
 * @param {string} props.shortcut - The keyboard shortcut key (e.g., 'V', 'D')
 * @param {React.ReactNode} props.children - The element to wrap (trigger)
 * @param {string} props.position - 'top', 'bottom', 'left', 'right' (default: 'bottom')
 */
export default function Tooltip({ text, shortcut, children, position = 'bottom' }) {
    const [isVisible, setIsVisible] = useState(false);

    // Position classes
    const positionClasses = {
        top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
        bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
        left: 'right-full top-1/2 -translate-y-1/2 mr-2',
        right: 'left-full top-1/2 -translate-y-1/2 ml-2'
    };

    // Triangle/Arrow classes
    const arrowClasses = {
        top: 'top-full left-1/2 -translate-x-1/2 border-t-gray-800 border-l-transparent border-r-transparent border-b-transparent',
        bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-gray-800 border-l-transparent border-r-transparent border-t-transparent',
        left: 'left-full top-1/2 -translate-y-1/2 border-l-gray-800 border-t-transparent border-b-transparent border-r-transparent',
        right: 'right-full top-1/2 -translate-y-1/2 border-r-gray-800 border-t-transparent border-b-transparent border-l-transparent'
    };

    return (
        <div
            className="relative flex items-center"
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
        >
            {children}

            {isVisible && (
                <div className={`absolute z-50 whitespace-nowrap ${positionClasses[position]}`}>
                    <div className="bg-gray-800 text-white text-xs px-2 py-1.5 rounded shadow-lg flex items-center gap-2 border border-gray-700">
                        <span className="font-medium">{text}</span>
                        {shortcut && (
                            <span className="bg-gray-600 text-gray-200 px-1.5 py-0.5 rounded text-[10px] font-mono border border-gray-500 min-w-[20px] text-center">
                                {shortcut}
                            </span>
                        )}
                    </div>
                    {/* Arrow */}
                    <div className={`absolute w-0 h-0 border-4 ${arrowClasses[position]}`}></div>
                </div>
            )}
        </div>
    );
}
