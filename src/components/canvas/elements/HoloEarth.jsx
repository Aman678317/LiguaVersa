import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

const HoloEarth = () => {
  const earthRef = useRef();

  useFrame((state, delta) => {
    if (earthRef.current) {
      earthRef.current.rotation.y += delta * 0.1;
    }
  });

  return (
    <group position={[5, 2, -5]}>
      {/* Wireframe Earth */}
      <mesh ref={earthRef}>
        <sphereGeometry args={[1.5, 32, 32]} />
        <meshStandardMaterial 
          color="#00FFA3"
          emissive="#00FFA3"
          emissiveIntensity={0.5}
          wireframe
          transparent
          opacity={0.4}
        />
      </mesh>
      {/* Core glow */}
      <mesh>
        <sphereGeometry args={[1.4, 32, 32]} />
        <meshBasicMaterial 
          color="#050816"
          transparent
          opacity={0.8}
        />
      </mesh>
    </group>
  );
};

export default HoloEarth;
