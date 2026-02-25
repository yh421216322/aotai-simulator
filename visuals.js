/**
 * 鳌太线模拟器 - 视觉增强系统
 * 包含节点实景、天气效果、实景查看功能
 */

// ==================== 节点实景数据 ====================

const NODE_SCENERY = {
    0: {
        name: "塘口村",
        emojiScene: "🏘️🌲🏔️",
        description: "秦岭脚下的宁静村庄，鳌太穿越的起点。村口立着一块石碑，上面写着'鳌太线徒步起点'。清晨的薄雾笼罩着远山，村民们已经开始了一天的劳作。",
        features: ["起点石碑", "农家小院", "补给商店", "山间晨雾"],
        atmosphere: "宁静祥和，充满期待",
        specialEvent: "村民会为你送上祝福"
    },
    1: {
        name: "火烧坡",
        emojiScene: "🔥⛰️🌿",
        description: "陡峭的山坡上留有明显的火烧痕迹，枯黑的树干与新生绿意形成鲜明对比。这里曾是山火肆虐的地方，如今野花点缀其间，展现着生命的顽强。",
        features: ["火烧痕迹", "陡峭山坡", "野花点缀", "开阔视野"],
        atmosphere: "苍凉中带着生机",
        specialEvent: "发现山火后重生的野花"
    },
    2: {
        name: "2900营地",
        emojiScene: "⛺🌲✨",
        description: "海拔2900米的理想营地，四周被冷杉环绕。夜幕降临，满天繁星仿佛触手可及。帐篷点缀其间，篝火映照着徒步者们疲惫却满足的脸庞。",
        features: ["平坦营地", "冷杉林", "星空夜景", "山泉水源"],
        atmosphere: "静谧安详，星空璀璨",
        specialEvent: "流星雨划过夜空"
    },
    3: {
        name: "鳌山大梁",
        emojiScene: "🏔️☁️🌾",
        description: "行走在鳌山主脊之上，两侧是陡峭的悬崖。高山草甸在脚下铺展，云海在身旁翻涌。这里是鳌太线最壮丽的段落，也是最具挑战的路段。",
        features: ["高山草甸", "云海翻涌", "悬崖峭壁", "山脊行走"],
        atmosphere: "壮阔震撼，危机四伏",
        specialEvent: "云海突然散开，露出万丈深渊"
    },
    4: {
        name: "导航架",
        emojiScene: "🗼📍🌫️",
        description: "标志性的导航架矗立在山顶，是鳌太线最著名的地标。这座金属架是救援导航的重要标志，也是每一位穿越者必打卡的地点。周围常有大雾弥漫。",
        features: ["金属导航架", "地标打卡", "360度观景", "常年大雾"],
        atmosphere: "神秘莫测，标志性地点",
        specialEvent: "在导航架下发现前人留下的纪念牌"
    },
    5: {
        name: "药王庙",
        emojiScene: "⛩️🗿🍂",
        description: "废弃的药王庙供奉着药王孙思邈，斑驳的墙壁诉说着岁月沧桑。石碑上刻着的字迹已经模糊，但香火痕迹显示仍有人前来祭拜。这里是难得的避风处。",
        features: ["废弃庙宇", "药王石碑", "避风处", "历史痕迹"],
        atmosphere: "古朴神秘，庄严肃穆",
        specialEvent: "发现古老的药材图谱"
    },
    6: {
        name: "麦秸岭",
        emojiScene: "🧗‍♂️⛰️🦅",
        description: "陡峭的岩壁如同麦秸般耸立，需要手脚并用才能攀爬。这里是鳌太线最险峻的路段之一，岩石裸露，少有植被。抬头可见雄鹰在头顶盘旋。",
        features: ["陡峭岩壁", "需要攀爬", "裸露岩石", "雄鹰盘旋"],
        atmosphere: "险峻刺激，肾上腺素飙升",
        specialEvent: "发现岩壁上的古老岩画"
    },
    7: {
        name: "水窝子营地",
        emojiScene: "💧⛺🏕️",
        description: "鳌太线上最优质的营地，水源充足且清澈甘甜。周围地势平坦，避风良好。傍晚时分，夕阳将整片营地染成金色，是全程最美的露营地点。",
        features: ["优质水源", "平坦营地", "避风位置", "金色夕阳"],
        atmosphere: "舒适惬意，补给充足",
        specialEvent: "发现温泉眼，可以泡脚放松"
    },
    8: {
        name: "太白山景区",
        emojiScene: "🏁🎉🏔️",
        description: "终点！太白山景区的入口就在前方。游客中心的建筑清晰可见，你的鳌太穿越之旅即将画上圆满的句号。回首来路，成就感油然而生。",
        features: ["游客中心", "终点标志", "完善设施", "胜利在望"],
        atmosphere: "喜悦激动，成就感满满",
        specialEvent: "获得穿越证书，合影留念"
    }
};

