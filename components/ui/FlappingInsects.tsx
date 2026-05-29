import React, { useRef, useEffect } from 'react';

interface Insect {
  x: number;
  y: number;
  vx: number;
  vy: number;
  type: 'book' | 'laptop';
  size: number;
  color: string;
  flapPhase: number;
  flapSpeed: number;
  flutterPhase: number;
  flutterSpeed: number;
  startled: boolean;
  stateTimer: number;
  uniqueId: number;
  // High-fidelity non-repeating orbit state variables
  orbitDirection: number; // 1 (Clockwise) or -1 (Counter-Clockwise)
  orbitRadius: number; // Current elliptical distance from light source
  targetRadius: number; // Slow-morph target to continuously shift flight paths
  orbitSpeed: number; // Speed at which the insect processes its polar angle
  angle: number; // Polar angle relative to light center
  verticalOffsetPhase: number; // Floating sine wave offset frequency
  verticalOffsetSpeed: number; // Speed of micro vertical drifts
}

interface FlappingInsectsProps {
  layer?: 'background' | 'foreground';
}

const FlappingInsects: React.FC<FlappingInsectsProps> = ({ layer = 'foreground' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Track mouse position
    const mouse = { x: -1000, y: -1000, active: false };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.active = true;
    };

    const handleMouseLeave = () => {
      mouse.active = false;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const insectColors = [
      '#ef4444', // Red cover
      '#a855f7', // Purple cover
      '#10b981', // Emerald cover
      '#3b82f6', // Sapphire blue cover
      '#f59e0b', // Amber/gold cover
    ];

    // Initialize flapping insects for this layer
    const insects: Insect[] = [];
    const totalInsects = layer === 'background' ? 10 : 9;
    for (let i = 0; i < totalInsects; i++) {
      const type = i % 2 === 0 ? 'book' : 'laptop';
      // Spawn them in a relaxed column directly under the central light (width/2)
      const spawnX = width * 0.35 + Math.random() * width * 0.3;
      const spawnY = height * 0.2 + Math.random() * height * 0.5;

      const startOrbitRadius = 80 + Math.random() * 190;

      insects.push({
        x: spawnX,
        y: spawnY,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4 - 0.2,
        type,
        size: type === 'book' ? 10 + Math.random() * 6 : 12 + Math.random() * 5,
        color: insectColors[i % insectColors.length],
        flapPhase: Math.random() * Math.PI * 2,
        // Slower majestic flapping
        flapSpeed: 0.04 + Math.random() * 0.04,
        flutterPhase: Math.random() * Math.PI * 2,
        // Slower fluttering waves
        flutterSpeed: 0.015 + Math.random() * 0.02,
        startled: false,
        stateTimer: 0,
        uniqueId: i + (layer === 'background' ? 100 : 200), // differentiate IDs to look random
        // Premium flight trajectories params
        orbitDirection: Math.random() > 0.55 ? 1 : -1,
        orbitRadius: startOrbitRadius,
        targetRadius: startOrbitRadius,
        orbitSpeed: 0.005 + Math.random() * 0.009,
        angle: Math.random() * Math.PI * 2,
        verticalOffsetPhase: Math.random() * Math.PI * 2,
        verticalOffsetSpeed: 0.002 + Math.random() * 0.004,
      });
    }

    // Simulation loop
    const updateAndDraw = (time: number) => {
      ctx.clearRect(0, 0, width, height);

      // Dynamically calculate mid-point in real-time so it handles maximized/minimized screens perfectly
      const lightSourceX = width / 2;
      const lightSourceY = -20; 

      // 1. Draw a soft light source aura/glow on canvas to complement the OGL shader
      const radialGlow = ctx.createRadialGradient(
        lightSourceX,
        0,
        20,
        lightSourceX,
        0,
        height * 0.4
      );
      radialGlow.addColorStop(0, 'rgba(168, 85, 247, 0.08)'); // soft purple core
      radialGlow.addColorStop(0.5, 'rgba(59, 130, 246, 0.02)'); // soft blue sheen
      radialGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = radialGlow;
      ctx.fillRect(0, 0, width, height);

      // 2. Process each insect
      insects.forEach((bug) => {
        // High-end non-repeating polar physics simulation
        // Increment polar orbit angle in its individualized direction (CW / CCW)
        bug.angle += bug.orbitSpeed * bug.orbitDirection;

        // Mutate floating vertical offset phase
        bug.verticalOffsetPhase += bug.verticalOffsetSpeed;
        const verticalDrip = Math.sin(bug.verticalOffsetPhase) * 55; // 3D height-swelling wave

        // Organic low-frequency breathing radius modulation so it never repeats a static circle
        const breathingPhase = time * 0.0009 + bug.uniqueId * 4.71;
        const dynamicallyMorphedRadius = bug.orbitRadius + Math.sin(breathingPhase) * 40;

        // Subtly float individual orbit centers to simulate realistic insect swarming drifts
        const swarmingCenterX = Math.sin(time * 0.0005 + bug.uniqueId * 12) * 20;
        const swarmingCenterY = Math.cos(time * 0.0004 + bug.uniqueId * 8) * 15;

        // Target coordinates located in an angled, tilted 3D elliptical plane orbiting the lamp rays
        const targetX = lightSourceX + swarmingCenterX + Math.cos(bug.angle) * dynamicallyMorphedRadius;
        // Offset +130 keeps them floating prominently in the visible column inside/under the light rays
        const targetY = lightSourceY + 130 + swarmingCenterY + Math.sin(bug.angle) * (dynamicallyMorphedRadius * 0.42) + verticalDrip;

        // Compute displacement to current orbit target
        const tax = targetX - bug.x;
        const tay = targetY - bug.y;
        const distToTarget = Math.sqrt(tax * tax + tay * tay) || 1;

        // Viscous, elegant acceleration towards the shifting circular target
        let forceX = (tax / distToTarget) * 0.038;
        let forceY = (tay / distToTarget) * 0.038;

        // Minor local wind flutter noise
        bug.flutterPhase += bug.flutterSpeed;
        const flutterX = Math.sin(bug.flutterPhase + bug.uniqueId) * 0.03;
        const flutterY = Math.cos(bug.flutterPhase * 1.5) * 0.03;
        forceX += flutterX;
        forceY += flutterY;

        // Handle Mouse Interaction (Startle/Repulse)
        if (mouse.active) {
          const mdx = bug.x - mouse.x;
          const mdy = bug.y - mouse.y;
          const distToMouse = Math.sqrt(mdx * mdx + mdy * mdy);

          if (distToMouse < 130) {
            bug.startled = true;
            bug.stateTimer = 60; // Active panic frames
          }
        }

        if (bug.startled && bug.stateTimer > 0) {
          bug.stateTimer--;
          // Calculate vector away from mouse
          const mdx = bug.x - mouse.x;
          const mdy = bug.y - (mouse.y - 15); // slightly offset focus center
          const distToMouse = Math.sqrt(mdx * mdx + mdy * mdy) || 1;

          // Launch outward with decaying intensity and highly erratic fluttering
          const panicMult = bug.stateTimer / 60;
          const startleFlutterX = Math.sin(time * 0.15 + bug.uniqueId) * 1.6 * panicMult;
          const startleFlutterY = Math.cos(time * 0.12 + bug.uniqueId) * 1.6 * panicMult;

          forceX += (mdx / distToMouse) * 1.9 * panicMult + startleFlutterX;
          forceY += (mdy / distToMouse) * 1.9 * panicMult + startleFlutterY;

          // Rapid flapping state
          bug.flapPhase += bug.flapSpeed * 2.5;
        } else {
          bug.startled = false;
          // Normal elegant flapping state
          bug.flapPhase += bug.flapSpeed;
        }

        // Apply forces to velocity
        bug.vx += forceX;
        bug.vy += forceY;

        // Limit maximum velocities for incredibly smooth, luxury-tier flight
        const maxSpeed = bug.startled ? 4.2 : 1.35;
        const currentSpeed = Math.sqrt(bug.vx * bug.vx + bug.vy * bug.vy) || 1;
        if (currentSpeed > maxSpeed) {
          bug.vx = (bug.vx / currentSpeed) * maxSpeed;
          bug.vy = (bug.vy / currentSpeed) * maxSpeed;
        }

        // Solid dampening / high viscosity for fluid inertia
        bug.vx *= 0.968;
        bug.vy *= 0.968;

        // Apply displacement
        bug.x += bug.vx;
        bug.y += bug.vy;

        // Boundaries checks and soft respawn
        if (bug.x < -60) bug.x = width + 40;
        if (bug.x > width + 60) bug.x = -40;
        if (bug.y < -60) {
          // Relocate at lower half with fresh upward momentum
          bug.y = height + 20;
          bug.x = width * 0.15 + Math.random() * width * 0.7;
          bug.vy = -0.6;
        }
        if (bug.y > height + 60) {
          bug.y = -40;
          bug.vy = 0.6;
        }

        // --- DRAW RENDERING SECTION ---
        ctx.save();
        ctx.translate(bug.x, bug.y);

        // Rotate in direction of travel
        const travelAngle = Math.atan2(bug.vy, bug.vx);
        // We offset by Math.PI/2 because top-center pointing is default rotation
        ctx.rotate(travelAngle + Math.PI / 2);

        const flapProgression = Math.sin(bug.flapPhase);

        if (bug.type === 'book') {
          // --- RENDER FLAPPING BOOK (Deluxe $10k Gold-Gilt Journal Design) ---
          const size = bug.size;
          const wingWidth = size * 0.85 * (0.35 + 0.65 * (1.0 - Math.abs(flapProgression)));
          const wingHeight = size;

          // 1. Hardback cover shadow
          ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
          ctx.shadowBlur = 10;
          ctx.shadowOffsetY = 4;

          // 2. Beautiful Cover Gradients for Left and Right curves
          const leftCoverGrad = ctx.createLinearGradient(-wingWidth - 1.5, 0, 0, 0);
          leftCoverGrad.addColorStop(0, bug.color); 
          leftCoverGrad.addColorStop(0.85, bug.color);
          leftCoverGrad.addColorStop(1, '#0c0a09'); // dark hand-sewn leather crease shading

          const rightCoverGrad = ctx.createLinearGradient(0, 0, wingWidth + 1.5, 0);
          rightCoverGrad.addColorStop(0, '#0c0a09'); 
          rightCoverGrad.addColorStop(0.15, bug.color);
          rightCoverGrad.addColorStop(1, bug.color);

          // Draw left bent cover
          ctx.fillStyle = leftCoverGrad;
          ctx.beginPath();
          ctx.moveTo(0, -wingHeight / 2 - 1.2);
          ctx.lineTo(-wingWidth - 1.8, -wingHeight / 2 - 0.6 + flapProgression * 1.5);
          ctx.lineTo(-wingWidth - 1.8, wingHeight / 2 + 0.6 + flapProgression * 1.5);
          ctx.lineTo(0, wingHeight / 2 + 1.2);
          ctx.closePath();
          ctx.fill();

          // Draw right bent cover
          ctx.fillStyle = rightCoverGrad;
          ctx.beginPath();
          ctx.moveTo(0, -wingHeight / 2 - 1.2);
          ctx.lineTo(wingWidth + 1.8, -wingHeight / 2 - 0.6 + flapProgression * 1.5);
          ctx.lineTo(wingWidth + 1.8, wingHeight / 2 + 0.6 + flapProgression * 1.5);
          ctx.lineTo(0, wingHeight / 2 + 1.2);
          ctx.closePath();
          ctx.fill();

          // Reset shadows for inner detail crispness
          ctx.shadowColor = 'transparent';
          ctx.shadowBlur = 0;
          ctx.shadowOffsetY = 0;

          // 3. Luxurious Gold-Foil Filigree Trim on Left/Right borders
          if (wingWidth > 7) {
            ctx.strokeStyle = '#f59e0b'; // Amber Gold Leaf
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            // Left page cover line
            ctx.moveTo(-wingWidth - 1, -wingHeight / 2 + 1 + flapProgression * 1.5);
            ctx.lineTo(-2.5, -wingHeight / 2 + 0.5);
            ctx.lineTo(-2.5, wingHeight / 2 - 0.5);
            ctx.lineTo(-wingWidth - 1, wingHeight / 2 - 1 + flapProgression * 1.5);
            
            // Right page cover line
            ctx.moveTo(wingWidth + 1, -wingHeight / 2 + 1 + flapProgression * 1.5);
            ctx.lineTo(2.5, -wingHeight / 2 + 0.5);
            ctx.lineTo(2.5, wingHeight / 2 - 0.5);
            ctx.lineTo(wingWidth + 1, wingHeight / 2 - 1 + flapProgression * 1.5);
            ctx.stroke();
          }

          // 4. Draw page sheets (Royal Cream/Parchment with Spine-Crease Shading)
          const leftPageGrad = ctx.createLinearGradient(-wingWidth, 0, 0, 0);
          leftPageGrad.addColorStop(0, '#fbfbf9'); // royal warm cream edge
          leftPageGrad.addColorStop(1, '#e2e0d9'); // darker shadow inside fold

          const rightPageGrad = ctx.createLinearGradient(0, 0, wingWidth, 0);
          rightPageGrad.addColorStop(0, '#e2e0d9');
          rightPageGrad.addColorStop(1, '#fbfbf9');

          // Left wing page
          ctx.fillStyle = leftPageGrad;
          ctx.beginPath();
          ctx.moveTo(0, -wingHeight / 2);
          ctx.lineTo(-wingWidth, -wingHeight / 2 + flapProgression * 1.5);
          ctx.lineTo(-wingWidth, wingHeight / 2 + flapProgression * 1.5);
          ctx.lineTo(0, wingHeight / 2);
          ctx.closePath();
          ctx.fill();

          // Right wing page
          ctx.fillStyle = rightPageGrad;
          ctx.beginPath();
          ctx.moveTo(0, -wingHeight / 2);
          ctx.lineTo(wingWidth, -wingHeight / 2 + flapProgression * 1.5);
          ctx.lineTo(wingWidth, wingHeight / 2 + flapProgression * 1.5);
          ctx.lineTo(0, wingHeight / 2);
          ctx.closePath();
          ctx.fill();

          // 5. Bright Gilt Gold Edge trace (deluxe gilded leaf margins)
          ctx.strokeStyle = '#fbbf24'; // beautiful bright gold
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(-wingWidth, -wingHeight / 2 + flapProgression * 1.5);
          ctx.lineTo(-wingWidth, wingHeight / 2 + flapProgression * 1.5);
          ctx.moveTo(wingWidth, -wingHeight / 2 + flapProgression * 1.5);
          ctx.lineTo(wingWidth, wingHeight / 2 + flapProgression * 1.5);
          ctx.stroke();

          // 6. Delicate Page script decoration lines (whispering knowledge)
          if (wingWidth > 6) {
            ctx.strokeStyle = 'rgba(78, 71, 62, 0.25)'; // muted sepia ink
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            // Left page lines
            ctx.moveTo(-wingWidth + 2.5, -wingHeight / 3 + flapProgression);
            ctx.lineTo(-2, -wingHeight / 3);
            ctx.moveTo(-wingWidth + 3.5, 0 + flapProgression);
            ctx.lineTo(-2, 0);
            ctx.moveTo(-wingWidth + 2.5, wingHeight / 3 + flapProgression);
            ctx.lineTo(-3, wingHeight / 3);
            
            // Right page lines
            ctx.moveTo(2, -wingHeight / 3);
            ctx.lineTo(wingWidth - 2.5, -wingHeight / 3 + flapProgression);
            ctx.moveTo(2, 0);
            ctx.lineTo(wingWidth - 3.5, 0 + flapProgression);
            ctx.moveTo(3, wingHeight / 3);
            ctx.lineTo(wingWidth - 2.5, wingHeight / 3 + flapProgression);
            ctx.stroke();
          }

          // 7. Hand-stitched leather spine thread line
          ctx.fillStyle = '#1c1917';
          ctx.fillRect(-0.6, -wingHeight / 2 - 1.2, 1.2, wingHeight + 2.4);

          ctx.strokeStyle = '#d97706'; // thin golden leather stitching accent
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(0, -wingHeight / 2 - 1.2);
          ctx.lineTo(0, wingHeight / 2 + 1.2);
          ctx.stroke();

          // 8. Elegant fluid flowing bookmark silk ribbon (trails graciously behind)
          ctx.strokeStyle = '#dc2626'; // Imperial Red ribbon
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(0, wingHeight / 2);
          const wave1 = Math.sin(time * 0.008 + bug.uniqueId) * 4;
          const wave2 = Math.cos(time * 0.012 + bug.uniqueId) * 5;
          ctx.bezierCurveTo(
            wave1, 
            wingHeight / 2 + size * 0.4, 
            wave2, 
            wingHeight / 2 + size * 0.8, 
            wave1 * 1.5, 
            wingHeight / 2 + size * 1.4
          );
          ctx.stroke();

        } else {
          // --- RENDER FLAPPING LAPTOP (Premium Cyberpunk Workspace Design) ---
          const size = bug.size;
          const keyboardW = size * 0.95;
          const keyboardH = size * 0.55;
          const screenH = size * 0.85;
          
          // Determine active view dimension
          // Positive flapProgression renders INSIDE view (Keyboard deck & active screen display)
          // Negative flapProgression renders OUTSIDE view (Sleek anodized metallic top lid)
          const isInsideView = flapProgression >= 0;
          const screenProjection = Math.abs(flapProgression);
          const baseScreenY = -screenH * screenProjection;

          if (isInsideView) {
            // A. INSIDE LAPTOP FRAME VIEW
            // 1. Frame base shadow
            ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
            ctx.shadowBlur = 8;
            ctx.shadowOffsetY = 3;

            // 2. High-precision Space Gray Anodized Aluminium Keyboard Deck
            const deckGrad = ctx.createLinearGradient(-keyboardW/2, 0, keyboardW/2, keyboardH);
            deckGrad.addColorStop(0, '#475569'); // slate-600
            deckGrad.addColorStop(0.5, '#334155'); // slate-700
            deckGrad.addColorStop(1, '#1e293b'); // slate-800
            ctx.fillStyle = deckGrad;
            
            ctx.beginPath();
            ctx.moveTo(-keyboardW / 2, 0);
            ctx.lineTo(keyboardW / 2, 0);
            ctx.lineTo(keyboardW / 2.3, keyboardH);
            ctx.lineTo(-keyboardW / 2.3, keyboardH);
            ctx.closePath();
            ctx.fill();

            // Clear shadow for tiny component graphics
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
            ctx.shadowOffsetY = 0;

            // 3. Precision Backlit Keyboard matrix grid plate
            ctx.fillStyle = '#0f172a'; // rich deep slate-900 backplate
            ctx.beginPath();
            ctx.moveTo(-keyboardW / 2.6, keyboardH * 0.15);
            ctx.lineTo(keyboardW / 2.6, keyboardH * 0.15);
            ctx.lineTo(keyboardW / 2.8, keyboardH * 0.65);
            ctx.lineTo(-keyboardW / 2.8, keyboardH * 0.65);
            ctx.closePath();
            ctx.fill();

            // Symmetrical, blinking glowing hot keys (Blue, cyan, purple cyberpunk vibe)
            ctx.fillStyle = bug.startled ? '#a855f7' : '#38bdf8'; // turns violet when mouse startles
            ctx.fillRect(-keyboardW / 3.4, keyboardH * 0.25, 2, 1.2);
            ctx.fillRect(-keyboardW / 4.4, keyboardH * 0.25, 2.5, 1.2);
            ctx.fillRect(-keyboardW / 6.5, keyboardH * 0.25, 2, 1.2);
            ctx.fillRect(-keyboardW / 14, keyboardH * 0.25, 3, 1.2);
            ctx.fillRect(keyboardW / 18, keyboardH * 0.25, 2, 1.2);
            ctx.fillRect(keyboardW / 4.8, keyboardH * 0.25, 2.5, 1.2);
            ctx.fillRect(keyboardW / 3.2, keyboardH * 0.25, 2, 1.2);

            ctx.fillStyle = bug.startled ? '#ec4899' : '#04d9ff';
            ctx.fillRect(-keyboardW / 3.2, keyboardH * 0.42, 3, 1.2);
            ctx.fillRect(-keyboardW / 5.2, keyboardH * 0.42, 2.2, 1.2);
            ctx.fillRect(-keyboardW / 10, keyboardH * 0.42, 4, 1.2); // space key
            ctx.fillRect(keyboardW / 8, keyboardH * 0.42, 2, 1.2);
            ctx.fillRect(keyboardW / 4.0, keyboardH * 0.42, 3, 1.2);

            // 4. Elegant Glowing Trackpad Outline
            ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)'; // cyan stroke edge
            ctx.lineWidth = 0.5;
            ctx.strokeRect(-keyboardW / 7, keyboardH * 0.72, (keyboardW / 3.5), keyboardH * 0.18);

            // 5. Glassmorphism Active Display Panel (extends upward/backward)
            ctx.fillStyle = '#1e293b'; // screen bezel chassis
            ctx.beginPath();
            ctx.moveTo(-keyboardW / 2, 0);
            ctx.lineTo(keyboardW / 2, 0);
            ctx.lineTo(keyboardW / 2.22, baseScreenY);
            ctx.lineTo(-keyboardW / 2.22, baseScreenY);
            ctx.closePath();
            ctx.fill();

            // Retinal cybernetic screen glass gradient (Cyan-to-Royal Indigo display glow)
            const monitorGlow = ctx.createLinearGradient(0, -1, 0, baseScreenY);
            monitorGlow.addColorStop(0, '#020617'); // slate-950 bottom bezel hinge
            monitorGlow.addColorStop(0.35, 'rgba(8, 145, 178, 0.8)'); // deep cyan glass
            monitorGlow.addColorStop(1, 'rgba(99, 102, 241, 0.9)'); // luminous radiant indigo top

            ctx.fillStyle = monitorGlow;
            ctx.beginPath();
            ctx.moveTo(-keyboardW / 2.35, -2);
            ctx.lineTo(keyboardW / 2.35, -2);
            ctx.lineTo(keyboardW / 2.5, baseScreenY + 1.8);
            ctx.lineTo(-keyboardW / 2.5, baseScreenY + 1.8);
            ctx.closePath();
            ctx.fill();

            // Micro-display details (tiny code block glowing lines)
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 0.7;
            ctx.beginPath();
            // Code line graphs
            ctx.moveTo(-keyboardW / 4, baseScreenY * 0.4);
            ctx.lineTo(-keyboardW / 8, baseScreenY * 0.4);
            ctx.moveTo(-keyboardW / 4, baseScreenY * 0.55);
            ctx.lineTo(-keyboardW / 14, baseScreenY * 0.55);
            ctx.moveTo(-keyboardW / 5, baseScreenY * 0.7);
            ctx.lineTo(-keyboardW / 9, baseScreenY * 0.7);
            ctx.stroke();

            // Right side micro chart lines (cyan radar)
            ctx.strokeStyle = 'rgba(236, 72, 153, 0.7)'; // neon pink chart
            ctx.beginPath();
            ctx.arc(keyboardW / 5, baseScreenY * 0.55, size * 0.15, 0, Math.PI * 1.3);
            ctx.stroke();

            // Screen bevel camera notch dot
            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.arc(0, baseScreenY + 1, 0.6, 0, Math.PI * 2);
            ctx.fill();

            // Screen reflection gloss highlight
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(-keyboardW / 4.4, baseScreenY + 3.5);
            ctx.lineTo(keyboardW / 4.4, -4);
            ctx.stroke();

            // 6. Volumetric light projection casting off screen towards center (very premium)
            const lightRayCast = ctx.createLinearGradient(0, 0, 0, baseScreenY * 2.8);
            lightRayCast.addColorStop(0, 'rgba(6, 182, 212, 0.25)'); // glowing cyan source code beam
            lightRayCast.addColorStop(1, 'rgba(168, 85, 247, 0)'); // dissipates to cosmic purple
            ctx.fillStyle = lightRayCast;
            ctx.beginPath();
            ctx.moveTo(-keyboardW / 2.4, baseScreenY);
            ctx.lineTo(-keyboardW * 1.8, baseScreenY * 2.8);
            ctx.lineTo(keyboardW * 1.8, baseScreenY * 2.8);
            ctx.lineTo(keyboardW / 2.4, baseScreenY);
            ctx.closePath();
            ctx.fill();

          } else {
            // B. OUTSIDE LAPTOP LID VIEW (Top outer casing + metallic hinges)
            // 1. Frame base shadow
            ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
            ctx.shadowBlur = 10;
            ctx.shadowOffsetY = 4;

            // 2. Bottom Laptop chassis base (facing away)
            ctx.fillStyle = '#1e293b'; // Dark obsidian underside
            ctx.beginPath();
            ctx.moveTo(-keyboardW / 2, 0);
            ctx.lineTo(keyboardW / 2, 0);
            ctx.lineTo(keyboardW / 2.3, keyboardH);
            ctx.lineTo(-keyboardW / 2.3, keyboardH);
            ctx.closePath();
            ctx.fill();

            // Tiny custom cooling vents and rubber grips on back
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(-keyboardW / 3, keyboardH * 0.3, keyboardW * 0.66, 1.5);
            ctx.fillRect(-keyboardW / 3, keyboardH * 0.45, keyboardW * 0.66, 1.5);
            // Non-slip rubber pads
            ctx.fillStyle = '#020617';
            ctx.beginPath();
            ctx.arc(-keyboardW / 3.2, keyboardH * 0.75, 1.2, 0, Math.PI * 2);
            ctx.arc(keyboardW / 3.2, keyboardH * 0.75, 1.2, 0, Math.PI * 2);
            ctx.fill();

            // Clear shadow
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
            ctx.shadowOffsetY = 0;

            // 3. Outer Aluminum Top Lid (folded downward showing back face)
            const anodizedLidGrad = ctx.createLinearGradient(-keyboardW/2, 0, keyboardW/2, baseScreenY);
            anodizedLidGrad.addColorStop(0, '#475569'); // rich graphite gray
            anodizedLidGrad.addColorStop(0.5, '#334155'); 
            anodizedLidGrad.addColorStop(1, '#0f172a'); // metal depth highlights
            
            ctx.fillStyle = anodizedLidGrad;
            ctx.beginPath();
            ctx.moveTo(-keyboardW / 2, 0);
            ctx.lineTo(keyboardW / 2, 0);
            ctx.lineTo(keyboardW / 2.18, baseScreenY);
            ctx.lineTo(-keyboardW / 2.18, baseScreenY);
            ctx.closePath();
            ctx.fill();

            // 4. Glowing futuristic core brand emblem (pulsing logo in the lid center!)
            const pulsarScale = 0.4 + 0.15 * Math.sin(time * 0.008 + bug.uniqueId);
            const brandY = baseScreenY * 0.52;
            
            // Outer glowing ring
            const logoGlowRadial = ctx.createRadialGradient(0, brandY, 1, 0, brandY, size * 0.45);
            logoGlowRadial.addColorStop(0, 'rgba(6, 182, 212, 0.9)'); // Cyan flame core
            logoGlowRadial.addColorStop(0.5, 'rgba(168, 85, 247, 0.45)');
            logoGlowRadial.addColorStop(1, 'rgba(0, 0, 0, 0)');
            
            ctx.fillStyle = logoGlowRadial;
            ctx.beginPath();
            ctx.arc(0, brandY, size * 0.45 * pulsarScale, 0, Math.PI * 2);
            ctx.fill();

            // Symmetrical micro geometric diamond mark inside brand ring
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.moveTo(0, brandY - size * 0.12 * pulsarScale);
            ctx.lineTo(size * 0.08 * pulsarScale, brandY);
            ctx.lineTo(0, brandY + size * 0.12 * pulsarScale);
            ctx.lineTo(-size * 0.08 * pulsarScale, brandY);
            ctx.closePath();
            ctx.fill();
          }
        }

        ctx.restore();
      });

      animationId = requestAnimationFrame(updateAndDraw);
    };

    animationId = requestAnimationFrame(updateAndDraw);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full pointer-events-none ${
        layer === 'background' ? 'z-15' : 'z-30'
      }`}
      id={`canvas-flapping-insects-${layer}`}
    />
  );
};

export default FlappingInsects;
