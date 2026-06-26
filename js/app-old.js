// ─── MISSION SYSTEM ─────────────────────────────────────────────────
function startMission(catKey, missionIdx) {
    if (state.activeMission) { toast('Mission already active! Complete or fail it first.', 'danger'); return; }
    const m = MISSION_TEMPLATES[catKey][missionIdx];
    const today = getTodayKey();

    if (state.completedToday[m.id] === today) {
        toast(
            'Mission already completed today.',
            'info'
        );
        return;
    }
    if (!m) return;
    // Lockdown: block entertainment
    if (state.lockdown && (catKey === 'hobbies')) { toast('LOCKDOWN: Entertainment blocked. Focus on recovery.', 'danger'); return; }
    let duration = FOCUS_MODES[state.settings.focusMode] || m.duration;
    // Overseer timer reduction
    const ov = getOverseerData();
    duration = Math.max(5, Math.round(duration * (1 - ov.timerReduction)));
    // Focus skill bonus
    const focusLvl = getSkillLevel('focus');
    if (focusLvl > 0) duration = Math.round(duration * (1 + focusLvl * 0.02));

    state.activeMission = {
        id: m.id,
        name: m.name,
        category: catKey,
        duration: duration,
        rewardXP: m.rewardXP,
        rewardCoins: m.rewardCoins,
        icon: m.icon,
        startTime: Date.now(),
        endTime: Date.now() + (duration * 60 * 1000)
    };
    timerTotal = duration * 60;
    timerRemaining = timerTotal;
    DB.save();
    renderActiveMission();
    startTimer();
    toast(`Mission started: ${m.name}`, 'accent');
}

function startTimer() {
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        if (timerRemaining > 0) {
            timerRemaining--;
            updateTimerDisplay();
            if (timerRemaining <= 60 && timerRemaining % 10 === 0) playSound('tick');
        } else {
            clearInterval(timerInterval);
            failMission(true); // timer expired
        }
    }, 1000);
}

function updateTimerDisplay() {
    const t = formatTime(timerRemaining);
    document.getElementById('am-time').textContent = t;
    document.getElementById('rp-timer').textContent = t;
    // Update ring
    const circumference = 2 * Math.PI * 100;
    const progress = timerRemaining / timerTotal;
    const offset = circumference * (1 - progress);
    const ring = document.getElementById('am-ring');
    if (ring) { ring.style.strokeDashoffset = offset; ring.style.stroke = timerRemaining <= 60 ? 'var(--danger)' : 'var(--accent)'; }
    // Pulse if low time
    const timeEl = document.getElementById('am-time');
    if (timerRemaining <= 60 && timerRemaining > 0) timeEl.classList.add('pulse-danger');
    else timeEl.classList.remove('pulse-danger');
}

function completeMission() {
    if (!state.activeMission) return;
    clearInterval(timerInterval);
    const m = state.activeMission;
    let xpGain = m.rewardXP, coinGain = m.rewardCoins;
    // Discipline skill bonus
    const discLvl = getSkillLevel('discipline');
    if (discLvl > 0) xpGain = Math.round(xpGain * (1 + discLvl * 0.05));
    // Double XP buff
    const doubleIdx = state.loot.findIndex(l => l.effect === 'buff' && l.value === 'double_xp' && !l.used);
    if (doubleIdx >= 0) { xpGain *= 2; state.loot[doubleIdx].used = true; toast('Double XP buff used!', 'epic'); }

    // Apply rewards
    const catMap = { daily: 'daily', coding: 'coding', health: 'health', hobbies: 'creativity', learning: 'coding', language: 'language', communication: 'communication', recovery: 'health' };
    const xpCat = catMap[m.category] || 'daily';
    state.xp[xpCat] = (state.xp[xpCat] || 0) + xpGain;
    state.wallet += coinGain;
    state.stats.missionsCompleted++;
    state.stats.todayCompleted++;
    state.stats.todayXP += xpGain;
    state.completedToday[m.id] = getTodayKey();
    state.stats.totalFocusMinutes += Math.round((timerTotal - timerRemaining) / 60);
    if (!state.stats.completedMissions.includes(m.name)) state.stats.completedMissions.push(m.name);
    if (m.category === 'coding' && timerTotal >= 5400) state.stats.deepWorkCompleted++;
    if (timerTotal >= 10800) state.stats.marathonsCompleted++;

    // Loot drop
    const lootChance = 0.4; // 40% base
    if (Math.random() < lootChance) rollLoot();

    // Check achievements
    checkAchievements();

    state.activeMission = null;
    DB.save();
    playSound('complete');
    toast(`Mission complete! +${xpGain} XP, +₱${coinGain}`, 'success');
    renderAll();
}

function failMission(timerExpired = false) {
    if (!state.activeMission) return;
    clearInterval(timerInterval);
    const m = state.activeMission;
    const ov = getOverseerData();
    let fine = Math.round(100 * ov.fineMultiplier);
    // Resilience skill reduction
    const resLvl = getSkillLevel('resilience');
    if (resLvl > 0) fine = Math.round(fine * (1 - resLvl * 0.05));
    fine = Math.min(fine, state.wallet); // can't go negative

    state.wallet -= fine;
    state.overseerVault += fine;
    state.stats.missionsFailed++;
    state.stats.todayFailed++;
    // Overseer XP gain
    state.overseer.xp += fine;
    if (state.overseer.xp >= state.overseer.level * 200 && state.overseer.level < 6) {
        state.overseer.level++;
        state.overseer.xp = 0;
        toast(`OVERSEER LEVELED UP to ${getOverseerData().title}!`, 'danger');
    }

    if (m.category !== 'recovery') state.stats.daysWithoutFailure = 0;

    state.activeMission = null;
    checkLockdown();
    checkAchievements();
    DB.save();
    playSound('fail');
    toast(`${timerExpired ? 'Timer expired!' : 'Mission failed!'} -₱${fine}. ${getOverseerData().title} gains ground.`, 'danger');
    renderAll();
}

