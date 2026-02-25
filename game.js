/**
 * 鳌太线模拟器 - 游戏主逻辑 (重构版)
 * 秦岭鳌山-太白山穿越生存游戏
 * 
 * 版本: 2.0 - 深度整合的天气-地形-事件-属性系统
 */

// ==================== 游戏配置 ====================

// 真实鳌太线数据
const AOTAI_DATA = {
    totalDistance: 59,          // 总距离 km
    totalElevation: 2075,       // 累计爬升 m
    maxAltitude: 3475,          // 最高海拔 m (导航架)
    normalDuration: { min: 3, max: 5 },  // 正常耗时 3-5天
    fastRecord: 1.5,            // 强驴记录 1.5天
    dangerLevel: 'high'         // 死亡风险等级
};

// ==================== 难度配置 ====================

const DIFFICULTY_MODES = {
    easy: {
        id: "easy",
        name: "简单模式",
        icon: "🌱",
        description: "适合新手体验，资源丰富，天气温和",
        color: "#4CAF50",
        initialStats: {
            stamina: 120,
            maxStamina: 120,
            food: 120,
            water: 120,
            mood: 80,
            sanity: 100,
            bodyTemp: 37
        },
        equipmentPoints: 150,
        weatherModifier: -0.30,      // 恶劣天气概率 -30%
        moveCostModifier: -0.20,     // 移动消耗 -20%
        resourceDrainModifier: -0.20, // 资源消耗 -20%
        achievementMultiplier: 0.5,   // 成就倍率 0.5x
        blizzardChanceModifier: 0,    // 暴风雪概率修正
        permanentDeath: false,        // 是否永久死亡
        unlockRequirement: null       // 解锁条件
    },
    normal: {
        id: "normal",
        name: "普通模式",
        icon: "🎯",
        description: "标准挑战，平衡的游戏体验",
        color: "#2196F3",
        initialStats: {
            stamina: 100,
            maxStamina: 100,
            food: 100,
            water: 100,
            mood: 50,
            sanity: 100,
            bodyTemp: 37
        },
        equipmentPoints: 100,
        weatherModifier: 0,          // 基准
        moveCostModifier: 0,         // 基准
        resourceDrainModifier: 0,    // 基准
        achievementMultiplier: 1.0,   // 成就倍率 1.0x
        blizzardChanceModifier: 0,    // 基准
        permanentDeath: false,
        unlockRequirement: null
    },
    hard: {
        id: "hard",
        name: "困难模式",
        icon: "🔥",
        description: "严峻挑战，资源紧张，天气恶劣",
        color: "#FF5722",
        initialStats: {
            stamina: 80,
            maxStamina: 80,
            food: 80,
            water: 80,
            mood: 30,
            sanity: 80,
            bodyTemp: 37
        },
        equipmentPoints: 80,
        weatherModifier: 0.30,       // 恶劣天气概率 +30%
        moveCostModifier: 0.20,      // 移动消耗 +20%
        resourceDrainModifier: 0.20,  // 资源消耗 +20%
        achievementMultiplier: 1.5,   // 成就倍率 1.5x
        blizzardChanceModifier: 0.15, // 暴风雪概率增加
        permanentDeath: false,
        unlockRequirement: "complete_normal" // 需要通关普通模式
    },
    hell: {
        id: "hell",
        name: "地狱模式",
        icon: "💀",
        description: "极限挑战，生存几率极低，永久死亡",
        color: "#9C27B0",
        initialStats: {
            stamina: 60,
            maxStamina: 60,
            food: 60,
            water: 60,
            mood: 20,
            sanity: 60,
            bodyTemp: 36
        },
        equipmentPoints: 50,
        weatherModifier: 0.50,       // 恶劣天气概率 +50%
        moveCostModifier: 0.40,      // 移动消耗 +40%
        resourceDrainModifier: 0.40,  // 资源消耗 +40%
        achievementMultiplier: 2.0,   // 成就倍率 2.0x
        blizzardChanceModifier: 0.30, // 暴风雪概率大幅增加
        permanentDeath: true,         // 永久死亡，无存档
        unlockRequirement: "complete_hard" // 需要通关困难模式
    }
};

// 特殊成就（高难度解锁）
const SPECIAL_ACHIEVEMENTS = [
    { id: "hell_survivor", name: "地狱行者", icon: "🔥", desc: "在地狱模式下完成穿越", category: "special", condition: "hell_mode_complete" },
    { id: "iron_will", name: "钢铁意志", icon: "⚔️", desc: "在困难或地狱模式下无伤通关", category: "special", condition: "hard_no_injury" },
    { id: "minimalist", name: "极简主义者", icon: "🍃", desc: "在地狱模式下使用不超过30点装备预算通关", category: "special", condition: "hell_minimal_equipment" },
    { id: "storm_master", name: "风暴之主", icon: "🌪️", desc: "在地狱模式下经历5次以上暴风雪并存活", category: "special", condition: "hell_blizzard_survivor" }
];

// ==================== 天气系统 ====================

const WEATHER_TYPES = {
    sunny: {
        id: "sunny",
        name: "晴天",
        icon: "☀️",
        temperature: 15,           // 基础温度(°C)
        windSpeed: 2,              // 风速等级 0-5
        visibility: "good",        // 能见度
        moveCost: 1.0,             // 移动消耗倍率
        staminaDrain: 1.0,         // 体力消耗倍率
        waterDrain: 1.2,           // 水分消耗倍率 (晴天出汗多)
        foodDrain: 1.0,            // 食物消耗倍率
        moodEffect: 5,             // 心情每小时变化
        bodyTempEffect: 0.5,       // 体温每小时变化
        wetnessChange: -5,         // 湿身程度变化
        eventModifiers: {          // 事件概率修正
            heatStroke: 0.15,      // 中暑概率增加
            dehydration: 0.1,      // 脱水概率
            sunburn: 0.08,         // 晒伤概率
            getLost: -0.1,         // 迷路概率降低
            fall: 0.0              // 滑坠概率
        },
        description: "阳光明媚，视野良好，但要注意防晒和补水"
    },
    cloudy: {
        id: "cloudy",
        name: "多云",
        icon: "☁️",
        temperature: 12,
        windSpeed: 2,
        visibility: "good",
        moveCost: 1.0,
        staminaDrain: 1.0,
        waterDrain: 1.0,
        foodDrain: 1.0,
        moodEffect: 2,
        bodyTempEffect: 0,
        wetnessChange: -2,
        eventModifiers: {
            heatStroke: 0.05,
            dehydration: 0.02,
            getLost: 0.0,
            fall: 0.0
        },
        description: "天气凉爽，适合行进"
    },
    lightRain: {
        id: "light_rain",
        name: "小雨",
        icon: "🌦️",
        temperature: 8,
        windSpeed: 3,
        visibility: "normal",
        moveCost: 1.2,
        staminaDrain: 1.1,
        waterDrain: 0.9,
        foodDrain: 1.1,
        moodEffect: -3,
        bodyTempEffect: -0.3,
        wetnessChange: 10,
        eventModifiers: {
            heatStroke: -0.1,
            hypothermia: 0.05,
            getLost: 0.05,
            fall: 0.08,
            equipmentDamage: 0.05
        },
        description: "路面湿滑，小心行走"
    },
    heavyRain: {
        id: "heavy_rain",
        name: "大雨",
        icon: "🌧️",
        temperature: 5,
        windSpeed: 4,
        visibility: "poor",
        moveCost: 1.5,
        staminaDrain: 1.3,
        waterDrain: 0.8,
        foodDrain: 1.2,
        moodEffect: -8,
        bodyTempEffect: -0.8,
        wetnessChange: 25,
        eventModifiers: {
            heatStroke: -0.2,
            hypothermia: 0.15,
            getLost: 0.15,
            fall: 0.2,
            equipmentDamage: 0.1,
            landslide: 0.05
        },
        description: "大雨倾盆，能见度低，失温风险增加"
    },
    fog: {
        id: "fog",
        name: "大雾",
        icon: "🌫️",
        temperature: 6,
        windSpeed: 1,
        visibility: "none",
        moveCost: 1.4,
        staminaDrain: 1.2,
        waterDrain: 1.0,
        foodDrain: 1.1,
        moodEffect: -10,
        bodyTempEffect: -0.2,
        wetnessChange: 15,
        eventModifiers: {
            getLost: 0.35,         // 极易迷路
            fall: 0.15,
            panic: 0.1,
            altitudeSickness: 0.05
        },
        description: "浓雾弥漫，能见度极低，极易迷路"
    },
    snow: {
        id: "snow",
        name: "小雪",
        icon: "🌨️",
        temperature: -5,
        windSpeed: 3,
        visibility: "poor",
        moveCost: 1.6,
        staminaDrain: 1.4,
        waterDrain: 0.7,
        foodDrain: 1.3,
        moodEffect: -12,
        bodyTempEffect: -1.0,
        wetnessChange: 20,
        eventModifiers: {
            hypothermia: 0.2,
            frostbite: 0.1,
            getLost: 0.1,
            fall: 0.15,
            altitudeSickness: 0.05
        },
        description: "雪花飘落，寒冷刺骨"
    },
    snowstorm: {
        id: "snowstorm",
        name: "暴风雪",
        icon: "❄️",
        temperature: -15,
        windSpeed: 5,
        visibility: "none",
        moveCost: 2.5,
        staminaDrain: 2.0,
        waterDrain: 0.5,
        foodDrain: 1.5,
        moodEffect: -20,
        bodyTempEffect: -2.0,
        wetnessChange: 40,
        eventModifiers: {
            hypothermia: 0.5,      // 极高失温风险
            frostbite: 0.3,
            getLost: 0.4,
            fall: 0.25,
            altitudeSickness: 0.1,
            death: 0.05            // 直接死亡风险
        },
        description: "暴风雪肆虐，极度危险，必须立即寻找避难所"
    },
    thunderstorm: {
        id: "thunderstorm",
        name: "雷暴",
        icon: "⛈️",
        temperature: 10,
        windSpeed: 5,
        visibility: "poor",
        moveCost: 1.8,
        staminaDrain: 1.5,
        waterDrain: 0.9,
        foodDrain: 1.2,
        moodEffect: -15,
        bodyTempEffect: -0.5,
        wetnessChange: 30,
        eventModifiers: {
            hypothermia: 0.1,
            getLost: 0.2,
            fall: 0.2,
            lightning: 0.03,       // 雷击风险
            panic: 0.15
        },
        description: "电闪雷鸣，山脊极度危险"
    }
};

// 天气连锁反应链
const WEATHER_CHAINS = {
    sunny: {
        duration: { min: 2, max: 6 },  // 持续小时数
        nextWeather: { cloudy: 0.4, sunny: 0.3, lightRain: 0.2, fog: 0.1 }
    },
    cloudy: {
        duration: { min: 2, max: 5 },
        nextWeather: { sunny: 0.3, cloudy: 0.25, lightRain: 0.3, fog: 0.15 }
    },
    lightRain: {
        duration: { min: 1, max: 4 },
        nextWeather: { cloudy: 0.3, lightRain: 0.2, heavyRain: 0.3, fog: 0.2 }
    },
    heavyRain: {
        duration: { min: 1, max: 3 },
        nextWeather: { lightRain: 0.4, heavyRain: 0.2, fog: 0.3, thunderstorm: 0.1 }
    },
    fog: {
        duration: { min: 2, max: 8 },
        nextWeather: { cloudy: 0.3, fog: 0.3, lightRain: 0.2, sunny: 0.2 }
    },
    snow: {
        duration: { min: 2, max: 6 },
        nextWeather: { snow: 0.3, cloudy: 0.2, snowstorm: 0.3, fog: 0.2 }
    },
    snowstorm: {
        duration: { min: 3, max: 12 },
        nextWeather: { snow: 0.4, snowstorm: 0.3, cloudy: 0.3 }
    },
    thunderstorm: {
        duration: { min: 1, max: 3 },
        nextWeather: { heavyRain: 0.5, lightRain: 0.3, cloudy: 0.2 }
    }
};

// ==================== 地形系统 ====================

const TERRAIN_TYPES = {
    grassland: {
        id: "grassland",
        name: "草甸",
        icon: "🌿",
        moveSpeed: 1.0,
        danger: 1,
        staminaCost: 1.0,
        description: "平坦的草甸，行走舒适",
        risks: {},
        modifiers: {}
    },
    rocky: {
        id: "rocky",
        name: "碎石坡",
        icon: "🪨",
        moveSpeed: 0.7,
        danger: 2,
        staminaCost: 1.3,
        description: "碎石遍布，容易扭伤",
        risks: {
            ankleSprain: 0.1,      // 扭伤概率
            fall: 0.05,
            equipmentDamage: 0.03
        },
        modifiers: {
            staminaDrain: 1.2,
            moodEffect: -2
        }
    },
    cliff: {
        id: "cliff",
        name: "陡峭岩壁",
        icon: "🧗",
        moveSpeed: 0.4,
        danger: 4,
        staminaCost: 1.8,
        description: "需要攀爬，极度危险",
        risks: {
            fall: 0.15,            // 高坠概率
            injury: 0.1,
            equipmentDamage: 0.05,
            panic: 0.08
        },
        modifiers: {
            staminaDrain: 1.5,
            moodEffect: -8,
            sanityEffect: -5
        }
    },
    ridge: {
        id: "ridge",
        name: "山脊",
        icon: "🏔️",
        moveSpeed: 0.6,
        danger: 3,
        staminaCost: 1.5,
        description: "风大寒冷，暴露感强",
        risks: {
            fall: 0.08,
            blownAway: 0.05,       // 被风吹倒
            hypothermia: 0.1
        },
        modifiers: {
            staminaDrain: 1.3,
            bodyTempEffect: -1.0,  // 体温下降快
            windEffect: 2,         // 风速+2级
            moodEffect: -5,
            sanityEffect: -3
        }
    },
    forest: {
        id: "forest",
        name: "灌木丛",
        icon: "🌲",
        moveSpeed: 0.8,
        danger: 2,
        staminaCost: 1.2,
        description: "灌木丛生，需要开路",
        risks: {
            wildAnimal: 0.08,      // 野生动物
            getLost: 0.05,
            scratched: 0.1         // 划伤
        },
        modifiers: {
            staminaDrain: 1.1,
            windEffect: -1,        // 避风
            moodEffect: 2
        }
    },
    snowfield: {
        id: "snowfield",
        name: "积雪区",
        icon: "❄️",
        moveSpeed: 0.5,
        danger: 3,
        staminaCost: 1.6,
        description: "深雪难行，容易陷落",
        risks: {
            fall: 0.1,
            frostbite: 0.15,
            hypothermia: 0.2,
            avalanche: 0.02        // 雪崩
        },
        modifiers: {
            staminaDrain: 1.4,
            bodyTempEffect: -1.5,
            moodEffect: -10,
            wetnessChange: 15
        }
    },
    scree: {
        id: "scree",
        name: "流石滩",
        icon: "⛰️",
        moveSpeed: 0.5,
        danger: 3,
        staminaCost: 1.7,
        description: "碎石流动，极易滑坠",
        risks: {
            fall: 0.2,
            ankleSprain: 0.15,
            equipmentDamage: 0.08
        },
        modifiers: {
            staminaDrain: 1.6,
            moodEffect: -10,
            sanityEffect: -5
        }
    },
    river: {
        id: "river",
        name: "涉水路段",
        icon: "💧",
        moveSpeed: 0.6,
        danger: 2,
        staminaCost: 1.4,
        description: "需要涉水过河",
        risks: {
            fall: 0.1,
            wetness: 0.5,          // 高概率湿身
            hypothermia: 0.1
        },
        modifiers: {
            staminaDrain: 1.3,
            wetnessChange: 30,
            bodyTempEffect: -1.0
        }
    }
};

