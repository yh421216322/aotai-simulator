/**
 * 鳌太线模拟器 - 实景查看与相册系统
 * 包含节点实景查看、拍照收集、相册管理、特殊风景事件
 * 
 * 依赖: visuals.js (提供 NODE_SCENERY, WEATHER_VISUALS 数据)
 *       game.js (提供 gameState, logEvent, updateUI, showNotification 等)
 */

// ==================== 照片数据结构 ====================

// 照片模板 - 每个节点的默认照片数据
const PHOTO_TEMPLATES = {
    0: {
        title: "穿越起点",
        defaultTitle: "塘口村出发纪念",
        description: "秦岭脚下的宁静村庄，鳌太穿越从这里开始",
        moodBonus: 5
    },
    1: {
        title: "火烧坡遗迹",
        defaultTitle: "火烧坡掠影",
        description: "焦黑的树干与新生绿意，展现生命的顽强",
        moodBonus: 8
    },
    2: {
        title: "星空营地",
        defaultTitle: "2900营地夜景",
        description: "海拔2900米的理想营地，满天繁星触手可及",
        moodBonus: 12
    },
    3: {
        title: "云端漫步",
        defaultTitle: "鳌山大梁风光",
        description: "行走在主脊之上，云海在身旁翻涌",
        moodBonus: 15
    },
    4: {
        title: "地标打卡",
        defaultTitle: "导航架留念",
        description: "鳌太线最著名的地标，每一位穿越者的必到之处",
        moodBonus: 10
    },
    5: {
        title: "古庙寻踪",
        defaultTitle: "药王庙探访",
        description: "废弃的药王庙，斑驳的墙壁诉说着岁月沧桑",
        moodBonus: 8
    },
    6: {
        title: "峭壁攀登",
        defaultTitle: "麦秸岭挑战",
        description: "陡峭岩壁如同麦秸般耸立，需要手脚并用",
        moodBonus: 10
    },
    7: {
        title: "金色营地",
        defaultTitle: "水窝子营地夕照",
        description: "鳌太线上最优质的营地，夕阳将整片营地染成金色",
        moodBonus: 12
    },
    8: {
        title: "胜利终点",
        defaultTitle: "太白山景区到达",
        description: "终点！鳌太穿越之旅画上圆满句号",
        moodBonus: 15
    }
};

// 特殊风景事件配置
const SPECIAL_SCENERY_EVENTS = {
    sea_of_clouds: {
        id: "sea_of_clouds",
        name: "云海奇观",
        icon: "☁️🏔️☁️",
        description: "晴空之下，鳌山大梁周围突然涌现出壮观的云海。云层如海浪般翻涌，山峰如岛屿般矗立，仿佛置身仙境。",
        condition: {
            nodeId: 3, // 鳌山大梁
            weather: ["sunny", "cloudy"],
            probability: 0.4
        },
        moodBonus: 25,
        specialTitle: "云海仙境",
        achievement: "云海见证者"
    },
    meteor_shower: {
        id: "meteor_shower",
        name: "流星雨",
        icon: "🌠✨🌌",
        description: "夜幕降临，2900营地上空突然划过一道道流星。璀璨的光芒划破夜空，你赶紧许下心愿...",
        condition: {
            nodeId: 2, // 2900营地
            time: "night", // 夜间
            probability: 0.3
        },
        moodBonus: 30,
        specialTitle: "流星许愿",
        achievement: "星空摄影师"
    },
    mysterious_fog: {
        id: "mysterious_fog",
        name: "迷雾导航架",
        icon: "🌫️🗼🌫️",
        description: "大雾中的导航架若隐若现，金属架在雾中泛着幽幽的光。周围一片寂静，仿佛进入了另一个世界...",
        condition: {
            nodeId: 4, // 导航架
            weather: ["fog"],
            probability: 0.5
        },
        moodBonus: 20,
        specialTitle: "迷雾地标",
        achievement: "迷雾探索者"
    },
    snowy_temple: {
        id: "snowy_temple",
        name: "雪中古庙",
        icon: "❄️⛩️❄️",
        description: "雪花轻轻飘落在药王庙的屋檐上，古老的庙宇在白雪的覆盖下更显庄严肃穆。一片银装素裹，美不胜收。",
        condition: {
            nodeId: 5, // 药王庙
            weather: ["snow", "snowstorm"],
            probability: 0.6
        },
        moodBonus: 22,
        specialTitle: "雪覆古庙",
        achievement: "雪中行者"
    },
    golden_sunset: {
        id: "golden_sunset",
        name: "金色夕阳",
        icon: "🌅⛺🌅",
        description: "夕阳西下，水窝子营地被染成一片金色。远处的山峰镀上了金边，这是全程最美的时刻。",
        condition: {
            nodeId: 7, // 水窝子营地
            time: "dusk", // 黄昏
            probability: 0.5
        },
        moodBonus: 20,
        specialTitle: "金色时刻",
        achievement: "追光者"
    },
    eagle_sight: {
        id: "eagle_sight",
        name: "雄鹰展翅",
        icon: "🦅⛰️🦅",
        description: "一只雄鹰在麦秸岭上空盘旋，翅膀展开足有两米。它优雅地滑翔，仿佛在巡视自己的领地。",
        condition: {
            nodeId: 6, // 麦秸岭
            weather: ["sunny", "cloudy"],
            probability: 0.35
        },
        moodBonus: 18,
        specialTitle: "雄鹰之眼",
        achievement: "天空观察者"
    }
};

// ==================== 相册数据管理 ====================

