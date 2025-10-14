const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const Event = require('../models/Event');
const User = require('../models/User');
const Registration = require('../models/Registration');

// Create a new event
router.post('/', async (req, res) => {
  try {
    const { name, date, location, organizer, imageUrl } = req.body;
    
    // Basic validation
    if (!name || !date || !location || !organizer) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Create new event
    const newEvent = new Event({
      name,
      date,
      location,
      organizer,
      imageUrl: imageUrl || '',
      registrations: []
    });

    // Save to database
    const savedEvent = await newEvent.save();
    
    res.status(201).json(savedEvent);
  } catch (err) {
    console.error('Error creating event:', err);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

// Update an existing event
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, date, location, organizer, imageUrl } = req.body;
    
    // Basic validation
    if (!name || !date || !location || !organizer) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Find and update the event
    const updatedEvent = await Event.findByIdAndUpdate(
      id,
      { name, date, location, organizer, imageUrl: imageUrl || '' },
      { new: true, runValidators: true }
    );

    if (!updatedEvent) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    res.json(updatedEvent);
  } catch (err) {
    console.error('Error updating event:', err);
    res.status(500).json({ error: 'Failed to update event' });
  }
});

// Delete an event
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find and delete the event
    const deletedEvent = await Event.findByIdAndDelete(id);
    
    if (!deletedEvent) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    // Also delete all registrations for this event
    await Registration.deleteMany({ event: id });
    
    res.json({ message: 'Event deleted successfully' });
  } catch (err) {
    console.error('Error deleting event:', err);
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

// Configure nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail', // or your email service
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Generate ticket PDF
async function generateTicketPDF(registration, event) {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument();
      const chunks = [];

      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      // Generate QR code
      const qrCodeData = `Event: ${event.name}\nName: ${registration.name}\nEmail: ${registration.email}\nTicket ID: ${registration._id}`;
      const qrCodeImage = await QRCode.toDataURL(qrCodeData);

      // Add content to PDF
      doc.fontSize(24).text('EVENT TICKET', 50, 50);
      doc.fontSize(18).text(event.name, 50, 100);
      
      doc.fontSize(12)
         .text(`Date: ${new Date(event.date).toLocaleDateString()}`, 50, 140)
         .text(`Location: ${event.location}`, 50, 160)
         .text(`Organizer: ${event.organizer}`, 50, 180)
         .text(`Attendee: ${registration.name}`, 50, 220)
         .text(`Email: ${registration.email}`, 50, 240)
         .text(`Ticket ID: ${registration._id}`, 50, 260);

      if (registration.phone) {
        doc.text(`Phone: ${registration.phone}`, 50, 280);
      }

      // Add QR code
      const qrBuffer = Buffer.from(qrCodeImage.split(',')[1], 'base64');
      doc.image(qrBuffer, 400, 200, { width: 100 });

      doc.fontSize(10)
         .text('Scan QR code for verification', 400, 310)
         .text('Please bring this ticket to the event', 50, 350)
         .text('Thank you for registering!', 50, 370);

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

// Send ticket email
async function sendTicketEmail(registration, event, ticketPDF) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: registration.email,
    subject: `Your Ticket for ${event.name}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #1976d2, #42a5f5); color: white; padding: 30px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px;">🎉 Registration Confirmed!</h1>
        </div>
        
        <div style="padding: 30px; background: #f9f9f9;">
          <h2 style="color: #333; margin-bottom: 20px;">Hello ${registration.name}!</h2>
          
          <p style="font-size: 16px; line-height: 1.6; color: #666;">
            Thank you for registering for <strong>${event.name}</strong>. Your registration has been confirmed!
          </p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #1976d2;">
            <h3 style="margin-top: 0; color: #1976d2;">Event Details:</h3>
            <p><strong>Event:</strong> ${event.name}</p>
            <p><strong>Date:</strong> ${new Date(event.date).toLocaleDateString()}</p>
            <p><strong>Time:</strong> ${event.time || 'TBA'}</p>
            <p><strong>Location:</strong> ${event.location}</p>
            <p><strong>Organizer:</strong> ${event.organizer}</p>
          </div>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4caf50;">
            <h3 style="margin-top: 0; color: #4caf50;">Your Registration Details:</h3>
            <p><strong>Name:</strong> ${registration.name}</p>
            <p><strong>Email:</strong> ${registration.email}</p>
            ${registration.phone ? `<p><strong>Phone:</strong> ${registration.phone}</p>` : ''}
            <p><strong>Ticket ID:</strong> ${registration._id}</p>
          </div>
          
          <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #ffeaa7;">
            <p style="margin: 0; color: #856404;">
              <strong>📎 Important:</strong> Your ticket is attached to this email. Please bring it (printed or on your phone) to the event for entry.
            </p>
          </div>
          
          <p style="font-size: 14px; color: #888; margin-top: 30px;">
            If you have any questions, please contact the event organizer or reply to this email.
          </p>
        </div>
        
        <div style="background: #333; color: white; padding: 20px; text-align: center;">
          <p style="margin: 0; font-size: 14px;">Thank you for choosing our events!</p>
        </div>
      </div>
    `,
    attachments: [
      {
        filename: `ticket-${event.name.replace(/\s+/g, '-')}.pdf`,
        content: ticketPDF,
        contentType: 'application/pdf'
      }
    ]
  };

  return transporter.sendMail(mailOptions);
}