function pauseInterruption(type) {
    if (!state.activeMission) return;
    clearInterval(timerInterval);
    const it = INTERRUPTION_TYPES.find(i => i.id === type);
    if (!it) return;
    if (it.penalty > 0) {
        state.wallet = Math.max(0, state.wallet - it.penalty);
        toast(`Interruption: ${it.label}. -₱${it.penalty}`, 'danger');
    } else {
        toast(`Interruption: ${it.label}. No penalty.`, 'info');
    }
    if (it.createsRecovery) {
        toast('Recovery mission created. Take a break.', 'info');
    }
    checkLockdown();
    DB.save();
    // Resume after 2 seconds
    setTimeout(() => { if (state.activeMission) startTimer(); }, 2000);
    renderAll();
}

// ─── LOOT SYSTEM ────────────────────────────────────────────────────
function rollLoot() {
    const totalWeight = LOOT_TABLE.reduce((s, l) => s + l.weight, 0);

    let roll = Math.random() * totalWeight;

    for (const item of LOOT_TABLE) {
        roll -= item.weight;

        if (roll <= 0) {

            showLootCard(item);

            if (item.effect === 'xp') {
                const categoryMap = {
                    coding: 'coding',
                    health: 'health',
                    language: 'language',
                    communication: 'communication',
                    hobbies: 'creativity',
                    learning: 'coding',
                    recovery: 'health',
                    daily: 'daily'
                };

                const xpCat =
                    categoryMap[state.activeMission?.category] || 'daily';

                state.xp[xpCat] =
                    (state.xp[xpCat] || 0) + item.value;
            } else if (item.effect === 'coins') {
                state.wallet += item.value;

            } else {
                state.loot.push({
                    ...item,
                    used: false,
                    obtainedAt: Date.now()
                });
            }

            playSound('loot');
            DB.save();

            return item;
        }
    }

    return null;
}

function showLootCard(item) {
    const overlay = document.getElementById('loot-overlay');
    const card = document.getElementById('loot-card');
    const rarityColors = { common: 'border-gray-500', rare: 'border-blue-500', epic: 'border-purple-500', legendary: 'border-amber-500' };
    const rarityLabels = { common: 'COMMON', rare: 'RARE', epic: 'EPIC', legendary: 'LEGENDARY' };
    card.className = `mcard p-8 text-center loot-reveal max-w-sm w-11/12 border-2 ${rarityColors[item.rarity]}`;
    card.innerHTML = `
    <div class="text-xs font-mono rarity-${item.rarity} mb-2">${rarityLabels[item.rarity]}</div>
    <div class="font-display text-xl font-black mb-2">${item.name}</div>
    <div class="text-sm text-mine-muted">Loot obtained!</div>
    <button class="mbtn mbtn-accent mt-4" onclick="document.getElementById('loot-overlay').classList.add('hidden');document.getElementById('loot-overlay').classList.remove('flex');">Claim</button>
  `;
    overlay.classList.remove('hidden');
    overlay.classList.add('flex');
}

// ─── ACHIEVEMENTS ───────────────────────────────────────────────────
function checkAchievements() {
    let newUnlock = false;
    for (const ach of ACHIEVEMENT_DEFS) {
        if (!state.achievements.includes(ach.id) && ach.check(state)) {
            state.achievements.push(ach.id);
            toast(`Achievement Unlocked: ${ach.name}!`, 'epic');
            newUnlock = true;
        }
    }
    if (newUnlock) DB.save();
}

// ─── AI SYSTEM ──────────────────────────────────────────────────────
async function sendAI(message) {
    const role = AI_ROLES.find(r => r.id === state.settings.aiRole) || AI_ROLES[0];
    const provider = state.settings.aiProvider;

    if (provider === 'none') {
        // Local response generation
        const responses = {
            partner: [`You've got this! Keep pushing forward.`, "I believe in you. One step at a time.", "Great progress today! Let's keep the momentum.", "Remember: progress, not perfection.", "I'm here with you. Let's tackle this together."],
            rival: [`I just finished 3 tasks while you typed that.`, "You call that productivity? I've seen better from a script.", "My streak is longer than yours. Always.", "Step up or step aside.", "I'm already on the next level. Catch up."],
            mentor: ["Focus on systems, not goals. The process is the prize.", "What's the one thing that would make today a win?", "Consider: are you working on what matters, or what's urgent?", "The obstacle is the way. Embrace the difficulty.", "Reflect on your progress. You've come further than you think."],
            gamer: ["Quest accepted! Let's grind this out.", "XP grind mode: ACTIVE. Let's go!", "That's a side quest worth pursuing!", "Critical hit! Your productivity just leveled up.", "New achievement incoming, I can feel it!"],
            coach: ["No excuses. Get it done.", "You know what to do. Now do it.", "Discipline beats motivation every time.", "Focus. Execute. Complete. Repeat.", "The only person you need to beat is yesterday's you."]
        };
        const pool = responses[role.id] || responses.partner;
        return pool[Math.floor(Math.random() * pool.length)];
    }

    try {
        if (provider === 'ollama') {
            const endpoint = state.settings.aiKey || 'http://localhost:11434';
            const model = state.settings.aiModel || 'llama3';
            const res = await fetch(`${endpoint}/api/chat`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ model, messages: [{ role: 'system', content: role.prompt }, { role: 'user', content: message }], stream: false })
            });
            const data = await res.json();
            return data.message?.content || "No response from Ollama.";
        } else if (provider === 'gemini') {
            const key = state.settings.aiKey;
            const model = state.settings.aiModel || 'gemini-pro';
            const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: `${role.prompt}\n\nUser: ${message}` }] }] })
            });
            const data = await res.json();
            return data.candidates?.[0]?.content?.parts?.[0]?.text || "No response from Gemini.";
        } else if (provider === 'openrouter') {
            const key = state.settings.aiKey;
            const model = state.settings.aiModel || 'meta-llama/llama-3-8b-instruct';
            const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
                body: JSON.stringify({ model, messages: [{ role: 'system', content: role.prompt }, { role: 'user', content: message }] })
            });
            const data = await res.json();
            return data.choices?.[0]?.message?.content || "No response from OpenRouter.";
        }
    } catch (e) {
        return `AI Error: ${e.message}. Check your configuration in Settings.`;
    }
    return "No AI provider configured. Set one up in Settings.";
}

// ─── RENDERING ──────────────────────────────────────────────────────

