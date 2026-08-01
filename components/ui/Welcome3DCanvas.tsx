'use client';

import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Center, Text, ContactShadows, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

interface Welcome3DCanvasProps {
  theme?: 'dark' | 'light';
}

function FloatingGeometries({ theme }: { theme: 'dark' | 'light' }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.15;
    }
  });

  const isDark = theme === 'dark';
  const goldColor = '#D4AF37';
  const blueColor = '#007AFF';
  const greenColor = '#34C759';
  const navyColor = '#0F172A';

  return (
    <group ref={groupRef}>
      {/* Shape 1: Dodecahedron */}
      <Float speed={2.2} rotationIntensity={1.8} floatIntensity={2}>
        <mesh position={[-4.5, 2.2, -1]}>
          <dodecahedronGeometry args={[0.9, 0]} />
          <meshPhysicalMaterial
            color={isDark ? goldColor : blueColor}
            roughness={0.15}
            metalness={0.7}
            clearcoat={0.6}
            clearcoatRoughness={0.1}
          />
        </mesh>
      </Float>

      {/* Shape 2: Torus */}
      <Float speed={1.8} rotationIntensity={1.5} floatIntensity={1.8}>
        <mesh position={[4.5, 1.8, 1]} rotation={[Math.PI / 4, 0, Math.PI / 6]}>
          <torusGeometry args={[0.8, 0.3, 16, 32]} />
          <meshPhysicalMaterial
            color={isDark ? blueColor : goldColor}
            roughness={0.15}
            metalness={0.8}
            clearcoat={0.5}
          />
        </mesh>
      </Float>

      {/* Shape 3: Sphere */}
      <Float speed={2.5} rotationIntensity={1.2} floatIntensity={2.2}>
        <mesh position={[-3.8, -2.2, 1]}>
          <sphereGeometry args={[0.7, 32, 32]} />
          <meshPhysicalMaterial
            color={isDark ? greenColor : navyColor}
            roughness={0.2}
            metalness={0.5}
            clearcoat={0.5}
          />
        </mesh>
      </Float>

      {/* Shape 4: Smooth Cube */}
      <Float speed={2} rotationIntensity={1.4} floatIntensity={1.6}>
        <mesh position={[4, -2, -1]} rotation={[0.4, 0.4, 0]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshPhysicalMaterial
            color={isDark ? goldColor : blueColor}
            roughness={0.15}
            metalness={0.6}
            clearcoat={0.5}
          />
        </mesh>
      </Float>

      {/* Shape 5: Icosahedron */}
      <Float speed={2.4} rotationIntensity={2} floatIntensity={1.5}>
        <mesh position={[0, 3.2, -2]}>
          <icosahedronGeometry args={[0.75, 0]} />
          <meshPhysicalMaterial
            color={isDark ? blueColor : greenColor}
            roughness={0.15}
            metalness={0.7}
            clearcoat={0.5}
          />
        </mesh>
      </Float>
    </group>
  );
}

function Typography3D({ theme }: { theme: 'dark' | 'light' }) {
  const isDark = theme === 'dark';
  const textColor = isDark ? '#FFFFFF' : '#0F172A';
  const accentColor = isDark ? '#D4AF37' : '#007AFF';

  return (
    <Center position={[0, 0, 0]}>
      <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.5}>
        <group>
          {/* Primary Text WELCOME */}
          <Text
            fontSize={2.2}
            letterSpacing={0.08}
            lineHeight={1}
            anchorX="center"
            anchorY="middle"
            position={[0, 0.8, 0]}
          >
            WELCOME
            <meshPhysicalMaterial
              color={textColor}
              roughness={0.15}
              metalness={0.6}
              clearcoat={0.5}
            />
          </Text>

          {/* Secondary Text SINA_FN */}
          <Text
            fontSize={1.2}
            letterSpacing={0.15}
            lineHeight={1}
            anchorX="center"
            anchorY="middle"
            position={[0, -1, 0.2]}
          >
            SINA_FN
            <meshPhysicalMaterial
              color={accentColor}
              roughness={0.12}
              metalness={0.8}
              clearcoat={0.8}
            />
          </Text>
        </group>
      </Float>
    </Center>
  );
}

export default function Welcome3DCanvas({ theme = 'dark' }: Welcome3DCanvasProps) {
  const isDark = theme === 'dark';
  const bgColor = isDark ? '#08090A' : '#F8F9FA';

  return (
    <div className="relative w-full h-[420px] md:h-[480px] rounded-3xl overflow-hidden shadow-2xl border border-black/5 dark:border-white/10 my-6">
      <Canvas
        orthographic
        camera={{ zoom: 40, position: [10, 10, 10], near: 0.1, far: 1000 }}
        frameloop="always"
        style={{ background: bgColor }}
      >
        {/* Dynamic Lighting */}
        <ambientLight intensity={isDark ? 0.6 : 0.9} color={isDark ? '#34C759' : '#FFFFFF'} />
        <directionalLight position={[10, 15, 10]} intensity={isDark ? 1.2 : 2.0} color="#FFFFFF" />
        <pointLight position={[-10, -10, -10]} intensity={isDark ? 1.5 : 0.8} color={isDark ? '#007AFF' : '#00C7FF'} />
        <pointLight position={[10, 5, 5]} intensity={isDark ? 1.2 : 0.6} color={isDark ? '#D4AF37' : '#34C759'} />

        {/* 3D Elements */}
        <Typography3D theme={theme} />
        <FloatingGeometries theme={theme} />

        {/* Contact Shadow on floor */}
        <ContactShadows
          position={[0, -3, 0]}
          opacity={isDark ? 0.4 : 0.2}
          scale={15}
          blur={2.5}
          far={4}
        />

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate
          autoRotateSpeed={0.5}
          maxPolarAngle={Math.PI / 2}
          minPolarAngle={Math.PI / 3}
        />
      </Canvas>
    </div>
  );
}
