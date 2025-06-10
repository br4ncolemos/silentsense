// server/server.js (VERSÃO FINAL SEM FOTOS E SEM CAMPO DE IMAGEM)

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

// --- ESTADO DO MODO DE SIMULAÇÃO ---
let simuladorAtivo = true;
const alunosPadraoPath = path.join(__dirname, 'data', 'alunosPadrao.json');

// --- MIDDLEWARES ---
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Master-Key']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '..', 'public')));


// ==========================================================
// ROTAS DA API
// ==========================================================

// --- ROTA GET /api/alunos ---
app.get('/api/alunos', async (req, res) => {
    if (simuladorAtivo) {
        console.log("Modo Simulação: Lendo de alunosPadrao.json local...");
        try {
            const data = fs.readFileSync(alunosPadraoPath, 'utf8');
            res.json(JSON.parse(data));
        } catch (error) { res.json([]); }
    } else {
        try {
            console.log("Modo Real: Buscando alunos do JSONBin...");
            const response = await axios.get(`${JSONBIN_API_URL}/latest`, { headers: jsonBinHeaders });
            res.json(response.data.record || []);
        } catch (error) { res.status(500).json({ message: 'Erro ao buscar dados.' }); }
    }
});


// --- ROTA PUT /api/configuracoes ---
app.put('/api/configuracoes', (req, res) => {
    const novoEstado = req.body.simulacaoAtiva;
    if (typeof novoEstado === 'boolean') {
        simuladorAtivo = novoEstado;
        res.json({ success: true, simulacaoAtiva: simuladorAtivo });
    } else { res.status(400).json({ success: false, message: 'Valor inválido.' }); }
});


// --- ROTA POST /api/alunos ---
app.post('/api/alunos', async (req, res) => {
    try {
        const getResponse = await axios.get(`${JSONBIN_API_URL}/latest`, { headers: jsonBinHeaders });
        const alunosCadastrados = getResponse.data.record || [];

        const ultimoId = alunosCadastrados.length > 0 ? Math.max(...alunosCadastrados.map(a => a.id || 0)) : 0;
        
        // Objeto do novo aluno sem o campo 'imagemUrl'
        const novoAluno = {
            id: ultimoId + 1,
            nome: req.body.name,
            autista: req.body.diagnosis === 'autista',
            laudo: req.body.report || null,
            salaId: req.body.class ? parseInt(req.body.class.split('_')[1]) : null,
            dataNascimento: req.body.birthDate,
            telefone: req.body.phone,
            observacoes: req.body.observations
            // NENHUMA LINHA PARA imagemUrl AQUI
        };

        alunosCadastrados.push(novoAluno);
        await axios.put(JSONBIN_API_URL, alunosCadastrados, { headers: jsonBinHeaders });
        
        console.log(`[API] Aluno '${novoAluno.nome}' salvo com sucesso no JSONBin.`);
        res.status(201).json(novoAluno);

    } catch (error) {
        console.error('API ERRO ao cadastrar aluno no JSONBin:', error.response?.data || error.message);
        res.status(500).json({ message: 'Erro ao cadastrar aluno na nuvem.' });
    }
});


// --- ROTA DE FALLBACK E INICIALIZAÇÃO ---
app.get('*', (req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'index.html')));

app.listen(PORT, () => console.log(`🚀 Servidor FINAL rodando na porta ${PORT}`));
