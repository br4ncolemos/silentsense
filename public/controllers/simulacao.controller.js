const { database } = require('../../database');

const getIncidentesCount = (alunoId) => { // Reutilizando helper
    return database.relatorios.filter(r => r.tipo === 'incidente' && r.conteudo.alunoId === alunoId).length;
};

const simulacaoController = {
  getSimulacaoData: (req, res) => {
    const barulhoData = Array(24).fill(0).map((_, i) => {
        // Simula um padrão diário de barulho (mais baixo à noite, picos durante o dia)
        const hora = i;
        if (hora < 6 || hora > 20) return Math.floor(Math.random() * 20) + 20; // Noite/madrugada
        if (hora > 7 && hora < 10) return Math.floor(Math.random() * 30) + 50; // Manhã
        if (hora > 13 && hora < 16) return Math.floor(Math.random() * 30) + 55; // Tarde
        return Math.floor(Math.random() * 25) + 30; // Outros horários
    });

    const incidentesData = Array(7).fill(0).map(() => Math.floor(Math.random() * 6)); // Incidentes por dia da semana
    
    // Pega todos os alunos e ordena pelos que têm mais incidentes reais, depois simula para a lista.
    // Ou apenas simula, como o frontend espera 'alunos' com 'nome' e 'incidentes'.
    const alunosComIncidentesSimulados = database.alunos
        .map(aluno => ({
            nome: aluno.nome,
            // Para a simulação, podemos usar os incidentes reais ou gerar aleatórios
            incidentes: getIncidentesCount(aluno.id) + Math.floor(Math.random() * 3) // Adiciona um fator aleatório
        }))
        .sort((a,b) => b.incidentes - a.incidentes) // Ordena
        .slice(0, 5); // Pega os top 5

    res.json({
      barulho: barulhoData,
      incidentes: incidentesData,
      alunos: alunosComIncidentesSimulados 
    });
  }
};
module.exports = simulacaoController;