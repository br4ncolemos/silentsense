// public/indexAluno.js (VERSÃO FINAL COMPLETA E CORRIGIDA)

// Aplica o tema salvo no sistema
(function() {
    const savedTheme = localStorage.getItem('appTheme') || 'light';
    document.body.className = '';
    if (savedTheme !== 'light') {
        document.body.classList.add(savedTheme + '-theme');
    }
})();

document.addEventListener('DOMContentLoaded', function() {
    
    const form = document.getElementById('student-registration-form');
    const studentNameInput = document.getElementById('studentName');
    const profileImageInput = document.getElementById('profileImageInput');
    const profileImagePreview = document.getElementById('profileImagePreview');
    const dateInput = document.getElementById('birthDate');
    const phoneLabel = document.getElementById('phoneLabel');
    
    // Preview da imagem (visual, não afeta o envio)
    profileImageInput.addEventListener('change', function() {
        const file = this.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = e => profileImagePreview.src = e.target.result;
            reader.readAsDataURL(file);
        }
    });

    // Lógica para cálculo e validação da idade (VERSÃO COMPLETA)
    dateInput.addEventListener('change', function() {
        const birthDateString = this.value; // Pega a data do campo, ex: "2010-05-15"

        // Se o campo estiver vazio, não faz nada
        if (!birthDateString) {
            return;
        }

        // Cria um objeto Date com a data de nascimento.
        // Adicionar 'T00:00:00' evita problemas de fuso horário.
        const birthDate = new Date(birthDateString + 'T00:00:00');
        
        // Pega a data de hoje
        const today = new Date();

        // Calcula a diferença de anos
        let age = today.getFullYear() - birthDate.getFullYear();
        
        // Ajusta a idade se o aniversário ainda não ocorreu este ano
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        
        // Valida se a idade está dentro de um intervalo razoável (5 a 65 anos)
        if (age > 65 || age < 5) {
            alert(`Sério mesmo? ${age} anos?!\n\nPor favor, insira uma data de nascimento válida.`);
            this.value = ''; // Limpa o campo de data
            phoneLabel.textContent = 'Telefone do Responsável:'; // Volta o texto para o padrão
            return; // Para a execução da função
        }
        
        // Muda o texto da label do telefone com base na idade
        if (age >= 18) {
            phoneLabel.textContent = 'Telefone do Aluno:';
        } else {
            phoneLabel.textContent = 'Telefone do Responsável:';
        }
    });

    // LÓGICA DE ENVIO DO FORMULÁRIO (TOTALMENTE REFEITA PARA JSON)
    form.addEventListener('submit', function(event) {
        event.preventDefault(); 
        
        const nome = studentNameInput.value.trim();
        if (!nome) {
            alert("O nome do aluno é obrigatório!");
            return;
        }

        // PASSO 1: Criar um objeto JavaScript simples com os dados do formulário
        const dadosParaEnviar = {
            name: document.getElementById('studentName').value,
            class: document.getElementById('studentClass').value,
            birthDate: document.getElementById('birthDate').value,
            phone: document.getElementById('studentPhone').value,
            diagnosis: document.getElementById('studentDiagnosis').value,
            report: document.getElementById('studentReport').value,
            observations: document.getElementById('studentObservations').value
        };

        // PASSO 2: Definir a URL correta do servidor
        const API_URL = 'https://silentsense-1.onrender.com/api/alunos';

        // PASSO 3: Enviar os dados como JSON
        fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(dadosParaEnviar)
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => { throw new Error(err.message || 'Ocorreu um erro no servidor.') });
            }
            return response.json();
        })
        .then(data => {
            alert('Aluno cadastrado com sucesso!');
            window.location.href = 'index.html';
        })
        .catch(error => {
            alert(`Ocorreu um erro ao cadastrar: ${error.message}`);
            console.error('Erro no fetch:', error);
        });
    });
});
