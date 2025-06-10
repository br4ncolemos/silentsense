document.addEventListener('DOMContentLoaded', function () {
    console.log("Silent Sense APP (Novo Design V4) DOM Carregado - Iniciando Script...");

    // --- CONFIGURAÇÕES GLOBAIS ---
    const API_BASE_URL = 'http://localhost:3000/api'; // AJUSTE SE NECESSÁRIO
    let currentClientTheme = localStorage.getItem('appTheme') || 'light';

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

    // --- ESTADO DA APLICAÇÃO ---
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
        simulacaoAtiva: false, 
        salaPrincipalDashboardId: null 
    };

    let dashboardNoiseChartInstance, dashboardIncidentsChartInstance, profileAlunoIncidentsChartInstance;

    // --- INICIALIZAÇÃO ---
    async function initializeApp() {
        console.log("FN: initializeApp - Iniciando...");
        
        const storedSimulacao = localStorage.getItem('simulacaoAtiva');
        if (storedSimulacao !== null) {
            cachedConfigs.simulacaoAtiva = JSON.parse(storedSimulacao);
            console.log("Simulação carregada do localStorage para cachedConfigs:", cachedConfigs.simulacaoAtiva);
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
        console.log("App Inicializado. Configs Finais:", cachedConfigs);
    }

    // --- LÓGICA DE NAVEGAÇÃO ---
    function navigateToSection(sectionId) {
        if (!sectionId || !document.getElementById(sectionId)) {
            sectionId = 'inicio';
        }
        activeSectionId = sectionId;
        console.log("FN: navigateToSection ->", sectionId);

        contentSections.forEach(section => section.classList.remove('active'));
        document.getElementById(sectionId)?.classList.add('active');

        mainNavContainer.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.section === sectionId);
        });

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
            default: console.warn("Nenhuma ação UI definida para seção:", sectionId);
        }
    }

    // --- MANIPULAÇÃO DE TEMA ---
    function applyClientThemeUI(themeName) {
        console.log("FN: applyClientThemeUI -> Aplicando tema:", themeName);
        document.body.className = ''; 
        
        if (themeName && themeName !== 'light') {
            document.body.classList.add(themeName + '-theme');
        }
        
        currentClientTheme = themeName; 
        localStorage.setItem('appTheme', themeName); 

        if (themeToggleBtnHeader) {
            const iconMap = { 
                light: 'fa-moon', 
                dark: 'fa-sun', 
                'autism-friendly': 'fa-hand-sparkles'
            };
            const themeTitleMap = {
                light: 'Claro',
                dark: 'Escuro',
                'autism-friendly': 'Tema Autismo'
            };
            themeToggleBtnHeader.innerHTML = `<i class="fas ${iconMap[themeName] || 'fa-moon'}"></i>`;
            themeToggleBtnHeader.title = `Tema: ${themeTitleMap[themeName] || 'Claro'}`;
        }

        if(configThemeSelect) {
            configThemeSelect.value = themeName;
        }

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
            const updatedConfigsFromServer = await fetchDataAPI('/configuracoes', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tema: newTheme }) 
            });
            
            if (updatedConfigsFromServer && typeof updatedConfigsFromServer.tema !== 'undefined') {
                cachedConfigs.tema = updatedConfigsFromServer.tema;
            } else {
                cachedConfigs.tema = newTheme;
            }
            console.log("Tema salvo no servidor via cycleAndSaveTheme:", cachedConfigs.tema);
            const themeTitleMap = { light: 'Claro', dark: 'Escuro', 'autism-friendly': 'Amigo do Autismo' };
            showUINotification(`Tema '${themeTitleMap[cachedConfigs.tema] || 'Claro'}' aplicado.`, 'info', 2500);

        } catch (e) { 
            console.warn("Falha ao salvar tema no servidor (ciclo). Alteração visual mantida localmente.", e);
        }
    }
    
    // --- ADMIN MODE / SIMULAÇÃO ---
    function updateAdminModeUIState(isSimulacaoAtiva) {
        console.log("FN: updateAdminModeUIState -> Simulação Ativa:", isSimulacaoAtiva);
        if (adminModeToggleBtnHeader) adminModeToggleBtnHeader.classList.toggle('active', isSimulacaoAtiva);
        if (configSimulateDataCheckbox) configSimulateDataCheckbox.checked = isSimulacaoAtiva;
    }

   async function toggleAndSaveAdminMode() { 
    const novoEstadoSimulador = !cachedConfigs.simulacaoAtiva;
    console.log("Frontend: Tentando alterar modo simulador para", novoEstadoSimulador);

    try {
        // Agora esta chamada vai funcionar porque a rota PUT /api/configuracoes existe!
        const resposta = await fetchDataAPI('/configuracoes', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ simulacaoAtiva: novoEstadoSimulador }) 
        });

        cachedConfigs.simulacaoAtiva = resposta.simulacaoAtiva;
        localStorage.setItem('simulacaoAtiva', JSON.stringify(cachedConfigs.simulacaoAtiva));

        updateAdminModeUIState(cachedConfigs.simulacaoAtiva);
        showUINotification(`Modo Simulador ${cachedConfigs.simulacaoAtiva ? 'ATIVADO' : 'DESATIVADO'}. Recarregando dados...`, 'info');
        
        await loadCoreDataFromServer();
        navigateToSection(activeSectionId); 

    } catch (e) {
        showUINotification("Falha ao alterar modo no servidor.", "error");
        console.error("Erro em toggleAndSaveAdminMode:", e);
    }
}

    async function handleSaveAdminSettingsAndReload() { 
        if (!configSimulateDataCheckbox) return;

        const newSimulacaoState = configSimulateDataCheckbox.checked;
        console.log("FN: handleSaveAdminSettingsAndReload -> Estado para salvar e recarregar:", newSimulacaoState);

        cachedConfigs.simulacaoAtiva = newSimulacaoState;
        localStorage.setItem('simulacaoAtiva', JSON.stringify(newSimulacaoState));

        try {
            await fetchDataAPI('/configuracoes', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ simulacaoAtiva: newSimulacaoState })
            });
            showUINotification(`Configurações de Admin salvas. Reiniciando com simulação ${newSimulacaoState ? 'ATIVADA' : 'DESATIVADA'}.`, 'info', 2500);
        } catch (e) {
            showUINotification(`Falha ao salvar no servidor. Reiniciando com configuração local (simulação ${newSimulacaoState ? 'ATIVADA' : 'DESATIVADA'}).`, 'warning', 3500);
        } finally {
            setTimeout(() => {
                window.location.reload();
            }, 1500); 
        }
    }


    // --- CHAMADAS DE API (fetchDataAPI) ---
    async function fetchDataAPI(endpoint, options = {}) {
        showLoadingIndicator(true);
        try {
            console.log(`API Request: ${options.method || 'GET'} ${API_BASE_URL}${endpoint}`);
            const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
            if (response.status === 204) return null; 
            
            const contentType = response.headers.get("content-type");
            let responseData;
            if (contentType && contentType.includes("application/json")) {
                responseData = await response.json();
            } else {
                responseData = { message: await response.text() }; 
            }

            if (!response.ok) {
                console.error(`API Error ${response.status} for ${endpoint}:`, responseData);
                throw new Error(responseData.message || `Erro HTTP ${response.status}`);
            }
            console.log(`API Success for ${endpoint}:`, responseData);
            return responseData;
        } catch (error) {
            console.error(`Falha ao buscar ${endpoint}:`, error.message, error);
            showUINotification(`Erro API: ${error.message}`, 'error');
            throw error; 
        } finally {
            showLoadingIndicator(false);
        }
    }

    // --- CARREGAMENTO DE DADOS E CACHE ---
    // Dentro do seu public/script.js

