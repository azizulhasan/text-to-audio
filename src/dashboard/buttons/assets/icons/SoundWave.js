import React from "react";

export default function SoundWave({ onClick, isPlaying = false }) {
    // Unique animation IDs to avoid conflicts
    const animId = React.useMemo(() => `soundwave-${Math.random().toString(36).substr(2, 9)}`, []);

    return (
        <svg
            onClick={onClick}
            stroke="currentColor"
            fill="currentColor"
            strokeWidth="0"
            viewBox="0 0 16 16"
            className="fs-3 tts__soundwave"
            height="1em"
            width="1em"
            xmlns="http://www.w3.org/2000/svg"
            style={{ overflow: 'visible' }}
        >
            {/* Define animations */}
            {isPlaying && (
                <defs>
                    <style>
                        {`
                            @keyframes ${animId}-bar1 {
                                0%, 100% { transform: scaleY(0.4); }
                                50% { transform: scaleY(1); }
                            }
                            @keyframes ${animId}-bar2 {
                                0%, 100% { transform: scaleY(0.6); }
                                50% { transform: scaleY(0.3); }
                            }
                            @keyframes ${animId}-bar3 {
                                0%, 100% { transform: scaleY(1); }
                                50% { transform: scaleY(0.5); }
                            }
                            @keyframes ${animId}-bar4 {
                                0%, 100% { transform: scaleY(0.5); }
                                50% { transform: scaleY(0.8); }
                            }
                            @keyframes ${animId}-bar5 {
                                0%, 100% { transform: scaleY(0.7); }
                                50% { transform: scaleY(0.4); }
                            }
                            @keyframes ${animId}-bar6 {
                                0%, 100% { transform: scaleY(0.3); }
                                50% { transform: scaleY(0.9); }
                            }
                            @keyframes ${animId}-bar7 {
                                0%, 100% { transform: scaleY(0.5); }
                                50% { transform: scaleY(1); }
                            }
                        `}
                    </style>
                </defs>
            )}

            {/* Bar 1 - leftmost, shortest */}
            <rect
                x="2"
                y="7"
                width="0.8"
                height="2"
                rx="0.4"
                style={isPlaying ? {
                    transformOrigin: '2.4px 8px',
                    animation: `${animId}-bar1 0.8s ease-in-out infinite`,
                    animationDelay: '0s'
                } : {}}
            />

            {/* Bar 2 */}
            <rect
                x="4"
                y="5.5"
                width="0.8"
                height="5"
                rx="0.4"
                style={isPlaying ? {
                    transformOrigin: '4.4px 8px',
                    animation: `${animId}-bar2 0.7s ease-in-out infinite`,
                    animationDelay: '0.1s'
                } : {}}
            />

            {/* Bar 3 */}
            <rect
                x="6"
                y="4"
                width="0.8"
                height="8"
                rx="0.4"
                style={isPlaying ? {
                    transformOrigin: '6.4px 8px',
                    animation: `${animId}-bar3 0.6s ease-in-out infinite`,
                    animationDelay: '0.2s'
                } : {}}
            />

            {/* Bar 4 - center, tallest */}
            <rect
                x="8"
                y="2"
                width="0.8"
                height="12"
                rx="0.4"
                style={isPlaying ? {
                    transformOrigin: '8.4px 8px',
                    animation: `${animId}-bar4 0.5s ease-in-out infinite`,
                    animationDelay: '0.15s'
                } : {}}
            />

            {/* Bar 5 */}
            <rect
                x="10"
                y="4"
                width="0.8"
                height="8"
                rx="0.4"
                style={isPlaying ? {
                    transformOrigin: '10.4px 8px',
                    animation: `${animId}-bar5 0.65s ease-in-out infinite`,
                    animationDelay: '0.25s'
                } : {}}
            />

            {/* Bar 6 */}
            <rect
                x="12"
                y="5.5"
                width="0.8"
                height="5"
                rx="0.4"
                style={isPlaying ? {
                    transformOrigin: '12.4px 8px',
                    animation: `${animId}-bar6 0.75s ease-in-out infinite`,
                    animationDelay: '0.3s'
                } : {}}
            />

            {/* Bar 7 - rightmost, shortest */}
            <rect
                x="14"
                y="7"
                width="0.8"
                height="2"
                rx="0.4"
                style={isPlaying ? {
                    transformOrigin: '14.4px 8px',
                    animation: `${animId}-bar7 0.85s ease-in-out infinite`,
                    animationDelay: '0.05s'
                } : {}}
            />
        </svg>
    );
}