// ==================== 地图节点定义 ====================

const MAP_NODES = [
    { 
        id: 0, 
        name: "塘口村", 
        type: "start", 
        desc: "徒步起点，最后的补给站", 
        elevation: 1700,
        terrain: "grassland"
    },
    { 
        id: 1, 
        name: "火烧坡", 
        type: "normal", 
        desc: "陡峭的山坡，视野开阔", 
        elevation: 2400,
        terrain: "scree"
    },
    { 
        id: 2, 
        name: "2900营地", 
        type: "camp", 
        desc: "理想的露营地点，有水源", 
        elevation: 2900,
        terrain: "grassland"
    },
    { 
        id: 3, 
        name: "鳌山大梁", 
        type: "danger", 
        desc: "山脊行走，风大危险", 
        elevation: 3400,
        terrain: "ridge"
    },
    { 
        id: 4, 
        name: "导航架", 
        type: "landmark", 
        desc: "标志性地点，容易迷路", 
        elevation: 3475,
        terrain: "ridge"
    },
    { 
        id: 5, 
        name: "药王庙", 
        type: "camp", 
        desc: "废弃庙宇，可遮风避雨", 
        elevation: 3200,
        terrain: "grassland"
    },
    { 
        id: 6, 
        name: "麦秸岭", 
        type: "danger", 
        desc: "陡峭岩壁，需要攀爬", 
        elevation: 3500,
        terrain: "cliff"
    },
    { 
        id: 7, 
        name: "水窝子营地", 
        type: "camp", 
        desc: "优质营地，水源充足", 
        elevation: 3100,
        terrain: "grassland"
    },
    { 
        id: 8, 
        name: "太白山景区", 
        type: "end", 
        desc: "终点！你成功穿越了鳌太线！", 
        elevation: 2800,
        terrain: "forest"
    }
];

// 节点间连接关系
const ROUTES = [
    { from: 0, to: 1, distance: 8, difficulty: "normal", desc: "常规山路上坡", terrain: "scree", altitudeChange: 700 },
    { from: 1, to: 2, distance: 6, difficulty: "easy", desc: "穿越灌木丛", terrain: "forest", altitudeChange: 500 },
    { from: 2, to: 3, distance: 10, difficulty: "hard", desc: "攀登鳌山", terrain: "ridge", altitudeChange: 500 },
    { from: 3, to: 4, distance: 5, difficulty: "hard", desc: "山脊横切", terrain: "ridge", altitudeChange: 75 },
    { from: 4, to: 5, distance: 8, difficulty: "normal", desc: "下坡路段", terrain: "rocky", altitudeChange: -275 },
    { from: 5, to: 6, distance: 7, difficulty: "hard", desc: "翻越麦秸岭", terrain: "cliff", altitudeChange: 300 },
    { from: 6, to: 7, distance: 9, difficulty: "normal", desc: "长距离下坡", terrain: "snowfield", altitudeChange: -400 },
    { from: 7, to: 8, distance: 6, difficulty: "easy", desc: "景区步道", terrain: "forest", altitudeChange: -300 }
];

// ==================== 状态效果系统 ====================

const STATUS_EFFECTS = {
    heatStroke: {
        id: "heatStroke",
        name: "中暑",
        icon: "🥵",
        description: "体温过高，头晕恶心",
        effects: {
            staminaRegen: -0.8,      // 体力恢复降低
            staminaDrain: 1.3,       // 体力消耗增加
            judgment: -25,           // 判断力下降
            moveSpeed: 0.7,          // 移动速度降低
            moodEffect: -10
        },
        duration: 3600,              // 持续时间(秒)
        cure: ["rest", "water", "shade"],
        fatal: false,
        chainEvents: ["decisionMistake", "stumble"]
    },
    hypothermia: {
        id: "hypothermia",
        name: "失温",
        icon: "🥶",
        description: "体温过低，意识模糊",
        effects: {
            staminaRegen: -1.0,
            staminaDrain: 1.5,
            judgment: -35,
            moveSpeed: 0.5,
            moodEffect: -15,
            sanityEffect: -10
        },
        duration: -1,                // -1表示需要主动治疗
        cure: ["warmth", "rest", "dry"],
        fatal: true,                 // 可能致命
        chainEvents: ["panic", "decisionMistake", "collapse"]
    },
    altitudeSickness: {
        id: "altitudeSickness",
        name: "高原反应",
        icon: "🤢",
        description: "头痛恶心，呼吸困难",
        effects: {
            staminaRegen: -0.5,
            staminaDrain: 1.2,
            moveSpeed: 0.75,
            judgment: -15,
            moodEffect: -8
        },
        duration: -1,
        cure: ["descent", "rest", "oxygen"],
        fatal: false,
        chainEvents: ["nausea", "weakness"]
    },
    injured: {
        id: "injured",
        name: "受伤",
        icon: "🤕",
        description: "身体受伤，行动不便",
        effects: {
            moveSpeed: 0.6,
            maxStamina: 70,
            staminaDrain: 1.2,
            moodEffect: -10
        },
        duration: 86400,             // 24小时
        cure: ["medicine", "rest"],
        fatal: false,
        chainEvents: ["slowProgress", "missCamp"]
    },
    panic: {
        id: "panic",
        name: "恐慌",
        icon: "😰",
        description: "心神不宁，判断力下降",
        effects: {
            judgment: -45,
            eventSuccessRate: 0.6,
            sanityEffect: -15,
            moodEffect: -20,
            staminaDrain: 1.3
        },
        duration: 1800,              // 30分钟
        cure: ["rest", "calm", "company"],
        fatal: false,
        chainEvents: ["rashDecision", "getLost"]
    },
    dehydration: {
        id: "dehydration",
        name: "脱水",
        icon: "💧",
        description: "严重缺水，口干舌燥",
        effects: {
            staminaRegen: -0.6,
            staminaDrain: 1.2,
            judgment: -20,
            moodEffect: -12
        },
        duration: 7200,
        cure: ["water", "rest"],
        fatal: true,
        chainEvents: ["weakness", "heatStroke"]
    },
    frostbite: {
        id: "frostbite",
        name: "冻伤",
        icon: "❄️",
        description: "肢体冻伤，知觉丧失",
        effects: {
            moveSpeed: 0.5,
            maxStamina: 60,
            staminaDrain: 1.3,
            moodEffect: -15
        },
        duration: 172800,            // 48小时
        cure: ["warmth", "medicine", "rest"],
        fatal: false,
        chainEvents: ["gangrene"]     // 坏疽
    },
    wet: {
        id: "wet",
        name: "湿身",
        icon: "💦",
        description: "衣物湿透，体温流失快",
        effects: {
            bodyTempEffect: -1.5,
            staminaDrain: 1.1,
            moodEffect: -8
        },
        duration: -1,
        cure: ["dry", "warmth", "changeClothes"],
        fatal: false,
        chainEvents: ["hypothermia"]
    },
    exhausted: {
        id: "exhausted",
        name: "极度疲劳",
        icon: "😫",
        description: "精疲力竭，需要休息",
        effects: {
            staminaRegen: -0.3,
            moveSpeed: 0.6,
            judgment: -20,
            eventSuccessRate: 0.7,
            moodEffect: -10
        },
        duration: 3600,
        cure: ["rest", "food", "sleep"],
        fatal: false,
        chainEvents: ["fall", "decisionMistake"]
    },
    sunburn: {
        id: "sunburn",
        name: "晒伤",
        icon: "☀️",
        description: "皮肤晒伤，疼痛难忍",
        effects: {
            staminaDrain: 1.1,
            moodEffect: -5
        },
        duration: 21600,             // 6小时
        cure: ["rest", "shade"],
        fatal: false,
        chainEvents: []
    },
    ankleSprain: {
        id: "ankleSprain",
        name: "脚踝扭伤",
        icon: "🦶",
        description: "脚踝扭伤，行走困难",
        effects: {
            moveSpeed: 0.5,
            staminaDrain: 1.4,
            maxStamina: 75
        },
        duration: 43200,             // 12小时
        cure: ["medicine", "rest", "bandage"],
        fatal: false,
        chainEvents: ["slowProgress"]
    }
};

// ==================== 事件系统 ====================

// 事件触发条件矩阵
const EVENT_CONDITIONS = {
    heatStroke: {
        weather: ["sunny"],
        temperature: { min: 25 },
        terrain: "any",
        altitude: "any",
        time: "day",
        statusEffects: [],
        baseChance: 0.05
    },
    hypothermia: {
        weather: ["snow", "snowstorm", "heavyRain"],
        temperature: { max: 5 },
        terrain: "any",
        altitude: "any",
        time: "any",
        statusEffects: ["wet"],
        baseChance: 0.08
    },
    getLost: {
        weather: ["fog", "snowstorm"],
        temperature: "any",
        terrain: ["forest", "ridge"],
        altitude: { min: 2500 },
        time: "any",
        statusEffects: ["panic"],
        baseChance: 0.1
    },
    fall: {
        weather: "any",
        temperature: "any",
        terrain: ["cliff", "scree", "snowfield", "ridge"],
        altitude: "any",
        time: "any",
        statusEffects: ["exhausted", "panic"],
        baseChance: 0.05
    },
    altitudeSickness: {
        weather: "any",
        temperature: "any",
        terrain: "any",
        altitude: { min: 3000 },
        time: "any",
        statusEffects: [],
        baseChance: 0.06
    },
    wildAnimal: {
        weather: "any",
        temperature: "any",
        terrain: ["forest", "grassland"],
        altitude: "any",
        time: ["dusk", "night"],
        statusEffects: [],
        baseChance: 0.04
    },
    dehydration: {
        weather: ["sunny", "cloudy"],
        temperature: { min: 20 },
        terrain: "any",
        altitude: "any",
        time: "day",
        statusEffects: [],
        baseChance: 0.05
    },
    panic: {
        weather: ["fog", "snowstorm", "thunderstorm"],
        temperature: "any",
        terrain: "any",
        altitude: { min: 2800 },
        time: "night",
        statusEffects: ["getLost"],
        baseChance: 0.1
    },
    equipmentDamage: {
        weather: ["heavyRain", "snowstorm"],
        temperature: "any",
        terrain: ["rocky", "scree", "cliff"],
        altitude: "any",
        time: "any",
        statusEffects: [],
        baseChance: 0.06
    },
    landslide: {
        weather: ["heavyRain", "thunderstorm"],
        temperature: "any",
        terrain: ["scree", "cliff"],
        altitude: "any",
        time: "any",
        statusEffects: [],
        baseChance: 0.02
    }
};

// 随机事件定义
const RANDOM_EVENTS = [
    {
        id: "find_water",
        title: "发现水源",
        icon: "💧",
        description: "你发现了一处清澈的山泉！",
        type: "good",
        choices: [
            { text: "喝水补充 (+30水分, +5心情)", effect: { water: 30, mood: 5 }, condition: null },
            { text: "装满水壶 (+20水分, -5体力)", effect: { water: 20, stamina: -5 }, condition: "has_bottle" },
            { text: "休息片刻 (+10体力, +10心情)", effect: { stamina: 10, mood: 10 }, condition: null }
        ]
    },
    {
        id: "wild_animal",
        title: "野生动物",
        icon: "🦌",
        description: "你遇到了一只羚牛，它正警惕地看着你。",
        type: "neutral",
        choices: [
            { text: "慢慢后退 (-10体力, +5理智)", effect: { stamina: -10, sanity: 5 }, condition: null },
            { text: "大声驱赶 (-20体力, -10心情, 可能激怒)", effect: { stamina: -20, mood: -10 }, risk: { angryAnimal: 0.3 }, condition: null },
            { text: "绕道而行 (-30体力)", effect: { stamina: -30 }, condition: null }
        ]
    },
    {
        id: "other_hiker",
        title: "遇到徒步者",
        icon: "🧗",
        description: "你遇到了另一位穿越者，他看起来经验丰富。",
        type: "good",
        choices: [
            { text: "交换情报 (+10心情, +5理智)", effect: { mood: 10, sanity: 5 }, condition: null },
            { text: "分享食物 (-10食物, +20心情, 助人为乐)", effect: { food: -10, mood: 20 }, condition: "has_food", isHelp: true },
            { text: "结伴同行 (+15理智, 移动消耗-10%)", effect: { sanity: 15 }, buff: { moveCost: 0.9 }, condition: null }
        ]
    },
    {
        id: "equipment_damage",
        title: "装备损坏",
        icon: "🔧",
        description: "糟糕！你的装备在行进中受损了。",
        type: "bad",
        choices: [
            { text: "尝试修理 (-20体力, 50%成功)", effect: { stamina: -20 }, successRate: 0.5, condition: null },
            { text: "放弃使用 (-15心情)", effect: { mood: -15 }, condition: null },
            { text: "凑合着用 (-15体力, -10心情, 后续风险+10%)", effect: { stamina: -15, mood: -10 }, debuff: { riskIncrease: 0.1 }, condition: null }
        ]
    },
    {
        id: "beautiful_view",
        title: "绝美风景",
        icon: "🏔️",
        description: "眼前的景色让你屏住了呼吸，太美了！",
        type: "scenery",
        choices: [
            { text: "拍照留念 (+15心情, +5理智)", effect: { mood: 15, sanity: 5 }, condition: null },
            { text: "静静欣赏 (+10心情, -10体力, +10理智)", effect: { mood: 10, stamina: -10, sanity: 10 }, condition: null },
            { text: "继续前进", effect: {}, condition: null }
        ]
    },
    {
        id: "slip_fall",
        title: "滑倒摔伤",
        icon: "⚠️",
        description: "路面湿滑，你不慎滑倒了！",
        type: "bad",
        choices: [
            { text: "检查伤势 (-25体力, 获得'受伤'状态)", effect: { stamina: -25 }, addStatus: "injured", condition: null },
            { text: "简单处理 (-15体力, -5心情, 有药品则避免受伤)", effect: { stamina: -15, mood: -5 }, preventStatus: "injured", condition: "has_medicine" },
            { text: "忍痛前进 (-35体力, 伤势恶化风险)", effect: { stamina: -35 }, risk: { injuryWorsen: 0.4 }, condition: null }
        ]
    },
    {
        id: "find_shelter",
        title: "发现避雨处",
        icon: "🏚️",
        description: "你发现了一处可以避雨的地方。",
        type: "good",
        choices: [
            { text: "休息片刻 (+25体力, +15心情, 湿身-30%)", effect: { stamina: 25, mood: 15, wetness: -30 }, condition: null },
            { text: "生火取暖 (+35体力, -5食物, 移除湿身)", effect: { stamina: 35, food: -5 }, removeStatus: "wet", condition: null },
            { text: "继续前进", effect: {}, condition: null }
        ]
    },
    {
        id: "lost_item",
        title: "遗失物品",
        icon: "🎒",
        description: "你发现地上有一个遗失的背包...",
        type: "neutral",
        choices: [
            { text: "查看并带走 (+15食物 或 +15水分)", effect: { food: 15 }, random: [{ food: 15 }, { water: 15 }], condition: null },
            { text: "留在原地 (+5理智, 环保行为)", effect: { sanity: 5 }, eco: true, condition: null }
        ]
    },
    {
        id: "stranded_hiker",
        title: "遇险者",
        icon: "🆘",
        description: "你发现一名受伤的徒步者，他请求帮助。",
        type: "moral",
        choices: [
            { text: "全力救助 (-40体力, -20食物, +50理智, 道德加分)", effect: { stamina: -40, food: -20, sanity: 50 }, moral: "good", condition: null },
            { text: "分享物资 (-15食物, +20理智)", effect: { food: -15, sanity: 20 }, moral: "neutral", condition: null },
            { text: "无能为力 (-20理智)", effect: { sanity: -20 }, moral: "bad", condition: null }
        ]
    },
    {
        id: "weather_change",
        title: "天气突变",
        icon: "🌪️",
        description: "天空突然变暗，天气即将恶化！",
        type: "bad",
        choices: [
            { text: "立即寻找避难所 (-10体力, 安全)", effect: { stamina: -10 }, safe: true, condition: null },
            { text: "加快速度 (-25体力, 20%遭遇危险)", effect: { stamina: -25 }, risk: { danger: 0.2 }, condition: null },
            { text: "原地等待 (-5体力, 天气恶化)", effect: { stamina: -5 }, weatherWorsen: true, condition: null }
        ]
    }
];

