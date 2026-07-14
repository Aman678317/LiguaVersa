import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const VoiceParticles = () => {
  const pointsRef = useRef();
  
  const particleCount = 2000;
  
  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const col = new Float32Array(particleCount * 3);
    const colorPrimary = new THREE.Color('#00E7FF');
    const colorAccent = new THREE.Color('#9D4EDD');
    
    for(let i = 0; i < particleCount; i++) {
      // Create a swirling galaxy/wave shape
      const r = 5 + Math.random() * 15;
      const theta = 2 * Math.PI * Math.random();
      const phi = Math.acos(2 * Math.random() - 1);
      
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.2; // Flattened wave
      pos[i * 3 + 2] = r * Math.cos(phi);
      
      const mixedColor = colorPrimary.clone().lerp(colorAccent, Math.random());
      col[i * 3] = mixedColor.r;
      col[i * 3 + 1] = mixedColor.g;
      col[i * 3 + 2] = mixedColor.b;
    }
    
    return [pos, col];
  }, [particleCount]);

  useFrame((state, delta) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y -= delta * 0.05;
      // Animate particle wave based on time
      const time = state.clock.getElapsedTime();
      const positionsAttr = pointsRef.current.geometry.attributes.position;
      
      for(let i = 0; i < particleCount; i++) {
        const x = positions[i * 3];
        const z = positions[i * 3 + 2];
        // Create sine wave motion
        positionsAttr.array[i * 3 + 1] = positions[i * 3 + 1] + Math.sin(time * 2 + x * 0.5 + z * 0.5) * 0.5;
      }
      positionsAttr.needsUpdate = true;
    }
  });

  return (
    <points ref={pointsRef} position={[0, -2, -15]}>
      <bufferGeometry>
        <bufferAttribute 
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute 
          attach="attributes-color"
          count={particleCount}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial 
        size={0.15}
        vertexColors
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};

export default VoiceParticles;
