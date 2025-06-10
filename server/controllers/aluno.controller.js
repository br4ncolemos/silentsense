// server/controllers/aluno.controller.js (example path)
const { database, getNextId } = require('../../database.js');

// Função auxiliar para calcular idade
const calcularIdade = (dataNascimento) => {
  if (!dataNascimento) return null;
  const hoje = new Date();
  const nasc = new Date(dataNascimento);
  let idade = hoje.getFullYear() - nasc.getFullYear();
  const mes = hoje.getMonth() - nasc.getMonth();
  if (mes < 0 || (mes === 0 && hoje.getDate() < nasc.getDate())) {
    idade--;
  }
  return idade;
};

// Função auxiliar para obter número de incidentes
const getIncidentesCount = (alunoId) => {
    return database.relatorios.filter(r => r.tipo === 'incidente' && r.conteudo.alunoId === alunoId).length;
};


const alunoController = {
  getAllAlunos: (req, res) => {
    const alunosComDetalhes = database.alunos.map(aluno => ({
      ...aluno,
      idade: calcularIdade(aluno.dataNascimento),
      incidentes: getIncidentesCount(aluno.id) // O frontend espera 'incidentes'
    }));
    res.json(alunosComDetalhes);
  },

  getAlunoById: (req, res) => {
    const aluno = database.alunos.find(a => a.id === parseInt(req.params.id));
    if (aluno) {
      const alunoComDetalhes = {
        ...aluno,
        idade: calcularIdade(aluno.dataNascimento),
        incidentes: getIncidentesCount(aluno.id)
      };
      res.json(alunoComDetalhes);
    } else {
      res.status(404).json({ message: "Aluno não encontrado." });
    }
  },

  createAluno: (req, res) => {
    const { nome, autista, laudo, salaId, dataNascimento, responsavel, telefone, observacoes } = req.body;
    if (!nome) {
      return res.status(400).json({ message: "Nome do aluno é obrigatório." });
    }

    const parsedSalaId = salaId ? parseInt(salaId) : null;

    const novoAluno = {
      id: getNextId('aluno'),
      nome,
      autista: Boolean(autista),
      laudo: Boolean(autista) ? (laudo || "") : null,
      salaId: parsedSalaId,
      dataNascimento: dataNascimento || null,
      responsavel: responsavel || null,
      telefone: telefone || null,
      observacoes: observacoes || ""
    };
    database.alunos.push(novoAluno);

    if (parsedSalaId) {
      const sala = database.salas.find(s => s.id === parsedSalaId);
      if (sala && !sala.alunos.includes(novoAluno.id)) {
        sala.alunos.push(novoAluno.id);
      }
    }

    const alunoCriadoComDetalhes = {
        ...novoAluno,
        idade: calcularIdade(novoAluno.dataNascimento),
        incidentes: 0 // Novo aluno, 0 incidentes
    };
    res.status(201).json(alunoCriadoComDetalhes);
  },

  updateAluno: (req, res) => {
    const id = parseInt(req.params.id);
    const alunoIndex = database.alunos.findIndex(a => a.id === id);
    if (alunoIndex === -1) {
      return res.status(404).json({ message: "Aluno não encontrado." });
    }

    const alunoAntigo = database.alunos[alunoIndex];
    const { nome, autista, laudo, salaId, dataNascimento, responsavel, telefone, observacoes } = req.body;

    const novoSalaId = salaId !== undefined ? (salaId ? parseInt(salaId) : null) : alunoAntigo.salaId;

    const alunoAtualizado = {
      ...alunoAntigo,
      nome: nome !== undefined ? nome : alunoAntigo.nome,
      autista: autista !== undefined ? Boolean(autista) : alunoAntigo.autista,
      laudo: (autista !== undefined ? Boolean(autista) : alunoAntigo.autista) ? (laudo !== undefined ? laudo : alunoAntigo.laudo) : null,
      salaId: novoSalaId,
      dataNascimento: dataNascimento !== undefined ? dataNascimento : alunoAntigo.dataNascimento,
      responsavel: responsavel !== undefined ? responsavel : alunoAntigo.responsavel,
      telefone: telefone !== undefined ? telefone : alunoAntigo.telefone,
      observacoes: observacoes !== undefined ? observacoes : alunoAntigo.observacoes,
    };
    database.alunos[alunoIndex] = alunoAtualizado;

    if (alunoAntigo.salaId !== novoSalaId) {
      if (alunoAntigo.salaId) {
        const salaVelha = database.salas.find(s => s.id === alunoAntigo.salaId);
        if (salaVelha) {
          salaVelha.alunos = salaVelha.alunos.filter(alId => alId !== id);
        }
      }
      if (novoSalaId) {
        const salaNova = database.salas.find(s => s.id === novoSalaId);
        if (salaNova && !salaNova.alunos.includes(id)) {
          salaNova.alunos.push(id);
        }
      }
    }

    const alunoRetornadoComDetalhes = {
        ...alunoAtualizado,
        idade: calcularIdade(alunoAtualizado.dataNascimento),
        incidentes: getIncidentesCount(alunoAtualizado.id)
    };
    res.json(alunoRetornadoComDetalhes);
  },

  deleteAluno: (req, res) => {
    const id = parseInt(req.params.id);
    const alunoIndex = database.alunos.findIndex(a => a.id === id);
    if (alunoIndex === -1) {
      return res.status(404).json({ message: "Aluno não encontrado." });
    }
    const [alunoRemovido] = database.alunos.splice(alunoIndex, 1);

    if (alunoRemovido.salaId) {
        const sala = database.salas.find(s => s.id === alunoRemovido.salaId);
        if (sala) {
            sala.alunos = sala.alunos.filter(alunoId => alunoId !== id);
        }
    }
    // Opcional: remover relatórios associados (pode ser complexo ou indesejado)
    // database.relatorios = database.relatorios.filter(r => !(r.tipo === 'incidente' && r.conteudo.alunoId === id));

    res.json({ message: `Aluno com ID ${id} excluído com sucesso.` });
  },
};

module.exports = alunoController;