// public/indexAluno.js (VERSÃO FINAL E COMPLETA)

// Aplica o tema salvo no sistema principal assim que a página começa a carregar
(function() {
    const savedTheme = localStorage.getItem('appTheme') || 'light';
    document.body.className = '';
    if (savedTheme !== 'light') {
        document.body.classList.add(savedTheme + '-theme');
    }
})();

// Adiciona toda a lógica do formulário após o carregamento do HTML
document.addEventListener('DOMContentLoaded', function() {
    
    // Seleciona todos os elementos do DOM que vamos usar
    const form = document.getElementById('student-registration-form');
    const studentNameInput = document.getElementById('studentName');
    const profileImageInput = document.getElementById('profileImageInput');
    const profileImagePreview = document.getElementById('profileImagePreview');
    const dateInput = document.getElementById('birthDate');
    const phoneLabel = document.getElementById('phoneLabel');
    
    // Lógica para pré-visualização da imagem
    profileImageInput.addEventListener('change', function() {
        const file = this.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = e => profileImagePreview.src = e.target.result;
            reader.readAsDataURL(file);
        }
    });

    // Lógica para cálculo e validação da idade
    dateInput.addEventListener('change', function() {
        const birthDateString = this.value;
        if (!birthDateString) return;
        const birthDate = new Date(birthDateString + 'T00:00:00');
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
        
        if (age > 65 || age < 5) {
            alert(`Sério mesmo? ${age} anos?!\n\nPor favor, insira uma data de nascimento válida.`);
            this.value = '';
            phoneLabel.textContent = 'Telefone do Responsável:';
            return;
        }
        phoneLabel.textContent = (age >= 18) ? 'Telefone do Aluno:' : 'Telefone do Responsável:';
    });

    // Lógica de envio do formulário
    form.addEventListener('submit', function(event) {
        // Impede que o formulário recarregue a página, permitindo nosso controle via JavaScript
        event.preventDefault(); 
        
        const nome = studentNameInput.value.trim();
        if (!nome) {
            alert("O nome do aluno é obrigatório!");
            return;
        }

        // FormData coleta todos os campos do formulário com o atributo 'name'
        const formData = new FormData(form);
        
        // Pega o arquivo de imagem pelo seu ID e o adiciona ao FormData.
        // O nome 'profileImage' deve ser o mesmo que o backend espera.
        if (profileImageInput.files[0]) {
            formData.append('profileImage', profileImageInput.files[0]);
        }

        // Envia os dados para o servidor
        fetch('http://localhost:3000/api/alunos', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => { throw new Error(err.message) });
            }
            return response.json();
        })
        .then(data => {
            alert('Aluno cadastrado com sucesso!');
            window.location.href = 'index.html'; // Redireciona para a página principal
        })
        .catch(error => {
            alert(`Ocorreu um erro: ${error.message}`);
            console.error('Erro no fetch:', error);
        });
    });
});