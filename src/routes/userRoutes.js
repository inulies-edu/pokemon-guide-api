// src/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

// Rotas Públicas (sem o porteiro)
router.post('/register', userController.registerUser);
router.post('/login', userController.loginUser);

// Rotas Protegidas
// Quando alguém for para /me, PRIMEIRO passe pelo 'authMiddleware'
// Se ele deixar, SÓ ENTÃO chame o 'userController.getMyProfile'
router.get('/me', authMiddleware, userController.getMyProfile); // <-- ADICIONE ESTA LINHA

router.post('/setup', authMiddleware, userController.setupCharacter);

module.exports = router;