function renderAll() {
    checkTodayReset();
    renderTopBar();
    renderDashboard();
    renderMissions();
    renderSkills();
    renderLanguage();
    renderCommunication();
    renderHealth();
    renderHobbies();
    renderRightPanel();
    renderAnalytics();
    renderSettings();
    if (state.activeMission) renderActiveMission();
    else document.getElementById('active-mission-panel').classList.add('hidden');
    // Lockdown badge
    if (state.lockdown) { document.getElementById('lockdown-badge').classList.remove('hidden'); document.body.classList.add('lockdown-active'); }
    else { document.getElementById('lockdown-badge').classList.add('hidden'); document.body.classList.remove('lockdown-active'); }
}

function renderTopBar() {
    document.getElementById('top-wallet').textContent = `₱${state.wallet}`;
    document.getElementById('top-xp').textContent = Object.values(state.xp).reduce((a, b) => a + b, 0).toLocaleString();
    document.getElementById('top-streak').textContent = state.streak.current;
    document.getElementById('sidebar-ov-lvl').textContent = state.overseer.level;
    document.getElementById('sidebar-ov-title').textContent = getOverseerData().title;
}

function renderDashboard() {
    document.getElementById('dash-wallet').textContent = `₱${state.wallet}`;
    document.getElementById('dash-xp').textContent = Object.values(state.xp).reduce((a, b) => a + b, 0).toLocaleString();
    document.getElementById('dash-streak').textContent = `${state.streak.current} days`;
    document.getElementById('dash-vault').textContent = `₱${state.overseerVault}`;
    document.getElementById('dash-done').textContent = state.stats.todayCompleted;
    document.getElementById('dash-total').textContent = state.stats.todayCompleted + state.stats.todayFailed + (state.activeMission ? 1 : 0);
    const total = state.stats.todayCompleted + state.stats.todayFailed;
    document.getElementById('dash-progress-bar').style.width = total > 0 ? `${Math.round(state.stats.todayCompleted / total * 100)}%` : '0%';

    // XP Tracks
    const trackEl = document.getElementById('dash-xp-tracks');
    const trackColors = { coding: '#f0a500', health: '#00ff88', language: '#00e5ff', communication: '#ff6b6b', creativity: '#c850ff', daily: '#8a8a9a' };
    trackEl.innerHTML = Object.entries(state.xp).map(([k, v]) => {
        const lvl = getSkillLevel(k); const nextXP = getXPForSkillLevel(lvl);
        const progress = lvl < 10 ? (v % nextXP) / nextXP * 100 : 100;
        return `<div><div class="flex justify-between text-xs mb-1"><span class="capitalize font-mono">${k}</span><span>Lv${lvl} — ${v} XP</span></div><div class="xp-bar"><div class="xp-bar-fill" style="width:${progress}%;background:${trackColors[k] || '#f0a500'}"></div></div></div>`;
    }).join('');

    // Overseer
    const ovData = getOverseerData();
    document.getElementById('dash-ov-name').textContent = `THE ${ovData.title.toUpperCase()}`;
    document.getElementById('dash-ov-taunt').textContent = `"${OVERSEER_TAUNTS[Math.floor(Math.random() * OVERSEER_TAUNTS.length)]}"`;

    // Achievements
    const achEl = document.getElementById('dash-achievements');
    const unlocked = state.achievements.map(id => ACHIEVEMENT_DEFS.find(a => a.id === id)).filter(Boolean);
    achEl.innerHTML = unlocked.length ? unlocked.slice(-5).reverse().map(a => `<div class="flex items-center gap-2"><i class="fas ${a.icon} text-mine-accent"></i><span>${a.name}</span><span class="text-mine-muted text-xs">— ${a.desc}</span></div>`).join('') : '<div class="text-mine-muted text-sm">No achievements yet. Start completing missions!</div>';
}

function renderMissions() {
    // Tabs
    const tabsEl = document.getElementById('mission-tabs');
    const cats = Object.keys(MISSION_TEMPLATES);
    tabsEl.innerHTML = cats.map(c => `<button class="tab-btn ${c === cats[0] ? 'active' : ''}" data-mcat="${c}">${CATEGORY_LABELS[c] || c}</button>`).join('');
    tabsEl.querySelectorAll('.tab-btn').forEach(btn => {
        btn.onclick = () => {
            tabsEl.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderMissionList(btn.dataset.mcat);
        };
    });
    renderMissionList(cats[0]);
}

function renderMissionList(catKey) {
    const list = document.getElementById('mission-list');
    const missions = MISSION_TEMPLATES[catKey] || [];
    const isLocked = state.lockdown && (catKey === 'hobbies');
    list.innerHTML = missions.map((m, i) => {

        const missionId = m.id;
        const completed =
            state.completedToday[missionId] === getTodayKey();

        return `
        <div class="mcard p-4
            ${completed ? 'opacity-50 border-green-500' : ''}
            ${isLocked ? 'opacity-40 pointer-events-none' : ''}
            hover:border-mine-accent/40 cursor-pointer slide-up"
    
            style="animation-delay:${i * 50}ms"
    
            ${completed
                ? ''
                : `onclick="startMission('${catKey}',${i})"`}>
    
          <div class="flex items-center gap-3 mb-2">
            <div class="w-10 h-10 rounded-lg bg-mine-elevated flex items-center justify-center text-mine-accent">
              <i class="fas ${m.icon}"></i>
            </div>
    
            <div>
              <div class="font-bold text-sm">
                ${m.name}
                ${completed ? '✅' : ''}
              </div>
    
              <div class="text-xs text-mine-muted font-mono">
                ${m.duration} min
              </div>
            </div>
          </div>
    
          <div class="flex gap-3 text-xs font-mono">
            <span class="text-mine-accent">+${m.rewardXP} XP</span>
            <span class="text-amber-400">+₱${m.rewardCoins}</span>
          </div>
    
          ${completed
                ? '<div class="mt-2 text-green-400 text-xs font-mono">COMPLETED TODAY</div>'
                : ''
            }
        </div>
        `;
    }).join('');
    if (isLocked) list.innerHTML += `<div class="mcard p-4 border-red-800 glow-danger"><div class="text-red-400 font-bold">LOCKDOWN ACTIVE</div><div class="text-sm text-mine-muted">Entertainment missions blocked. Complete recovery/health/coding missions to rebuild your wallet.</div></div>`;
}

