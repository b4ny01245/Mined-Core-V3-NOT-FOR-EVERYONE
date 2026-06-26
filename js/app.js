// ============================================================================
// MINED // CORE_OS v2 - Fixed Version
// All bugs fixed: completed variable, storage quota, firebase config
// ============================================================================

// ─── MISSION SYSTEM ─────────────────────────────────────────────────
function startMission(category, index) {
    if (state.activeMission) {
        toast('Mission already active!', 'danger');
        return;
    }
    const templates = MISSION_TEMPLATES[category];
    if (!templates || !templates[index]) return;
    const template = templates[index];
    const missionKey = `${category}_${index}_${getTodayKey()}`;
    
    if (state.completedToday && state.completedToday[missionKey]) {
        toast('Already completed today!', 'info');
        return;
    }
    
    state.activeMission = {
        name: template.name,
        category: category,
        duration: FOCUS_MODES[state.settings.focusMode] || 45,
        rewardXP: template.rewardXP,
        rewardCoins: template.rewardCoins,
        startTime: Date.now(),
        endTime: Date.now() + (FOCUS_MODES[state.settings.focusMode] || 45) * 60 * 1000,
        templateIndex: index
    };
    
    timerRemaining = state.activeMission.duration * 60;
    timerTotal = timerRemaining;
    
    renderActiveMission();
    renderAll();
    startTimer();
    DB.save();
}

function completeMission(interrupted = false) {
    if (!state.activeMission) return;
    
    const missionKey = `${state.activeMission.category}_${state.activeMission.templateIndex}_${getTodayKey()}`;
    if (!state.completedToday) state.completedToday = {};
    
    if (!interrupted) {
        state.completedToday[missionKey] = true;
        state.stats.todayCompleted++;
        state.stats.todayXP += state.activeMission.rewardXP;
        state.wallet += state.activeMission.rewardCoins;
        state.xp[state.activeMission.category] = (state.xp[state.activeMission.category] || 0) + state.activeMission.rewardXP;
        
        playSound('complete');
        showLoot(rollLoot());
        toast(`+${state.activeMission.rewardXP} XP +₱${state.activeMission.rewardCoins}`, 'success');
    } else {
        state.stats.todayFailed++;
        const fine = Math.floor(state.activeMission.rewardCoins * getOverseerData().fineMultiplier);
        state.wallet = Math.max(0, state.wallet - fine);
        state.overseerVault += fine;
        playSound('fail');
        toast(`-₱${fine} to Overseer`, 'danger');
    }
    
    stopTimer();
    state.activeMission = null;
    checkAchievements();
    checkLockdown();
    renderAll();
    DB.save();
}

function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    
    timerInterval = setInterval(() => {
        timerRemaining--;
        
        if (timerRemaining <= 0) {
            completeMission(false);
            return;
        }
        
        if (timerRemaining % 60 === 0) playSound('tick');
        renderActiveMission();
    }, 1000);
}

function stopTimer() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = null;
}

