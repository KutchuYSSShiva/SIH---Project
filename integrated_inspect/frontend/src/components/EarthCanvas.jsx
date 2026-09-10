import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import * as THREE from 'three';

// Procedural High-Definition Photorealistic Earth Texture Generator
function createEarthTextures() {
  const width = 2048;
  const height = 1024;

  // 1. Earth Surface Map (Oceans, Continents, Terrain, India Subcontinent)
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // Deep ocean gradient
  const oceanGrad = ctx.createLinearGradient(0, 0, 0, height);
  oceanGrad.addColorStop(0, '#041833');
  oceanGrad.addColorStop(0.5, '#0a2e5c');
  oceanGrad.addColorStop(1, '#041833');
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, 0, width, height);

  // Helper to draw continent landmass blobs
  function drawLandmass(x, y, w, h, color, subColor) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(x, y, w, h, 0, 0, Math.PI * 2);
    ctx.fill();

    if (subColor) {
      ctx.fillStyle = subColor;
      ctx.beginPath();
      ctx.ellipse(x + w * 0.1, y - h * 0.1, w * 0.6, h * 0.6, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Draw Continents roughly scaled
  // Eurasia & Asia
  drawLandmass(1350, 360, 320, 160, '#2d5a27', '#4b6f38');
  drawLandmass(1200, 320, 200, 120, '#38662e', '#597a3f');
  // Europe
  drawLandmass(1080, 280, 120, 90, '#3b6e2e', '#2c5422');
  // Africa & Sahara Desert
  drawLandmass(1060, 520, 140, 190, '#735f32', '#997e42');
  // North America
  drawLandmass(480, 320, 220, 150, '#35632a', '#4f753c');
  // South America
  drawLandmass(620, 640, 130, 210, '#205224', '#1b451e');
  // Australia
  drawLandmass(1680, 680, 130, 95, '#856434', '#a67d42');
  // Antarctica Ice Shelf
  drawLandmass(1024, 980, 950, 70, '#d9e7f5', '#edf4fc');
  // Arctic Ice Shelf
  drawLandmass(1024, 40, 850, 45, '#d9e7f5', '#edf4fc');

  // Specific Detailed India Peninsula Landmass
  // Positioned around longitude 78°E (approx x: 1390, y: 440)
  ctx.save();
  ctx.fillStyle = '#2e6b2c';
  ctx.beginPath();
  ctx.moveTo(1330, 390); // Gujarat / West
  ctx.lineTo(1460, 390); // Bengal / East
  ctx.lineTo(1480, 420); // Odisha coast
  ctx.lineTo(1440, 460); // Andhra Coast / Bay of Bengal
  ctx.lineTo(1395, 530); // Kanyakumari / South Tip
  ctx.lineTo(1360, 460); // Kerala & Malabar
  ctx.lineTo(1340, 420); // Maharashtra coast
  ctx.closePath();
  ctx.fill();

  // Himalayas & Tibetan Plateau (Snow caps)
  ctx.fillStyle = '#e2ecf5';
  ctx.beginPath();
  ctx.ellipse(1400, 375, 90, 22, -0.05, 0, Math.PI * 2);
  ctx.fill();

  // Thar Desert & Deccan Plateau Tint
  ctx.fillStyle = '#9e8149';
  ctx.beginPath();
  ctx.ellipse(1355, 410, 25, 20, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Subtle land noise & terrain variations
  for (let i = 0; i < 400; i++) {
    const rx = Math.random() * width;
    const ry = Math.random() * height;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.fillRect(rx, ry, Math.random() * 8, Math.random() * 8);
  }

  const surfaceTexture = new THREE.CanvasTexture(canvas);
  surfaceTexture.wrapS = THREE.RepeatWrapping;
  surfaceTexture.wrapT = THREE.ClampToEdgeWrapping;

  // 2. Cloud Layer Texture
  const cloudCanvas = document.createElement('canvas');
  cloudCanvas.width = 1024;
  cloudCanvas.height = 512;
  const cCtx = cloudCanvas.getContext('2d');
  cCtx.fillStyle = '#000000';
  cCtx.fillRect(0, 0, 1024, 512);

  // Cloud swirls & cyclone spiral simulation
  for (let i = 0; i < 90; i++) {
    const cx = Math.random() * 1024;
    const cy = Math.random() * 512;
    const rad = 25 + Math.random() * 60;
    const grad = cCtx.createRadialGradient(cx, cy, 0, cx, cy, rad);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.65)');
    grad.addColorStop(0.5, 'rgba(255, 255, 255, 0.35)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    cCtx.fillStyle = grad;
    cCtx.beginPath();
    cCtx.arc(cx, cy, rad, 0, Math.PI * 2);
    cCtx.fill();
  }

  // Cyclone spiral near Bay of Bengal
  const spiralX = 690;
  const spiralY = 220;
  for (let a = 0; a < Math.PI * 4; a += 0.3) {
    const r = a * 6;
    const px = spiralX + Math.cos(a) * r;
    const py = spiralY + Math.sin(a) * r;
    cCtx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    cCtx.beginPath();
    cCtx.arc(px, py, 12, 0, Math.PI * 2);
    cCtx.fill();
  }

  const cloudTexture = new THREE.CanvasTexture(cloudCanvas);
  cloudTexture.wrapS = THREE.RepeatWrapping;
  cloudTexture.wrapT = THREE.ClampToEdgeWrapping;

  return { surfaceTexture, cloudTexture };
}

// 3D Realistic Earth Component
function Earth() {
  const earthRef = useRef();
  const cloudsRef = useRef();

  const { surfaceTexture, cloudTexture } = useMemo(() => createEarthTextures(), []);

  useFrame((_, delta) => {
    // Smooth, pure horizontal rotation around Y axis
    if (earthRef.current) {
      earthRef.current.rotation.y += delta * 0.04;
    }
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += delta * 0.055;
    }
  });

  return (
    // Earth tilted at standard 23.4° axial tilt
    <group position={[1.5, 0, 0]} rotation={[0.2, 0, -0.15]}>
      {/* 1. Earth Surface */}
      <mesh ref={earthRef}>
        <sphereGeometry args={[2.3, 64, 64]} />
        <meshStandardMaterial
          map={surfaceTexture}
          roughness={0.65}
          metalness={0.1}
        />
      </mesh>

      {/* 2. Cloud Layer */}
      <mesh ref={cloudsRef}>
        <sphereGeometry args={[2.33, 64, 64]} />
        <meshStandardMaterial
          map={cloudTexture}
          transparent={true}
          opacity={0.45}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* 3. Atmospheric Outer Glow */}
      <mesh>
        <sphereGeometry args={[2.42, 64, 64]} />
        <meshStandardMaterial
          color="#38bdf8"
          transparent={true}
          opacity={0.22}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* 4. Subtle Inner Atmosphere Rim */}
      <mesh>
        <sphereGeometry args={[2.31, 64, 64]} />
        <meshBasicMaterial
          color="#0284c7"
          transparent={true}
          opacity={0.15}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

// Stationary / Fixed Satellite stationed in the right empty space with gentle zero-g hover
function FixedSatellite() {
  const satGroup = useRef();

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    // Gentle hovering in place (zero-g stationary stationing)
    if (satGroup.current) {
      satGroup.current.position.y = 1.3 + Math.sin(t * 1.2) * 0.06;
      satGroup.current.rotation.z = Math.sin(t * 0.8) * 0.03;
      satGroup.current.rotation.x = 0.15 + Math.cos(t * 0.6) * 0.02;
    }
  });

  return (
    <group ref={satGroup} position={[3.8, 1.3, 0.5]} rotation={[0.15, -0.4, 0]}>
      {/* Satellite Main Chassis */}
      <mesh>
        <boxGeometry args={[0.35, 0.45, 0.5]} />
        <meshStandardMaterial color="#e2e8f0" metalness={0.95} roughness={0.15} />
      </mesh>

      {/* Gold Thermal Foil Accent */}
      <mesh position={[0, 0.1, 0.26]}>
        <planeGeometry args={[0.25, 0.25]} />
        <meshStandardMaterial color="#f59e0b" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Left Solar Panel Array */}
      <group position={[-0.8, 0, 0]}>
        <mesh>
          <boxGeometry args={[1.0, 0.02, 0.4]} />
          <meshStandardMaterial color="#0284c7" metalness={0.85} roughness={0.2} />
        </mesh>
        {/* Panel Support Arm */}
        <mesh position={[0.55, 0, 0]}>
          <cylinderGeometry args={[0.015, 0.015, 0.2]} rotation={[0, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#64748b" metalness={0.8} />
        </mesh>
      </group>

      {/* Right Solar Panel Array */}
      <group position={[0.8, 0, 0]}>
        <mesh>
          <boxGeometry args={[1.0, 0.02, 0.4]} />
          <meshStandardMaterial color="#0284c7" metalness={0.85} roughness={0.2} />
        </mesh>
        {/* Panel Support Arm */}
        <mesh position={[-0.55, 0, 0]}>
          <cylinderGeometry args={[0.015, 0.015, 0.2]} rotation={[0, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#64748b" metalness={0.8} />
        </mesh>
      </group>

      {/* Telecommunication Parabolic Dish */}
      <mesh position={[0, 0.32, -0.1]} rotation={[-Math.PI / 3, 0, 0]}>
        <coneGeometry args={[0.22, 0.08, 24, 1, true]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.9} side={THREE.DoubleSide} />
      </mesh>

      {/* Downward Optical Weather Sensor Scanning Cones */}
      <mesh position={[0, -0.4, 0.1]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.3, 0.6, 24]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.25} side={THREE.DoubleSide} />
      </mesh>

      {/* Telemetry Status LED */}
      <mesh position={[0.12, 0.2, 0.26]}>
        <sphereGeometry args={[0.025, 12, 12]} />
        <meshBasicMaterial color="#10b981" />
      </mesh>
    </group>
  );
}

export default function EarthCanvas() {
  return (
    <div className="absolute inset-0 w-full h-full pointer-events-auto">
      <Canvas camera={{ position: [0, 0, 6.2], fov: 45 }}>
        {/* Lights */}
        <ambientLight intensity={0.5} />
        <directionalLight position={[6, 3, 4]} intensity={2.4} color="#ffffff" />
        <directionalLight position={[-6, -2, -3]} intensity={0.3} color="#0369a1" />
        <pointLight position={[3.8, 1.3, 1.2]} intensity={0.6} color="#38bdf8" />

        {/* Realistic Space Starfield */}
        <Stars radius={120} depth={60} count={3500} factor={4} saturation={0} fade speed={0.6} />

        {/* 3D Rotating Earth */}
        <Earth />

        {/* Fixed Stationed Satellite at Right */}
        <FixedSatellite />
      </Canvas>
    </div>
  );
}
