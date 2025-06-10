// server/data/db-handler.js (VERSÃO NUVEM COM JSONBIN.IO)

const axios = require('axios');

// ==========================================================
// CONFIGURAÇÃO DO JSONBIN.IO
// ==========================================================
// IMPORTANTE: Substitua pelos seus valores reais!
const JSONBIN_API_KEY = "$2a$10$Jay/xyfmuFUEsGq2MX6iquj7OkEpzQAAk4m3dod/J9C2X45IqAdeG";
const DATABASE_BIN_ID = "68484d168a456b7966abd8b2"; // O ID da sua "caixa" de database

const JSONBIN_API_URL = `https://api.jsonbin.io/v3/b/${DATABASE_BIN_ID}`;
const jsonBinHeaders = {
    'Content-Type': 'application/json',
    'X-Master-Key': JSONBIN_API_KEY
};

// --- Ponto Central de Dados (Singleton em Memória) ---
// Carregamos o estado do banco de dados na memória UMA VEZ quando o servidor inicia.
// Isso evita múltiplas chamadas à API para cada requisição.
let dbState = null;

async function inicializarDatabase() {
    try {
        console.log("[DB-Handler] Inicializando: buscando dados do JSONBin...");
        const response = await axios.get(`${JSONBIN_API_URL}/latest`, { headers: jsonBinHeaders });
        dbState = response.data.record;
        console.log("[DB-Handler] ✅ Banco de dados carregado na memória com sucesso.");
    } catch (error) {
        console.error("[DB-Handler] ERRO CRÍTICO ao inicializar o banco de dados:", error.response?.data);
        // Em caso de falha, inicia com um estado vazio para não quebrar o servidor
        dbState = { alunos: [], salas: [] };
    }
}

// Função para OBTER o estado atual do banco de dados da memória
function getDatabase() {
    if (!dbState) {
        // Isso é uma salvaguarda. A inicialização já deve ter ocorrido.
        console.warn("[DB-Handler] O banco de dados foi acessado antes de ser inicializado.");
        return { alunos: [], salas: [] };
    }
    return dbState;
}

// Função para ATUALIZAR o estado e SALVAR no JSONBin
async function updateAndSaveDatabase(novoDbState) {
    dbState = novoDbState; // Atualiza o estado em memória imediatamente

    try {
        // Envia a versão completa e atualizada do nosso estado para a nuvem
        await axios.put(JSONBIN_API_URL, dbState, { headers: jsonBinHeaders });
        console.log("[DB-Handler] Banco de dados persistido no JSONBin com sucesso.");
    } catch (error) {
        console.error("[DB-Handler] ERRO CRÍTICO ao persistir no JSONBin:", error.response?.data);
    }
}

// Função para pegar o próximo ID, usando o estado em memória
function getNextId(type) {
    // 'type' deve ser o nome da chave no dbState, ex: 'alunos', 'salas'
    if (!dbState || !dbState[type]) return 1;

    const items = dbState[type];
    if (items.length === 0) return 1;

    const ultimoId = Math.max(...items.map(item => item.id || 0));
    return ultimoId + 1;
}

module.exports = {
    inicializarDatabase, // Exportamos a função de inicialização
    getDatabase,
    updateAndSaveDatabase,
    getNextId
};