function renderActiveMission() {
    const panel = document.getElementById('active-mission-panel');
    if (!state.activeMission) { panel.classList.add('hidden'); return; }
    panel.classList.remove('hidden');
    const m = state.activeMission;
    document.getElementById('am-name').textContent = m.name;
    document.getElementById('am-category').textContent = CATEGORY_LABELS[m.category] || m.category;
    document.getElementById('am-mode').textContent = FOCUS_LABELS[state.settings.focusMode] || 'FOCUS';

    // Interruption buttons
    const intEl = document.getElementById('interruption-btns');
    intEl.innerHTML = INTERRUPTION_TYPES.map(it => `<button class="mbtn mbtn-outline text-xs" onclick="pauseInterruption('${it.id}')"><i class="fas ${it.icon} mr-1"></i>${it.label}${it.penalty > 0 ? ` (-₱${it.penalty})` : ''}</button>`).join('');

    // Complete/Fail buttons
    document.getElementById('am-complete').onclick =
        () => {

            pendingMissionCompletion = true;

            document
                .getElementById('mission-photo')
                .click();
        };
    document.getElementById('am-fail').onclick = () => failMission(false);
}

function renderSkills() {
    const grid = document.getElementById('skill-grid');
    grid.innerHTML = SKILL_DEFS.map(sk => {
        const lvl = getSkillLevel(sk.id);
        const xp = state.xp[sk.id] || 0;
        const nextXP = getXPForSkillLevel(lvl);
        const progress = lvl < 10 ? (xp % nextXP) / nextXP * 100 : 100;
        const unlocked = lvl > 0;
        return `<div class="skill-node ${unlocked ? 'unlocked' : 'available'}" onclick="showSkillDetail('${sk.id}')">
      <i class="fas ${sk.icon} text-lg ${unlocked ? 'text-mine-accent' : 'text-mine-cyan'}"></i>
      <div class="text-[10px] font-mono mt-1">Lv${lvl}</div>
      <div class="absolute -bottom-6 text-[9px] text-mine-muted whitespace-nowrap">${sk.name}</div>
    </div>`;
    }).join('');

    showSkillDetail(SKILL_DEFS[0].id);
}

function showSkillDetail(skillId) {
    const sk = SKILL_DEFS.find(s => s.id === skillId);
    if (!sk) return;
    const lvl = getSkillLevel(skillId);
    const xp = state.xp[skillId] || 0;
    const nextXP = getXPForSkillLevel(lvl);
    const progress = lvl < 10 ? (xp % nextXP) / nextXP * 100 : 100;
    const el = document.getElementById('skill-detail');
    el.innerHTML = `
    <div class="flex items-center gap-4 mb-4">
      <div class="w-14 h-14 rounded-full bg-mine-elevated border-2 border-mine-accent flex items-center justify-center text-2xl text-mine-accent"><i class="fas ${sk.icon}"></i></div>
      <div><div class="font-display text-xl font-bold">${sk.name}</div><div class="text-sm text-mine-muted">${sk.desc}</div></div>
    </div>
    <div class="flex items-center gap-4 mb-2">
      <span class="font-mono text-sm">Level ${lvl} / ${sk.maxLvl}</span>
      <span class="font-mono text-xs text-mine-muted">${lvl < 10 ? `${xp % nextXP} / ${nextXP} XP` : 'MAX'}</span>
    </div>
    <div class="xp-bar mb-4"><div class="xp-bar-fill bg-mine-accent" style="width:${progress}%"></div></div>
    <div class="text-xs text-mine-muted">Perks at level: ${[1, 3, 5, 7, 10].filter(l => l <= lvl).map(l => `<span class="text-mine-accent">Lv${l}</span>`).join(', ') || 'None yet'}</div>
  `;
}

function renderLanguage() {
    const selEl = document.getElementById('lang-select');
    selEl.innerHTML = LANGUAGES.map(l => `<button class="tab-btn ${l === state.language.current ? 'active' : ''}" data-lang="${l}">${l}</button>`).join('');
    selEl.querySelectorAll('.tab-btn').forEach(btn => {
        btn.onclick = () => {
            selEl.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.language.current = btn.dataset.lang;
            if (!state.language.vocab[state.language.current]) state.language.vocab[state.language.current] = [];
            DB.save(); renderLanguage();
        };
    });

    const vocab = state.language.vocab[state.language.current] || [];
    const vocabEl = document.getElementById('lang-vocab');
    vocabEl.innerHTML = vocab.length ? vocab.map((w, i) => `
    <div class="flex items-center justify-between p-2 bg-mine-bg rounded">
      <div><span class="font-bold text-sm">${w.word}</span>${w.translation ? ` — <span class="text-mine-cyan text-sm">${w.translation}</span>` : ''}</div>
      <button class="text-mine-muted hover:text-red-400 text-xs" onclick="removeVocab(${i})"><i class="fas fa-times"></i></button>
    </div>
  `).join('') : '<div class="text-mine-muted text-sm">No vocabulary yet. Add words to start learning!</div>';

    // Language XP
    const xpEl = document.getElementById('lang-xp-display');
    const langXP = state.xp.language || 0;
    const langLvl = getSkillLevel('language');
    xpEl.innerHTML = `<div class="font-display text-3xl font-black text-mine-cyan">${langXP}</div><div class="text-sm text-mine-muted">Language XP — Level ${langLvl}</div>`;

    document.getElementById('lang-add-vocab').onclick = () => {
        showModal('Add Vocabulary Word', `
      <div class="space-y-3">
        <div><label class="text-xs text-mine-muted">Word</label><input id="vocab-word" class="w-full bg-mine-bg border border-mine-border rounded p-2 text-sm mt-1" placeholder="こんにちは"></div>
        <div><label class="text-xs text-mine-muted">Translation</label><input id="vocab-trans" class="w-full bg-mine-bg border border-mine-border rounded p-2 text-sm mt-1" placeholder="Hello"></div>
      </div>
    `, () => {
            const word = document.getElementById('vocab-word').value.trim();
            const trans = document.getElementById('vocab-trans').value.trim();
            if (!word) return;
            if (!state.language.vocab[state.language.current]) state.language.vocab[state.language.current] = [];
            state.language.vocab[state.language.current].push({ word, translation: trans });
            DB.save(); renderLanguage(); closeModal();
            toast('Vocabulary added!', 'success');
        });
    };

    document.getElementById('lang-flashcard').onclick = () => {
        const words = state.language.vocab[state.language.current] || [];
        if (words.length === 0) { toast('Add vocabulary words first!', 'danger'); return; }
        const w = words[Math.floor(Math.random() * words.length)];
        showModal('Flashcard Review', `
      <div class="text-center py-8">
        <div class="font-display text-3xl font-black text-mine-cyan mb-4">${w.word}</div>
        <div class="text-mine-muted text-sm mb-4">Click to reveal translation</div>
        <div id="flash-answer" class="hidden font-display text-2xl font-bold text-mine-accent">${w.translation || 'No translation'}</div>
        <button class="mbtn mbtn-cyan mt-4" onclick="document.getElementById('flash-answer').classList.toggle('hidden')">Reveal</button>
      </div>
    `, null, true);
    };
}

