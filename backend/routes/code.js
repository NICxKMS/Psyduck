const express = require('express');
const router = express.Router();
const { executeCode, getSupportedLanguages, getLatestCode, saveCode, getCodeHistory, shareCode, getSharedCode, getLanguageTemplate } = require('../controllers/codeController');
const { protect } = require('../middleware/authMiddleware');

// Allow code execution without auth in development (for local IDE testing)
router.post('/execute', executeCode);

// Public endpoints to support IDE bootstrapping
router.get('/languages', getSupportedLanguages);
router.get('/languages/:language/template', getLanguageTemplate);
router.get('/latest/:projectId/:milestoneId', getLatestCode);
router.post('/save', saveCode);
router.get('/history/:projectId', getCodeHistory);
router.post('/share', shareCode);
router.get('/shared/:shareId', getSharedCode);

module.exports = router;

