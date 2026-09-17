import React, { useEffect, useRef } from "react";

export default function LaunchCelebration() {
  const [mounted, setMounted] = React.useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let width = (canvas.width = window.innerWidth || 1200);
    let height = (canvas.height = window.innerHeight || 800);

    const colors = [
      "#ef4444", // red
      "#10b981", // green
      "#f59e0b", // amber/gold
      "#3b82f6", // blue
      "#f43f5e", // pink
      "#ec4899", // pink
    ];

    interface Particle {
      x: number;
      y: number;
      sizeX: number;
      sizeY: number;
      color: string;
      speedY: number;
      speedX: number;
      rotation: number;
      rotationSpeed: number;
    }

    const particles: Particle[] = [];
    const maxParticles = 140;

    for (let i = 0; i < maxParticles; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * -height - 20,
        sizeX: Math.random() * 5 + 7,     // Smaller width (7px to 12px)
        sizeY: Math.random() * 4 + 5,     // Fatter / shorter height (5px to 9px)
        color: colors[Math.floor(Math.random() * colors.length)],
        speedY: Math.random() * 5 + 6,    // Fast speed (6 to 11 px/frame)
        speedX: Math.random() * 4 - 2,    // Spread X (-2 to 2)
        rotation: Math.random() * 360,
        rotationSpeed: Math.random() * 6 - 3,
      });
    }

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth || 1200;
      height = canvas.height = window.innerHeight || 800;
    };
    window.addEventListener("resize", handleResize);

    const duration = 4000; // 4 seconds total celebration duration
    const startTime = Date.now();

    const draw = () => {
      const elapsed = Date.now() - startTime;
      if (elapsed >= duration) {
        cancelAnimationFrame(animationId);
        ctx.clearRect(0, 0, width, height);
        return;
      }

      ctx.clearRect(0, 0, width, height);

      // Smoothly fade out the canvas opacity over the last 1 second
      const fadeStart = duration - 1000;
      if (elapsed > fadeStart) {
        ctx.globalAlpha = 1 - (elapsed - fadeStart) / 1000;
      } else {
        ctx.globalAlpha = 1;
      }

      particles.forEach((p) => {
        p.y += p.speedY;
        p.x += p.speedX + Math.sin(p.y / 30) * 0.5;
        p.rotation += p.rotationSpeed;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.sizeX / 2, -p.sizeY / 2, p.sizeX, p.sizeY);
        ctx.restore();

        // Horizontal wrapping
        if (p.x < -20) p.x = width + 20;
        if (p.x > width + 20) p.x = -20;

        // Reset to top if it falls off the bottom to keep the screen filled during the active window
        if (p.y > height + 20) {
          p.y = -20;
          p.x = Math.random() * width;
          p.speedY = Math.random() * 5 + 6;
          p.speedX = Math.random() * 4 - 2;
        }
      });

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  if (!mounted) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[9999] w-full h-full"
    />
  );
}
