const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.post('/upload', protect, upload.single('file'), documentController.uploadFile);
router.get('/topic/:topic_id', protect, documentController.getDocumentsByTopic);

module.exports = router;