// ==================== 装备定义 ====================

const EQUIPMENT = {
    backpacks: [
        { id: "basic_bag", name: "基础背包", weight: 1, capacity: 15, cost: 10, desc: "轻便但容量小", warmth: 0, durability: 100 },
        { id: "hiking_bag", name: "登山包", weight: 2, capacity: 25, cost: 25, desc: "平衡的选择", warmth: 0, durability: 100, effect: "reduce_weight_penalty", value: 0.1 },
        { id: "heavy_bag", name: "重装背包", weight: 4, capacity: 35, cost: 40, desc: "大容量可携带帐篷", warmth: 0, durability: 100, effect: "reduce_weight_penalty", value: 0.2, canCarryTent: true }
    ],
    clothing: [
        { id: "quick_dry", name: "速干衣", weight: 0.5, warmth: 1, waterproof: 0, cost: 15, desc: "雨天体力消耗-10%,湿身恢复+20%", durability: 100, effects: ["rain_stamina_reduce", "wet_recovery_boost"] },
        { id: "jacket", name: "冲锋衣", weight: 1, warmth: 3, waterproof: 2, cost: 30, desc: "防风防雨保暖", durability: 100, effects: ["wind_resist", "rain_resist", "warmth_keep"] },
        { id: "down_jacket", name: "羽绒服", weight: 1.5, warmth: 5, waterproof: 1, cost: 35, desc: "高海拔/暴风雪专用", durability: 100, effects: ["altitude_stamina", "warmth_keep", "snowstorm_immunity"] },
        { id: "rain_gear", name: "雨衣", weight: 0.8, warmth: 1, waterproof: 3, cost: 20, desc: "防雨专用", durability: 100 }
    ],
    tools: [
        { id: "trekking_poles", name: "登山杖", weight: 0.5, effect: "reduce_stamina_cost", value: 0.2, cost: 15, desc: "移动体力-20%,滑倒概率-50%", durability: 100, effects: ["reduce_move_stamina", "prevent_slip"] },
        { id: "headlamp", name: "头灯", weight: 0.3, effect: "night_move", cost: 10, desc: "夜间移动无额外消耗,大雾视野+1", durability: 100, effects: ["night_move_free", "fog_vision", "dark_event"] },
        { id: "compass", name: "指南针", weight: 0.2, effect: "prevent_lost", value: 0.5, cost: 10, desc: "防止迷路,显示正确选项,导航架附近效果增强", durability: 100, effects: ["prevent_lost_fog", "show_correct_choice", "landmark_boost"] },
        { id: "gps", name: "GPS定位器", weight: 0.4, effect: "prevent_lost", value: 0.8, cost: 25, desc: "精确定位,迷路自动恢复,紧急求救", durability: 100, effects: ["precise_location", "auto_recover_lost", "emergency_rescue"] },
        { id: "first_aid", name: "急救包", weight: 0.6, effect: "heal", value: 30, cost: 20, desc: "治疗伤势", durability: 100 },
        { id: "rope", name: "登山绳", weight: 1, effect: "climb_safety", value: 0.3, cost: 18, desc: "降低攀爬风险", durability: 100 }
    ],
    food: [
        { id: "biscuits", name: "压缩饼干", weight: 0.5, foodValue: 30, waterCost: -5, cost: 5, desc: "轻便耐饿" },
        { id: "energy_bar", name: "能量棒", weight: 0.3, foodValue: 20, waterCost: 0, cost: 8, desc: "快速补充" },
        { id: "self_heating", name: "自热米饭", weight: 1, foodValue: 50, waterCost: -10, cost: 15, desc: "热食恢复" },
        { id: "chocolate", name: "巧克力", weight: 0.2, foodValue: 15, moodValue: 10, cost: 8, desc: "提升心情" }
    ],
    water: [
        { id: "water_bottle", name: "水壶", weight: 0.3, capacity: 20, cost: 8, desc: "储水工具" },
        { id: "water_bladder", name: "水袋", weight: 0.5, capacity: 35, cost: 15, desc: "大容量储水" },
        { id: "purifier", name: "净水片", weight: 0.1, uses: 5, cost: 12, desc: "净化水源" }
    ]
};

// ==================== 装备效果系统 ====================

const EQUIPMENT_EFFECTS = {
    // 速干衣效果
    quick_dry: {
        // 雨天体力消耗减少10%
        onStaminaCost: (baseCost, weather, equipment) => {
            if (weather.id === "light_rain" || weather.id === "heavy_rain") {
                return baseCost * 0.9;
            }
            return baseCost;
        },
        // 湿身后恢复速度+20%
        onWetnessRecovery: (recoveryAmount, equipment) => {
            return recoveryAmount * 1.2;
        }
    },
    // 冲锋衣效果
    jacket: {
        // 防风：大风天气体力消耗-15%
        onStaminaCost: (baseCost, weather, equipment) => {
            if (weather.windSpeed >= 4) {
                return baseCost * 0.85;
            }
            return baseCost;
        },
        // 防雨：雨天效果减半
        onWeatherEffect: (effect, weather, equipment) => {
            if (weather.id === "light_rain" || weather.id === "heavy_rain") {
                return effect * 0.5;
            }
            return effect;
        },
        // 保暖：体温下降速度-20%
        onBodyTempChange: (tempChange, equipment) => {
            if (tempChange < 0) {
                return tempChange * 0.8;
            }
            return tempChange;
        }
    },
    // 羽绒服效果
    down_jacket: {
        // 高海拔（>3000m）体力消耗-15%
        onStaminaCost: (baseCost, weather, altitude, equipment) => {
            if (altitude > 3000) {
                return baseCost * 0.85;
            }
            return baseCost;
        },
        // 体温下降速度-30%
        onBodyTempChange: (tempChange, equipment) => {
            if (tempChange < 0) {
                return tempChange * 0.7;
            }
            return tempChange;
        },
        // 暴风雪天气可正常行动（移除了暴风雪移动限制）
        canMoveInSnowstorm: (equipment) => true
    },
    // 登山杖效果
    trekking_poles: {
        // 移动体力消耗-20%（已实现）
        onMoveStamina: (baseCost, equipment) => {
            return baseCost * 0.8;
        },
        // 滑倒事件概率-50%
        onSlipChance: (baseChance, equipment) => {
            return baseChance * 0.5;
        }
    },
    // 头灯效果
    headlamp: {
        // 夜间移动不增加额外消耗
        onNightMoveCost: (extraCost, equipment) => {
            return 0;
        },
        // 大雾天气视野+1级
        onVisibility: (visibility, weather, equipment) => {
            if (weather.id === "fog") {
                const levels = ["none", "poor", "normal", "good"];
                const currentIndex = levels.indexOf(visibility);
                return levels[Math.min(currentIndex + 1, levels.length - 1)];
            }
            return visibility;
        },
        // 洞穴/暗处事件可正常处理
        canHandleDarkEvent: (equipment) => true
    },
    // 指南针效果
    compass: {
        // 防止迷路（大雾天气）
        onGetLostChance: (baseChance, weather, equipment) => {
            if (weather.id === "fog") {
                return 0;
            }
            return baseChance * 0.5;
        },
        // 迷路事件可显示正确选项
        showCorrectChoiceInLostEvent: (equipment) => true,
        // 导航架附近效果增强
        nearLandmarkBoost: (node, equipment) => {
            if (node.name === "导航架") {
                return 1.5; // 效果增强50%
            }
            return 1;
        }
    },
    // GPS定位器效果
    gps: {
        // 随时查看精确位置
        getPreciseLocation: (equipment) => true,
        // 迷路时自动恢复
        autoRecoverFromLost: (equipment) => {
            return Math.random() < 0.8;
        },
        // 紧急求救功能（一次性）
        emergencyRescue: (equipment) => {
            if (!equipment.rescueUsed) {
                equipment.rescueUsed = true;
                return true;
            }
            return false;
        }
    },
    // 登山包效果
    hiking_bag: {
        // 负重对体力影响-10%
        onWeightPenalty: (penalty, equipment) => {
            return penalty * 0.9;
        }
    },
    // 重装背包效果
    heavy_bag: {
        // 负重对体力影响-20%
        onWeightPenalty: (penalty, equipment) => {
            return penalty * 0.8;
        },
        // 可携带帐篷（解锁露营选项）
        canCarryTent: (equipment) => true
    }
};

// 装备耐久度系统
const EQUIPMENT_DURABILITY = {
    // 使用装备消耗耐久
    useEquipment: (equipment, amount = 1) => {
        if (!equipment.durability) return true;
        equipment.durability = Math.max(0, equipment.durability - amount);
        return equipment.durability > 0;
    },
    
    // 检查装备是否有效（耐久>0）
    isEquipmentValid: (equipment) => {
        if (!equipment.durability) return true;
        return equipment.durability > 0;
    },
    
    // 获取装备效果倍率（耐久<30%效果减半）
    getEffectMultiplier: (equipment) => {
        if (!equipment.durability) return 1;
        if (equipment.durability <= 0) return 0;
        if (equipment.durability < 30) return 0.5;
        return 1;
    },
    
    // 修复装备
    repairEquipment: (equipment, amount = 30) => {
        if (!equipment.durability) return;
        equipment.durability = Math.min(100, equipment.durability + amount);
    },
    
    // 获取耐久状态描述
    getDurabilityStatus: (equipment) => {
        if (!equipment.durability) return { text: "", class: "" };
        if (equipment.durability <= 0) return { text: "已损坏", class: "broken" };
        if (equipment.durability < 30) return { text: "严重磨损", class: "critical" };
        if (equipment.durability < 60) return { text: "轻微磨损", class: "warning" };
        return { text: "状态良好", class: "good" };
    }
};