// Free registration endpoint
router.post('/:id/register', async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    const eventId = req.params.id;

    // Find event
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Check if already registered
    const existingRegistration = await Registration.findOne({
      event: eventId,
      email: email
    });

    if (existingRegistration) {
      return res.status(400).json({ error: 'This Email is already registered for this event' });
    }

    // Create registration
    const registration = new Registration({
      event: eventId,
      name,
      email,
      phone,
      registrationDate: new Date(),
      paymentStatus: 'free'
    });

    await registration.save();

    // Update user's registered events (only if user is authenticated)
    let user = null;
    if (req.user && req.user._id) {
      user = await User.findById(req.user._id);
      if (user) {
        user.registeredEvents.push(eventId);
        await user.save();
      }
    }

    // Generate and send ticket (handle email errors gracefully)
    try {
      const ticketPDF = await generateTicketPDF(registration, event);
      await sendTicketEmail(registration, event, ticketPDF);
      
      res.json({
        success: true,
        message: 'Registration successful! Check your email for your ticket.',
        registrationId: registration._id,
        registeredEvents: user ? user.registeredEvents : []
      });
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      
      // Registration was successful, but email failed
      res.json({
        success: true,
        message: 'Registration successful! However, we could not send your ticket via email. Please contact support.',
        registrationId: registration._id,
        registeredEvents: user ? user.registeredEvents : [],
        emailError: true
      });
    }

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Paid registration endpoint
router.post('/:id/register-with-payment', async (req, res) => {
  try {
    const { name, email, phone, paymentMethodId, amount } = req.body;
    const eventId = req.params.id;

    // Find event
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Check if already registered
    const existingRegistration = await Registration.findOne({
      event: eventId,
      email: email
    });

    if (existingRegistration) {
      return res.status(400).json({ error: 'This Email is already registered for this event' });
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount, // amount in cents
      currency: 'usd',
      payment_method: paymentMethodId,
      confirmation_method: 'manual',
      confirm: true,
      metadata: {
        eventId: eventId,
        eventName: event.name,
        attendeeName: name,
        attendeeEmail: email
      }
    });

    // Handle payment result
    if (paymentIntent.status === 'requires_action') {
      return res.json({
        requiresAction: true,
        clientSecret: paymentIntent.client_secret
      });
    } else if (paymentIntent.status === 'succeeded') {
      // Payment successful, create registration
      const registration = new Registration({
        event: eventId,
        name,
        email,
        phone,
        registrationDate: new Date(),
        paymentStatus: 'paid',
        paymentIntentId: paymentIntent.id,
        amountPaid: amount / 100 // Convert back to dollars
      });

      await registration.save();

      // Update user's registered events (only if user is authenticated)
      let user = null;
      if (req.user && req.user.id) {
        user = await User.findById(req.user.id);
        if (user) {
          user.registeredEvents.push(eventId);
          await user.save();
        }
      }

      // Generate and send ticket (handle email errors gracefully)
      try {
        const ticketPDF = await generateTicketPDF(registration, event);
        await sendTicketEmail(registration, event, ticketPDF);
        
        res.json({
          success: true,
          message: 'Payment and registration successful! Check your email for your ticket.',
          registrationId: registration._id,
          paymentIntentId: paymentIntent.id,
          registeredEvents: user ? user.registeredEvents : []
        });
      } catch (emailError) {
        console.error('Email sending failed:', emailError);
        
        // Registration was successful, but email failed
        res.json({
          success: true,
          message: 'Payment and registration successful! However, we could not send your ticket via email. Please contact support.',
          registrationId: registration._id,
          paymentIntentId: paymentIntent.id,
          registeredEvents: user ? user.registeredEvents : [],
          emailError: true
        });
      }

    } else {
      res.status(400).json({ error: 'Payment failed' });
    }

  } catch (error) {
    console.error('Payment registration error:', error);
    res.status(500).json({ error: 'Payment processing failed' });
  }
});

// Get event by ID
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    res.json(event);
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({ error: 'Failed to fetch event' });
  }
});

// Get all events
router.get('/', async (req, res) => {
  try {
    const events = await Event.find();
    res.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

module.exports = router;