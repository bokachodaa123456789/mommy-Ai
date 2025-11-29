
import React, { useEffect, useState } from 'react';

interface AvatarVisualizerProps {
  outputVolume: number; // 0 to 1
  isActive: boolean;
}

const AvatarVisualizer: React.FC<AvatarVisualizerProps> = ({ outputVolume, isActive }) => {
  const [blink, setBlink] = useState(false);
  const [lookAngle, setLookAngle] = useState({ x: 0, y: 0 });

  // Random blinking logic
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 150);
    }, 3500 + Math.random() * 2000);
    return () => clearInterval(blinkInterval);
  }, []);

  // Subtle head movement (breathing/alive feel)
  useEffect(() => {
    const moveInterval = setInterval(() => {
      setLookAngle({
        x: (Math.random() - 0.5) * 3,
        y: (Math.random() - 0.5) * 3
      });
    }, 2500);
    return () => clearInterval(moveInterval);
  }, []);

  // Mouth Animation - Quadratic curve control point Y moves based on volume
  // Smoothed out for natural talking
  const mouthOpenAmount = isActive ? Math.min(outputVolume * 50, 25) : 0;
  
  // Aesthetic Palettes
  const skinColor = "#FFF0E5"; // Fair/Pale skin
  const shadowColor = "#E6D0C0";
  const blushColor = "#FFB7B2";
  const hairColor = "#1a1a1a"; // Soft Black
  const lipColor = "#D47878"; // Dried Rose
  const eyeColor = "#2C2C2C"; // Dark eyes

  return (
    <div className="w-full h-full flex items-center justify-center relative overflow-hidden bg-slate-900">
      <svg
        viewBox="0 0 200 200"
        className="w-full h-full max-w-[350px] drop-shadow-2xl transition-transform duration-1000 ease-in-out"
        style={{
            transform: `translate(${lookAngle.x}px, ${lookAngle.y}px)`
        }}
      >
        <defs>
          <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* --- Back Hair (Long, straight, dark) --- */}
        <path 
          d="M 40 60 C 20 100 20 180 30 220 L 170 220 C 180 180 180 100 160 60 Q 100 10 40 60" 
          fill={hairColor} 
        />

        {/* --- Face Shape (Softer, V-line) --- */}
        <path d="M 50 80 Q 50 60 100 60 Q 150 60 150 80 Q 155 120 100 165 Q 45 120 50 80" fill={skinColor} />
        
        {/* Neck Shadow/Detail */}
        <path d="M 85 160 Q 100 165 115 160 L 115 180 L 85 180 Z" fill={shadowColor} opacity="0.5" />

        {/* Blush */}
        <ellipse cx="65" cy="115" rx="12" ry="8" fill={blushColor} opacity="0.3" filter="url(#softGlow)" />
        <ellipse cx="135" cy="115" rx="12" ry="8" fill={blushColor} opacity="0.3" filter="url(#softGlow)" />

        {/* --- Eyes --- */}
        <g transform="translate(0, 5)">
            {/* Left Eye */}
            <g transform="translate(70, 100)">
                {blink ? (
                    <path d="M -14 2 Q 0 6 14 2" stroke="#1a1a1a" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
                ) : (
                    <>
                    {/* Sclera */}
                    <path d="M -14 0 Q 0 -8 14 0 Q 0 8 -14 0" fill="#FFF" />
                    {/* Iris */}
                    <circle cx="0" cy="0" r="5.5" fill={eyeColor} />
                    {/* Highlight */}
                    <circle cx="2" cy="-2" r="2" fill="white" opacity="0.9" />
                    {/* Eyeliner/Lash line */}
                    <path d="M -15 -1 Q 0 -10 15 -1" fill="none" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round" />
                    <path d="M 15 -1 Q 18 -4 19 -6" fill="none" stroke="#1a1a1a" strokeWidth="1.5" /> {/* Wing */}
                    </>
                )}
            </g>

            {/* Right Eye */}
            <g transform="translate(130, 100)">
                 {blink ? (
                    <path d="M -14 2 Q 0 6 14 2" stroke="#1a1a1a" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
                ) : (
                    <>
                    <path d="M -14 0 Q 0 -8 14 0 Q 0 8 -14 0" fill="#FFF" />
                    <circle cx="0" cy="0" r="5.5" fill={eyeColor} />
                    <circle cx="2" cy="-2" r="2" fill="white" opacity="0.9" />
                    <path d="M -15 -1 Q 0 -10 15 -1" fill="none" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round" />
                    <path d="M 15 -1 Q 18 -4 19 -6" fill="none" stroke="#1a1a1a" strokeWidth="1.5" />
                    </>
                )}
            </g>
        </g>

        {/* Nose (Small, cute) */}
        <path d="M 100 115 Q 96 125 100 128 Q 104 125 100 115" fill="#DDBEA8" />

        {/* --- Mouth (Dynamic) --- */}
        <g transform="translate(100, 145)">
            {/* Lips */}
            <path 
                d={`M -16 0 Q 0 ${-4 - mouthOpenAmount/5} 16 0 Q 0 ${6 + mouthOpenAmount} -16 0`} 
                fill={lipColor} 
            />
            {/* Inner mouth shadow when open */}
            {mouthOpenAmount > 5 && (
                 <path 
                    d={`M -10 1 Q 0 ${1 + mouthOpenAmount/1.5} 10 1 Q 0 ${4 + mouthOpenAmount} -10 1`} 
                    fill="#803030" 
                />
            )}
            {/* Gloss Highlight */}
            <path d="M -5 -2 Q 0 -3 5 -2" stroke="white" strokeWidth="1.5" opacity="0.4" fill="none" />
        </g>

        {/* --- Front Hair (Bangs/Framing) --- */}
        {/* Left Bangs */}
        <path d="M 50 60 C 20 80 40 160 30 200 C 50 160 80 80 50 60" fill={hairColor} opacity="0.95" />
        {/* Right Bangs */}
        <path d="M 150 60 C 180 80 160 160 170 200 C 150 160 120 80 150 60" fill={hairColor} opacity="0.95" />
        {/* Forehead wisps */}
        <path d="M 100 60 Q 80 90 40 120 L 45 60 Z" fill={hairColor} opacity="0.9" />
        <path d="M 100 60 Q 120 90 160 120 L 155 60 Z" fill={hairColor} opacity="0.9" />

      </svg>
    </div>
  );
};

export default AvatarVisualizer;
