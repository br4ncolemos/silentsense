// server/routes/api/relatorios.routes.js
const express = require('express');
const router = express.Router();
const relatorioController = require('../../controllers/relatorio.controller');

// GET /api/relatorios - Listar todos os relatórios
router.get('/', relatorioController.getAllRelatorios);

// POST /api/relatorios - Criar um novo relatório
router.post('/', relatorioController.createRelatorio);

// Não teremos GET por ID, PUT ou DELETE para relatórios nesta simulação,
// mas poderiam ser adicionados aqui se necessário.
// Ex: router.get('/:id', relatorioController.getRelatorioById);
// Ex: router.delete('/:id', relatorioController.deleteRelatorio);

module.exports = router;