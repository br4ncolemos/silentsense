// server/data/database.js
let nextAlunoId = 1;
let nextSalaId = 1;
let nextRelatorioId = 1;

let database = {
  salas: [],
  alunos: [],
  relatorios: [],
  configuracoes: {
    tema: 'light',
    notificacoes: true,
    limiteBarulho: 70,
    simulacaoAtiva: false, // O frontend tem um toggle para isso
    // As portas e baudrates do sensor são mais configurações do cliente/dispositivo
  }
};

const getNextId = (type) => {
  switch (type) {
    case 'aluno': return nextAlunoId++;
    case 'sala': return nextSalaId++;
    case 'relatorio': return nextRelatorioId++;
    default:
      console.error(`Tentativa de obter ID para tipo desconhecido: ${type}`);
      // Retorna um ID alto para evitar colisões, mas isso indica um problema
      return Date.now() + Math.floor(Math.random() * 1000); 
  }
};

const popularDadosIniciais = () => {
  if (database.salas.length === 0 && database.alunos.length === 0) {
    console.log("Populando banco de dados com dados iniciais...");

    const sala1 = { id: getNextId('sala'), nome: "Sala Arco-Íris", adaptada: true, alunos: [] };
    const sala2 = { id: getNextId('sala'), nome: "Sala Estrelas", adaptada: false, alunos: [] };
    const sala3 = { id: getNextId('sala'), nome: "Laboratório Criativo", adaptada: true, alunos: [] };
    database.salas.push(sala1, sala2, sala3);

    const aluno1 = {
      id: getNextId('aluno'),
      nome: "Lucas Mendes",
      autista: true,
      laudo: "TEA Nível 1. Hipersensibilidade auditiva. Interesse focado em trens e mapas. Ótima memória visual.",
      salaId: sala1.id,
      dataNascimento: "2016-05-20",
      responsavel: "Fernanda Mendes",
      telefone: "(11) 98877-6655",
      observacoes: "Prefere rotina e previsibilidade. Usar fones redutores de ruído em ambientes barulhentos. Comunicar transições com antecedência."
    };
    const aluno2 = {
      id: getNextId('aluno'),
      nome: "Beatriz Costa",
      autista: false,
      laudo: null,
      salaId: sala1.id,
      dataNascimento: "2017-01-15",
      responsavel: "Ricardo Costa",
      telefone: "(21) 97766-5544",
      observacoes: "Muito participativa e comunicativa."
    };
    const aluno3 = {
      id: getNextId('aluno'),
      nome: "Gabriel Alves",
      autista: true,
      laudo: "TEA Nível 2. Dificuldades na interação social recíproca. Pode necessitar de apoio para iniciar e manter conversas.",
      salaId: sala2.id,
      dataNascimento: "2015-09-03",
      responsavel: "Carla Alves",
      telefone: "(31) 96655-4433",
      observacoes: "Responde bem a reforço positivo. Gosta de desenhar. Pausas curtas podem ser benéficas."
    };
     const aluno4 = {
      id: getNextId('aluno'),
      nome: "Júlia Ferreira",
      autista: false,
      laudo: null,
      salaId: sala3.id,
      dataNascimento: "2016-11-12",
      responsavel: "Márcio Ferreira",
      telefone: "(41) 95544-3322",
      observacoes: "Curiosa e adora atividades em grupo."
    };

    database.alunos.push(aluno1, aluno2, aluno3, aluno4);

    // Adicionar alunos às salas
    sala1.alunos.push(aluno1.id, aluno2.id);
    sala2.alunos.push(aluno3.id);
    sala3.alunos.push(aluno4.id);


    // Adicionar alguns relatórios de exemplo
    database.relatorios.push({
      id: getNextId('relatorio'),
      salaId: sala1.id,
      tipo: 'chamada',
      data: new Date(Date.now() - 2 * 86400000).toISOString(), // 2 dias atrás
      conteudo: { presentes: 2, ausentes: 0, duracao: "00:05:12" }
    });
    database.relatorios.push({
      id: getNextId('relatorio'),
      tipo: 'incidente',
      data: new Date(Date.now() - 1 * 86400000).toISOString(), // Ontem
      conteudo: { alunoId: aluno1.id, descricao: "Ficou agitado durante a atividade de pintura em grupo. Oferecido espaço calmo.", hora: "10:15" }
    });
     database.relatorios.push({
      id: getNextId('relatorio'),
      tipo: 'incidente',
      data: new Date().toISOString(), // Hoje
      conteudo: { alunoId: aluno3.id, descricao: "Recusou-se a participar da roda de história. Mostrou interesse após a oferta de um livro sobre seu tema preferido.", hora: "14:30" }
    });
  }
};

module.exports = { database, getNextId, popularDadosIniciais };