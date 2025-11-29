import React, { useEffect, useRef } from 'react';

interface VisualizerProps {
  inputVolume: number;
  outputVolume: number;
  isActive: boolean;
}

const Visualizer: React.FC<VisualizerProps> = ({ inputVolume, outputVolume, isActive }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let time = 0;

    const render = () => {
      time += 0.05;
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;
      
      // Base radius
      const baseRadius = 80;
      
      // Dynamic pulsing based on volume
      // Use outputVolume (AI) for the main orb color/size
      // Use inputVolume (User) for perhaps a secondary effect or ring
      
      const aiScale = 1 + outputVolume * 2; // AI talks -> gets bigger
      const userScale = 1 + inputVolume * 1.5; // User talks -> subtle ring reaction

      // Draw "Mommy" Orb (The AI)
      if (isActive) {
        // Outer Glow (User influence)
        ctx.beginPath();
        const glowRadius = baseRadius * userScale + 10;
        ctx.arc(centerX, centerY, glowRadius, 0, Math.PI * 2);
        const gradient = ctx.createRadialGradient(centerX, centerY, baseRadius, centerX, centerY, glowRadius);
        gradient.addColorStop(0, 'rgba(167, 139, 250, 0.2)'); // Violet
        gradient.addColorStop(1, 'rgba(167, 139, 250, 0)');
        ctx.fillStyle = gradient;
        ctx.fill();

        // Main Orb (AI Voice)
        ctx.beginPath();
        
        // Wobble effect
        const wobble = Math.sin(time) * 5 * (outputVolume > 0.1 ? 2 : 0.5);
        const currentRadius = Math.max(baseRadius, baseRadius * aiScale) + wobble;

        ctx.arc(centerX, centerY, currentRadius, 0, Math.PI * 2);
        
        // Beautiful gradient for Mommy
        const orbGradient = ctx.createRadialGradient(centerX - 20, centerY - 20, 10, centerX, centerY, currentRadius);
        orbGradient.addColorStop(0, '#f472b6'); // Pink-400
        orbGradient.addColorStop(0.5, '#db2777'); // Pink-600
        orbGradient.addColorStop(1, '#831843'); // Pink-900
        
        ctx.fillStyle = orbGradient;
        ctx.fill();
        
        // Inner highlight
        ctx.beginPath();
        ctx.arc(centerX - 30, centerY - 30, 15, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fill();
      } else {
        // Idle state
        ctx.beginPath();
        ctx.arc(centerX, centerY, baseRadius, 0, Math.PI * 2);
        ctx.fillStyle = '#334155'; // Slate-700
        ctx.fill();
      }

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [inputVolume, outputVolume, isActive]);

  return (
    <canvas 
      ref={canvasRef} 
      width={400} 
      height={400} 
      className="w-full max-w-[400px] h-auto aspect-square mx-auto"
    />
  );
};

export default Visualizer;