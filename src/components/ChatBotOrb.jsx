import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';

function OrbMesh() {
  const innerRef = useRef();
  const outerRef = useRef();

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (innerRef.current) {
      innerRef.current.rotation.x = t * 0.3;
      innerRef.current.rotation.y = t * 0.5;
      const s = 1 + Math.sin(t * 2) * 0.08;
      innerRef.current.scale.set(s, s, s);
    }
    if (outerRef.current) {
      outerRef.current.rotation.x = -t * 0.15;
      outerRef.current.rotation.y = -t * 0.25;
      outerRef.current.rotation.z = t * 0.1;
      const sOuter = 1.35 + Math.cos(t * 1.5) * 0.05;
      outerRef.current.scale.set(sOuter, sOuter, sOuter);
    }
  });

  return (
    <group>
      {/* Inner pulsing wireframe icosahedron - #00FFA3 accent green */}
      <mesh ref={innerRef}>
        <icosahedronGeometry args={[0.9, 1]} />
        <meshBasicMaterial wireframe color="#00FFA3" transparent opacity={0.85} />
      </mesh>

      {/* Outer slower-rotating wireframe shell - #3b82f6 blue */}
      <mesh ref={outerRef}>
        <icosahedronGeometry args={[1.35, 1]} />
        <meshBasicMaterial wireframe color="#3b82f6" transparent opacity={0.5} />
      </mesh>
    </group>
  );
}

const ChatBotOrb = () => {
  return (
    <div 
      style={{ 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        width: '100%', 
        height: '100%', 
        pointerEvents: 'none', 
        opacity: 0.5,
        zIndex: 0,
        overflow: 'hidden'
      }}
    >
      <Canvas 
        camera={{ position: [0, 0, 3.5], fov: 45 }}
        style={{ width: '100%', height: '100%', pointerEvents: 'none' }}
        gl={{ alpha: true, antialias: true }}
      >
        <ambientLight intensity={0.5} />
        <OrbMesh />
      </Canvas>
    </div>
  );
};

export default ChatBotOrb;
