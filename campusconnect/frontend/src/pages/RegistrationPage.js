import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../utils/api";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

// Initialize Stripe with your publishable key
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY || 'pk_test_your_test_key_here');

// Styles
const styles = {
  successBox: {
    background: '#e8f5e9',
    border: '1px solid #4caf50',
    borderRadius: '8px',
    padding: '20px',
    margin: '20px 0',
    textAlign: 'center',
  },
  successIcon: {
    fontSize: '48px',
    color: '#4caf50',
    marginBottom: '15px',
  },
  successTitle: {
    color: '#2e7d32',
    margin: '10px 0',
  },
  successButton: {
    marginTop: '15px',
    padding: '10px 20px',
    background: '#4caf50',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '16px',
  },
  paymentSection: {
    marginTop: '20px',
    padding: '20px',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    background: '#f9f9f9',
  },
  cardElement: {
    margin: '15px 0',
    padding: '15px',
    border: '1px solid #e0e0e0',
    borderRadius: '4px',
    background: 'white',
  },
  payButton: {
    width: '100%',
    padding: '12px',
    background: '#4caf50',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '10px',
  },
  cancelButton: {
    width: '100%',
    padding: '12px',
    background: '#f5f5f5',
    color: '#333',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '16px',
    marginTop: '10px',
    cursor: 'pointer',
  },
  registerButton: {
    width: '100%',
    padding: '12px',
    background: '#1976d2',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '16px',
  },
};

// Main component with Stripe Elements provider
const RegistrationPageWithStripe = (props) => {
  return (
    <Elements stripe={stripePromise} options={{locale: 'en'}}>
      <RegistrationPage {...props} />
    </Elements>
  );
};

export default RegistrationPageWithStripe;

// Stripe payment form component
const CheckoutForm = ({ handlePaymentRegistration, processing, onCancel }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }

    setError(null);

    try {
      const { error: stripeError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: elements.getElement(CardElement),
      });

      if (stripeError) {
        throw new Error(stripeError.message);
      }

      await handlePaymentRegistration(paymentMethod);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={styles.cardElement}>
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
              invalid: {
                color: '#9e2146',
              },
            },
          }}
        />
      </div>
      {error && <div style={{ color: 'red', margin: '10px 0' }}>{error}</div>}
      <button
        type="submit"
        disabled={!stripe || processing}
        style={styles.payButton}
      >
        {processing ? 'Processing...' : 'Pay Now'}
      </button>
      <button
        type="button"
        onClick={onCancel}
        style={styles.cancelButton}
        disabled={processing}
      >
        Cancel
      </button>
    </form>
  );
};

// This export is handled above

function RegistrationPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isAlreadyRegistered, setIsAlreadyRegistered] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [ticketSent, setTicketSent] = useState(false);
  const [registrationData, setRegistrationData] = useState(null);

  useEffect(() => {
    if (!id) {
      setError("Invalid event ID. Please check the URL.");
      setLoading(false);
      return;
    }

    const checkRegistrationStatus = async () => {
      setLoading(true);
      setError("");
      
      try {
        // Check localStorage first for immediate feedback
        const storedRegistered = JSON.parse(localStorage.getItem("registeredEvents") || "[]");
        const isLocallyRegistered = storedRegistered.includes(id);
        
        // Fetch event details and user registration status
        const [eventRes, userRes] = await Promise.all([
          API.get(`/events/${id}`),
          API.get("/auth/me").catch(() => ({ data: { registeredEvents: storedRegistered } }))
        ]);
        
        setEvent(eventRes.data);
        
        // Check if registered either locally or on server
        const serverRegistered = userRes.data.registeredEvents || [];
        const isRegistered = isLocallyRegistered || serverRegistered.includes(id);
        
        setIsAlreadyRegistered(isRegistered);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.error || "Failed to load event");
        setLoading(false);
      }
    };

    checkRegistrationStatus();
  }, [id]);

  if (loading) return <div className="loading-spinner">Loading...</div>;
  if (error)
    return <div style={{ color: "red", fontWeight: "bold" }}>{error}</div>;

  const handleFreeRegistration = async () => {
    setFormError("");
    setFormSuccess("");
    setSubmitting(true);

    try {
      const res = await API.post(`/events/${id}/register`, { 
        name, 
        email,
        phone: "" // Add phone if needed
      });
      
      // Update local storage
      const currentRegistered = JSON.parse(localStorage.getItem("registeredEvents") || "[]");
      const updatedRegistered = [...new Set([...currentRegistered, id])];
      localStorage.setItem("registeredEvents", JSON.stringify(updatedRegistered));
      
      // Update component state
      setRegistrationData(res.data);
      setTicketSent(true);
      setIsAlreadyRegistered(true);
      setFormSuccess("Registration successful! Check your email for your ticket.");
      setShowSuccessModal(true);

      // Redirect after delay
      setTimeout(() => {
        setShowSuccessModal(false);
        navigate(`/student-dashboard?registered=${id}&success=true`);
      }, 3000);

    } catch (err) {
      setFormError(
        err.response?.data?.error || "Registration failed. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handlePaymentRegistration = async (paymentMethod) => {
    setPaymentProcessing(true);
    setFormError("");

    try {
      const { data: { clientSecret, requiresAction } } = await API.post(
        `/events/${id}/register-with-payment`,
        { 
          name, 
          email,
          phone: "", // Add phone if needed
          paymentMethodId: paymentMethod.id,
          amount: Math.round(event.price * 100) // amount in cents
        }
      );

      if (requiresAction) {
        // Handle 3D Secure authentication
        const stripe = await stripePromise;
        const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(clientSecret);
        
        if (confirmError) {
          throw new Error(confirmError.message);
        }

        if (paymentIntent.status === 'succeeded') {
          await handleSuccessfulPayment(paymentIntent);
        }
      } else {
        // Payment succeeded without additional actions
        await handleSuccessfulPayment();
      }
    } catch (err) {
      setFormError(err.message || "Payment processing failed. Please try again.");
      setPaymentProcessing(false);
    }
  };

  const handleSuccessfulPayment = async (paymentIntent) => {
    try {
      // Update local storage
      const currentRegistered = JSON.parse(localStorage.getItem("registeredEvents") || "[]");
      const updatedRegistered = [...new Set([...currentRegistered, id])];
      localStorage.setItem("registeredEvents", JSON.stringify(updatedRegistered));
      
      // Update component state
      setTicketSent(true);
      setIsAlreadyRegistered(true);
      setFormSuccess("Payment and registration successful! Check your email for your ticket.");
      setShowSuccessModal(true);

      // Redirect after delay
      setTimeout(() => {
        setShowSuccessModal(false);
        navigate(`/student-dashboard?registered=${id}&success=true`);
      }, 3000);
    } catch (err) {
      console.error("Error after payment:", err);
      setFormError("Registration successful, but there was an error updating your details.");
    } finally {
      setPaymentProcessing(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (event.price > 0) {
      setShowPaymentForm(true);
    } else {
      await handleFreeRegistration();
    }
  };

  const handleBackToDashboard = () => {
    navigate("/student-dashboard");
  };

  return (
    <div
      className="registration-page"
      style={{
        maxWidth: 500,
        margin: "40px auto",
        background: "#fff",
        borderRadius: 12,
        boxShadow: "0 4px 24px rgba(71, 49, 49, 0.1)",
        padding: 32,
      }}
    >
      <button
        onClick={handleBackToDashboard}
        style={{
          background: "none",
          border: "1px solid #ddd",
          padding: "8px 16px",
          borderRadius: 4,
          cursor: "pointer",
          marginBottom: 20,
        }}
      >
        ← Back to Dashboard
      </button>

      <h2>Register for Event</h2>
      
      {event?.imageUrl && (
        <img
          src={event.imageUrl || "/placeholder.svg"}
          alt={event.name}
          style={{
            width: "100%",
            borderRadius: 8,
            marginBottom: 18,
            objectFit: "cover",
            maxHeight: 220,
          }}
        />
      )}
      
      <h3>{event?.name}</h3>
      <p>
        <b>Date:</b> {event?.date ? new Date(event.date).toLocaleDateString() : "N/A"}
      </p>
      <p>
        <b>Location:</b> {event?.location || "N/A"}
      </p>
      <p>
        <b>Organizer:</b> {event?.organizer || "N/A"}
      </p>

      {!localStorage.getItem("token") ? (
        <div style={{ color: "red", fontWeight: "bold", margin: "24px 0" }}>
          You must be logged in to register. <a href="/login">Login here</a>.
        </div>
      ) : ticketSent ? (
        <div style={styles.successBox}>
          <div style={styles.successIcon}>✓</div>
          <h3 style={styles.successTitle}>Registration Complete!</h3>
          <p>Your ticket has been sent to {email}</p>
          <button
            onClick={handleBackToDashboard}
            style={styles.successButton}
          >
            Back to Dashboard
          </button>
        </div>
      ) : isAlreadyRegistered ? (
        <div
          style={{
            background: "#e8f5e8",
            border: "2px solid #4caf50",
            borderRadius: 8,
            padding: 20,
            margin: "24px 0",
            textAlign: "center",
          }}
        >
          <div style={{ color: "#2e7d32", fontSize: 18, fontWeight: "bold" }}>
            ✅ Already Registered
          </div>
          <p style={{ color: "#2e7d32", margin: "8px 0 0 0" }}>
            You are already registered for this event!
          </p>
          <button
            onClick={handleBackToDashboard}
            style={{
              marginTop: 15,
              padding: "10px 20px",
              background: "#4caf50",
              color: "white",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              fontWeight: 500,
            }}
          >
            Back to Dashboard
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ marginTop: 28 }}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontWeight: 500, marginBottom: 6 }}>
              Name
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={submitting}
                style={{
                  width: "100%",
                  padding: 8,
                  borderRadius: 4,
                  border: "1px solid #ccc",
                  marginTop: 4,
                }}
              />
            </label>
          </div>
          
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontWeight: 500, marginBottom: 6 }}>
              Email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={submitting}
                style={{
                  width: "100%",
                  padding: 8,
                  borderRadius: 4,
                  border: "1px solid #ccc",
                  marginTop: 4,
                }}
              />
            </label>
          </div>
          
          {showPaymentForm && event?.price > 0 ? (
            <div style={styles.paymentSection}>
              <h4>Payment Details</h4>
              <p>Amount to pay: ${event.price.toFixed(2)}</p>
              <CheckoutForm 
                handlePaymentRegistration={handlePaymentRegistration}
                processing={paymentProcessing}
                onCancel={() => setShowPaymentForm(false)}
              />
            </div>
          ) : (
            <button
              type="submit"
              disabled={submitting}
              style={styles.registerButton}
            >
              {submitting ? 'Registering...' : 'Register'}
            </button>
          )}
          
          {formError && (
            <div style={{ color: "red", marginTop: 14, fontWeight: 500 }}>
              {formError}
            </div>
          )}
          
          {formSuccess && (
            <div style={{ color: "green", marginTop: 14, fontWeight: 500 }}>
              {formSuccess}
            </div>
          )}
        </form>
      )}

      {showSuccessModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: "#fff",
              padding: "32px 48px",
              borderRadius: 12,
              boxShadow: "0 4px 24px rgba(0,0,0,0.2)",
              textAlign: "center",
              fontSize: 20,
              fontWeight: 600,
              maxWidth: 400,
            }}
          >
            <div style={{ color: "#4caf50", marginBottom: 16 }}>
              ✅ Registration Successful!
            </div>
            <div style={{ fontSize: 16, color: "#666" }}>
              Redirecting to dashboard...
            </div>
          </div>
        </div>
      )}
    </div>
  );
}