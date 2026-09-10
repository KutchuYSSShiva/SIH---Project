import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Cloud, Clouds, Sky } from '@react-three/drei';
import * as THREE from 'three';

// ── Pure white clouds drifting away smoothly with cursor interaction ─────────
function DriftingClouds({ mouseNorm }) {
  const groupRef = useRef();
  const clock = useRef(0);

  const cloudData = useMemo(() => {
    const seed = (n) => Math.sin(n * 9301 + 49297) * 0.5 + 0.5;
    return Array.from({ length: 22 }, (_, i) => {
      const s = seed(i);
      const s2 = seed(i + 50);
      const s3 = seed(i + 100);
      return {
        id: i,
        pos: new THREE.Vector3(
          (s - 0.5) * 36,
          (s2 - 0.5) * 5.5 + 0.8,
          -(s3 * 16 + 2)
        ),
        speed: 0.025 + s * 0.02,
        rotY: s * Math.PI * 2,
        scale: 1.1 + s2 * 2.2,
        opacity: 0.9 + s3 * 0.1,
        vel: new THREE.Vector2(0, 0),
      };
    });
  }, []);

  useFrame(({ clock: c }) => {
    clock.current = c.getElapsedTime();
    const t = clock.current;

    cloudData.forEach((cd, i) => {
      const mesh = groupRef.current?.children[i];
      if (!mesh) return;

      // Drift away continuously to the right
      cd.pos.x += cd.speed * 0.35;
      if (cd.pos.x > 22) cd.pos.x = -22;

      const bobY = Math.sin(t * 0.5 + i * 1.2) * 0.25;

      const mx = mouseNorm.current.x * 16;
      const my = mouseNorm.current.y * 6;
      const dx = cd.pos.x - mx;
      const dy = cd.pos.y - my;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const repelRadius = 6.5;
      let repelX = 0, repelY = 0;
      if (dist < repelRadius && dist > 0.01) {
        const strength = ((repelRadius - dist) / repelRadius) * 0.22;
        repelX = (dx / dist) * strength;
        repelY = (dy / dist) * strength;
      }

      cd.vel.x = cd.vel.x * 0.82 + repelX * 0.18;
      cd.vel.y = cd.vel.y * 0.82 + repelY * 0.18;

      mesh.position.set(
        cd.pos.x + cd.vel.x,
        cd.pos.y + bobY + cd.vel.y,
        cd.pos.z
      );

      mesh.rotation.y = cd.rotY + t * 0.035;
    });
  });

  return (
    <group ref={groupRef}>
      {cloudData.map((cd) => (
        <Cloud
          key={cd.id}
          position={[cd.pos.x, cd.pos.y, cd.pos.z]}
          seed={cd.id * 17 + 3}
          segments={52}
          bounds={[cd.scale * 3.2, cd.scale * 1.3, cd.scale * 1.6]}
          volume={cd.scale * 3.8}
          color="#ffffff"
          fade={170}
          speed={0.25}
          growth={5}
          opacity={cd.opacity}
          concentrate="inside"
        />
      ))}
    </group>
  );
}

// ── Sky Scene with Rich Darker Blue ─────────────────────────────────────────
function Scene({ mouseNorm }) {
  return (
    <>
      <Sky
        distance={450000}
        sunPosition={[120, 60, 100]}
        inclination={0.5}
        azimuth={0.25}
        mieCoefficient={0.003}
        mieDirectionalG={0.88}
        rayleigh={0.8}
        turbidity={4}
      />

      <ambientLight intensity={1.4} color="#ffffff" />
      <directionalLight
        position={[15, 25, 20]}
        intensity={2.4}
        color="#ffffff"
        castShadow
      />
      <directionalLight position={[-15, 12, -10]} intensity={1.0} color="#bae6fd" />

      <Clouds material={THREE.MeshLambertMaterial} limit={600}>
        <DriftingClouds mouseNorm={mouseNorm} />
      </Clouds>
    </>
  );
}

export default function CloudBackground() {
  const mouseNorm = useRef({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    mouseNorm.current.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouseNorm.current.y = -((e.clientY / window.innerHeight) * 2 - 1);
  };

  return (
    <div
      className="absolute inset-0 w-full h-full pointer-events-auto cursor-default"
      onMouseMove={handleMouseMove}
    >
      <Canvas
        camera={{ position: [0, 1.5, 9], fov: 70, near: 0.1, far: 500 }}
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
        dpr={[1, 2]}
        style={{ background: '#0284c7' }}
      >
        <Scene mouseNorm={mouseNorm} />
      </Canvas>
    </div>
  );
}
