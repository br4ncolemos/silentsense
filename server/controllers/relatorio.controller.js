const { database, getNextId } = require('../data/database');

const relatorioController = {
  getAllRelatorios: (req, res) => {
    res.json(database.relatorios);
  },

  createRelatorio: (req, res) => {
    const { salaId, tipo, conteudo } = req.body;
    
    if (!tipo || !conteudo) {
      return res.status(400).json({ message: "Tipo e conteúdo do relatório são obrigatórios." });
    }
    // Validações mais específicas para cada tipo de relatório
    if (tipo === 'chamada' && (conteudo.presentes === undefined || conteudo.ausentes === undefined || !conteudo.duracao)) {
        return res.status(400).json({ message: "Conteúdo inválido para relatório de chamada. Necessário: presentes, ausentes, duracao."});
    }
    if (tipo === 'incidente' && (!conteudo.alunoId || !conteudo.descricao || !conteudo.hora)) {
        return res.status(400).json({ message: "Conteúdo inválido para relatório de incidente. Necessário: alunoId, descricao, hora."});
    }

    const novoRelatorio = {
      id: getNextId('relatorio'),
      salaId: salaId ? parseInt(salaId) : null,
      tipo,
      data: new Date().toISOString(),
      conteudo
    };
    database.relatorios.push(novoRelatorio);
    
    // Não é necessário incrementar incidentes no aluno aqui, pois o GET de aluno já calcula
    res.status(201).json(novoRelatorio);
  },
};
module.exports = relatorioController;