// 装备效果应用函数
const EquipmentSystem = {
    // 检查是否有某件装备
    hasEquipment: (equipmentId) => {
        return gameState.equipment.some(e => e.id === equipmentId && EQUIPMENT_DURABILITY.isEquipmentValid(e));
    },
    
    // 获取装备实例
    getEquipment: (equipmentId) => {
        return gameState.equipment.find(e => e.id === equipmentId && EQUIPMENT_DURABILITY.isEquipmentValid(e));
    },
    
    // 应用移动体力消耗效果
    applyMoveStaminaEffects: (baseCost, weather, terrain, altitude) => {
        let finalCost = baseCost;
        let multiplier = 1;
        
        // 登山杖效果
        const poles = EquipmentSystem.getEquipment("trekking_poles");
        if (poles) {
            const m = EQUIPMENT_DURABILITY.getEffectMultiplier(poles);
            finalCost *= (1 - 0.2 * m);
            // 消耗耐久
            EQUIPMENT_DURABILITY.useEquipment(poles, 0.5);
        }
        
        // 速干衣雨天效果
        const quickDry = EquipmentSystem.getEquipment("quick_dry");
        if (quickDry && (weather.id === "light_rain" || weather.id === "heavy_rain")) {
            const m = EQUIPMENT_DURABILITY.getEffectMultiplier(quickDry);
            finalCost *= (1 - 0.1 * m);
        }
        
        // 冲锋衣防风效果
        const jacket = EquipmentSystem.getEquipment("jacket");
        if (jacket && weather.windSpeed >= 4) {
            const m = EQUIPMENT_DURABILITY.getEffectMultiplier(jacket);
            finalCost *= (1 - 0.15 * m);
        }
        
        // 羽绒服高海拔效果
        const downJacket = EquipmentSystem.getEquipment("down_jacket");
        if (downJacket && altitude > 3000) {
            const m = EQUIPMENT_DURABILITY.getEffectMultiplier(downJacket);
            finalCost *= (1 - 0.15 * m);
        }
        
        // 背包负重效果
        const backpack = gameState.equipment.find(e => 
            EQUIPMENT.backpacks.some(b => b.id === e.id)
        );
        if (backpack) {
            const weightRatio = gameState.totalWeight / gameState.maxCapacity;
            let weightPenalty = 1 + (weightRatio * 0.5); // 负重越高惩罚越大
            
            // 登山包/重装背包减轻负重影响
            const hikingBag = EquipmentSystem.getEquipment("hiking_bag");
            const heavyBag = EquipmentSystem.getEquipment("heavy_bag");
            if (heavyBag) {
                const m = EQUIPMENT_DURABILITY.getEffectMultiplier(heavyBag);
                weightPenalty = 1 + (weightRatio * 0.5 * 0.8 * m);
                EQUIPMENT_DURABILITY.useEquipment(heavyBag, 0.3);
            } else if (hikingBag) {
                const m = EQUIPMENT_DURABILITY.getEffectMultiplier(hikingBag);
                weightPenalty = 1 + (weightRatio * 0.5 * 0.9 * m);
                EQUIPMENT_DURABILITY.useEquipment(hikingBag, 0.3);
            }
            
            finalCost *= weightPenalty;
        }
        
        return Math.floor(finalCost);
    },
    
    // 应用体温变化效果
    applyBodyTempEffects: (tempChange) => {
        let finalChange = tempChange;
        
        // 冲锋衣保暖
        const jacket = EquipmentSystem.getEquipment("jacket");
        if (jacket && tempChange < 0) {
            const m = EQUIPMENT_DURABILITY.getEffectMultiplier(jacket);
            finalChange *= (1 - 0.2 * m);
        }
        
        // 羽绒服保暖（更强）
        const downJacket = EquipmentSystem.getEquipment("down_jacket");
        if (downJacket && tempChange < 0) {
            const m = EQUIPMENT_DURABILITY.getEffectMultiplier(downJacket);
            finalChange *= (1 - 0.3 * m);
        }
        
        return finalChange;
    },
    
    // 应用湿身恢复效果
    applyWetnessRecovery: (recoveryAmount) => {
        let finalRecovery = recoveryAmount;
        
        // 速干衣加速恢复
        const quickDry = EquipmentSystem.getEquipment("quick_dry");
        if (quickDry) {
            const m = EQUIPMENT_DURABILITY.getEffectMultiplier(quickDry);
            finalRecovery *= (1 + 0.2 * m);
        }
        
        return finalRecovery;
    },
    
    // 应用迷路概率效果
    applyGetLostChance: (baseChance) => {
        let finalChance = baseChance;
        
        // 指南针效果
        const compass = EquipmentSystem.getEquipment("compass");
        if (compass) {
            const m = EQUIPMENT_DURABILITY.getEffectMultiplier(compass);
            // 大雾天气完全防止迷路
            if (gameState.weather.id === "fog") {
                finalChance = 0;
            } else {
                finalChance *= (1 - 0.5 * m);
            }
            EQUIPMENT_DURABILITY.useEquipment(compass, 0.2);
        }
        
        // GPS效果（更强）
        const gps = EquipmentSystem.getEquipment("gps");
        if (gps) {
            const m = EQUIPMENT_DURABILITY.getEffectMultiplier(gps);
            finalChance *= (1 - 0.8 * m);
            EQUIPMENT_DURABILITY.useEquipment(gps, 0.2);
        }
        
        return finalChance;
    },
    
    // 应用滑倒概率效果
    applySlipChance: (baseChance) => {
        let finalChance = baseChance;
        
        // 登山杖效果
        const poles = EquipmentSystem.getEquipment("trekking_poles");
        if (poles) {
            const m = EQUIPMENT_DURABILITY.getEffectMultiplier(poles);
            finalChance *= (1 - 0.5 * m);
        }
        
        return finalChance;
    },
    
    // 检查是否可以在暴风雪中正常行动
    canMoveInSnowstorm: () => {
        const downJacket = EquipmentSystem.getEquipment("down_jacket");
        if (downJacket) {
            const m = EQUIPMENT_DURABILITY.getEffectMultiplier(downJacket);
            return m > 0;
        }
        return false;
    },
    
    // 检查是否有夜间移动惩罚
    hasNightMovePenalty: () => {
        const headlamp = EquipmentSystem.getEquipment("headlamp");
        if (headlamp) {
            const m = EQUIPMENT_DURABILITY.getEffectMultiplier(headlamp);
            if (m > 0) {
                EQUIPMENT_DURABILITY.useEquipment(headlamp, 0.5);
                return false; // 无惩罚
            }
        }
        return true; // 有惩罚
    },
    
    // 获取视野等级
    getVisibilityLevel: () => {
        let visibility = gameState.weather.visibility;
        
        // 头灯提升大雾视野
        const headlamp = EquipmentSystem.getEquipment("headlamp");
        if (headlamp && gameState.weather.id === "fog") {
            const m = EQUIPMENT_DURABILITY.getEffectMultiplier(headlamp);
            if (m > 0) {
                const levels = ["none", "poor", "normal", "good"];
                const currentIndex = levels.indexOf(visibility);
                visibility = levels[Math.min(currentIndex + 1, levels.length - 1)];
            }
        }
        
        return visibility;
    },
    
    // 检查是否可以处理暗处事件
    canHandleDarkEvent: () => {
        const headlamp = EquipmentSystem.getEquipment("headlamp");
        if (headlamp) {
            return EQUIPMENT_DURABILITY.getEffectMultiplier(headlamp) > 0;
        }
        return false;
    },
    
    // 检查迷路事件是否显示正确选项
    showCorrectChoiceInLostEvent: () => {
        const compass = EquipmentSystem.getEquipment("compass");
        if (compass) {
            const m = EQUIPMENT_DURABILITY.getEffectMultiplier(compass);
            if (m > 0) {
                // 导航架附近效果增强
                const node = MAP_NODES[gameState.currentNode];
                if (node.name === "导航架") {
                    return Math.random() < (0.8 * m * 1.5);
                }
                return Math.random() < (0.8 * m);
            }
        }
        return false;
    },
    
    // 检查GPS是否可以自动恢复迷路
    tryAutoRecoverFromLost: () => {
        const gps = EquipmentSystem.getEquipment("gps");
        if (gps) {
            const m = EQUIPMENT_DURABILITY.getEffectMultiplier(gps);
            if (m > 0 && Math.random() < (0.8 * m)) {
                logEvent("📡 GPS定位成功，你找到了正确的方向！");
                return true;
            }
        }
        return false;
    },
    
    // 使用GPS紧急求救
    useEmergencyRescue: () => {
        const gps = EquipmentSystem.getEquipment("gps");
        if (gps && !gps.rescueUsed) {
            gps.rescueUsed = true;
            logEvent("🆘 GPS紧急求救信号已发送！救援队正在赶来...");
            // 恢复大量体力和理智
            gameState.stamina = Math.min(gameState.maxStamina, gameState.stamina + 50);
            gameState.sanity = Math.min(100, gameState.sanity + 30);
            gameState.mood = Math.min(100, gameState.mood + 20);
            return true;
        }
        return false;
    },
    
    // 检查是否可以携带帐篷（露营选项）
    canCarryTent: () => {
        const heavyBag = EquipmentSystem.getEquipment("heavy_bag");
        if (heavyBag) {
            return EQUIPMENT_DURABILITY.getEffectMultiplier(heavyBag) > 0;
        }
        return false;
    },
    
    // 应用冲锋衣防雨效果（减少天气负面效果）
    applyRainResist: (effect) => {
        const jacket = EquipmentSystem.getEquipment("jacket");
        if (jacket && (gameState.weather.id === "light_rain" || gameState.weather.id === "heavy_rain")) {
            const m = EQUIPMENT_DURABILITY.getEffectMultiplier(jacket);
            return effect * (1 - 0.5 * m);
        }
        return effect;
    },
    
    // 消耗装备耐久（通用）
    consumeDurability: (equipmentId, amount = 1) => {
        const equipment = EquipmentSystem.getEquipment(equipmentId);
        if (equipment) {
            const result = EQUIPMENT_DURABILITY.useEquipment(equipment, amount);
            if (!result && equipment.durability <= 0) {
                logEvent(`⚠️ ${equipment.name} 已损坏！`);
            }
            return result;
        }
        return false;
    }
};

const ACHIEVEMENTS = [
    { id: "speed_runner", name: "极速穿越", icon: "🏃", desc: "3天内完成穿越", category: "survival", condition: "day <= 3" },
    { id: "light_packer", name: "轻装上阵", icon: "🍃", desc: "只带基础装备完成", category: "survival", condition: "basic_only" },
    { id: "iron_man", name: "铁人模式", icon: "💪", desc: "困难难度通关", category: "survival", condition: "hard_mode" },
    { id: "survivor", name: "生存专家", icon: "🔥", desc: "在恶劣天气中存活", category: "survival", condition: "bad_weather_survive" },
    { id: "photographer", name: "摄影师", icon: "📸", desc: "触发所有风景事件", category: "explore", condition: "all_scenery" },
    { id: "explorer", name: "探索者", icon: "🗺️", desc: "走过所有冒险路线", category: "explore", condition: "all_danger_routes" },
    { id: "camp_master", name: "露营大师", icon: "🏕️", desc: "在每个营地休息过", category: "explore", condition: "all_camps" },
    { id: "helper", name: "助人为乐", icon: "🤝", desc: "帮助所有遇到的徒步者", category: "moral", condition: "help_all_hikers" },
    { id: "nature_respect", name: "敬畏自然", icon: "🙏", desc: "不选择冒险路线", category: "moral", condition: "no_danger_routes" },
    { id: "eco_guardian", name: "环保卫士", icon: "💚", desc: "不留下任何垃圾", category: "moral", condition: "no_trash" },
    { id: "blizzard_survivor", name: "暴风雪幸存者", icon: "❄️", desc: "在暴风雪中存活", category: "special", condition: "survive_blizzard" },
    { id: "perfect_finish", name: "完美通关", icon: "🌟", desc: "满体力到达终点", category: "special", condition: "full_stamina_end" },
    { id: "lucky_one", name: "幸运儿", icon: "🎲", desc: "连续3次遇到好事", category: "special", condition: "three_good_events" },
    { id: "doctor", name: "野外医生", icon: "⚕️", desc: "成功治疗所有伤势", category: "special", condition: "heal_all" },
    { id: "navigator", name: "导航专家", icon: "🧭", desc: "从未迷路", category: "special", condition: "never_lost" }
];

// ==================== 游戏状态 ====================

let gameState = {
    // 基础状态
    currentNode: 0,
    day: 1,
    hour: 8,                     // 当前小时 (0-23)
    weather: null,
    weatherDuration: 0,          // 天气剩余持续时间
    
    // 玩家核心属性
    stamina: 100,                // 体力 (0-100)
    maxStamina: 100,
    food: 100,                   // 饱食度 (0-100)
    water: 100,                  // 水分 (0-100)
    bodyTemp: 37,                // 体温 (35-42°C)
    
    // 精神状态
    mood: 50,                    // 心情 (0-100)
    sanity: 100,                 // 理智 (0-100)
    
    // 身体状态
    health: 100,                 // 健康 (0-100)
    fatigue: 0,                  // 疲劳度 (0-100)
    wetness: 0,                  // 湿身程度 (0-100)
    
    // 状态效果
    statusEffects: [],           // 状态效果数组
    
    // 装备
    equipment: [],
    inventory: [],
    totalWeight: 0,
    maxCapacity: 0,
    
    // 装备耐久度追踪
    equipmentDurability: {},     // { equipmentId: durability }
    
    // 游戏进度
    gameOver: false,
    victory: false,
    difficulty: "normal",
    difficultyConfig: null,      // 当前难度配置
    
    // 难度统计
    blizzardCount: 0,            // 经历的暴风雪次数
    injuryCount: 0,              // 受伤次数
    equipmentPointsUsed: 0,      // 使用的装备点数
    
    // 统计
    moves: 0,
    eventsTriggered: 0,
    restCount: 0,
    totalDistance: 0,
    
    // 成就追踪
    achievements: [],
    unlockedAchievements: [],
    sceneryEventsTriggered: [],
    dangerRoutesTaken: [],
    campsRested: [],
    hikersHelped: 0,
    hikersEncountered: 0,
    normalRoutesTaken: [],
    trashLeft: 0,
    survivedBlizzard: false,
    goodEventStreak: 0,
    maxGoodEventStreak: 0,
    neverLost: true,
    injuriesHealed: 0,
    
    // 决策影响
    decisionHistory: [],         // 决策历史
    moralScore: 0,               // 道德分数
    chainEffects: [],            // 连锁效果
    
    // 死亡原因
    deathReason: ""
};

// ==================== 初始化函数 ====================

function initGame() {
    loadAchievements();
    loadGame();
    loadUnlockedDifficulties();
    setupEventListeners();
    // 实景系统由 scenery.js 自动初始化
    updateUI();
}

// ==================== 难度系统 ====================

let unlockedDifficulties = ['easy', 'normal']; // 默认解锁简单和普通

function loadUnlockedDifficulties() {
    const saved = localStorage.getItem("aotai_unlocked_difficulties");
    if (saved) {
        unlockedDifficulties = JSON.parse(saved);
    }
}

function saveUnlockedDifficulties() {
    localStorage.setItem("aotai_unlocked_difficulties", JSON.stringify(unlockedDifficulties));
}

function unlockDifficulty(difficultyId) {
    if (!unlockedDifficulties.includes(difficultyId)) {
        unlockedDifficulties.push(difficultyId);
        saveUnlockedDifficulties();
        logEvent(`🎉 解锁新难度: ${DIFFICULTY_MODES[difficultyId]?.name || difficultyId}!`);
    }
}

function isDifficultyUnlocked(difficultyId) {
    return unlockedDifficulties.includes(difficultyId);
}

function showDifficultyScreen() {
    renderDifficultyOptions();
    showScreen("difficulty-screen");
}

function renderDifficultyOptions() {
    const container = document.getElementById("difficulty-options");
    if (!container) return;
    container.innerHTML = "";
    
    Object.values(DIFFICULTY_MODES).forEach(mode => {
        const isUnlocked = isDifficultyUnlocked(mode.id);
        const isRecommended = mode.id === 'normal';
        
        const modeDiv = document.createElement("div");
        modeDiv.className = `difficulty-option ${mode.id} ${isUnlocked ? '' : 'locked'} ${isRecommended ? 'recommended' : ''}`;
        modeDiv.style.borderColor = mode.color;
        
        if (!isUnlocked) {
            modeDiv.style.opacity = "0.6";
        }
        
        modeDiv.innerHTML = `
            <div class="difficulty-header">
                <span class="difficulty-icon">${isUnlocked ? mode.icon : '🔒'}</span>
                <span class="difficulty-name">${mode.name}</span>
                ${isRecommended ? '<span class="recommended-badge">推荐</span>' : ''}
            </div>
            <div class="difficulty-desc">${isUnlocked ? mode.description : '完成前一难度以解锁'}</div>
            <div class="difficulty-stats">
                <div class="stat-row">
                    <span>初始体力:</span>
                    <span>${mode.initialStats.stamina}</span>
                </div>
                <div class="stat-row">
                    <span>装备预算:</span>
                    <span>${mode.equipmentPoints}点</span>
                </div>
                <div class="stat-row">
                    <span>成就倍率:</span>
                    <span>${mode.achievementMultiplier}x</span>
                </div>
                ${mode.permanentDeath ? '<div class="stat-row warning"><span>⚠️ 永久死亡</span></div>' : ''}
            </div>
        `;
        
        if (isUnlocked) {
            modeDiv.addEventListener("click", () => selectDifficulty(mode.id));
        }
        
        container.appendChild(modeDiv);
    });
}

function selectDifficulty(difficultyId) {
    gameState.difficulty = difficultyId;
    gameState.difficultyConfig = DIFFICULTY_MODES[difficultyId];
    
    // 高亮选中的难度
    document.querySelectorAll('.difficulty-option').forEach(el => {
        el.classList.remove('selected');
    });
    const selectedEl = document.querySelector(`.difficulty-option.${difficultyId}`);
    if (selectedEl) selectedEl.classList.add('selected');
    
    // 启用开始按钮
    const startBtn = document.getElementById("btn-start-equipment");
    if (startBtn) startBtn.disabled = false;
    
    logEvent(`选择了${DIFFICULTY_MODES[difficultyId].name}`);
}