// ==================== 天气视觉配置 ====================

const WEATHER_VISUALS = {
    sunny: {
        name: "晴天",
        icon: "☀️",
        bgGradient: "linear-gradient(180deg, #4a90d9 0%, #87ceeb 50%, #e8f4f8 100%)",
        animation: "sunshine",
        particleEffect: null,
        visibility: "excellent",
        moodBonus: 5
    },
    cloudy: {
        name: "多云",
        icon: "☁️",
        bgGradient: "linear-gradient(180deg, #5a6c7d 0%, #8fa3b8 50%, #c5d1db 100%)",
        animation: "clouds",
        particleEffect: "cloud",
        visibility: "good",
        moodBonus: 0
    },
    light_rain: {
        name: "小雨",
        icon: "🌦️",
        bgGradient: "linear-gradient(180deg, #3d4f5f 0%, #5a6c7d 50%, #7a8fa3 100%)",
        animation: "rain",
        particleEffect: "rain-light",
        visibility: "normal",
        moodBonus: -2
    },
    heavy_rain: {
        name: "大雨",
        icon: "🌧️",
        bgGradient: "linear-gradient(180deg, #2a3a4a 0%, #3d4f5f 50%, #4a5a6a 100%)",
        animation: "rain-heavy",
        particleEffect: "rain-heavy",
        visibility: "poor",
        moodBonus: -5
    },
    fog: {
        name: "大雾",
        icon: "🌫️",
        bgGradient: "linear-gradient(180deg, #6a7a8a 0%, #8a9aaa 50%, #aabaca 100%)",
        animation: "fog",
        particleEffect: "fog",
        visibility: "very-poor",
        moodBonus: -3
    },
    snowstorm: {
        name: "暴风雪",
        icon: "❄️",
        bgGradient: "linear-gradient(180deg, #4a5a6a 0%, #6a7a8a 50%, #8a9aaa 100%)",
        animation: "snow",
        particleEffect: "snow",
        visibility: "none",
        moodBonus: -8
    }
};

// ==================== 实景查看系统 ====================

let sceneryViewActive = false;

/**
 * 初始化视觉系统
 */
function initVisualSystem() {
    createWeatherEffects();
    createSceneryModal();
    addSceneryViewButton();
}

/**
 * 创建天气效果容器
 */
function createWeatherEffects() {
    // 创建天气粒子容器
    const particleContainer = document.createElement('div');
    particleContainer.id = 'weather-particles';
    particleContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 5;
        overflow: hidden;
    `;
    document.body.appendChild(particleContainer);
    
    // 创建天气遮罩层
    const weatherOverlay = document.createElement('div');
    weatherOverlay.id = 'weather-overlay';
    weatherOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 4;
        transition: all 0.5s ease;
    `;
    document.body.appendChild(weatherOverlay);
}

/**
 * 创建实景查看弹窗
 */
