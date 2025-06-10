// server/routes/api/salas.routes.js
const express = require('express');
const router = express.Router();
const salaController = require('../../controllers/sala.controller');

// GET /api/salas - Listar todas as salas
router.get('/', salaController.getAllSalas);

// POST /api/salas - Criar uma nova sala
router.post('/', salaController.createSala);

// GET /api/salas/:id - Obter uma sala específica
router.get('/:id', salaController.getSalaById);

// PUT /api/salas/:id - Atualizar uma sala existente
router.put('/:id', salaController.updateSala);

// DELETE /api/salas/:id - Deletar uma sala
router.delete('/:id', salaController.deleteSala);

module.exports = router;