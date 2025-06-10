// server/server.js (VERSÃO FINAL, ALINHADA COM O FRONTEND)

const express = require('express');
const path = require('path');
const cors = require('cors');
const axios = require('axios');
const fs = require('fs');

const app = express();
// O Render define a porta automaticamente, mas usamos 3000 para testes locais
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
// Configuração de CORS robusta para evitar o 'Failed to fetch'
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Master-Key']
}));

// Middlewares para entender os dados da requisição
app.use(express.json()); // Essencial para ler corpos de requisição JSON
app.use(express.urlencoded({ extended: true })); // Para dados de formulário
app.use(express.static(path.join(__dirname, '..', 'public'))); // Serve os arquivos do frontend


// ==========================================================
// ROTAS DA API
// ==========================================================

// --- ROTA GET /api/alunos --- (Lê os alunos)
app.get('/api/alunos', async (req, res) => {
    if (simuladorAtivo) {
        console.log("Modo Simulação: Lendo de alunosPadrao.json local...");
        try {
            const data = fs.readFileSync(alunosPadraoPath, 'utf8');
            res.json(JSON.parse(data));
        } catch (error) {
            console.error("Erro ao ler alunosPadrao.json:", error);
            res.json([]);
        }
    } else {
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


// --- ROTA PUT /api/configuracoes --- (Muda o modo de simulação)
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


// --- ROTA POST /api/alunos --- (Cadastra um novo aluno)
app.post('/api/alunos', async (req, res) => {
    try {
        // Passo 1: Pega a lista atual de alunos do JSONBin
        const getResponse = await axios.get(`${JSONBIN_API_URL}/latest`, { headers: jsonBinHeaders });
        const alunosCadastrados = getResponse.data.record || [];

        // Passo 2: Calcula o próximo ID
        const ultimoId = alunosCadastrados.length > 0 ? Math.max(...alunosCadastrados.map(a => a.id || 0)) : 0;
        
        // Passo 3: Cria o objeto do novo aluno com os dados recebidos do frontend
        const novoAluno = {
            id: ultimoId + 2,
            nome: req.body.name, // Frontend envia 'name'
            autista: req.body.diagnosis === 'autista', // Frontend envia 'diagnosis'
            laudo: req.body.report || null,
            salaId: req.body.class ? parseInt(req.body.class.split('_')[1]) : null,
            dataNascimento: req.body.birthDate,
            telefone: req.body.phone,
            observacoes: req.body.observations
        };

        // Passo 4: Adiciona o novo aluno à lista
        alunosCadastrados.push(novoAluno);
        
        // Passo 5: Salva a lista inteira de volta no JSONBin
        await axios.put(JSONBIN_API_URL, alunosCadastrados, { headers: jsonBinHeaders });
        
        console.log(`[API] Aluno '${novoAluno.nome}' salvo com sucesso no JSONBin.`);
        // Retorna o objeto do novo aluno criado para o frontend
        res.status(201).json(novoAluno);

    } catch (error) {
        console.error('API ERRO ao cadastrar aluno no JSONBin:', error.response?.data || error.message);
        res.status(500).json({ message: 'Erro ao cadastrar aluno na nuvem.' });
    }
});


// --- ROTA DE FALLBACK E INICIALIZAÇÃO ---
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor FINAL E ALINHADO rodando na porta ${PORT}`);
});
