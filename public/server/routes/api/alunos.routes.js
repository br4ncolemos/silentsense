// server/routes/api/alunos.routes.js
const express = require('express');
const router = express.Router();
const alunoController = require('../../controllers/aluno.controller');

// GET /api/alunos - Listar todos os alunos
router.get('/', alunoController.getAllAlunos);

// POST /api/alunos - Criar um novo aluno
router.post('/', alunoController.createAluno);

// GET /api/alunos/:id - Obter um aluno específico
router.get('/:id', alunoController.getAlunoById);

// PUT /api/alunos/:id - Atualizar um aluno existente
router.put('/:id', alunoController.updateAluno);

// DELETE /api/alunos/:id - Deletar um aluno
router.delete('/:id', alunoController.deleteAluno);

module.exports = router;