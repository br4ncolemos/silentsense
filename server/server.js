// server/server.js (ESTE É O CÓDIGO PARA O GITHUB/RENDER)

// --- Módulos Essenciais ---
const express = require('express');
const http = require('http'); // Módulo HTTP para integrar com WebSocket
const WebSocket = require('ws'); // Biblioteca de WebSocket
const path = require('path');
const cors = require('cors');
const axios = require('axios');
const fs = require('fs'); // Apenas para o alunosPadrao.json

// --- Configuração Inicial ---
const app = express();
const PORT = process.env.PORT || 3000;

// --- CONFIGURAÇÃO DO BANCO DE DADOS NA NUVEM (JSONBIN.IO) ---
const JSONBIN_API_KEY = "$2a$10$Jay/xyfmuFUEsGq2MX6iquj7OkEpzQAAk4m3dod/J9C2X45IqAdeG";
const ALUNOS_BIN_ID = "684852998960c979a5a79a0d";
const JSONBIN_API_URL = `https://api.jsonbin.io/v3/b/${ALUNOS_BIN_ID}`;
const jsonBinHeaders = {
    'Content-Type': 'application/json',
    'X-Master-Key': JSONBIN_API_KEY
};

// --- ESTADO DO SERVIDOR ---
let simuladorAtivo = true; // Mantemos a lógica para o frontend
const alunosPadraoPath = path.join(__dirname, 'data', 'alunosPadrao.json');
let ultimoDadoDoSensor = "Gateway do sensor desconectado.";

// --- MIDDLEWARES ---
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '..', 'public')));

// ==========================================================
// CONFIGURAÇÃO DO SERVIDOR WEBSOCKET (A CENTRAL TELEFÔNICA)
// ==========================================================
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

wss.on('connection', ws => {
    console.log('[Render/WebSocket] Um cliente se conectou.');

    // Envia o último valor conhecido para o cliente que acabou de se conectar
    ws.send(JSON.stringify({ type: 'initial_sensor_value', value: ultimoDadoDoSensor }));

    // Lógica que roda quando o servidor recebe uma mensagem via WebSocket
    ws.on('message', message => {
        try {
            const data = JSON.parse(message);
            // Verifica se a mensagem veio do seu Gateway no PC
            if (data.type === 'sensor_update') {
                console.log(`[Render/WebSocket] Dado do sensor recebido do Gateway(PC): ${data.value}`);
                ultimoDadoDoSensor = data.value;

                // Retransmite a atualização para TODOS os clientes conectados (navegadores/APKs)
                wss.clients.forEach(client => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({ type: 'sensor_update', value: ultimoDadoDoSensor }));
                    }
                });
            }
        } catch (e) {
            console.error('[Render/WebSocket] Erro ao processar mensagem:', e);
        }
    });

    ws.on('close', () => {
        console.log('[Render/WebSocket] Cliente desconectado.');
    });
});

// ==========================================================
// ROTAS DA API (HTTP NORMAL)
// ==========================================================

// Rota para um cliente pegar o último valor do sensor via fetch
app.get('/api/sensor', (req, res) => {
    res.json({ valor: ultimoDadoDoSensor });
});

// Rota para ler os alunos (com a lógica de simulação)
app.get('/api/alunos', async (req, res) => {
    if (simuladorAtivo) {
        try {
            const data = fs.readFileSync(alunosPadraoPath, 'utf8');
            res.json(JSON.parse(data));
        } catch (error) {
            console.error("Erro ao ler alunosPadrao.json:", error);
            res.json([]);
        }
    } else {
        try {
            const response = await axios.get(`${JSONBIN_API_URL}/latest`, { headers: jsonBinHeaders });
            res.json(response.data.record || []);
        } catch (error) {
            console.error("Erro ao buscar alunos do JSONBin:", error.response?.data);
            res.status(500).json({ message: 'Erro ao buscar dados da nuvem.' });
        }
    }
});

// Rota para o frontend alterar o modo de simulação
app.put('/api/configuracoes', (req, res) => {
    const novoEstado = req.body.simulacaoAtiva;
    if (typeof novoEstado === 'boolean') {
        simuladorAtivo = novoEstado;
        res.json({ success: true, simulacaoAtiva: simuladorAtivo });
    } else {
        res.status(400).json({ success: false, message: 'Valor inválido.' });
    }
});

// Rota para cadastrar novos alunos (salva no JSONBin)
app.post('/api/alunos', async (req, res) => {
    try {
        const getResponse = await axios.get(`${JSONBIN_API_URL}/latest`, { headers: jsonBinHeaders });
        const alunosCadastrados = getResponse.data.record || [];
        const ultimoId = alunosCadastrados.length > 0 ? Math.max(...alunosCadastrados.map(a => a.id || 0)) : 0;
        
        const novoAluno = {
            id: ultimoId + 1,
            nome: req.body.name,
            autista: req.body.diagnosis === 'autista',
            laudo: req.body.report || null,
            salaId: req.body.class ? parseInt(req.body.class.split('_')[1]) : null,
            dataNascimento: req.body.birthDate,
            telefone: req.body.phone,
            observacoes: req.body.observations
        };

        alunosCadastrados.push(novoAluno);
        await axios.put(JSONBIN_API_URL, alunosCadastrados, { headers: jsonBinHeaders });
        res.status(201).json(novoAluno);
    } catch (error) {
        console.error('API ERRO ao cadastrar aluno:', error.response?.data || error.message);
        res.status(500).json({ message: 'Erro ao cadastrar aluno na nuvem.' });
    }
});


// --- ROTA DE FALLBACK E INICIALIZAÇÃO ---
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// IMPORTANTE: Usamos server.listen para ligar o servidor HTTP e o WebSocket juntos
server.listen(PORT, () => {
    console.log(`🚀 Servidor Principal (Render) e WebSocket rodando na porta ${PORT}`);
});
