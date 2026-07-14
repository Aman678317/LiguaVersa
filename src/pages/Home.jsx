import React from 'react';
import Hero from '../components/sections/Hero';

const Home = () => {
  return (
    <main>
      <Hero />
      {/* Other sections like Features, AI Translation, etc. will go here */}
      <div style={{ height: '200vh' }}> {/* Temporary height to allow scrolling */}</div>
    </main>
  );
};

export default Home;
