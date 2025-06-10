const { database, popularDadosIniciais, getNextId } = require('../../database'); // Adicionar getNextId se for resetar IDs
const fs = require('fs'); // Para backup/restore real (opcional avançado)
const path = require('path'); // Para backup/restore real (opcional avançado)

const configuracaoController = {
    getConfiguracoes: (req, res) => {
        res.json(database.configuracoes);
    },

    updateConfiguracoes: (req, res) => {
        const { tema, notificacoes, limiteBarulho, simulacaoAtiva } = req.body;

        if (tema !== undefined) database.configuracoes.tema = tema;
        if (notificacoes !== undefined) database.configuracoes.notificacoes = Boolean(notificacoes);
        if (limiteBarulho !== undefined) database.configuracoes.limiteBarulho = parseInt(limiteBarulho);
        if (simulacaoAtiva !== undefined) database.configuracoes.simulacaoAtiva = Boolean(simulacaoAtiva);
        
        res.json(database.configuracoes);
    },

    backupData: (req, res) => {
        try {
            const backupFilePath = path.join(__dirname, '..', 'data', `autismo_app_backup_${Date.now()}.json`);
            const backupData = JSON.stringify(database, null, 2);
            
            fs.writeFileSync(backupFilePath, backupData);

            res.download(backupFilePath, `autismo_app_backup_${Date.now()}.json`, (err) => {
                if (err) {
                    console.error("Erro ao enviar arquivo de backup:", err);
                    // Não precisa enviar erro se o header já foi enviado, mas log é bom
                }
                // Opcional: deletar o arquivo do servidor após o download
                // fs.unlinkSync(backupFilePath); 
            });
            console.log(`Backup de dados salvo em: ${backupFilePath}`);
        } catch (error) {
            console.error("Erro ao criar backup:", error);
            res.status(500).json({ message: "Erro ao criar backup de dados." });
        }
    },

    restoreData: (req, res) => {
        // Para uma implementação real, usar 'multer' para upload de arquivo.
        // Esta é uma simulação MUITO simplificada e insegura.
        // Em um app real, esta rota deve ser protegida e o arquivo validado.
        console.warn("Tentativa de restauração de dados. Esta funcionalidade é complexa e requer upload de arquivo.");
        // Exemplo: if (req.file) { const newData = JSON.parse(req.file.buffer.toString()); ... }
        res.status(501).json({ message: "Restauração de dados requer upload de arquivo e não está implementada para esta simulação. Faça manualmente se necessário." });
    },

    resetData: (req, res) => {
        console.warn("REDEFINIÇÃO DE DADOS SOLICITADA!");
        database.alunos = [];
        database.salas = [];
        database.relatorios = [];
        
        // Resetar IDs para que novos dados comecem de 1
        // Isso requer exportar e modificar os contadores nextId do database.js,
        // o que não é ideal para uma simples simulação.
        // Por ora, os IDs continuarão de onde pararam, ou pode-se recriar o objeto database.
        
        // Alternativa: Reinicializar completamente o objeto database e os contadores
        // nextAlunoId = 1; // Precisaria re-importar e modificar ou ter setters.
        // nextSalaId = 1;
        // nextRelatorioId = 1;
        // database.configuracoes = { tema: 'light', ...defaultConfigs };

        popularDadosIniciais(); // Repopula com os dados de exemplo após limpar

        res.json({ message: "Todos os dados foram limpos e repovoados com exemplos iniciais." });
    }
};
module.exports = configuracaoController;