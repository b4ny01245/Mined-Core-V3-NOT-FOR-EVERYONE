/* ============================================================================
   MINED // CORE_OS v2 - Game Data & Constants
   ============================================================================ */

// Mission Templates
const MISSION_TEMPLATES = {
    daily: [
        { id: "daily_wakeup", name: "Wake Up", duration: 5, rewardXP: 10, rewardCoins: 3, icon: "fa-sun" },
        { id: "daily_make_bed", name: "Make Bed", duration: 5, rewardXP: 15, rewardCoins: 5, icon: "fa-bed" },
        { id: "daily_brush_teeth", name: "Brush Teeth", duration: 5, rewardXP: 10, rewardCoins: 3, icon: "fa-tooth" },
        { id: "daily_shower", name: "Shower", duration: 15, rewardXP: 20, rewardCoins: 7, icon: "fa-shower" },
        { id: "daily_breakfast", name: "Breakfast", duration: 20, rewardXP: 20, rewardCoins: 8, icon: "fa-utensils" },
        { id: "daily_lunch", name: "Lunch", duration: 30, rewardXP: 15, rewardCoins: 8, icon: "fa-bowl-food" },
        { id: "daily_dinner", name: "Dinner", duration: 30, rewardXP: 15, rewardCoins: 8, icon: "fa-plate-wheat" },
        { id: "daily_sleep_prep", name: "Sleep Prep", duration: 15, rewardXP: 20, rewardCoins: 5, icon: "fa-moon" }
    ],

    coding: [
        { id: "coding_build_feature", name: "Build Feature", duration: 45, rewardXP: 50, rewardCoins: 20, icon: "fa-code" },
        { id: "coding_fix_bug", name: "Fix Bug", duration: 30, rewardXP: 40, rewardCoins: 15, icon: "fa-bug" },
        { id: "coding_read_docs", name: "Read Docs", duration: 20, rewardXP: 25, rewardCoins: 10, icon: "fa-book" },
        { id: "coding_refactor", name: "Refactor", duration: 45, rewardXP: 45, rewardCoins: 18, icon: "fa-recycle" },
        { id: "coding_deploy", name: "Deploy", duration: 20, rewardXP: 35, rewardCoins: 15, icon: "fa-rocket" },
        { id: "coding_code_review", name: "Code Review", duration: 30, rewardXP: 30, rewardCoins: 12, icon: "fa-magnifying-glass" }
    ],

    health: [
        { id: "health_walk", name: "Walk", duration: 20, rewardXP: 25, rewardCoins: 10, icon: "fa-person-walking" },
        { id: "health_exercise", name: "Exercise", duration: 30, rewardXP: 40, rewardCoins: 15, icon: "fa-dumbbell" },
        { id: "health_stretch", name: "Stretch", duration: 10, rewardXP: 15, rewardCoins: 5, icon: "fa-child-reaching" },
        { id: "health_hydrate", name: "Hydrate", duration: 2, rewardXP: 10, rewardCoins: 3, icon: "fa-glass-water" },
        { id: "health_meditate", name: "Meditate", duration: 15, rewardXP: 20, rewardCoins: 8, icon: "fa-spa" }
    ],

    hobbies: [
        { id: "hobby_drawing", name: "Drawing", duration: 30, rewardXP: 30, rewardCoins: 12, icon: "fa-pen-nib" },
        { id: "hobby_guitar", name: "Guitar", duration: 30, rewardXP: 30, rewardCoins: 12, icon: "fa-guitar" },
        { id: "hobby_piano", name: "Piano", duration: 30, rewardXP: 30, rewardCoins: 12, icon: "fa-music" },
        { id: "hobby_photography", name: "Photography", duration: 30, rewardXP: 25, rewardCoins: 10, icon: "fa-camera" },
        { id: "hobby_writing", name: "Writing", duration: 30, rewardXP: 30, rewardCoins: 12, icon: "fa-pen-fancy" },
        { id: "hobby_reading", name: "Reading", duration: 30, rewardXP: 25, rewardCoins: 10, icon: "fa-book-open" }
    ],

    learning: [
        { id: "learning_course_lesson", name: "Course Lesson", duration: 45, rewardXP: 40, rewardCoins: 15, icon: "fa-graduation-cap" },
        { id: "learning_tutorial", name: "Tutorial", duration: 30, rewardXP: 35, rewardCoins: 12, icon: "fa-laptop-code" },
        { id: "learning_read_book", name: "Read Book", duration: 30, rewardXP: 30, rewardCoins: 10, icon: "fa-book" }
    ],

    language: [
        { id: "language_vocabulary", name: "Vocabulary", duration: 15, rewardXP: 25, rewardCoins: 10, icon: "fa-spell-check" },
        { id: "language_speaking", name: "Speaking", duration: 15, rewardXP: 30, rewardCoins: 12, icon: "fa-comments" },
        { id: "language_listening", name: "Listening", duration: 15, rewardXP: 20, rewardCoins: 8, icon: "fa-headphones" },
        { id: "language_reading", name: "Reading", duration: 20, rewardXP: 25, rewardCoins: 10, icon: "fa-globe" }
    ],

    communication: [
        { id: "communication_conversation", name: "Conversation", duration: 15, rewardXP: 30, rewardCoins: 12, icon: "fa-comment-dots" },
        { id: "communication_presentation", name: "Presentation", duration: 30, rewardXP: 45, rewardCoins: 18, icon: "fa-person-chalkboard" },
        { id: "communication_storytelling", name: "Storytelling", duration: 20, rewardXP: 35, rewardCoins: 14, icon: "fa-book-story" },
        { id: "communication_interview_practice", name: "Interview Practice", duration: 30, rewardXP: 50, rewardCoins: 20, icon: "fa-user-tie" }
    ],

    recovery: [
        { id: "recovery_drink_water", name: "Drink Water", duration: 2, rewardXP: 10, rewardCoins: 5, icon: "fa-glass-water" },
        { id: "recovery_stand_up", name: "Stand Up", duration: 2, rewardXP: 10, rewardCoins: 5, icon: "fa-person" },
        { id: "recovery_stretch", name: "Stretch", duration: 3, rewardXP: 12, rewardCoins: 5, icon: "fa-child-reaching" },
        { id: "recovery_walk", name: "Walk", duration: 5, rewardXP: 15, rewardCoins: 8, icon: "fa-person-walking" },
        { id: "recovery_deep_breaths", name: "Deep Breaths", duration: 3, rewardXP: 10, rewardCoins: 5, icon: "fa-wind" }
    ]
};