async function loadCoreDataFromServer() {
    console.log("FN: Iniciando loadCoreDataFromServer...");
    try {
        // Passo 1: Busca as configurações do servidor para saber o estado do simulador
        const serverConfigs = await fetchDataAPI('/configuracoes');
        if (serverConfigs) {
            cachedConfigs = { ...cachedConfigs, ...serverConfigs };
            localStorage.setItem('simulacaoAtiva', JSON.stringify(cachedConfigs.simulacaoAtiva));
            console.log("Configurações carregadas. Modo Simulador:", cachedConfigs.simulacaoAtiva);
        } else {
            console.warn("Não foi possível carregar as configurações do servidor.");
        }
        
        // Passo 2: Busca a lista de salas e a lista de alunos em paralelo
        // A rota /api/alunos no backend já sabe qual arquivo JSON retornar
        const [salasResponse, alunosResponse] = await Promise.all([
            fetchDataAPI('/salas'),
            fetchDataAPI('/alunos') // Esta chamada agora é inteligente
        ]);

        // Passo 3: Atribui os arrays COMPLETOS para as variáveis de cache
        // Verificamos se a resposta é um array antes de atribuir
        cachedSalas = Array.isArray(salasResponse) ? salasResponse : [];
        cachedAlunos = Array.isArray(alunosResponse) ? alunosResponse : [];
        
        // --- PONTO DE DIAGNÓSTICO CRÍTICO ---
        console.log(`Dados carregados. Total de SALAS em cache: ${cachedSalas.length}`);
        console.log(`Dados carregados. Total de ALUNOS em cache: ${cachedAlunos.length}`);
        
        // Se o número de alunos aqui for maior que 1, o problema não está no carregamento.
        // Se for 1, o problema está na resposta da API.
        if (cachedAlunos.length > 0) {
            console.log("Primeiro aluno no cache:", cachedAlunos[0]);
        }
        
        return true; 
    } catch (error) {
        console.error("FALHA CRÍTICA no loadCoreDataFromServer:", error);
        showUINotification("Falha crítica ao carregar dados. App pode não funcionar.", "error");
        return false; 
    }
}
    
    // --- UI HELPERS ---
    function showUINotification(message, type = 'info', duration = 3500) {
        const existingNotification = document.querySelector('.app-shell > .notification.show');
        if (existingNotification) {
            existingNotification.classList.remove('show');
            setTimeout(() => existingNotification.remove(), 300);
        }
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        appShell.appendChild(notification); 
        requestAnimationFrame(() => notification.classList.add('show'));
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, duration);
    }
    let loadingTimeout;
    function showLoadingIndicator(show) {
        clearTimeout(loadingTimeout);
        const indicatorId = 'appLoadingIndicator';
        let indicator = document.getElementById(indicatorId);
        if (show) {
            if (!indicator) {
                indicator = document.createElement('div');
                indicator.id = indicatorId;
                indicator.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Carregando...';
                indicator.style.cssText = 'position:fixed; top:10px; right:10px; background:rgba(0,0,0,0.7); color:white; padding:8px 12px; border-radius:6px; z-index:9999; font-size:0.9rem; display:flex; align-items:center; gap:5px;';
                appShell.appendChild(indicator);
            }
            indicator.style.display = 'flex';
        } else {
            loadingTimeout = setTimeout(() => {
                if (indicator) indicator.style.display = 'none';
            }, 200); 
        }
    }
    function openGenericModal(config) {
        console.log("FN: openGenericModal -> Título:", config.title);
        if (!genericModalOverlay || !genericModalTitleEl || !genericModalBodyEl || !genericModalFooterEl) {
            console.error("Elementos do modal genérico não encontrados!");
            return;
        }
        genericModalTitleEl.textContent = config.title;
        genericModalBodyEl.innerHTML = config.bodyHtml || '<p>Conteúdo indisponível.</p>';
        
        genericModalFooterEl.innerHTML = ''; 
        if (config.showCancelButton !== false) { 
            const cancelBtn = document.createElement('button');
            cancelBtn.className = 'btn btn-secondary';
            cancelBtn.textContent = config.cancelText || 'Cancelar';
            cancelBtn.addEventListener('click', config.onCancel || closeGenericModal);
            genericModalFooterEl.appendChild(cancelBtn);
        }
        if (config.onConfirm) {
            const confirmBtn = document.createElement('button');
            confirmBtn.className = 'btn btn-primary';
            confirmBtn.textContent = config.confirmText || 'Confirmar';
            confirmBtn.addEventListener('click', config.onConfirm);
            genericModalFooterEl.appendChild(confirmBtn);
        } else if (config.footerHtml) { 
             genericModalFooterEl.innerHTML = config.footerHtml;
        }

        genericModalFooterEl.style.display = (config.onConfirm || config.showCancelButton !== false || config.footerHtml) ? 'flex' : 'none';

        genericModalBox.className = 'modal-box'; 
        if (config.contextClass) genericModalBox.classList.add(config.contextClass);
        genericModalOverlay.classList.add('active');
        const firstFocusable = genericModalBodyEl.querySelector('input:not([type="hidden"]):not(:disabled), textarea:not(:disabled), select:not(:disabled), button:not(:disabled)');
        if (firstFocusable) firstFocusable.focus();
    }
    function closeGenericModal() {
        console.log("FN: closeGenericModal");
        if (genericModalOverlay) genericModalOverlay.classList.remove('active');
        if (genericModalBodyEl) genericModalBodyEl.innerHTML = ''; 
        if (genericModalBox) genericModalBox.className = 'modal-box'; 
    }

     // --- DASHBOARD (INÍCIO) ---
    function updateDashboardUI() {
        if (activeSectionId !== 'inicio' || !dashTotalAlunosEl) return;
        console.log("FN: updateDashboardUI. Usando Simulação:", cachedConfigs.simulacaoAtiva);

        // ===================================================================
        // PASSO 1: CALCULAR CONTAGENS PRIMEIRO - Válido para ambos os modos
        // ===================================================================
        const alunosCount = cachedAlunos ? cachedAlunos.length : 0;
        const alunosAutistasCount = cachedAlunos ? cachedAlunos.filter(a => a.autista).length : 0;

        // ===================================================================
        // PASSO 2: ATUALIZAR OS CARDS DE ALUNOS COM OS DADOS REAIS
        // ===================================================================
        if (dashTotalAlunosEl) dashTotalAlunosEl.textContent = alunosCount;
        if (dashAlunosAutistasEl) dashAlunosAutistasEl.textContent = alunosAutistasCount;


        // ===================================================================
        // PASSO 3: ATUALIZAR O RESTO DA DASHBOARD COM BASE NO MODO
        // ===================================================================
        if (cachedConfigs.simulacaoAtiva) {
            // MODO SIMULAÇÃO: Usa os dados reais de alunos que já calculamos,
            // e simula o resto (ruído, incidentes).
            
            const currentNoise = Math.floor(Math.random() * 70) + 30;
            if (dashNoiseLevelBarEl) dashNoiseLevelBarEl.style.width = `${Math.min(100, currentNoise)}%`;
            if (dashNoiseValueEl) dashNoiseValueEl.textContent = `${currentNoise} dB`;
            if (dashMaxNoiseEl && currentNoise > parseInt(dashMaxNoiseEl.textContent || "0")) dashMaxNoiseEl.textContent = currentNoise;
            if (dashIncidentesHojeEl) dashIncidentesHojeEl.textContent = Math.floor(Math.random() * 3);
            if (dashIncidentesAutistasEl) dashIncidentesAutistasEl.textContent = Math.floor(Math.random() * 2);
            if (dashSalaStatusEl) dashSalaStatusEl.textContent = "Simulada"; // Mais claro para o usuário
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

            const hojeStr = new Date().toISOString().split('T')[0];
            const incidentesDeHoje = cachedRelatorios ? cachedRelatorios.filter(r => r.tipo === 'incidente' && r.data?.startsWith(hojeStr)) : [];
            if (dashIncidentesHojeEl) dashIncidentesHojeEl.textContent = incidentesDeHoje.length;

            const incidentesAutistasHojeCount = cachedAlunos ? incidentesDeHoje.filter(r => cachedAlunos.find(a => a.id === r.conteudo?.alunoId)?.autista).length : 0;
            if (dashIncidentesAutistasEl) dashIncidentesAutistasEl.textContent = incidentesAutistasHojeCount;

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
    function renderDashboardChartsUI() {
        console.log("FN: renderDashboardChartsUI. Simulação Ativa:", cachedConfigs.simulacaoAtiva);
        const chartFontColor = getComputedStyle(document.documentElement).getPropertyValue('--text-secondary-color').trim();
        const chartGridColor = getComputedStyle(document.documentElement).getPropertyValue('--medium-gray').trim();
        const primaryChartColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-color').trim();
        const secondaryChartColor = getComputedStyle(document.documentElement).getPropertyValue('--secondary-color').trim();

        if (dashboardNoiseChartCanvas) {
            const ctx = dashboardNoiseChartCanvas.getContext('2d');
            const dataPoints = cachedConfigs.simulacaoAtiva ? Array(12).fill(0).map((_,i) => Math.floor(Math.random() * 50) + 40 - (i*2) ) : Array(12).fill(0).map((_,i) => Math.floor(Math.random() * 25) + 20 + (i*1.5));
            if (dashboardNoiseChartInstance) dashboardNoiseChartInstance.destroy();
            dashboardNoiseChartInstance = new Chart(ctx, { 
                 type: 'line', 
                 data: { 
                     labels: Array.from({length:12}, (_,i) => `${i*2}h`), 
                     datasets: [{ 
                         label: 'Barulho (dB)', 
                         data: dataPoints, 
                         borderColor: primaryChartColor, 
                         tension: 0.4, 
                         fill: true, 
                         backgroundColor: primaryChartColor + '20' 
                        }] 
                    },
                options: { 
                    responsive: true, maintainAspectRatio: false, animation: false, 
                    scales: { 
                        y: { beginAtZero: true, max: 100, grid: { color: chartGridColor }, ticks: { color: chartFontColor } },
                        x: { grid: { color: chartGridColor }, ticks: { color: chartFontColor } }
                    },
                    plugins: { legend: { labels: { color: chartFontColor } } }
                }
            });
        }
        if (dashboardIncidentsChartCanvas) {
            const ctx = dashboardIncidentsChartCanvas.getContext('2d');
            let incidentCounts;
            if(cachedConfigs.simulacaoAtiva){
                incidentCounts = Array(5).fill(0).map(() => Math.floor(Math.random() * 5));
            } else {
                incidentCounts = Array(5).fill(0); 
                const today = new Date();
                if (cachedRelatorios) { 
                    for (let i = 6; i >= 0; i--) {
                        const day = new Date(today); day.setDate(today.getDate() - i); const dayStr = day.toISOString().split('T')[0];
                        incidentCounts[6-i] = cachedRelatorios.filter(r => r.tipo === 'incidente' && r.data?.startsWith(dayStr)).length;
                    }
                }
            }
            const weekDays = ['QUINTA', 'SEXTA', 'SEGUNDA', 'TERÇA', 'QUARTA']; 
            const labels = Array.from({length:5}, (_,i) => weekDays[ (new Date().getDay() - (6-i) + 5) % 5] );

            if (dashboardIncidentsChartInstance) dashboardIncidentsChartInstance.destroy();
            dashboardIncidentsChartInstance = new Chart(ctx, { 
                type: 'bar', 
                data: { 
                    labels: labels, 
                    datasets: [{ 
                        label: 'Incidentes', 
                        data: incidentCounts, 
                        backgroundColor: secondaryChartColor 
                    }] 
                },
                options: { 
                    responsive: true, maintainAspectRatio: false, animation: false, 
                    scales: { 
                        y: { beginAtZero: true, ticks: { stepSize: 1, color: chartFontColor }, grid: { color: chartGridColor } },
                        x: { ticks: { color: chartFontColor }, grid: { color: chartGridColor } }
                    },
                    plugins: { legend: { labels: { color: chartFontColor } } }
                }
            });
        }
    }
    async function handleToggleSalaAdaptadaDashboard() { 
        if (cachedConfigs.simulacaoAtiva) {
            // Em modo simulação, apenas alterna o texto do botão e status simulado
            const currentText = dashToggleSalaBtn.textContent;
            dashToggleSalaBtn.textContent = currentText.includes("Ativar") ? 'Desativar Adap. (Sim.)' : 'Ativar Adap. (Sim.)';
            if (dashSalaStatusEl) dashSalaStatusEl.textContent = dashSalaStatusEl.textContent === "Adaptada" ? "Padrão (Sim.)" : "Adaptada (Sim.)";
            showUINotification("Status da sala simulada alterado.", "info");
            return;
        }

        if (!dashToggleSalaBtn || !dashToggleSalaBtn.dataset.salaId) {
            showUINotification("Nenhuma sala principal definida para alternar adaptação.", "warning"); return;
        }
        const salaId = parseInt(dashToggleSalaBtn.dataset.salaId);
        const sala = cachedSalas.find(s => s.id === salaId);
        if (!sala) { showUINotification("Sala não encontrada para alternar adaptação.", "error"); return; }
        try {
            const updatedSala = await fetchDataAPI(`/salas/${salaId}`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ adaptada: !sala.adaptada }) 
            });
            const index = cachedSalas.findIndex(s => s.id === salaId);
            if (index !== -1) cachedSalas[index] = updatedSala; 
            updateDashboardUI(); 
            showUINotification(`Adaptação da sala "${updatedSala.nome}" ${updatedSala.adaptada ? 'ATIVADA' : 'DESATIVADA'}.`, 'success');
        } catch (e) { /* Erro tratado */ }
    }

    // --- ALUNOS (Listagem e CRUD) ---
     // Dentro do seu public/script.js

     // Dentro do seu public/script.js

