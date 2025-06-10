document.addEventListener('DOMContentLoaded', () => {

    const DB_KEY = 'blackRussiaAdminDB_v8';
    const THEME_KEY = 'blackRussiaTheme';
    const SESSION_KEY = 'blackRussiaSession';
    const DEFAULT_AVATAR = 'https://placehold.co/100x100/2a2c2e/e5e5e5?text=BR';

    function loadData() {
        const data = localStorage.getItem(DB_KEY);
        if (data) {
            try {
                return JSON.parse(data);
            } catch (e) {
                console.error("Ошибка парсинга данных из localStorage", e);
                return createInitialData();
            }
        }
        return createInitialData();
    }
    
    function createInitialData() {
        return {
            administrators: [
                { id: 1, nickname: 'uktamovrasuljon58@gmail.com', position: 'Руководство Сервера', access: 'leader', avatar: DEFAULT_AVATAR, vk: '' },
                { id: 2, nickname: 'samuiliotka@gmail.com', position: 'Руководство Сервера', access: 'leader', avatar: DEFAULT_AVATAR, vk: '' }
            ],
            broadcastMessages: [{ text: "Панель успешно инициализирована. Добро пожаловать!", date: new Date().toLocaleString() }],
            normReports: {}
        };
    }

    function saveData() {
        try {
            localStorage.setItem(DB_KEY, JSON.stringify(db));
        } catch (e) {
            console.error("Не удалось сохранить данные в localStorage", e);
            showNotification("Произошла ошибка при сохранении данных", "error");
        }
    }
    
    let db = loadData();

    const POSITIONS = ['Младший Модератор', 'Модератор', 'Старший Модератор', 'Следящий за организацией', 'Администратор / Старший администратор', 'Главный следящий / Зам. главного следящего'];
    const NORMS = {
        'Младший Модератор': '120 минут в игре, 100 репортов, 25 реагирований.',
        'Модератор': '90 минут в игре, 90 репортов, 20 реагирований, 1 МП.',
        'Старший Модератор': '120 минут в игре, 80 репортов, 20 реагирований, 2 МП.',
        'Следящий за организацией': '120 минут в игре, 80 репортов, 25 реагирований, 1 МП.',
        'Администратор / Старший администратор': '120 минут в игре, 80 репортов, 30 реагирований, 1 МП.',
        'Главный следящий / Зам. главного следящего': '120 минут в игре, 60 репортов, 30 реагирований.',
    };
    const PROMOTION_SYSTEM = `<ul><li><strong>С Младшего Модератора на Модератора:</strong> минимум 60 баллов. <span>(Срок: 14 дней)</span></li><li><strong>С Модератора на Старшего Модератора:</strong> минимум 100 баллов. <span>(Срок: 21 день)</span></li><li><strong>Со Старшего Модератора на Администратора:</strong> минимум 120 баллов и должность Следящего. <span>(Срок: 28 дней)</span></li><li><strong>С Администратора на Старшего Администратора:</strong> минимум 150 баллов, актив, доверие и стаж от 35 дней.</li></ul>`;

    const views = document.querySelectorAll('.view');
    function showView(viewId) {
        views.forEach(view => {
            view.classList.remove('active');
            if (view.id === 'leader-reports-view') {
                view.classList.remove('mobile-chat-mode');
            }
        });
        const activeView = document.getElementById(viewId);
        if (activeView) {
            activeView.classList.add('active');
        }
    }

    function showNotification(message, type = 'info') {
        const container = document.getElementById('notification-container');
        if (!container) return;
        const notification = document.createElement('div');
        notification.classList.add('notification', type);
        const iconMap = { success: 'fa-check-circle', error: 'fa-exclamation-triangle', info: 'fa-info-circle' };
        const iconClass = iconMap[type] || 'fa-info-circle';
        notification.innerHTML = `<i class="fas ${iconClass}"></i><p>${message}</p>`;
        container.appendChild(notification);
        setTimeout(() => {
            notification.classList.add('fade-out');
            notification.addEventListener('animationend', () => notification.remove());
        }, 4000);
    }

    const themeSwitcher = document.getElementById('theme-switcher');
    function applyTheme(theme) {
        document.body.classList.toggle('light-theme', theme === 'light');
    }
    themeSwitcher.addEventListener('click', () => {
        const newTheme = document.body.classList.contains('light-theme') ? 'dark' : 'light';
        localStorage.setItem(THEME_KEY, newTheme);
        applyTheme(newTheme);
    });

    function handleLogin(admin) {
        sessionStorage.setItem(SESSION_KEY, admin.id);
        switch (admin.access) {
            case 'approved': renderAdminDashboard(admin); showView('admin-dashboard'); break;
            case 'pending': showView('pending-screen'); break;
            case 'leader': renderLeaderDashboard(); showView('leader-dashboard'); break;
            case 'revoked': showNotification('Ваш доступ отозван.', 'error'); logout(); break;
        }
    }

    function logout() {
        sessionStorage.removeItem(SESSION_KEY);
        document.getElementById('login-nickname').value = '';
        showView('welcome-screen');
    }

    document.getElementById('enter-button').addEventListener('click', () => showView('login-screen'));
    document.querySelectorAll('.back-button').forEach(button => button.addEventListener('click', e => showView(e.target.dataset.target)));
    document.querySelectorAll('.logout-button').forEach(button => button.addEventListener('click', logout));
    
    document.getElementById('login-submit-button').addEventListener('click', () => {
        const nickname = document.getElementById('login-nickname').value.trim();
        if (!nickname) { 
            showNotification('Пожалуйста, введите никнейм.', 'error');
            return; 
        }
        const admin = db.administrators.find(a => a.nickname.toLowerCase() === nickname.toLowerCase());
        if (!admin) {
            document.getElementById('register-nickname').value = nickname;
            populatePositions();
            showView('register-screen');
        } else {
            handleLogin(admin);
        }
    });

    document.getElementById('register-submit-button').addEventListener('click', () => {
        const nickname = document.getElementById('register-nickname').value;
        const position = document.getElementById('register-position').value;
        const newAdmin = { id: Date.now(), nickname, position, access: 'pending', avatar: DEFAULT_AVATAR, vk: '' };
        db.administrators.push(newAdmin);
        saveData();
        handleLogin(newAdmin);
        showNotification("Заявка успешно подана!", "success");
    });

    function renderAdminDashboard(admin) {
        document.getElementById('admin-greeting').textContent = `Добро пожаловать, ${admin.nickname}!`;
        renderAdminProfilePanel(admin); 
        document.getElementById('admin-norm').textContent = NORMS[admin.position] || 'Норма не найдена.';
        document.getElementById('promotion-system').innerHTML = PROMOTION_SYSTEM;
        renderBroadcastForAdmin();
    }
    
    function renderAdminProfilePanel(admin) {
        document.getElementById('profile-avatar-preview').src = admin.avatar || DEFAULT_AVATAR;
        document.getElementById('profile-nickname').textContent = admin.nickname;
        document.getElementById('profile-position').textContent = admin.position;
        document.getElementById('profile-vk-input').value = admin.vk || '';
    }
    
    document.getElementById('profile-avatar-upload').addEventListener('change', function() {
        if (this.files && this.files[0]) {
            const reader = new FileReader();
            reader.onload = (e) => { document.getElementById('profile-avatar-preview').src = e.target.result; }
            reader.readAsDataURL(this.files[0]);
        }
    });

    document.getElementById('save-profile-button').addEventListener('click', () => {
        const loggedInAdminId = parseInt(sessionStorage.getItem(SESSION_KEY));
        const admin = db.administrators.find(a => a.id === loggedInAdminId);
        if (admin) {
            admin.vk = document.getElementById('profile-vk-input').value.trim();
            admin.avatar = document.getElementById('profile-avatar-preview').src;
            saveData();
            showNotification('Профиль успешно сохранен!', 'success');
        }
    });

    function renderLeaderDashboard() {
        renderAdminListForManagement();
        renderBroadcastHistory();
    }
    
    function renderAdminListForManagement() {
        const listDiv = document.getElementById('admin-list-management');
        if(!listDiv) return;
        const otherAdmins = db.administrators.filter(a => a.access !== 'leader');
        listDiv.innerHTML = otherAdmins.length === 0
            ? '<p>Новых заявок или действующих администраторов нет.</p>'
            : otherAdmins.map(admin => {
                let actionsHtml = '';
                if (admin.access === 'pending') actionsHtml = `<button class="btn-approve small" data-id="${admin.id}">Принять</button> <button class="btn-reject small" data-id="${admin.id}">Отклонить</button>`;
                else if (admin.access === 'approved') actionsHtml = `<button class="btn-revoke small" data-id="${admin.id}">Отозвать доступ</button>`;
                return `<div class="admin-item" data-status="${admin.access}"><div class="admin-item-info"><img src="${admin.avatar || DEFAULT_AVATAR}" alt="Аватар"><div class="details"><strong>${admin.nickname}</strong><small>${admin.position}</small>${admin.vk ? `<a href="${admin.vk}" target="_blank" rel="noopener noreferrer">Профиль ВК</a>` : ''}</div><span data-status="${admin.access}">${admin.access}</span></div><div class="admin-item-actions">${actionsHtml}</div></div>`;
            }).join('');
    }

    const chatContainer = document.querySelector('.chat-container');
    const leaderReportsView = document.getElementById('leader-reports-view');
    const backToListBtn = leaderReportsView.querySelector('.back-to-list-btn');

    document.getElementById('view-reports-button').addEventListener('click', () => {
        renderLeaderReportsView();
        showView('leader-reports-view');
    });

    document.getElementById('report-chat-list').addEventListener('click', (e) => {
        const target = e.target.closest('.chat-list-item');
        if (target) {
            document.querySelectorAll('.chat-list-item').forEach(item => item.classList.remove('active'));
            target.classList.add('active');
            renderChatForAdmin(target.dataset.id);
            if (window.innerWidth <= 768) {
                leaderReportsView.classList.add('mobile-chat-mode');
                chatContainer.classList.add('mobile-chat-active');
            }
        }
    });

    backToListBtn.addEventListener('click', () => {
        leaderReportsView.classList.remove('mobile-chat-mode');
        chatContainer.classList.remove('mobile-chat-active');
    });

    function renderLeaderReportsView() {
        if(!leaderReportsView) return;
        chatContainer.classList.remove('mobile-chat-active');
        leaderReportsView.classList.remove('mobile-chat-mode');
        const chatList = document.getElementById('report-chat-list');
        const approvedAdmins = db.administrators.filter(admin => admin.access === 'approved');
        chatList.innerHTML = approvedAdmins.length > 0
            ? approvedAdmins.map(admin => `<div class="chat-list-item" data-id="${admin.id}"><img src="${admin.avatar || DEFAULT_AVATAR}" alt="Аватар"><div><strong>${admin.nickname}</strong><br><small>${admin.position}</small></div></div>`).join('')
            : '<p style="padding: 15px;">Нет действующих администраторов.</p>';
        document.getElementById('report-chat-window').innerHTML = `<div class="placeholder"><i class="fas fa-inbox"></i><p>Выберите администратора из списка.</p></div>`;
    }

    function renderChatForAdmin(adminId) {
        const chatWindow = document.getElementById('report-chat-window');
        if(!chatWindow) return;
        const reports = db.normReports[adminId] || [];
        const admin = db.administrators.find(a => a.id == adminId);
        if (!admin) { chatWindow.innerHTML = ''; return; }
        chatWindow.innerHTML = `<div class="chat-header"><h3>Отчеты от: <strong>${admin.nickname}</strong></h3>${admin.vk ? `<a href="${admin.vk}" target="_blank" rel="noopener noreferrer">Перейти в ВК</a>` : ''}</div>`;
        if (reports.length === 0) {
            chatWindow.innerHTML += '<p>Этот администратор еще не отправлял отчеты.</p>';
        } else {
            chatWindow.innerHTML += [...reports].reverse().map(report => `<div class="report-message"><div class="meta">Отправлено: ${report.date}</div><p>${report.text}</p><img src="${report.imageUrl}" alt="Скриншот отчета"></div>`).join('');
        }
    }
    
    function initialize() {
        applyTheme(localStorage.getItem(THEME_KEY) || 'dark');
        const loggedInAdminId = sessionStorage.getItem(SESSION_KEY);
        if (loggedInAdminId) {
            const admin = db.administrators.find(a => a.id === parseInt(loggedInAdminId));
            if (admin) { handleLogin(admin); return; }
        }
        showView('welcome-screen');
    }

    initialize();

    document.getElementById('admin-list-management').addEventListener('click', (e) => {
        const button = e.target.closest('button');
        if (!button) return;
        const adminId = parseInt(button.dataset.id, 10);
        const admin = db.administrators.find(a => a.id === adminId);
        if (!admin) return;
        if (button.classList.contains('btn-approve')) {
            admin.access = 'approved';
            showNotification(`Доступ для ${admin.nickname} одобрен.`, "success");
        }
        if (button.classList.contains('btn-reject')) {
            db.administrators = db.administrators.filter(a => a.id !== adminId);
            showNotification(`Заявка от ${admin.nickname} отклонена.`, "info");
        }
        if (button.classList.contains('btn-revoke')) {
            admin.access = 'revoked';
            showNotification(`Доступ для ${admin.nickname} отозван.`, "error");
        }
        saveData();
        renderAdminListForManagement();
    });

    document.getElementById('send-broadcast-button').addEventListener('click', () => {
        const message = document.getElementById('broadcast-message').value.trim();
        if (message) {
            db.broadcastMessages.unshift({ text: message, date: new Date().toLocaleString() });
            saveData();
            document.getElementById('broadcast-message').value = '';
            renderBroadcastHistory();
            showNotification("Объявление отправлено всем администраторам.", "success");
        }
    });

    const modal = document.getElementById('report-submission-modal');
    const imagePreview = document.getElementById('report-image-preview');
    const imageUpload = document.getElementById('report-image-upload');

    document.getElementById('submit-norm-button').addEventListener('click', () => modal.style.display = 'block');
    document.querySelector('.close-modal').addEventListener('click', () => { modal.style.display = 'none'; resetReportForm(); });
    
    imageUpload.addEventListener('change', function() {
        if (this.files && this.files[0]) {
            const reader = new FileReader();
            reader.onload = (e) => {
                imagePreview.src = e.target.result;
                imagePreview.classList.remove('hidden');
            }
            reader.readAsDataURL(this.files[0]);
        }
    });

    document.getElementById('send-report-button').addEventListener('click', () => {
        const text = document.getElementById('report-text').value.trim();
        const imageUrl = imagePreview.src;
        const loggedInAdminId = sessionStorage.getItem(SESSION_KEY);
        if (!loggedInAdminId || !imageUrl.startsWith('data:image') || !text) {
            showNotification('Прикрепите скриншот и заполните комментарий.', 'error');
            return;
        }
        const newReport = { reportId: Date.now(), date: new Date().toLocaleString(), text, imageUrl };
        if (!db.normReports[loggedInAdminId]) db.normReports[loggedInAdminId] = [];
        db.normReports[loggedInAdminId].push(newReport);
        saveData();
        showNotification('Отчет успешно отправлен!', 'success');
        modal.style.display = 'none';
        resetReportForm();
    });

    function resetReportForm() {
        imageUpload.value = '';
        imagePreview.src = '#';
        imagePreview.classList.add('hidden');
        document.getElementById('report-text').value = '';
    }

    function populatePositions() {
        document.getElementById('register-position').innerHTML = POSITIONS.map(pos => `<option value="${pos}">${pos}</option>`).join('');
    }

    function renderBroadcastForAdmin() {
        const panel = document.getElementById('admin-broadcast-panel');
        if(!panel) return;
        panel.innerHTML = (!db.broadcastMessages || db.broadcastMessages.length === 0)
            ? '<p>Объявлений пока нет.</p>'
            : db.broadcastMessages.slice(0, 3).map(msg => `<div class="report-message"><div class="meta">${msg.date}</div><p>${msg.text}</p></div>`).join('');
    }

    function renderBroadcastHistory() {
        const historyDiv = document.getElementById('broadcast-history');
        if(!historyDiv) return;
        historyDiv.innerHTML = '<h3><i class="fas fa-history"></i> История сообщений:</h3>';
        if (!db.broadcastMessages || db.broadcastMessages.length === 0) {
            historyDiv.innerHTML += '<p>Сообщений пока нет.</p>';
        } else {
            historyDiv.innerHTML += db.broadcastMessages.slice(0, 5).map(msg => `<p><strong>${msg.date}:</strong> ${msg.text}</p>`).join('');
        }
    }

    function refreshCurrentView() {
        const loggedInAdminId = parseInt(sessionStorage.getItem(SESSION_KEY));
        if (!loggedInAdminId) return;

        const admin = db.administrators.find(a => a.id === loggedInAdminId);
        if (!admin) return;

        const activeView = document.querySelector('.view.active');
        if (!activeView) return;

        switch (activeView.id) {
            case 'leader-dashboard':
                renderAdminListForManagement();
                renderBroadcastHistory();
                break;
            case 'admin-dashboard':
                renderBroadcastForAdmin();
                break;
            case 'leader-reports-view':
                const selectedAdmin = activeView.querySelector('.chat-list-item.active');
                renderLeaderReportsView();
                if(selectedAdmin) {
                    const reselected = activeView.querySelector(`.chat-list-item[data-id="${selectedAdmin.dataset.id}"]`);
                    if(reselected) {
                        reselected.classList.add('active');
                        renderChatForAdmin(reselected.dataset.id);
                    }
                }
                break;
        }
    }

    window.addEventListener('storage', (event) => {
        if (event.key === DB_KEY) {
            db = loadData();
            showNotification("Данные были обновлены в другой вкладке.", "info");
            refreshCurrentView();
        }
    });
});