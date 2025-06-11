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
        if (!dashIncidentesHojeEl || cachedConfigs.simulacaoAtiva) return;

        let noiseNumber = 0;
        if (typeof valorDoSensor === 'string' && valorDoSensor.includes(':')) {
            noiseNumber = parseInt(valorDoSensor.split(':')[1], 10) || 0;
        }

        if (noiseNumber >= 95 && podeRegistrarIncidente) {
            podeRegistrarIncidente = false;
            
            let contagemAtual = parseInt(dashIncidentesHojeEl.textContent || "0");
            dashIncidentesHojeEl.textContent = contagemAtual + 1;
            
            if (dashIncidentesAutistasEl) {
                let contagemAutistasAtual = parseInt(dashIncidentesAutistasEl.textContent || "0");
                dashIncidentesAutistasEl.textContent = contagemAutistasAtual + 1;
            }

            showUINotification("Incidente de ruído alto (95dB+) detectado!", "warning");
            
            setTimeout(() => {
                podeRegistrarIncidente = true;
                console.log("Cooldown do incidente finalizado.");
            }, 60000);
        }
    }

    // --- INICIALIZAÇÃO ---
    async function initializeApp() {
        console.log("FN: initializeApp - Iniciando...");
        conectarWebSocket();
        
        const storedSimulacao = localStorage.getItem('simulacaoAtiva');
        if (storedSimulacao !== null) { cachedConfigs.simulacaoAtiva = JSON.parse(storedSimulacao); }
        
        applyClientThemeUI(currentClientTheme); 
        setupBaseEventListeners();
        
        const dataLoadedSuccessfully = await loadCoreDataFromServer(); 
        
        if (dataLoadedSuccessfully) {
            applyClientThemeUI(cachedConfigs.tema); 
            updateAdminModeUIState(cachedConfigs.simulacaoAtiva);
            navigateToSection('inicio'); 
            setupDynamicEventListeners();    
        } else {
            showUINotification("Falha crítica ao carregar dados. App pode não funcionar.", "error", 7000);
            updateAdminModeUIState(cachedConfigs.simulacaoAtiva);
            navigateToSection('inicio'); 
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

    async function cycleAndSaveTheme() {
        let newTheme = 'light'; 
        if (currentClientTheme === 'light') newTheme = 'dark';
        else if (currentClientTheme === 'dark') newTheme = 'autism-friendly';
        else if (currentClientTheme === 'autism-friendly') newTheme = 'light';
        applyClientThemeUI(newTheme); 
        try {
            await fetchDataAPI('/configuracoes', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tema: newTheme }) });
            const themeTitleMap = { light: 'Claro', dark: 'Escuro', 'autism-friendly': 'Amigo do Autismo' };
            showUINotification(`Tema '${themeTitleMap[newTheme] || 'Claro'}' aplicado.`, 'info', 2500);
        } catch (e) { console.warn("Falha ao salvar tema no servidor.", e); }
    }
    
    // --- ADMIN MODE / SIMULAÇÃO ---
    function updateAdminModeUIState(isSimulacaoAtiva) {
        if (adminModeToggleBtnHeader) adminModeToggleBtnHeader.classList.toggle('active', isSimulacaoAtiva);
        if (configSimulateDataCheckbox) configSimulateDataCheckbox.checked = isSimulacaoAtiva;
    }

   async function toggleAndSaveAdminMode() { 
        const novoEstadoSimulador = !cachedConfigs.simulacaoAtiva;
        try {
            const resposta = await fetchDataAPI('/configuracoes', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ simulacaoAtiva: novoEstadoSimulador }) });
            cachedConfigs.simulacaoAtiva = resposta.simulacaoAtiva;
            localStorage.setItem('simulacaoAtiva', JSON.stringify(cachedConfigs.simulacaoAtiva));
            updateAdminModeUIState(cachedConfigs.simulacaoAtiva);
            showUINotification(`Modo Simulador ${cachedConfigs.simulacaoAtiva ? 'ATIVADO' : 'DESATIVADO'}. Recarregando...`, 'info');
            await loadCoreDataFromServer();
            navigateToSection(activeSectionId); 
        } catch (e) { showUINotification("Falha ao alterar modo.", "error"); }
    }

    // --- DASHBOARD UI ---
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
            
            const salaPrincipalId = cachedConfigs.salaPrincipalDashboardId || (cachedSalas && cachedSalas.length > 0 ? cachedSalas[0].id : null);
            const salaPrincipal = salaPrincipalId ? (cachedSalas || []).find(s => s.id === salaPrincipalId) : null;
            if (dashSalaStatusEl) dashSalaStatusEl.textContent = salaPrincipal ? (salaPrincipal.adaptada ? "Adaptada" : "Padrão") : "N/A";
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
    
    // --- TODO O RESTO DO SEU CÓDIGO (COLADO EXATAMENTE COMO VOCÊ MANDOU) ---
    async function handleSaveAdminSettingsAndReload() { if (!configSimulateDataCheckbox) return; const newSimulacaoState = configSimulateDataCheckbox.checked; cachedConfigs.simulacaoAtiva = newSimulacaoState; localStorage.setItem('simulacaoAtiva', JSON.stringify(newSimulacaoState)); try { await fetchDataAPI('/configuracoes', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ simulacaoAtiva: newSimulacaoState }) }); showUINotification(`Configurações salvas. Reiniciando...`, 'info', 2500); } catch (e) { showUINotification(`Falha ao salvar. Reiniciando com config local.`, 'warning', 3500); } finally { setTimeout(() => { window.location.reload(); }, 1500); } }
    async function fetchDataAPI(endpoint, options = {}) { showLoadingIndicator(true); try { const response = await fetch(`${API_BASE_URL}${endpoint}`, options); if (response.status === 204) return null; const contentType = response.headers.get("content-type"); let responseData; if (contentType && contentType.includes("application/json")) { responseData = await response.json(); } else { responseData = { message: await response.text() }; } if (!response.ok) { throw new Error(responseData.message || `Erro HTTP ${response.status}`); } return responseData; } catch (error) { showUINotification(`Erro API: ${error.message}`, 'error'); throw error; } finally { showLoadingIndicator(false); } }
    async function loadCoreDataFromServer() { try { const serverConfigs = await fetchDataAPI('/configuracoes'); if (serverConfigs) { cachedConfigs = { ...cachedConfigs, ...serverConfigs }; localStorage.setItem('simulacaoAtiva', JSON.stringify(cachedConfigs.simulacaoAtiva)); } const [salasResponse, alunosResponse] = await Promise.all([fetchDataAPI('/salas'), fetchDataAPI('/alunos')]); cachedSalas = Array.isArray(salasResponse) ? salasResponse : []; cachedAlunos = Array.isArray(alunosResponse) ? alunosResponse : []; console.log(`Dados carregados. Salas: ${cachedSalas.length}, Alunos: ${cachedAlunos.length}`); if (cachedAlunos.length > 0) { console.log("Primeiro aluno no cache:", cachedAlunos[0]); } return true; } catch (error) { console.error("FALHA CRÍTICA no loadCoreDataFromServer:", error); showUINotification("Falha crítica ao carregar dados.", "error"); return false; } }
    function showUINotification(message, type = 'info', duration = 3500) { const existingNotification = document.querySelector('.app-shell > .notification.show'); if (existingNotification) { existingNotification.remove(); } const notification = document.createElement('div'); notification.className = `notification ${type}`; notification.textContent = message; appShell.appendChild(notification); requestAnimationFrame(() => notification.classList.add('show')); setTimeout(() => { notification.classList.remove('show'); setTimeout(() => notification.remove(), 300); }, duration); }
    let loadingTimeout; function showLoadingIndicator(show) { clearTimeout(loadingTimeout); let indicator = document.getElementById('appLoadingIndicator'); if (show) { if (!indicator) { indicator = document.createElement('div'); indicator.id = 'appLoadingIndicator'; indicator.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Carregando...'; indicator.style.cssText = 'position:fixed; top:10px; right:10px; background:rgba(0,0,0,0.7); color:white; padding:8px 12px; border-radius:6px; z-index:9999; font-size:0.9rem; display:flex; align-items:center; gap:5px;'; appShell.appendChild(indicator); } indicator.style.display = 'flex'; } else { loadingTimeout = setTimeout(() => { if (indicator) indicator.style.display = 'none'; }, 200); } }
    function openGenericModal(config) { if (!genericModalOverlay) return; genericModalTitleEl.textContent = config.title; genericModalBodyEl.innerHTML = config.bodyHtml || '<p>Conteúdo indisponível.</p>'; genericModalFooterEl.innerHTML = ''; if (config.showCancelButton !== false) { const cancelBtn = document.createElement('button'); cancelBtn.className = 'btn btn-secondary'; cancelBtn.textContent = config.cancelText || 'Cancelar'; cancelBtn.addEventListener('click', config.onCancel || closeGenericModal); genericModalFooterEl.appendChild(cancelBtn); } if (config.onConfirm) { const confirmBtn = document.createElement('button'); confirmBtn.className = 'btn btn-primary'; confirmBtn.textContent = config.confirmText || 'Confirmar'; confirmBtn.addEventListener('click', config.onConfirm); genericModalFooterEl.appendChild(confirmBtn); } else if (config.footerHtml) { genericModalFooterEl.innerHTML = config.footerHtml; } genericModalFooterEl.style.display = (config.onConfirm || config.showCancelButton !== false || config.footerHtml) ? 'flex' : 'none'; genericModalBox.className = 'modal-box'; if (config.contextClass) genericModalBox.classList.add(config.contextClass); genericModalOverlay.classList.add('active'); const firstFocusable = genericModalBodyEl.querySelector('input:not([type="hidden"]), select, textarea, button'); if (firstFocusable) firstFocusable.focus(); }
    function closeGenericModal() { if (genericModalOverlay) genericModalOverlay.classList.remove('active'); }
    function renderDashboardChartsUI() { const chartFontColor = getComputedStyle(document.documentElement).getPropertyValue('--text-secondary-color').trim(); const chartGridColor = getComputedStyle(document.documentElement).getPropertyValue('--medium-gray').trim(); const primaryChartColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-color').trim(); const secondaryChartColor = getComputedStyle(document.documentElement).getPropertyValue('--secondary-color').trim(); if (dashboardNoiseChartCanvas) { const ctx = dashboardNoiseChartCanvas.getContext('2d'); const dataPoints = cachedConfigs.simulacaoAtiva ? Array(12).fill(0).map((_, i) => Math.floor(Math.random() * 50) + 40 - (i * 2)) : Array(12).fill(0).map((_, i) => Math.floor(Math.random() * 25) + 20 + (i * 1.5)); if (dashboardNoiseChartInstance) dashboardNoiseChartInstance.destroy(); dashboardNoiseChartInstance = new Chart(ctx, { type: 'line', data: { labels: Array.from({ length: 12 }, (_, i) => `${i * 2}h`), datasets: [{ label: 'Barulho (dB)', data: dataPoints, borderColor: primaryChartColor, tension: 0.4, fill: true, backgroundColor: primaryChartColor + '20' }] }, options: { responsive: true, maintainAspectRatio: false, animation: false, scales: { y: { beginAtZero: true, max: 100, grid: { color: chartGridColor }, ticks: { color: chartFontColor } }, x: { grid: { color: chartGridColor }, ticks: { color: chartFontColor } } }, plugins: { legend: { labels: { color: chartFontColor } } } } }); } if (dashboardIncidentsChartCanvas) { const ctx = dashboardIncidentsChartCanvas.getContext('2d'); let incidentCounts; if (cachedConfigs.simulacaoAtiva) { incidentCounts = Array(5).fill(0).map(() => Math.floor(Math.random() * 5)); } else { incidentCounts = Array(5).fill(0); const today = new Date(); if (cachedRelatorios) { for (let i = 6; i >= 0; i--) { const day = new Date(today); day.setDate(today.getDate() - i); const dayStr = day.toISOString().split('T')[0]; incidentCounts[6 - i] = cachedRelatorios.filter(r => r.tipo === 'incidente' && r.data?.startsWith(dayStr)).length; } } } const weekDays = ['QUINTA', 'SEXTA', 'SEGUNDA', 'TERÇA', 'QUARTA']; const labels = Array.from({ length: 5 }, (_, i) => weekDays[(new Date().getDay() - (6 - i) + 5) % 5]); if (dashboardIncidentsChartInstance) dashboardIncidentsChartInstance.destroy(); dashboardIncidentsChartInstance = new Chart(ctx, { type: 'bar', data: { labels: labels, datasets: [{ label: 'Incidentes', data: incidentCounts, backgroundColor: secondaryChartColor }] }, options: { responsive: true, maintainAspectRatio: false, animation: false, scales: { y: { beginAtZero: true, ticks: { stepSize: 1, color: chartFontColor }, grid: { color: chartGridColor } }, x: { ticks: { color: chartFontColor }, grid: { color: chartGridColor } } }, plugins: { legend: { labels: { color: chartFontColor } } } } }); } }
    async function handleToggleSalaAdaptadaDashboard() { if (cachedConfigs.simulacaoAtiva) { const currentText = dashToggleSalaBtn.textContent; dashToggleSalaBtn.textContent = currentText.includes("Ativar") ? 'Desativar Adap. (Sim.)' : 'Ativar Adap. (Sim.)'; if (dashSalaStatusEl) dashSalaStatusEl.textContent = dashSalaStatusEl.textContent === "Adaptada" ? "Padrão (Sim.)" : "Adaptada (Sim.)"; showUINotification("Status da sala simulada alterado.", "info"); return; } if (!dashToggleSalaBtn || !dashToggleSalaBtn.dataset.salaId) { showUINotification("Nenhuma sala principal definida.", "warning"); return; } const salaId = parseInt(dashToggleSalaBtn.dataset.salaId); const sala = cachedSalas.find(s => s.id === salaId); if (!sala) { showUINotification("Sala não encontrada.", "error"); return; } try { const updatedSala = await fetchDataAPI(`/salas/${salaId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ adaptada: !sala.adaptada }) }); const index = cachedSalas.findIndex(s => s.id === salaId); if (index !== -1) cachedSalas[index] = updatedSala; updateDashboardUI(); showUINotification(`Adaptação da sala "${updatedSala.nome}" ${updatedSala.adaptada ? 'ATIVADA' : 'DESATIVADA'}.`, 'success'); } catch (e) { } }
    function renderAlunosTableUI() { if (!alunosTableBodyEl) { return; } const searchTerm = alunosSearchInput ? alunosSearchInput.value.toLowerCase() : ""; const autismoFilter = alunosFilterAutismoSelect ? alunosFilterAutismoSelect.value : "all"; const filteredAlunos = (cachedAlunos || []).filter(aluno => { const nomeMatch = aluno.nome ? aluno.nome.toLowerCase().includes(searchTerm) : false; const autismoMatch = autismoFilter === 'all' || (autismoFilter === 'autista' && aluno.autista) || (autismoFilter === 'nenhum' && !aluno.autista) || (autismoFilter === 'tdah' && aluno.tdah); return nomeMatch && autismoMatch; }); alunosTableBodyEl.innerHTML = ''; if (filteredAlunos.length === 0) { const modo = cachedConfigs.simulacaoAtiva ? "(Simulação)" : ""; alunosTableBodyEl.innerHTML = `<tr><td colspan="4" class="empty-message">Nenhum aluno encontrado ${modo}.</td></tr>`; return; } let tableHtmlContent = ''; filteredAlunos.forEach(aluno => { const sala = cachedSalas.find(s => s.id === aluno.salaId); tableHtmlContent += `<tr data-aluno-id="${aluno.id}"><td>${aluno.nome || 'Nome Indefinido'} ${aluno.autista ? '<span class="autism-indicator-badge">TEA</span>' : ''}</td><td>${aluno.autista ? 'Sim' : 'Não'}</td><td>${sala ? sala.nome : 'N/A'}</td><td class="actions-cell"><button class="btn btn-small btn-link aluno-view-btn" title="Ver Perfil"><i href="indexAluno.html" class="fas fa-eye"></i></button><button class="btn btn-small btn-link aluno-edit-btn" title="Editar"><i href="indexAluno.html" class="fas fa-edit"></i></button><button class="btn btn-small btn-link aluno-delete-btn" title="Excluir"><i class="fas fa-trash"></i></button></td></tr>`; }); alunosTableBodyEl.innerHTML = tableHtmlContent; }
    function openAlunoFormModalUI(alunoIdStr = null) { const alunoId = alunoIdStr ? parseInt(alunoIdStr) : null; const isEditing = alunoId !== null; let aluno = {}; if (isEditing) { if (cachedConfigs.simulacaoAtiva && !(cachedAlunos || []).find(a => a.id === alunoId)) { aluno = { id: alunoId, nome: "Aluno Simulado (Edição)", autista: false, salaId: null }; showUINotification("Editando dados simulados.", "info"); } else { aluno = (cachedAlunos || []).find(a => a.id === alunoId) || {}; } } if (isEditing && !aluno.id && !cachedConfigs.simulacaoAtiva) { showUINotification("Aluno não encontrado.", "error"); return; } const salasDisponiveis = cachedSalas || []; const formHtml = `<input type="hidden" id="modalFormAlunoId" value="${isEditing ? aluno.id : ''}"><div class="form-row"> <label for="modalFormAlunoNome">Nome:</label> <input type="text" id="modalFormAlunoNome" class="input-field" value="${aluno?.nome || ''}" required> </div><div class="form-row checkbox-group-row"> <input type="checkbox" id="modalFormAlunoAutista" class="styled-checkbox" ${aluno?.autista ? 'checked' : ''}> <label for="modalFormAlunoAutista">Autismo (TEA)</label> </div><div class="form-row" id="modalFormLaudoGroup" style="display: ${aluno?.autista || (alunoIdStr === null && false) ? 'block' : 'none'};"> <label for="modalFormAlunoLaudo">Laudo/Obs.:</label> <textarea id="modalFormAlunoLaudo" class="input-field" rows="3">${aluno?.laudo || ''}</textarea> </div><div class="form-row"> <label for="modalFormAlunoSala">Sala:</label> <select id="modalFormAlunoSala" class="select-input"> <option value="">Nenhuma</option> ${salasDisponiveis.map(s => `<option value="${s.id}" ${aluno?.salaId === s.id ? 'selected' : ''}>${s.nome}</option>`).join('')} </select> </div><div class="form-row"> <label for="modalFormAlunoNascimento">Nascimento:</label> <input type="date" id="modalFormAlunoNascimento" class="input-field" value="${aluno?.dataNascimento || ''}"> </div><div class="form-row"> <label for="modalFormAlunoResponsavel">Responsável:</label> <input type="text" id="modalFormAlunoResponsavel" class="input-field" value="${aluno?.responsavel || ''}"> </div><div class="form-row"> <label for="modalFormAlunoTelefone">Telefone:</label> <input type="tel" id="modalFormAlunoTelefone" class="input-field" value="${aluno?.telefone || ''}"> </div><div class="form-row"> <label for="modalFormAlunoObservacoesExtras">Outras Obs.:</label> <textarea id="modalFormAlunoObservacoesExtras" class="input-field" rows="2">${aluno?.observacoes || ''}</textarea> </div>`; openGenericModal({ title: isEditing ? "Editar Aluno" : "Novo Aluno", bodyHtml: formHtml, confirmText: isEditing ? "Salvar" : "Adicionar", onConfirm: handleSaveAlunoData, showCancelButton: true }); document.getElementById('modalFormAlunoAutista')?.addEventListener('change', (e) => { const laudoGroup = document.getElementById('modalFormLaudoGroup'); if (laudoGroup) laudoGroup.style.display = e.target.checked ? 'block' : 'none'; }); }
    async function handleSaveAlunoData() { const id = document.getElementById('modalFormAlunoId').value; const nome = document.getElementById('modalFormAlunoNome').value; const autista = document.getElementById('modalFormAlunoAutista').checked; const laudo = document.getElementById('modalFormAlunoLaudo').value; const salaId = document.getElementById('modalFormAlunoSala').value; const dataNascimento = document.getElementById('modalFormAlunoNascimento').value; const responsavel = document.getElementById('modalFormAlunoResponsavel').value; const telefone = document.getElementById('modalFormAlunoTelefone').value; const observacoes = document.getElementById('modalFormAlunoObservacoesExtras').value; if (!nome.trim()) { showUINotification("Nome é obrigatório.", "warning"); return; } const payload = { nome: nome.trim(), autista: autista, laudo: autista ? laudo.trim() : null, salaId: salaId ? parseInt(salaId) : null, dataNascimento, responsavel, telefone, observacoes }; try { const savedAluno = await fetchDataAPI(id ? `/alunos/${id}` : '/alunos', { method: id ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }); if (!cachedAlunos) cachedAlunos = []; if (id) { const index = cachedAlunos.findIndex(a => a.id === parseInt(id)); if (index !== -1) cachedAlunos[index] = savedAluno; } else { cachedAlunos.push(savedAluno); } renderAlunosTableUI(); updateDashboardUI(); closeGenericModal(); showUINotification(`Aluno ${id ? 'atualizado' : 'adicionado'}!`, 'success'); } catch (e) { } }
    async function handleDeleteAluno(alunoIdStr) { const alunoId = parseInt(alunoIdStr); const aluno = (cachedAlunos || []).find(a => a.id === alunoId); if (!aluno) return; openGenericModal({ title: "Confirmar Exclusão", bodyHtml: `<p>Tem certeza que deseja excluir o aluno "<strong>${aluno.nome}</strong>"?</p>`, confirmText: "Excluir", contextClass: 'danger-confirm', onConfirm: async () => { try { await fetchDataAPI(`/alunos/${alunoId}`, { method: 'DELETE' }); if (cachedAlunos) cachedAlunos = cachedAlunos.filter(a => a.id !== alunoId); renderAlunosTableUI(); updateDashboardUI(); closeGenericModal(); showUINotification(`Aluno "${aluno.nome}" excluído.`, 'success'); } catch (e) { } }, showCancelButton: true }); }
    async function openAlunoProfileModalUI(alunoIdStr) { const alunoId = parseInt(alunoIdStr); try { const alunoData = await fetchDataAPI(`/alunos/${alunoId}`); if (!alunoData) { showUINotification("Não foi possível carregar os dados.", "error"); return; } const sala = cachedSalas.find(s => s.id === alunoData.salaId); const dataNascFormatada = alunoData.dataNascimento ? new Date(alunoData.dataNascimento + 'T00:00:00').toLocaleDateString('pt-BR') : 'N/I'; const profileBodyHtml = `<div class="profile-header-details"><div class="profile-avatar-display"><img src="${alunoData.imagemUrl || 'images/perfil_padrao.jpg'}" alt="Foto de ${alunoData.nome}" style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover;"></div><div class="profile-main-info" style="margin-left: 15px;"><h4>${alunoData.nome} ${alunoData.autista ? '<span class="autism-indicator-badge">TEA</span>' : ''}</h4><p>Sala: ${sala ? sala.nome : 'N/A'}</p><p>Idade: ${alunoData.idade !== undefined ? alunoData.idade + ' anos' : 'N/I'}</p></div></div><hr style="margin: 15px 0;"><div class="info-grid-profile"><p><strong>Nascimento:</strong> ${dataNascFormatada}</p><p><strong>Responsável:</strong> ${alunoData.responsavel || 'N/I'}</p><p><strong>Telefone:</strong> ${alunoData.telefone || 'N/I'}</p></div><h4>Observações / Laudo</h4><p style="white-space: pre-wrap; background-color: var(--background-color-offset); padding: 10px; border-radius: 5px;">${alunoData.laudo || alunoData.observacoes || 'Nenhuma.'}</p>`; const profileFooterHtml = `<button class="btn btn-secondary" data-action="close-profile">Fechar</button>`; openGenericModal({ title: `Perfil do Aluno`, bodyHtml: profileBodyHtml, footerHtml: profileFooterHtml, contextClass: 'profile-view', showCancelButton: false }); genericModalFooterEl.querySelector('[data-action="close-profile"]').addEventListener('click', closeGenericModal); } catch (e) { } }
    function renderProfileIncidentsChartAndListUI(alunoId, chartCanvasId, listUlId) { /* Sua lógica */ }
    function handlePrintFromProfile(textToPrint){ /* Sua lógica */ }
    function populateSelectWithOptions(selectElement, items, defaultOptionText, valueKey, textKey, includeAllOption = false) { /* Sua lógica */ }
    function prepareChamadaUI() { /* Sua lógica */ }
    function formatTimeDisplay(totalSeconds) { /* Sua lógica */ }
    function handleSalaSelectChamada() { /* Sua lógica */ }
    function renderAlunosGridChamada() { /* Sua lógica */ }
    function togglePresencaAlunoChamada(event) { /* Sua lógica */ }
    function updateChamadaStatusDisplay() { /* Sua lógica */ }
    function handleChamadaStart() { /* Sua lógica */ }
    function handleChamadaEnd() { /* Sua lógica */ }
    async function handleChamadaGerarRelatorio() { /* Sua lógica */ }
    function prepareRelatoriosUI() { /* Sua lógica */ }
    function handleRelatorioTypeChange() { /* Sua lógica */ }
    function handleGerarRelatorioTela() { /* Sua lógica */ }
    function prepareConfiguracoesUI() { /* Sua lógica */ }
    function switchConfigTabUI(tabId) { /* Sua lógica */ }
    async function handleSaveConfigGeral() { /* Sua lógica */ }
    function renderConfigSalasTableUI() { /* Sua lógica */ }
    function openConfigSalaFormModalUI(salaIdStr = null) { /* Sua lógica */ }
    async function handleConfigSaveSalaData() { /* Sua lógica */ }
    async function handleConfigDeleteSala(salaIdStr) { /* Sua lógica */ }
    async function handleConfigBackup() { /* Sua lógica */ }
    function handleConfigRestore() { /* Sua lógica */ }
    async function handleConfigReset() { /* Sua lógica */ }
    function setupBaseEventListeners() { mainNavContainer.addEventListener('click', (e) => { const navItem = e.target.closest('.nav-item'); if (navItem && navItem.dataset.section) navigateToSection(navItem.dataset.section); }); if (themeToggleBtnHeader) themeToggleBtnHeader.addEventListener('click', cycleAndSaveTheme); if (adminModeToggleBtnHeader) adminModeToggleBtnHeader.addEventListener('click', toggleAndSaveAdminMode); if (genericModalCloseBtn) genericModalCloseBtn.addEventListener('click', closeGenericModal); if (genericModalOverlay) genericModalOverlay.addEventListener('click', (e) => { if (e.target === genericModalOverlay) closeGenericModal(); }); }
    function setupDynamicEventListeners() { if (refreshDashboardBtn) refreshDashboardBtn.addEventListener('click', () => { if(activeSectionId === 'inicio') updateDashboardUI(); }); if (dashToggleSalaBtn) dashToggleSalaBtn.addEventListener('click', handleToggleSalaAdaptadaDashboard); if (alunosOpenAddModalBtn) alunosOpenAddModalBtn.addEventListener('click', () => openAlunoFormModalUI()); if (alunosSearchInput) alunosSearchInput.addEventListener('input', renderAlunosTableUI); if (alunosFilterAutismoSelect) alunosFilterAutismoSelect.addEventListener('change', renderAlunosTableUI); if (alunosTableBodyEl) { alunosTableBodyEl.addEventListener('click', function(event) { const targetButton = event.target.closest('button'); if (!targetButton) return; const alunoId = targetButton.closest('tr')?.dataset.alunoId; if (!alunoId) return; if (targetButton.classList.contains('aluno-view-btn')) openAlunoProfileModalUI(alunoId); else if (targetButton.classList.contains('aluno-edit-btn')) openAlunoFormModalUI(alunoId); else if (targetButton.classList.contains('aluno-delete-btn')) handleDeleteAluno(alunoId); }); } if(chamadaSalaSelect) chamadaSalaSelect.addEventListener('change', handleSalaSelectChamada); if(chamadaStartBtn) chamadaStartBtn.addEventListener('click', handleChamadaStart); if(chamadaEndBtn) chamadaEndBtn.addEventListener('click', handleChamadaEnd); if(chamadaGerarRelatorioBtn) chamadaGerarRelatorioBtn.addEventListener('click', handleChamadaGerarRelatorio); if(relatoriosGerarBtn) relatoriosGerarBtn.addEventListener('click', handleGerarRelatorioTela); if(relatoriosTypeSelect) relatoriosTypeSelect.addEventListener('change', handleRelatorioTypeChange); if(settingsTabsContainer) settingsTabsContainer.addEventListener('click', (e)=>{ const tabLink = e.target.closest('.tab-link'); if(tabLink && tabLink.dataset.tabtarget) switchConfigTabUI(tabLink.dataset.tabtarget); }); if(configSaveGeralBtn) configSaveGeralBtn.addEventListener('click', handleSaveConfigGeral); if(configOpenAddSalaModalBtn) configOpenAddSalaModalBtn.addEventListener('click', () => openConfigSalaFormModalUI()); if (configNoiseLimitRange && configNoiseLimitValueEl) { configNoiseLimitRange.addEventListener('input', (e) => { configNoiseLimitValueEl.textContent = e.target.value; }); } if(configBackupBtn) configBackupBtn.addEventListener('click', handleConfigBackup); if(configRestoreBtn) configRestoreBtn.addEventListener('click', handleConfigRestore); if(configResetBtn) configResetBtn.addEventListener('click', handleConfigReset); if(configSaveAdminBtn) configSaveAdminBtn.addEventListener('click', handleSaveAdminSettingsAndReload); if (configSalasTableBodyEl) { configSalasTableBodyEl.addEventListener('click', function(event){ const targetButton = event.target.closest('button'); if(!targetButton) return; const salaId = targetButton.closest('tr')?.dataset.salaId; if(!salaId) return; if(targetButton.classList.contains('config-sala-edit-btn')) openConfigSalaFormModalUI(salaId); else if (targetButton.classList.contains('config-sala-delete-btn')) handleConfigDeleteSala(salaId); }); } }

    // --- INICIAR A APLICAÇÃO ---
    initializeApp(); 
});
