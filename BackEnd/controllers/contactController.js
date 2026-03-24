const Contact = require('../models/Contact');

// Submit contact form
const submitContact = async (req, res) => {
  try {
    console.log('📨 Contact form submission received:', req.body);
    const { name, email, phone, subject, message } = req.body;

    // Validate required fields
    if (!name || !email || !subject || !message) {
      console.log('❌ Validation failed: Missing required fields');
      return res.status(400).json({
        message: 'Name, email, subject, and message are required'
      });
    }

    // Create new contact submission
    console.log('📝 Creating contact object...');
    const contact = new Contact({
      name,
      email,
      phone,
      subject,
      message
    });

    console.log('💾 Saving contact to database...');
    await contact.save();
    console.log('✅ Contact saved successfully:', contact._id);

    res.status(201).json({
      message: 'Thank you! Your message has been sent successfully.',
      contact: {
        id: contact._id,
        name: contact.name,
        email: contact.email,
        subject: contact.subject,
        createdAt: contact.createdAt
      }
    });
  } catch (error) {
    console.error('❌ Contact submission error:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    res.status(500).json({
      message: 'Error submitting contact form. Please try again.',
      error: error.message,
      name: error.name,
      stack: error.stack
    });
  }
};

module.exports = {
  submitContact,
  getContacts: async (req, res) => {
    try {
      const contacts = await Contact.find().sort({ createdAt: -1 }).limit(100);
      res.json(contacts);
    } catch (error) {
      console.error('Get contacts error:', error);
      res.status(500).json({ message: 'Error fetching contacts' });
    }
  },
  getContactById: async (req, res) => {
    try {
      const contact = await Contact.findById(req.params.id);
      if (!contact) {
        return res.status(404).json({ message: 'Contact not found' });
      }
      res.json(contact);
    } catch (error) {
      console.error('Get contact error:', error);
      res.status(500).json({ message: 'Error fetching contact' });
    }
  },
  updateContactStatus: async (req, res) => {
    try {
      const { status } = req.body;
      const contact = await Contact.findByIdAndUpdate(
        req.params.id,
        { status },
        { new: true, runValidators: true }
      );
      if (!contact) {
        return res.status(404).json({ message: 'Contact not found' });
      }
      res.json({ message: 'Contact status updated successfully', contact });
    } catch (error) {
      console.error('Update contact error:', error);
      res.status(500).json({ message: 'Error updating contact' });
    }
  },
  deleteContact: async (req, res) => {
    try {
      const contact = await Contact.findByIdAndDelete(req.params.id);
      if (!contact) {
        return res.status(404).json({ message: 'Contact not found' });
      }
      res.json({ message: 'Contact deleted successfully' });
    } catch (error) {
      console.error('Delete contact error:', error);
      res.status(500).json({ message: 'Error deleting contact' });
    }
  }
};
