const express = require('express');
const router = express.Router();
const Property = require('../models/Property');
const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const protect = require('../middleware/authMiddleware');

// =========================
// CLOUDINARY STORAGE CONFIG
// =========================
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'trinity-properties'
  }
});

const upload = multer({ storage });

// =========================
// GET ALL PROPERTIES + SEARCH
// =========================
router.get('/', async (req, res) => {
  try {
    const { search = '' } = req.query;

    const query = search
      ? {
          $or: [
            { title: { $regex: search, $options: 'i' } },
            { name: { $regex: search, $options: 'i' } }
          ]
        }
      : {};

    const properties = await Property.find(query).sort({ createdAt: -1 });

    res.status(200).json(properties);
  } catch (error) {
    console.error('GET /api/properties error:', error);
    res.status(500).json({
      message: 'Failed to fetch properties',
      error: error.message
    });
  }
});

// =========================
// GET ONE PROPERTY BY ID
// =========================
router.get('/:id', async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    res.json(property);
  } catch (error) {
    console.error('GET /api/properties/:id error:', error);
    res.status(500).json({
      message: 'Failed to fetch property',
      error: error.message
    });
  }
});

// =========================
// POST NEW PROPERTY WITH MULTIPLE IMAGE UPLOAD
// =========================
router.post('/', protect, (req, res) => {
  upload.array('images', 20)(req, res, async function (err) {
    if (err) {
      console.error('Multer/Cloudinary upload error:', err);
      return res.status(500).json({
        message: 'Image upload failed',
        error: err.message
      });
    }

    try {
      const {
        name,
        title,
        location,
        listing,
        type,
        price,
        bedrooms,
        bathrooms,
        size,
        description,
        parking,
        interior,
        exterior,
        featured
      } = req.body;

      const uploadedImages =
        req.files && req.files.length
          ? req.files.map(file => file.path)
          : [];

      const newProperty = new Property({
        name: name || title || '',
        title: title || name || '',
        location,
        listing,
        type,
        price,
        bedrooms,
        bathrooms,
        size,
        image: uploadedImages[0] || '',
        images: uploadedImages,
        description,
        parking,
        interior,
        exterior,
        featured: featured === 'true' || featured === true
      });

      const savedProperty = await newProperty.save();

      res.status(201).json(savedProperty);
    } catch (error) {
      console.error('POST /api/properties error:', error);
      res.status(500).json({
        message: 'Failed to add property',
        error: error.message
      });
    }
  });
});

// =========================
// UPDATE PROPERTY BY ID
// =========================
router.put('/:id', protect, (req, res) => {
  upload.array('images', 20)(req, res, async function (err) {
    if (err) {
      console.error('Multer/Cloudinary update upload error:', err);
      return res.status(500).json({
        message: 'Image upload failed during update',
        error: err.message
      });
    }

    try {
      const {
        name,
        location,
        listing,
        type,
        price,
        bedrooms,
        bathrooms,
        size,
        description,
        parking,
        interior,
        exterior,
        featured
      } = req.body;

      const existingProperty = await Property.findById(req.params.id);

      if (!existingProperty) {
        return res.status(404).json({ message: 'Property not found' });
      }

      const uploadedImages =
        req.files && req.files.length
          ? req.files.map(file => file.path)
          : existingProperty.images || [];

      existingProperty.name = name || existingProperty.name;
      existingProperty.location = location || existingProperty.location;
      existingProperty.listing = listing || existingProperty.listing;
      existingProperty.type = type || existingProperty.type;
      existingProperty.price = price || existingProperty.price;
      existingProperty.bedrooms = bedrooms || existingProperty.bedrooms;
      existingProperty.bathrooms = bathrooms || existingProperty.bathrooms;
      existingProperty.size = size || existingProperty.size;
      existingProperty.description = description || existingProperty.description;
      existingProperty.parking = parking || existingProperty.parking;
      existingProperty.interior = interior || existingProperty.interior;
      existingProperty.exterior = exterior || existingProperty.exterior;
      existingProperty.featured = featured === 'true' || featured === true;
      existingProperty.images = uploadedImages;
      existingProperty.image = uploadedImages[0] || existingProperty.image;

      const savedProperty = await existingProperty.save();

      res.json(savedProperty);
    } catch (error) {
      console.error('PUT /api/properties/:id error:', error);
      res.status(500).json({
        message: 'Failed to update property',
        error: error.message
      });
    }
  });
});

// =========================
// DELETE PROPERTY BY ID
// =========================
router.delete('/:id', protect, async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    await Property.findByIdAndDelete(req.params.id);

    res.json({ message: 'Property deleted successfully' });
  } catch (error) {
    console.error('DELETE /api/properties/:id error:', error);
    res.status(500).json({
      message: 'Failed to delete property',
      error: error.message
    });
  }
});

module.exports = router;