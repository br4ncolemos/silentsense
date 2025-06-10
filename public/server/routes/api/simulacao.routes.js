// server/routes/api/simulacao.routes.js
const express = require('express');
const router = express.Router();
const simulacaoController = require('../../controllers/simulacao.controller');

// GET /api/simular - Obter dados simulados para o dashboard
// O frontend chama `/api/simular` quando o modo admin é ativado
router.get('/', simulacaoController.getSimulacaoData);

module.exports = router;