function removeVocab(idx) {
    const vocab = state.language.vocab[state.language.current];
    if (vocab) { vocab.splice(idx, 1); DB.save(); renderLanguage(); }
}

function renderCommunication() {
    const stats = state.communication;
    const statDefs = [
        { key: 'confidence', name: 'Confidence', icon: 'fa-hand-fist', color: 'text-red-400' },
        { key: 'fluency', name: 'Fluency', icon: 'fa-wind', color: 'text-cyan-400' },
        { key: 'consistency', name: 'Consistency', icon: 'fa-arrows-spin', color: 'text-green-400' },
        { key: 'vocabulary', name: 'Vocabulary', icon: 'fa-book', color: 'text-amber-400' }
    ];
    document.getElementById('comm-stats').innerHTML = statDefs.map(s => {
        const val = stats[s.key] || 0;
        return `<div class="
        mcard p-4
        ${completed ? 'opacity-50 pointer-events-none border-green-500' : ''}
    "><div class="text-xs text-mine-muted font-mono mb-1"><i class="fas ${s.icon} ${s.color} mr-1"></i>${s.name}</div><div class="font-display text-2xl font-black ${s.color}">${val}</div></div>`;
    }).join('');

    document.getElementById('comm-prompt').onclick = () => {
        document.getElementById('comm-prompt-text').textContent = SPEECH_PROMPTS[Math.floor(Math.random() * SPEECH_PROMPTS.length)];
    };
}

// Speech recognition
let recognition = null;
function initSpeech() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { toast('Speech recognition not supported in this browser', 'danger'); return; }
    recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.onresult = (e) => {
        let transcript = '';
        for (let i = e.resultIndex; i < e.results.length; i++) transcript += e.results[i][0].transcript;
        document.getElementById('comm-transcript').textContent = transcript;
        // Update communication stats
        const words = transcript.split(/\s+/).filter(w => w.length > 0).length;
        state.communication.fluency = Math.min(100, (state.communication.fluency || 0) + words);
        state.communication.vocabulary = Math.min(100, new Set(transcript.toLowerCase().split(/\s+/)).size);
        state.communication.confidence = Math.min(100, Math.round(words / 2));
        state.communication.consistency = Math.min(100, Math.round(words / 3));
        state.xp.communication = (state.xp.communication || 0) + Math.max(1, Math.floor(words / 5));
        DB.save();
    };
    recognition.onerror = (e) => { if (e.error !== 'no-speech') toast('Speech error: ' + e.error, 'danger'); };
}

document.getElementById('comm-start').onclick = () => {
    if (!recognition) initSpeech();
    if (recognition) { try { recognition.start(); document.getElementById('comm-start').disabled = true; document.getElementById('comm-stop').disabled = false; toast('Listening...', 'info'); } catch (e) { } }
};
document.getElementById('comm-stop').onclick = () => {
    if (recognition) { try { recognition.stop(); } catch (e) { } document.getElementById('comm-start').disabled = false; document.getElementById('comm-stop').disabled = true; toast('Stopped listening', 'info'); renderCommunication(); }
};

function renderHealth() {
    const missions = MISSION_TEMPLATES.health;
    document.getElementById('health-missions').innerHTML = missions.map((m, i) => `
    <div class="mcard p-4 hover:border-green-800/40 cursor-pointer" onclick="startMission('health',${i})">
      <div class="flex items-center gap-3 mb-2">
        <div class="w-10 h-10 rounded-lg bg-green-900/30 flex items-center justify-center text-green-400"><i class="fas ${m.icon}"></i></div>
        <div><div class="font-bold text-sm">
        ${m.name}
        ${completed ? '✅' : ''}
     </div><div class="text-xs text-mine-muted font-mono">${m.duration} min</div></div>
      </div>
      <div class="flex gap-3 text-xs font-mono"><span class="text-green-400">+${m.rewardXP} XP</span><span class="text-amber-400">+₱${m.rewardCoins}</span></div>
    </div>
  `).join('');
    // Also show recovery missions
    const recovery = MISSION_TEMPLATES.recovery;
    document.getElementById('health-missions').innerHTML += `<div class="col-span-full text-xs text-mine-muted font-mono mt-4 mb-2">RECOVERY MISSIONS</div>` +
        recovery.map((m, i) => `
      <div class="mcard p-4 hover:border-cyan-800/40 cursor-pointer border-dashed" onclick="startMission('recovery',${i})">
        <div class="flex items-center gap-3 mb-2">
          <div class="w-10 h-10 rounded-lg bg-cyan-900/30 flex items-center justify-center text-cyan-400"><i class="fas ${m.icon}"></i></div>
          <div><div class="font-bold text-sm">
          ${m.name}
          ${completed ? '✅' : ''}
       </div><div class="text-xs text-mine-muted font-mono">${m.duration} min</div></div>
        </div>
        <div class="flex gap-3 text-xs font-mono"><span class="text-cyan-400">+${m.rewardXP} XP</span><span class="text-amber-400">+₱${m.rewardCoins}</span></div>
      </div>
    `).join('');
}

