// server/server.js (VERSÃO FINAL COMPLETA COM CRUD)

const express = require('express');
const path = require('path');
const cors = require('cors');
const axios = require('axios');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// --- CONFIGURAÇÃO DO JSONBIN.IO ---
const JSONBIN_API_KEY = "$2a$10$Jay/xyfmuFUEsGq2MX6iquj7OkEpzQAAk4m3dod/J9C2X45IqAdeG";
const ALUNOS_BIN_ID = "684852998960c979a5a79a0d";
const JSONBIN_API_URL = `https://api.jsonbin.io/v3/b/${ALUNOS_BIN_ID}`;
const jsonBinHeaders = {
    'Content-Type': 'application/json',
    'X-Master-Key': JSONBIN_API_KEY
};

let simuladorAtivo = true;
const alunosPadraoPath = path.join(__dirname, 'data', 'alunosPadrao.json');

// --- MIDDLEWARES ---
app.use(cors({ origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'] }));
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// ==========================================================
// ROTAS DA API
// ==========================================================

// --- GET /api/alunos --- (Ler todos)
app.get('/api/alunos', async (req, res) => { /* ... seu código continua igual ... */ });

// --- PUT /api/configuracoes ---
app.put('/api/configuracoes', (req, res) => { /* ... seu código continua igual ... */ });

// --- POST /api/alunos --- (Criar novo)
app.post('/api/alunos', async (req, res) => { /* ... seu código continua igual ... */ });


// ==========================================================
// NOVAS ROTAS PARA EDIÇÃO E EXCLUSÃO
// ==========================================================

// --- GET /api/alunos/:id --- (Ler um aluno específico)
app.get('/api/alunos/:id', async (req, res) => {
    try {
        const alunoId = parseInt(req.params.id);
        const getResponse = await axios.get(`${JSONBIN_API_URL}/latest`, { headers: jsonBinHeaders });
        const alunos = getResponse.data.record || [];
        const alunoEncontrado = alunos.find(a => a.id === alunoId);
        
        if (alunoEncontrado) {
            res.json(alunoEncontrado);
        } else {
            res.status(404).json({ message: "Aluno não encontrado." });
        }
    } catch (error) {
        res.status(500).json({ message: "Erro ao buscar aluno." });
    }
});

// --- PUT /api/alunos/:id --- (Editar um aluno)
app.put('/api/alunos/:id', async (req, res) => {
    try {
        const alunoId = parseInt(req.params.id);
        const getResponse = await axios.get(`${JSONBIN_API_URL}/latest`, { headers: jsonBinHeaders });
        let alunos = getResponse.data.record || [];
        
        const index = alunos.findIndex(a => a.id === alunoId);

        if (index !== -1) {
            // Atualiza o objeto do aluno com os novos dados do corpo da requisição
            alunos[index] = { ...alunos[index], ...req.body, id: alunoId };
            // Salva a lista inteira de volta no JSONBin
            await axios.put(JSONBIN_API_URL, alunos, { headers: jsonBinHeaders });
            res.json(alunos[index]); // Retorna o aluno atualizado
        } else {
            res.status(404).json({ message: "Aluno não encontrado para editar." });
        }
    } catch (error) {
        res.status(500).json({ message: "Erro ao editar aluno." });
    }
});

// --- DELETE /api/alunos/:id --- (Excluir um aluno)
app.delete('/api/alunos/:id', async (req, res) => {
    try {
        const alunoId = parseInt(req.params.id);
        const getResponse = await axios.get(`${JSONBIN_API_URL}/latest`, { headers: jsonBinHeaders });
        let alunos = getResponse.data.record || [];

        const novosAlunos = alunos.filter(a => a.id !== alunoId);

        if (alunos.length === novosAlunos.length) {
            return res.status(404).json({ message: "Aluno não encontrado para excluir." });
        }
        
        // Salva a nova lista (sem o aluno excluído) de volta no JSONBin
        await axios.put(JSONBIN_API_URL, novosAlunos, { headers: jsonBinHeaders });
        res.status(204).send(); // 204 No Content é a resposta padrão para um DELETE bem-sucedido
    } catch (error) {
        res.status(500).json({ message: "Erro ao excluir aluno." });
    }
});
// ==========================================================


// Rota de Fallback e Inicialização
app.get('*', (req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'index.html')));
app.listen(PORT, () => console.log(`🚀 Servidor COMPLETO COM CRUD rodando na porta ${PORT}`));
