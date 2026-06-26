/* ============================================================================
   MINED // CORE_OS v2 - Database & Utilities
   ============================================================================ */

// ─── DATABASE LAYER (Firebase + localStorage) ───────────────────────
const DB = {
    save() {
        try {
            localStorage.setItem('mined_state', JSON.stringify(state));
        } catch (e) {
            console.error('Save failed:', e);
        }
        if (firebaseDB) {
            try {
                firebaseDB.ref('mined_state').set(JSON.parse(JSON.stringify(state)));
            } catch (e) {
                console.error('Firebase save failed:', e);
            }
        }
    },
    load() {
        try {
            const d = localStorage.getItem('mined_state');
            if (d) {
                const parsed = JSON.parse(d);
                state = { ...getDefaultState(), ...parsed };
            }
        } catch (e) {
            console.error('Load failed:', e);
        }
    },
    async connectFirebase(config) {
        try {
            if (firebaseDB) {
                firebase.app().delete().catch(() => { });
                firebaseDB = null;
            }
            const app = firebase.initializeApp(config);
            firebaseDB = firebase.database();
            const snap = await firebaseDB.ref('mined_state').once('value');
            if (snap.val()) {
                state = { ...getDefaultState(), ...snap.val() };
                DB.save();
            }
            document.getElementById('fb-status').textContent = 'Status: Firebase Connected';
            document.getElementById('footer-db').textContent = 'DB: Firebase + Local';
            toast('Firebase connected!', 'success');
        } catch (e) {
            console.error('Firebase connect error:', e);
            document.getElementById('fb-status').textContent = 'Status: Firebase Error - ' + e.message;
            toast('Firebase error: ' + e.message, 'danger');
        }
    },
    disconnectFirebase() {
        if (firebaseDB) {
            try {
                firebase.app().delete().catch(() => { });
            } catch (e) { }
            firebaseDB = null;
        }
        document.getElementById('fb-status').textContent = 'Status: Local Storage Only';
        document.getElementById('footer-db').textContent = 'DB: LocalStorage';
        state.settings.firebaseConfig = null;
        DB.save();
        toast('Switched to local storage', 'info');
    }
};

// ─── UTILITY FUNCTIONS ──────────────────────────────────────────────
function toast(msg, type = 'accent') {
    const colors = {
        accent: 'bg-amber-900/80 border border-amber-600 text-amber-200',
        danger: 'bg-red-900/80 border border-red-600 text-red-200',
        success: 'bg-green-900/80 border border-green-600 text-green-200',
        info: 'bg-cyan-900/80 border border-cyan-600 text-cyan-200',
        epic: 'bg-purple-900/80 border border-purple-600 text-purple-200'
    };
    const el = document.createElement('div');
    el.className = `toast ${colors[type] || colors.accent}`;
    el.textContent = msg;
    document.getElementById('toast-container').appendChild(el);
    setTimeout(() => {
        el.style.opacity = '0';
        el.style.transition = 'opacity .3s';
        setTimeout(() => el.remove(), 300);
    }, 3000);
}