function renderHobbies() {
    const grid = document.getElementById('hobby-grid');
    grid.innerHTML = HOBBY_DEFS.map(h => {
        const hobbyState = state.hobbies[h.id] || { level: 1, xp: 0 };
        const nextXP = 100 + hobbyState.level * 50;
        const progress = hobbyState.xp / nextXP * 100;
        return `<div class="mcard p-5 ${state.lockdown ? 'opacity-40 pointer-events-none' : ''}">
      <div class="flex items-center gap-3 mb-3">
        <div class="w-12 h-12 rounded-lg bg-mine-elevated flex items-center justify-center text-xl ${h.color}"><i class="fas ${h.icon}"></i></div>
        <div><div class="font-bold">${h.name}</div><div class="text-xs text-mine-muted font-mono">Level ${hobbyState.level}</div></div>
      </div>
      <div class="xp-bar mb-2"><div class="xp-bar-fill bg-mine-accent" style="width:${Math.min(100, progress)}%"></div></div>
      <div class="text-xs text-mine-muted font-mono">${hobbyState.xp} / ${nextXP} XP</div>
      <button class="mbtn mbtn-outline text-xs mt-3 w-full" onclick="logHobby('${h.id}')">Log Session</button>
    </div>`;
    }).join('');
}

function logHobby(hobbyId) {
    const h = HOBBY_DEFS.find(x => x.id === hobbyId);
    if (!h) return;
    if (!state.hobbies[hobbyId]) state.hobbies[hobbyId] = { level: 1, xp: 0 };
    const xpGain = 20 + Math.floor(Math.random() * 20);
    state.hobbies[hobbyId].xp += xpGain;
    const nextXP = 100 + state.hobbies[hobbyId].level * 50;
    if (state.hobbies[hobbyId].xp >= nextXP) {
        state.hobbies[hobbyId].level++;
        state.hobbies[hobbyId].xp -= nextXP;
        toast(`${h.name} leveled up to Lv${state.hobbies[hobbyId].level}!`, 'success');
    }
    state.xp.creativity = (state.xp.creativity || 0) + xpGain;
    checkAchievements();
    DB.save();
    toast(`+${xpGain} creativity XP`, 'accent');
    renderHobbies();
    renderDashboard();
}

function renderRightPanel() {
    if (state.activeMission) {
        document.getElementById('rp-mission').innerHTML = `<span class="text-mine-fg">${state.activeMission.name}</span> <span class="text-mine-muted">(${CATEGORY_LABELS[state.activeMission.category]})</span>`;
    } else {
        document.getElementById('rp-mission').textContent = 'No active mission';
    }

    // AI role buttons
    const roleEl = document.getElementById('ai-role-btns');
    roleEl.innerHTML = AI_ROLES.map(r => `<button class="text-xs px-2 py-1 rounded border ${state.settings.aiRole === r.id ? 'border-mine-accent text-mine-accent' : 'border-mine-border text-mine-muted'} hover:border-mine-accent/50 transition" data-role="${r.id}"><i class="fas ${r.icon} ${r.color} mr-1"></i>${r.label}</button>`).join('');
    roleEl.querySelectorAll('button').forEach(btn => {
        btn.onclick = () => { state.settings.aiRole = btn.dataset.role; DB.save(); renderRightPanel(); };
    });

    // Daily boss
    renderBossStatus();
}

function renderBossStatus() {
    const el = document.getElementById('boss-status');
    const completed = state.stats.todayCompleted;
    const failed = state.stats.todayFailed;
    if (completed > failed) el.innerHTML = `<span class="text-green-400">Victory Path</span> <span class="text-mine-muted">(${completed}W / ${failed}L)</span>`;
    else if (failed > completed) el.innerHTML = `<span class="text-red-400">Overseer Winning</span> <span class="text-mine-muted">(${completed}W / ${failed}L)</span>`;
    else el.innerHTML = `<span class="text-mine-muted">Tied (${completed}W / ${failed}L)</span>`;
}

function renderAnalytics() {
    // Destroy existing charts
    Object.values(charts).forEach(c => { if (c && c.destroy) c.destroy() });
    charts = {};

    const last7 = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date(Date.now() - i * 86400000);
        last7.push(d.toISOString().split('T')[0]);
    }

    const dailyXP = last7.map(d => state.analytics.dailyXP[d] || 0);
    const dailyFocus = last7.map(d => state.analytics.dailyFocus[d] || 0);
    const dailySuccess = last7.map(d => state.analytics.dailySuccess[d] || 0);
    const labels = last7.map(d => d.slice(5));

    const chartOpts = { responsive: true, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: '#5a5a72', font: { family: 'Share Tech Mono', size: 10 } }, grid: { color: '#1a1a28' } }, y: { ticks: { color: '#5a5a72', font: { family: 'Share Tech Mono', size: 10 } }, grid: { color: '#1a1a28' } } } };

    const ctx1 = document.getElementById('chart-daily-xp');
    if (ctx1) charts.dailyXP = new Chart(ctx1, { type: 'bar', data: { labels, datasets: [{ data: dailyXP, backgroundColor: 'rgba(240,165,0,0.6)', borderColor: '#f0a500', borderWidth: 1 }] }, options: chartOpts });

    const ctx2 = document.getElementById('chart-success');
    if (ctx2) charts.success = new Chart(ctx2, { type: 'line', data: { labels, datasets: [{ data: dailySuccess, borderColor: '#00ff88', backgroundColor: 'rgba(0,255,136,0.1)', fill: true, tension: 0.4 }] }, options: { ...chartOpts, scales: { ...chartOpts.scales, y: { ...chartOpts.scales.y, max: 100 } } } });

    const ctx3 = document.getElementById('chart-focus');
    if (ctx3) charts.focus = new Chart(ctx3, { type: 'bar', data: { labels, datasets: [{ data: dailyFocus.map(m => Math.round(m / 60 * 10) / 10), backgroundColor: 'rgba(0,229,255,0.6)', borderColor: '#00e5ff', borderWidth: 1 }] }, options: chartOpts });

    const ctx4 = document.getElementById('chart-cat-xp');
    if (ctx4) {
        const catLabels = ['Coding', 'Health', 'Language', 'Comms', 'Creative', 'Daily'];
        const catData = [state.xp.coding, state.xp.health, state.xp.language, state.xp.communication, state.xp.creativity, state.xp.daily];
        const catColors = ['#f0a500', '#00ff88', '#00e5ff', '#ff6b6b', '#c850ff', '#8a8a9a'];
        charts.catXP = new Chart(ctx4, { type: 'doughnut', data: { labels: catLabels, datasets: [{ data: catData, backgroundColor: catColors }] }, options: { responsive: true, plugins: { legend: { labels: { color: '#e4e4f0', font: { family: 'Rajdhani' } } } } } });
    }
}

