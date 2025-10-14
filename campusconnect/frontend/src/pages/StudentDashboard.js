import React, { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import API from "../utils/api";
import {
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaCheckCircle,
  FaRegClock,
  FaStar,
} from "react-icons/fa";
import "./StudentDashboard.css";

export default function StudentDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [user, setUser] = useState({ registeredEvents: [] });
  const [loading, setLoading] = useState(true);
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);
  const [newlyRegisteredEvent, setNewlyRegisteredEvent] = useState(null);
  const [localRegisteredEvents, setLocalRegisteredEvents] = useState([]);

  const fetchUserData = async () => {
    try {
      const userRes = await API.get("/auth/me");
      // If we get here, user is logged in
      const serverRegistered = userRes.data.registeredEvents || [];
      
      // Update user state with server data
      setUser({
        ...userRes.data,
        registeredEvents: serverRegistered
      });
      
      // Update local storage with server data
      if (serverRegistered.length > 0) {
        localStorage.setItem("registeredEvents", JSON.stringify(serverRegistered));
      }
      
      return serverRegistered;
    } catch (error) {
      // If not logged in, use local storage
      const storedRegistered = JSON.parse(localStorage.getItem("registeredEvents") || "[]");
      setLocalRegisteredEvents(storedRegistered);
      setUser({
        registeredEvents: storedRegistered
      });
      return storedRegistered;
    }
  };

  // Effect to handle initial data loading and URL parameters
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // First, fetch events
        const eventsRes = await API.get("/events");
        setEvents(eventsRes.data);
        
        // Then fetch user data including registered events
        await fetchUserData();
        
        // Check URL for registration success
        const urlParams = new URLSearchParams(location.search);
        const registeredEventId = urlParams.get("registered");
        const success = urlParams.get("success");
        
        if (registeredEventId && success === "true") {
          const registeredEvent = eventsRes.data.find(e => e._id === registeredEventId);
          if (registeredEvent) {
            // Mark this event as newly registered
            setNewlyRegisteredEvent(registeredEvent);
            setShowSuccessBanner(true);
            
            // Update registered events in state and localStorage
            setUser(prev => {
              const currentRegistered = Array.isArray(prev.registeredEvents) ? 
                [...prev.registeredEvents] : [];
                
              if (!currentRegistered.includes(registeredEventId)) {
                const updatedRegistered = [...currentRegistered, registeredEventId];
                // Update local storage with all registered events
                localStorage.setItem("registeredEvents", JSON.stringify(updatedRegistered));
                return { ...prev, registeredEvents: updatedRegistered };
              }
              return prev;
            });
            
            // Update localRegisteredEvents state as well
            setLocalRegisteredEvents(prev => {
              const updated = [...new Set([...prev, registeredEventId])];
              return updated;
            });
            
            // Hide banner after 5 seconds
            setTimeout(() => {
              setShowSuccessBanner(false);
              setNewlyRegisteredEvent(null);
            }, 5000);
          }
          
          // Clean up URL
          window.history.replaceState({}, "", "/student-dashboard");
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };

    fetchData();
    
    // Set up a listener for storage events to sync across tabs
    const handleStorageChange = (e) => {
      if (e.key === "registeredEvents") {
        try {
          const storedRegistrations = JSON.parse(e.newValue || "[]");
          setLocalRegisteredEvents(storedRegistrations);
          setUser(prev => ({
            ...prev,
            registeredEvents: [...new Set([...storedRegistrations])]
          }));
        } catch (err) {
          console.error("Error parsing stored registrations:", err);
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [location.search]);

  const handleRegisterClick = async (eventId) => {
    if (!eventId) return;
    
    // Check if already registered using the same logic as isEventRegistered
    if (isEventRegistered(eventId)) {
      console.log('Already registered for event:', eventId);
      return; // Don't navigate if already registered
    }
    
    try {
      // Refresh user data to ensure we have the latest registrations
      await fetchUserData();
      
      // Double check registration status after refresh
      if (isEventRegistered(eventId)) {
        console.log('Already registered for event after refresh:', eventId);
        return;
      }
      
      // Navigate to registration page
      navigate(`/register/${eventId}`);
    } catch (error) {
      console.error('Error handling registration click:', error);
    }
  };

  const isEventRegistered = useCallback((eventId) => {
    if (!eventId) return true; // If no event ID, consider it registered to prevent registration
    
    // Get server-side registrations
    const serverRegistered = Array.isArray(user.registeredEvents) 
      ? user.registeredEvents.map(id => id?.toString())
      : [];
    
    // Get client-side registrations from state
    const localRegistered = Array.isArray(localRegisteredEvents) 
      ? localRegisteredEvents.map(id => id?.toString())
      : [];
    
    // Get client-side registrations directly from localStorage as fallback
    let storedRegistrations = [];
    try {
      storedRegistrations = JSON.parse(localStorage.getItem("registeredEvents") || "[]")
        .map(id => id?.toString())
        .filter(Boolean);
    } catch (e) {
      console.error("Error parsing stored registrations:", e);
    }
    
    // Combine all sources and remove duplicates
    const allRegistered = [
      ...new Set([...serverRegistered, ...localRegistered, ...storedRegistrations])
    ];
    
    // Update local state if we found new registrations in localStorage
    if (storedRegistrations.length > 0 && 
        storedRegistrations.some(id => !localRegistered.includes(id))) {
      setLocalRegisteredEvents(storedRegistrations);
    }
    
    return allRegistered.includes(eventId.toString());
  }, [user.registeredEvents, localRegisteredEvents]);

  const getEventStatus = (event) => {
    if (!event || !event._id) {
      return { type: "error", label: "Error", icon: FaCheckCircle, disabled: true };
    }
    
    const now = new Date();
    const eventDate = new Date(event.date);
    const isRegistered = isEventRegistered(event._id);
    const isNewlyRegistered = newlyRegisteredEvent?._id === event._id;
    
    // If event is in the past or user is registered, disable the button
    if (eventDate < now || isRegistered) {
      return { 
        type: isRegistered ? (isNewlyRegistered ? "newly-registered" : "registered") : "past",
        label: isRegistered ? "Registered" : "Completed",
        icon: FaCheckCircle,
        disabled: true
      };
    }
    
    // Only return available status if event is in future and not registered
    return { 
      type: "available", 
      label: "Register", 
      icon: FaRegClock, 
      disabled: false 
    };
  };

  if (loading) {
    return <div className="loading-spinner">Loading your dashboard...</div>;
  }

  const now = new Date();
  const upcomingEvents = events.filter(event => new Date(event.date) >= now);
  const pastEvents = events.filter(event => new Date(event.date) < now);
  const registeredEvents = events.filter(event => isEventRegistered(event._id));

  return (
    <div className="student-dashboard">
      <div className="dashboard-header">
        <h2>Student Dashboard</h2>
        <div className="dashboard-stats">
          <div className="stat-item">
            <span className="stat-number">{registeredEvents.length}</span>
            <span className="stat-label">Registered</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{upcomingEvents.length}</span>
            <span className="stat-label">Upcoming</span>
          </div>
        </div>
      </div>

      {showSuccessBanner && newlyRegisteredEvent && (
        <div className="success-banner">
          <div className="success-content">
            <FaCheckCircle className="success-icon" />
            <div>
              <strong>Registration Successful!</strong>
              <p>You've successfully registered for "{newlyRegisteredEvent.name}"</p>
            </div>
          </div>
          <button 
            className="close-banner"
            onClick={() => setShowSuccessBanner(false)}
          >
            ×
          </button>
        </div>
      )}

      <div className="events-section">
        <h3>All Events</h3>
        <div className="event-cards">
          {events.map((event) => {
            const status = getEventStatus(event);
            const isNewlyRegistered = newlyRegisteredEvent?._id === event._id;
            
            return (
              <div
                className={`event-card ${status.type === "past" ? "event-past" : ""} ${
                  isNewlyRegistered ? "newly-registered" : ""
                } ${status.disabled ? "event-registered" : ""}`}
                key={event._id}
              >
                {isNewlyRegistered && (
                  <div className="new-registration-badge">
                    <FaStar /> Just Registered!
                  </div>
                )}
                
                <div className="event-img-container">
                  {event.imageUrl ? (
                    <img src={event.imageUrl || "/placeholder.svg"} alt={event.name} className="event-img" />
                  ) : (
                    <div className="event-img-placeholder">No Image</div>
                  )}
                </div>
                
                <div className="event-info">
                  <h3>{event.name}</h3>
                  <p>
                    <FaCalendarAlt className="icon" />
                    {new Date(event.date).toLocaleDateString()}
                  </p>
                  <p>
                    <FaMapMarkerAlt className="icon" /> {event.location}
                  </p>
                  <p>
                    <span className="organizer">By: {event.organizer}</span>
                  </p>
                  
                  <div className="event-status">
                    {status.type === "past" ? (
                      <span className="status completed">
                        <status.icon /> {status.label}
                      </span>
                    ) : status.type === "registered" || status.type === "newly-registered" ? (
                      <div className="registered-status">
                        <span className={`status registered ${status.type}`}>
                          <status.icon /> {status.label}
                          {status.type === "newly-registered" && <span className="pulse"></span>}
                        </span>
                        <button
                          className="register-btn disabled"
                          disabled={true}
                          title="This Email is already registered for this event."
                        >
                          <FaCheckCircle /> Already Registered
                        </button>
                      </div>
                    ) : (
                      <button
                        className="register-btn"
                        onClick={() => handleRegisterClick(event._id)}
                        disabled={status.disabled}
                      >
                        <status.icon /> {status.label}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}