function confirmDifficulty() {
    if (!gameState.difficultyConfig) {
        gameState.difficultyConfig = DIFFICULTY_MODES.normal;
    }
    showEquipmentScreen();
}

function setupEventListeners() {
    // 主菜单按钮
    document.getElementById("btn-new-game")?.addEventListener("click", () => {
        startNewGame();
    });
    document.getElementById("btn-continue")?.addEventListener("click", () => {
        continueGame();
    });
    document.getElementById("btn-help")?.addEventListener("click", () => {
        showHelp();
    });
    document.getElementById("btn-achievements")?.addEventListener("click", () => {
        showAchievements();
    });
    
    // 难度选择界面
    document.getElementById("btn-start-equipment")?.addEventListener("click", () => {
        confirmDifficulty();
    });
    document.getElementById("btn-back-from-difficulty")?.addEventListener("click", () => {
        showScreen("main-menu");
    });
    
    // 装备选择界面
    document.getElementById("btn-start-journey")?.addEventListener("click", () => {
        startJourney();
    });
    document.getElementById("btn-back-menu")?.addEventListener("click", () => {
        showScreen("main-menu");
    });
    
    // 游戏主界面
    document.getElementById("btn-move")?.addEventListener("click", () => {
        showMoveOptions();
    });
    document.getElementById("btn-rest")?.addEventListener("click", () => {
        rest();
    });
    document.getElementById("btn-eat")?.addEventListener("click", () => {
        eat();
    });
    document.getElementById("btn-drink")?.addEventListener("click", () => {
        drink();
    });
    document.getElementById("btn-inventory")?.addEventListener("click", () => {
        showInventory();
    });
    document.getElementById("btn-save")?.addEventListener("click", () => {
        saveGame();
    });
    
    // 移动界面
    document.getElementById("btn-cancel-move")?.addEventListener("click", () => {
        hideModal("move-screen");
    });
    
    // 背包界面
    document.getElementById("btn-close-inventory")?.addEventListener("click", () => {
        hideModal("inventory-screen");
    });
    
    // 游戏结束界面
    document.getElementById("btn-restart")?.addEventListener("click", () => {
        startNewGame();
    });
    document.getElementById("btn-main-menu")?.addEventListener("click", () => {
        showScreen("main-menu");
    });
    
    // 帮助界面
    document.getElementById("btn-close-help")?.addEventListener("click", () => {
        hideModal("help-screen");
    });
    
    // 成就界面
    document.getElementById("btn-close-achievements")?.addEventListener("click", () => {
        hideModal("achievements-screen");
    });
}

// ==================== 游戏流程控制 ====================

function startNewGame() {
    // 重置游戏状态
    gameState = {
        currentNode: 0,
        day: 1,
        hour: 8,
        weather: generateWeather(),
        weatherDuration: Math.floor(Math.random() * 4) + 2,
        
        stamina: 100,
        maxStamina: 100,
        food: 100,
        water: 100,
        bodyTemp: 37,
        
        mood: 50,
        sanity: 100,
        
        health: 100,
        fatigue: 0,
        wetness: 0,
        
        statusEffects: [],
        
        equipment: [],
        inventory: [],
        totalWeight: 0,
        maxCapacity: 0,
        
        // 装备耐久度追踪
        equipmentDurability: {},
        
        gameOver: false,
        victory: false,
        difficulty: "normal",
        difficultyConfig: null,
        
        moves: 0,
        eventsTriggered: 0,
        restCount: 0,
        totalDistance: 0,
        blizzardCount: 0,
        injuryCount: 0,
        equipmentPointsUsed: 0,
        
        achievements: [],
        unlockedAchievements: gameState.unlockedAchievements || [],
        sceneryEventsTriggered: [],
        dangerRoutesTaken: [],
        campsRested: [],
        hikersHelped: 0,
        hikersEncountered: 0,
        normalRoutesTaken: [],
        trashLeft: 0,
        survivedBlizzard: false,
        goodEventStreak: 0,
        maxGoodEventStreak: 0,
        neverLost: true,
        injuriesHealed: 0,
        
        decisionHistory: [],
        moralScore: 0,
        chainEffects: [],
        
        deathReason: ""
    };
    
    showDifficultyScreen();
}

function continueGame() {
    if (localStorage.getItem("aotai_save")) {
        loadGame();
        if (!gameState.gameOver) {
            showScreen("game-screen");
            updateUI();
        }
    }
}

function showEquipmentScreen() {
    renderEquipmentList();
    showScreen("equipment-screen");
}

function renderEquipmentList() {
    const categories = ["backpacks", "clothing", "tools", "food", "water"];
    const containerIds = ["backpack-list", "clothing-list", "tool-list", "food-list", "water-list"];
    
    // 获取当前难度的装备点数
    const equipmentPoints = gameState.difficultyConfig?.equipmentPoints || 100;
    
    categories.forEach((category, index) => {
        const container = document.getElementById(containerIds[index]);
        if (!container) return;
        container.innerHTML = "";
        
        const items = EQUIPMENT[category] || [];
        items.forEach(item => {
            const itemDiv = document.createElement("div");
            itemDiv.className = "equipment-item";
            itemDiv.dataset.id = item.id;
            itemDiv.dataset.category = category;
            itemDiv.innerHTML = `
                <div class="item-name">${item.name}</div>
                <div class="item-desc">${item.desc}</div>
                <div class="item-stats">
                    <span>重量: ${item.weight}kg</span>
                    <span>消耗: ${item.cost}点</span>
                </div>
            `;
            itemDiv.addEventListener("click", () => toggleEquipment(item, category, itemDiv));
            container.appendChild(itemDiv);
        });
    });
    
    updateEquipmentSummary();
}

function toggleEquipment(item, category, element) {
    const isSelected = element.classList.contains("selected");
    const equipmentPoints = gameState.difficultyConfig?.equipmentPoints || 100;
    const currentPoints = parseInt(document.getElementById("remaining-points")?.textContent || equipmentPoints);
    
    if (isSelected) {
        element.classList.remove("selected");
        gameState.equipment = gameState.equipment.filter(e => e.id !== item.id);
    } else {
        // 背包类只能选一个
        if (category === "backpacks") {
            const existingBackpack = gameState.equipment.find(e => 
                EQUIPMENT.backpacks.some(b => b.id === e.id)
            );
            if (existingBackpack) {
                gameState.equipment = gameState.equipment.filter(e => e.id !== existingBackpack.id);
                document.querySelectorAll("#backpack-list .equipment-item").forEach(el => {
                    el.classList.remove("selected");
                });
            }
        }
        
        if (currentPoints < item.cost) {
            logEvent("点数不足，无法选择此装备！");
            return;
        }
        
        element.classList.add("selected");
        gameState.equipment.push({ ...item, category });
    }
    
    updateEquipmentSummary();
}

function updateEquipmentSummary() {
    const equipmentPoints = gameState.difficultyConfig?.equipmentPoints || 100;
    const selectedCount = gameState.equipment.length;
    const totalWeight = gameState.equipment.reduce((sum, item) => sum + (item.weight || 0), 0);
    const totalCost = gameState.equipment.reduce((sum, item) => sum + (item.cost || 0), 0);
    const remainingPoints = equipmentPoints - totalCost;
    
    const backpack = gameState.equipment.find(e => 
        EQUIPMENT.backpacks.some(b => b.id === e.id)
    );
    gameState.maxCapacity = backpack ? backpack.capacity : 10;
    gameState.totalWeight = totalWeight;
    gameState.equipmentPointsUsed = totalCost;
    
    const selectedCountEl = document.getElementById("selected-count");
    const totalWeightEl = document.getElementById("total-weight");
    const remainingPointsEl = document.getElementById("remaining-points");
    const startBtn = document.getElementById("btn-start-journey");
    const pointsDisplayEl = document.getElementById("equipment-points-display");
    
    if (selectedCountEl) selectedCountEl.textContent = selectedCount;
    if (totalWeightEl) totalWeightEl.textContent = totalWeight.toFixed(1);
    if (remainingPointsEl) remainingPointsEl.textContent = remainingPoints;
    if (pointsDisplayEl) pointsDisplayEl.textContent = equipmentPoints;
    if (startBtn) startBtn.disabled = !backpack || remainingPoints < 0;
}

function startJourney() {
    // 应用难度配置的初始属性
    const config = gameState.difficultyConfig || DIFFICULTY_MODES.normal;
    gameState.stamina = config.initialStats.stamina;
    gameState.maxStamina = config.initialStats.maxStamina;
    gameState.food = config.initialStats.food;
    gameState.water = config.initialStats.water;
    gameState.mood = config.initialStats.mood;
    gameState.sanity = config.initialStats.sanity;
    gameState.bodyTemp = config.initialStats.bodyTemp;
    
    gameState.inventory = [...gameState.equipment];
    
    // 初始化装备耐久度
    gameState.equipment.forEach(item => {
        if (item.durability) {
            gameState.equipmentDurability[item.id] = item.durability;
        }
    });
    
    // 初始化食物
    const foodItems = gameState.equipment.filter(e => 
        EQUIPMENT.food.some(f => f.id === e.id)
    );
    const foodBonus = foodItems.reduce((sum, item) => sum + (item.foodValue || 0), 0);
    gameState.food = Math.min(config.initialStats.food, config.initialStats.food * 0.5 + foodBonus);
    
    // 初始化水
    const waterItems = gameState.equipment.filter(e => 
        EQUIPMENT.water.some(w => w.id === e.id)
    );
    const waterBonus = waterItems.reduce((sum, item) => sum + (item.capacity || 0), 0);
    gameState.water = Math.min(config.initialStats.water, config.initialStats.water * 0.5 + waterBonus);
    
    logEvent(`🎮 开始${config.name}穿越！祝你好运！`);
    logEvent(`当前天气: ${gameState.weather.name} ${gameState.weather.icon}`);
    
    // 地狱模式特殊提示
    if (config.id === 'hell') {
        logEvent("⚠️ 警告：地狱模式下死亡将永久失去存档！");
    }
    
    showScreen("game-screen");
    renderMap();
    updateUI();
}

// ==================== 天气系统 ====================

function generateWeather() {
    const config = gameState.difficultyConfig || DIFFICULTY_MODES.normal;
    const rand = Math.random();
    
    // 应用难度天气修正
    let adjustedRand = rand;
    if (config.weatherModifier > 0) {
        // 增加恶劣天气概率
        adjustedRand = Math.min(1, rand + config.weatherModifier * 0.3);
    } else if (config.weatherModifier < 0) {
        // 减少恶劣天气概率
        adjustedRand = Math.max(0, rand + config.weatherModifier * 0.3);
    }
    
    // 暴风雪概率修正
    const blizzardThreshold = 0.90 - config.blizzardChanceModifier;
    
    if (adjustedRand < 0.25) return WEATHER_TYPES.sunny;
    if (adjustedRand < 0.45) return WEATHER_TYPES.cloudy;
    if (adjustedRand < 0.60) return WEATHER_TYPES.lightRain;
    if (adjustedRand < 0.72) return WEATHER_TYPES.heavyRain;
    if (adjustedRand < 0.82) return WEATHER_TYPES.fog;
    if (adjustedRand < 0.90) return WEATHER_TYPES.snow;
    if (adjustedRand < blizzardThreshold) return WEATHER_TYPES.snowstorm;
    return WEATHER_TYPES.thunderstorm;
}

function updateWeather() {
    gameState.weatherDuration--;
    
    if (gameState.weatherDuration <= 0) {
        const chain = WEATHER_CHAINS[gameState.weather.id];
        if (chain) {
            const nextWeatherProb = chain.nextWeather;
            const rand = Math.random();
            let cumulative = 0;
            
            for (const [weatherId, prob] of Object.entries(nextWeatherProb)) {
                cumulative += prob;
                if (rand <= cumulative) {
                    const oldWeather = gameState.weather;
                    gameState.weather = WEATHER_TYPES[weatherId];
                    gameState.weatherDuration = Math.floor(Math.random() * 
                        (chain.duration.max - chain.duration.min + 1)) + chain.duration.min;
                    
                    if (oldWeather.id !== gameState.weather.id) {
                        logEvent(`天气变化了！${oldWeather.icon} → ${gameState.weather.icon} ${gameState.weather.name}`);
                        logEvent(gameState.weather.description);
                    }
                    break;
                }
            }
        }
    }
    
    // 应用天气效果
    applyWeatherEffects();
}

function applyWeatherEffects() {
    const weather = gameState.weather;
    
    // 体温变化（应用衣物保暖效果）
    let bodyTempChange = weather.bodyTempEffect;
    bodyTempChange = EquipmentSystem.applyBodyTempEffects(bodyTempChange);
    gameState.bodyTemp = Math.max(35, Math.min(42, 
        gameState.bodyTemp + bodyTempChange
    ));
    
    // 湿身程度（应用冲锋衣防雨效果）
    let wetnessChange = weather.wetnessChange;
    if (wetnessChange > 0) {
        wetnessChange = EquipmentSystem.applyRainResist(wetnessChange);
    }
    gameState.wetness = Math.max(0, Math.min(100, 
        gameState.wetness + wetnessChange
    ));
    
    // 心情影响
    gameState.mood = Math.max(0, Math.min(100, 
        gameState.mood + weather.moodEffect / 10
    ));
    
    // 检查天气连锁反应
    checkWeatherChains();
}

function checkWeatherChains() {
    // 晴天暴晒 → 中暑
    if (gameState.weather.id === "sunny" && gameState.bodyTemp > 38 && gameState.water < 30) {
        if (Math.random() < 0.1 && !hasStatusEffect("heatStroke")) {
            addStatusEffect("heatStroke");
            logEvent("⚠️ 烈日暴晒，你感觉头晕恶心，可能中暑了！");
        }
    }
    
    // 湿身 + 低温 → 失温
    if (gameState.wetness > 50 && (gameState.bodyTemp < 36 || gameState.weather.temperature < 5)) {
        if (Math.random() < 0.15 && !hasStatusEffect("hypothermia")) {
            addStatusEffect("hypothermia");
            logEvent("⚠️ 湿冷的衣物让你体温快速流失，你开始失温了！");
        }
    }
    
    // 暴风雪存活记录
    if (gameState.weather.id === "snowstorm" && gameState.stamina > 0) {
        gameState.survivedBlizzard = true;
        gameState.blizzardCount++;
    }
}

// ==================== 状态效果系统 ====================

