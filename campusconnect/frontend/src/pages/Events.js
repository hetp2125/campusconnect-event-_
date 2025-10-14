import React, { useEffect, useState } from 'react';
import API from '../utils/api';
import { useNavigate } from 'react-router-dom';

export default function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    API.get('/events')
      .then(res => {
        setEvents(res.data);
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to load events.');
        setLoading(false);
      });
  }, []);

  if (loading)
    return (
      <div style={loaderStyle}>
        <p>Loading events...</p>
      </div>
    );

  if (error)
    return (
      <div style={loaderStyle}>
        <p style={{ color: '#ff6b6b' }}>{error}</p>
      </div>
    );

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #121212, #1e1e2f)',
        padding: '2rem 1rem',
        fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif",
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        color: '#e0e0e0',
      }}
    >
      <h2
        style={{
          fontSize: '2.5rem',
          marginBottom: '2rem',
          fontWeight: '800',
          textShadow: '0 2px 8px rgba(0,0,0,0.9)',
          color: '#dcdcdc',
        }}
      >
        Upcoming Events
      </h2>

      <div
        style={{
          width: '100%',
          maxWidth: 900,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))',
          gap: '1.75rem',
        }}
      >
        {events.length === 0 ? (
          <p
            style={{
              textAlign: 'center',
              gridColumn: '1 / -1',
              color: '#aaa',
              fontSize: '1.25rem',
            }}
          >
            No events available right now. Check back later!
          </p>
        ) : (
          events.map(event => (
            <div
              key={event._id}
              style={{
                backgroundColor: '#2a2a3c',
                borderRadius: 12,
                padding: '1.5rem',
                boxShadow: '0 8px 20px rgba(0,0,0,0.6)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                cursor: 'default',
              }}
              onMouseOver={e => {
                e.currentTarget.style.transform = 'translateY(-6px)';
                e.currentTarget.style.boxShadow = '0 14px 30px rgba(80,80,130,0.7)';
              }}
              onMouseOut={e => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.6)';
              }}
            >
              <div>
                <h3
                  style={{
                    marginBottom: '0.5rem',
                    color: '#a39fff',
                    fontWeight: '700',
                    fontSize: '1.5rem',
                    lineHeight: 1.2,
                  }}
                >
                  {event.name}
                </h3>
                <p
                  style={{
                    marginBottom: '0.5rem',
                    fontWeight: '600',
                    color: '#bbb',
                  }}
                >
                  {new Date(event.date).toLocaleDateString()} | {event.location}
                </p>
                <p
                  style={{
                    marginBottom: '1.2rem',
                    fontSize: '0.95rem',
                    color: '#999',
                    fontStyle: 'italic',
                  }}
                >
                  Organized by: {event.organizer}
                </p>
              </div>

              <button
                onClick={() => navigate(`/login?event=${event._id}`)}
                style={darkRegisterButtonStyle}
                onMouseOver={e => {
                  e.currentTarget.style.background =
                    'linear-gradient(90deg, #7e57c2, #512da8)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(126,87,194,0.7)';
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseOut={e => {
                  e.currentTarget.style.background = '#673ab7';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                Register
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

const loaderStyle = {
  minHeight: '80vh',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  fontSize: '1.2rem',
  fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif",
  color: '#e0e0e0',
};

const darkRegisterButtonStyle = {
  padding: '0.6rem 1.6rem',
  background: '#673ab7',
  color: '#fff',
  border: 'none',
  borderRadius: 24,
  fontSize: 16,
  fontWeight: 700,
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  alignSelf: 'flex-start',
  userSelect: 'none',
};
