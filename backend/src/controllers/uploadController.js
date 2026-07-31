function uploadImage(req, res) {
  if (!req.file) {
    return res.status(400).json({ message: 'No image file provided' });
  }
  res.status(201).json({ url: `/uploads/${req.file.filename}` });
}

module.exports = { uploadImage };