function addStatusEffect(effectId) {
    if (hasStatusEffect(effectId)) return;
    
    const effect = STATUS_EFFECTS[effectId];
    if (!effect) return;
    
    // 记录受伤次数（用于成就统计）
    if (effectId === 'injured' || effectId === 'ankleSprain' || effectId === 'frostbite') {
        gameState.injuryCount++;
    }
    
    const statusEffect = {
        id: effectId,
        name: effect.name,
        icon: effect.icon,
        startTime: Date.now(),
        duration: effect.duration,
        effects: effect.effects
    };
    
    gameState.statusEffects.push(statusEffect);
    
    // 应用即时效果
    if (effect.effects.maxStamina) {
        gameState.maxStamina = Math.min(100, effect.effects.maxStamina);
        gameState.stamina = Math.min(gameState.stamina, gameState.maxStamina);
    }
    
    logEvent(`${effect.icon} 获得状态: ${effect.name} - ${effect.description}`);
    
    // 触发连锁事件
    if (effect.chainEvents && effect.chainEvents.length > 0) {
        setTimeout(() => {
            triggerChainEvent(effect.chainEvents);
        }, 2000);
    }
}

function removeStatusEffect(effectId) {
    const index = gameState.statusEffects.findIndex(e => e.id === effectId);
    if (index === -1) return;
    
    const effect = STATUS_EFFECTS[effectId];
    gameState.statusEffects.splice(index, 1);
    
    // 恢复最大体力
    if (effect?.effects?.maxStamina) {
        gameState.maxStamina = 100;
    }
    
    logEvent(`✅ 状态解除: ${effect?.name || effectId}`);
}

function hasStatusEffect(effectId) {
    return gameState.statusEffects.some(e => e.id === effectId);
}

function updateStatusEffects() {
    const now = Date.now();
    
    gameState.statusEffects = gameState.statusEffects.filter(effect => {
        // 持续时间为-1表示需要主动治疗
        if (effect.duration === -1) return true;
        
        const elapsed = (now - effect.startTime) / 1000;
        if (elapsed >= effect.duration) {
            const statusDef = STATUS_EFFECTS[effect.id];
            if (statusDef) {
                logEvent(`⏰ 状态过期: ${statusDef.name}`);
                // 恢复最大体力
                if (statusDef.effects?.maxStamina) {
                    gameState.maxStamina = 100;
                }
            }
            return false;
        }
        return true;
    });
}

function getStatusEffectModifiers() {
    let modifiers = {
        staminaRegen: 0,
        staminaDrain: 1,
        moveSpeed: 1,
        judgment: 0,
        eventSuccessRate: 1,
        moodEffect: 0,
        sanityEffect: 0
    };
    
    gameState.statusEffects.forEach(effect => {
        const def = STATUS_EFFECTS[effect.id];
        if (def && def.effects) {
            if (def.effects.staminaRegen) modifiers.staminaRegen += def.effects.staminaRegen;
            if (def.effects.staminaDrain) modifiers.staminaDrain *= def.effects.staminaDrain;
            if (def.effects.moveSpeed) modifiers.moveSpeed *= def.effects.moveSpeed;
            if (def.effects.judgment) modifiers.judgment += def.effects.judgment;
            if (def.effects.eventSuccessRate) modifiers.eventSuccessRate *= def.effects.eventSuccessRate;
            if (def.effects.moodEffect) modifiers.moodEffect += def.effects.moodEffect;
            if (def.effects.sanityEffect) modifiers.sanityEffect += def.effects.sanityEffect;
        }
    });
    
    return modifiers;
}

// ==================== 事件系统 ====================

function triggerChainEvent(eventIds) {
    if (!eventIds || eventIds.length === 0) return;
    
    const eventId = eventIds[Math.floor(Math.random() * eventIds.length)];
    
    switch (eventId) {
        case "decisionMistake":
            logEvent("🤔 你的判断力受到影响，做了一个不太明智的决定...");
            gameState.mood -= 10;
            break;
        case "stumble":
            logEvent("😵 你绊了一下，差点摔倒！");
            gameState.stamina -= 10;
            break;
        case "panic":
            if (!hasStatusEffect("panic")) {
                addStatusEffect("panic");
                logEvent("😰 你感到一阵恐慌！");
            }
            break;
        case "collapse":
            logEvent("💀 你体力不支倒下了！");
            gameState.stamina -= 30;
            break;
        case "slowProgress":
            logEvent("🐢 伤势拖慢了你的进度...");
            break;
        case "missCamp":
            logEvent("🏕️ 你无法在天黑前到达营地...");
            break;
        case "getLost":
            logEvent("🗺️ 你迷失了方向！");
            gameState.neverLost = false;
            break;
    }
}

function checkEventTriggers() {
    const currentNode = MAP_NODES[gameState.currentNode];
    const currentRoute = getCurrentRoute();
    const terrain = currentRoute ? TERRAIN_TYPES[currentRoute.terrain] : TERRAIN_TYPES[currentNode.terrain];
    const weather = gameState.weather;
    const timeOfDay = getTimeOfDay();
    
    for (const [eventId, conditions] of Object.entries(EVENT_CONDITIONS)) {
        let shouldTrigger = true;
        let chance = conditions.baseChance;
        
        // 检查天气条件
        if (conditions.weather !== "any") {
            if (Array.isArray(conditions.weather)) {
                if (!conditions.weather.includes(weather.id)) shouldTrigger = false;
            } else if (conditions.weather !== weather.id) {
                shouldTrigger = false;
            }
        }
        
        // 检查温度条件
        if (conditions.temperature && shouldTrigger) {
            if (conditions.temperature.min && weather.temperature < conditions.temperature.min) {
                shouldTrigger = false;
            }
            if (conditions.temperature.max && weather.temperature > conditions.temperature.max) {
                shouldTrigger = false;
            }
        }
        
        // 检查地形条件
        if (conditions.terrain !== "any" && shouldTrigger) {
            if (Array.isArray(conditions.terrain)) {
                if (!conditions.terrain.includes(terrain.id)) shouldTrigger = false;
            } else if (conditions.terrain !== terrain.id) {
                shouldTrigger = false;
            }
        }
        
        // 检查海拔条件
        if (conditions.altitude && shouldTrigger) {
            if (conditions.altitude.min && currentNode.elevation < conditions.altitude.min) {
                shouldTrigger = false;
            }
            if (conditions.altitude.max && currentNode.elevation > conditions.altitude.max) {
                shouldTrigger = false;
            }
        }
        
        // 检查时间条件
        if (conditions.time !== "any" && shouldTrigger) {
            if (Array.isArray(conditions.time)) {
                if (!conditions.time.includes(timeOfDay)) shouldTrigger = false;
            } else if (conditions.time !== timeOfDay) {
                shouldTrigger = false;
            }
        }
        
        // 检查状态效果条件
        if (conditions.statusEffects && conditions.statusEffects.length > 0 && shouldTrigger) {
            const hasRequiredStatus = conditions.statusEffects.some(status => hasStatusEffect(status));
            if (!hasRequiredStatus) shouldTrigger = false;
            else chance *= 1.5; // 有对应状态效果时概率增加
        }
        
        // 应用天气事件修正
        if (shouldTrigger && weather.eventModifiers[eventId]) {
            chance += weather.eventModifiers[eventId];
        }
        
        // 应用地形风险修正
        if (shouldTrigger && terrain.risks && terrain.risks[eventId]) {
            chance += terrain.risks[eventId];
        }
        
        // 应用疲劳度影响
        if (gameState.fatigue > 70) {
            chance *= 1.3; // 疲劳时事件概率增加
        }
        
        // 应用装备效果（迷路概率）
        if (eventId === "getLost") {
            chance = EquipmentSystem.applyGetLostChance(chance);
        }
        
        // 应用装备效果（滑倒概率）
        if (eventId === "fall") {
            chance = EquipmentSystem.applySlipChance(chance);
        }
        
        // 触发事件
        if (shouldTrigger && Math.random() < chance) {
            triggerDangerEvent(eventId);
            return;
        }
    }
}

function triggerDangerEvent(eventId) {
    switch (eventId) {
        case "heatStroke":
            addStatusEffect("heatStroke");
            showEventModal({
                title: "中暑！",
                icon: "🥵",
                description: "烈日当空，你感到头晕目眩，恶心呕吐。这是中暑的症状！",
                choices: [
                    { text: "寻找阴凉处休息 (-20体力, +10理智)", effect: { stamina: -20, sanity: 10 }, removeStatus: "heatStroke" },
                    { text: "喝水降温 (-10水分, 缓解症状)", effect: { water: -10 }, removeStatus: "heatStroke" },
                    { text: "硬撑前进 (-30体力, 症状加重)", effect: { stamina: -30 }, addStatus: "exhausted" }
                ]
            });
            break;
            
        case "hypothermia":
            addStatusEffect("hypothermia");
            showEventModal({
                title: "失温！",
                icon: "🥶",
                description: "你的体温正在快速流失，手脚冰冷，意识开始模糊。这是失温的征兆！",
                choices: [
                    { text: "立即扎营取暖 (-30体力, 移除湿身)", effect: { stamina: -30 }, removeStatus: "wet" },
                    { text: "更换干衣物 (-10体力, 缓解失温)", effect: { stamina: -10 }, removeStatus: "hypothermia" },
                    { text: "继续赶路 (-40体力, 生命危险！)", effect: { stamina: -40 }, risk: { death: 0.3 } }
                ]
            });
            break;
            
        case "getLost":
            gameState.neverLost = false;
            showEventModal({
                title: "迷路！",
                icon: "🗺️",
                description: "浓雾中你迷失了方向，不知道该往哪里走...",
                choices: [
                    { text: "使用指南针/GPS (-5体力)", effect: { stamina: -5 }, condition: "has_navigation" },
                    { text: "原地等待雾散 (-30体力, -20理智)", effect: { stamina: -30, sanity: -20 } },
                    { text: "凭感觉走 (-20体力, 50%更迷路)", effect: { stamina: -20 }, risk: { moreLost: 0.5 } }
                ]
            });
            break;
            
        case "fall":
            showEventModal({
                title: "滑坠！",
                icon: "⚠️",
                description: "路面湿滑，你脚下一滑，从斜坡上摔了下去！",
                choices: [
                    { text: "紧急自救 (-25体力, 受伤)", effect: { stamina: -25 }, addStatus: "injured" },
                    { text: "使用绳索 (-10体力, 有绳则安全)", effect: { stamina: -10 }, condition: "has_rope" },
                    { text: "任由滑落 (-40体力, 重伤)", effect: { stamina: -40, health: -30 }, addStatus: "injured" }
                ]
            });
            break;
            
        case "altitudeSickness":
            addStatusEffect("altitudeSickness");
            showEventModal({
                title: "高原反应！",
                icon: "🤢",
                description: `海拔${MAP_NODES[gameState.currentNode].elevation}米，你感到头痛恶心，呼吸困难。`,
                choices: [
                    { text: "原地休息适应 (-20体力)", effect: { stamina: -20 } },
                    { text: "缓慢下撤 (-30体力, 缓解症状)", effect: { stamina: -30 }, removeStatus: "altitudeSickness" },
                    { text: "硬撑前进 (-35体力, 症状加重)", effect: { stamina: -35 }, addStatus: "exhausted" }
                ]
            });
            break;
            
        case "wildAnimal":
            showEventModal({
                title: "野生动物！",
                icon: "🐂",
                description: "一头羚牛出现在前方，它看起来很不友善...",
                choices: [
                    { text: "慢慢后退 (-15体力)", effect: { stamina: -15 } },
                    { text: "大声驱赶 (-25体力, 可能激怒)", effect: { stamina: -25 }, risk: { attack: 0.4 } },
                    { text: "爬上岩石躲避 (-20体力, 安全)", effect: { stamina: -20 } }
                ]
            });
            break;
            
        case "dehydration":
            addStatusEffect("dehydration");
            showEventModal({
                title: "脱水！",
                icon: "💧",
                description: "你的嘴唇干裂，头晕目眩，严重缺水了！",
                choices: [
                    { text: "大量补水 (-30水分, 缓解症状)", effect: { water: -30 }, removeStatus: "dehydration" },
                    { text: " ration饮水 (-15水分)", effect: { water: -15 } },
                    { text: "忍耐 (-20体力, 危险！)", effect: { stamina: -20 }, risk: { collapse: 0.3 } }
                ]
            });
            break;
            
        case "panic":
            addStatusEffect("panic");
            showEventModal({
                title: "恐慌！",
                icon: "😰",
                description: "恶劣天气和险峻地形让你感到极度恐慌！",
                choices: [
                    { text: "深呼吸冷静 (-10体力, +20理智)", effect: { stamina: -10, sanity: 20 }, removeStatus: "panic" },
                    { text: "原地坐下 (-20体力, +15理智)", effect: { stamina: -20, sanity: 15 }, removeStatus: "panic" },
                    { text: "盲目奔跑 (-30体力, 可能受伤)", effect: { stamina: -30 }, risk: { injury: 0.5 } }
                ]
            });
            break;
    }
}

function triggerRandomEvent() {
    const event = RANDOM_EVENTS[Math.floor(Math.random() * RANDOM_EVENTS.length)];
    gameState.eventsTriggered++;
    
    if (event.type === "scenery") {
        if (!gameState.sceneryEventsTriggered.includes(event.id)) {
            gameState.sceneryEventsTriggered.push(event.id);
        }
    }
    
    if (event.id === "other_hiker") {
        gameState.hikersEncountered++;
    }
    
    if (event.type === "good") {
        gameState.goodEventStreak++;
        gameState.maxGoodEventStreak = Math.max(gameState.maxGoodEventStreak, gameState.goodEventStreak);
    } else if (event.type === "bad") {
        gameState.goodEventStreak = 0;
    }
    
    showEventModal(event);
}

function showEventModal(event) {
    const iconEl = document.getElementById("event-icon");
    const titleEl = document.getElementById("event-title");
    const descEl = document.getElementById("event-description");
    const choicesContainer = document.getElementById("event-choices");
    
    if (!iconEl || !titleEl || !descEl || !choicesContainer) return;
    
    iconEl.textContent = event.icon;
    titleEl.textContent = event.title;
    descEl.textContent = event.description;
    choicesContainer.innerHTML = "";
    
    event.choices.forEach(choice => {
        const btn = document.createElement("button");
        btn.className = "btn btn-choice";
        btn.textContent = choice.text;
        
        // 检查条件
        if (choice.condition === "has_food" && gameState.food < 10) {
            btn.disabled = true;
            btn.textContent += " (食物不足)";
        }
        if (choice.condition === "has_medicine" && !gameState.inventory.some(i => i.id === "first_aid")) {
            btn.disabled = true;
            btn.textContent += " (无药品)";
        }
        if (choice.condition === "has_navigation" && 
            !gameState.inventory.some(i => i.id === "compass" || i.id === "gps")) {
            btn.disabled = true;
            btn.textContent += " (无导航设备)";
        }
        if (choice.condition === "has_rope" && !gameState.inventory.some(i => i.id === "rope")) {
            btn.disabled = true;
            btn.textContent += " (无绳索)";
        }
        
        btn.addEventListener("click", () => {
            // 记录决策
            gameState.decisionHistory.push({
                event: event.title,
                choice: choice.text,
                time: Date.now()
            });
            
            // 应用效果
            if (choice.effect) {
                applyEventEffect(choice.effect);
            }
            
            // 添加状态
            if (choice.addStatus) {
                addStatusEffect(choice.addStatus);
            }
            
            // 移除状态
            if (choice.removeStatus) {
                removeStatusEffect(choice.removeStatus);
            }
            
            // 道德评分
            if (choice.moral) {
                if (choice.moral === "good") gameState.moralScore += 10;
                else if (choice.moral === "bad") gameState.moralScore -= 10;
            }
            
            // 帮助记录
            if (choice.isHelp && event.id === "other_hiker") {
                gameState.hikersHelped++;
            }
            
            // 环保记录
            if (choice.eco) {
                gameState.trashLeft = Math.max(0, gameState.trashLeft - 1);
            }
            
            // 风险处理
            if (choice.risk) {
                for (const [risk, prob] of Object.entries(choice.risk)) {
                    if (Math.random() < prob) {
                        handleRiskEvent(risk);
                    }
                }
            }
            
            hideModal("event-screen");
            updateUI();
            checkSurvival();
        });
        
        choicesContainer.appendChild(btn);
    });
    
    showModal("event-screen");
}

