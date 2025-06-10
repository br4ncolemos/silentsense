// server/server.js (VERSÃO FINAL COM CADASTRO)

// ==========================================================
// IMPORTAÇÕES E CONFIGURAÇÃO
// ==========================================================
const express = require('express');
const path = require('path');
const cors = require('cors');
const morgan = require('morgan');
const fs = require('fs'); // Filesystem para ler/escrever arquivos
const multer = require('multer'); // Middleware para upload de arquivos

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Importante para formulários
app.use(express.static(path.join(__dirname, '..', 'public')));

// --- Configuração do Multer (Upload de Imagem) ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const destPath = path.join(__dirname, '..', 'public', 'images');
        fs.mkdirSync(destPath, { recursive: true }); // Garante que a pasta exista
        cb(null, destPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `aluno-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});
const upload = multer({ storage: storage });


// ==========================================================
// ESTADO E LÓGICA DO MODO DE SIMULAÇÃO
// ==========================================================
let simuladorAtivo = true;

const alunosPadraoPath = path.join(__dirname, 'data', 'alunosPadrao.json');
const alunosCadastradosPath = path.join(__dirname, 'data', 'alunosCadastrados.json');

const lerJson = (caminho) => {
    try {
        if (fs.existsSync(caminho)) {
            const data = fs.readFileSync(caminho, 'utf8');
            return data ? JSON.parse(data) : [];
        }
        return [];
    } catch (error) {
        console.error(`Erro ao ler JSON: ${caminho}`, error);
        return [];
    }
};

const salvarJson = (caminho, dados) => {
    try {
        const dataString = JSON.stringify(dados, null, 2); // Formata para leitura
        fs.writeFileSync(caminho, dataString, 'utf8');
    } catch (error) {
        console.error(`Erro ao salvar JSON: ${caminho}`, error);
    }
};


// ==========================================================
// ROTAS DA API
// ==========================================================

// --- ROTAS GET ---
app.get('/api/alunos', (req, res) => {
    if (simuladorAtivo) {
        res.json(lerJson(alunosPadraoPath));
    } else {
        res.json(lerJson(alunosCadastradosPath));
    }
});

app.get('/api/configuracoes', (req, res) => {
    res.json({ simulacaoAtiva: simuladorAtivo });
});

// --- ROTA PUT ---
app.put('/api/configuracoes', (req, res) => {
    const novoEstado = req.body.simulacaoAtiva;
    if (typeof novoEstado === 'boolean') {
        simuladorAtivo = novoEstado;
        res.json({ success: true, simulacaoAtiva: simuladorAtivo });
    } else {
        res.status(400).json({ success: false, message: 'Valor inválido.' });
    }
});

// ============================================================
// ROTA POST PARA CADASTRAR ALUNOS (A PARTE QUE FALTAVA)
// ============================================================
// A rota usa o middleware 'upload.single('profileImage')' para processar a imagem
app.post('/api/alunos', upload.single('profileImage'), (req, res) => {
    try {
        // Validação básica
        if (!req.body.name || req.body.name.trim() === '') {
            return res.status(400).json({ message: 'Nome do aluno é obrigatório.' });
        }

        const alunosCadastrados = lerJson(alunosCadastradosPath);
        
        // Pega o último ID para gerar o próximo
        const ultimoId = alunosCadastrados.length > 0 ? Math.max(...alunosCadastrados.map(a => a.id || 0)) : 0;
        
        const novoAluno = {
            id: ultimoId + 1,
            nome: req.body.name,
            autista: req.body.diagnosis === 'autista',
            laudo: req.body.report || null,
            salaId: req.body.class ? parseInt(req.body.class.split('_')[1]) : null,
            dataNascimento: req.body.birthDate,
            telefone: req.body.phone,
            observacoes: req.body.observations,
            // Se uma imagem foi enviada, usa o caminho dela, senão usa a padrão
            imagemUrl: req.file ? `images/${req.file.filename}` : 'images/perfil_padrao.jpg'
        };

        alunosCadastrados.push(novoAluno);
        salvarJson(alunosCadastradosPath, alunosCadastrados);

        console.log(`[API] Novo aluno '${novoAluno.nome}' salvo em alunosCadastrados.json.`);
        res.status(201).json(novoAluno);

    } catch (error) {
        console.error('API ERRO ao cadastrar aluno:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao processar o cadastro.' });
    }
});
// ============================================================


// ==========================================================
// ROTA DE FALLBACK E INICIALIZAÇÃO
// ==========================================================
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log("======================================================");
    console.log("✅ SERVIDOR COMPLETO COM CADASTRO RODANDO NA PORTA " + PORT);
    console.log(`-> Modo inicial: ${simuladorAtivo ? 'ATIVO' : 'INATIVO'}`);
    console.log("======================================================");
});
