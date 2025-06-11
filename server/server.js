// server/server.js (VERSÃO SIMPLIFICADA E ESTÁVEL PARA O RENDER)

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const cors = require('cors');
const axios = require('axios');

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

// --- ESTADO DO SERVIDOR ---
let ultimoDadoDoSensor = "Gateway desconectado.";

// --- MIDDLEWARES ---
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// ==========================================================
// SERVIDOR WEBSOCKET
// ==========================================================
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

wss.on('connection', ws => {
    console.log('[Render] Cliente WebSocket conectado.');
    ws.send(JSON.stringify({ type: 'initial_sensor_value', value: ultimoDadoDoSensor }));

    ws.on('message', message => {
        try {
            const data = JSON.parse(message);
            if (data.type === 'sensor_update') {
                ultimoDadoDoSensor = data.value;
                wss.clients.forEach(client => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({ type: 'sensor_update', value: ultimoDadoDoSensor }));
                    }
                });
            }
        } catch (e) { console.error('Erro ao processar mensagem WebSocket:', e); }
    });
});

// ==========================================================
// ROTAS DA API (HTTP)
// ==========================================================

// Lê os alunos SEMPRE do JSONBin (removemos a complexidade da simulação)
app.get('/api/alunos', async (req, res) => {
    try {
        const response = await axios.get(`${JSONBIN_API_URL}/latest`, { headers: jsonBinHeaders });
        res.json(response.data.record || []);
    } catch (error) {
        console.error("Erro ao buscar alunos do JSONBin:", error.response?.data);
        res.status(500).json({ message: 'Erro ao buscar dados da nuvem.' });
    }
});

// Cadastra um novo aluno SEMPRE no JSONBin
app.post('/api/alunos', async (req, res) => {
    try {
        const getResponse = await axios.get(`${JSONBIN_API_URL}/latest`, { headers: jsonBinHeaders });
        const alunos = getResponse.data.record || [];
        const ultimoId = alunos.length > 0 ? Math.max(...alunos.map(a => a.id || 0)) : 0;
        
        const novoAluno = {
            id: ultimoId + 1,
            nome: req.body.nome,
            autista: req.body.autista,
            // Adicione outros campos se precisar
        };

        alunos.push(novoAluno);
        await axios.put(JSONBIN_API_URL, alunos, { headers: jsonBinHeaders });
        res.status(201).json(novoAluno);
    } catch (error) {
        console.error('API ERRO ao cadastrar aluno:', error.response?.data || error.message);
        res.status(500).json({ message: 'Erro ao cadastrar aluno na nuvem.' });
    }
});

// Rota do sensor
app.get('/api/sensor', (req, res) => {
    res.json({ valor: ultimoDadoDoSensor });
});

// --- ROTA DE FALLBACK E INICIALIZAÇÃO ---
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

server.listen(PORT, () => {
    console.log(`🚀 Servidor ESTÁVEL rodando na porta ${PORT}`);
});
