const Lab = require('../models/Lab');
const Step = require('../models/Step');

exports.getAllLabs = async (req, res) => {
  try {
    const labs = await Lab.find(); // Removed .select('-steps') to include steps for length count
    res.json(labs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getLabById = async (req, res) => {
  try {
    const lab = await Lab.findOne({ labId: req.params.labId }).populate('steps');
    if (!lab) return res.status(404).json({ message: 'Lab not found' });
    res.json(lab);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
