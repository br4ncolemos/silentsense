// server/data/db-handler.js (VERSÃO GERENCIADORA)

const fs = require('fs');
const path = require('path');
const dbOriginalPath = path.join(__dirname, 'database.js');

// Carrega o módulo UMA VEZ para pegar a estrutura e as funções
const dbModule = require('../../database');

// --- Ponto Central de Dados (Singleton) ---
// Carregamos o estado do banco de dados na memória quando o servidor inicia.
let dbState = dbModule.database;
// Roda a função para popular com dados iniciais, se necessário.
dbModule.popularDadosIniciais(dbState); // Passamos o estado para ser modificado

// Função para OBTER o estado atual do banco de dados
function getDatabase() {
    return dbState;
}

// Função para ATUALIZAR o estado do banco de dados e SALVAR no arquivo
function updateAndSaveDatabase(novoDbState) {
    dbState = novoDbState; // Atualiza o estado em memória

    try {
        let conteudoArquivo = fs.readFileSync(dbOriginalPath, 'utf8');
        const novoDbString = JSON.stringify(dbState, null, 2);
        const regex = /(let|const)\s+database\s*=\s*{[^]*?};/;
        
        if (regex.test(conteudoArquivo)) {
            conteudoArquivo = conteudoArquivo.replace(regex, `$1 database = ${novoDbString};`);
            fs.writeFileSync(dbOriginalPath, conteudoArquivo, 'utf8');
            console.log("Banco de dados (database.js) persistido no arquivo com sucesso.");
        } else {
            console.error("Não foi possível encontrar o objeto 'database' para substituir no arquivo.");
        }
    } catch (error) {
        console.error("ERRO CRÍTICO ao persistir em database.js:", error);
    }
}

// Função para pegar o próximo ID, agora usando o estado em memória
function getNextId(type) {
    if (type === 'aluno') {
        const ultimoId = dbState.alunos.length > 0 ? Math.max(...dbState.alunos.map(a => a.id)) : 0;
        return ultimoId + 1;
    }
    if (type === 'sala') {
        const ultimoId = dbState.salas.length > 0 ? Math.max(...dbState.salas.map(s => s.id)) : 0;
        return ultimoId + 1;
    }
    // Adicione outros tipos se necessário
    return Date.now();
}

module.exports = {
    getDatabase,
    updateAndSaveDatabase,
    getNextId
};