// 相册数据存储
let photoAlbum = {
    photos: [], // 所有照片
    nodePhotos: {}, // 按节点分类 {nodeId: [photoIds]}
    specialEventsTriggered: [], // 已触发的特殊事件
    totalViewTime: 0, // 总观景时间(分钟)
    photosTaken: 0 // 拍照次数
};

// 从localStorage加载相册数据
function loadPhotoAlbum() {
    const saved = localStorage.getItem("aotai_photo_album");
    if (saved) {
        photoAlbum = JSON.parse(saved);
    }
}

// 保存相册数据到localStorage
function savePhotoAlbum() {
    localStorage.setItem("aotai_photo_album", JSON.stringify(photoAlbum));
}

// ==================== 实景查看系统 ====================

// 注意：sceneryViewActive 变量在 visuals.js 中定义，这里不要重复声明
// let sceneryViewActive = false;
let currentSceneryData = null;

/**
 * 初始化实景查看系统
 */
function initScenerySystem() {
    loadPhotoAlbum();
    createSceneryModal();
    createAlbumModal();
    addSceneryViewButton();
    addAlbumButton();
}

/**
 * 创建实景查看弹窗
 */
function createSceneryModal() {
    // 检查是否已存在
    if (document.getElementById('scenery-modal')) return;
    
    const modal = document.createElement('div');
    modal.id = 'scenery-modal';
    modal.className = 'screen modal';
    modal.innerHTML = `
        <div class="modal-content scenery-content">
            <div class="scenery-header">
                <h3 id="scenery-title">节点实景</h3>
                <button class="btn-close" onclick="closeSceneryView()">✕</button>
            </div>
            <div class="scenery-scene" id="scenery-scene">
                <div class="emoji-scene" id="emoji-scene"></div>
                <div class="scene-weather-overlay" id="scene-weather-overlay"></div>
                <div class="scene-effects" id="scene-effects"></div>
                <div class="special-event-overlay" id="special-event-overlay"></div>
            </div>
            <div class="scenery-info">
                <div class="scenery-description" id="scenery-description"></div>
                <div class="scenery-features" id="scenery-features"></div>
                <div class="scenery-atmosphere" id="scenery-atmosphere"></div>
                <div class="special-event-info" id="special-event-info" style="display:none;">
                    <div class="special-event-badge">✨ 特殊景观</div>
                    <div class="special-event-name" id="special-event-name"></div>
                    <div class="special-event-desc" id="special-event-desc"></div>
                </div>
            </div>
            <div class="scenery-actions">
                <button id="btn-take-photo" class="btn btn-primary">📸 拍照留念</button>
                <button id="btn-explore-scenery" class="btn btn-success">🔍 仔细探索</button>
                <button class="btn btn-secondary" onclick="closeSceneryView()">返回</button>
            </div>
            <div class="view-time-hint" id="view-time-hint">预计耗时: 15分钟</div>
        </div>
    `;
    document.body.appendChild(modal);
    
    // 添加事件监听
    document.getElementById('btn-take-photo').addEventListener('click', takePhoto);
    document.getElementById('btn-explore-scenery').addEventListener('click', exploreScenery);
}

/**
 * 创建相册弹窗
 */