function renderSettings() {
    // Firebase fields
    const fbFields = ['apiKey', 'authDomain', 'databaseURL', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
    const fbEl = document.getElementById('firebase-fields');
    const existingConfig = state.settings.firebaseConfig || {};
    fbEl.innerHTML = fbFields.map(f => `<div><label class="text-xs text-mine-muted">${f}</label><input id="fb-${f}" class="w-full bg-mine-bg border border-mine-border rounded p-2 text-sm mt-1" value="${existingConfig[f] || ''}" placeholder="${f}"></div>`).join('');

    document.getElementById('fb-connect').onclick = () => {
        const config = {};
        fbFields.forEach(f => { config[f] = document.getElementById('fb-' + f).value.trim(); });
        if (!config.apiKey || !config.projectId) { toast('Fill in at least apiKey and projectId', 'danger'); return; }
        state.settings.firebaseConfig = config;
        DB.save();
        DB.connectFirebase(config);
    };
    document.getElementById('fb-disconnect').onclick = DB.disconnectFirebase;

    // AI fields
    document.getElementById('ai-provider').value = state.settings.aiProvider;
    document.getElementById('ai-key').value = state.settings.aiKey;
    document.getElementById('ai-model').value = state.settings.aiModel;
    document.getElementById('ai-save').onclick = () => {
        state.settings.aiProvider = document.getElementById('ai-provider').value;
        state.settings.aiKey = document.getElementById('ai-key').value;
        state.settings.aiModel = document.getElementById('ai-model').value;
        DB.save();
        toast('AI config saved', 'success');
    };

    // Data management
    document.getElementById('data-export').onclick = () => {
        const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `mined_backup_${getTodayKey()}.json`; a.click();
        toast('Data exported', 'success');
    };
    document.getElementById('data-import').onclick = () => {
        const input = document.createElement('input'); input.type = 'file'; input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0]; if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                try { const imported = JSON.parse(ev.target.result); state = { ...getDefaultState(), ...imported }; DB.save(); renderAll(); toast('Data imported!', 'success'); }
                catch (err) { toast('Invalid file', 'danger'); }
            };
            reader.readAsText(file);
        };
        input.click();
    };
    document.getElementById('data-reset').onclick = () => {
        showModal('Reset All Data', `<div class="text-red-400 mb-4">This will permanently delete all your progress. Are you sure?</div>`, () => {
            state = getDefaultState(); DB.save(); renderAll(); toast('All data reset', 'info'); closeModal();
        });
    };

    // Preferences
    document.getElementById('pref-focus-mode').value = state.settings.focusMode;
    document.getElementById('pref-sound').value = state.settings.sound;
    document.getElementById('pref-save').onclick = () => {
        state.settings.focusMode = document.getElementById('pref-focus-mode').value;
        state.settings.sound = document.getElementById('pref-sound').value;
        DB.save();
        toast('Preferences saved', 'success');
    };

    // Firebase status
    document.getElementById('fb-status').textContent = firebaseDB ? 'Status: Firebase Connected' : 'Status: Local Storage Only';
}

function renderAIHistory() {

    const chatEl =
        document.getElementById('ai-chat');

    if (!chatEl) return;

    chatEl.innerHTML = '';

    state.aiChatHistory.forEach(m => {

        chatEl.innerHTML += `
            <div class="
                chat-bubble
                ${m.role === 'user'
                ? 'chat-user'
                : 'chat-ai'} text-sm">
                ${m.content}
            </div>
        `;
    });

    chatEl.scrollTop =
        chatEl.scrollHeight;
}

// ─── MODAL SYSTEM ───────────────────────────────────────────────────
function showModal(title, bodyHTML, onConfirm, dismissOnly = false) {
    const container = document.getElementById('modal-container');
    container.innerHTML = `
    <div class="modal-overlay fade-in" onclick="if(event.target===this)closeModal()">
      <div class="modal-box slide-up">
        <div class="font-display text-lg font-bold mb-4">${title}</div>
        <div class="mb-4">${bodyHTML}</div>
        <div class="flex gap-2 justify-end">
          ${dismissOnly ? '<button class="mbtn mbtn-outline" onclick="closeModal()">Close</button>' :
            `<button class="mbtn mbtn-outline" onclick="closeModal()">Cancel</button>
             <button class="mbtn mbtn-accent" id="modal-confirm">Confirm</button>`}
        </div>
      </div>
    </div>
  `;
    if (onConfirm && !dismissOnly) document.getElementById('modal-confirm').onclick = onConfirm;
}

function closeModal() { document.getElementById('modal-container').innerHTML = ''; }

// ─── DAILY BOSS BATTLE ──────────────────────────────────────────────
document.getElementById('boss-fight').onclick = () => {
    const completed = state.stats.todayCompleted;
    const failed = state.stats.todayFailed;
    const xp = state.stats.todayXP;
    const focusMin = state.stats.totalFocusMinutes;
    const victory = completed > failed;

    showModal('Daily Boss Battle — End of Day Report', `
    <div class="space-y-3 font-mono text-sm">
      <div class="flex justify-between"><span class="text-mine-muted">Missions Completed</span><span class="text-green-400">${completed}</span></div>
      <div class="flex justify-between"><span class="text-mine-muted">Missions Failed</span><span class="text-red-400">${failed}</span></div>
      <div class="flex justify-between"><span class="text-mine-muted">XP Earned Today</span><span class="text-mine-accent">${xp}</span></div>
      <div class="flex justify-between"><span class="text-mine-muted">Focus Time</span><span class="text-mine-cyan">${focusMin} min</span></div>
      <div class="flex justify-between"><span class="text-mine-muted">Wallet</span><span>₱${state.wallet}</span></div>
      <div class="border-t border-mine-border pt-3 mt-3">
        <div class="font-display text-xl font-black ${victory ? 'text-green-400' : 'text-red-400'}">${victory ? 'VICTORY' : 'OVERSEER WINS'}</div>
        <div class="text-mine-muted text-xs mt-1">${victory ? 'You held the line today. The Overseer retreats.' : 'The Overseer gained ground. Tomorrow, fight harder.'}</div>
      </div>
    </div>
  `, null, true);

    // Bonus for victory
    if (victory && completed >= 3) {
        const bonus = completed * 10;
        state.wallet += bonus;
        state.stats.todayXP += bonus;
        toast(`Daily victory bonus: +₱${bonus}`, 'success');
    }
    DB.save();
    renderAll();
};

