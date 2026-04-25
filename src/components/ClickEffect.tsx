import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface Particle {
  id: number;
  x: number;
  y: number;
  angle: number;
  velocity: number;
  size: number;
  color: string;
}

export const SubtleClickEffect: React.FC = () => {
  const [mousePos, setMousePos] = useState({ x: -100, y: -100 });
  const [particles, setParticles] = useState<Particle[]>([]);
  const [isHovering, setIsHovering] = useState(false);

  const [trail, setTrail] = useState<{ x: number, y: number, id: number }[]>([]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      setMousePos({ x: clientX, y: clientY });
      
      // Fast Trail effect
      const newTrailId = Math.random();
      setTrail(prev => [{ x: clientX, y: clientY, id: newTrailId }, ...prev].slice(0, 15));
      
      const target = e.target as HTMLElement;
      const isInteractive = target.tagName === 'BUTTON' || target.tagName === 'A' || target.closest('.minimal-card') !== null || target.tagName === 'SPAN' || target.tagName === 'H1' || target.tagName === 'H2' || target.tagName === 'P' || target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
      setIsHovering(isInteractive);
    };

    const handleClick = (e: MouseEvent) => {
      const newParticles: Particle[] = Array.from({ length: 25 }).map((_, i) => ({
        id: Date.now() + i,
        x: e.clientX,
        y: e.clientY,
        angle: Math.random() * Math.PI * 2,
        velocity: 4 + Math.random() * 10,
        size: 1 + Math.random() * 5,
        color: i % 2 === 0 ? '#C5A059' : '#F8E5B7'
      }));

      setParticles((prev) => [...prev, ...newParticles]);
      
      setTimeout(() => {
        setParticles((prev) => prev.filter((p) => !newParticles.find(np => np.id === p.id)));
      }, 700);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mousedown', handleClick);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleClick);
    };
  }, []);

  return (
    <>
      {/* Trail Fragments: Gold Dust Effect */}
      {trail.map((t, i) => (
        <div 
          key={t.id}
          className="fixed pointer-events-none z-[9998] bg-brand-gold rounded-full"
          style={{
            left: t.x - (Math.random() * 4 - 2),
            top: t.y - (Math.random() * 4 - 2),
            width: Math.max(1, 2 - (i * 0.1)),
            height: Math.max(1, 2 - (i * 0.1)),
            opacity: (15 - i) / 45,
            boxShadow: '0 0 8px #C5A059',
            transition: 'opacity 0.2s linear'
          }}
        />
      ))}

      {/* Custom Cursor: Real Gold Metal Crosshair */}
      <motion.div
        className="fixed pointer-events-none z-[10000] flex items-center justify-center mix-blend-screen"
        animate={{ 
          x: mousePos.x, 
          y: mousePos.y,
          width: isHovering ? 80 : 36,
          height: isHovering ? 80 : 36,
          left: isHovering ? -40 : -18,
          top: isHovering ? -40 : -18,
        }}
        transition={{ type: 'spring', damping: 50, stiffness: 1200, mass: 0.02 }}
      >
        <div className="absolute inset-0 border-[1.5px] border-brand-gold/60 rounded-full" />
        
        {/* Crosshair Lines - Precise & Metallic */}
        <div className="absolute w-[1.5px] h-[100%] bg-gradient-to-b from-transparent via-brand-gold to-transparent scale-y-[0.6]" />
        <div className="absolute h-[1.5px] w-[100%] bg-gradient-to-r from-transparent via-brand-gold to-transparent scale-x-[0.6]" />
        
        <motion.div 
          className="bg-brand-gold shadow-[0_0_15px_#C5A059] w-[5px] h-[5px] rotate-45"
          animate={{
            scale: isHovering ? 1.5 : 1,
            rotate: isHovering ? 225 : 45
          }}
        />

        {isHovering && (
           <motion.div
             initial={{ scale: 0.8, opacity: 0 }}
             animate={{ scale: 1.5, opacity: [0, 0.3, 0] }}
             transition={{ repeat: Infinity, duration: 0.8 }}
             className="absolute inset-0 rounded-full border-2 border-brand-gold blur-sm"
           />
        )}
      </motion.div>

      {/* Gold Dust Particles */}
      <div className="fixed inset-0 pointer-events-none z-[9999]">
        <AnimatePresence>
          {particles.map((p) => (
            <motion.div
              key={p.id}
              initial={{ 
                x: p.x, 
                y: p.y, 
                opacity: 1,
                scale: 1,
                filter: 'blur(0px)'
              }}
              animate={{ 
                x: p.x + Math.cos(p.angle) * p.velocity * 60,
                y: p.y + Math.sin(p.angle) * p.velocity * 60,
                opacity: 0,
                scale: 0.1,
                filter: 'blur(2px)'
              }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="absolute rounded-full shadow-[0_0_10px_white]"
              style={{ width: p.size, height: p.size, backgroundColor: p.color }}
            />
          ))}
        </AnimatePresence>
      </div>
    </>
  );
};
