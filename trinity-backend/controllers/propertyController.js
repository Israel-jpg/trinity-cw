const Property = require('../models/Property');

const getProperties = async (req, res) => {
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
    console.error('GET PROPERTIES ERROR:', error);
    res.status(500).json({
      message: 'Failed to fetch properties',
      error: error.message
    });
  }
};

module.exports = {
  getProperties,
  // other controllers...
};