function renderActiveMission() {
    if (!state.activeMission) return;
    
    const min = Math.floor(timerRemaining / 60);
    const sec = timerRemaining % 60;
    const progressPercent = ((timerTotal - timerRemaining) / timerTotal) * 100;
    
    const el = document.getElementById('active-mission-panel');
    if (!el) return;
    
    el.classList.remove('hidden');
    
    const timeStr = `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    const ringOffset = 628.32 * (1 - progressPercent / 100);
    
    document.getElementById('am-name').textContent = state.activeMission.name;
    document.getElementById('am-category').textContent = state.activeMission.category.toUpperCase();
    document.getElementById('am-time').textContent = timeStr;
    document.getElementById('am-ring').style.strokeDashoffset = ringOffset;
    
    const rightPanel = document.getElementById('rp-mission');
    if (rightPanel) {
        rightPanel.textContent = state.activeMission.name;
        document.getElementById('rp-timer').textContent = timeStr;
    }
}

// ─── RENDERING ──────────────────────────────────────────────────────
function renderAll() {
    updateTopBar();
    renderDashboard();
    renderMissions();
    renderSkills();
    renderLanguage();
    renderCommunication();
    renderHealth();
    renderHobbies();
    renderAnalytics();
    renderSettings();
}

function updateTopBar() {
    document.getElementById('top-wallet').textContent = '₱' + state.wallet;
    document.getElementById('top-xp').textContent = getTotalXP();
    document.getElementById('top-streak').textContent = state.streak.current;
}

function renderDashboard() {
    const sec = document.getElementById('sec-dashboard');
    if (!sec) return;
    
    const todayCompleted = state.stats.todayCompleted || 0;
    const todayTotal = todayCompleted + (state.stats.todayFailed || 0);
    const progressPercent = todayTotal > 0 ? Math.round((todayCompleted / todayTotal) * 100) : 0;
    
    document.getElementById('dash-wallet').textContent = '₱' + state.wallet;
    document.getElementById('dash-xp').textContent = getTotalXP();
    document.getElementById('dash-streak').textContent = state.streak.current + ' days';
    document.getElementById('dash-vault').textContent = '₱' + state.overseerVault;
    document.getElementById('dash-done').textContent = todayCompleted;
    document.getElementById('dash-total').textContent = todayTotal || 'Setup missions';
    document.getElementById('dash-progress-bar').style.width = progressPercent + '%';
    
    const overseerData = getOverseerData();
    document.getElementById('sidebar-ov-lvl').textContent = state.overseer.level;
    document.getElementById('sidebar-ov-title').textContent = overseerData.title;
    document.getElementById('dash-ov-name').textContent = overseerData.title;
    document.getElementById('dash-ov-taunt').textContent = getRandomFromArray(OVERSEER_TAUNTS);
}

function renderMissions() {
    const categories = ['daily', 'coding', 'health', 'hobbies'];
    const tabs = categories.map(cat => 
        `<button class="tab-btn ${cat === 'daily' ? 'active' : ''}" data-tab="missions-${cat}">${CATEGORY_LABELS[cat]}</button>`
    ).join('');
    
    document.getElementById('mission-tabs').innerHTML = tabs || '';
    
    categories.forEach(cat => {
        const missions = MISSION_TEMPLATES[cat] || [];
        const container = document.getElementById(`missions-${cat}`);
        if (!container) return;
        
        container.innerHTML = missions.map((m, i) => {
            const missionKey = `${cat}_${i}_${getTodayKey()}`;
            const isCompleted = state.completedToday && state.completedToday[missionKey];
            
            return `
            <div class="mcard p-3 ${isCompleted ? 'opacity-60 border-green-600' : 'hover:border-mine-accent/40'} cursor-pointer" onclick="startMission('${cat}',${i})">
              <div class="flex items-center gap-2 mb-2">
                <i class="fas ${m.icon} text-mine-accent"></i>
                <div class="flex-1">
                  <div class="font-bold text-sm">${m.name}${isCompleted ? ' ✅' : ''}</div>
                  <div class="text-xs text-mine-muted">${m.duration}m</div>
                </div>
              </div>
              <div class="text-xs font-mono"><span class="text-mine-cyan">+${m.rewardXP}XP</span> <span class="text-mine-accent">+₱${m.rewardCoins}</span></div>
            </div>`;
        }).join('');
    });
}

function renderSkills() {
    const el = document.getElementById('skill-grid');
    if (!el) return;
    
    el.innerHTML = SKILL_DEFS.map(skill => {
        const lvl = getSkillLevel(skill.id);
        const nextLvl = getXPForSkillLevel(lvl);
        const currentXP = (state.xp[skill.id] || 0) - (lvl > 0 ? SKILL_DEFS[SKILL_DEFS.findIndex(s => s.id === skill.id)].xpPerLvl * (lvl - 1) : 0);
        
        return `
        <div class="mcard p-4 text-center cursor-pointer hover:border-mine-accent/40" onclick="alert('${skill.name}: ${skill.desc}')">
          <div class="text-2xl mb-2"><i class="fas ${skill.icon} text-mine-accent"></i></div>
          <div class="text-xs font-mono text-mine-muted mb-1">LVL ${lvl}</div>
          <div class="text-xs font-bold">${skill.name}</div>
          <div class="xp-bar mt-2"><div class="xp-bar-fill bg-mine-accent" style="width:${Math.min(100, (currentXP / nextLvl) * 100)}%"></div></div>
        </div>`;
    }).join('');
}

function renderLanguage() {
    const el = document.getElementById('lang-vocab');
    if (!el) return;
    
    if (!state.language.vocab[state.language.current]) {
        state.language.vocab[state.language.current] = [];
    }
    
    const vocab = state.language.vocab[state.language.current] || [];
    el.innerHTML = vocab.map((v, i) => `
    <div class="flex justify-between items-center text-sm p-2 bg-mine-bg rounded">
      <span>${v.word || v}</span>
      <button class="text-xs text-red-400 hover:text-red-300" onclick="state.language.vocab['${state.language.current}'].splice(${i},1); renderLanguage(); DB.save();">✕</button>
    </div>`).join('');
}

function renderCommunication() {
    const el = document.getElementById('comm-stats');
    if (!el) return;
    
    const stats = state.communication || {};
    const statDefs = [
        { key: 'confidence', name: 'Confidence', icon: 'fa-hand-fist', color: 'text-red-400' },
        { key: 'fluency', name: 'Fluency', icon: 'fa-wind', color: 'text-cyan-400' },
        { key: 'consistency', name: 'Consistency', icon: 'fa-arrows-spin', color: 'text-green-400' },
        { key: 'vocabulary', name: 'Vocabulary', icon: 'fa-book', color: 'text-amber-400' }
    ];
    
    el.innerHTML = statDefs.map(s => {
        const val = stats[s.key] || 0;
        return `<div class="mcard p-4"><div class="text-xs text-mine-muted font-mono mb-1"><i class="fas ${s.icon} ${s.color} mr-1"></i>${s.name}</div><div class="font-display text-2xl font-black ${s.color}">${val}</div></div>`;
    }).join('');
}

function renderHealth() {
    const el = document.getElementById('health-missions');
    if (!el) return;
    
    const missions = MISSION_TEMPLATES.health || [];
    el.innerHTML = missions.map((m, i) => `
    <div class="mcard p-4 hover:border-green-800/40 cursor-pointer" onclick="startMission('health',${i})">
      <div class="flex items-center gap-3 mb-2">
        <div class="w-10 h-10 rounded-lg bg-green-900/30 flex items-center justify-center text-green-400"><i class="fas ${m.icon}"></i></div>
        <div><div class="font-bold text-sm">${m.name}</div><div class="text-xs text-mine-muted font-mono">${m.duration} min</div></div>
      </div>
      <div class="flex gap-3 text-xs font-mono"><span class="text-green-400">+${m.rewardXP} XP</span><span class="text-amber-400">+₱${m.rewardCoins}</span></div>
    </div>`).join('');
}

function renderHobbies() {
    const el = document.getElementById('hobby-grid');
    if (!el) return;
    
    el.innerHTML = HOBBY_DEFS.map(h => `
    <div class="mcard p-4 text-center cursor-pointer hover:border-mine-accent/40" onclick="alert('${h.name} hobby')">
      <div class="text-3xl mb-2"><i class="fas ${h.icon} ${h.color}"></i></div>
      <div class="font-bold text-sm">${h.name}</div>
      <div class="text-xs text-mine-muted mt-1">Track your hobby progress</div>
    </div>`).join('');
}

function renderAnalytics() {
    const el = document.getElementById('sec-analytics');
    if (!el || !el.classList.contains('active')) return;
    
    // Charts rendering would go here
    // For now, just show a placeholder
}

function renderSettings() {
    const el = document.getElementById('sec-settings');
    if (!el) return;
    
    // Add data management buttons if they don't exist
    if (!document.getElementById('data-reset')) {
        const settingsContent = el.querySelector('.mcard') || el;
        const html = `
        <div class="mcard p-4 sm:p-5 mb-4">
          <div class="text-xs text-mine-muted font-mono mb-4">DATA MANAGEMENT</div>
          <div class="flex gap-2 flex-wrap">
            <button class="mbtn mbtn-outline text-sm" id="data-export"><i class="fas fa-download mr-1"></i>Export Data</button>
            <button class="mbtn mbtn-outline text-sm" id="data-import"><i class="fas fa-upload mr-1"></i>Import Data</button>
            <button class="mbtn mbtn-danger text-sm" id="data-reset"><i class="fas fa-trash mr-1"></i>Reset All Data</button>
          </div>
        </div>
        <div class="mcard p-4 sm:p-5">
          <div class="text-xs text-mine-muted font-mono mb-4">FIREBASE (Optional)</div>
          <div class="space-y-3">
            <input type="text" id="firebase-api-key" class="w-full bg-mine-bg border border-mine-border rounded p-2 text-sm" placeholder="Firebase API Key">
            <input type="text" id="firebase-db-url" class="w-full bg-mine-bg border border-mine-border rounded p-2 text-sm" placeholder="Database URL">
            <button class="mbtn mbtn-accent text-sm" id="firebase-connect">Connect Firebase</button>
            <button class="mbtn mbtn-outline text-sm" id="firebase-disconnect">Disconnect</button>
          </div>
          <div class="text-xs mt-2 font-mono" id="firebase-status">Status: Local Storage Only</div>
        </div>`;
        
        if (settingsContent) {
          settingsContent.insertAdjacentHTML('afterend', html);
        }
    }
    
    // Attach event listeners for data management
    const exportBtn = document.getElementById('data-export');
    if (exportBtn) {
        exportBtn.onclick = () => {
            const json = JSON.stringify(state, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `mined_backup_${getTodayKey()}.json`;
            a.click();
            URL.revokeObjectURL(url);
            toast('Data exported!', 'success');
        };
    }
    
    const resetBtn = document.getElementById('data-reset');
    if (resetBtn) {
        resetBtn.onclick = () => {
            if (confirm('⚠️ This will DELETE ALL DATA. Are you sure?')) {
                state = getDefaultState();
                DB.save();
                toast('All data reset!', 'danger');
                location.reload();
            }
        };
    }
}

// ─── UTILITY FUNCTIONS ──────────────────────────────────────────────
function getTotalXP() {
    return Object.values(state.xp).reduce((a, b) => a + b, 0);
}

function getSkillLevel(skillId) {
    const xp = state.xp[skillId] || 0;
    let lvl = 1;
    for (let i = 1; i <= 10; i++) {
        const needed = (SKILL_DEFS.find(s => s.id === skillId)?.xpPerLvl || 100) * i;
        if (xp >= needed) lvl = i + 1;
        else break;
    }
    return Math.min(lvl, 10);
}

function getXPForSkillLevel(lvl) {
    return 100 + lvl * 100;
}

function getOverseerData() {
    return OVERSEER_LEVELS[Math.min(state.overseer.level - 1, OVERSEER_LEVELS.length - 1)] || OVERSEER_LEVELS[0];
}

function getTodayKey() {
    return new Date().toISOString().split('T')[0];
}

function checkAchievements() {
    ACHIEVEMENT_DEFS.forEach(def => {
        if (!state.achievements.includes(def.id) && def.check(state)) {
            state.achievements.push(def.id);
            toast(`🏆 Achievement: ${def.name}`, 'epic');
        }
    });
}

function checkLockdown() {
    if (state.wallet < 500 && !state.lockdown) {
        state.lockdown = true;
        toast('🔒 LOCKDOWN ACTIVATED - Wallet below ₱500', 'danger');
    } else if (state.wallet >= 700 && state.lockdown) {
        state.lockdown = false;
        toast('✅ Lockdown lifted!', 'success');
    }
}

function checkTodayReset() {
    const today = getTodayKey();
    if (state.stats.todayDate !== today) {
        if (state.stats.todayDate && state.stats.todayCompleted > 0) {
            state.streak.current++;
            state.streak.best = Math.max(state.streak.best, state.streak.current);
        } else {
            state.streak.current = 0;
        }
        state.stats.todayDate = today;
        state.stats.todayCompleted = 0;
        state.stats.todayFailed = 0;
        state.stats.todayXP = 0;
        state.completedToday = {};
        DB.save();
    }
}

function getRandomFromArray(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function rollLoot() {
    const totalWeight = LOOT_TABLE.reduce((sum, item) => sum + item.weight, 0);
    let roll = Math.random() * totalWeight;
    for (let item of LOOT_TABLE) {
        roll -= item.weight;
        if (roll <= 0) return item;
    }
    return LOOT_TABLE[0];
}

function showLoot(item) {
    const colors = {
        common: 'text-gray-400',
        rare: 'text-blue-400',
        epic: 'text-purple-400',
        legendary: 'text-amber-400'
    };
    const el = document.getElementById('loot-card');
    if (!el) return;
    
    el.innerHTML = `
    <div class="text-5xl mb-4">${item.rarity === 'legendary' ? '✨' : item.rarity === 'epic' ? '⭐' : '📦'}</div>
    <div class="text-sm text-mine-muted mb-2 font-mono">LOOT DROP</div>
    <div class="text-2xl font-bold mb-2 ${colors[item.rarity]}">${item.name}</div>
    <div class="text-xs text-mine-muted font-mono mt-4">${item.rarity.toUpperCase()}</div>`;
    
    const overlay = document.getElementById('loot-overlay');
    if (overlay) {
        overlay.classList.remove('hidden');
        overlay.classList.add('flex');
        setTimeout(() => {
            overlay.classList.add('hidden');
            overlay.classList.remove('flex');
        }, 2500);
    }
    playSound('loot');
}

function toast(msg, type = 'info') {
    const colors = {
        success: 'bg-green-900/80 border border-green-600 text-green-200',
        danger: 'bg-red-900/80 border border-red-600 text-red-200',
        info: 'bg-blue-900/80 border border-blue-600 text-blue-200',
        epic: 'bg-purple-900/80 border border-purple-600 text-purple-200'
    };
    const el = document.createElement('div');
    el.className = `toast ${colors[type] || colors.info}`;
    el.textContent = msg;
    const container = document.getElementById('toast-container');
    if (container) container.appendChild(el);
    setTimeout(() => el.remove(), 3000);
}

function playSound(type) {
    if (state.settings.sound === 'off') return;
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        if (type === 'complete') {
            osc.frequency.value = 880;
            gain.gain.value = 0.1;
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
            osc.start();
            osc.stop(ctx.currentTime + 0.3);
        } else if (type === 'loot') {
            osc.frequency.value = 1200;
            gain.gain.value = 0.1;
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
            osc.start();
            osc.stop(ctx.currentTime + 0.3);
        }
    } catch (e) {}
}

// ─── INITIALIZATION ─────────────────────────────────────────────────
function init() {
    try {
        DB.load();
        checkTodayReset();
        checkLockdown();
        
        if (!state.completedToday) state.completedToday = {};
        
        renderAll();
        
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => {
                const section = item.dataset.sec;
                document.querySelectorAll('.sec-panel').forEach(p => p.classList.remove('active'));
                document.getElementById('sec-' + section)?.classList.add('active');
                document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
                item.classList.add('active');
                
                const sidebar = document.getElementById('sidebar');
                if (sidebar) sidebar.classList.remove('open');
            });
        });
        
        const menuToggle = document.getElementById('menu-toggle');
        if (menuToggle) {
            menuToggle.onclick = () => document.getElementById('sidebar')?.classList.toggle('open');
        }
        
        if (state.activeMission) {
            const remaining = Math.floor((state.activeMission.endTime - Date.now()) / 1000);
            if (remaining > 0) {
                timerRemaining = remaining;
                timerTotal = state.activeMission.duration * 60;
                renderActiveMission();
                startTimer();
            } else {
                completeMission(false);
            }
        }
        
        console.log('%c MINED // CORE_OS v2 FIXED ', 'background:#f0a500;color:#08080e;font-weight:bold;font-size:14px;padding:4px 8px');
    } catch (err) {
        console.error('Init error:', err);
        toast('Error: ' + err.message, 'danger');
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
