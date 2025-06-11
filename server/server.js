// server/server.js (VERSÃO FINAL COM LEITURA BLUETOOTH NO PC)

const express = require('express');
const path = require('path');
const cors = require('cors');
const axios = require('axios');
const fs = require('fs');
// Importa as bibliotecas para comunicação serial
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

const app = express();
const PORT = process.env.PORT || 3000;

// ==========================================================
// CONFIGURAÇÕES GERAIS (JSONBin.io, Simulação, etc.)
// ==========================================================
const JSONBIN_API_KEY = "$2a$10$Jay/xyfmuFUEsGq2MX6iquj7OkEpzQAAk4m3dod/J9C2X45IqAdeG";
const ALUNOS_BIN_ID = "684852998960c979a5a79a0d";
// ... (seu código de configuração JSONBin continua igual)

let simuladorAtivo = true;
// ... (seu código de simulação continua igual)


// ==========================================================
// LÓGICA DO SENSOR BLUETOOTH (NOVO BLOCO)
// ==========================================================
let ultimoDadoDoSensor = "Aguardando...";

// IMPORTANTE: Substitua 'COM4' pela porta COM que você encontrou no Passo 1.5
const PORTA_BLUETOOTH = 'COM4';

try {
    // Tenta se conectar à porta serial do Bluetooth
    const portaSerial = new SerialPort({
        path: PORTA_BLUETOOTH,
        baudRate: 9600, // Deve ser a mesma taxa do bluetooth.begin() no Arduino
    });

    // Cria um "parser" que lê os dados linha por linha
    const parser = portaSerial.pipe(new ReadlineParser({ delimiter: '\r\n' }));

    portaSerial.on('open', () => {
        console.log(`✅ Conexão Bluetooth estabelecida na porta ${PORTA_BLUETOOTH}`);
    });

    // Evento que é disparado toda vez que uma linha completa de dados chega
    parser.on('data', (dado) => {
        console.log(`[Bluetooth] Dado recebido do Arduino: ${dado}`);
        ultimoDadoDoSensor = dado.trim(); // Armazena o último dado recebido
    });

    portaSerial.on('error', (err) => {
        console.error(`❌ Erro na porta serial Bluetooth: ${err.message}`);
        ultimoDadoDoSensor = "Erro de conexão";
    });

} catch (error) {
    console.warn(`[Bluetooth] AVISO: Não foi possível iniciar a conexão na porta ${PORTA_BLUETOOTH}. Verifique se o dispositivo está pareado e a porta está correta.`);
    ultimoDadoDoSensor = "Desconectado";
}


// ==========================================================
// MIDDLEWARES (continua igual)
// ==========================================================
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));


// ==========================================================
// ROTAS DA API
// ==========================================================

// --- ROTA PARA O SENSOR (NOVA) ---
app.get('/api/sensor', (req, res) => {
    res.json({ valor: ultimoDadoDoSensor });
});


// Suas rotas existentes (/api/alunos, /api/configuracoes, etc.) continuam aqui...
// ...
app.get('/api/alunos', async (req, res) => { /* ... seu código ... */ });
app.put('/api/configuracoes', (req, res) => { /* ... seu código ... */ });
app.post('/api/alunos', async (req, res) => { /* ... seu código ... */ });


// --- ROTA DE FALLBACK E INICIALIZAÇÃO ---
app.get('*', (req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'index.html')));

app.listen(PORT, () => {
    console.log(`🚀 Servidor Gateway rodando na porta ${PORT}`);
});
