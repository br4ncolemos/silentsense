console.log("Silent Sense APP (Novo Design V4) DOM Carregado - Iniciando Script...");

// --- CONFIGURAÇÕES GLOBAIS ---
    const API_BASE_URL = 'https://silentsense-1.onrender.com/api';
    let currentClientTheme = localStorage.getItem('appTheme') || 'light';
// --- CONFIGURAÇÕES GLOBAIS ---
const API_BASE_URL = 'https://silentsense-1.onrender.com/api'; // URL PÚBLICA CORRETA
const WEBSOCKET_URL = 'wss://silentsense-1.onrender.com';     // URL WebSocket PÚBLICA
let currentClientTheme = localStorage.getItem('appTheme') || 'light';

    // ... linha anterior: let currentClientTheme = ...

    // ==========================================================
    // CÓDIGO WEBSOCKET - O "OUVIDO" DO SEU APP
    // ==========================================================
    let ultimoValorSensorReal = "Conectando...";

    function conectarWebSocket() {
        console.log(`[App] Tentando conectar ao WebSocket em ${WEBSOCKET_URL}`);
        const ws = new WebSocket(WEBSOCKET_URL);

        ws.onopen = () => {
            console.log('[App] ✅ Conectado ao servidor do Render via WebSocket!');
            ultimoValorSensorReal = "Conectado";
            if (activeSectionId === 'inicio') updateDashboardUI();
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'sensor_update' || data.type === 'initial_sensor_value') {
                    ultimoValorSensorReal = data.value;
                    if (activeSectionId === 'inicio') updateDashboardUI();
                }
            } catch (e) { console.error("Erro ao processar mensagem do WebSocket:", e); }
        };

        ws.onclose = () => {
            console.log('[App] ❌ Desconectado do servidor WebSocket. Tentando reconectar em 5s...');
            ultimoValorSensorReal = "Reconectando...";
            if (activeSectionId === 'inicio') updateDashboardUI();
            setTimeout(conectarWebSocket, 5000);
        };

        ws.onerror = (error) => { console.error('[App] Erro no WebSocket:', error); };
    }
    // ==========================================================

    // --- SELEÇÃO DE ELEMENTOS DO DOM ---
    // ... seu código continua aqui

// --- SELEÇÃO DE ELEMENTOS DO DOM ---
const appShell = document.querySelector('.app-shell');
@@ -96,8 +139,9 @@ document.addEventListener('DOMContentLoaded', function () {
let dashboardNoiseChartInstance, dashboardIncidentsChartInstance, profileAlunoIncidentsChartInstance;

// --- INICIALIZAÇÃO ---
    async function initializeApp() {
        console.log("FN: initializeApp - Iniciando...");
   async function initializeApp() {
    console.log("FN: initializeApp - Iniciando...");
    conectarWebSocket(); // <<<<<<<<<<< ADICIONE ESTA LINHA AQUI

const storedSimulacao = localStorage.getItem('simulacaoAtiva');
if (storedSimulacao !== null) {
@@ -471,9 +515,13 @@ async function loadCoreDataFromServer() {

// ===================================================================
// PASSO 3: ATUALIZAR O RESTO DA DASHBOARD COM BASE NO MODO
        // ===================================================================
                // ===================================================================
        // PASSO 3: ATUALIZAR O RESTO DA DASHBOARD COM BASE NO MODO
// ===================================================================
if (cachedConfigs.simulacaoAtiva) {
            // MODO SIMULAÇÃO: Usa os dados reais de alunos que já calculamos,
            // --- MODO SIMULAÇÃO ATIVO ---
            // Usa os dados reais de contagem de alunos que já calculamos,
// e simula o resto (ruído, incidentes).

const currentNoise = Math.floor(Math.random() * 70) + 30;
@@ -482,22 +530,41 @@ async function loadCoreDataFromServer() {
if (dashMaxNoiseEl && currentNoise > parseInt(dashMaxNoiseEl.textContent || "0")) dashMaxNoiseEl.textContent = currentNoise;
if (dashIncidentesHojeEl) dashIncidentesHojeEl.textContent = Math.floor(Math.random() * 3);
if (dashIncidentesAutistasEl) dashIncidentesAutistasEl.textContent = Math.floor(Math.random() * 2);
            if (dashSalaStatusEl) dashSalaStatusEl.textContent = "Simulada"; // Mais claro para o usuário
            if (dashSalaStatusEl) dashSalaStatusEl.textContent = "Simulada";
if (dashToggleSalaBtn) {
dashToggleSalaBtn.disabled = false;
dashToggleSalaBtn.textContent = 'Ver Detalhes (Sim.)';
delete dashToggleSalaBtn.dataset.salaId;
}
} else {
            // MODO NORMAL: Usa os dados reais de alunos que já calculamos,
            // e usa dados "reais" (ou simulados de forma diferente) para o resto.
            
            // Exemplo: usar um nível de ruído mais baixo para o modo real
            const realNoise = Math.floor(Math.random() * 30) + 10;
            if (dashNoiseLevelBarEl) dashNoiseLevelBarEl.style.width = `${Math.min(100, realNoise)}%`;
            if (dashNoiseValueEl) dashNoiseValueEl.textContent = `${realNoise} dB`;
            if (dashMaxNoiseEl) dashMaxNoiseEl.textContent = "0"; // Reinicia a contagem máxima
            // --- MODO NORMAL (REAL) ---
            // Usa os dados reais do sensor que estão chegando via WebSocket.

            let valorDoSensor = ultimoValorSensorReal; // Pega da variável global
            let displayValor = "---";
            let noiseNumber = 0;

            // Extrai o número da string "dB:75"
            if (typeof valorDoSensor === 'string' && valorDoSensor.includes(':')) {
                const partes = valorDoSensor.split(':');
                noiseNumber = parseInt(partes[1], 10) || 0;
                displayValor = `${noiseNumber} dB`;
            } else {
                // Se o valor não for no formato esperado, mostra o status (ex: "Conectando...")
                displayValor = valorDoSensor;
            }

            // ATUALIZA A UI DO RUÍDO COM OS DADOS REAIS
            if (dashNoiseLevelBarEl) dashNoiseLevelBarEl.style.width = `${Math.min(100, noiseNumber)}%`;
            if (dashNoiseValueEl) dashNoiseValueEl.textContent = displayValor;
            if (dashMaxNoiseEl) {
                const maxAtual = parseInt(dashMaxNoiseEl.textContent || "0");
                if (noiseNumber > maxAtual) {
                    dashMaxNoiseEl.textContent = noiseNumber;
                }
            }
            
            // O resto da sua lógica para o modo real continua a mesma
const hojeStr = new Date().toISOString().split('T')[0];
const incidentesDeHoje = cachedRelatorios ? cachedRelatorios.filter(r => r.tipo === 'incidente' && r.data?.startsWith(hojeStr)) : [];
if (dashIncidentesHojeEl) dashIncidentesHojeEl.textContent = incidentesDeHoje.length;
