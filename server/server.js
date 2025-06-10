// server/server.js (VERSÃO HÍBRIDA)

const express = require('express');
const path = require('path');
const cors = require('cors');
const morgan = require('morgan');
const multer = require('multer');
const axios = require('axios');
const fs = require('fs'); // Precisamos do fs de volta para ler o alunosPadrao.json

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

// --- MODO DE SIMULAÇÃO ---
let simuladorAtivo = true; // Começa ativo
const alunosPadraoPath = path.join(__dirname, 'data', 'alunosPadrao.json');

// --- MIDDLEWARES ---
app.use(cors({ origin: '*' }));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));
const upload = multer({ storage: multer.memoryStorage() });

// ==========================================================
// ROTAS DA API
// ==========================================================

// --- ROTA GET /api/alunos (COM LÓGICA DE SIMULAÇÃO) ---
app.get('/api/alunos', async (req, res) => {
    if (simuladorAtivo) {
        // MODO SIMULAÇÃO: Lê o arquivo local
        console.log("Modo Simulação: Lendo de alunosPadrao.json local...");
        try {
            const data = fs.readFileSync(alunosPadraoPath, 'utf8');
            res.json(JSON.parse(data));
        } catch (error) {
            console.error("Erro ao ler alunosPadrao.json:", error);
            res.json([]);
        }
    } else {
        // MODO NORMAL: Lê do JSONBin.io
        try {
            console.log("Modo Real: Buscando alunos do JSONBin...");
            const response = await axios.get(`${JSONBIN_API_URL}/latest`, { headers: jsonBinHeaders });
            res.json(response.data.record || []);
        } catch (error) {
            console.error("Erro ao buscar alunos do JSONBin:", error.response?.data);
            res.status(500).json({ message: 'Erro ao buscar dados da nuvem.' });
        }
    }
});

// --- ROTA PUT /api/configuracoes (PARA MUDAR O MODO) ---
app.put('/api/configuracoes', (req, res) => {
    const novoEstado = req.body.simulacaoAtiva;
    if (typeof novoEstado === 'boolean') {
        simuladorAtivo = novoEstado;
        console.log(`[API] Modo Simulador alterado para: ${simuladorAtivo}`);
        res.json({ success: true, simulacaoAtiva: simuladorAtivo });
    } else {
        res.status(400).json({ success: false, message: 'Valor inválido.' });
    }
});

// --- ROTA POST /api/alunos (SEMPRE SALVA NO JSONBIN.IO) ---
app.post('/api/alunos', upload.single('profileImage'), async (req, res) => {
    try {
        const getResponse = await axios.get(`${JSONBIN_API_URL}/latest`, { headers: jsonBinHeaders });
        const alunosCadastrados = getResponse.data.record || [];
        
        const ultimoId = alunosCadastrados.length > 0 ? Math.max(...alunosCadastrados.map(a => a.id || 0)) : 0;
        const novoAluno = {
            id: ultimoId + 1,
            nome: req.body.name,
            autista: req.body.diagnosis === 'autista',
            imagemUrl: 'images/perfil_padrao.jpg',
            // ... outros campos ...
        };

        alunosCadastrados.push(novoAluno);
        await axios.put(JSONBIN_API_URL, alunosCadastrados, { headers: jsonBinHeaders });
        
        res.status(201).json(novoAluno);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao cadastrar aluno na nuvem.' });
    }
});


// Rotas de Fallback e Inicialização
app.get('*', (req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'index.html')));
app.listen(PORT, () => console.log(`🚀 Servidor HÍBRIDO rodando na porta ${PORT}`));