function createAlbumModal() {
    // 检查是否已存在
    if (document.getElementById('album-modal')) return;
    
    const modal = document.createElement('div');
    modal.id = 'album-modal';
    modal.className = 'screen modal';
    modal.innerHTML = `
        <div class="modal-content album-content">
            <div class="album-header">
                <h3>📷 风景相册</h3>
                <div class="album-stats">
                    <span id="album-progress">收集进度: 0/9</span>
                    <span id="album-special">特殊景观: 0</span>
                </div>
                <button class="btn-close" onclick="closeAlbum()">✕</button>
            </div>
            <div class="album-tabs">
                <button class="tab-btn active" data-tab="all">全部照片</button>
                <button class="tab-btn" data-tab="nodes">按节点</button>
                <button class="tab-btn" data-tab="special">特殊景观</button>
            </div>
            <div class="album-body">
                <div class="album-grid" id="album-grid">
                    <!-- 照片网格 -->
                </div>
                <div class="album-nodes" id="album-nodes" style="display:none;">
                    <!-- 按节点分类 -->
                </div>
                <div class="album-special-events" id="album-special-events" style="display:none;">
                    <!-- 特殊景观 -->
                </div>
            </div>
            <div class="album-actions">
                <button class="btn btn-secondary" onclick="closeAlbum()">关闭</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    // 添加标签切换事件
    modal.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => switchAlbumTab(btn.dataset.tab));
    });
}

/**
 * 添加实景查看按钮到游戏界面
 */
function addSceneryViewButton() {
    const actionPanel = document.querySelector('.action-panel');
    if (!actionPanel) return;
    
    // 检查是否已存在
    if (document.getElementById('btn-scenery')) return;
    
    const sceneryBtn = document.createElement('button');
    sceneryBtn.id = 'btn-scenery';
    sceneryBtn.className = 'btn btn-info';
    sceneryBtn.innerHTML = '📷 实景';
    sceneryBtn.title = '查看当前节点实景';
    sceneryBtn.addEventListener('click', openSceneryView);
    
    // 插入到存档按钮之前
    const saveBtn = document.getElementById('btn-save');
    if (saveBtn) {
        actionPanel.insertBefore(sceneryBtn, saveBtn);
    } else {
        actionPanel.appendChild(sceneryBtn);
    }
}

/**
 * 添加相册按钮到主菜单
 */
function addAlbumButton() {
    const menuButtons = document.querySelector('.menu-buttons');
    if (!menuButtons) return;
    
    // 检查是否已存在
    if (document.getElementById('btn-album')) return;
    
    const albumBtn = document.createElement('button');
    albumBtn.id = 'btn-album';
    albumBtn.className = 'btn btn-info';
    albumBtn.innerHTML = '📷 风景相册';
    albumBtn.addEventListener('click', openAlbum);
    
    // 插入到帮助按钮之前
    const helpBtn = document.getElementById('btn-help');
    if (helpBtn) {
        menuButtons.insertBefore(albumBtn, helpBtn);
    } else {
        menuButtons.appendChild(albumBtn);
    }
}

/**
 * 打开实景查看
 */
function openSceneryView() {
    if (sceneryViewActive) return;
    if (typeof gameState === 'undefined' || !gameState.currentNode !== undefined && gameState.currentNode === undefined) {
        showNotification("游戏尚未开始！", "error");
        return;
    }
    
    const nodeId = gameState.currentNode;
    const scenery = NODE_SCENERY[nodeId];
    
    if (!scenery) {
        showNotification("当前位置没有实景数据", "error");
        return;
    }
    
    sceneryViewActive = true;
    currentSceneryData = {
        nodeId: nodeId,
        scenery: scenery,
        specialEvent: null
    };
    
    // 填充内容
    document.getElementById('scenery-title').textContent = scenery.name;
    document.getElementById('emoji-scene').textContent = scenery.emojiScene;
    document.getElementById('scenery-description').textContent = scenery.description;
    
    // 特色标签
    const featuresContainer = document.getElementById('scenery-features');
    featuresContainer.innerHTML = scenery.features.map(f => 
        `<span class="feature-tag">${f}</span>`
    ).join('');
    
    // 氛围描述
    document.getElementById('scenery-atmosphere').innerHTML = 
        `<span class="atmosphere-label">氛围：</span>${scenery.atmosphere}`;
    
    // 检查并应用特殊风景事件
    checkSpecialSceneryEvent(nodeId);
    
    // 应用天气效果到场景
    applyWeatherToScenery();
    
    // 显示弹窗
    document.getElementById('scenery-modal').classList.add('active');
    
    // 记录观景时间
    photoAlbum.totalViewTime += 15;
    savePhotoAlbum();
    
    // 消耗少量时间和体力
    if (typeof gameState !== 'undefined') {
        gameState.stamina = Math.max(0, gameState.stamina - 2);
        
        // 恢复少量心情
        const moodRecovery = 5 + Math.floor(Math.random() * 6); // 5-10
        gameState.mood = Math.min(100, gameState.mood + moodRecovery);
        
        if (typeof logEvent === 'function') {
            logEvent(`欣赏了${scenery.name}的实景，心情有所恢复 (+${moodRecovery})`);
        }
        if (typeof updateUI === 'function') {
            updateUI();
        }
    }
}

/**
 * 关闭实景查看
 */
function closeSceneryView() {
    const modal = document.getElementById('scenery-modal');
    if (modal) modal.classList.remove('active');
    sceneryViewActive = false;
    currentSceneryData = null;
}

/**
 * 检查特殊风景事件
 */
function checkSpecialSceneryEvent(nodeId) {
    const specialOverlay = document.getElementById('special-event-overlay');
    const specialInfo = document.getElementById('special-event-info');
    const specialName = document.getElementById('special-event-name');
    const specialDesc = document.getElementById('special-event-desc');
    
    // 重置显示
    specialOverlay.style.display = 'none';
    specialInfo.style.display = 'none';
    
    // 检查每个特殊事件
    for (const [eventId, eventData] of Object.entries(SPECIAL_SCENERY_EVENTS)) {
        if (eventData.condition.nodeId !== nodeId) continue;
        
        // 检查天气条件
        if (eventData.condition.weather) {
            const currentWeather = gameState.weather ? gameState.weather.id : 'sunny';
            if (!eventData.condition.weather.includes(currentWeather)) continue;
        }
        
        // 检查时间条件
        if (eventData.condition.time) {
            const currentTime = getTimeOfDay ? getTimeOfDay() : 'day';
            if (eventData.condition.time !== currentTime) continue;
        }
        
        // 概率检查
        if (Math.random() > eventData.condition.probability) continue;
        
        // 触发特殊事件！
        triggerSpecialSceneryEvent(eventData);
        return;
    }
}

/**
 * 触发特殊风景事件
 */
function triggerSpecialSceneryEvent(eventData) {
    currentSceneryData.specialEvent = eventData;
    
    const specialOverlay = document.getElementById('special-event-overlay');
    const specialInfo = document.getElementById('special-event-info');
    const specialName = document.getElementById('special-event-name');
    const specialDesc = document.getElementById('special-event-desc');
    const emojiScene = document.getElementById('emoji-scene');
    
    // 显示特殊效果
    specialOverlay.style.display = 'block';
    specialOverlay.innerHTML = `<div class="special-emoji-animation">${eventData.icon}</div>`;
    
    // 更新信息
    specialInfo.style.display = 'block';
    specialName.textContent = eventData.name;
    specialDesc.textContent = eventData.description;
    
    // 更新emoji场景
    emojiScene.innerHTML = `${eventData.icon}<div class="special-scene-label">${eventData.name}</div>`;
    
    // 记录触发
    if (!photoAlbum.specialEventsTriggered.includes(eventData.id)) {
        photoAlbum.specialEventsTriggered.push(eventData.id);
        savePhotoAlbum();
        
        // 显示通知
        showNotification(`✨ 发现特殊景观：${eventData.name}！`, "success");
        
        // 记录到游戏日志
        if (typeof logEvent === 'function') {
            logEvent(`🎉 特殊景观：${eventData.name} - ${eventData.description.substring(0, 30)}...`);
        }
        
        // 额外心情奖励
        if (typeof gameState !== 'undefined') {
            gameState.mood = Math.min(100, gameState.mood + eventData.moodBonus);
        }
    }
}

/**
 * 拍照留念
 */
function takePhoto() {
    if (!currentSceneryData) return;
    
    const { nodeId, scenery, specialEvent } = currentSceneryData;
    const photoTemplate = PHOTO_TEMPLATES[nodeId];
    
    // 生成照片数据
    const photo = {
        id: `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        nodeId: nodeId,
        nodeName: scenery.name,
        title: specialEvent ? specialEvent.specialTitle : photoTemplate.title,
        description: specialEvent ? specialEvent.description : photoTemplate.description,
        emojiScene: specialEvent ? specialEvent.icon : scenery.emojiScene,
        timestamp: Date.now(),
        gameDay: gameState.day,
        gameHour: gameState.hour,
        weather: gameState.weather ? gameState.weather.name : '未知',
        isSpecial: !!specialEvent,
        specialEventId: specialEvent ? specialEvent.id : null,
        moodBonus: specialEvent ? specialEvent.moodBonus : photoTemplate.moodBonus
    };
    
    // 添加到相册
    photoAlbum.photos.push(photo);
    if (!photoAlbum.nodePhotos[nodeId]) {
        photoAlbum.nodePhotos[nodeId] = [];
    }
    photoAlbum.nodePhotos[nodeId].push(photo.id);
    photoAlbum.photosTaken++;
    savePhotoAlbum();
    
    // 恢复心情值
    const moodRecovery = photo.moodBonus;
    gameState.mood = Math.min(100, gameState.mood + moodRecovery);
    
    // 消耗少量体力
    gameState.stamina = Math.max(0, gameState.stamina - 3);
    
    // 显示拍照效果
    showPhotoEffect(photo);
    
    // 记录日志
    if (typeof logEvent === 'function') {
        logEvent(`📸 在${scenery.name}拍照留念：${photo.title} (+${moodRecovery}心情)`);
    }
    
    // 检查摄影师成就
    checkPhotographerAchievement();
    
    if (typeof updateUI === 'function') {
        updateUI();
    }
    
    // 延迟关闭
    setTimeout(() => {
        closeSceneryView();
    }, 1500);
}

