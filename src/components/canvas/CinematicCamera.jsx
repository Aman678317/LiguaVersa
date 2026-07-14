import React, { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import gsap from 'gsap';

const CinematicCamera = () => {
  const { camera } = useThree();
  const mouse = useRef({ x: 0, y: 0 });

  useEffect(() => {
    // Initial Camera Position
    camera.position.set(0, 0, 15);
    
    const handleMouseMove = (e) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };

    const handleScroll = () => {
      const scrollY = window.scrollY;
      const maxScroll = document.body.scrollHeight - window.innerHeight;
      const progress = scrollY / maxScroll;

      // GSAP animate camera Z position based on scroll (fly through scene)
      gsap.to(camera.position, {
        z: 15 - (progress * 25), // Fly inward from 15 to -10
        y: -(progress * 5),
        duration: 1,
        ease: "power2.out"
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [camera]);

  useFrame((state, delta) => {
    // Subtle Parallax based on mouse
    const targetX = mouse.current.x * 2;
    const targetY = mouse.current.y * 2;
    
    camera.position.x += (targetX - camera.position.x) * delta * 2;
    // Don't override Y completely, let scroll dictate base Y, just add sway
    camera.lookAt(0, 0, -10); // Always look at the AI Brain
  });

  return null;
};

export default CinematicCamera;