function createSceneryModal() {
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
                <div class="scene-effects" id="scene-effects"></div>
            </div>
            <div class="scenery-description" id="scenery-description"></div>
            <div class="scenery-features" id="scenery-features"></div>
            <div class="scenery-atmosphere" id="scenery-atmosphere"></div>
            <div class="scenery-actions">
                <button id="btn-take-photo" class="btn btn-primary">📸 拍照留念</button>
                <button id="btn-explore" class="btn btn-success">🔍 仔细探索</button>
                <button class="btn btn-secondary" onclick="closeSceneryView()">返回</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    // 添加事件监听
    document.getElementById('btn-take-photo').addEventListener('click', takePhoto);
    document.getElementById('btn-explore').addEventListener('click', exploreScenery);
}

/**
 * 添加实景查看按钮到游戏界面
 */
function addSceneryViewButton() {
    const actionPanel = document.querySelector('.action-panel');
    if (actionPanel) {
        const sceneryBtn = document.createElement('button');
        sceneryBtn.id = 'btn-scenery';
        sceneryBtn.className = 'btn btn-info';
        sceneryBtn.innerHTML = '📷 实景';
        sceneryBtn.addEventListener('click', openSceneryView);
        actionPanel.appendChild(sceneryBtn);
    }
}

/**
 * 打开实景查看
 */
function openSceneryView() {
    if (sceneryViewActive) return;
    
    const nodeId = gameState.currentNode;
    const scenery = NODE_SCENERY[nodeId];
    
    if (!scenery) return;
    
    sceneryViewActive = true;
    
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
    
    // 添加天气效果到场景
    applyWeatherToScenery();
    
    // 显示弹窗
    document.getElementById('scenery-modal').classList.add('active');
    
    // 消耗少量时间
    gameState.stamina = Math.max(0, gameState.stamina - 2);
    
    logEvent(`欣赏了${scenery.name}的实景`);
    updateUI();
}

/**
 * 关闭实景查看
 */
function closeSceneryView() {
    document.getElementById('scenery-modal').classList.remove('active');
    sceneryViewActive = false;
}

/**
 * 拍照留念
 */
function takePhoto() {
    const nodeId = gameState.currentNode;
    const scenery = NODE_SCENERY[nodeId];
    
    // 恢复心情值
    const moodRecovery = 15;
    gameState.mood = Math.min(100, gameState.mood + moodRecovery);
    
    // 消耗体力
    gameState.stamina = Math.max(0, gameState.stamina - 3);
    
    logEvent(`在${scenery.name}拍照留念，心情大好！(+${moodRecovery}心情)`);
    
    // 触发特殊事件概率
    if (Math.random() < 0.3) {
        setTimeout(() => {
            triggerSceneryEvent(nodeId);
        }, 500);
    }
    
    closeSceneryView();
    updateUI();
}

/**
 * 仔细探索
 */
function exploreScenery() {
    const nodeId = gameState.currentNode;
    const scenery = NODE_SCENERY[nodeId];
    
    // 消耗更多体力和时间
    gameState.stamina = Math.max(0, gameState.stamina - 8);
    
    // 可能发现物品或触发事件
    const rand = Math.random();
    
    if (rand < 0.2) {
        // 发现补给
        const foodGain = 10;
        const waterGain = 10;
        gameState.food = Math.min(100, gameState.food + foodGain);
        gameState.water = Math.min(100, gameState.water + waterGain);
        logEvent(`在${scenery.name}探索时发现了补给！(+${foodGain}食物, +${waterGain}水)`);
    } else if (rand < 0.4) {
        // 触发特殊事件
        triggerSceneryEvent(nodeId);
    } else {
        // 普通探索结果
        const moodGain = 5;
        gameState.mood = Math.min(100, gameState.mood + moodGain);
        logEvent(`仔细探索了${scenery.name}，对这里有了更深的了解。(+${moodGain}心情)`);
    }
    
    closeSceneryView();
    updateUI();
}

/**
 * 触发节点特殊事件
 */