/**
 * 显示拍照效果
 */
function showPhotoEffect(photo) {
    const effect = document.createElement('div');
    effect.className = 'photo-flash-effect';
    effect.innerHTML = `
        <div class="flash-overlay"></div>
        <div class="photo-preview">
            <div class="preview-emoji">${photo.emojiScene}</div>
            <div class="preview-title">${photo.title}</div>
            <div class="preview-location">📍 ${photo.nodeName}</div>
            <div class="preview-saved">✓ 已保存到相册</div>
        </div>
    `;
    document.body.appendChild(effect);
    
    setTimeout(() => effect.classList.add('active'), 10);
    setTimeout(() => {
        effect.classList.remove('active');
        setTimeout(() => effect.remove(), 300);
    }, 1200);
}

/**
 * 仔细探索
 */
function exploreScenery() {
    if (!currentSceneryData) return;
    
    const { nodeId, scenery } = currentSceneryData;
    
    // 消耗更多体力和时间
    gameState.stamina = Math.max(0, gameState.stamina - 8);
    photoAlbum.totalViewTime += 30;
    savePhotoAlbum();
    
    // 可能发现物品或触发事件
    const rand = Math.random();
    
    if (rand < 0.2) {
        // 发现补给
        const foodGain = 10;
        const waterGain = 10;
        gameState.food = Math.min(100, gameState.food + foodGain);
        gameState.water = Math.min(100, gameState.water + waterGain);
        if (typeof logEvent === 'function') {
            logEvent(`在${scenery.name}探索时发现了补给！(+${foodGain}食物, +${waterGain}水)`);
        }
        showNotification("探索发现：补给品！", "success");
    } else if (rand < 0.4 && scenery.specialEvent) {
        // 触发节点特殊事件
        if (typeof triggerSceneryEvent === 'function') {
            triggerSceneryEvent(nodeId);
        }
    } else {
        // 普通探索结果
        const moodGain = 8;
        gameState.mood = Math.min(100, gameState.mood + moodGain);
        if (typeof logEvent === 'function') {
            logEvent(`仔细探索了${scenery.name}，对这里有了更深的了解。(+${moodGain}心情)`);
        }
        showNotification("探索完成：有了更深的了解", "info");
    }
    
    closeSceneryView();
    if (typeof updateUI === 'function') {
        updateUI();
    }
}

/**
 * 应用天气效果到实景
 */
function applyWeatherToScenery() {
    const sceneEffects = document.getElementById('scene-effects');
    const weatherOverlay = document.getElementById('scene-weather-overlay');
    if (!sceneEffects || !weatherOverlay) return;
    
    sceneEffects.innerHTML = '';
    
    const weatherId = gameState.weather ? gameState.weather.id : 'sunny';
    const visual = WEATHER_VISUALS ? WEATHER_VISUALS[weatherId] : null;
    
    if (visual && visual.particleEffect) {
        // 在实景中复制天气效果
        switch(visual.particleEffect) {
            case 'rain-light':
            case 'rain-heavy':
                createSceneryRain(sceneEffects, 30);
                break;
            case 'snow':
                createScenerySnow(sceneEffects, 40);
                break;
            case 'fog':
                weatherOverlay.style.cssText = `
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(200,210,220,0.4);
                    backdrop-filter: blur(3px);
                    z-index: 2;
                `;
                break;
            case 'cloud':
                weatherOverlay.style.cssText = `
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(255,255,255,0.2);
                    z-index: 2;
                `;
                break;
        }
    } else {
        weatherOverlay.style.cssText = 'display: none;';
    }
}

