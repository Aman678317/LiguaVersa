import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, Stars } from '@react-three/drei';
import { EffectComposer, Bloom, Noise, Vignette, DepthOfField } from '@react-three/postprocessing';
import CinematicCamera from './CinematicCamera';
import AIBrain from './elements/AIBrain';
import VoiceParticles from './elements/VoiceParticles';
import HoloEarth from './elements/HoloEarth';

const Scene = () => {
  return (
    <Canvas
      gl={{ antialias: false, powerPreference: "high-performance" }} // Optimized for Post-Processing
      dpr={[1, 2]}
    >
      <color attach="background" args={['#050816']} />
      
      {/* Volumetric / Ambient Lighting */}
      <ambientLight intensity={0.2} color="#6E56FF" />
      <directionalLight position={[10, 10, 5]} intensity={2} color="#00E7FF" />
      <directionalLight position={[-10, -10, -5]} intensity={1} color="#9D4EDD" />

      {/* Camera Controller */}
      <CinematicCamera />

      <Suspense fallback={null}>
        {/* Holographic Elements */}
        <AIBrain />
        <VoiceParticles />
        <HoloEarth />

        {/* Environment setup for reflections */}
        <Environment preset="night" />
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        
        {/* Post Processing Pipeline - Unreal Engine Style */}
        <EffectComposer disableNormalPass>
          <DepthOfField focusDistance={0} focalLength={0.02} bokehScale={2} height={480} />
          <Bloom 
            luminanceThreshold={0.2} 
            luminanceSmoothing={0.9} 
            intensity={2.5} // High bloom for neon sci-fi look
            mipmapBlur
          />
          <Noise opacity={0.05} />
          <Vignette eskil={false} offset={0.1} darkness={1.1} />
        </EffectComposer>
      </Suspense>
    </Canvas>
  );
};

export default Scene;