// ─── AI CHAT ────────────────────────────────────────────────────────
document.getElementById('ai-send').onclick = async () => {
    const input = document.getElementById('ai-input');
    const msg = input.value.trim();
    if (!msg) return;
    input.value = '';

    const chatEl = document.getElementById('ai-chat');
    chatEl.innerHTML += `<div class="chat-bubble chat-user text-sm">${msg}</div>`;

    state.aiChatHistory.push({
        role: 'user',
        content: msg,
        timestamp: Date.now()
    });

    DB.save();

    // Show typing indicator
    const typingId = 'typing-' + Date.now();
    chatEl.innerHTML += `<div class="chat-bubble chat-ai text-sm" id="${typingId}"><i class="fas fa-ellipsis fa-beat-fade text-mine-cyan"></i></div>`;
    chatEl.scrollTop = chatEl.scrollHeight;

    const response = await sendAI(msg);
    const typingEl = document.getElementById(typingId);
    if (typingEl) typingEl.outerHTML = `<div class="chat-bubble chat-ai text-sm">${response}</div>`;
    chatEl.scrollTop = chatEl.scrollHeight;

    state.aiChatHistory.push({
        role: 'assistant',
        content: response,
        timestamp: Date.now()
    });

    DB.save();
};

document.getElementById('ai-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') document.getElementById('ai-send').click();
});

// ========================
// MOBILE AI PANEL
// ========================

const aiToggle = document.getElementById('ai-toggle');
const aiClose = document.getElementById('ai-close');
const aiOverlay = document.getElementById('ai-overlay');
const rightPanel = document.getElementById('right-panel');

function openAI() {
    if (!rightPanel) return;

    rightPanel.classList.remove('translate-x-full');

    if (aiOverlay) {
        aiOverlay.classList.remove('hidden');
    }
}

function closeAI() {
    if (!rightPanel) return;

    rightPanel.classList.add('translate-x-full');

    if (aiOverlay) {
        aiOverlay.classList.add('hidden');
    }
}

if (aiToggle) {
    aiToggle.addEventListener('click', openAI);
}

if (aiClose) {
    aiClose.addEventListener('click', closeAI);
}

if (aiOverlay) {
    aiOverlay.addEventListener('click', closeAI);
}

// ─── NAVIGATION ─────────────────────────────────────────────────────
document.querySelectorAll('.nav-item').forEach(item => {
    item.onclick = () => {
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        item.classList.add('active');
        const sec = item.dataset.sec;
        document.querySelectorAll('.sec-panel').forEach(p => p.classList.remove('active'));
        const target = document.getElementById('sec-' + sec);
        if (target) target.classList.add('active');
        // Close mobile sidebar
        document.getElementById('sidebar').classList.remove('open');
        // Re-render analytics when switching to that tab
        if (sec === 'analytics') setTimeout(renderAnalytics, 100);
    };
});

// Mobile menu toggle
document.getElementById('menu-toggle').onclick = () => { document.getElementById('sidebar').classList.toggle('open'); };

// ─── FOOTER CLOCK ───────────────────────────────────────────────────
setInterval(() => {
    const now = new Date();
    document.getElementById('footer-time').textContent = now.toLocaleTimeString('en-US', { hour12: false });
}, 1000);

// ─── PERIODIC OVERSEER TAUNTS ───────────────────────────────────────
setInterval(() => {
    if (Math.random() < 0.3) {
        const taunt = OVERSEER_TAUNTS[Math.floor(Math.random() * OVERSEER_TAUNTS.length)];
        document.getElementById('dash-ov-taunt').textContent = `"${taunt}"`;
    }
}, 30000);

// ─── AUTO-SAVE ──────────────────────────────────────────────────────
setInterval(() => DB.save(), 30000);

document
    .getElementById('mission-photo')
    .addEventListener(
        'change',
        e => {

            if (!pendingMissionCompletion)
                return;

            if (!e.target.files.length) {

                toast(
                    'Photo required.',
                    'danger'
                );

                return;
            }

            const file =
                e.target.files[0];

            const reader =
                new FileReader();

            reader.onload = () => {

                if (state.activeMission) {

                    state.missionProofs.push({
                        mission:
                            state.activeMission.name,
                        category:
                            state.activeMission.category,
                        date:
                            Date.now(),
                        photo:
                            reader.result
                    });

                    DB.save();
                }

                pendingMissionCompletion =
                    false;

                completeMission();
            };

            reader.readAsDataURL(file);
        }
    );

// ─── INIT ───────────────────────────────────────────────────────────
function init() {
    DB.load();
    checkTodayReset();
    checkLockdown();
    renderAll();
    renderAIHistory();
    initSpeech();

    // If there was an active mission, clear it (was interrupted by page reload)
    //if (state.activeMission) {
    //state.activeMission = null;
    //DB.save();
    //}
    if (state.activeMission) {
        const remaining =
            Math.floor(
                (state.activeMission.endTime - Date.now()) / 1000
            );

        if (remaining > 0) {
            timerRemaining = remaining;
            timerTotal = state.activeMission.duration * 60;

            renderActiveMission();
            startTimer();
        } else {
            completeMission();
        }
    }

    console.log('%c MINED // CORE_OS v2 ', 'background:#f0a500;color:#08080e;font-weight:bold;font-size:14px;padding:4px 8px;border-radius:4px');
    console.log('%c Systems online. Welcome, Operator. ', 'color:#00e5ff;font-family:monospace');
}

init();

