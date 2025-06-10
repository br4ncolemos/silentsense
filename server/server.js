// server/server.js (VERSÃO FINAL COMPLETA - COM BLUETOOTH NA PORTA COM7)

const express = require('express');
const path = require('path');
const cors = require('cors');
const axios = require('axios');
const fs = require('fs');

// Bibliotecas para comunicação com a porta serial (Bluetooth)
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

const app = express();
const PORT = process.env.PORT || 3000;

// ==========================================================
// CONFIGURAÇÃO DO BANCO DE DADOS NA NUVEM (JSONBIN.IO)
// ==========================================================
const JSONBIN_API_KEY = "$2a$10$Jay/xyfmuFUEsGq2MX6iquj7OkEpzQAAk4m3dod/J9C2X45IqAdeG";
const ALUNOS_BIN_ID = "684852998960c979a5a79a0d";
const JSONBIN_API_URL = `https://api.jsonbin.io/v3/b/${ALUNOS_BIN_ID}`;
const jsonBinHeaders = {
    'Content-Type': 'application/json',
    'X-Master-Key': JSONBIN_API_KEY
};


// ==========================================================
// LÓGICA DO SENSOR BLUETOOTH
// ==========================================================
let ultimoDadoDoSensor = "Aguardando conexão...";

// --- AQUI ESTÁ A SUA PORTA CORRETA ---
const PORTA_BLUETOOTH = 'COM7';

try {
    // Tenta se conectar à porta serial do Bluetooth
    const portaSerial = new SerialPort({
        path: PORTA_BLUETOOTH,
        baudRate: 9600, // Garanta que seja a mesma do seu Arduino: bluetooth.begin(9600)
    });

    // Cria um "parser" que lê os dados linha por linha
    const parser = portaSerial.pipe(new ReadlineParser({ delimiter: '\r\n' }));

    portaSerial.on('open', () => {
        console.log(`✅ Conexão Bluetooth estabelecida com sucesso na porta ${PORTA_BLUETOOTH}`);
        ultimoDadoDoSensor = "Conectado. Aguardando dados...";
    });

    // Evento que é disparado toda vez que uma linha completa de dados chega do Arduino
    parser.on('data', (dado) => {
        console.log(`[Bluetooth] Dado recebido do Arduino: ${dado}`);
        ultimoDadoDoSensor = dado.trim(); // Armazena o último dado recebido, sem espaços extras
    });

    portaSerial.on('error', (err) => {
        console.error(`❌ Erro na porta serial Bluetooth: ${err.message}`);
        ultimoDadoDoSensor = "Erro de conexão";
    });

} catch (error) {
    console.warn(`[Bluetooth] AVISO: Não foi possível iniciar a conexão na porta ${PORTA_BLUETOOTH}. Verifique se o dispositivo está ligado e pareado.`);
    ultimoDadoDoSensor = "Desconectado";
}


// ==========================================================
// LÓGICA DO MODO DE SIMULAÇÃO
// ==========================================================
let simuladorAtivo = true;
const alunosPadraoPath = path.join(__dirname, 'data', 'alunosPadrao.json');


// ==========================================================
// MIDDLEWARES
// ==========================================================
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));


// ==========================================================
// ROTAS DA API
// ==========================================================

// --- ROTA NOVA PARA PEGAR O DADO DO SENSOR ---
app.get('/api/sensor', (req, res) => {
    res.json({ valor: ultimoDadoDoSensor });
});


// --- ROTA PARA LER OS ALUNOS ---
app.get('/api/alunos', async (req, res) => {
    if (simuladorAtivo) {
        try {
            res.json(JSON.parse(fs.readFileSync(alunosPadraoPath, 'utf8')));
        } catch (error) { res.json([]); }
    } else {
        try {
            const response = await axios.get(`${JSONBIN_API_URL}/latest`, { headers: jsonBinHeaders });
            res.json(response.data.record || []);
        } catch (error) { res.status(500).json({ message: 'Erro ao buscar dados.' }); }
    }
});


// --- ROTA PARA ALTERNAR O MODO DE SIMULAÇÃO ---
app.put('/api/configuracoes', (req, res) => {
    const novoEstado = req.body.simulacaoAtiva;
    if (typeof novoEstado === 'boolean') {
        simuladorAtivo = novoEstado;
        res.json({ success: true, simulacaoAtiva: simuladorAtivo });
    } else { res.status(400).json({ success: false, message: 'Valor inválido.' }); }
});


// --- ROTA PARA CADASTRAR NOVOS ALUNOS ---
app.post('/api/alunos', async (req, res) => {
    try {
        const getResponse = await axios.get(`${JSONBIN_API_URL}/latest`, { headers: jsonBinHeaders });
        const alunosCadastrados = getResponse.data.record || [];

        const ultimoId = alunosCadastrados.length > 0 ? Math.max(...alunosCadastrados.map(a => a.id || 0)) : 0;
        
        const novoAluno = {
            id: ultimoId + 1,
            nome: req.body.name,
            autista: req.body.diagnosis === 'autista',
            // ... (outros campos que seu formulário envia)
        };

        alunosCadastrados.push(novoAluno);
        await axios.put(JSONBIN_API_URL, alunosCadastrados, { headers: jsonBinHeaders });
        
        res.status(201).json(novoAluno);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao cadastrar aluno na nuvem.' });
    }
});


// --- ROTA DE FALLBACK E INICIALIZAÇÃO ---
app.get('*', (req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'index.html')));

app.listen(PORT, () => {
    console.log(`🚀 Servidor Gateway rodando na porta ${PORT}`);
    console.log(`🎧 Escutando por dados Bluetooth na porta ${PORTA_BLUETOOTH}...`);
});
