const { database, getNextId } = require('../data/database');

const salaController = {
  getAllSalas: (req, res) => {
    res.json(database.salas);
  },

  getSalaById: (req, res) => {
    const sala = database.salas.find(s => s.id === parseInt(req.params.id));
    if (sala) {
      res.json(sala);
    } else {
      res.status(404).json({ message: "Sala não encontrada." });
    }
  },

  createSala: (req, res) => {
    const { nome, adaptada } = req.body;
    if (!nome) {
      return res.status(400).json({ message: "Nome da sala é obrigatório." });
    }
    const novaSala = {
      id: getNextId('sala'),
      nome,
      adaptada: Boolean(adaptada),
      alunos: [] 
    };
    database.salas.push(novaSala);
    res.status(201).json(novaSala);
  },

  updateSala: (req, res) => {
    const id = parseInt(req.params.id);
    const salaIndex = database.salas.findIndex(s => s.id === id);
    if (salaIndex === -1) {
      return res.status(404).json({ message: "Sala não encontrada." });
    }
    
    const { nome, adaptada, alunos } = req.body; // O frontend pode mandar o objeto sala inteiro
    const salaAntiga = database.salas[salaIndex];

    const salaAtualizada = {
      ...salaAntiga, // Preserva campos não enviados como 'id' e 'alunos' se não vierem
      nome: nome !== undefined ? nome : salaAntiga.nome,
      adaptada: adaptada !== undefined ? Boolean(adaptada) : salaAntiga.adaptada,
      // Se 'alunos' for enviado, deve ser um array de IDs. 
      // Normalmente, a atribuição de alunos a salas é feita pelo endpoint do aluno.
      // Mas se o frontend enviar, respeitamos.
      alunos: alunos !== undefined ? alunos.map(Number) : salaAntiga.alunos 
    };
    database.salas[salaIndex] = salaAtualizada;
    res.json(salaAtualizada);
  },

  deleteSala: (req, res) => {
    const id = parseInt(req.params.id);
    const salaIndex = database.salas.findIndex(s => s.id === id);
    if (salaIndex === -1) {
      return res.status(404).json({ message: "Sala não encontrada." });
    }
    database.salas.splice(salaIndex, 1);

    database.alunos.forEach(aluno => {
        if (aluno.salaId === id) {
            aluno.salaId = null;
        }
    });
    // Opcional: remover relatórios de chamada associados à sala?
    // database.relatorios = database.relatorios.filter(r => !(r.tipo === 'chamada' && r.salaId === id));

    res.json({ message: `Sala com ID ${id} excluída com sucesso.` });
  },
};
module.exports = salaController;