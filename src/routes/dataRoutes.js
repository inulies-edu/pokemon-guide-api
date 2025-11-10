// src/routes/dataRoutes.js
const express = require('express');
const router = express.Router();
const dataController = require('../controllers/dataConttroller');

// Rota para semear o banco.
// No futuro, protegeríamos ela com um middleware de "Admin"
router.post('/seed-pokemon', dataController.seedPokemonData);

module.exports = router;