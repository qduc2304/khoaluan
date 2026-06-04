const express = require('express');
const router = express.Router();
const campaignController = require('../controllers/campaignController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Cấu hình các route cho campaign
router.get('/', protect, campaignController.getAllCampaigns);
router.get('/:id/stats', protect, authorize('specialist', 'director'), campaignController.getCampaignStats);
router.post('/', protect, authorize('specialist', 'director'), campaignController.createCampaign);
router.put('/:id', protect, authorize('specialist', 'director'), campaignController.updateCampaign);
router.delete('/:id', protect, authorize('specialist', 'director'), campaignController.deleteCampaign);

module.exports = router;