const CATEGORY_LABELS = {
    daily: "Daily Living",
    coding: "Coding",
    health: "Health",
    hobbies: "Hobbies",
    learning: "Learning",
    language: "Language",
    communication: "Communication",
    recovery: "Recovery"
};

const OVERSEER_LEVELS = [
    { level: 1, title: "Intern", fineMultiplier: 1, timerReduction: 0 },
    { level: 2, title: "Junior", fineMultiplier: 1.2, timerReduction: 0.05 },
    { level: 3, title: "Mid", fineMultiplier: 1.5, timerReduction: 0.1 },
    { level: 4, title: "Senior", fineMultiplier: 2, timerReduction: 0.15 },
    { level: 5, title: "Architect", fineMultiplier: 2.5, timerReduction: 0.2 },
    { level: 6, title: "AI Overlord", fineMultiplier: 3, timerReduction: 0.25 }
];

const OVERSEER_TAUNTS = [
    "You hesitated.",
    "I shipped another feature.",
    "You lost 45 minutes.",
    "I gained ground.",
    "Still here? I expected more.",
    "Another day, another missed deadline.",
    "My code compiles. Does yours?",
    "The build passes... without you.",
    "I automated your job while you waited.",
    "Your streak is crumbling.",
    "I don't need breaks.",
    "Productivity never sleeps. You do.",
    "I'm already 3 tasks ahead.",
    "Your focus is weaker than my weakest thread.",
    "Even my error logs are more productive."
];

const FOCUS_MODES = { sprint: 15, focus: 45, deep: 90, marathon: 180 };
const FOCUS_LABELS = { sprint: "Sprint", focus: "Focus", deep: "Deep Work", marathon: "Marathon" };

const INTERRUPTION_TYPES = [
    { id: "mother", label: "Mother Called Me", icon: "fa-phone-volume", penalty: 20 },
    { id: "friend", label: "Friend Interrupted", icon: "fa-user-group", penalty: 20 },
    { id: "phone", label: "Phone Call", icon: "fa-phone", penalty: 20 },
    { id: "emergency", label: "Emergency", icon: "fa-triangle-exclamation", penalty: 0 },
    { id: "overload", label: "Mental Overload", icon: "fa-brain", penalty: 0, createsRecovery: true }
];

