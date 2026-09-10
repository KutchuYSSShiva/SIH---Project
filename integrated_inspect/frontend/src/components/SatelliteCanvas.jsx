import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

// Realistic NASA-style Meteorological Satellite Component
function SatelliteModel({ mouseNorm }) {
  const groupRef = useRef();
  const solarLeftRef = useRef();
  const solarRightRef = useRef();
  const dishRef = useRef();

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (!groupRef.current) return;

    // Smooth responsive rotation following mouse coordinates
    const targetX = mouseNorm.current.y * 0.35 + Math.sin(t * 0.4) * 0.05;
    const targetY = mouseNorm.current.x * 0.5 + t * 0.12;

    groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetX, 0.05);
    groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetY, 0.05);

    // Gentle solar panel animation
    if (solarLeftRef.current && solarRightRef.current) {
      solarLeftRef.current.rotation.y = Math.sin(t * 0.6) * 0.1;
      solarRightRef.current.rotation.y = -Math.sin(t * 0.6) * 0.1;
    }

    // Dish scanning movement
    if (dishRef.current) {
      dishRef.current.rotation.x = -Math.PI / 4 + Math.sin(t) * 0.08;
      dishRef.current.rotation.z = Math.cos(t * 0.8) * 0.1;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]} scale={[1.2, 1.2, 1.2]}>
      {/* Main Satellite Body (Spacecraft Bus) */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1, 1.2, 1]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Gold Thermal Insulation (MLI) Blankets */}
      <mesh position={[0, 0, 0.51]}>
        <planeGeometry args={[0.95, 1.15]} />
        <meshStandardMaterial color="#f59e0b" metalness={0.8} roughness={0.3} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0, -0.51]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[0.95, 1.15]} />
        <meshStandardMaterial color="#f59e0b" metalness={0.8} roughness={0.3} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0.51, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[0.95, 1.15]} />
        <meshStandardMaterial color="#f59e0b" metalness={0.8} roughness={0.3} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[-0.51, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[0.95, 1.15]} />
        <meshStandardMaterial color="#f59e0b" metalness={0.8} roughness={0.3} side={THREE.DoubleSide} />
      </mesh>

      {/* Left Solar Panel Wing */}
      <group position={[-1.5, 0, 0]} ref={solarLeftRef}>
        {/* Boom */}
        <mesh position={[0.4, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.03, 0.03, 0.8]} />
          <meshStandardMaterial color="#334155" metalness={0.8} />
        </mesh>
        {/* Panel */}
        <mesh position={[-0.6, 0, 0]} castShadow>
          <boxGeometry args={[1.6, 0.04, 1.0]} />
          <meshStandardMaterial color="#0284c7" metalness={0.85} roughness={0.15} />
        </mesh>
      </group>

      {/* Right Solar Panel Wing */}
      <group position={[1.5, 0, 0]} ref={solarRightRef}>
        {/* Boom */}
        <mesh position={[-0.4, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.03, 0.03, 0.8]} />
          <meshStandardMaterial color="#334155" metalness={0.8} />
        </mesh>
        {/* Panel */}
        <mesh position={[0.6, 0, 0]} castShadow>
          <boxGeometry args={[1.6, 0.04, 1.0]} />
          <meshStandardMaterial color="#0284c7" metalness={0.85} roughness={0.15} />
        </mesh>
      </group>

      {/* High-Gain Parabolic Dish */}
      <group position={[0, 0.8, -0.1]}>
        <mesh position={[0, -0.15, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 0.25]} />
          <meshStandardMaterial color="#475569" metalness={0.8} />
        </mesh>
        <group ref={dishRef}>
          <mesh rotation={[-Math.PI / 4, 0, 0]}>
            <sphereGeometry args={[0.4, 20, 16, 0, Math.PI * 2, 0, Math.PI * 0.4]} />
            <meshStandardMaterial color="#e2e8f0" metalness={0.9} roughness={0.1} side={THREE.DoubleSide} />
          </mesh>
        </group>
      </group>

      {/* Downward Weather Sensor Cone */}
      <group position={[0, -0.75, 0.1]}>
        <mesh rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[0.35, 0.5, 24]} />
          <meshStandardMaterial color="#1e293b" metalness={0.8} />
        </mesh>
        <mesh position={[0, -0.6, 0]}>
          <coneGeometry args={[0.7, 1.0, 24, 1, true]} />
          <meshBasicMaterial color="#38bdf8" transparent opacity={0.25} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
        </mesh>
      </group>
    </group>
  );
}

export default function SatelliteCanvas() {
  const mouseNorm = useRef({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 - 1;
    mouseNorm.current.x = x;
    mouseNorm.current.y = y;
  };

  const handleTouchMove = (e) => {
    if (e.touches && e.touches.length > 0) {
      const rect = e.currentTarget.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const x = ((e.touches[0].clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((e.touches[0].clientY - rect.top) / rect.height) * 2 - 1;
      mouseNorm.current.x = x;
      mouseNorm.current.y = y;
    }
  };

  return (
    <div
      className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing pointer-events-auto"
      onMouseMove={handleMouseMove}
      onTouchMove={handleTouchMove}
    >
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.7} />
        <directionalLight position={[5, 5, 5]} intensity={2.0} color="#ffffff" />
        <directionalLight position={[-5, -3, -3]} intensity={0.5} color="#0284c7" />
        <pointLight position={[0, 2, 2]} intensity={0.8} color="#38bdf8" />

        <SatelliteModel mouseNorm={mouseNorm} />

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          rotateSpeed={0.8}
          maxPolarAngle={Math.PI / 1.5}
          minPolarAngle={Math.PI / 3}
        />
      </Canvas>
    </div>
  );
}
