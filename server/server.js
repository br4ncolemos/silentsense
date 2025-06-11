// server/server.js (VERSÃO FINAL COMPLETA COM CRUD)
// server/server.js (VERSÃO FINAL, ALINHADA COM O FRONTEND)

const express = require('express');
const path = require('path');
const axios = require('axios');
const fs = require('fs');

const app = express();
// O Render define a porta automaticamente, mas usamos 3000 para testes locais
const PORT = process.env.PORT || 3000;

// --- CONFIGURAÇÃO DO JSONBIN.IO ---
const jsonBinHeaders = {
'X-Master-Key': JSONBIN_API_KEY
};

// --- ESTADO DO MODO DE SIMULAÇÃO ---
let simuladorAtivo = true;
const alunosPadraoPath = path.join(__dirname, 'data', 'alunosPadrao.json');

// --- MIDDLEWARES ---
app.use(cors({ origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'] }));
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));
// Configuração de CORS robusta para evitar o 'Failed to fetch'
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Master-Key']
}));

// ==========================================================
// ROTAS DA API
// ==========================================================

// --- GET /api/alunos --- (Ler todos)
app.get('/api/alunos', async (req, res) => { /* ... seu código continua igual ... */ });

// --- PUT /api/configuracoes ---
app.put('/api/configuracoes', (req, res) => { /* ... seu código continua igual ... */ });

// --- POST /api/alunos --- (Criar novo)
app.post('/api/alunos', async (req, res) => { /* ... seu código continua igual ... */ });
// Middlewares para entender os dados da requisição
app.use(express.json()); // Essencial para ler corpos de requisição JSON
app.use(express.urlencoded({ extended: true })); // Para dados de formulário
app.use(express.static(path.join(__dirname, '..', 'public'))); // Serve os arquivos do frontend


// ==========================================================
// NOVAS ROTAS PARA EDIÇÃO E EXCLUSÃO
// ROTAS DA API
// ==========================================================