// Dentro do seu public/script.js

function renderAlunosTableUI() {
    // Garante que o elemento da tabela existe
    if (!alunosTableBodyEl) {
        console.error("ERRO FATAL: O elemento <tbody> da tabela de alunos não foi encontrado!");
        return;
    }

    console.log(`Renderizando tabela. Alunos em cache: ${cachedAlunos.length}. Modo Sim.: ${cachedConfigs.simulacaoAtiva}`);

    // Filtros (sua lógica de filtro continua a mesma)
    const searchTerm = alunosSearchInput ? alunosSearchInput.value.toLowerCase() : "";
    const autismoFilter = alunosFilterAutismoSelect ? alunosFilterAutismoSelect.value : "all";

    const filteredAlunos = (cachedAlunos || []).filter(aluno => {
        const nomeMatch = aluno.nome ? aluno.nome.toLowerCase().includes(searchTerm) : false;
        const autismoMatch = autismoFilter === 'all' ||
                             (autismoFilter === 'autista' && aluno.autista) ||
                             (autismoFilter === 'nenhum' && !aluno.autista) ||
                             (autismoFilter === 'tdah' && aluno.tdah);
        return nomeMatch && autismoMatch;
    });

    // --- A LÓGICA À PROVA DE FALHAS ---

    // 1. Limpa completamente o corpo da tabela antes de adicionar qualquer coisa.
    alunosTableBodyEl.innerHTML = '';

    // 2. Se não houver alunos após filtrar, mostra uma mensagem e para a execução.
    if (filteredAlunos.length === 0) {
        const modo = cachedConfigs.simulacaoAtiva ? "(Modo Simulação)" : "";
        alunosTableBodyEl.innerHTML = `<tr><td colspan="4" class="empty-message">Nenhum aluno encontrado ${modo}.</td></tr>`;
        return;
    }

    // 3. Cria uma string vazia para acumular o HTML de todas as linhas.
    let tableHtmlContent = '';

    // 4. Itera sobre CADA aluno e usa `+=` para adicionar a string da linha à variável.
    filteredAlunos.forEach(aluno => {
        const sala = cachedSalas.find(s => s.id === aluno.salaId);
        
        // Concatena a string da nova linha
        tableHtmlContent += `
            <tr data-aluno-id="${aluno.id}">
                <td>${aluno.nome || 'Nome Indefinido'} ${aluno.autista ? '<span class="autism-indicator-badge">TEA</span>' : ''}</td>
                <td>${aluno.autista ? 'Sim' : 'Não'}</td>
                <td>${sala ? sala.nome : 'N/A'}</td>
                <td class="actions-cell">
                    <button class="btn btn-small btn-link aluno-view-btn" title="Ver Perfil"><i class="fas fa-eye"></i></button>
                    <button class="btn btn-small btn-link aluno-edit-btn" title="Editar"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-small btn-link aluno-delete-btn" title="Excluir"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `;
    });

    // 5. Depois que o loop termina, insere a string HTML completa no corpo da tabela de uma só vez.
    alunosTableBodyEl.innerHTML = tableHtmlContent;
    console.log(`Tabela renderizada com ${filteredAlunos.length} aluno(s).`);
}

    function openAlunoFormModalUI(alunoIdStr = null) {
        // O formulário de adição/edição deve, em geral, funcionar com dados reais ou permitir
        // a criação/edição de dados que seriam enviados ao backend.
        // Se a simulação estiver ativa, o backend é que decidiria se ignora ou simula o save.
        // Para a UI do formulário em si, não há grande mudança por causa da simulação,
        // exceto talvez desabilitar o save se a intenção for não permitir escritas.
        // Por ora, o save tentará a API, e o backend (se configurado) simularia a persistência.

        const alunoId = alunoIdStr ? parseInt(alunoIdStr) : null;
        const isEditing = alunoId !== null;
        let aluno = {};
        if (isEditing) {
            if (cachedConfigs.simulacaoAtiva && !(cachedAlunos || []).find(a => a.id === alunoId)) {
                // Se editando em modo simulação e o aluno não está no cache (ex: cache vazio)
                // Poderia criar um aluno simulado para edição, mas é mais complexo.
                // Por ora, se não está no cache (que pode ter dados reais se simulação ativada depois do load),
                // ou pode estar vazio se simulação ativada antes do load
                aluno = { id: alunoId, nome: "Aluno Simulado (Edição)", autista: false, salaId: null };
                showUINotification("Editando dados simulados para um aluno não carregado.", "info");
            } else {
                 aluno = (cachedAlunos || []).find(a => a.id === alunoId) || {};
            }
        }
        if (isEditing && !aluno.id && !cachedConfigs.simulacaoAtiva) { // Check if aluno was truly not found only if not in sim mode or if it wasn't a simulated placeholder
            showUINotification("Aluno não encontrado.", "error"); return; 
        }


        const salasDisponiveis = cachedSalas || [];
        const formHtml = `
            <input type="hidden" id="modalFormAlunoId" value="${isEditing ? aluno.id : ''}">
            <div class="form-row"> <label for="modalFormAlunoNome">Nome:</label> <input type="text" id="modalFormAlunoNome" class="input-field" value="${aluno?.nome || ''}" required> </div>
            <div class="form-row checkbox-group-row"> <input type="checkbox" id="modalFormAlunoAutista" class="styled-checkbox" ${aluno?.autista ? 'checked' : ''}> <label for="modalFormAlunoAutista">Autismo (TEA)</label> </div>
            <div class="form-row" id="modalFormLaudoGroup" style="display: ${aluno?.autista || (alunoIdStr === null && false) ? 'block' : 'none'};"> <label for="modalFormAlunoLaudo">Laudo/Obs. (TEA):</label> <textarea id="modalFormAlunoLaudo" class="input-field" rows="3">${aluno?.laudo || (cachedConfigs.simulacaoAtiva && aluno?.autista ? 'Laudo simulado.' : '')}</textarea> </div>
            <div class="form-row"> <label for="modalFormAlunoSala">Sala:</label> <select id="modalFormAlunoSala" class="select-input"> <option value="">Nenhuma</option> ${salasDisponiveis.map(s => `<option value="${s.id}" ${aluno?.salaId === s.id ? 'selected' : ''}>${s.nome}</option>`).join('')} </select> </div>
            <div class="form-row"> <label for="modalFormAlunoNascimento">Nascimento:</label> <input type="date" id="modalFormAlunoNascimento" class="input-field" value="${aluno?.dataNascimento || (cachedConfigs.simulacaoAtiva ? '2015-01-01' : '')}"> </div>
            <div class="form-row"> <label for="modalFormAlunoResponsavel">Responsável:</label> <input type="text" id="modalFormAlunoResponsavel" class="input-field" value="${aluno?.responsavel || (cachedConfigs.simulacaoAtiva ? 'Responsável Simulado' : '')}"> </div>
            <div class="form-row"> <label for="modalFormAlunoTelefone">Telefone:</label> <input type="tel" id="modalFormAlunoTelefone" class="input-field" value="${aluno?.telefone || (cachedConfigs.simulacaoAtiva ? '(00)00000-0000' : '')}"> </div>
            <div class="form-row"> <label for="modalFormAlunoObservacoesExtras">Outras Observações:</label> <textarea id="modalFormAlunoObservacoesExtras" class="input-field" rows="2">${aluno?.observacoes || (cachedConfigs.simulacaoAtiva ? 'Observações simuladas.' : '')}</textarea> </div>
        `;
        openGenericModal({
            title: isEditing ? "Editar Aluno" : "Novo Aluno", bodyHtml: formHtml,
            confirmText: isEditing ? "Salvar" : "Adicionar", onConfirm: handleSaveAlunoData, showCancelButton: true
        });
        document.getElementById('modalFormAlunoAutista')?.addEventListener('change', (e) => {
            const laudoGroup = document.getElementById('modalFormLaudoGroup');
            if (laudoGroup) laudoGroup.style.display = e.target.checked ? 'block' : 'none';
        });
    }
    async function handleSaveAlunoData() { 
        // Esta função envia dados para a API.
        // Se a simulação estiver ativa, o backend (se implementado para isso) poderia
        // simular a persistência sem alterar dados reais. O frontend não precisa mudar aqui.
        const id = document.getElementById('modalFormAlunoId').value;
        const nome = document.getElementById('modalFormAlunoNome').value;
        const autista = document.getElementById('modalFormAlunoAutista').checked;
        const laudo = document.getElementById('modalFormAlunoLaudo').value;
        const salaId = document.getElementById('modalFormAlunoSala').value;
        const dataNascimento = document.getElementById('modalFormAlunoNascimento').value;
        const responsavel = document.getElementById('modalFormAlunoResponsavel').value;
        const telefone = document.getElementById('modalFormAlunoTelefone').value;
        const observacoes = document.getElementById('modalFormAlunoObservacoesExtras').value;

        if (!nome.trim()) { showUINotification("Nome é obrigatório.", "warning"); return; }
        const payload = {
            nome: nome.trim(), autista: autista, laudo: autista ? laudo.trim() : null,
            salaId: salaId ? parseInt(salaId) : null, dataNascimento, responsavel, telefone, observacoes
        };
        try {
            // Se simulação estiver ativa, este fetch ainda ocorre, mas o backend pode não persistir
            const savedAluno = await fetchDataAPI(id ? `/alunos/${id}` : '/alunos', {
                method: id ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
            });
            
            if (cachedConfigs.simulacaoAtiva && !id) { // Se adicionando em modo simulação
                 // Adiciona ao cache local para visualização, mesmo que não persista no backend real
                 if (!savedAluno.id) savedAluno.id = Date.now(); // Mock ID se backend não retornou
                 if (!cachedAlunos) cachedAlunos = [];
                 cachedAlunos.push(savedAluno);
            } else if (cachedConfigs.simulacaoAtiva && id) { // Se editando em modo simulação
                if (!cachedAlunos) cachedAlunos = [];
                const index = cachedAlunos.findIndex(a => a.id === parseInt(id));
                if (index !== -1) cachedAlunos[index] = {...cachedAlunos[index], ...savedAluno}; // Mescla com o simulado
                else cachedAlunos.push({...payload, id: parseInt(id)}); // Adiciona se não estava no cache
            } else { // Modo não simulação
                if (!cachedAlunos) cachedAlunos = []; 
                if (id) {
                    const index = cachedAlunos.findIndex(a => a.id === parseInt(id));
                    if (index !== -1) cachedAlunos[index] = savedAluno;
                } else {
                    cachedAlunos.push(savedAluno);
                }
            }

            renderAlunosTableUI();
            updateDashboardUI(); 
            closeGenericModal();
            showUINotification(`Aluno ${id ? 'atualizado' : 'adicionado'} ${cachedConfigs.simulacaoAtiva ? "(Simulado)" : ""}!`, 'success');
        } catch (e) { /* Erro tratado pela API */ }
    }
    async function handleDeleteAluno(alunoIdStr) { 
        // Similar ao save, o delete tentará a API. O backend simularia se necessário.
        const alunoId = parseInt(alunoIdStr);
        const aluno = (cachedAlunos || []).find(a => a.id === alunoId);
        if (!aluno) return;

        openGenericModal({
            title: "Confirmar Exclusão",
            bodyHtml: `<p>Tem certeza que deseja excluir o aluno "<strong>${aluno.nome}</strong>"? Esta ação não pode ser desfeita ${cachedConfigs.simulacaoAtiva ? "(Simulado)" : ""}.</p>`,
            confirmText: "Excluir",
            contextClass: 'danger-confirm', 
            onConfirm: async () => {
                try {
                    if (!cachedConfigs.simulacaoAtiva) { // Só faz chamada API se não for simulação
                        await fetchDataAPI(`/alunos/${alunoId}`, { method: 'DELETE' });
                    }
                    // Remove do cache local em ambos os casos
                    if (cachedAlunos) cachedAlunos = cachedAlunos.filter(a => a.id !== alunoId);
                    
                    renderAlunosTableUI();
                    updateDashboardUI();
                    closeGenericModal(); 
                    showUINotification(`Aluno "${aluno.nome}" excluído ${cachedConfigs.simulacaoAtiva ? "(Simulado)" : ""}.`, 'success');
                } catch (e) { /* Erro tratado pela API */ }
            },
            showCancelButton: true
        });
    }

    // --- PERFIL DO ALUNO (MODAL) ---