function handleRiskEvent(risk) {
    switch (risk) {
        case "death":
            gameState.gameOver = true;
            gameState.deathReason = "恶劣天气中强行前进，不幸遇难...";
            showGameOver();
            break;
        case "injury":
            addStatusEffect("injured");
            logEvent("💥 你在慌乱中受伤了！");
            break;
        case "attack":
            gameState.stamina -= 40;
            gameState.health -= 30;
            logEvent("🐂 羚牛攻击了你！");
            break;
        case "moreLost":
            gameState.stamina -= 30;
            gameState.sanity -= 20;
            logEvent("🗺️ 你越走越迷茫...");
            break;
        case "collapse":
            gameState.stamina -= 50;
            addStatusEffect("exhausted");
            logEvent("💀 你因脱水而虚脱！");
            break;
    }
}

function applyEventEffect(effect) {
    if (!effect) return;
    
    if (effect.stamina) {
        gameState.stamina = Math.max(0, Math.min(gameState.maxStamina, gameState.stamina + effect.stamina));
    }
    if (effect.food) {
        gameState.food = Math.max(0, Math.min(100, gameState.food + effect.food));
    }
    if (effect.water) {
        gameState.water = Math.max(0, Math.min(100, gameState.water + effect.water));
    }
    if (effect.mood) {
        gameState.mood = Math.max(0, Math.min(100, gameState.mood + effect.mood));
    }
    if (effect.sanity) {
        gameState.sanity = Math.max(0, Math.min(100, gameState.sanity + effect.sanity));
    }
    if (effect.health) {
        gameState.health = Math.max(0, Math.min(100, gameState.health + effect.health));
    }
    if (effect.wetness) {
        gameState.wetness = Math.max(0, Math.min(100, gameState.wetness + effect.wetness));
    }
}

// ==================== 移动系统 ====================

function getCurrentRoute() {
    if (gameState.currentNode === 0) return null;
    return ROUTES.find(r => r.to === gameState.currentNode);
}

function showMoveOptions() {
    if (gameState.gameOver) return;
    
    const currentNode = gameState.currentNode;
    const availableRoutes = ROUTES.filter(r => r.from === currentNode);
    
    const container = document.getElementById("route-options");
    if (!container) return;
    container.innerHTML = "";
    
    const config = gameState.difficultyConfig || DIFFICULTY_MODES.normal;
    
    if (availableRoutes.length === 0) {
        container.innerHTML = "<p>没有可通行的路线</p>";
    } else {
        availableRoutes.forEach(route => {
            const toNode = MAP_NODES[route.to];
            const terrain = TERRAIN_TYPES[route.terrain];
            const difficultyClass = route.difficulty;
            
            // 计算消耗（应用难度修正和装备效果）
            const modifiers = getStatusEffectModifiers();
            const weatherMultiplier = gameState.weather.moveCost;
            const terrainMultiplier = terrain.staminaCost;
            const statusMultiplier = modifiers.staminaDrain;
            const difficultyMoveMultiplier = 1 + config.moveCostModifier;
            
            const baseStaminaCost = route.distance * 3;
            const rawStaminaCost = Math.floor(baseStaminaCost * weatherMultiplier * terrainMultiplier * statusMultiplier * difficultyMoveMultiplier);
            const timeCost = Math.floor(route.distance * weatherMultiplier / modifiers.moveSpeed);
            
            // 应用装备效果计算最终体力消耗
            const finalStaminaCost = EquipmentSystem.applyMoveStaminaEffects(
                rawStaminaCost, 
                gameState.weather, 
                terrain, 
                toNode.elevation
            );
            
            const routeDiv = document.createElement("div");
            routeDiv.className = `route-option ${difficultyClass}`;
            routeDiv.innerHTML = `
                <div class="route-header">
                    <span class="route-name">前往 ${toNode.name}</span>
                    <span class="route-difficulty ${difficultyClass}">${getDifficultyText(route.difficulty)}</span>
                </div>
                <div class="route-desc">${route.desc}</div>
                <div class="route-terrain">${terrain.icon} ${terrain.name} - ${terrain.description}</div>
                <div class="route-stats">
                    <span>📏 ${route.distance}km</span>
                    <span>⚡ -${finalStaminaCost}体力</span>
                    <span>⏱️ ${timeCost}小时</span>
                    <span>🏔️ ${toNode.elevation}m</span>
                </div>
            `;
            routeDiv.addEventListener("click", () => moveToNode(route, finalStaminaCost, timeCost));
            container.appendChild(routeDiv);
        });
    }
    
    showModal("move-screen");
}

function getDifficultyText(difficulty) {
    const map = { easy: "简单", normal: "普通", hard: "困难" };
    return map[difficulty] || difficulty;
}

function moveToNode(route, staminaCost, timeCost) {
    hideModal("move-screen");
    
    // 检查体力
    if (gameState.stamina < staminaCost) {
        logEvent("体力不足！需要休息恢复。");
        return;
    }
    
    const terrain = TERRAIN_TYPES[route.terrain];
    const weather = gameState.weather;
    const config = gameState.difficultyConfig || DIFFICULTY_MODES.normal;
    
    // 应用消耗（应用难度资源消耗修正）
    const resourceMultiplier = 1 + config.resourceDrainModifier;
    
    gameState.stamina -= staminaCost;
    gameState.food = Math.max(0, gameState.food - route.distance * 0.5 * weather.foodDrain * resourceMultiplier);
    gameState.water = Math.max(0, gameState.water - route.distance * 1.5 * weather.waterDrain * resourceMultiplier);
    gameState.fatigue = Math.min(100, gameState.fatigue + route.distance * 2);
    gameState.totalDistance += route.distance;
    
    // 更新时间
    gameState.hour += timeCost;
    if (gameState.hour >= 24) {
        gameState.hour -= 24;
        gameState.day++;
        logEvent(`🌅 第 ${gameState.day} 天开始了`);
    }
    
    // 移动
    gameState.currentNode = route.to;
    gameState.moves++;
    
    // 记录路线
    if (route.difficulty === "hard") {
        gameState.dangerRoutesTaken.push(`${route.from}-${route.to}`);
    } else {
        gameState.normalRoutesTaken.push(`${route.from}-${route.to}`);
    }
    
    const node = MAP_NODES[route.to];
    logEvent(`到达 ${node.name} (${node.elevation}m) - ${terrain.icon} ${terrain.name}`);
    
    // 海拔变化影响
    if (route.altitudeChange > 500) {
        logEvent("⚠️ 快速爬升，注意高原反应！");
    }
    
    // 检查是否到达终点
    if (node.type === "end") {
        gameState.victory = true;
        gameState.gameOver = true;
        checkAchievements();
        handleVictory();
        return;
    }
    
    // 营地效果
    if (node.type === "camp") {
        gameState.mood = Math.min(100, gameState.mood + 15);
        gameState.sanity = Math.min(100, gameState.sanity + 10);
        if (!gameState.campsRested.includes(node.id)) {
            gameState.campsRested.push(node.id);
        }
        logEvent("🏕️ 到达营地，心情和理智恢复！");
    }
    
    // 更新天气
    updateWeather();
    
    // 更新状态效果
    updateStatusEffects();
    
    // 检查事件触发
    checkEventTriggers();
    
    // 随机事件
    if (Math.random() < 0.3) {
        setTimeout(() => triggerRandomEvent(), 500);
    }
    
    checkSurvival();
    renderMap();
    updateUI();
}

function getTimeOfDay() {
    const hour = gameState.hour;
    if (hour >= 6 && hour < 18) return "day";
    if (hour >= 18 && hour < 20) return "dusk";
    return "night";
}

// ==================== 休息和恢复 ====================

function rest() {
    if (gameState.gameOver) return;
    
    const node = MAP_NODES[gameState.currentNode];
    const isCamp = node.type === "camp";
    const weather = gameState.weather;
    const config = gameState.difficultyConfig || DIFFICULTY_MODES.normal;
    
    // 计算恢复量
    const modifiers = getStatusEffectModifiers();
    let staminaRecovery = isCamp ? 50 : 30;
    let moodRecovery = isCamp ? 25 : 15;
    let sanityRecovery = isCamp ? 20 : 10;
    
    // 应用难度修正
    if (config.resourceDrainModifier > 0) {
        staminaRecovery *= (1 - config.resourceDrainModifier * 0.5);
        moodRecovery *= (1 - config.resourceDrainModifier * 0.5);
    } else if (config.resourceDrainModifier < 0) {
        staminaRecovery *= (1 - config.resourceDrainModifier);
        moodRecovery *= (1 - config.resourceDrainModifier);
    }
    
    // 天气影响休息效果
    if (weather.id === "snowstorm" || weather.id === "heavyRain") {
        if (!isCamp) {
            staminaRecovery *= 0.5;
            moodRecovery *= 0.3;
            logEvent("恶劣天气中休息效果大打折扣！");
        }
    }
    
    // 状态效果影响
    staminaRecovery += modifiers.staminaRegen * 10;
    moodRecovery += modifiers.moodEffect;
    sanityRecovery += modifiers.sanityEffect;
    
    // 应用恢复
    gameState.stamina = Math.min(gameState.maxStamina, gameState.stamina + staminaRecovery);
    gameState.mood = Math.min(100, Math.max(0, gameState.mood + moodRecovery));
    gameState.sanity = Math.min(100, Math.max(0, gameState.sanity + sanityRecovery));
    gameState.fatigue = Math.max(0, gameState.fatigue - (isCamp ? 30 : 15));
    
    // 湿身恢复（应用速干衣效果）
    if (isCamp) {
        let wetnessRecovery = 40;
        wetnessRecovery = EquipmentSystem.applyWetnessRecovery(wetnessRecovery);
        gameState.wetness = Math.max(0, gameState.wetness - wetnessRecovery);
    }
    
    // 体温恢复（应用衣物保暖效果）
    if (gameState.bodyTemp < 36) {
        let tempRecovery = 0.5;
        gameState.bodyTemp = Math.min(37, gameState.bodyTemp + tempRecovery);
    } else if (gameState.bodyTemp > 38) {
        gameState.bodyTemp = Math.max(37, gameState.bodyTemp - 0.5);
    }
    
    // 消耗（应用难度资源消耗修正）
    const resourceMultiplier = 1 + config.resourceDrainModifier;
    gameState.food = Math.max(0, gameState.food - 12 * resourceMultiplier);
    gameState.water = Math.max(0, gameState.water - 15 * resourceMultiplier);
    gameState.hour += isCamp ? 4 : 2;
    gameState.restCount++;
    
    // 时间跨天处理
    if (gameState.hour >= 24) {
        gameState.hour -= 24;
        gameState.day++;
    }
    
    // 记录营地休息
    if (isCamp && !gameState.campsRested.includes(node.id)) {
        gameState.campsRested.push(node.id);
    }
    
    logEvent(`${isCamp ? "🏕️ 在营地" : "🌲 就地"}休息，恢复了体力！`);
    
    // 休息后更新
    updateWeather();
    updateStatusEffects();
    
    if (Math.random() < 0.2) {
        setTimeout(() => triggerRandomEvent(), 500);
    }
    
    checkSurvival();
    updateUI();
}

function eat() {
    if (gameState.gameOver) return;
    
    const foodItems = gameState.inventory.filter(item => 
        EQUIPMENT.food.some(f => f.id === item.id)
    );
    
    if (foodItems.length === 0) {
        logEvent("没有食物了！");
        return;
    }
    
    const food = foodItems[0];
    gameState.food = Math.min(100, gameState.food + (food.foodValue || 30));
    if (food.moodValue) {
        gameState.mood = Math.min(100, gameState.mood + food.moodValue);
    }
    gameState.inventory = gameState.inventory.filter(item => item.id !== food.id);
    
    logEvent(`🍽️ 吃了${food.name}，恢复了体力${food.moodValue ? "和心情" : ""}！`);
    updateUI();
}

function drink() {
    if (gameState.gameOver) return;
    
    gameState.water = Math.min(100, gameState.water + 30);
    logEvent("🥤 喝水补充水分！");
    updateUI();
}

// ==================== 生存检查 ====================

function checkSurvival() {
    // 检查致命状态
    if (hasStatusEffect("hypothermia") && gameState.bodyTemp < 33) {
        if (Math.random() < 0.3) {
            gameState.gameOver = true;
            gameState.deathReason = "严重失温导致生命体征衰竭...";
            showGameOver();
            return;
        }
    }
    
    if (hasStatusEffect("dehydration") && gameState.water <= 0) {
        gameState.stamina -= 10;
        gameState.health -= 5;
        logEvent("💀 严重脱水！生命受到威胁！");
    }
    
    // 检查体温
    if (gameState.bodyTemp < 33) {
        gameState.stamina -= 15;
        logEvent("🥶 体温过低！需要立即取暖！");
    } else if (gameState.bodyTemp > 40) {
        gameState.stamina -= 15;
        logEvent("🥵 体温过高！需要降温！");
    }
    
    // 检查体力
    if (gameState.stamina <= 0) {
        gameState.gameOver = true;
        if (gameState.food <= 0) {
            gameState.deathReason = "饥饿导致体力衰竭...";
        } else if (gameState.water <= 0) {
            gameState.deathReason = "脱水导致体力衰竭...";
        } else if (gameState.bodyTemp < 35) {
            gameState.deathReason = "失温导致体力衰竭...";
        } else {
            gameState.deathReason = "体力耗尽，无法继续前进...";
        }
        checkAchievements();
        showGameOver();
        return;
    }
    
    // 检查健康值
    if (gameState.health <= 0) {
        gameState.gameOver = true;
        gameState.deathReason = "伤势过重，不幸遇难...";
        showGameOver();
        return;
    }
    
    // 检查理智
    if (gameState.sanity <= 0) {
        addStatusEffect("panic");
        logEvent("😰 理智崩溃！你陷入了恐慌！");
    }
    
    // 低资源警告
    if (gameState.food <= 10) {
        logEvent("⚠️ 食物即将耗尽！");
    }
    if (gameState.water <= 10) {
        logEvent("⚠️ 水源即将耗尽！");
    }
}