function triggerSceneryEvent(nodeId) {
    const scenery = NODE_SCENERY[nodeId];
    if (!scenery || !scenery.specialEvent) return;
    
    logEvent(`🎉 特殊事件：${scenery.specialEvent}`);
    
    // 根据节点给予不同奖励
    switch(nodeId) {
        case 0: // 塘口村
            gameState.food = Math.min(100, gameState.food + 15);
            gameState.water = Math.min(100, gameState.water + 15);
            showNotification("村民赠送了食物和水！", "success");
            break;
        case 2: // 2900营地
        case 7: // 水窝子营地
            gameState.stamina = Math.min(100, gameState.stamina + 20);
            gameState.mood = Math.min(100, gameState.mood + 15);
            showNotification("营地休息效果加倍！", "success");
            break;
        case 3: // 鳌山大梁
            gameState.mood = Math.min(100, gameState.mood + 25);
            showNotification("云海日出，终生难忘！", "success");
            break;
        case 4: // 导航架
            gameState.mood = Math.min(100, gameState.mood + 20);
            showNotification("打卡成功！留下珍贵回忆", "success");
            break;
        case 5: // 药王庙
            gameState.stamina = Math.min(100, gameState.stamina + 15);
            showNotification("药王庇佑，体力恢复！", "success");
            break;
        case 8: // 太白山景区
            gameState.mood = Math.min(100, gameState.mood + 30);
            showNotification("穿越成功！获得荣誉证书！", "success");
            break;
        default:
            gameState.mood = Math.min(100, gameState.mood + 10);
    }
}

/**
 * 更新天气视觉效果
 */
function updateWeatherVisuals() {
    const weatherId = gameState.weather ? gameState.weather.id : 'sunny';
    const visual = WEATHER_VISUALS[weatherId];
    
    if (!visual) return;
    
    // 更新背景渐变
    const overlay = document.getElementById('weather-overlay');
    if (overlay) {
        overlay.style.background = visual.bgGradient;
        overlay.style.opacity = '0.3';
    }
    
    // 更新粒子效果
    updateParticleEffect(visual.particleEffect);
    
    // 更新游戏容器背景
    const gameContainer = document.getElementById('game-container');
    if (gameContainer) {
        gameContainer.style.background = `linear-gradient(135deg, rgba(26,26,46,0.9) 0%, rgba(22,33,62,0.9) 100%), ${visual.bgGradient}`;
        gameContainer.style.backgroundBlendMode = 'overlay';
    }
}

/**
 * 更新粒子效果
 */
function updateParticleEffect(effectType) {
    const container = document.getElementById('weather-particles');
    if (!container) return;
    
    // 清除现有粒子
    container.innerHTML = '';
    
    if (!effectType) return;
    
    // 根据效果类型创建粒子
    switch(effectType) {
        case 'rain-light':
            createRainParticles(container, 50, 'light');
            break;
        case 'rain-heavy':
            createRainParticles(container, 150, 'heavy');
            break;
        case 'snow':
            createSnowParticles(container, 80);
            break;
        case 'fog':
            createFogEffect(container);
            break;
        case 'cloud':
            createCloudEffect(container);
            break;
    }
}

/**
 * 创建雨滴粒子
 */
function createRainParticles(container, count, intensity) {
    for (let i = 0; i < count; i++) {
        const drop = document.createElement('div');
        drop.className = `rain-drop ${intensity}`;
        drop.style.cssText = `
            position: absolute;
            width: ${intensity === 'heavy' ? '3px' : '2px'};
            height: ${intensity === 'heavy' ? '20px' : '15px'};
            background: linear-gradient(to bottom, transparent, rgba(174,194,224,0.6));
            left: ${Math.random() * 100}%;
            top: -20px;
            animation: rain-fall ${0.5 + Math.random() * 0.5}s linear infinite;
            animation-delay: ${Math.random() * 2}s;
        `;
        container.appendChild(drop);
    }
}

/**
 * 创建雪花粒子
 */
