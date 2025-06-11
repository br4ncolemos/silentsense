document.addEventListener('DOMContentLoaded', function () {
    console.log("Silent Sense APP (Novo Design V4) DOM Carregado - Iniciando Script...");

    // ==========================================================
    //                        CONFIGURAÇÕES GLOBAIS
    // ==========================================================
    const API_BASE_URL = 'https://silentsense-1.onrender.com/api';
    const WEBSOCKET_URL = 'wss://silentsense-1.onrender.com';
    let currentClientTheme = localStorage.getItem('appTheme') || 'light';

    // ==========================================================
    //               ESTADO DA APLICAÇÃO (VARIÁVEIS)
    // ==========================================================
    let ultimoValorSensorReal = "Conectando...";
    let podeRegistrarIncidente = true; // A "trava" para o cooldown de incidentes
    
    let activeSectionId = 'inicio';
    let isChamadaRunning = false;
    let currentSalaChamadaId = null;
    let chamadaCurrentSeconds = 0;
    let chamadaTimerInterval;
    
    let cachedSalas = [];
    let cachedAlunos = [];
    let cachedRelatorios = []; 
    let cachedConfigs = { 
        tema: currentClientTheme,
        notificacoes: true, 
        limiteBarulho: 70, 
        simulacaoAtiva: true,
        salaPrincipalDashboardId: null 
    };

    let dashboardNoiseChartInstance, dashboardIncidentsChartInstance, profileAlunoIncidentsChartInstance;
    
    // --- SELEÇÃO DE ELEMENTOS DO DOM ---
    const appShell = document.querySelector('.app-shell');
    const headerLogoEl = document.getElementById('headerLogo');
    const currentSectionTitleEl = document.getElementById('currentSectionTitle');
    const adminModeToggleBtnHeader = document.getElementById('adminModeToggleBtn');
    const themeToggleBtnHeader = document.getElementById('themeToggleBtn');
    const mainNavContainer = document.getElementById('mainNav');
    const contentSections = document.querySelectorAll('.main-container .content-section');
    const refreshDashboardBtn = document.getElementById('refreshDashboardBtn');
    const dashTotalAlunosEl = document.getElementById('dashTotalAlunos');
    const dashAlunosAutistasEl = document.getElementById('dashAlunosAutistas');
    const dashAlunosTdahEl = document.getElementById('dashAlunosTdah');
    const dashNoiseLevelBarEl = document.getElementById('dashNoiseLevelBar');
    const dashNoiseValueEl = document.getElementById('dashNoiseValue');
    const dashMaxNoiseEl = document.getElementById('dashMaxNoise');
    const dashIncidentesHojeEl = document.getElementById('dashIncidentesHoje');
    const dashIncidentesAutistasEl = document.getElementById('dashIncidentesAutistas');
    const dashSalaStatusEl = document.getElementById('dashSalaStatus');
    const dashToggleSalaBtn = document.getElementById('dashToggleSalaBtn');
    const dashboardNoiseChartCanvas = document.getElementById('dashboardNoiseChart');
    const dashboardIncidentsChartCanvas = document.getElementById('dashboardIncidentsChart');
    const alunosOpenAddModalBtn = document.getElementById('alunosOpenAddModalBtn');
    const alunosTableBodyEl = document.getElementById('alunosTableBody');
    const alunosSearchInput = document.getElementById('alunosSearchInput');
    const alunosFilterAutismoSelect = document.getElementById('alunosFilterAutismoSelect');
    const chamadaSalaSelect = document.getElementById('chamadaSalaSelect');
    const chamadaStartBtn = document.getElementById('chamadaStartBtn');
    const chamadaEndBtn = document.getElementById('chamadaEndBtn');
    const chamadaCurrentSalaEl = document.getElementById('chamadaCurrentSala');
    const chamadaStatusEl = document.getElementById('chamadaStatus');
    const chamadaTimeEl = document.getElementById('chamadaTime');
    const chamadaAlunosGridEl = document.getElementById('chamadaAlunosGrid');
    const chamadaActionsFooterEl = document.querySelector('.chamada-actions-footer');
    const chamadaGerarRelatorioBtn = document.getElementById('chamadaGerarRelatorioBtn');
    const alunoCardChamadaTemplate = document.getElementById('alunoCardChamadaTemplate');
    const relatoriosTypeSelect = document.getElementById('relatoriosTypeSelect');
    const relatoriosDateInput = document.getElementById('relatoriosDateInput');
    const relatoriosSalaSelect = document.getElementById('relatoriosSalaSelect');
    const relatoriosAlunoSelect = document.getElementById('relatoriosAlunoSelect');
    const relatoriosGerarBtn = document.getElementById('relatoriosGerarBtn');
    const relatoriosOutputAreaEl = document.getElementById('relatoriosOutputArea');
    const settingsTabsContainer = document.querySelector('.settings-tabs-container');
    const settingsTabPanes = document.querySelectorAll('.settings-tabs-container .tab-pane');
    const configThemeSelect = document.getElementById('configThemeSelect');
    const configNotificationsCheckbox = document.getElementById('configNotificationsCheckbox');
    const configNoiseLimitRange = document.getElementById('configNoiseLimitRange');
    const configNoiseLimitValueEl = document.getElementById('configNoiseLimitValue');
    const configSaveGeralBtn = document.getElementById('configSaveGeralBtn');
    const configSimulateDataCheckbox = document.getElementById('configSimulateDataCheckbox');
    const configSalasTableBodyEl = document.getElementById('configSalasTableBody');
    const configOpenAddSalaModalBtn = document.getElementById('configOpenAddSalaModalBtn');
    const configBackupBtn = document.getElementById('configBackupBtn');
    const configRestoreBtn = document.getElementById('configRestoreBtn');
    const configResetBtn = document.getElementById('configResetBtn');
    const configSaveAdminBtn = document.getElementById('configSaveAdminBtn'); 
    const genericModalOverlay = document.getElementById('genericModalOverlay');
    const genericModalBox = document.getElementById('genericModalBox');
    const genericModalTitleEl = document.getElementById('genericModalTitle');
    const genericModalBodyEl = document.getElementById('genericModalBody');
    const genericModalFooterEl = document.getElementById('genericModalFooter');
    const genericModalCloseBtn = document.getElementById('genericModalCloseBtn');

    // ==========================================================
    //        CLIENTE WEBSOCKET (O "OUVIDO" DO APP)
    // ==========================================================
    function conectarWebSocket() {
        const ws = new WebSocket(WEBSOCKET_URL);

        ws.onopen = () => {
            console.log('[App] ✅ Conectado ao servidor via WebSocket!');
            ultimoValorSensorReal = "Conectado";
            if (activeSectionId === 'inicio') updateDashboardUI();
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'sensor_update' || data.type === 'initial_sensor_value') {
                    ultimoValorSensorReal = data.value;
                    detectarIncidentePorRuido(ultimoValorSensorReal);
                    if (activeSectionId === 'inicio') updateDashboardUI();
                }
            } catch (e) { console.error("Erro ao processar mensagem do WebSocket:", e); }
        };

        ws.onclose = () => {
            console.log('[App] ❌ Desconectado. Tentando reconectar em 5s...');
            ultimoValorSensorReal = "Reconectando...";
            if (activeSectionId === 'inicio') updateDashboardUI();
            setTimeout(conectarWebSocket, 5000);
        };
    }

    // ==========================================================
    //                LÓGICA DE DETECÇÃO DE INCIDENTES
    // ==========================================================
    function detectarIncidentePorRuido(valorDoSensor) {
        if (!dashIncidentesHojeEl) return;

        let noiseNumber = 0;
        if (typeof valorDoSensor === 'string' && valorDoSensor.includes(':')) {
            noiseNumber = parseInt(valorDoSensor.split(':')[1], 10) || 0;
        }

        if (noiseNumber >= 95 && podeRegistrarIncidente) {
            podeRegistrarIncidente = false; // Ativa a trava
            
            let contagemAtual = parseInt(dashIncidentesHojeEl.textContent || "0");
            dashIncidentesHojeEl.textContent = contagemAtual + 1;
            
            showUINotification("Incidente de ruído alto (95dB+) detectado!", "warning");
            
            setTimeout(() => {
                podeRegistrarIncidente = true; // Libera a trava
                console.log("Cooldown do incidente finalizado.");
            }, 60000); // Cooldown de 1 minuto
        }
    }

    // --- INICIALIZAÇÃO ---
    async function initializeApp() {
        console.log("FN: initializeApp - Iniciando...");
        conectarWebSocket();
        
        const storedSimulacao = localStorage.getItem('simulacaoAtiva');
        if (storedSimulacao !== null) {
            cachedConfigs.simulacaoAtiva = JSON.parse(storedSimulacao);
        }
        
        applyClientThemeUI(currentClientTheme); 
        setupBaseEventListeners();
        
        const dataLoadedSuccessfully = await loadCoreDataFromServer(); 
        
        if (dataLoadedSuccessfully) {
            applyClientThemeUI(cachedConfigs.tema); 
            updateAdminModeUIState(cachedConfigs.simulacaoAtiva);
            navigateToSection(activeSectionId); 
            setupDynamicEventListeners();    
        } else {
            showUINotification("Falha crítica ao carregar dados. App pode não funcionar.", "error", 7000);
            updateAdminModeUIState(cachedConfigs.simulacaoAtiva);
            navigateToSection(activeSectionId); 
            setupDynamicEventListeners(); 
        }
    }

    // --- LÓGICA DE NAVEGAÇÃO ---
    function navigateToSection(sectionId) {
        if (!sectionId || !document.getElementById(sectionId)) { sectionId = 'inicio'; }
        activeSectionId = sectionId;
        contentSections.forEach(section => section.classList.remove('active'));
        document.getElementById(sectionId)?.classList.add('active');
        mainNavContainer.querySelectorAll('.nav-item').forEach(item => item.classList.toggle('active', item.dataset.section === sectionId));
        const sectionButton = mainNavContainer.querySelector(`.nav-item[data-section="${sectionId}"]`);
        if (currentSectionTitleEl && sectionButton) {
            const navTextSpan = sectionButton.querySelector('.nav-text');
            currentSectionTitleEl.textContent = navTextSpan ? navTextSpan.textContent : "Silent Sense APP";
        }
        switch (sectionId) {
            case 'inicio': updateDashboardUI(); break;
            case 'alunos': renderAlunosTableUI(); break;
            case 'chamada': prepareChamadaUI(); break;
            case 'relatorios': prepareRelatoriosUI(); break;
            case 'configuracoes': prepareConfiguracoesUI(); break;
        }
    }

    // --- MANIPULAÇÃO DE TEMA ---
    function applyClientThemeUI(themeName) {
        document.body.className = ''; 
        if (themeName && themeName !== 'light') { document.body.classList.add(themeName + '-theme'); }
        currentClientTheme = themeName; 
        localStorage.setItem('appTheme', themeName); 
        if (themeToggleBtnHeader) {
            const iconMap = { light: 'fa-moon', dark: 'fa-sun', 'autism-friendly': 'fa-hand-sparkles' };
            const themeTitleMap = { light: 'Claro', dark: 'Escuro', 'autism-friendly': 'Tema Autismo' };
            themeToggleBtnHeader.innerHTML = `<i class="fas ${iconMap[themeName] || 'fa-moon'}"></i>`;
            themeToggleBtnHeader.title = `Tema: ${themeTitleMap[themeName] || 'Claro'}`;
        }
        if(configThemeSelect) { configThemeSelect.value = themeName; }
        if (dashboardNoiseChartInstance || dashboardIncidentsChartInstance || profileAlunoIncidentsChartInstance) {
            setTimeout(() => {
                if (activeSectionId === 'inicio') {
                    if (dashboardNoiseChartInstance) dashboardNoiseChartInstance.destroy();
                    if (dashboardIncidentsChartInstance) dashboardIncidentsChartInstance.destroy();
                    renderDashboardChartsUI();
                }
                if (genericModalOverlay.classList.contains('active') && genericModalBox.classList.contains('profile-view')) {
                    const alunoId = genericModalFooterEl.querySelector('[data-action="edit-profile"]')?.dataset.alunoId;
                    if (alunoId && profileAlunoIncidentsChartInstance) {
                         profileAlunoIncidentsChartInstance.destroy();
                         renderProfileIncidentsChartAndListUI(parseInt(alunoId), 'profileModalAlunoIncChartCanvas', 'profileModalIncidentesList');
                    }
                }
            }, 100); 
        }
    }

    // --- DASHBOARD (ATUALIZAÇÃO DA UI) ---
    function updateDashboardUI() {
        if (activeSectionId !== 'inicio' || !dashTotalAlunosEl) return;
        
        const alunosCount = cachedAlunos ? cachedAlunos.length : 0;
        const alunosAutistasCount = cachedAlunos ? cachedAlunos.filter(a => a.autista).length : 0;
        if (dashTotalAlunosEl) dashTotalAlunosEl.textContent = alunosCount;
        if (dashAlunosAutistasEl) dashAlunosAutistasEl.textContent = alunosAutistasCount;

        if (cachedConfigs.simulacaoAtiva) {
            const currentNoise = Math.floor(Math.random() * 70) + 30;
            if (dashNoiseLevelBarEl) dashNoiseLevelBarEl.style.width = `${Math.min(100, currentNoise)}%`;
            if (dashNoiseValueEl) dashNoiseValueEl.textContent = `${currentNoise} dB`;
            if (dashMaxNoiseEl && currentNoise > parseInt(dashMaxNoiseEl.textContent || "0")) dashMaxNoiseEl.textContent = currentNoise;
            if (dashIncidentesHojeEl) dashIncidentesHojeEl.textContent = Math.floor(Math.random() * 3);
            if (dashIncidentesAutistasEl) dashIncidentesAutistasEl.textContent = Math.floor(Math.random() * 2);
            if (dashSalaStatusEl) dashSalaStatusEl.textContent = "Simulada";
            if (dashToggleSalaBtn) {
                dashToggleSalaBtn.disabled = false;
                dashToggleSalaBtn.textContent = 'Ver Detalhes (Sim.)';
                delete dashToggleSalaBtn.dataset.salaId;
            }
        } else {
            let valorDoSensor = ultimoValorSensorReal;
            let displayValor = "---";
            let noiseNumber = 0;

            if (typeof valorDoSensor === 'string' && valorDoSensor.includes(':')) {
                noiseNumber = parseInt(valorDoSensor.split(':')[1], 10) || 0;
                displayValor = `${noiseNumber} dB`;
            } else {
                displayValor = valorDoSensor;
            }

            if (dashNoiseLevelBarEl) dashNoiseLevelBarEl.style.width = `${Math.min(100, noiseNumber)}%`;
            if (dashNoiseValueEl) dashNoiseValueEl.textContent = displayValor;
            if (dashMaxNoiseEl) {
                const maxAtual = parseInt(dashMaxNoiseEl.textContent || "0");
                if (noiseNumber > maxAtual) {
                    dashMaxNoiseEl.textContent = noiseNumber;
                }
            }
            
            // A contagem de incidentes agora é feita pela função 'detectarIncidentePorRuido'.
            // A UI apenas reflete o valor que já está no elemento.
            
            const salaPrincipalId = cachedConfigs.salaPrincipalDashboardId || (cachedSalas && cachedSalas[0]?.id);
            const salaPrincipal = cachedSalas ? cachedSalas.find(s => s.id === salaPrincipalId) : null;
            if (dashSalaStatusEl && salaPrincipal) dashSalaStatusEl.textContent = salaPrincipal.adaptada ? "Adaptada" : "Padrão";
            else if (dashSalaStatusEl) dashSalaStatusEl.textContent = "N/A";

            if (dashToggleSalaBtn) {
                dashToggleSalaBtn.disabled = !salaPrincipal;
                if (salaPrincipal) {
                    dashToggleSalaBtn.dataset.salaId = salaPrincipal.id;
                    dashToggleSalaBtn.textContent = salaPrincipal.adaptada ? 'Desativar Adap.' : 'Ativar Adap.';
                } else {
                    dashToggleSalaBtn.textContent = 'Ver Detalhes';
                    delete dashToggleSalaBtn.dataset.salaId;
                }
            }
        }
        renderDashboardChartsUI();
    }
    
    // --- COLE O RESTO DO SEU SCRIPT.JS ORIGINAL AQUI ---
    // (Todas as funções de fetchDataAPI, loadCoreDataFromServer, modais, tabelas, etc.)
    // A única mudança foi na updateDashboardUI e na adição do WebSocket no topo.
    // Abaixo estão suas funções, sem alterações.
    
    async function cycleAndSaveTheme() { let newTheme = 'light'; if (currentClientTheme === 'light') newTheme = 'dark'; else if (currentClientTheme === 'dark') newTheme = 'autism-friendly'; else if (currentClientTheme === 'autism-friendly') newTheme = 'light'; applyClientThemeUI(newTheme); try { const updatedConfigsFromServer = await fetchDataAPI('/configuracoes', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tema: newTheme }) }); if (updatedConfigsFromServer && typeof updatedConfigsFromServer.tema !== 'undefined') { cachedConfigs.tema = updatedConfigsFromServer.tema; } else { cachedConfigs.tema = newTheme; } const themeTitleMap = { light: 'Claro', dark: 'Escuro', 'autism-friendly': 'Amigo do Autismo' }; showUINotification(`Tema '${themeTitleMap[cachedConfigs.tema] || 'Claro'}' aplicado.`, 'info', 2500); } catch (e) { console.warn("Falha ao salvar tema no servidor (ciclo).", e); } }
    function updateAdminModeUIState(isSimulacaoAtiva) { if (adminModeToggleBtnHeader) adminModeToggleBtnHeader.classList.toggle('active', isSimulacaoAtiva); if (configSimulateDataCheckbox) configSimulateDataCheckbox.checked = isSimulacaoAtiva; }
    async function toggleAndSaveAdminMode() { const novoEstadoSimulador = !cachedConfigs.simulacaoAtiva; try { const resposta = await fetchDataAPI('/configuracoes', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ simulacaoAtiva: novoEstadoSimulador }) }); cachedConfigs.simulacaoAtiva = resposta.simulacaoAtiva; localStorage.setItem('simulacaoAtiva', JSON.stringify(cachedConfigs.simulacaoAtiva)); updateAdminModeUIState(cachedConfigs.simulacaoAtiva); showUINotification(`Modo Simulador ${cachedConfigs.simulacaoAtiva ? 'ATIVADO' : 'DESATIVADO'}. Recarregando...`, 'info'); await loadCoreDataFromServer(); navigateToSection(activeSectionId); } catch (e) { showUINotification("Falha ao alterar modo.", "error"); } }
    async function handleSaveAdminSettingsAndReload() { if (!configSimulateDataCheckbox) return; const newSimulacaoState = configSimulateDataCheckbox.checked; cachedConfigs.simulacaoAtiva = newSimulacaoState; localStorage.setItem('simulacaoAtiva', JSON.stringify(newSimulacaoState)); try { await fetchDataAPI('/configuracoes', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ simulacaoAtiva: newSimulacaoState }) }); showUINotification(`Configurações salvas. Reiniciando...`, 'info', 2500); } catch (e) { showUINotification(`Falha ao salvar. Reiniciando com config local.`, 'warning', 3500); } finally { setTimeout(() => { window.location.reload(); }, 1500); } }
    async function fetchDataAPI(endpoint, options = {}) { showLoadingIndicator(true); try { const response = await fetch(`${API_BASE_URL}${endpoint}`, options); if (response.status === 204) return null; const contentType = response.headers.get("content-type"); let responseData; if (contentType && contentType.includes("application/json")) { responseData = await response.json(); } else { responseData = { message: await response.text() }; } if (!response.ok) { throw new Error(responseData.message || `Erro HTTP ${response.status}`); } return responseData; } catch (error) { showUINotification(`Erro API: ${error.message}`, 'error'); throw error; } finally { showLoadingIndicator(false); } }
    async function loadCoreDataFromServer() { try { const serverConfigs = await fetchDataAPI('/configuracoes'); if (serverConfigs) { cachedConfigs = { ...cachedConfigs, ...serverConfigs }; localStorage.setItem('simulacaoAtiva', JSON.stringify(cachedConfigs.simulacaoAtiva)); } const [salasResponse, alunosResponse] = await Promise.all([fetchDataAPI('/salas'), fetchDataAPI('/alunos')]); cachedSalas = Array.isArray(salasResponse) ? salasResponse : []; cachedAlunos = Array.isArray(alunosResponse) ? alunosResponse : []; console.log(`Dados carregados. Salas: ${cachedSalas.length}, Alunos: ${cachedAlunos.length}`); return true; } catch (error) { showUINotification("Falha crítica ao carregar dados.", "error"); return false; } }
    function showUINotification(message, type = 'info', duration = 3500) { const existingNotification = document.querySelector('.app-shell > .notification.show'); if (existingNotification) { existingNotification.remove(); } const notification = document.createElement('div'); notification.className = `notification ${type}`; notification.textContent = message; appShell.appendChild(notification); requestAnimationFrame(() => notification.classList.add('show')); setTimeout(() => { notification.classList.remove('show'); setTimeout(() => notification.remove(), 300); }, duration); }
    let loadingTimeout; function showLoadingIndicator(show) { clearTimeout(loadingTimeout); let indicator = document.getElementById('appLoadingIndicator'); if (show) { if (!indicator) { indicator = document.createElement('div'); indicator.id = 'appLoadingIndicator'; indicator.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Carregando...'; indicator.style.cssText = 'position:fixed; top:10px; right:10px; background:rgba(0,0,0,0.7); color:white; padding:8px 12px; border-radius:6px; z-index:9999; font-size:0.9rem; display:flex; align-items:center; gap:5px;'; appShell.appendChild(indicator); } indicator.style.display = 'flex'; } else { loadingTimeout = setTimeout(() => { if (indicator) indicator.style.display = 'none'; }, 200); } }
    function openGenericModal(config) { /* Sua lógica de modal */ } function closeGenericModal() { /* Sua lógica de modal */ } function renderDashboardChartsUI() { /* Sua lógica de gráficos */ } async function handleToggleSalaAdaptadaDashboard() { /* Sua lógica */ } function renderAlunosTableUI() { /* Sua lógica */ } function openAlunoFormModalUI(alunoIdStr = null) { /* Sua lógica */ } async function handleSaveAlunoData() { /* Sua lógica */ } async function handleDeleteAluno(alunoIdStr) { /* Sua lógica */ } async function openAlunoProfileModalUI(alunoIdStr) { /* Sua lógica */ } function renderProfileIncidentsChartAndListUI(alunoId, chartCanvasId, listUlId) { /* Sua lógica */ } function handlePrintFromProfile(textToPrint){ /* Sua lógica */ } function populateSelectWithOptions(selectElement, items, defaultOptionText, valueKey, textKey, includeAllOption = false) { /* Sua lógica */ } function prepareChamadaUI() { /* Sua lógica */ } function formatTimeDisplay(totalSeconds) { /* Sua lógica */ } function handleSalaSelectChamada() { /* Sua lógica */ } function renderAlunosGridChamada() { /* Sua lógica */ } function togglePresencaAlunoChamada(event) { /* Sua lógica */ } function updateChamadaStatusDisplay() { /* Sua lógica */ } function handleChamadaStart() { /* Sua lógica */ } function handleChamadaEnd() { /* Sua lógica */ } async function handleChamadaGerarRelatorio() { /* Sua lógica */ } function prepareRelatoriosUI() { /* Sua lógica */ } function handleRelatorioTypeChange() { /* Sua lógica */ } function handleGerarRelatorioTela() { /* Sua lógica */ } function prepareConfiguracoesUI() { /* Sua lógica */ } function switchConfigTabUI(tabId) { /* Sua lógica */ } async function handleSaveConfigGeral() { /* Sua lógica */ } function renderConfigSalasTableUI() { /* Sua lógica */ } function openConfigSalaFormModalUI(salaIdStr = null) { /* Sua lógica */ } async function handleConfigSaveSalaData() { /* Sua lógica */ } async function handleConfigDeleteSala(salaIdStr) { /* Sua lógica */ } async function handleConfigBackup() { /* Sua lógica */ } function handleConfigRestore() { /* Sua lógica */ } async function handleConfigReset() { /* Sua lógica */ }
    function setupBaseEventListeners() { mainNavContainer.addEventListener('click', (e) => { const navItem = e.target.closest('.nav-item'); if (navItem && navItem.dataset.section) navigateToSection(navItem.dataset.section); }); if (themeToggleBtnHeader) themeToggleBtnHeader.addEventListener('click', cycleAndSaveTheme); if (adminModeToggleBtnHeader) adminModeToggleBtnHeader.addEventListener('click', toggleAndSaveAdminMode); if (genericModalCloseBtn) genericModalCloseBtn.addEventListener('click', closeGenericModal); if (genericModalOverlay) genericModalOverlay.addEventListener('click', (e) => { if (e.target === genericModalOverlay) closeGenericModal(); }); }
    function setupDynamicEventListeners() { /* Sua lógica de event listeners */ }
    
    // --- INICIAR A APLICAÇÃO ---
    initializeApp(); 
});
