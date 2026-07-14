import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const AIBrain = () => {
  const meshRef = useRef();

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.2;
      meshRef.current.rotation.x += delta * 0.1;
    }
  });

  return (
    <group position={[0, 0, -10]}>
      {/* Inner Glowing Core */}
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[2, 4]} />
        <meshStandardMaterial 
          color="#00E7FF"
          emissive="#6E56FF"
          emissiveIntensity={2}
          wireframe
          transparent
          opacity={0.8}
        />
      </mesh>
      {/* Outer Shell */}
      <mesh scale={1.2}>
        <icosahedronGeometry args={[2, 2]} />
        <meshStandardMaterial 
          color="#9D4EDD"
          emissive="#9D4EDD"
          emissiveIntensity={0.5}
          wireframe
          transparent
          opacity={0.3}
        />
      </mesh>
      <pointLight color="#6E56FF" intensity={50} distance={20} />
    </group>
  );
};

export default AIBrain;
