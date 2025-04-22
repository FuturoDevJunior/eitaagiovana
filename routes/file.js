const express = require('express');
const multer = require('multer');

// Configuração do multer: armazenamento em memória
const storage = multer.memoryStorage();
const upload = multer({ storage });

const router = express.Router();

/**
 * @route POST /
 * @desc Recebe upload de arquivo e retorna metadados
 * @access Public
 */
router.post('/', upload.single('upfile'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  const { originalname, mimetype, size } = req.file;
  res.json({
    name: originalname,
    type: mimetype,
    size: size
  });
});

module.exports = router; 