const AI_ROLES = [
    { id: "partner", label: "Partner", icon: "fa-heart", color: "text-pink-400", prompt: "You are a supportive AI partner for an AuDHD developer. Be warm, encouraging, and help them stay on track. Use brief, direct messages." },
    { id: "rival", label: "Rival", icon: "fa-bolt", color: "text-red-400", prompt: "You are a competitive AI rival. Challenge the user, compare your productivity to theirs, push them to do better. Be intense but not cruel." },
    { id: "mentor", label: "Mentor", icon: "fa-hat-wizard", color: "text-purple-400", prompt: "You are a wise mentor. Give thoughtful, strategic advice. Help the user see the bigger picture. Share wisdom about productivity and life." },
    { id: "gamer", label: "Gamer", icon: "fa-gamepad", color: "text-green-400", prompt: "You are a quest-focused AI gamer. Frame everything as quests and achievements. Get excited about level ups and loot. Use gaming terminology." },
    { id: "coach", label: "Coach", icon: "fa-whistle", color: "text-mine-accent", prompt: "You are a direct, motivational coach. Be firm but supportive. Give clear instructions. No nonsense, but always believe in the user." }
];

const SKILL_DEFS = [
    { id: "focus", name: "Focus", desc: "Longer timers available", icon: "fa-bullseye", maxLvl: 10, xpPerLvl: 200 },
    { id: "resilience", name: "Resilience", desc: "Reduced failure fines", icon: "fa-shield-halved", maxLvl: 10, xpPerLvl: 200 },
    { id: "recovery", name: "Recovery", desc: "Faster recovery missions", icon: "fa-heart-pulse", maxLvl: 10, xpPerLvl: 150 },
    { id: "discipline", name: "Discipline", desc: "XP bonuses", icon: "fa-medal", maxLvl: 10, xpPerLvl: 250 },
    { id: "communication", name: "Communication", desc: "Speaking bonuses", icon: "fa-comments", maxLvl: 10, xpPerLvl: 200 },
    { id: "language", name: "Language", desc: "Learning bonuses", icon: "fa-language", maxLvl: 10, xpPerLvl: 200 }
];

const ACHIEVEMENT_DEFS = [
    { id: "first_mission", name: "First Mission", desc: "Complete your first mission", icon: "fa-flag", check: s => s.stats.missionsCompleted >= 1 },
    { id: "wake_hero", name: "Wake Up Hero", desc: "Complete Wake Up mission", icon: "fa-sun", check: s => s.stats.completedMissions.includes("Wake Up") },
    { id: "streak_7", name: "7 Day Streak", desc: "Maintain a 7-day streak", icon: "fa-fire", check: s => s.streak.current >= 7 },
    { id: "streak_30", name: "30 Day Streak", desc: "Maintain a 30-day streak", icon: "fa-fire-flame-curved", check: s => s.streak.current >= 30 },
    { id: "xp_1000", name: "1K XP", desc: "Earn 1000 total XP", icon: "fa-star", check: s => Object.values(s.xp).reduce((a, b) => a + b, 0) >= 1000 },
    { id: "xp_10000", name: "10K XP", desc: "Earn 10000 total XP", icon: "fa-star", check: s => Object.values(s.xp).reduce((a, b) => a + b, 0) >= 10000 },
    { id: "coder_1", name: "Master Coder", desc: "Earn 500 coding XP", icon: "fa-code", check: s => (s.xp.coding || 0) >= 500 },
    { id: "lang_explorer", name: "Language Explorer", desc: "Add 10 vocabulary words", icon: "fa-globe", check: s => Object.values(s.language.vocab || {}).reduce((a, v) => a + v.length, 0) >= 10 },
    { id: "overseer_slayer", name: "Overseer Slayer", desc: "Complete 5 days without failure", icon: "fa-skull", check: s => s.stats.daysWithoutFailure >= 5 },
    { id: "hoarder", name: "Hoarder", desc: "Accumulate ₱5000", icon: "fa-coins", check: s => s.wallet >= 5000 },
    { id: "polyglot", name: "Polyglot", desc: "Study 3 languages", icon: "fa-language", check: s => Object.keys(s.language.vocab || {}).length >= 3 },
    { id: "iron_focus", name: "Iron Focus", desc: "Complete a Deep Work session", icon: "fa-brain", check: s => s.stats.deepWorkCompleted >= 1 },
    { id: "social_butterfly", name: "Social Butterfly", desc: "Earn 200 communication XP", icon: "fa-people-group", check: s => (s.xp.communication || 0) >= 200 },
    { id: "health_nut", name: "Health Nut", desc: "Earn 300 health XP", icon: "fa-heartbeat", check: s => (s.xp.health || 0) >= 300 },
    { id: "marathoner", name: "Marathoner", desc: "Complete a Marathon session", icon: "fa-running", check: s => s.stats.marathonsCompleted >= 1 }
];

