import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(120deg, #8e2de2 0%, #4a00e0 40%, #ff6a00 80%, #f7971e 100%)',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      
      <nav
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '1.5rem 3vw',
          boxShadow: '0 4px 20px rgba(30,30,70,0.04)',
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(6px)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <img
            src="/logo192.png"
            alt="CampusConnect logo"
            style={{ width: 48, height: 48, marginRight: 14 }}
          />
          <span style={{
            fontWeight: 800,
            fontSize: 28,
            letterSpacing: 1,
            color: '#4A00E0',
            fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif"
          }}>
            CampusConnect
          </span>
        </div>
        <button
          style={{
            marginLeft: 'auto',
            background: 'linear-gradient(90deg, #ff6a00 0%, #8e2de2 100%)',
            color: '#fff',
            padding: '0.7rem 2rem',
            border: 'none',
            borderRadius: 20,
            fontSize: 18,
            fontWeight: 600,
            boxShadow: '0 2px 12px 0 rgba(86,13,130,0.08)',
            cursor: 'pointer',
            transition: 'transform 0.15s, box-shadow 0.15s',
          }}
          onClick={() => navigate('/events')}
          onMouseOver={e => {
            e.target.style.transform = 'scale(1.07)';
            e.target.style.boxShadow = '0 4px 24px 0 rgba(252,142,57,0.16)';
          }}
          onMouseOut={e => {
            e.target.style.transform = 'scale(1)';
            e.target.style.boxShadow = '0 2px 12px 0 rgba(86,13,130,0.08)';
          }}
        >
          Explore Now
        </button>
      </nav>

      {/* Main/Hero Content */}
      <main
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          color: '#fff',
          textAlign: 'center',
          fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif",
        }}
      >
        <h1 style={{
          fontSize: 'clamp(2.3rem,7vw,3.8rem)',
          marginBottom: '0.6rem',
          fontWeight: 800,
          lineHeight: 1.12,
          textShadow: '0 8px 32px rgba(0,0,0,0.08)'
        }}>
          Welcome to CampusConnect
        </h1>
        <p style={{
          maxWidth: 540,
          fontSize: 22,
          margin: '0 auto 2.2rem',
          opacity: 0.96,
          color: '#fff7ee',
          textShadow: '0 2px 24px rgba(255,106,0,0.07)'
        }}>
          Discover vibrant events, connect with your campus community, and stay updated – all in one place!
        </p>
        <button
          style={{
            background: 'linear-gradient(90deg, #8e2de2 0%, #ff6a00 100%)',
            color: '#fff',
            padding: '1rem 2.5rem',
            border: 'none',
            borderRadius: 30,
            fontSize: 20,
            fontWeight: 700,
            boxShadow: '0 6px 24px 0 rgba(78,6,130,0.14)',
            cursor: 'pointer',
            marginTop: 8,
            transition: 'transform 0.15s, box-shadow 0.15s',
          }}
          onClick={() => navigate('/events')}
          onMouseOver={e => {
            e.target.style.transform = 'scale(1.07)';
            e.target.style.boxShadow = '0 10px 32px 0 rgba(255,163,73,0.24)';
          }}
          onMouseOut={e => {
            e.target.style.transform = 'scale(1)';
            e.target.style.boxShadow = '0 6px 24px 0 rgba(78,6,130,0.14)';
          }}
        >
          Get Started
        </button>
      </main>
    </div>
  );
}
