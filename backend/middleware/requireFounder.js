module.exports = (req, res, next) => {
  if (!req.user || req.user.role !== 'founder') {
    return res.status(403).json({ error: 'Founder access required' });
  }
  next();
};
