import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

const Earth = () => {
  const earthRef = useRef();

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (earthRef.current) {
      earthRef.current.rotation.y = t * 0.1;
      earthRef.current.position.y = Math.sin(t * 0.5) * 0.1;
    }
  });

  return (
    <group position={[3, 0, -5]}>
      {/* Glow effect */}
      <mesh>
        <sphereGeometry args={[2.2, 32, 32]} />
        <meshBasicMaterial color="#00E7FF" transparent opacity={0.15} blending={THREE.AdditiveBlending} />
      </mesh>
      
      {/* Main distorted sphere representing the "AI Brain/Earth" */}
      <Sphere ref={earthRef} args={[2, 64, 64]} scale={1}>
        <MeshDistortMaterial
          color="#6E56FF"
          attach="material"
          distort={0.4}
          speed={1.5}
          roughness={0.2}
          metalness={0.8}
          wireframe={true}
        />
      </Sphere>
      
      {/* Inner solid core */}
      <Sphere args={[1.5, 32, 32]} scale={1}>
         <meshStandardMaterial color="#050816" roughness={1} />
      </Sphere>
    </group>
  );
};

export default Earth;
