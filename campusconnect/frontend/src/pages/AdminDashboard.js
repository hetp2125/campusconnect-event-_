import React, { useEffect, useState } from 'react';
import API from '../utils/api';
import { FaEdit, FaTrash, FaPlusCircle } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const [events, setEvents] = useState([]);
  const [form, setForm] = useState({ name: '', date: '', location: '', organizer: '', imageUrl: '' });
  const [editingId, setEditingId] = useState(null);
  const [refresh, setRefresh] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await API.get('/events');
        setEvents(res.data);
      } catch (err) {
        console.error('Failed to fetch events:', err);
        setError("Could not load events. Please try again later.");
      }
    };
    fetchEvents();
  }, [refresh]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const today = new Date();
    today.setHours(0,0,0,0);
    const eventDate = new Date(form.date);

    if (eventDate < today) {
      setError("You cannot create or update an event with a past date.");
      return;
    }

    try {
      if (editingId) {
        const { data: updatedEvent } = await API.put(`/events/${editingId}`, form);
        setEvents(events => events.map(ev => ev._id === editingId ? { ...ev, ...updatedEvent } : ev));
        setEditingId(null);
      } else {
        const { data: newEvent } = await API.post('/events', form);
        setEvents(events => [...events, newEvent]);
      }

      setForm({ name: '', date: '', location: '', organizer: '', imageUrl: '' });
    } catch (err) {
      console.error('Event submission error:', err);
      setError("Failed to submit the event. Please check your data and try again.");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        await API.delete(`/events/${id}`);
        setRefresh(!refresh);
      } catch (err) {
        console.error('Failed to delete event:', err);
        setError("Could not delete the event. Try again later.");
      }
    }
  };

  const handleEdit = (event) => {
    setEditingId(event._id);
    setForm({
      name: event.name,
      date: event.date ? event.date.slice(0, 10) : '',
      location: event.location,
      organizer: event.organizer,
      imageUrl: event.imageUrl || ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setForm({ name: '', date: '', location: '', organizer:'', imageUrl: '' });
  };

  return (
    <div className="admin-dashboard">
      <motion.div
        className="event-form-container"
        initial={{ opacity: 0, y: -40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, type: 'spring' }}
      >
        {error && (
          <div style={{ color: 'red', marginBottom: 10 }}>{error}</div>
        )}
        <form className="event-form" onSubmit={handleSubmit}>
          <h3>
            <FaPlusCircle style={{ color: '#f7971e', marginRight: 8 }} />
            {editingId ? 'Edit Event' : 'Create Event'}
          </h3>
          <input name="name" placeholder="Event Name" value={form.name} onChange={handleChange} required />
          <input name="date" type="date" value={form.date} onChange={handleChange} required />
          <input name="location" placeholder="Location" value={form.location} onChange={handleChange} required />
          <input name="organizer" placeholder="Organizer" value={form.organizer} onChange={handleChange} required />
          <input name="imageUrl" placeholder="Image URL" value={form.imageUrl} onChange={handleChange} />
          <div className="form-buttons">
            <button type="submit">{editingId ? 'Update' : 'Create'}</button>
            {editingId && <button type="button" onClick={handleCancelEdit} className="cancel-btn">Cancel</button>}
          </div>
        </form>
      </motion.div>
      <div className="events-list">
        <h3>All Events</h3>
        <table className="events-table">
          <thead>
            <tr>
              <th>Image</th>
              <th>Name</th>
              <th>Date</th>
              <th>Location</th>
              <th>Organizer</th>
              <th>Actions</th>
            </tr>
          </thead>
          <AnimatePresence>
            <tbody>
              {events.map(event => (
                <motion.tr
                  key={event._id}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                >
                  <td>
                    {event.imageUrl ? (
                      <img src={event.imageUrl} alt={event.name} className="event-img" />
                    ) : (
                      <span style={{ color: '#aaa' }}>No Image</span>
                    )}
                  </td>
                  <td>{event.name}</td>
                  <td>{new Date(event.date).toLocaleDateString()}</td>
                  <td>{event.location}</td>
                  <td>{event.organizer}</td>
                  <td>
                    <button className="icon-btn edit-btn" onClick={() => handleEdit(event)}>
                      <FaEdit />
                    </button>
                    <button className="icon-btn delete-btn" onClick={() => handleDelete(event._id)}>
                      <FaTrash />
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </AnimatePresence>
        </table>
      </div>
    </div>
  );
}
