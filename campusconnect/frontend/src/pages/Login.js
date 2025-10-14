import React, { useState } from 'react';
import API from '../utils/api';
import { useNavigate, useLocation } from 'react-router-dom';

export default function Login() {
  const [role, setRole] = useState('student');
  const [form, setForm] = useState({});
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const eventId = new URLSearchParams(location.search).get('event');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const endpoint = role === 'admin' ? '/auth/admin-login' : '/auth/student-login';
      const res = await API.post(endpoint, form);
      localStorage.setItem('token', res.data.token);
      if (role === 'student') {
        navigate(eventId ? `/register/${eventId}` : '/student-dashboard');
      } else {
        navigate('/admin-dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <div style={pageStyle}>
      <div style={containerStyle}>
        <h2 style={titleStyle}>Login to CampusConnect</h2>

        <label htmlFor="role" style={labelStyle}>Select Role</label>
        <select
          id="role"
          value={role}
          onChange={e => setRole(e.target.value)}
          style={selectStyle}
          aria-label="Select role"
        >
          <option value="student">Student</option>
          <option value="admin">Admin</option>
        </select>

        <form onSubmit={handleSubmit} style={formStyle} noValidate>
          <input
            type="email"
            name="email"
            placeholder="Email"
            onChange={handleChange}
            required
            style={inputStyle}
            autoComplete="email"
            aria-label="Email"
          />

          {role === 'student' && (
            <input
              type="text"
              name="collegeId"
              placeholder="College ID"
              onChange={handleChange}
              required
              style={inputStyle}
              aria-label="College ID"
            />
          )}

          <input
            type="password"
            name="password"
            placeholder="Password"
            onChange={handleChange}
            required
            style={inputStyle}
            autoComplete="current-password"
            aria-label="Password"
          />

          {role === 'admin' && (
            <input
              type="password"
              name="adminCode"
              placeholder="Admin Code"
              onChange={handleChange}
              required
              style={inputStyle}
              aria-label="Admin Code"
            />
          )}

          <button type="submit" style={buttonStyle}>Login</button>
        </form>

        {error && <p style={errorStyle} role="alert">{error}</p>}
      </div>
    </div>
  );
}

const pageStyle = {
  minHeight: '100vh',
  background: 'linear-gradient(135deg, #121212, #1e1e2f)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: '1rem',
  fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif",
  color: '#e0e0e0',
};

const containerStyle = {
  backgroundColor: '#2a2a3c',
  padding: '2.5rem 2rem',
  borderRadius: '12px',
  boxShadow: '0 15px 40px rgba(0, 0, 0, 0.8)',
  width: '100%',
  maxWidth: 400,
  boxSizing: 'border-box',
  textAlign: 'center',
};

const titleStyle = {
  marginBottom: '1.8rem',
  fontWeight: 700,
  fontSize: '1.8rem',
  color: '#a39fff',
  textShadow: '0 2px 8px rgba(0,0,0,0.9)',
};

const labelStyle = {
  display: 'block',
  textAlign: 'left',
  marginBottom: 8,
  color: '#bbb',
  fontWeight: 600,
};

const selectStyle = {
  width: '100%',
  padding: '0.6rem 1rem',
  borderRadius: 8,
  border: '1px solid #555',
  backgroundColor: '#1e1e2f',
  color: '#e0e0e0',
  fontSize: 16,
  marginBottom: '1.5rem',
  cursor: 'pointer',
};

const formStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1.25rem',
};

const inputStyle = {
  padding: '0.75rem 1rem',
  borderRadius: 8,
  border: '1px solid #555',
  backgroundColor: '#1e1e2f',
  color: '#e0e0e0',
  fontSize: 16,
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.2s',
};

const buttonStyle = {
  marginTop: '1rem',
  padding: '0.8rem 0',
  borderRadius: 30,
  border: 'none',
  background: 'linear-gradient(90deg, #7e57c2, #512da8)',
  color: '#fff',
  fontWeight: 700,
  fontSize: 18,
  cursor: 'pointer',
  transition: 'background 0.3s, transform 0.2s',
};

buttonStyle[':hover'] = {
  background: 'linear-gradient(90deg, #512da8, #7e57c2)',
  transform: 'scale(1.05)',
};

const errorStyle = {
  marginTop: '1rem',
  color: '#ff6b6b',
  fontWeight: 600,
  fontSize: 14,
};