function createSnowParticles(container, count) {
    for (let i = 0; i < count; i++) {
        const flake = document.createElement('div');
        flake.className = 'snow-flake';
        const size = 3 + Math.random() * 5;
        flake.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            background: rgba(255,255,255,0.8);
            border-radius: 50%;
            left: ${Math.random() * 100}%;
            top: -10px;
            animation: snow-fall ${3 + Math.random() * 4}s linear infinite;
            animation-delay: ${Math.random() * 5}s;
            filter: blur(${Math.random() > 0.5 ? '1px' : '0px'});
        `;
        container.appendChild(flake);
    }
}

/**
 * 创建雾效果
 */
function createFogEffect(container) {
    for (let i = 0; i < 5; i++) {
        const fog = document.createElement('div');
        fog.className = 'fog-layer';
        fog.style.cssText = `
            position: absolute;
            width: 200%;
            height: 100px;
            background: linear-gradient(to right, 
                transparent, 
                rgba(200,210,220,0.3), 
                rgba(200,210,220,0.5), 
                rgba(200,210,220,0.3), 
                transparent);
            left: -50%;
            top: ${20 + i * 15}%;
            animation: fog-move ${20 + i * 5}s linear infinite;
            animation-delay: ${i * 2}s;
        `;
        container.appendChild(fog);
    }
}

/**
 * 创建云效果
 */
function createCloudEffect(container) {
    for (let i = 0; i < 3; i++) {
        const cloud = document.createElement('div');
        cloud.className = 'cloud-layer';
        cloud.innerHTML = '☁️';
        cloud.style.cssText = `
            position: absolute;
            font-size: ${80 + Math.random() * 60}px;
            opacity: 0.4;
            left: ${Math.random() * 100}%;
            top: ${5 + Math.random() * 20}%;
            animation: cloud-float ${30 + Math.random() * 20}s linear infinite;
            animation-delay: ${i * 5}s;
        `;
        container.appendChild(cloud);
    }
}

/**
 * 应用天气效果到实景
 */
function applyWeatherToScenery() {
    const sceneEffects = document.getElementById('scene-effects');
    if (!sceneEffects) return;
    
    sceneEffects.innerHTML = '';
    
    const weatherId = gameState.weather ? gameState.weather.id : 'sunny';
    const visual = WEATHER_VISUALS[weatherId];
    
    if (visual && visual.particleEffect) {
        // 在实景中复制天气效果
        switch(visual.particleEffect) {
            case 'rain-light':
            case 'rain-heavy':
                createRainParticles(sceneEffects, 30, 'light');
                break;
            case 'snow':
                createSnowParticles(sceneEffects, 40);
                break;
            case 'fog':
                sceneEffects.style.cssText = `
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(200,210,220,0.3);
                    backdrop-filter: blur(2px);
                `;
                break;
        }
    }
}

/**
 * 显示通知
 */
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        padding: 12px 24px;
        background: ${type === 'success' ? 'rgba(39,174,96,0.9)' : 'rgba(52,152,219,0.9)'};
        color: white;
        border-radius: 8px;
        z-index: 10000;
        animation: notification-slide 0.3s ease;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'notification-fade 0.3s ease forwards';
        setTimeout(() => notification.remove(), 300);
    }, 2500);
}

// ==================== 状态变化视觉反馈 ====================

/**
 * 显示资源变化动画
 */
function showResourceChange(type, amount) {
    const bar = document.getElementById(`${type}-bar`);
    if (!bar) return;
    
    const indicator = document.createElement('div');
    indicator.className = 'resource-change-indicator';
    indicator.textContent = amount > 0 ? `+${amount}` : `${amount}`;
    indicator.style.cssText = `
        position: absolute;
        right: -40px;
        top: 50%;
        transform: translateY(-50%);
        color: ${amount > 0 ? '#27ae60' : '#e74c3c'};
        font-weight: bold;
        font-size: 0.9rem;
        animation: indicator-float 1s ease forwards;
        pointer-events: none;
    `;
    
    bar.parentElement.style.position = 'relative';
    bar.parentElement.appendChild(indicator);
    
    setTimeout(() => indicator.remove(), 1000);
}

/**
 * 添加CSS动画样式
 */
function addVisualStyles() {
    const style = document.createElement('style');
    style.textContent = `
        /* 天气动画 */
        @keyframes rain-fall {
            to {
                transform: translateY(100vh);
            }
        }
        
        @keyframes snow-fall {
            to {
                transform: translateY(100vh) translateX(20px);
            }
        }
        
        @keyframes fog-move {
            0% { transform: translateX(-50%); }
            100% { transform: translateX(50%); }
        }
        
        @keyframes cloud-float {
            0% { transform: translateX(-100px); }
            100% { transform: translateX(calc(100vw + 100px)); }
        }
        
        /* 通知动画 */
        @keyframes notification-slide {
            from {
                opacity: 0;
                transform: translateX(-50%) translateY(-20px);
            }
            to {
                opacity: 1;
                transform: translateX(-50%) translateY(0);
            }
        }
        
        @keyframes notification-fade {
            to {
                opacity: 0;
                transform: translateX(-50%) translateY(-20px);
            }
        }
        
        /* 资源变化指示器动画 */
        @keyframes indicator-float {
            0% {
                opacity: 1;
                transform: translateY(-50%) translateX(0);
            }
            100% {
                opacity: 0;
                transform: translateY(-100%) translateX(0);
            }
        }
        
        /* 实景弹窗样式 */
        .scenery-content {
            max-width: 600px;
            padding: 0;
            overflow: hidden;
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
        }
        
        .btn-close {
            background: none;
            border: none;
            color: white;
            font-size: 1.5rem;
            cursor: pointer;
            padding: 0;
            width: 30px;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .scenery-scene {
            position: relative;
            height: 200px;
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
        }
        
        @keyframes scene-float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
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
        
        .scenery-description {
            padding: 20px;
            line-height: 1.8;
            color: #eaeaea;
            font-size: 0.95rem;
        }
        
        .scenery-features {
            padding: 0 20px 15px;
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
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
            padding: 0 20px 15px;
            color: #a0a0a0;
            font-size: 0.9rem;
        }
        
        .atmosphere-label {
            color: #d4a574;
        }
        
        .scenery-actions {
            padding: 15px 20px 20px;
            display: flex;
            gap: 10px;
            justify-content: center;
            flex-wrap: wrap;
        }
        
        /* 天气图标动画 */
        .weather-icon-anim {
            display: inline-block;
            animation: weather-bounce 2s ease-in-out infinite;
        }
        
        @keyframes weather-bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-3px); }
        }
        
        /* 地图节点增强 */
        .map-node {
            position: relative;
            overflow: hidden;
        }
        
        .map-node.current::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(90deg, transparent, rgba(151,188,98,0.2), transparent);
            animation: node-glow 2s ease-in-out infinite;
        }
        
        @keyframes node-glow {
            0%, 100% { opacity: 0.5; }
            50% { opacity: 1; }
        }
        
        /* 资源条过渡效果 */
        .resource-bar {
            position: relative;
            overflow: visible;
        }
        
        .bar-fill {
            transition: width 0.5s ease, background-color 0.3s ease;
        }
        
        /* 按钮悬停效果增强 */
        .btn {
            position: relative;
            overflow: hidden;
        }
        
        .btn::after {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            width: 0;
            height: 0;
            background: rgba(255,255,255,0.2);
            border-radius: 50%;
            transform: translate(-50%, -50%);
            transition: width 0.3s, height 0.3s;
        }
        
        .btn:active::after {
            width: 200px;
            height: 200px;
        }
    `;
    document.head.appendChild(style);
}

// ==================== 初始化 ====================

// 页面加载完成后初始化视觉系统
document.addEventListener('DOMContentLoaded', () => {
    addVisualStyles();
    initVisualSystem();
});
