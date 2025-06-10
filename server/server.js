// server/server.js (VERSÃO HÍBRIDA CORRIGIDA)

const express = require('express');
const path = require('path');
const cors = require('cors');
const morgan = 'morgan';
const multer = require('multer');
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

// --- MODO DE SIMULAÇÃO ---
let simuladorAtivo = true;
const alunosPadraoPath = path.join(__dirname, 'data', 'alunosPadrao.json');

// --- MIDDLEWARES ---
app.use(cors({ origin: '*' }));
// app.use(morgan('dev')); // Comentado temporariamente para logs mais limpos
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // NECESSÁRIO para ler dados de formulário sem imagem
app.use(express.static(path.join(__dirname, '..', 'public')));
// Não precisamos mais do multer aqui, pois a rota de POST não o usará por enquanto
// const upload = multer({ storage: multer.memoryStorage() });


// ==========================================================
// ROTAS DA API
// ==========================================================

// ROTA 1: GET /api/alunos (PARA LER OS ALUNOS)
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
        // MODO REAL: Lê do JSONBin.io
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


// ROTA 2: PUT /api/configuracoes (PARA MUDAR O MODO DE SIMULAÇÃO)
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


// ROTA 3: POST /api/alunos (PARA CADASTRAR UM NOVO ALUNO)
// Esta é a versão SEM o 'upload.single(...)' para evitar o erro 'Failed to fetch'
app.post('/api/alunos', async (req, res) => {
    try {
        // Passo 1: Ler os dados atuais do JSONBin
        const getResponse = await axios.get(`${JSONBIN_API_URL}/latest`, { headers: jsonBinHeaders });
        const alunosCadastrados = getResponse.data.record || [];

        // Passo 2: Preparar o novo aluno com os dados do formulário
        const ultimoId = alunosCadastrados.length > 0 ? Math.max(...alunosCadastrados.map(a => a.id || 0)) : 0;
        const novoAluno = {
            id: ultimoId + 1,
            nome: req.body.name,
            autista: req.body.diagnosis === 'autista',
            laudo: req.body.report || null,
            salaId: req.body.class ? parseInt(req.body.class.split('_')[1]) : null,
            dataNascimento: req.body.birthDate,
            telefone: req.body.phone,
            observacoes: req.body.observations,
            imagemUrl: 'images/perfil_padrao.jpg' // Usa a imagem padrão
        };

        // Passo 3: Adicionar o novo aluno à lista
        alunosCadastrados.push(novoAluno);

        // Passo 4: Enviar a lista COMPLETA E ATUALIZADA de volta para o JSONBin
        await axios.put(JSONBIN_API_URL, alunosCadastrados, { headers: jsonBinHeaders });
        
        console.log(`[API] Aluno '${novoAluno.nome}' salvo com sucesso no JSONBin.`);
        res.status(201).json(novoAluno);

    } catch (error) {
        console.error('API ERRO ao cadastrar aluno no JSONBin:', error.response?.data || error.message);
        res.status(500).json({ message: 'Erro ao cadastrar aluno na nuvem.' });
    }
});


// Rota de Fallback e Inicialização
app.get('*', (req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'index.html')));

app.listen(PORT, () => console.log(`🚀 Servidor HÍBRIDO CORRIGIDO rodando na porta ${PORT}`));
