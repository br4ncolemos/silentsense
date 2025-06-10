// server/routes/index.js

const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

// Usamos o nosso gerenciador de banco de dados!
const db = require('../data/db-handler');

// Configuração do Multer (upload de imagem)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const destPath = path.join(__dirname, '..', '..', 'public', 'images');
        fs.mkdirSync(destPath, { recursive: true });
        cb(null, destPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `aluno-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});
const upload = multer({ storage });

// Módulo que exporta o router com todas as rotas da API
module.exports = function(getDistanciaCallback, getSimuladorStatusCallback, setSimuladorCallback) {
    const router = express.Router();

    // Rota para pegar os alunos
    router.get('/alunos', (req, res) => {
        const database = db.getDatabase();
        console.log("[API] Servindo alunos do db-handler.");
        res.json(database.alunos || []); // Retorna os alunos do estado em memória
    });

    // Rota para pegar as salas
    router.get('/salas', (req, res) => {
        const database = db.getDatabase();
        res.json(database.salas || []);
    });

    // Rota para cadastrar aluno
    router.post('/alunos', upload.single('profileImage'), (req, res) => {
        const database = db.getDatabase();
        const novoAluno = {
            id: db.getNextId('alunos'),
            nome: req.body.name,
            // ... (resto dos campos do aluno)
            imagemUrl: req.file ? `images/${req.file.filename}` : 'images/perfil_padrao.jpg'
        };
        database.alunos.push(novoAluno);
        db.updateAndSaveDatabase(database);
        res.status(201).json(novoAluno);
    });

    // Suas outras rotas (distancia, configuracoes) podem vir aqui...

    return router;
};