/**
 * 创建实景雨滴
 */
function createSceneryRain(container, count) {
    for (let i = 0; i < count; i++) {
        const drop = document.createElement('div');
        drop.className = 'scenery-rain-drop';
        drop.style.cssText = `
            position: absolute;
            width: 2px;
            height: 15px;
            background: linear-gradient(to bottom, transparent, rgba(174,194,224,0.8));
            left: ${Math.random() * 100}%;
            top: -20px;
            animation: rain-fall ${0.5 + Math.random() * 0.5}s linear infinite;
            animation-delay: ${Math.random() * 2}s;
            z-index: 3;
        `;
        container.appendChild(drop);
    }
}

/**
 * 创建实景雪花
 */
function createScenerySnow(container, count) {
    for (let i = 0; i < count; i++) {
        const flake = document.createElement('div');
        flake.className = 'scenery-snow-flake';
        const size = 3 + Math.random() * 5;
        flake.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            background: rgba(255,255,255,0.9);
            border-radius: 50%;
            left: ${Math.random() * 100}%;
            top: -10px;
            animation: snow-fall ${3 + Math.random() * 4}s linear infinite;
            animation-delay: ${Math.random() * 5}s;
            z-index: 3;
        `;
        container.appendChild(flake);
    }
}

// ==================== 相册系统 ====================

/**
 * 打开相册
 */
function openAlbum() {
    renderAlbum();
    document.getElementById('album-modal').classList.add('active');
}

/**
 * 关闭相册
 */
function closeAlbum() {
    document.getElementById('album-modal').classList.remove('active');
}

/**
 * 切换相册标签
 */
function switchAlbumTab(tab) {
    // 更新按钮状态
    document.querySelectorAll('.album-tabs .tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tab);
    });
    
    // 显示对应内容
    document.getElementById('album-grid').style.display = tab === 'all' ? 'grid' : 'none';
    document.getElementById('album-nodes').style.display = tab === 'nodes' ? 'block' : 'none';
    document.getElementById('album-special-events').style.display = tab === 'special' ? 'block' : 'none';
    
    // 重新渲染
    if (tab === 'all') renderAlbumGrid();
    else if (tab === 'nodes') renderAlbumByNodes();
    else if (tab === 'special') renderAlbumSpecial();
}

/**
 * 渲染相册
 */
function renderAlbum() {
    // 更新统计
    const uniqueNodes = Object.keys(photoAlbum.nodePhotos).length;
    const totalNodes = 9;
    const specialCount = photoAlbum.specialEventsTriggered.length;
    
    document.getElementById('album-progress').textContent = `收集进度: ${uniqueNodes}/${totalNodes}`;
    document.getElementById('album-special').textContent = `特殊景观: ${specialCount}`;
    
    // 渲染当前标签
    const activeTab = document.querySelector('.album-tabs .tab-btn.active');
    if (activeTab) {
        switchAlbumTab(activeTab.dataset.tab);
    } else {
        renderAlbumGrid();
    }
}

/**
 * 渲染照片网格
 */
function renderAlbumGrid() {
    const grid = document.getElementById('album-grid');
    grid.innerHTML = '';
    
    if (photoAlbum.photos.length === 0) {
        grid.innerHTML = `
            <div class="album-empty">
                <div class="empty-icon">📷</div>
                <div class="empty-text">还没有照片</div>
                <div class="empty-hint">在游戏中使用"实景"功能拍照留念</div>
            </div>
        `;
        return;
    }
    
    // 按时间倒序排列
    const sortedPhotos = [...photoAlbum.photos].sort((a, b) => b.timestamp - a.timestamp);
    
    sortedPhotos.forEach(photo => {
        const card = createPhotoCard(photo);
        grid.appendChild(card);
    });
}

/**
 * 按节点渲染相册
 */
function renderAlbumByNodes() {
    const container = document.getElementById('album-nodes');
    container.innerHTML = '';
    
    if (photoAlbum.photos.length === 0) {
        container.innerHTML = '<div class="album-empty">还没有照片</div>';
        return;
    }
    
    // 遍历所有节点
    for (let i = 0; i <= 8; i++) {
        const nodePhotos = photoAlbum.photos.filter(p => p.nodeId === i);
        if (nodePhotos.length === 0) continue;
        
        const nodeSection = document.createElement('div');
        nodeSection.className = 'album-node-section';
        
        const nodeName = NODE_SCENERY[i] ? NODE_SCENERY[i].name : `节点${i}`;
        nodeSection.innerHTML = `<h4 class="node-section-title">${nodeName} (${nodePhotos.length}张)</h4>`;
        
        const nodeGrid = document.createElement('div');
        nodeGrid.className = 'album-node-grid';
        
        nodePhotos.forEach(photo => {
            const card = createPhotoCard(photo, true);
            nodeGrid.appendChild(card);
        });
        
        nodeSection.appendChild(nodeGrid);
        container.appendChild(nodeSection);
    }
}

/**
 * 渲染特殊景观
 */
function renderAlbumSpecial() {
    const container = document.getElementById('album-special-events');
    container.innerHTML = '';
    
    const specialPhotos = photoAlbum.photos.filter(p => p.isSpecial);
    
    if (specialPhotos.length === 0) {
        container.innerHTML = `
            <div class="album-empty">
                <div class="empty-icon">✨</div>
                <div class="empty-text">还没有特殊景观照片</div>
                <div class="empty-hint">在特定天气和时间条件下探索节点，有机会触发特殊景观</div>
                <div class="special-hints">
                    <div class="hint-item">☀️🏔️ 晴天+鳌山大梁 = 云海奇观</div>
                    <div class="hint-item">🌠 夜间+2900营地 = 流星雨</div>
                    <div class="hint-item">🌫️ 大雾+导航架 = 神秘氛围</div>
                    <div class="hint-item">❄️ 雪天+药王庙 = 雪中古庙</div>
                </div>
            </div>
        `;
        return;
    }
    
    const grid = document.createElement('div');
    grid.className = 'album-special-grid';
    
    specialPhotos.forEach(photo => {
        const card = createPhotoCard(photo);
        grid.appendChild(card);
    });
    
    container.appendChild(grid);
}

/**
 * 创建照片卡片
 */
function createPhotoCard(photo, compact = false) {
    const card = document.createElement('div');
    card.className = `photo-card ${photo.isSpecial ? 'special' : ''}`;
    
    const date = new Date(photo.timestamp);
    const dateStr = `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
    
    card.innerHTML = `
        <div class="photo-image">
            <div class="photo-emoji">${photo.emojiScene}</div>
            ${photo.isSpecial ? '<div class="special-badge">✨</div>' : ''}
        </div>
        <div class="photo-info">
            <div class="photo-title">${photo.title}</div>
            <div class="photo-meta">
                <span class="photo-location">📍 ${photo.nodeName}</span>
                <span class="photo-time">${dateStr}</span>
            </div>
            ${!compact ? `<div class="photo-desc">${photo.description.substring(0, 50)}...</div>` : ''}
        </div>
        <button class="photo-delete" onclick="deletePhoto('${photo.id}')" title="删除照片">🗑️</button>
    `;
    
    // 点击查看大图
    card.addEventListener('click', (e) => {
        if (!e.target.classList.contains('photo-delete')) {
            showPhotoDetail(photo);
        }
    });
    
    return card;
}

/**
 * 显示照片详情
 */
function showPhotoDetail(photo) {
    const date = new Date(photo.timestamp);
    const dateStr = `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
    
    const modal = document.createElement('div');
    modal.className = 'screen modal photo-detail-modal';
    modal.innerHTML = `
        <div class="modal-content photo-detail-content">
            <button class="btn-close" onclick="this.closest('.modal').remove()">✕</button>
            <div class="photo-detail-image">
                <div class="detail-emoji">${photo.emojiScene}</div>
            </div>
            <div class="photo-detail-info">
                <h3>${photo.title}</h3>
                <div class="detail-meta">
                    <div class="meta-item">📍 地点：${photo.nodeName}</div>
                    <div class="meta-item">📅 拍摄时间：${dateStr}</div>
                    <div class="meta-item">🎮 游戏内：第${photo.gameDay}天 ${photo.gameHour}:00</div>
                    <div class="meta-item">🌤️ 天气：${photo.weather}</div>
                </div>
                <div class="detail-description">${photo.description}</div>
                ${photo.isSpecial ? `<div class="detail-special">✨ 特殊景观照片</div>` : ''}
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('active'), 10);
}

