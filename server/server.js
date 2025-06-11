// server.js (ESTE VAI PARA O GITHUB E RENDER)

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const cors = require('cors');
const axios = require('axios');
const fs = require('fs');

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
let simuladorAtivo = true;
const alunosPadraoPath = path.join(__dirname, 'data', 'alunosPadrao.json');
let ultimoDadoDoSensor = "Gateway desconectado."; // Variável para guardar o dado do sensor

// --- MIDDLEWARES ---
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// ==========================================================
// CONFIGURAÇÃO DO SERVIDOR WEBSOCKET
// ==========================================================
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

wss.on('connection', ws => {
    console.log('[Render] Um cliente (Gateway ou App) se conectou via WebSocket.');
    ws.send(JSON.stringify({ type: 'initial_sensor_value', value: ultimoDadoDoSensor }));

    ws.on('message', message => {
        try {
            const data = JSON.parse(message);
            if (data.type === 'sensor_update') {
                console.log(`[Render] Recebido do Gateway(PC): ${data.value}`);
                ultimoDadoDoSensor = data.value;
                wss.clients.forEach(client => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({ type: 'sensor_update', value: ultimoDadoDoSensor }));
                    }
                });
            }
        } catch (e) { console.error('Erro ao processar mensagem:', e); }
    });
    ws.on('close', () => { console.log('[Render] Cliente WebSocket desconectado.'); });
});

// ==========================================================
// ROTAS DA API (HTTP)
// ==========================================================
app.get('/api/sensor', (req, res) => res.json({ valor: ultimoDadoDoSensor }));
app.get('/api/alunos', async (req, res) => { /* ... sua lógica de alunos ... */ });
app.put('/api/configuracoes', (req, res) => { /* ... sua lógica de config ... */ });
app.post('/api/alunos', async (req, res) => { /* ... sua lógica de cadastro ... */ });

// --- INICIALIZAÇÃO ---
app.get('*', (req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'index.html')));
server.listen(PORT, () => {
    console.log(`🚀 Servidor Principal (Render) e WebSocket rodando na porta ${PORT}`);
});
