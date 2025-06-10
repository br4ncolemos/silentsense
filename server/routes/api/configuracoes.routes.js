// server/routes/api/configuracoes.routes.js
const express = require('express');
const router = express.Router();
const configuracaoController = require('../../controllers/configuracao.controller');

// GET /api/configuracoes - Obter as configurações atuais
router.get('/', configuracaoController.getConfiguracoes);

// PUT /api/configuracoes - Atualizar as configurações
router.put('/', configuracaoController.updateConfiguracoes);

// POST /api/configuracoes/backup - Para acionar o download do backup
// (O nome da rota é /backup, mas o path completo será /api/configuracoes/backup)
router.post('/backup', configuracaoController.backupData); 

// POST /api/configuracoes/restore - Para receber um arquivo de backup
// NOTA: A implementação real de upload de arquivo com multer não está aqui.
router.post('/restore', configuracaoController.restoreData);

// POST /api/configuracoes/reset - Para limpar todos os dados
router.post('/reset', configuracaoController.resetData);

module.exports = router;