// --- GET /api/alunos/:id --- (Ler um aluno específico)
app.get('/api/alunos/:id', async (req, res) => {
    try {
        const alunoId = parseInt(req.params.id);
        const getResponse = await axios.get(`${JSONBIN_API_URL}/latest`, { headers: jsonBinHeaders });
        const alunos = getResponse.data.record || [];
        const alunoEncontrado = alunos.find(a => a.id === alunoId);
        
        if (alunoEncontrado) {
            res.json(alunoEncontrado);
        } else {
            res.status(404).json({ message: "Aluno não encontrado." });
// --- ROTA GET /api/alunos --- (Lê os alunos)
app.get('/api/alunos', async (req, res) => {
    if (simuladorAtivo) {
        console.log("Modo Simulação: Lendo de alunosPadrao.json local...");
        try {
            const data = fs.readFileSync(alunosPadraoPath, 'utf8');
            res.json(JSON.parse(data));
        } catch (error) {
            console.error("Erro ao ler alunosPadrao.json:", error);
            res.json([]);
        }
    } else {
        try {
            console.log("Modo Real: Buscando alunos do JSONBin...");
            const response = await axios.get(`${JSONBIN_API_URL}/latest`, { headers: jsonBinHeaders });
            res.json(response.data.record || []);
        } catch (error) {
            console.error("Erro ao buscar alunos do JSONBin:", error.response?.data);
            res.status(500).json({ message: 'Erro ao buscar dados da nuvem.' });
}
    } catch (error) {
        res.status(500).json({ message: "Erro ao buscar aluno." });
}
});

// --- PUT /api/alunos/:id --- (Editar um aluno)
app.put('/api/alunos/:id', async (req, res) => {
    try {
        const alunoId = parseInt(req.params.id);
        const getResponse = await axios.get(`${JSONBIN_API_URL}/latest`, { headers: jsonBinHeaders });
        let alunos = getResponse.data.record || [];
        
        const index = alunos.findIndex(a => a.id === alunoId);

        if (index !== -1) {
            // Atualiza o objeto do aluno com os novos dados do corpo da requisição
            alunos[index] = { ...alunos[index], ...req.body, id: alunoId };
            // Salva a lista inteira de volta no JSONBin
            await axios.put(JSONBIN_API_URL, alunos, { headers: jsonBinHeaders });
            res.json(alunos[index]); // Retorna o aluno atualizado
        } else {
            res.status(404).json({ message: "Aluno não encontrado para editar." });
        }
    } catch (error) {
        res.status(500).json({ message: "Erro ao editar aluno." });

// --- ROTA PUT /api/configuracoes --- (Muda o modo de simulação)
app.put('/api/configuracoes', (req, res) => {
    const novoEstado = req.body.simulacaoAtiva;
    if (typeof novoEstado === 'boolean') {
        simuladorAtivo = novoEstado;
        console.log(`[API] Modo Simulador alterado para: ${simuladorAtivo}`);
        res.json({ success: true, simulacaoAtiva: simuladorAtivo });
    } else {
        res.status(400).json({ success: false, message: 'Valor inválido.' });
}
});

// --- DELETE /api/alunos/:id --- (Excluir um aluno)
app.delete('/api/alunos/:id', async (req, res) => {

// --- ROTA POST /api/alunos --- (Cadastra um novo aluno)
app.post('/api/alunos', async (req, res) => {
try {
        const alunoId = parseInt(req.params.id);
        // Passo 1: Pega a lista atual de alunos do JSONBin
const getResponse = await axios.get(`${JSONBIN_API_URL}/latest`, { headers: jsonBinHeaders });
        let alunos = getResponse.data.record || [];

        const novosAlunos = alunos.filter(a => a.id !== alunoId);
        const alunosCadastrados = getResponse.data.record || [];

        if (alunos.length === novosAlunos.length) {
            return res.status(404).json({ message: "Aluno não encontrado para excluir." });
        }
        // Passo 2: Calcula o próximo ID
        const ultimoId = alunosCadastrados.length > 0 ? Math.max(...alunosCadastrados.map(a => a.id || 0)) : 0;

        // Salva a nova lista (sem o aluno excluído) de volta no JSONBin
        await axios.put(JSONBIN_API_URL, novosAlunos, { headers: jsonBinHeaders });
        res.status(204).send(); // 204 No Content é a resposta padrão para um DELETE bem-sucedido
        // Passo 3: Cria o objeto do novo aluno com os dados recebidos do frontend
        const novoAluno = {
            id: ultimoId + 1,
            nome: req.body.name, // Frontend envia 'name'
            autista: req.body.diagnosis === 'autista', // Frontend envia 'diagnosis'
            laudo: req.body.report || null,
            salaId: req.body.class ? parseInt(req.body.class.split('_')[1]) : null,
            dataNascimento: req.body.birthDate,
            telefone: req.body.phone,
            observacoes: req.body.observations
        };

        // Passo 4: Adiciona o novo aluno à lista
        alunosCadastrados.push(novoAluno);
        
        // Passo 5: Salva a lista inteira de volta no JSONBin
        await axios.put(JSONBIN_API_URL, alunosCadastrados, { headers: jsonBinHeaders });
        
        console.log(`[API] Aluno '${novoAluno.nome}' salvo com sucesso no JSONBin.`);
        // Retorna o objeto do novo aluno criado para o frontend
        res.status(201).json(novoAluno);

} catch (error) {
        res.status(500).json({ message: "Erro ao excluir aluno." });
        console.error('API ERRO ao cadastrar aluno no JSONBin:', error.response?.data || error.message);
        res.status(500).json({ message: 'Erro ao cadastrar aluno na nuvem.' });
}
});
// ==========================================================


// Rota de Fallback e Inicialização
app.get('*', (req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'index.html')));
app.listen(PORT, () => console.log(`🚀 Servidor COMPLETO COM CRUD rodando na porta ${PORT}`));
// --- ROTA DE FALLBACK E INICIALIZAÇÃO ---
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor FINAL E ALINHADO rodando na porta ${PORT}`);
});
