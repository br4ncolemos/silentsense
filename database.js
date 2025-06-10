// server/data/database.js (VERSÃO SIMPLIFICADA)

// O estado inicial do banco de dados. Pode começar vazio.
let database = {
  salas: [],
  alunos: [],
  relatorios: [],
  configuracoes: {
    tema: 'light',
    notificacoes: true,
    limiteBarulho: 70,
    simulacaoAtiva: false,
  }
};

// A função agora recebe o estado do DB para modificá-lo
const popularDadosIniciais = (dbState) => {
  if (dbState.salas.length === 0 && dbState.alunos.length === 0) {
    console.log("Populando banco de dados com dados iniciais...");

    // Gera os dados e os adiciona diretamente no objeto passado como argumento
    const sala1 = { id: 1, nome: "Sala 4", adaptada: true };
    const sala2 = { id: 2, nome: "Sala 3", adaptada: false };
    dbState.salas.push(sala1, sala2);
    
    const aluno1 = { id: 1, nome: "Lucas Kibe (Padrão)", autista: true, salaId: sala1.id, /* ... */ };
    const aluno2 = { id: 2, nome: "Beatriz Costa (Padrão)", autista: false, salaId: sala1.id, /* ... */ };
    dbState.alunos.push(aluno1, aluno2);
  }
};

// Exportamos a estrutura inicial e a função de popular
module.exports = { database, popularDadosIniciais };