/**
 * 删除照片
 */
function deletePhoto(photoId) {
    if (!confirm('确定要删除这张照片吗？')) return;
    
    const photoIndex = photoAlbum.photos.findIndex(p => p.id === photoId);
    if (photoIndex === -1) return;
    
    const photo = photoAlbum.photos[photoIndex];
    
    // 从数组中移除
    photoAlbum.photos.splice(photoIndex, 1);
    
    // 从节点分类中移除
    if (photoAlbum.nodePhotos[photo.nodeId]) {
        photoAlbum.nodePhotos[photo.nodeId] = photoAlbum.nodePhotos[photo.nodeId].filter(id => id !== photoId);
        if (photoAlbum.nodePhotos[photo.nodeId].length === 0) {
            delete photoAlbum.nodePhotos[photo.nodeId];
        }
    }
    
    savePhotoAlbum();
    renderAlbum();
    
    showNotification("照片已删除", "info");
}

// ==================== 成就检查 ====================

/**
 * 检查摄影师成就
 */
function checkPhotographerAchievement() {
    // 检查是否收集了所有节点的照片
    const uniqueNodes = Object.keys(photoAlbum.nodePhotos).length;
    const totalNodes = 9;
    
    if (uniqueNodes >= totalNodes) {
        // 解锁摄影师成就
        if (typeof unlockAchievement === 'function') {
            unlockAchievement('photographer');
        }
        
        // 检查是否收集了所有特殊景观
        const specialPhotos = photoAlbum.photos.filter(p => p.isSpecial);
        const uniqueSpecialEvents = [...new Set(specialPhotos.map(p => p.specialEventId))];
        
        // 可以在这里添加更多成就检查
        if (uniqueSpecialEvents.length >= 4) {
            // 景观大师成就（可以添加到ACHIEVEMENTS中）
            showNotification("🏆 成就解锁：景观大师！", "success");
        }
    }
}

// ==================== CSS样式 ====================

