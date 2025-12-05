import React, { useEffect, useRef } from 'react';
import { Mood } from '../types';

interface MatrixBackgroundProps {
  mood?: Mood;
}

const MatrixBackground: React.FC<MatrixBackgroundProps> = ({ mood }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    // Bengali Characters (Vowels and Consonants) + Numbers
    const bengaliChars = "অআইঈউঊঋএঐওঔকখগঘঙচছজঝঞটঠডঢণতথদধনপফবভমযরলশষসহড়ঢ়য়ৎংঃঁ০১২৩৪৫৬৭৮৯";
    const chars = bengaliChars.split('');

    const fontSize = 14;
    const columns = width / fontSize;

    // Array of drops - one per column
    const drops: number[] = [];
    for (let i = 0; i < columns; i++) {
      drops[i] = 1;
    }

    // Determine colors based on mood
    let primaryColor = '#ec4899'; // Pink-500 (Default/Happy)
    
    if (mood === 'concerned') {
        primaryColor = '#f59e0b'; // Amber-500
    } else if (mood === 'focused') {
        primaryColor = '#3b82f6'; // Blue-500
    }

    const draw = () => {
      // Very translucent black to create trail effect
      ctx.fillStyle = 'rgba(15, 23, 42, 0.08)';
      ctx.fillRect(0, 0, width, height);

      // Set Font
      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const text = chars[Math.floor(Math.random() * chars.length)];
        
        // Randomly make some characters brighter/white
        if (Math.random() > 0.95) {
            ctx.fillStyle = '#ffffff'; 
        } else {
            ctx.fillStyle = primaryColor;
        }
        
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);
        
        // sending the drop back to the top randomly after it has crossed the screen
        if (drops[i] * fontSize > height && Math.random() > 0.985) {
          drops[i] = 0;
        }

        // incrementing Y coordinate
        drops[i]++;
      }
    };

    const interval = setInterval(draw, 40);

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };

    window.addEventListener('resize', handleResize);

    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', handleResize);
    };
  }, [mood]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 w-full h-full pointer-events-none z-0 opacity-25"
    />
  );
};

export default MatrixBackground;