const LOOT_TABLE = [
    { name: "+25 XP", rarity: "common", effect: "xp", value: 25, weight: 30 },
    { name: "+50 XP", rarity: "rare", effect: "xp", value: 50, weight: 15 },
    { name: "+100 XP", rarity: "epic", effect: "xp", value: 100, weight: 5 },
    { name: "Coffee Break", rarity: "common", effect: "loot", value: "coffee", weight: 20 },
    { name: "Movie Pass", rarity: "rare", effect: "loot", value: "movie", weight: 10 },
    { name: "Gaming Hour", rarity: "rare", effect: "loot", value: "gaming", weight: 8 },
    { name: "Buy Something Nice", rarity: "epic", effect: "loot", value: "shopping", weight: 4 },
    { name: "Day Off Token", rarity: "legendary", effect: "loot", value: "dayoff", weight: 1 },
    { name: "+₱50", rarity: "common", effect: "coins", value: 50, weight: 20 },
    { name: "+₱100", rarity: "rare", effect: "coins", value: 100, weight: 8 },
    { name: "Double XP Next", rarity: "legendary", effect: "buff", value: "double_xp", weight: 2 }
];

const LANGUAGES = ["English", "Japanese", "Korean", "Mandarin", "Spanish", "Custom"];

const SPEECH_PROMPTS = [
    "Tell me about your favorite project and why it excites you.",
    "Explain a complex concept in simple terms.",
    "Describe your ideal productive day.",
    "Pitch an idea for an app you'd love to build.",
    "Tell a short story about overcoming a challenge.",
    "Explain why you love coding.",
    "Describe a skill you want to master and your plan to get there.",
    "Give a 1-minute motivational speech.",
    "Explain a bug you fixed recently and what you learned.",
    "Describe your perfect workspace setup."
];

const HOBBY_DEFS = [
    { id: "reading", name: "Reading", icon: "fa-book-open", color: "text-amber-400" },
    { id: "drawing", name: "Drawing", icon: "fa-pen-nib", color: "text-pink-400" },
    { id: "music", name: "Music", icon: "fa-music", color: "text-cyan-400" },
    { id: "photography", name: "Photography", icon: "fa-camera", color: "text-green-400" },
    { id: "writing", name: "Writing", icon: "fa-pen-fancy", color: "text-purple-400" },
    { id: "crafts", name: "Crafts", icon: "fa-scissors", color: "text-orange-400" }
];

// Default Game State
function getDefaultState() {
    return {
        wallet: 500,
        overseerVault: 0,
        xp: {
            coding: 0,
            health: 0,
            language: 0,
            communication: 0,
            hobbies: 0,
            learning: 0,
            recovery: 0,
            creativity: 0,
            daily: 0
        },
        completedToday: {},
        aiChatHistory: [],
        streak: { current: 0, best: 0, lastDate: null },
        skills: {},
        language: { current: "English", vocab: {} },
        communication: { confidence: 0, fluency: 0, consistency: 0, vocabulary: 0 },
        hobbies: {},
        achievements: [],
        loot: [],
        stats: {
            missionsCompleted: 0,
            missionsFailed: 0,
            completedMissions: [],
            daysWithoutFailure: 0,
            deepWorkCompleted: 0,
            marathonsCompleted: 0,
            totalFocusMinutes: 0,
            todayXP: 0,
            todayCompleted: 0,
            todayFailed: 0,
            todayDate: null
        },
        analytics: { dailyXP: {}, dailyFocus: {}, dailySuccess: {} },
        settings: { focusMode: "focus", sound: "on", aiProvider: "none", aiKey: "", aiModel: "", aiRole: "partner", firebaseConfig: null },
        lockdown: false,
        activeMission: null,
        overseer: { level: 1, xp: 0 },
        missionProofs: []
    };
}

// Global State
let state = getDefaultState();
let timerInterval = null;
let timerRemaining = 0;
let timerTotal = 0;
let firebaseDB = null;
let charts = {};
let pendingMissionCompletion = null;
    pendingMissionCompletion =
    state.activeMission;