function addSceneryStyles() {
    // 检查是否已添加
    if (document.getElementById('scenery-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'scenery-styles';
    style.textContent = `
        /* 实景弹窗样式 */
        .scenery-content {
            max-width: 600px;
            padding: 0;
            overflow: hidden;
            background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
            border-radius: 16px;
        }
        
        .scenery-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px;
            background: linear-gradient(135deg, #2c5f2d, #4a7c4b);
            color: white;
        }
        
        .scenery-header h3 {
            margin: 0;
            color: white;
            font-size: 1.3rem;
        }
        
        .scenery-scene {
            position: relative;
            height: 220px;
            background: linear-gradient(180deg, #87ceeb 0%, #e8f4f8 50%, #c5d1db 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
        }
        
        .emoji-scene {
            font-size: 5rem;
            z-index: 2;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
            animation: scene-float 3s ease-in-out infinite;
            text-align: center;
        }
        
        .special-scene-label {
            font-size: 1rem;
            color: #ffd700;
            text-shadow: 0 0 10px rgba(255,215,0,0.5);
            margin-top: 8px;
            animation: special-glow 2s ease-in-out infinite;
        }
        
        @keyframes special-glow {
            0%, 100% { opacity: 0.8; text-shadow: 0 0 10px rgba(255,215,0,0.5); }
            50% { opacity: 1; text-shadow: 0 0 20px rgba(255,215,0,0.8); }
        }
        
        .scene-effects {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 3;
        }
        
        .scene-weather-overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 2;
        }
        
        .special-event-overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            display: none;
            z-index: 4;
            background: radial-gradient(circle at center, rgba(255,215,0,0.2) 0%, transparent 70%);
            animation: special-overlay-pulse 3s ease-in-out infinite;
        }
        
        @keyframes special-overlay-pulse {
            0%, 100% { opacity: 0.5; }
            50% { opacity: 1; }
        }
        
        .special-emoji-animation {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 8rem;
            animation: special-emoji-float 4s ease-in-out infinite;
            filter: drop-shadow(0 0 20px rgba(255,215,0,0.6));
        }
        
        @keyframes special-emoji-float {
            0%, 100% { transform: translate(-50%, -50%) scale(1); }
            50% { transform: translate(-50%, -60%) scale(1.1); }
        }
        
        @keyframes scene-float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
        }
        
        .scenery-info {
            padding: 20px;
        }
        
        .scenery-description {
            line-height: 1.8;
            color: #eaeaea;
            font-size: 0.95rem;
            margin-bottom: 15px;
        }
        
        .scenery-features {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-bottom: 12px;
        }
        
        .feature-tag {
            background: rgba(151,188,98,0.2);
            border: 1px solid #97bc62;
            color: #97bc62;
            padding: 4px 10px;
            border-radius: 12px;
            font-size: 0.8rem;
        }
        
        .scenery-atmosphere {
            color: #a0a0a0;
            font-size: 0.9rem;
            margin-bottom: 15px;
        }
        
        .atmosphere-label {
            color: #d4a574;
        }
        
        .special-event-info {
            background: linear-gradient(135deg, rgba(255,215,0,0.1), rgba(255,165,0,0.1));
            border: 1px solid rgba(255,215,0,0.3);
            border-radius: 12px;
            padding: 15px;
            margin-bottom: 15px;
        }
        
        .special-event-badge {
            display: inline-block;
            background: linear-gradient(135deg, #ffd700, #ffaa00);
            color: #1a1a2e;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 0.8rem;
            font-weight: bold;
            margin-bottom: 8px;
        }
        
        .special-event-name {
            font-size: 1.1rem;
            color: #ffd700;
            font-weight: bold;
            margin-bottom: 5px;
        }
        
        .special-event-desc {
            font-size: 0.9rem;
            color: #ccc;
            line-height: 1.6;
        }
        
        .scenery-actions {
            padding: 0 20px 20px;
            display: flex;
            gap: 10px;
            justify-content: center;
            flex-wrap: wrap;
        }
        
        .view-time-hint {
            text-align: center;
            padding-bottom: 15px;
            color: #888;
            font-size: 0.85rem;
        }
        
        /* 拍照效果 */
        .photo-flash-effect {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 10000;
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.1s;
        }
        
        .photo-flash-effect.active {
            opacity: 1;
        }
        
        .flash-overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: white;
            animation: flash 0.3s ease-out;
        }
        
        @keyframes flash {
            0% { opacity: 1; }
            100% { opacity: 0; }
        }
        
        .photo-preview {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #1a1a2e, #16213e);
            padding: 30px;
            border-radius: 16px;
            text-align: center;
            box-shadow: 0 20px 60px rgba(0,0,0,0.5);
            animation: preview-pop 0.5s ease-out 0.2s both;
            border: 2px solid #97bc62;
        }
        
        @keyframes preview-pop {
            0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
            100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
        }
        
        .preview-emoji {
            font-size: 4rem;
            margin-bottom: 10px;
        }
        
        .preview-title {
            font-size: 1.2rem;
            color: #97bc62;
            font-weight: bold;
            margin-bottom: 5px;
        }
        
        .preview-location {
            color: #888;
            font-size: 0.9rem;
            margin-bottom: 10px;
        }
        
        .preview-saved {
            color: #27ae60;
            font-size: 0.85rem;
        }
        
        /* 相册样式 */
        .album-content {
            max-width: 800px;
            max-height: 80vh;
            display: flex;
            flex-direction: column;
            background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
            border-radius: 16px;
            overflow: hidden;
        }
        
        .album-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px;
            background: linear-gradient(135deg, #2c5f2d, #4a7c4b);
            color: white;
        }
        
        .album-header h3 {
            margin: 0;
            color: white;
        }
        
        .album-stats {
            display: flex;
            gap: 20px;
            font-size: 0.9rem;
        }
        
        .album-tabs {
            display: flex;
            gap: 0;
            border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        
        .tab-btn {
            flex: 1;
            padding: 12px;
            background: transparent;
            border: none;
            color: #888;
            cursor: pointer;
            transition: all 0.3s;
            font-size: 0.9rem;
        }
        
        .tab-btn:hover {
            background: rgba(255,255,255,0.05);
            color: #ccc;
        }
        
        .tab-btn.active {
            background: rgba(151,188,98,0.2);
            color: #97bc62;
            border-bottom: 2px solid #97bc62;
        }
        
        .album-body {
            flex: 1;
            overflow-y: auto;
            padding: 20px;
            max-height: 50vh;
        }
        
        .album-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
            gap: 15px;
        }
        
        .album-node-grid,
        .album-special-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
            gap: 12px;
        }
        
        .photo-card {
            background: rgba(255,255,255,0.05);
            border-radius: 12px;
            overflow: hidden;
            cursor: pointer;
            transition: all 0.3s;
            position: relative;
        }
        
        .photo-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        }
        
        .photo-card.special {
            border: 1px solid rgba(255,215,0,0.3);
            box-shadow: 0 0 20px rgba(255,215,0,0.1);
        }
        
        .photo-image {
            height: 120px;
            background: linear-gradient(180deg, #87ceeb 0%, #c5d1db 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
        }
        
        .photo-emoji {
            font-size: 3rem;
        }
        
        .special-badge {
            position: absolute;
            top: 5px;
            right: 5px;
            background: linear-gradient(135deg, #ffd700, #ffaa00);
            color: #1a1a2e;
            padding: 2px 6px;
            border-radius: 8px;
            font-size: 0.7rem;
            font-weight: bold;
        }
        
        .photo-info {
            padding: 12px;
        }
        
        .photo-title {
            font-weight: bold;
            color: #eaeaea;
            font-size: 0.9rem;
            margin-bottom: 5px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        
        .photo-meta {
            display: flex;
            flex-direction: column;
            gap: 3px;
            font-size: 0.75rem;
            color: #888;
        }
        
        .photo-desc {
            font-size: 0.8rem;
            color: #aaa;
            margin-top: 5px;
            line-height: 1.4;
        }
        
        .photo-delete {
            position: absolute;
            top: 5px;
            left: 5px;
            background: rgba(231,76,60,0.8);
            border: none;
            color: white;
            padding: 4px 8px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 0.8rem;
            opacity: 0;
            transition: opacity 0.3s;
        }
        
        .photo-card:hover .photo-delete {
            opacity: 1;
        }
        
        .photo-delete:hover {
            background: rgba(231,76,60,1);
        }
        
        .album-empty {
            text-align: center;
            padding: 40px;
            color: #888;
        }
        
        .empty-icon {
            font-size: 3rem;
            margin-bottom: 10px;
        }
        
        .empty-text {
            font-size: 1.1rem;
            margin-bottom: 5px;
        }
        
        .empty-hint {
            font-size: 0.85rem;
            color: #666;
        }
        
        .special-hints {
            margin-top: 20px;
            text-align: left;
            display: inline-block;
        }
        
        .hint-item {
            padding: 8px 12px;
            background: rgba(255,255,255,0.05);
            border-radius: 8px;
            margin-bottom: 8px;
            font-size: 0.85rem;
        }
        
        .album-node-section {
            margin-bottom: 20px;
        }
        
        .node-section-title {
            color: #97bc62;
            margin-bottom: 12px;
            padding-bottom: 8px;
            border-bottom: 1px solid rgba(151,188,98,0.3);
        }
        
        .album-actions {
            padding: 15px 20px;
            border-top: 1px solid rgba(255,255,255,0.1);
            text-align: center;
        }
        
        /* 照片详情弹窗 */
        .photo-detail-modal .modal-content {
            max-width: 500px;
            background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
            border-radius: 16px;
            overflow: hidden;
        }
        
        .photo-detail-image {
            height: 250px;
            background: linear-gradient(180deg, #87ceeb 0%, #c5d1db 100%);
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .detail-emoji {
            font-size: 6rem;
        }
        
        .photo-detail-info {
            padding: 25px;
        }
        
        .photo-detail-info h3 {
            color: #97bc62;
            margin-bottom: 15px;
            font-size: 1.3rem;
        }
        
        .detail-meta {
            display: grid;
            gap: 8px;
            margin-bottom: 15px;
        }
        
        .meta-item {
            color: #aaa;
            font-size: 0.9rem;
        }
        
        .detail-description {
            color: #ccc;
            line-height: 1.7;
            margin-bottom: 15px;
        }
        
        .detail-special {
            display: inline-block;
            background: linear-gradient(135deg, #ffd700, #ffaa00);
            color: #1a1a2e;
            padding: 6px 14px;
            border-radius: 12px;
            font-size: 0.85rem;
            font-weight: bold;
        }
        
        /* 天气动画 */
        @keyframes rain-fall {
            to { transform: translateY(240px); }
        }
        
        @keyframes snow-fall {
            to { transform: translateY(240px) translateX(20px); }
        }
        
        .scenery-rain-drop {
            animation: rain-fall 0.6s linear infinite;
        }
        
        .scenery-snow-flake {
            animation: snow-fall 3s linear infinite;
        }
    `;
    document.head.appendChild(style);
}

// ==================== 初始化 ====================

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    addSceneryStyles();
    // 延迟初始化以确保其他系统已加载
    setTimeout(initScenerySystem, 100);
});

// 导出函数供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initScenerySystem,
        openSceneryView,
        closeSceneryView,
        openAlbum,
        closeAlbum,
        takePhoto,
        deletePhoto
    };
}