function formatTime(sec) {
    const m = Math.floor(sec / 60),
        s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function playSound(type) {
    if (state.settings.sound === 'off') return;
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.value = 0.1;

    if (type === 'complete') {
        osc.frequency.value = 880;
        osc.type = 'sine';
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
    } else if (type === 'fail') {
        osc.frequency.value = 220;
        osc.type = 'sawtooth';
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
        osc.start();
        osc.stop(ctx.currentTime + 0.8);
    } else if (type === 'tick') {
        osc.frequency.value = 600;
        osc.type = 'sine';
        gain.gain.value = 0.05;
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
    } else if (type === 'loot') {
        osc.frequency.value = 1200;
        osc.type = 'sine';
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
        setTimeout(() => {
            const o2 = ctx.createOscillator();
            const g2 = ctx.createGain();
            o2.connect(g2);
            g2.connect(ctx.destination);
            o2.frequency.value = 1600;
            o2.type = 'sine';
            g2.gain.value = 0.08;
            g2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
            o2.start();
            o2.stop(ctx.currentTime + 0.6);
        }, 150);
    }
}

function getTodayKey() {
    return new Date().toISOString().split('T')[0];
}

function checkTodayReset() {
    const today = getTodayKey();
    if (state.stats.todayDate !== today) {
        // Streak check
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        if (state.stats.todayDate === yesterday && state.stats.todayCompleted > 0) {
            state.streak.current++;
            if (state.streak.current > state.streak.best) state.streak.best = state.streak.current;
        } else if (state.stats.todayDate && state.stats.todayDate !== yesterday) {
            state.streak.current = 0;
        }
        state.streak.lastDate = state.stats.todayDate;

        // Save yesterday's analytics
        if (state.stats.todayDate) {
            state.analytics.dailyXP[state.stats.todayDate] = state.stats.todayXP;
            state.analytics.dailyFocus[state.stats.todayDate] = state.stats.totalFocusMinutes;
            state.analytics.dailySuccess[state.stats.todayDate] =
                state.stats.todayCompleted > 0
                    ? Math.round((state.stats.todayCompleted / (state.stats.todayCompleted + state.stats.todayFailed)) * 100)
                    : 0;
        }

        // Evaluate yesterday first
        if (state.stats.todayFailed === 0 &&
            state.stats.todayCompleted > 0) {

            state.stats.daysWithoutFailure++;

        } else {

            state.stats.daysWithoutFailure = 0;
        }

        // Now reset
        state.stats.todayXP = 0;
        state.stats.todayCompleted = 0;
        state.stats.todayFailed = 0;
        state.stats.todayDate = today;

        state.completedToday = {};

        checkLockdown();
        DB.save();
    }
}

function checkLockdown() {
    if (state.wallet < 500 && !state.lockdown) {
        state.lockdown = true;
        toast('LOCKDOWN MODE ACTIVATED — Wallet below ₱500', 'danger');
        document.body.classList.add('lockdown-active');
        document.getElementById('lockdown-badge').classList.remove('hidden');
    } else if (state.wallet >= 700 && state.lockdown) {
        state.lockdown = false;
        toast('Lockdown lifted — Wallet recovered', 'success');
        document.body.classList.remove('lockdown-active');
        document.getElementById('lockdown-badge').classList.add('hidden');
    }
}

function getOverseerData() {
    return OVERSEER_LEVELS[state.overseer.level - 1] || OVERSEER_LEVELS[0];
}

function getXPForSkillLevel(lvl) {
    return 100 + lvl * 100;
}

function getSkillLevel(skillId) {
    const xp = state.xp[skillId] || 0;
    let lvl = 0,
        rem = xp;
    for (let i = 1; i <= 10; i++) {
        const need = getXPForSkillLevel(i - 1);
        if (rem >= need) {
            rem -= need;
            lvl = i;
        } else break;
    }
    return lvl;
}

function getTotalXP() {
    return Object.values(state.xp).reduce((a, b) => a + b, 0);
}

function checkAchievements() {
    ACHIEVEMENT_DEFS.forEach(def => {
        if (!state.achievements.includes(def.id) && def.check(state)) {
            state.achievements.push(def.id);
            toast(`🏆 Achievement Unlocked: ${def.name}`, 'epic');
        }
    });
}

function initializeSkills() {
    SKILL_DEFS.forEach(skill => {
        if (!state.skills[skill.id]) {
            state.skills[skill.id] = { level: 1, xp: 0 };
        }
    });
}

function initializeLanguageVocab() {
    const lang = state.language.current;
    if (!state.language.vocab[lang]) {
        state.language.vocab[lang] = [];
    }
}

function initializeHobbies() {
    HOBBY_DEFS.forEach(hobby => {
        if (!state.hobbies[hobby.id]) {
            state.hobbies[hobby.id] = { level: 1, xp: 0, sessions: 0 };
        }
    });
}

function getRandomFromArray(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function exportData() {
    const json = JSON.stringify(state, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mined_backup_${getTodayKey()}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

function importData(file) {
    const reader = new FileReader();
    reader.onload = e => {
        try {
            const imported = JSON.parse(e.target.result);
            state = { ...getDefaultState(), ...imported };
            DB.save();
            toast('Data imported successfully', 'success');
            renderAll();
        } catch (err) {
            toast('Import failed: ' + err.message, 'danger');
        }
    };
    reader.readAsText(file);
}

function resetAllData() {
    if (confirm('Are you sure? This cannot be undone.')) {
        state = getDefaultState();
        DB.save();
        toast('All data reset', 'danger');
        renderAll();
    }
}

// ─── PWA INSTALLER ---------------------------------
let deferredPrompt;

const installBtn = document.getElementById("install-app");

// Listen for install prompt
window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault(); // stop auto prompt
    deferredPrompt = e;

    // show install button
    installBtn.classList.remove("hidden");
});

// Click install button
installBtn.addEventListener("click", async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt(); // show install popup

    const choice = await deferredPrompt.userChoice;

    if (choice.outcome === "accepted") {
        console.log("User installed app");
    } else {
        console.log("User dismissed install");
    }

    deferredPrompt = null;
    installBtn.classList.add("hidden");
});

// Optional: hide button if already installed
window.addEventListener("appinstalled", () => {
    installBtn.classList.add("hidden");
    console.log("PWA installed");
});