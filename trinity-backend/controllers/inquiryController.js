const Inquiry = require('../models/Inquiry');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const createInquiry = async (req, res) => {
  try {
    const { fullName, emailAddress, phoneNumber, message } = req.body;

    if (!fullName || !emailAddress || !message) {
      return res.status(400).json({
        message: 'Full name, email address, and message are required.'
      });
    }

    const inquiry = await Inquiry.create({
      fullName,
      emailAddress,
      phoneNumber,
      message
    });

    await transporter.sendMail({
      from: `"Trinity CW Website" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_RECEIVER,
      subject: `New Inquiry from ${fullName}`,
      html: `
        <h2>New Inquiry</h2>
        <p><strong>Full Name:</strong> ${fullName}</p>
        <p><strong>Email:</strong> ${emailAddress}</p>
        <p><strong>Phone:</strong> ${phoneNumber || 'Not provided'}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
      `
    });

    res.status(201).json({
      message: 'Inquiry sent successfully.',
      inquiry
    });
  } catch (error) {
    console.error('Create inquiry error:', error);
    res.status(500).json({
      message: 'Something went wrong while sending your inquiry.'
    });
  }
};

const getInquiries = async (req, res) => {
  try {
    const inquiries = await Inquiry.find().sort({ createdAt: -1 });
    res.status(200).json(inquiries);
  } catch (error) {
    console.error('Get inquiries error:', error);
    res.status(500).json({
      message: 'Failed to fetch inquiries.'
    });
  }
};

const deleteInquiry = async (req, res) => {
  try {
    const inquiry = await Inquiry.findByIdAndDelete(req.params.id);

    if (!inquiry) {
      return res.status(404).json({
        message: 'Inquiry not found.'
      });
    }

    res.status(200).json({
      message: 'Inquiry deleted successfully.'
    });
  } catch (error) {
    console.error('Delete inquiry error:', error);
    res.status(500).json({
      message: 'Failed to delete inquiry.'
    });
  }
};

module.exports = {
  createInquiry,
  getInquiries,
  deleteInquiry
};