// ==================== 成就系统 ====================

function loadAchievements() {
    const saved = localStorage.getItem("aotai_achievements");
    if (saved) {
        gameState.unlockedAchievements = JSON.parse(saved);
    }
}

function saveAchievements() {
    localStorage.setItem("aotai_achievements", JSON.stringify(gameState.unlockedAchievements));
}

function unlockAchievement(achievementId) {
    if (gameState.achievements.includes(achievementId)) return;
    
    const achievement = ACHIEVEMENTS.find(a => a.id === achievementId);
    if (!achievement) return;
    
    gameState.achievements.push(achievementId);
    
    if (!gameState.unlockedAchievements.includes(achievementId)) {
        gameState.unlockedAchievements.push(achievementId);
        saveAchievements();
    }
    
    showAchievementUnlock(achievement);
}

function showAchievementUnlock(achievement) {
    const toast = document.createElement("div");
    toast.className = "achievement-toast";
    toast.innerHTML = `
        <div class="achievement-toast-icon">${achievement.icon}</div>
        <div class="achievement-toast-content">
            <div class="achievement-toast-title">成就解锁！</div>
            <div class="achievement-toast-name">${achievement.name}</div>
            <div class="achievement-toast-desc">${achievement.desc}</div>
        </div>
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.classList.add("show"), 100);
    setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function checkAchievements() {
    const config = gameState.difficultyConfig || DIFFICULTY_MODES.normal;
    
    if (gameState.victory && gameState.day <= 3) {
        unlockAchievement("speed_runner");
    }
    
    const basicOnly = gameState.equipment.every(e => e.cost <= 15);
    if (gameState.victory && basicOnly && gameState.equipment.length <= 6) {
        unlockAchievement("light_packer");
    }
    
    if (gameState.victory && gameState.difficulty === "hard") {
        unlockAchievement("iron_man");
    }
    
    if (gameState.sceneryEventsTriggered.length >= 3) {
        unlockAchievement("photographer");
    }
    
    const dangerRoutes = ROUTES.filter(r => r.difficulty === "hard");
    const allDangerTaken = dangerRoutes.every(r => 
        gameState.dangerRoutesTaken.includes(`${r.from}-${r.to}`)
    );
    if (allDangerTaken) {
        unlockAchievement("explorer");
    }
    
    const campNodes = MAP_NODES.filter(n => n.type === "camp").map(n => n.id);
    const allCampsRested = campNodes.every(id => gameState.campsRested.includes(id));
    if (allCampsRested) {
        unlockAchievement("camp_master");
    }
    
    if (gameState.hikersEncountered > 0 && gameState.hikersHelped >= gameState.hikersEncountered) {
        unlockAchievement("helper");
    }
    
    if (gameState.victory && gameState.dangerRoutesTaken.length === 0) {
        unlockAchievement("nature_respect");
    }
    
    if (gameState.victory && gameState.trashLeft === 0) {
        unlockAchievement("eco_guardian");
    }
    
    if (gameState.survivedBlizzard) {
        unlockAchievement("blizzard_survivor");
    }
    
    if (gameState.victory && gameState.stamina >= 90) {
        unlockAchievement("perfect_finish");
    }
    
    if (gameState.maxGoodEventStreak >= 3) {
        unlockAchievement("lucky_one");
    }
    
    if (gameState.neverLost && gameState.victory) {
        unlockAchievement("navigator");
    }
    
    // 特殊成就检查
    checkSpecialAchievements();
}

function checkSpecialAchievements() {
    const config = gameState.difficultyConfig || DIFFICULTY_MODES.normal;
    
    // 地狱行者：在地狱模式下完成穿越
    if (gameState.victory && config.id === 'hell') {
        unlockAchievement("hell_survivor");
    }
    
    // 钢铁意志：在困难或地狱模式下无伤通关
    if (gameState.victory && (config.id === 'hard' || config.id === 'hell') && gameState.injuryCount === 0) {
        unlockAchievement("iron_will");
    }
    
    // 极简主义者：在地狱模式下使用不超过30点装备预算通关
    if (gameState.victory && config.id === 'hell' && gameState.equipmentPointsUsed <= 30) {
        unlockAchievement("minimalist");
    }
    
    // 风暴之主：在地狱模式下经历5次以上暴风雪并存活
    if (config.id === 'hell' && gameState.blizzardCount >= 5) {
        unlockAchievement("storm_master");
    }
}

function handleVictory() {
    const config = gameState.difficultyConfig || DIFFICULTY_MODES.normal;
    
    // 解锁下一难度
    if (config.id === 'normal' && !isDifficultyUnlocked('hard')) {
        unlockDifficulty('hard');
        logEvent("🎉 解锁困难模式！");
    } else if (config.id === 'hard' && !isDifficultyUnlocked('hell')) {
        unlockDifficulty('hell');
        logEvent("🎉 解锁地狱模式！");
    }
    
    showGameOver();
}

// ==================== UI 更新 ====================

function updateUI() {
    // 更新资源条
    updateResourceBar("stamina", gameState.stamina);
    updateResourceBar("food", gameState.food);
    updateResourceBar("water", gameState.water);
    updateResourceBar("mood", gameState.mood);
    
    // 更新状态栏
    const node = MAP_NODES[gameState.currentNode];
    const locationEl = document.getElementById("current-location");
    const dayEl = document.getElementById("current-day");
    const weatherEl = document.getElementById("current-weather");
    
    if (locationEl) locationEl.textContent = node.name;
    if (dayEl) dayEl.textContent = gameState.day;
    if (weatherEl) {
        weatherEl.innerHTML = `${gameState.weather.icon} ${gameState.weather.name} ${gameState.weather.temperature}°C`;
    }
    
    // 更新继续游戏按钮
    const hasSave = localStorage.getItem("aotai_save") !== null;
    const continueBtn = document.getElementById("btn-continue");
    if (continueBtn) continueBtn.disabled = !hasSave;
    
    // 更新状态效果显示
    updateStatusEffectsDisplay();
    
    // 更新身体状态显示
    updateBodyStatusDisplay();
}

function updateResourceBar(type, value) {
    const bar = document.getElementById(`${type}-bar`);
    const valueSpan = document.getElementById(`${type}-value`);
    
    if (!bar || !valueSpan) return;
    
    bar.style.width = `${value}%`;
    valueSpan.textContent = Math.floor(value);
    
    bar.classList.remove("low", "critical");
    if (value <= 20) {
        bar.classList.add("critical");
    } else if (value <= 40) {
        bar.classList.add("low");
    }
}

function updateStatusEffectsDisplay() {
    const container = document.getElementById("status-effects");
    if (!container) return;
    
    container.innerHTML = "";
    gameState.statusEffects.forEach(effect => {
        const def = STATUS_EFFECTS[effect.id];
        if (!def) return;
        
        const badge = document.createElement("span");
        badge.className = "status-badge";
        badge.textContent = `${def.icon} ${def.name}`;
        container.appendChild(badge);
    });
}

function updateBodyStatusDisplay() {
    const bodyTempEl = document.getElementById("body-temp");
    const wetnessEl = document.getElementById("wetness");
    const fatigueEl = document.getElementById("fatigue");
    const sanityEl = document.getElementById("sanity");
    
    if (bodyTempEl) bodyTempEl.textContent = `${gameState.bodyTemp.toFixed(1)}°C`;
    if (wetnessEl) wetnessEl.textContent = `${Math.floor(gameState.wetness)}%`;
    if (fatigueEl) fatigueEl.textContent = `${Math.floor(gameState.fatigue)}%`;
    if (sanityEl) sanityEl.textContent = `${Math.floor(gameState.sanity)}%`;
}

function renderMap() {
    const container = document.getElementById("map-container");
    if (!container) return;
    container.innerHTML = "";
    
    MAP_NODES.forEach((node, index) => {
        const nodeDiv = document.createElement("div");
        const isCurrent = index === gameState.currentNode;
        const isPast = index < gameState.currentNode;
        const isNext = index === gameState.currentNode + 1;
        
        let statusClass = "";
        if (isCurrent) statusClass = "current";
        else if (isPast) statusClass = "visited";
        else if (isNext) statusClass = "next";
        
        let icon = "📍";
        if (node.type === "start") icon = "🏘️";
        else if (node.type === "end") icon = "🏁";
        else if (node.type === "camp") icon = "⛺";
        else if (node.type === "danger") icon = "⚠️";
        else if (node.type === "landmark") icon = "🚩";
        
        nodeDiv.className = `map-node ${statusClass}`;
        nodeDiv.innerHTML = `
            <div class="node-icon">${icon}</div>
            <div class="node-name">${node.name}</div>
            <div class="node-elevation">${node.elevation}m</div>
        `;
        
        container.appendChild(nodeDiv);
        
        if (index < MAP_NODES.length - 1) {
            const lineDiv = document.createElement("div");
            lineDiv.className = `map-line ${isPast ? "active" : ""}`;
            container.appendChild(lineDiv);
        }
    });
}

// ==================== 界面函数 ====================

function showScreen(screenId) {
    document.querySelectorAll(".screen").forEach(screen => {
        screen.classList.remove("active");
    });
    const screen = document.getElementById(screenId);
    if (screen) screen.classList.add("active");
}

function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add("active");
}

function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove("active");
}

function showInventory() {
    const container = document.getElementById("inventory-list");
    if (!container) return;
    container.innerHTML = "";
    
    if (gameState.inventory.length === 0) {
        container.innerHTML = "<p class='empty-inventory'>背包是空的</p>";
    } else {
        gameState.inventory.forEach(item => {
            const itemDiv = document.createElement("div");
            itemDiv.className = "inventory-item";
            itemDiv.innerHTML = `
                <span class="item-name">${item.name}</span>
                <span class="item-weight">${item.weight}kg</span>
            `;
            container.appendChild(itemDiv);
        });
    }
    
    const weightInfo = document.createElement("div");
    weightInfo.className = "weight-info";
    weightInfo.innerHTML = `
        <span>总负重: ${gameState.totalWeight.toFixed(1)}kg / ${gameState.maxCapacity}kg</span>
    `;
    container.appendChild(weightInfo);
    
    showModal("inventory-screen");
}

function showGameOver() {
    const isVictory = gameState.victory;
    
    const endIcon = document.getElementById("end-icon");
    const endTitle = document.getElementById("end-title");
    const endDesc = document.getElementById("end-description");
    const endStats = document.getElementById("end-stats");
    
    if (endIcon) endIcon.textContent = isVictory ? "🏆" : "💀";
    if (endTitle) endTitle.textContent = isVictory ? "穿越成功！" : "游戏结束";
    if (endDesc) {
        endDesc.textContent = isVictory 
            ? "恭喜你成功穿越鳌太线！这是一次伟大的成就！"
            : gameState.deathReason || "你没能完成穿越...";
    }
    
    if (endStats) {
        endStats.innerHTML = `
            <div class="stat-item"><span>移动次数:</span><span>${gameState.moves}</span></div>
            <div class="stat-item"><span>触发事件:</span><span>${gameState.eventsTriggered}</span></div>
            <div class="stat-item"><span>休息次数:</span><span>${gameState.restCount}</span></div>
            <div class="stat-item"><span>行进距离:</span><span>${gameState.totalDistance}km</span></div>
            <div class="stat-item"><span>到达节点:</span><span>${MAP_NODES[gameState.currentNode]?.name || "未知"}</span></div>
            <div class="stat-item"><span>游戏天数:</span><span>${gameState.day}</span></div>
            <div class="stat-item"><span>道德评分:</span><span>${gameState.moralScore}</span></div>
        `;
        
        if (gameState.achievements.length > 0) {
            const achievementsDiv = document.createElement("div");
            achievementsDiv.className = "end-achievements";
            achievementsDiv.innerHTML = "<h4>🏅 本局成就</h4>";
            const listDiv = document.createElement("div");
            listDiv.className = "achievements-grid";
            gameState.achievements.forEach(achId => {
                const ach = ACHIEVEMENTS.find(a => a.id === achId);
                if (ach) {
                    listDiv.innerHTML += `
                        <div class="achievement-badge">
                            <span class="badge-icon">${ach.icon}</span>
                            <span class="badge-name">${ach.name}</span>
                        </div>
                    `;
                }
            });
            achievementsDiv.appendChild(listDiv);
            endStats.appendChild(achievementsDiv);
        }
    }
    
    showModal("game-over-screen");
    saveGame();
}

function showHelp() {
    showModal("help-screen");
}

function showAchievements() {
    const container = document.getElementById("achievements-list");
    if (!container) return;
    container.innerHTML = "";
    
    const categories = {
        survival: "生存类",
        explore: "探索类",
        moral: "道德类",
        special: "特殊类"
    };
    
    Object.entries(categories).forEach(([catId, catName]) => {
        const catDiv = document.createElement("div");
        catDiv.className = "achievement-category";
        catDiv.innerHTML = `<h4>${catName}</h4>`;
        
        const catAchievements = ACHIEVEMENTS.filter(a => a.category === catId);
        catAchievements.forEach(achievement => {
            const isUnlocked = gameState.unlockedAchievements.includes(achievement.id);
            const isCurrentGame = gameState.achievements.includes(achievement.id);
            
            const itemDiv = document.createElement("div");
            itemDiv.className = `achievement-item ${isUnlocked ? "unlocked" : "locked"} ${isCurrentGame ? "current" : ""}`;
            itemDiv.innerHTML = `
                <div class="achievement-icon">${isUnlocked ? achievement.icon : "🔒"}</div>
                <div class="achievement-info">
                    <div class="achievement-name">${achievement.name}</div>
                    <div class="achievement-desc">${achievement.desc}</div>
                </div>
            `;
            catDiv.appendChild(itemDiv);
        });
        
        container.appendChild(catDiv);
    });
    
    showModal("achievements-screen");
}

function logEvent(message) {
    const log = document.getElementById("event-log");
    if (!log) return;
    
    const entry = document.createElement("div");
    entry.className = "log-entry";
    entry.textContent = `[Day ${gameState.day} ${gameState.hour}:00] ${message}`;
    log.insertBefore(entry, log.firstChild);
    
    while (log.children.length > 20) {
        log.removeChild(log.lastChild);
    }
}

// ==================== 存档功能 ====================

function saveGame() {
    localStorage.setItem("aotai_save", JSON.stringify(gameState));
    logEvent("💾 游戏已保存！");
}

function loadGame() {
    const save = localStorage.getItem("aotai_save");
    if (save) {
        const loaded = JSON.parse(save);
        // 保留已解锁成就
        const unlocked = gameState.unlockedAchievements;
        gameState = { ...gameState, ...loaded };
        gameState.unlockedAchievements = unlocked.length > 0 ? unlocked : (loaded.unlockedAchievements || []);
    }
}

// ==================== 启动游戏 ====================

document.addEventListener("DOMContentLoaded", initGame);
