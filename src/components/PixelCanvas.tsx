"use client";

import React, { useRef, useEffect } from "react";

export default function PixelCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 600);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 400);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };
    window.addEventListener("resize", handleResize);

    // Pixel state variables
    let sunX = -140; // moving left to right
    let cloudOffset = 0;
    let cityOffset = 0;
    let birdOffset = 0;
    let sparkleTimer = 0;

    const render = () => {
      ctx.imageSmoothingEnabled = false; // keep crisp pixel style
      sparkleTimer += 0.05;

      // 1. Charming Light Pastel Sky Blue Gradient with Warm Horizon Glow
      const skyGradient = ctx.createLinearGradient(0, 0, 0, height);
      skyGradient.addColorStop(0, "#bae6fd"); // Bright pastel sky top (sky-200)
      skyGradient.addColorStop(0.35, "#7dd3fc"); // Soft sky blue (sky-300)
      skyGradient.addColorStop(0.7, "#a5f3fc"); // Radiant turquoise light (cyan-200)
      skyGradient.addColorStop(1, "#fef08a"); // Golden warm horizon light (yellow-200)
      ctx.fillStyle = skyGradient;
      ctx.fillRect(0, 0, width, height);

      // 2. MAGICAL RADIANT SUN & SPARKLE RAYS (moving left to right)
      sunX += 0.45;
      if (sunX > width + 180) {
        sunX = -180;
      }
      const sunY = height * 0.22 + Math.sin(sunX / 100) * 12;
      const sunSize = 104; // Extra Large Sun Size

      // Multi-layer glowing sun aura (soft warm pastel yellows & ambers)
      ctx.fillStyle = "rgba(254, 240, 138, 0.55)";
      ctx.fillRect(sunX - sunSize / 2 - 32, sunY - sunSize / 2 - 32, sunSize + 64, sunSize + 64);

      ctx.fillStyle = "rgba(253, 224, 71, 0.75)";
      ctx.fillRect(sunX - sunSize / 2 - 16, sunY - sunSize / 2 - 16, sunSize + 32, sunSize + 32);

      // Core Solid Deep Golden Yellow Sun
      ctx.fillStyle = "#f59e0b"; // Vibrant amber yellow
      ctx.fillRect(sunX - sunSize / 2, sunY - sunSize / 2, sunSize, sunSize);
      ctx.fillStyle = "#facc15"; // Bright yellow inner core
      ctx.fillRect(sunX - sunSize / 2 + 6, sunY - sunSize / 2 + 6, sunSize - 12, sunSize - 12);
      ctx.fillStyle = "#ffffff"; // Pure white radiant center spot
      ctx.fillRect(sunX - sunSize / 2 + 18, sunY - sunSize / 2 + 18, sunSize - 36, sunSize - 36);

      // Charming Sunburst Pixel Rays
      ctx.fillStyle = "rgba(254, 240, 138, 0.85)";
      ctx.fillRect(sunX - sunSize / 2 - 20, sunY - 4, 12, 8);
      ctx.fillRect(sunX + sunSize / 2 + 8, sunY - 4, 12, 8);
      ctx.fillRect(sunX - 4, sunY - sunSize / 2 - 20, 8, 12);
      ctx.fillRect(sunX - 4, sunY + sunSize / 2 + 8, 8, 12);

      // 3. PUFFY COTTON-CANDY PIXEL CLOUDS with Pastel Sunset Tint
      cloudOffset += 0.35;
      const drawCloud = (x: number, y: number, scale: number, isTinted = false) => {
        const p = 12 * scale;
        // Main puffy body
        ctx.fillStyle = isTinted ? "#fef3c7" : "#ffffff"; // Soft warm tint
        ctx.fillRect(x + p * 2, y, p * 7, p * 3.5);
        ctx.fillRect(x, y + p * 1.2, p * 11, p * 3);
        ctx.fillRect(x + p * 1.5, y + p * 0.5, p * 8.5, p * 3.5);

        // Soft pastel pink/peach bottom cloud shadow
        ctx.fillStyle = "rgba(251, 207, 232, 0.7)";
        ctx.fillRect(x + p * 0.5, y + p * 3.2, p * 10, p * 0.9);
      };

      const clouds = [
        { x: (cloudOffset * 0.7) % (width + 500) - 250, y: height * 0.03, scale: 1.8, tinted: false },
        { x: ((cloudOffset * 0.45) + 450) % (width + 500) - 250, y: height * 0.2, scale: 1.5, tinted: true },
        { x: ((cloudOffset * 0.95) + 950) % (width + 500) - 250, y: height * 0.01, scale: 2.2, tinted: false },
      ];
      clouds.forEach((c) => drawCloud(c.x, c.y, c.scale, c.tinted));

      // 4. Pixelated Flying Birds
      birdOffset += 1.1;
      const drawPixelBird = (bx: number, by: number) => {
        ctx.fillStyle = "#1e1b4b";
        const p = 4;
        ctx.fillRect(bx, by, p, p * 2);
        ctx.fillRect(bx + p, by - p, p, p);
        ctx.fillRect(bx + p * 2, by, p, p * 3);
        ctx.fillRect(bx + p * 3, by - p, p, p);
        ctx.fillRect(bx + p * 4, by, p, p * 2);
      };

      const bird1X = (birdOffset * 1.4) % (width + 160) - 80;
      const bird2X = ((birdOffset * 1.1) + 260) % (width + 160) - 80;
      drawPixelBird(bird1X, height * 0.18 + Math.sin(birdOffset * 0.05) * 10);
      drawPixelBird(bird2X, height * 0.28 + Math.cos(birdOffset * 0.04) * 8);

      // GROUND / GRASS / MUD SETUP
      const groundHeight = height * 0.40;
      const groundY = height - groundHeight;

      // 5. CHARMING MOVING BUILDINGS & LANDMARKS (Pastel Glass & Sparkling Lights)
      cityOffset += 0.5;

      const totalCityWidth = 1800;
      const getLoopedX = (baseX: number) => {
        const offsetPos = (baseX - cityOffset) % totalCityWidth;
        return offsetPos < -300 ? offsetPos + totalCityWidth : offsetPos;
      };

      // --- Landmark 1: Empire State Building (New York) ---
      const drawEmpireState = (x: number, y: number, sizeScale: number) => {
        const h = 220 * sizeScale;
        const w = 50 * sizeScale;
        ctx.fillStyle = "#334155";
        ctx.fillRect(x - w / 2, y - h + h * 0.35, w, h * 0.65);
        ctx.fillRect(x - w * 0.35, y - h + h * 0.15, w * 0.7, h * 0.2);
        ctx.fillRect(x - w * 0.2, y - h + h * 0.05, w * 0.4, h * 0.1);
        ctx.fillStyle = "#94a3b8";
        ctx.fillRect(x - 3, y - h - 10, 6, 20);
        ctx.fillStyle = "#ef4444";
        ctx.fillRect(x - 2, y - h - 14, 4, 4);
        // Charming Cyan/Yellow Windows
        ctx.fillStyle = "#fef08a";
        for (let wy = y - h + h * 0.18; wy < y - 10; wy += 14) {
          ctx.fillRect(x - w * 0.25, wy, 5, 4);
          ctx.fillRect(x + w * 0.15, wy, 5, 4);
        }
      };

      // --- Landmark 2: Eiffel Tower (Paris) ---
      const drawEiffelTower = (x: number, y: number, sizeScale: number) => {
        const h = 240 * sizeScale;
        ctx.fillStyle = "#475569";
        ctx.fillRect(x - 35 * sizeScale, y - 45, 14 * sizeScale, 45);
        ctx.fillRect(x + 21 * sizeScale, y - 45, 14 * sizeScale, 45);
        ctx.fillRect(x - 28 * sizeScale, y - 55, 56 * sizeScale, 10);
        ctx.fillRect(x - 18 * sizeScale, y - 130, 36 * sizeScale, 75);
        ctx.fillRect(x - 14 * sizeScale, y - 140, 28 * sizeScale, 10);
        ctx.fillRect(x - 8 * sizeScale, y - 210, 16 * sizeScale, 70);
        ctx.fillStyle = "#cbd5e1";
        ctx.fillRect(x - 3, y - h, 6, 30);
        ctx.fillStyle = "#fef08a";
        ctx.fillRect(x - 5, y - h - 4, 10, 5);
      };

      // --- Landmark 3: Burj Khalifa (Dubai) ---
      const drawBurjKhalifa = (x: number, y: number, sizeScale: number) => {
        const h = 270 * sizeScale;
        ctx.fillStyle = "#1e293b";
        ctx.fillRect(x - 40 * sizeScale, y - h * 0.4, 80 * sizeScale, h * 0.4);
        ctx.fillStyle = "#334155";
        ctx.fillRect(x - 28 * sizeScale, y - h * 0.6, 56 * sizeScale, h * 0.2);
        ctx.fillStyle = "#475569";
        ctx.fillRect(x - 18 * sizeScale, y - h * 0.78, 36 * sizeScale, h * 0.18);
        ctx.fillStyle = "#64748b";
        ctx.fillRect(x - 10 * sizeScale, y - h * 0.92, 20 * sizeScale, h * 0.14);
        ctx.fillStyle = "#38bdf8";
        ctx.fillRect(x - 3, y - h, 6, 25);
        ctx.fillStyle = (Math.floor(Date.now() / 350) % 2 === 0) ? "#ef4444" : "#fee2e2";
        ctx.fillRect(x - 4, y - h - 5, 8, 5);
        // Charming Sparkling Golden Lights
        ctx.fillStyle = "#fde047";
        for (let wy = y - h * 0.88; wy < y - 15; wy += 14) {
          ctx.fillRect(x - 4, wy, 8, 4);
        }
      };

      // --- Landmark 4: Taipei 101 (Taiwan) ---
      const drawTaipei101 = (x: number, y: number, sizeScale: number) => {
        const h = 230 * sizeScale;
        ctx.fillStyle = "#0284c7";
        ctx.fillRect(x - 30 * sizeScale, y - 45, 60 * sizeScale, 45);
        for (let t = 0; t < 5; t++) {
          const tierY = y - 45 - (t + 1) * 32 * sizeScale;
          ctx.fillStyle = t % 2 === 0 ? "#0369a1" : "#38bdf8";
          ctx.fillRect(x - 24 * sizeScale, tierY, 48 * sizeScale, 32 * sizeScale);
          ctx.fillRect(x - 30 * sizeScale, tierY, 60 * sizeScale, 6 * sizeScale);
        }
        ctx.fillStyle = "#e0f2fe";
        ctx.fillRect(x - 4, y - h, 8, 30);
      };

      // --- Landmark 5: Great Pyramid of Giza (Egypt) ---
      const drawPyramid = (x: number, y: number, sizeScale: number) => {
        const h = 100 * sizeScale;
        ctx.fillStyle = "#d97706"; // Warm golden pyramid color
        const steps = 12;
        const stepH = h / steps;
        for (let s = 0; s < steps; s++) {
          const stepW = (140 * sizeScale) * (1 - s / steps);
          ctx.fillRect(x - stepW / 2, y - (s + 1) * stepH, stepW, stepH + 1);
        }
        ctx.fillStyle = "#fef08a";
        ctx.fillRect(x - 7, y - h - 4, 14, 5);
      };

      // --- Landmark 6: Modern Charming Glass Highrise ---
      const drawModernHighrise = (x: number, y: number, sizeScale: number) => {
        const h = 210 * sizeScale;
        const w = 65 * sizeScale;
        ctx.fillStyle = "#1e1b4b";
        ctx.fillRect(x - w / 2, y - h, w, h);
        ctx.fillStyle = "#38bdf8"; // Vibrant cyan glass windows
        for (let wy = y - h + 15; wy < y - 10; wy += 12) {
          for (let wx = x - w / 2 + 6; wx < x + w / 2 - 10; wx += 12) {
            ctx.fillRect(wx, wy, 8, 8);
          }
        }
      };

      // Draw all iconic landmark buildings closer together in different sizes
      drawEmpireState(getLoopedX(80), groundY, 0.9);
      drawModernHighrise(getLoopedX(240), groundY, 1.15);
      drawEiffelTower(getLoopedX(420), groundY, 0.85);
      drawBurjKhalifa(getLoopedX(650), groundY, 1.2);
      drawModernHighrise(getLoopedX(890), groundY, 0.8);
      drawTaipei101(getLoopedX(1080), groundY, 1.0);
      drawEmpireState(getLoopedX(1280), groundY, 1.1);
      drawPyramid(getLoopedX(1520), groundY, 0.95);

      // CHARMING SPARKLE PIXELS IN THE SKY
      const sparkles = [
        { x: (width * 0.15 + Math.sin(sparkleTimer) * 20) % width, y: height * 0.15 },
        { x: (width * 0.45 + Math.cos(sparkleTimer * 0.8) * 15) % width, y: height * 0.25 },
        { x: (width * 0.75 + Math.sin(sparkleTimer * 1.2) * 25) % width, y: height * 0.12 },
        { x: (width * 0.3 + Math.cos(sparkleTimer * 1.5) * 18) % width, y: height * 0.32 },
      ];

      sparkles.forEach((sp, idx) => {
        const opacity = (Math.sin(sparkleTimer * 3 + idx) + 1) / 2;
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity * 0.9})`;
        ctx.fillRect(sp.x, sp.y, 4, 4);
        ctx.fillRect(sp.x - 2, sp.y + 1, 8, 2);
        ctx.fillRect(sp.x + 1, sp.y - 2, 2, 8);
      });

      // 6. STANDSTILL (NOT MOVING) 40% HEIGHT GRASS & MUD PIXELS AT BOTTOM
      const mudHeight = groundHeight - 16;
      const mudY = height - mudHeight;
      ctx.fillStyle = "#38240f"; // Rich dark pixel mud earth
      ctx.fillRect(0, mudY, width, mudHeight);

      // Deep Mud Texture Speculars
      ctx.fillStyle = "#271809";
      for (let mx = 8; mx < width; mx += 20) {
        for (let my = mudY + 12; my < height - 6; my += 18) {
          if ((mx + my) % 3 === 0) {
            ctx.fillRect(mx, my, 4, 4);
            ctx.fillRect(mx + 6, my + 8, 3, 3);
          }
        }
      }

      // Base Grass Layer
      ctx.fillStyle = "#15803d"; // Dark green base
      ctx.fillRect(0, groundY, width, 16);

      ctx.fillStyle = "#22c55e"; // Bright vibrant grass top
      ctx.fillRect(0, groundY, width, 10);

      // Pixelated Grass Blade Tufts (STANDSTILL)
      ctx.fillStyle = "#4ade80"; // Light green highlights
      const tuftStep = 10;
      for (let gx = 0; gx < width; gx += tuftStep) {
        ctx.fillRect(gx, groundY - 6, 3, 6);
        ctx.fillRect(gx + 3, groundY - 8, 3, 8);
        ctx.fillRect(gx + 6, groundY - 4, 3, 4);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full block rounded-[32px]"
      style={{ imageRendering: "pixelated" }}
    />
  );
}
