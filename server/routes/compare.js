const express = require('express');
const { authenticate } = require('../middleware/auth');
const compareCalc = require('../utils/compareCalc');

const router = express.Router();

router.post('/', authenticate, (req, res, next) => {
  try {
    const result = compareCalc.runAll(req.body || {});
    res.json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
