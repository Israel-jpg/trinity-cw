const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: { type: String, required: true },
  listing: { type: String, enum: ['sale', 'rent', 'shortlet'], required: true },
  type: { type: String, enum: ['apartment', 'duplex', 'villa'], required: true },
  price: { type: Number, required: true },

  bedrooms: Number,
  bathrooms: Number,
  size: String,

  image: String,
  images: [String],

  description: String,
  parking: String,
  interior: String,
  exterior: String,

  featured: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Property', propertySchema);