async function openAlunoProfileModalUI(alunoIdStr) {
    const alunoId = parseInt(alunoIdStr);
    try {
        // Usa a nova rota da API que criamos no Passo 1!
        const alunoData = await fetchDataAPI(`/alunos/${alunoId}`);
        if (!alunoData) {
            showUINotification("Não foi possível carregar os dados do aluno.", "error");
            return;
        }

        const sala = cachedSalas.find(s => s.id === alunoData.salaId);
        const dataNascFormatada = alunoData.dataNascimento ? new Date(alunoData.dataNascimento + 'T00:00:00').toLocaleDateString('pt-BR') : 'Não informado';

        // Monta o HTML do perfil com os dados recebidos
        const profileBodyHtml = `
            <div class="profile-header-details">
                <div class="profile-avatar-display">
                     <img src="${alunoData.imagemUrl || 'images/perfil_padrao.jpg'}" alt="Foto de ${alunoData.nome}" style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover; border: 2px solid var(--primary-color);">
                </div>
                <div class="profile-main-info" style="margin-left: 15px;">
                    <h4>${alunoData.nome} ${alunoData.autista ? '<span class="autism-indicator-badge">TEA</span>' : ''}</h4>
                    <p>Sala: ${sala ? sala.nome : 'N/A'}</p>
                    <p>Idade: ${alunoData.idade !== undefined ? alunoData.idade + ' anos' : 'Idade não informada'}</p>
                </div>
            </div>
            <hr style="margin: 15px 0; border-color: var(--light-gray);">
            <div class="info-grid-profile">
                <p><strong>Nascimento:</strong> ${dataNascFormatada}</p>
                <p><strong>Responsável:</strong> ${alunoData.responsavel || 'Não informado'}</p>
                <p><strong>Telefone:</strong> ${alunoData.telefone || 'Não informado'}</p>
            </div>
            <h4>Observações / Laudo</h4>
            <p style="white-space: pre-wrap; background-color: var(--background-color-offset); padding: 10px; border-radius: 5px;">${alunoData.laudo || alunoData.observacoes || 'Nenhuma informação registrada.'}</p>
        `;

        // Define os botões do rodapé do modal
        const profileFooterHtml = `
            <button class="btn btn-secondary" data-action="close-profile">Fechar</button>
        `;

        // Abre o modal genérico com o conteúdo do perfil
        openGenericModal({
            title: `Perfil do Aluno`,
            bodyHtml: profileBodyHtml,
            footerHtml: profileFooterHtml,
            contextClass: 'profile-view',
            showCancelButton: false
        });
        
        // Adiciona o evento de fechar ao botão do rodapé do modal
        genericModalFooterEl.querySelector('[data-action="close-profile"]').addEventListener('click', closeGenericModal);

    } catch (e) {
        console.error("Erro ao abrir perfil do aluno:", e);
    }
}

    function renderProfileIncidentsChartAndListUI(alunoId, chartCanvasId, listUlId) {
        const chartCanvas = document.getElementById(chartCanvasId);

        const chartFontColor = getComputedStyle(document.documentElement).getPropertyValue('--text-secondary-color').trim();
        const chartGridColor = getComputedStyle(document.documentElement).getPropertyValue('--medium-gray').trim();
        const dangerChartColor = getComputedStyle(document.documentElement).getPropertyValue('--danger-color').trim();

        if (chartCanvas) {
            const ctx = chartCanvas.getContext('2d');
            let incidentesPorMes;

            if (cachedConfigs.simulacaoAtiva) {
                incidentesPorMes = Array(12).fill(0).map(() => Math.floor(Math.random() * 3)); // Max 2 incidentes simulados por mês
            } else {
                incidentesPorMes = Array(12).fill(0);
                const incidentesDoAlunoArray = cachedRelatorios || [];
                const incidentesDoAluno = incidentesDoAlunoArray.filter(r => r.tipo === 'incidente' && r.conteudo?.alunoId === alunoId);
                incidentesDoAluno.forEach(inc => { if(inc.data) incidentesPorMes[new Date(inc.data).getMonth()]++; });
            }
            
            if (profileAlunoIncidentsChartInstance && profileAlunoIncidentsChartInstance.canvas.id === chartCanvasId) {
                profileAlunoIncidentsChartInstance.destroy();
            }
            
            profileAlunoIncidentsChartInstance = new Chart(ctx, { 
                type: 'line', 
                data: { 
                    labels: ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'], 
                    datasets: [{
                        label:`Incidentes/Mês ${cachedConfigs.simulacaoAtiva ? '(S)' : ''}`, 
                        data:incidentesPorMes, 
                        borderColor: dangerChartColor, 
                        tension:0.3, 
                        fill:true, 
                        backgroundColor: dangerChartColor + '20' 
                    }] 
                },
                options: { 
                    responsive:true, maintainAspectRatio:false, animation:false, 
                    scales:{ 
                        y:{beginAtZero:true, ticks:{stepSize:1, color: chartFontColor }, grid: { color: chartGridColor }},
                        x:{ticks:{ color: chartFontColor }, grid: { color: chartGridColor }}
                    },
                    plugins: { legend: { labels: { color: chartFontColor } } }
                }
            });
        }
        const listEl = document.getElementById(listUlId);
        if (listEl) {
            listEl.innerHTML = '';
            if (cachedConfigs.simulacaoAtiva) {
                const numSimulatedIncidents = Math.floor(Math.random() * 6); // 0 to 5
                if (numSimulatedIncidents === 0) {
                    listEl.innerHTML = '<li>Nenhum incidente simulado encontrado.</li>';
                } else {
                    for (let i = 0; i < numSimulatedIncidents; i++) {
                        const li = document.createElement('li');
                        const randomDate = new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)); // últimos 30 dias
                        li.textContent = `${randomDate.toLocaleString()}: Incidente simulado #${i + 1}. Descrição variada do evento.`;
                        listEl.appendChild(li);
                    }
                }
            } else {
                const incidentesDoAlunoArray = cachedRelatorios || [];
                const incidentesDoAluno = incidentesDoAlunoArray.filter(r => r.tipo === 'incidente' && r.conteudo?.alunoId === alunoId);
                if (incidentesDoAluno.length === 0) { listEl.innerHTML = '<li>Nenhum incidente registrado.</li>'; }
                else {
                    incidentesDoAluno.sort((a,b) => new Date(b.data) - new Date(a.data)).slice(0,10).forEach(inc => {
                        const li = document.createElement('li');
                        li.textContent = `${new Date(inc.data).toLocaleString()}: ${inc.conteudo.descricao}`;
                        listEl.appendChild(li);
                    });
                }
            }
        }
    }
    function handlePrintFromProfile(textToPrint){ 
        if (!textToPrint || !textToPrint.trim() ) { showUINotification("Nada para imprimir.", "info"); return; }
        const win = window.open('', '_blank');
        win.document.write(`<html><head><title>Imprimir Laudo</title><style>body{font-family:sans-serif;white-space:pre-wrap;padding:20px;font-size:14px;line-height:1.6;} h4{margin-top:0;}</style></head><body><h4>Laudo Médico</h4>${textToPrint}</body></html>`);
        win.document.close(); 
        win.onload = function() { 
            win.print(); 
            // win.close(); // Comentado para permitir que o usuário feche manualmente após a impressão
        }
    }

    // --- CHAMADA ---
    function populateSelectWithOptions(selectElement, items, defaultOptionText, valueKey, textKey, includeAllOption = false) {
        if (!selectElement) return;
        const currentValue = selectElement.value; 
        selectElement.innerHTML = ''; 

        if (defaultOptionText) {
            const defaultOpt = document.createElement('option');
            defaultOpt.value = "";
            defaultOpt.textContent = defaultOptionText;
            selectElement.appendChild(defaultOpt);
        }
        if (includeAllOption) {
            const allOpt = document.createElement('option');
            allOpt.value = "all";
            allOpt.textContent = "Todos"; 
            selectElement.appendChild(allOpt);
        }
        const itemsArray = items || []; 
        itemsArray.forEach(item => {
            const option = document.createElement('option');
            option.value = item[valueKey];
            option.textContent = item[textKey] + (item.simulada ? " (S)" : ""); // Adiciona (S) se for sala simulada
            selectElement.appendChild(option);
        });
        if (itemsArray.find(item => item[valueKey] == currentValue)) { 
             selectElement.value = currentValue;
        } else if (defaultOptionText) {
             selectElement.value = "";
        } else if (includeAllOption) {
             selectElement.value = "all";
        }
    }
    function prepareChamadaUI() {
        console.log("FN: prepareChamadaUI");
        if (!chamadaSalaSelect) { console.warn("Elementos da UI de Chamada não encontrados."); return; }
        
        let salasParaChamada = cachedSalas;
        if (cachedConfigs.simulacaoAtiva && (!cachedSalas || cachedSalas.length === 0)) {
            salasParaChamada = [{id: 999, nome: "Sala de Teste", adaptada: false, simulada: true}]; // Sala simulada para chamada
        }
        populateSelectWithOptions(chamadaSalaSelect, salasParaChamada, 'Escolha uma sala', 'id', 'nome');
        
        if (chamadaAlunosGridEl) chamadaAlunosGridEl.innerHTML = '<p class="empty-message">Selecione uma sala para iniciar a chamada.</p>';
        if (chamadaCurrentSalaEl) chamadaCurrentSalaEl.textContent = '';
        if (chamadaStatusEl) chamadaStatusEl.innerHTML = '<i class="fas fa-info-circle"></i> Selecione uma sala';
        if (chamadaTimeEl) chamadaTimeEl.textContent = '00:00';
        if (chamadaStartBtn) chamadaStartBtn.disabled = true;
        if (chamadaEndBtn) chamadaEndBtn.disabled = true;
        if (chamadaGerarRelatorioBtn) chamadaGerarRelatorioBtn.disabled = true;
        if (chamadaActionsFooterEl) chamadaActionsFooterEl.style.display = 'none';
        
        isChamadaRunning = false;
        currentSalaChamadaId = null;
        chamadaCurrentSeconds = 0;
        if (chamadaTimerInterval) clearInterval(chamadaTimerInterval);
        chamadaSalaSelect.disabled = false;
    }
    function formatTimeDisplay(totalSeconds) {
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
    function handleSalaSelectChamada() { 
        currentSalaChamadaId = chamadaSalaSelect.value ? parseInt(chamadaSalaSelect.value) : null;
        if (currentSalaChamadaId) {
            let sala;
            if (cachedConfigs.simulacaoAtiva && currentSalaChamadaId === 999 && (!cachedSalas || !cachedSalas.find(s => s.id === 999))) {
                 sala = {id: 999, nome: "Sala de Teste (S)"}; // Objeto sala simulada se não estiver no cache
            } else {
                 sala = (cachedSalas || []).find(s => s.id === currentSalaChamadaId);
            }

            if (chamadaCurrentSalaEl) chamadaCurrentSalaEl.textContent = sala ? `Sala: ${sala.nome}` : '';
            renderAlunosGridChamada(); // Esta função também precisa ser ciente da simulação
            if (chamadaStartBtn) chamadaStartBtn.disabled = false; 
            if (chamadaStatusEl) chamadaStatusEl.innerHTML = '<i class="fas fa-play-circle"></i> Pronto para iniciar';
        } else { 
            if (chamadaCurrentSalaEl) chamadaCurrentSalaEl.textContent = '';
            if (chamadaAlunosGridEl) chamadaAlunosGridEl.innerHTML = '<p class="empty-message">Selecione uma sala para iniciar a chamada.</p>';
            if (chamadaStartBtn) chamadaStartBtn.disabled = true;
            if (chamadaStatusEl) chamadaStatusEl.innerHTML = '<i class="fas fa-info-circle"></i> Selecione uma sala';
        }
    }
    function renderAlunosGridChamada() { 
        if (!chamadaAlunosGridEl || !alunoCardChamadaTemplate) return;
        chamadaAlunosGridEl.innerHTML = '';
        
        let alunosNestaSala;
        if (cachedConfigs.simulacaoAtiva && currentSalaChamadaId === 999) { // Sala simulada
            alunosNestaSala = Array.from({length: Math.floor(Math.random() * 10) + 5}).map((_, i) => ({ // 5-14 alunos simulados
                id: 1000 + i, // IDs simulados
                nome: `Aluno Sim. ${i + 1}`,
                autista: Math.random() < 0.2,
                simulado: true
            }));
        } else {
            const alunosNestaSalaArray = cachedAlunos || [];
            alunosNestaSala = alunosNestaSalaArray.filter(aluno => aluno.salaId === currentSalaChamadaId);
        }


        if (!currentSalaChamadaId || alunosNestaSala.length === 0) { 
            chamadaAlunosGridEl.innerHTML = `<p class="empty-message">Nenhum aluno nesta sala ${cachedConfigs.simulacaoAtiva && currentSalaChamadaId === 999 ? "(Simulada)" : ""} ou sala não selecionada.</p>`; 
            if (chamadaStartBtn) chamadaStartBtn.disabled = true;
            return; 
        }
        
        alunosNestaSala.forEach(aluno => {
            const cardNode = alunoCardChamadaTemplate.content.cloneNode(true);
            const card = cardNode.querySelector('.aluno-card-chamada');
            card.dataset.alunoId = aluno.id;
            card.querySelector('.aluno-nome-chamada').textContent = aluno.nome + (aluno.simulado ? " (S)" : "");
            const badge = card.querySelector('.aluno-autism-badge-chamada');
            if (aluno.autista) {
                badge.style.display = 'inline-block';
                card.classList.add('autista-chamada'); 
            } else {
                badge.style.display = 'none';
            }
            card.addEventListener('click', togglePresencaAlunoChamada);
            chamadaAlunosGridEl.appendChild(cardNode);
        });
        if (chamadaStartBtn) chamadaStartBtn.disabled = false;
    }
    function togglePresencaAlunoChamada(event) { 
        if (!isChamadaRunning) {
            showUINotification("Inicie a chamada para marcar presença.", "warning", 2000);
            return;
        }
        event.currentTarget.classList.toggle('present');
        updateChamadaStatusDisplay();
    }
    function updateChamadaStatusDisplay() { 
        if (!chamadaStatusEl || !chamadaAlunosGridEl) return;
        const presentes = chamadaAlunosGridEl.querySelectorAll('.aluno-card-chamada.present').length;
        const total = chamadaAlunosGridEl.querySelectorAll('.aluno-card-chamada').length;
        chamadaStatusEl.innerHTML = `<i class="fas fa-users"></i> ${presentes}/${total} presentes`;
    }
    function handleChamadaStart() { 
        if (!currentSalaChamadaId) { showUINotification("Selecione uma sala para iniciar!", "warning"); return; }
        
        const alunosNaChamada = chamadaAlunosGridEl.querySelectorAll('.aluno-card-chamada');
        if (alunosNaChamada.length === 0) {
            showUINotification("Não há alunos nesta sala para iniciar a chamada.", "warning");
            return;
        }

        isChamadaRunning = true;
        chamadaCurrentSeconds = 0;
        if(chamadaTimeEl) chamadaTimeEl.textContent = "00:00";
        chamadaTimerInterval = setInterval(() => {
            chamadaCurrentSeconds++;
            if(chamadaTimeEl) chamadaTimeEl.textContent = formatTimeDisplay(chamadaCurrentSeconds);
        }, 1000);

        if(chamadaStartBtn) chamadaStartBtn.disabled = true;
        if(chamadaEndBtn) chamadaEndBtn.disabled = false;
        if(chamadaSalaSelect) chamadaSalaSelect.disabled = true;
        if(chamadaActionsFooterEl) chamadaActionsFooterEl.style.display = 'flex'; 
        if(chamadaGerarRelatorioBtn) chamadaGerarRelatorioBtn.disabled = true; 
        
        alunosNaChamada.forEach(card => card.classList.remove('present'));
        updateChamadaStatusDisplay(); 
        if(chamadaStatusEl) chamadaStatusEl.innerHTML = `<i class="fas fa-clock"></i> Em andamento...`;
    }
    function handleChamadaEnd() { 
        isChamadaRunning = false;
        clearInterval(chamadaTimerInterval);
        if(chamadaStartBtn) chamadaStartBtn.disabled = false;
        if(chamadaEndBtn) chamadaEndBtn.disabled = true;
        if(chamadaSalaSelect) chamadaSalaSelect.disabled = false;
        if(chamadaGerarRelatorioBtn) chamadaGerarRelatorioBtn.disabled = false; 
        if(chamadaStatusEl) chamadaStatusEl.innerHTML = `<i class="fas fa-check-circle"></i> Chamada Finalizada (${formatTimeDisplay(chamadaCurrentSeconds)})`;
    }
    async function handleChamadaGerarRelatorio() { 
        if (!currentSalaChamadaId) { showUINotification("Nenhuma chamada ativa ou finalizada para gerar relatório.", "warning"); return; }
        if (isChamadaRunning) { showUINotification("Finalize a chamada antes de gerar o relatório.", "warning"); return; }

        const presentesCards = chamadaAlunosGridEl.querySelectorAll('.aluno-card-chamada.present');
        const presentesIds = Array.from(presentesCards).map(card => parseInt(card.dataset.alunoId));
        const totalAlunosNaChamada = chamadaAlunosGridEl.querySelectorAll('.aluno-card-chamada').length;
        
        if (totalAlunosNaChamada === 0) {
            showUINotification("Não há alunos na chamada para gerar relatório.", "info");
            return;
        }

        const payload = {
            salaId: currentSalaChamadaId, 
            tipo: 'chamada', 
            data: new Date().toISOString(), 
            conteudo: {
                presentes: presentesIds.length, 
                ausentes: totalAlunosNaChamada - presentesIds.length,
                duracaoSegundos: chamadaCurrentSeconds,
                duracaoFormatada: formatTimeDisplay(chamadaCurrentSeconds), 
                alunosPresentesIds: presentesIds,
                simulado: cachedConfigs.simulacaoAtiva // Indica se o relatório é de uma chamada simulada
            }
        };
        try {
            let novoRelatorio;
            if (cachedConfigs.simulacaoAtiva) {
                novoRelatorio = { ...payload, id: Date.now(), simulado: true }; // Mock de relatório salvo
                console.log("Relatório de chamada simulado:", novoRelatorio);
            } else {
                novoRelatorio = await fetchDataAPI('/relatorios', { 
                    method: 'POST', 
                    headers: {'Content-Type':'application/json'}, 
                    body: JSON.stringify(payload) 
                });
            }
            if (!cachedRelatorios) cachedRelatorios = []; 
            cachedRelatorios.push(novoRelatorio);
            showUINotification(`Relatório de chamada ${cachedConfigs.simulacaoAtiva ? "simulado " : ""}salvo com sucesso!`, "success");
            if(chamadaGerarRelatorioBtn) chamadaGerarRelatorioBtn.disabled = true;
            updateDashboardUI(); 
        } catch (e) { /* Erro já tratado */ }
    }

    // --- RELATÓRIOS ---
    function prepareRelatoriosUI() { 
        if (!relatoriosSalaSelect || !relatoriosTypeSelect || !relatoriosDateInput || !relatoriosAlunoSelect || !relatoriosOutputAreaEl) return;
        
        let salasParaRelatorios = cachedSalas;
        if (cachedConfigs.simulacaoAtiva && (!cachedSalas || cachedSalas.length === 0)) {
            salasParaRelatorios = [{id: 999, nome: "Sala de Teste", adaptada: false, simulada: true}];
        }
        populateSelectWithOptions(relatoriosSalaSelect, salasParaRelatorios, 'Todas as Salas', 'id', 'nome', true); 
        
        let alunosParaRelatorios = cachedAlunos;
         if (cachedConfigs.simulacaoAtiva && (!cachedAlunos || cachedAlunos.length === 0)) {
            alunosParaRelatorios = Array.from({length: 5}).map((_, i) => ({ id: 1000+i, nome: `Aluno Sim. ${i+1}`, simulado: true}));
        }
        populateSelectWithOptions(relatoriosAlunoSelect, alunosParaRelatorios, 'Todos os Alunos', 'id', 'nome', true); 
        
        relatoriosTypeSelect.value = 'chamada_geral'; 
        relatoriosDateInput.valueAsDate = new Date(); 
        handleRelatorioTypeChange(); 
        relatoriosOutputAreaEl.innerHTML = '<p class="empty-message">Use os filtros e clique em "Gerar".</p>';
    }
    function handleRelatorioTypeChange() { 
         if(relatoriosAlunoSelect) relatoriosAlunoSelect.style.display = relatoriosTypeSelect.value === 'desempenho_aluno' ? 'block' : 'none';
    }
    function handleGerarRelatorioTela() { 
        if (!relatoriosOutputAreaEl || !relatoriosTypeSelect || !relatoriosDateInput || !relatoriosSalaSelect || !relatoriosAlunoSelect) return;

        const tipo = relatoriosTypeSelect.value;
        const dataFiltro = relatoriosDateInput.value; 
        const salaIdFiltro = relatoriosSalaSelect.value; 
        const alunoIdFiltro = relatoriosAlunoSelect.value; 

        relatoriosOutputAreaEl.innerHTML = `<h4>Relatório: ${relatoriosTypeSelect.options[relatoriosTypeSelect.selectedIndex].text} ${cachedConfigs.simulacaoAtiva ? '(Simulado)' : ''}</h4>`;
        
        let dadosParaRelatorio = [];
        let relatoriosArray = cachedRelatorios || [];
        let alunosArray = cachedAlunos || [];
        let salasArray = cachedSalas || [];

        if (cachedConfigs.simulacaoAtiva) {
            // Gerar dados de relatório simulados
            if (alunosArray.length === 0) alunosArray = Array.from({length: 5}).map((_, i) => ({ id: 1000+i, nome: `Aluno Sim. ${i+1}`, autista: Math.random() < 0.2, salaId: 999, simulado: true}));
            if (salasArray.length === 0) salasArray = [{id: 999, nome: "Sala de Teste", adaptada: false, simulada: true}];
            if (relatoriosArray.length === 0) { // Gerar alguns relatórios simulados se não houver
                 for (let i=0; i<5; i++) { // 5 relatórios de chamada simulados
                    relatoriosArray.push({
                        id: Date.now() + i, tipo: 'chamada', salaId: 999, data: new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000).toISOString(),
                        conteudo: { presentes: Math.floor(Math.random()*5)+5, ausentes: Math.floor(Math.random()*3), duracaoFormatada: "00:15", simulado: true}
                    });
                 }
                 for (let i=0; i<10; i++) { // 10 relatórios de incidente simulados
                    const randomAluno = alunosArray[Math.floor(Math.random() * alunosArray.length)];
                    relatoriosArray.push({
                        id: Date.now() + 100 + i, tipo: 'incidente', data: new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000).toISOString(),
                        conteudo: { alunoId: randomAluno.id, descricao: `Incidente simulado ${i+1} com ${randomAluno.nome}.`, simulado: true}
                    });
                 }
            }
        }


        if (tipo === 'chamada_geral') {
            dadosParaRelatorio = relatoriosArray.filter(r => 
                r.tipo === 'chamada' &&
                (!dataFiltro || r.data?.startsWith(dataFiltro)) &&
                (salaIdFiltro === 'all' || r.salaId === parseInt(salaIdFiltro))
            );
        } else if (tipo === 'incidentes_geral') {
            dadosParaRelatorio = relatoriosArray.filter(r => 
                r.tipo === 'incidente' &&
                (!dataFiltro || r.data?.startsWith(dataFiltro)) &&
                (salaIdFiltro === 'all' || (r.conteudo?.alunoId && alunosArray.find(a => a.id === r.conteudo.alunoId)?.salaId === parseInt(salaIdFiltro)) ) && 
                (alunoIdFiltro === 'all' || r.conteudo?.alunoId === parseInt(alunoIdFiltro)) 
            );
        } else if (tipo === 'desempenho_aluno') {
            if (alunoIdFiltro === 'all') {
                relatoriosOutputAreaEl.innerHTML += '<p class="empty-message">Por favor, selecione um aluno específico para este relatório.</p>';
                return;
            }
            const alunoSelId = parseInt(alunoIdFiltro);
            const alunoSel = alunosArray.find(a => a.id === alunoSelId);
            if (!alunoSel) { relatoriosOutputAreaEl.innerHTML += '<p>Aluno não encontrado.</p>'; return; }
            
            relatoriosOutputAreaEl.innerHTML += `<h5>Aluno: ${alunoSel.nome} ${alunoSel.simulado ? '(S)' : ''}</h5>`;
            
            const chamadasComAluno = relatoriosArray.filter(r => 
                r.tipo === 'chamada' && 
                (r.conteudo?.alunosPresentesIds?.includes(alunoSelId) || (cachedConfigs.simulacaoAtiva && Math.random() > 0.2) ) && // Em simulação, chance de estar presente
                (!dataFiltro || r.data?.startsWith(dataFiltro)) && 
                (salaIdFiltro === 'all' || r.salaId === parseInt(salaIdFiltro)) 
            );
            relatoriosOutputAreaEl.innerHTML += `<p><strong>Presenças Registradas:</strong> ${chamadasComAluno.length}</p>`;
            
            const incidentesDoAluno = relatoriosArray.filter(r => 
                r.tipo === 'incidente' && 
                r.conteudo?.alunoId === alunoSelId &&
                (!dataFiltro || r.data?.startsWith(dataFiltro)) 
            );
            relatoriosOutputAreaEl.innerHTML += `<p><strong>Incidentes Registrados:</strong> ${incidentesDoAluno.length}</p>`;
            
            dadosParaRelatorio = incidentesDoAluno; 
        }


        if (dadosParaRelatorio.length === 0 && !(tipo === 'desempenho_aluno' && alunoIdFiltro !== 'all') ) {
            relatoriosOutputAreaEl.innerHTML += '<p class="empty-message">Nenhum dado encontrado para os filtros selecionados.</p>'; 
            return;
        }
        if (dadosParaRelatorio.length > 0) {
            const ul = document.createElement('ul');
            ul.className = 'report-items-list'; 
            dadosParaRelatorio.sort((a,b) => new Date(b.data) - new Date(a.data)).forEach(rel => {
                const li = document.createElement('li');
                let desc = `<strong>${new Date(rel.data).toLocaleString()}</strong>: `;
                
                if (rel.tipo === 'chamada') {
                    const sala = salasArray.find(s => s.id === rel.salaId);
                    desc += `Chamada ${sala? `(Sala: ${sala.nome}${sala.simulada ? ' (S)' : ''})` : ''} - ${rel.conteudo.presentes} Presentes, ${rel.conteudo.ausentes} Ausentes. Duração: ${rel.conteudo.duracaoFormatada || rel.conteudo.duracao || 'N/I'} ${rel.conteudo.simulado ? '(S)':''}`;
                } else if (rel.tipo === 'incidente') {
                    const aluno = alunosArray.find(a => a.id === rel.conteudo.alunoId);
                    const salaDoAluno = aluno ? salasArray.find(s => s.id === aluno.salaId) : null;
                    desc += `Incidente ${aluno? `(Aluno: ${aluno.nome}${aluno.simulado ? ' (S)' : ''}${salaDoAluno ? `, Sala: ${salaDoAluno.nome}${salaDoAluno.simulada ? ' (S)' : ''}` : ''})` : '(Aluno N/I)'} - ${rel.conteudo.descricao} ${rel.conteudo.simulado ? '(S)':''}`;
                }
                li.innerHTML = desc;
                ul.appendChild(li);
            });
            relatoriosOutputAreaEl.appendChild(ul);
        } else if (tipo === 'desempenho_aluno' && alunoIdFiltro !== 'all' && dadosParaRelatorio.length === 0) {
            relatoriosOutputAreaEl.innerHTML += '<p class="empty-message">Nenhum incidente detalhado para este aluno nos filtros selecionados.</p>';
        }
    }

    // --- CONFIGURAÇÕES ---
    function prepareConfiguracoesUI() { 
        if (!configThemeSelect || !configNotificationsCheckbox || !configNoiseLimitRange || !configNoiseLimitValueEl || !configSimulateDataCheckbox) {
            console.warn("Elementos da UI de Configurações não encontrados.");
            return;
        }
        console.log("FN: prepareConfiguracoesUI. Configs Atuais:", cachedConfigs);
        configThemeSelect.value = cachedConfigs.tema || 'light';
        configNotificationsCheckbox.checked = cachedConfigs.notificacoes !== undefined ? cachedConfigs.notificacoes : true;
        configNoiseLimitRange.value = cachedConfigs.limiteBarulho || 70;
        configNoiseLimitValueEl.textContent = cachedConfigs.limiteBarulho || 70;
        configSimulateDataCheckbox.checked = cachedConfigs.simulacaoAtiva; 
        
        renderConfigSalasTableUI();
        const activeTabLink = settingsTabsContainer?.querySelector('.tab-link.active');
        const targetTabId = activeTabLink ? activeTabLink.dataset.tabtarget : 'configGeralTab';
        switchConfigTabUI(targetTabId);
    }
    function switchConfigTabUI(tabId) { 
        if(!tabId || !settingsTabsContainer || !settingsTabPanes) return;
        settingsTabsContainer.querySelectorAll('.tab-link').forEach(btn => btn.classList.toggle('active', btn.dataset.tabtarget === tabId));
        settingsTabPanes.forEach(pane => pane.classList.toggle('active', pane.id === tabId));
        if (tabId === 'configSalasTab') renderConfigSalasTableUI();
    }
    async function handleSaveConfigGeral() { 
        const newConfigPayload = {
            tema: configThemeSelect.value,
            notificacoes: configNotificationsCheckbox.checked,
            limiteBarulho: parseInt(configNoiseLimitRange.value)
            // Não salva simulacaoAtiva aqui, é salvo em seu próprio fluxo
        };
        try {
            const updatedServerConfigs = await fetchDataAPI('/configuracoes', {
                method: 'PUT', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newConfigPayload) // Envia apenas configs gerais
            });
            // Mescla apenas as configs retornadas, mantendo simulacaoAtiva do cache local
            cachedConfigs = {...cachedConfigs, ...updatedServerConfigs }; 
            applyClientThemeUI(cachedConfigs.tema); 
            showUINotification("Preferências gerais salvas!", 'success');
        } catch (e) { /* Erro tratado pela API */ }
    }
    function renderConfigSalasTableUI() { 
        if (activeSectionId !== 'configuracoes' || !configSalasTableBodyEl) return;
        configSalasTableBodyEl.innerHTML = '';
        
        let salasArray = cachedSalas || [];
        if (cachedConfigs.simulacaoAtiva && salasArray.length === 0) {
             salasArray = [{id: 999, nome: "Sala de Teste", adaptada: Math.random() > 0.5, simulada: true}];
        }

        if (salasArray.length === 0) {
            configSalasTableBodyEl.innerHTML = `<tr><td colspan="4" class="empty-message">Nenhuma sala cadastrada.</td></tr>`; return;
        }
        
        let alunosArray = cachedAlunos || [];
         if (cachedConfigs.simulacaoAtiva && alunosArray.length === 0) {
             alunosArray = Array.from({length: 5}).map((_, i) => ({ id: 1000+i, nome: `Aluno Sim. ${i+1}`, salaId: 999, simulado: true}));
        }

        salasArray.forEach(sala => {
            const row = configSalasTableBodyEl.insertRow();
            row.dataset.salaId = sala.id; 
            const alunosNaSala = alunosArray.filter(a => a.salaId === sala.id).length;
            row.innerHTML = `<td>${sala.nome} ${sala.simulada ? '(S)':''}</td><td>${sala.adaptada ? 'Sim' : 'Não'}</td><td>${alunosNaSala}</td>
                             <td class="actions-cell">
                                <button class="btn btn-small btn-link config-sala-edit-btn" title="Editar Sala"><i class="fas fa-edit"></i></button>
                                <button class="btn btn-small btn-link config-sala-delete-btn" title="Excluir Sala"><i class="fas fa-trash"></i></button>
                             </td>`;
        });
    }
    function openConfigSalaFormModalUI(salaIdStr = null) { 
        const salaId = salaIdStr ? parseInt(salaIdStr) : null;
        const isEditing = salaId !== null;
        let sala = {};
        
        if (isEditing) {
            const salasArray = cachedSalas || [];
            sala = salasArray.find(s => s.id === salaId);
            if (!sala && cachedConfigs.simulacaoAtiva && salaId === 999) { // Caso especial para sala simulada padrão
                sala = {id: 999, nome: "Sala de Teste", adaptada: false, simulada: true};
            } else if (!sala) {
                 showUINotification("Sala não encontrada.", "error"); return;
            }
        }
        
        const formHtml = `
            <input type="hidden" id="modalFormConfigSalaId" value="${isEditing ? sala.id : ''}">
            <div class="form-row"> <label for="modalFormConfigSalaNome">Nome da Sala:</label> <input type="text" id="modalFormConfigSalaNome" class="input-field" value="${sala?.nome || ''}" required> </div>
            <div class="form-row checkbox-group-row"> <input type="checkbox" id="modalFormConfigSalaAdaptada" class="styled-checkbox" ${sala?.adaptada ? 'checked' : ''}> <label for="modalFormConfigSalaAdaptada">Sala Adaptada para Autismo</label> </div>
            ${sala?.simulada ? '<p class="simulated-notice-form">Editando sala simulada.</p>' : ''}
        `;
        openGenericModal({
            title: `${isEditing ? "Editar Sala" : "Nova Sala"} ${sala?.simulada ? '(Simulada)' : ''}`, bodyHtml: formHtml,
            confirmText: isEditing ? "Salvar" : "Adicionar",
            onConfirm: handleConfigSaveSalaData, showCancelButton: true
        });
    }
    async function handleConfigSaveSalaData() { 
        const id = document.getElementById('modalFormConfigSalaId').value;
        const nome = document.getElementById('modalFormConfigSalaNome').value;
        const adaptada = document.getElementById('modalFormConfigSalaAdaptada').checked;
        if (!nome.trim()) { showUINotification("Nome da sala é obrigatório.", "warning"); return; }
        
        const payload = { nome: nome.trim(), adaptada: adaptada };
        try {
            let savedSala;
            if (cachedConfigs.simulacaoAtiva && (id === "999" || !id)) { // Editando/Adicionando sala simulada
                savedSala = {...payload, id: id ? parseInt(id) : Date.now(), simulada: true};
                console.log("Sala salva (simulada):", savedSala);
            } else {
                 savedSala = await fetchDataAPI(id ? `/salas/${id}` : '/salas', {
                    method: id ? 'PUT' : 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload)
                });
            }

            if (!cachedSalas) cachedSalas = []; 
            if (id) {
                const index = cachedSalas.findIndex(s => s.id === parseInt(id));
                if (index !== -1) cachedSalas[index] = savedSala;
                else if (savedSala.simulada) cachedSalas.push(savedSala); // Adiciona se era simulada e não estava no cache
            } else {
                cachedSalas.push(savedSala);
            }
            renderConfigSalasTableUI();
            // Repopular selects que usam salas
            let salasParaSelects = cachedSalas;
            if (cachedConfigs.simulacaoAtiva && (!cachedSalas || cachedSalas.length === 0)) {
                 salasParaSelects = [{id: 999, nome: "Sala de Teste", adaptada: false, simulada: true}];
            }
            populateSelectWithOptions(chamadaSalaSelect, salasParaSelects, 'Escolha uma sala', 'id', 'nome'); 
            populateSelectWithOptions(relatoriosSalaSelect, salasParaSelects, 'Todas as Salas', 'id', 'nome', true); 

            updateDashboardUI(); 
            closeGenericModal();
            showUINotification(`Sala ${id ? 'atualizada' : 'adicionada'} ${savedSala.simulada ? '(Simulada)' : ''}!`, 'success');
        } catch (e) { /* Erro tratado pela API */ }
    }
    async function handleConfigDeleteSala(salaIdStr) { 
        const salaId = parseInt(salaIdStr);
        const salasArray = cachedSalas || [];
        const sala = salasArray.find(s => s.id === salaId) || (cachedConfigs.simulacaoAtiva && salaId === 999 ? {id:999, nome:"Sala de Teste", simulada:true} : null);

        if (!sala) return;

        const alunosArray = cachedAlunos || [];
        const alunosNestaSala = alunosArray.filter(a => a.salaId === salaId).length;
        let confirmMessage = `Tem certeza que deseja excluir a sala "<strong>${sala.nome} ${sala.simulada ? '(S)':''}</strong>"?`;
        if (alunosNestaSala > 0) {
            confirmMessage += `<br><br><strong>Atenção:</strong> Existem ${alunosNestaSala} aluno(s) associado(s) a esta sala. Eles ficarão sem sala definida.`;
        }

        openGenericModal({
            title: "Confirmar Exclusão de Sala",
            bodyHtml: `<p>${confirmMessage}</p>`,
            confirmText: "Excluir Sala",
            contextClass: 'danger-confirm',
            onConfirm: async () => {
                try {
                    if (!sala.simulada && !cachedConfigs.simulacaoAtiva) { // Só faz chamada API se não for sala simulada E modo simulação desligado
                         await fetchDataAPI(`/salas/${salaId}`, { method: 'DELETE' });
                    }
                    
                    if (cachedSalas) cachedSalas = cachedSalas.filter(s => s.id !== salaId);
                    if (cachedAlunos) { // Atualiza alunos que estavam na sala excluída
                        cachedAlunos.forEach(aluno => { if (aluno.salaId === salaId) aluno.salaId = null; });
                    }
                    
                    renderConfigSalasTableUI();
                    let salasParaSelects = cachedSalas;
                    if (cachedConfigs.simulacaoAtiva && (!cachedSalas || cachedSalas.length === 0)) {
                        salasParaSelects = [{id: 999, nome: "Sala de Teste", adaptada: false, simulada: true}];
                    }
                    populateSelectWithOptions(chamadaSalaSelect, salasParaSelects, 'Escolha uma sala', 'id', 'nome');
                    populateSelectWithOptions(relatoriosSalaSelect, salasParaSelects, 'Todas as Salas', 'id', 'nome', true);

                    if (activeSectionId === 'alunos') renderAlunosTableUI(); 
                    updateDashboardUI();
                    closeGenericModal();
                    showUINotification(`Sala "${sala.nome}" excluída ${sala.simulada ? '(Simulada)' : ''}.`, 'success');
                } catch (e) { /* Erro tratado pela API */ }
            },
            showCancelButton: true
        });
    }
    async function handleConfigBackup() { 
        if (cachedConfigs.simulacaoAtiva) {
            showUINotification("Backup não disponível em modo de simulação.", "warning");
            return;
        }
        showUINotification("Iniciando backup... Isso pode levar um momento.", "info");
        try {
            const backupData = await fetchDataAPI('/configuracoes/backup');
            if (backupData) {
                const jsonData = JSON.stringify(backupData, null, 2);
                const blob = new Blob([jsonData], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Silent Sense APP_backup_${new Date().toISOString().split('T')[0]}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                showUINotification("Backup gerado e download iniciado!", "success");
            } else {
                showUINotification("Backup não retornou dados.", "warning");
            }
        } catch (e) {
            showUINotification("Falha ao gerar backup.", "error");
        }
    }
    function handleConfigRestore() { 
         if (cachedConfigs.simulacaoAtiva) {
            showUINotification("Restauração não disponível em modo de simulação. Desative a simulação e recarregue.", "warning", 4000);
            return;
        }
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = async (event) => {
                try {
                    const backupData = JSON.parse(event.target.result);
                    openGenericModal({
                        title: "Confirmar Restauração",
                        bodyHtml: "<p>Tem certeza que deseja restaurar os dados a partir deste backup? <strong>Todos os dados atuais serão substituídos.</strong></p>",
                        confirmText: "Restaurar",
                        contextClass: "danger-confirm",
                        onConfirm: async () => {
                            closeGenericModal(); 
                            showUINotification("Restaurando backup... Aguarde.", "info", 5000);
                            await fetchDataAPI('/configuracoes/restore', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(backupData)
                            });
                            showUINotification("Backup restaurado! Recarregando aplicação...", "success", 3000);
                            localStorage.removeItem('simulacaoAtiva'); 
                            setTimeout(() => window.location.reload(), 3000);
                        },
                        showCancelButton: true
                    });
                } catch (err) {
                    showUINotification("Arquivo de backup inválido ou corrompido.", "error");
                    console.error("Erro ao ler arquivo de backup:", err);
                }
            };
            reader.readAsText(file);
        };
        input.click();
    }
    async function handleConfigReset() { 
        openGenericModal({
            title: "Confirmar Reset Total",
            bodyHtml: "<p><strong>ATENÇÃO!</strong> Tem certeza que deseja resetar TODOS os dados da aplicação? Esta ação é irreversível e apagará alunos, salas, relatórios e configurações.</p>",
            confirmText: "RESETAR TUDO",
            contextClass: "danger-confirm", 
            onConfirm: async () => {
                closeGenericModal(); 
                showUINotification("Resetando dados... Aguarde.", "info", 5000);
                try {
                    await fetchDataAPI('/configuracoes/reset', { method: 'POST' }); 
                    showUINotification("Aplicação resetada! Recarregando...", "success", 3000);
                    cachedAlunos = []; cachedSalas = []; cachedRelatorios = []; 
                    cachedConfigs = { tema: localStorage.getItem('appTheme') || 'light', notificacoes: true, limiteBarulho: 70, simulacaoAtiva: false, salaPrincipalDashboardId: null };
                    localStorage.removeItem('simulacaoAtiva'); 
                    
                    setTimeout(() => window.location.reload(), 3000);
                } catch (e) {
                }
            },
            showCancelButton: true
        });
    }

    // --- SETUP DE EVENT LISTENERS ---
    function setupBaseEventListeners() {
        console.log("FN: setupBaseEventListeners");
        mainNavContainer.addEventListener('click', (e) => { 
            const navItem = e.target.closest('.nav-item');
            if (navItem && navItem.dataset.section) navigateToSection(navItem.dataset.section);
        });
        if (themeToggleBtnHeader) themeToggleBtnHeader.addEventListener('click', cycleAndSaveTheme);
        if (adminModeToggleBtnHeader) adminModeToggleBtnHeader.addEventListener('click', toggleAndSaveAdminMode);
        if (genericModalCloseBtn) genericModalCloseBtn.addEventListener('click', closeGenericModal);
        if (genericModalOverlay) genericModalOverlay.addEventListener('click', (e) => { if (e.target === genericModalOverlay) closeGenericModal(); });
    }
    function setupDynamicEventListeners() { 
        console.log("FN: setupDynamicEventListeners");

        if (refreshDashboardBtn) refreshDashboardBtn.addEventListener('click', () => {
             if(activeSectionId === 'inicio') updateDashboardUI(); 
             else showUINotification("Atualização manual disponível apenas no Dashboard.", "info", 2000);
        });
        if (dashToggleSalaBtn) dashToggleSalaBtn.addEventListener('click', handleToggleSalaAdaptadaDashboard);
        
        if (alunosOpenAddModalBtn) alunosOpenAddModalBtn.addEventListener('click', () => openAlunoFormModalUI());
        if (alunosSearchInput) alunosSearchInput.addEventListener('input', renderAlunosTableUI);
        if (alunosFilterAutismoSelect) alunosFilterAutismoSelect.addEventListener('change', renderAlunosTableUI);
        if (alunosTableBodyEl) { 
            alunosTableBodyEl.addEventListener('click', function(event) {
                const targetButton = event.target.closest('button');
                if (!targetButton) return;
                const alunoId = targetButton.closest('tr')?.dataset.alunoId;
                if (!alunoId) return;

                if (targetButton.classList.contains('aluno-view-btn')) openAlunoProfileModalUI(alunoId);
                else if (targetButton.classList.contains('aluno-edit-btn')) openAlunoFormModalUI(alunoId);
                else if (targetButton.classList.contains('aluno-delete-btn')) handleDeleteAluno(alunoId);
            });
        }

        if(chamadaSalaSelect) chamadaSalaSelect.addEventListener('change', handleSalaSelectChamada);
        if(chamadaStartBtn) chamadaStartBtn.addEventListener('click', handleChamadaStart);
        if(chamadaEndBtn) chamadaEndBtn.addEventListener('click', handleChamadaEnd);
        if(chamadaGerarRelatorioBtn) chamadaGerarRelatorioBtn.addEventListener('click', handleChamadaGerarRelatorio);
        
        if(relatoriosGerarBtn) relatoriosGerarBtn.addEventListener('click', handleGerarRelatorioTela);
        if(relatoriosTypeSelect) relatoriosTypeSelect.addEventListener('change', handleRelatorioTypeChange);
        
        if(settingsTabsContainer) settingsTabsContainer.addEventListener('click', (e)=>{
            const tabLink = e.target.closest('.tab-link');
            if(tabLink && tabLink.dataset.tabtarget) switchConfigTabUI(tabLink.dataset.tabtarget);
        });
        if(configSaveGeralBtn) configSaveGeralBtn.addEventListener('click', handleSaveConfigGeral);
        if(configOpenAddSalaModalBtn) configOpenAddSalaModalBtn.addEventListener('click', () => openConfigSalaFormModalUI());
        if (configNoiseLimitRange && configNoiseLimitValueEl) {
            configNoiseLimitRange.addEventListener('input', (e) => {
                configNoiseLimitValueEl.textContent = e.target.value;
            });
        }
        if(configBackupBtn) configBackupBtn.addEventListener('click', handleConfigBackup);
        if(configRestoreBtn) configRestoreBtn.addEventListener('click', handleConfigRestore);
        if(configResetBtn) configResetBtn.addEventListener('click', handleConfigReset);
        
        if(configSaveAdminBtn) configSaveAdminBtn.addEventListener('click', handleSaveAdminSettingsAndReload);

        if (configSalasTableBodyEl) { 
            configSalasTableBodyEl.addEventListener('click', function(event){
                const targetButton = event.target.closest('button');
                if(!targetButton) return;
                const salaId = targetButton.closest('tr')?.dataset.salaId;
                if(!salaId) return;

                if(targetButton.classList.contains('config-sala-edit-btn')) openConfigSalaFormModalUI(salaId);
                else if (targetButton.classList.contains('config-sala-delete-btn')) handleConfigDeleteSala(salaId);
            });
        }z
    }

    // --- INICIAR A APLICAÇÃO ---
    initializeApp(); 
});