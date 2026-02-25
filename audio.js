/**
 * 鳌太线模拟器 - 音效系统
 * 使用 Web Audio API 实现轻量级音效
 */

// ==================== 音效系统配置 ====================

const AudioSystem = {
    // 音频上下文
    ctx: null,
    
    // 主音量控制
    masterVolume: 0.7,
    
    // 环境音效音量
    ambientVolume: 0.5,
    
    // 当前播放的环境音效
    currentAmbient: null,
    
    // 音效开关
    enabled: true,
    
    // 初始化状态
    initialized: false,
    
    // ==================== 初始化 ====================
    
    /**
     * 初始化音频系统
     */
    init() {
        if (this.initialized) return;
        
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.initialized = true;
            console.log('音效系统初始化成功');
        } catch (e) {
            console.warn('Web Audio API 不支持，音效系统禁用');
            this.enabled = false;
        }
    },
    
    /**
     * 恢复音频上下文（浏览器自动暂停后）
     */
    resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    },
    
    // ==================== 音效播放工具函数 ====================
    
    /**
     * 播放简单的蜂鸣音
     * @param {number} frequency - 频率(Hz)
     * @param {number} duration - 持续时间(ms)
     * @param {string} type - 波形类型
     * @param {number} volume - 音量(0-1)
     */
    playTone(frequency, duration, type = 'sine', volume = 0.5) {
        if (!this.enabled || !this.ctx) return;
        
        this.resume();
        
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = type;
        osc.frequency.setValueAtTime(frequency, this.ctx.currentTime);
        
        gain.gain.setValueAtTime(volume * this.masterVolume, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration / 1000);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.start(this.ctx.currentTime);
        osc.stop(this.ctx.currentTime + duration / 1000);
    },
    
    /**
     * 播放滑动音（用于UI效果）
     * @param {number} startFreq - 起始频率
     * @param {number} endFreq - 结束频率
     * @param {number} duration - 持续时间(ms)
     * @param {number} volume - 音量
     */
    playSlide(startFreq, endFreq, duration, volume = 0.3) {
        if (!this.enabled || !this.ctx) return;
        
        this.resume();
        
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(startFreq, this.ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(endFreq, this.ctx.currentTime + duration / 1000);
        
        gain.gain.setValueAtTime(volume * this.masterVolume, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + duration / 1000);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.start(this.ctx.currentTime);
        osc.stop(this.ctx.currentTime + duration / 1000);
    },
    
    /**
     * 播放噪声（用于环境音效）
     * @param {number} duration - 持续时间(ms)
     * @param {number} volume - 音量
     * @param {string} filterType - 滤波器类型
     * @param {number} frequency - 滤波频率
     */
    playNoise(duration, volume = 0.3, filterType = 'lowpass', frequency = 1000) {
        if (!this.enabled || !this.ctx) return;
        
        this.resume();
        
        const bufferSize = this.ctx.sampleRate * (duration / 1000);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        
        const filter = this.ctx.createBiquadFilter();
        filter.type = filterType;
        filter.frequency.value = frequency;
        
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(volume * this.ambientVolume * this.masterVolume, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration / 1000);
        
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        
        noise.start(this.ctx.currentTime);
        noise.stop(this.ctx.currentTime + duration / 1000);
    },
    
    // ==================== UI音效 ====================
    
    /**
     * 按钮点击音效
     */
    playButtonClick() {
        this.playTone(800, 80, 'sine', 0.3);
        setTimeout(() => this.playTone(1200, 60, 'sine', 0.2), 40);
    },
    
    /**
     * 弹窗打开音效
     */
    playModalOpen() {
        this.playSlide(400, 600, 150, 0.25);
    },
    
    /**
     * 弹窗关闭音效
     */
    playModalClose() {
        this.playSlide(600, 400, 150, 0.25);
    },
    
    /**
     * 状态变化提示音
     */
    playStatusChange() {
        this.playTone(1000, 100, 'sine', 0.2);
        setTimeout(() => this.playTone(1500, 80, 'sine', 0.15), 50);
    },
    
    /**
     * 错误/警告提示音
     */
    playError() {
        this.playTone(200, 200, 'sawtooth', 0.3);
        setTimeout(() => this.playTone(150, 200, 'sawtooth', 0.3), 100);
    },
    
    // ==================== 动作音效 ====================
    
    /**
     * 脚步声（根据地形和天气调整）
     * @param {string} terrain - 地形类型
     * @param {string} weather - 天气类型
     */
    playFootstep(terrain = 'normal', weather = 'sunny') {
        if (!this.enabled || !this.ctx) return;
        
        this.resume();
        
        let frequency = 150;
        let volume = 0.2;
        let duration = 100;
        
        // 根据地形调整
        switch (terrain) {
            case 'rock': // 岩石
                frequency = 300;
                volume = 0.25;
                break;
            case 'snow': // 雪地
                frequency = 100;
                volume = 0.15;
                duration = 150;
                break;
            case 'mud': // 泥泞
                frequency = 80;
                volume = 0.2;
                duration = 120;
                break;
            default: // 普通山路
                frequency = 150;
                volume = 0.2;
        }
        
        // 恶劣天气增加沉闷感
        if (weather === 'heavy_rain' || weather === 'snowstorm') {
            frequency *= 0.8;
            volume *= 0.9;
        }
        
        // 使用噪声模拟脚步声
        this.playNoise(duration, volume, 'lowpass', frequency * 3);
        
        // 添加低频冲击
        setTimeout(() => {
            this.playTone(frequency, duration, 'triangle', volume * 0.5);
        }, 10);
    },
    
    /**
     * 连续脚步声（移动时）
     * @param {number} steps - 步数
     * @param {string} weather - 天气
     */
    playFootsteps(steps = 3, weather = 'sunny') {
        for (let i = 0; i < steps; i++) {
            setTimeout(() => {
                this.playFootstep('normal', weather);
            }, i * 300);
        }
    },
    
    /**
     * 休息时的呼吸声
     * @param {number} intensity - 呼吸强度(1-3)
     */
    playBreathing(intensity = 1) {
        if (!this.enabled || !this.ctx) return;
        
        this.resume();
        
        const duration = 2000 * intensity;
        const volume = 0.15 * intensity;
        
        // 创建呼吸节奏
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();
        
        osc.type = 'sine';
        filter.type = 'lowpass';
        filter.frequency.value = 400;
        
        // 呼吸频率
        const breathRate = 0.5 / intensity; // Hz
        
        gain.gain.setValueAtTime(0, this.ctx.currentTime);
        
        // 模拟几次呼吸
        for (let i = 0; i < 3; i++) {
            const t = this.ctx.currentTime + i * (2 / breathRate);
            gain.gain.linearRampToValueAtTime(volume * this.masterVolume, t + 0.3);
            gain.gain.linearRampToValueAtTime(0, t + 1);
        }
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.frequency.setValueAtTime(200, this.ctx.currentTime);
        osc.start(this.ctx.currentTime);
        osc.stop(this.ctx.currentTime + duration / 1000);
    },
    
    /**
     * 吃东西音效
     */
    playEating() {
        if (!this.enabled || !this.ctx) return;
        
        this.resume();
        
        // 咀嚼声 - 短促的噪声
        for (let i = 0; i < 4; i++) {
            setTimeout(() => {
                this.playNoise(100, 0.15, 'bandpass', 800);
            }, i * 200);
        }
        
        // 吞咽声
        setTimeout(() => {
            this.playTone(150, 150, 'sine', 0.2);
        }, 900);
    },
    
    /**
     * 喝水音效
     */
    playDrinking() {
        if (!this.enabled || !this.ctx) return;
        
        this.resume();
        
        // 倒水/喝水声
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                this.playNoise(200, 0.12, 'lowpass', 600);
            }, i * 250);
        }
        
        // 喝完的"啊"声
        setTimeout(() => {
            this.playSlide(300, 250, 300, 0.15);
        }, 800);
    },
    
    /**
     * 装备使用音效
     */
    playEquipSound() {
        this.playTone(600, 100, 'sine', 0.25);
        setTimeout(() => this.playTone(800, 150, 'sine', 0.2), 80);
    },
    
    // ==================== 环境音效 ====================
    
    /**
     * 风声（根据强度）
     * @param {number} intensity - 风强度(0-1)
     * @param {number} duration - 持续时间(ms)
     */
    playWind(intensity = 0.5, duration = 3000) {
        if (!this.enabled || !this.ctx) return;
        
        this.resume();
        
        const bufferSize = this.ctx.sampleRate * (duration / 1000);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        
        // 生成风声 - 带调制的噪声
        for (let i = 0; i < bufferSize; i++) {
            const t = i / this.ctx.sampleRate;
            // 低频调制模拟风的起伏
            const modulation = Math.sin(2 * Math.PI * 0.5 * t) * 0.5 + 0.5;
            data[i] = (Math.random() * 2 - 1) * modulation * intensity;
        }
        
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 300 + intensity * 700;
        filter.Q.value = 0.5;
        
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(this.ambientVolume * intensity * this.masterVolume, this.ctx.currentTime + 0.5);
        gain.gain.setValueAtTime(this.ambientVolume * intensity * this.masterVolume, this.ctx.currentTime + duration / 1000 - 0.5);
        gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + duration / 1000);
        
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        
        noise.start(this.ctx.currentTime);
        noise.stop(this.ctx.currentTime + duration / 1000);
    },
    
    /**
     * 雨声
     * @param {number} intensity - 雨强度(0-1)
     * @param {number} duration - 持续时间(ms)
     */
    playRain(intensity = 0.5, duration = 3000) {
        if (!this.enabled || !this.ctx) return;
        
        this.resume();
        
        const bufferSize = this.ctx.sampleRate * (duration / 1000);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        
        // 生成雨声
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * intensity;
        }
        
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 800 + intensity * 2000;
        
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(this.ambientVolume * intensity * 0.6 * this.masterVolume, this.ctx.currentTime);
        
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        
        noise.start(this.ctx.currentTime);
        noise.stop(this.ctx.currentTime + duration / 1000);
    },
    
    /**
     * 雪声（轻柔的沙沙声）
     * @param {number} duration - 持续时间(ms)
     */
    playSnow(duration = 3000) {
        if (!this.enabled || !this.ctx) return;
        
        this.resume();
        
        const bufferSize = this.ctx.sampleRate * (duration / 1000);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        
        // 生成柔和的沙沙声
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * 0.3;
        }
        
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 400;
        
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(this.ambientVolume * 0.4 * this.masterVolume, this.ctx.currentTime + 0.5);
        gain.gain.setValueAtTime(this.ambientVolume * 0.4 * this.masterVolume, this.ctx.currentTime + duration / 1000 - 0.5);
        gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + duration / 1000);
        
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        
        noise.start(this.ctx.currentTime);
        noise.stop(this.ctx.currentTime + duration / 1000);
    },
    
    /**
     * 鸟鸣（晴天时）
     */
    playBirdChirp() {
        if (!this.enabled || !this.ctx) return;
        
        this.resume();
        
        // 随机鸟鸣参数
        const baseFreq = 2000 + Math.random() * 1500;
        const chirpCount = 2 + Math.floor(Math.random() * 3);
        
        for (let i = 0; i < chirpCount; i++) {
            setTimeout(() => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                
                osc.type = 'sine';
                osc.frequency.setValueAtTime(baseFreq, this.ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, this.ctx.currentTime + 0.05);
                
                gain.gain.setValueAtTime(0.1 * this.ambientVolume * this.masterVolume, this.ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
                
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                
                osc.start(this.ctx.currentTime);
                osc.stop(this.ctx.currentTime + 0.1);
            }, i * 150);
        }
    },
    
    /**
     * 根据天气播放环境音效
     * @param {string} weatherId - 天气ID
     */
    playWeatherAmbient(weatherId) {
        // 停止当前环境音效
        this.stopAmbient();
        
        switch (weatherId) {
            case 'sunny':
                // 晴天偶尔有鸟鸣
                this.scheduleBirdChirps();
                break;
            case 'cloudy':
                // 多云有轻微风声
                this.playWind(0.3, 4000);
                break;
            case 'light_rain':
                // 小雨声
                this.playRain(0.4, 5000);
                break;
            case 'heavy_rain':
                // 大雨声
                this.playRain(0.8, 5000);
                break;
            case 'fog':
                // 雾天有轻微风声
                this.playWind(0.2, 4000);
                break;
            case 'snowstorm':
                // 暴风雪
                this.playWind(0.9, 5000);
                setTimeout(() => this.playSnow(4000), 500);
                break;
        }
    },
    
    /**
     * 安排鸟鸣（定时播放）
     */
    scheduleBirdChirps() {
        if (!this.enabled) return;
        
        // 随机播放鸟鸣
        const scheduleNext = () => {
            if (!this.enabled) return;
            const delay = 3000 + Math.random() * 7000;
            setTimeout(() => {
                if (Math.random() < 0.7) {
                    this.playBirdChirp();
                }
                scheduleNext();
            }, delay);
        };
        
        scheduleNext();
    },
    
    /**
     * 停止环境音效
     */
    stopAmbient() {
        // 环境音效会自动结束，这里可以添加额外的清理逻辑
        this.currentAmbient = null;
    },
    
    // ==================== 事件音效 ====================
    
    /**
     * 成就解锁音效
     */
    playAchievement() {
        // 欢快的上升音阶
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        notes.forEach((freq, i) => {
            setTimeout(() => {
                this.playTone(freq, 150, 'sine', 0.3);
            }, i * 100);
        });
    },
    
    /**
     * 危险警告音效
     */
    playWarning() {
        // 警报声
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                this.playTone(800, 200, 'sawtooth', 0.3);
                setTimeout(() => {
                    this.playTone(600, 200, 'sawtooth', 0.3);
                }, 200);
            }, i * 500);
        }
    },
    
    /**
     * 成功音效
     */
    playSuccess() {
        this.playTone(523.25, 100, 'sine', 0.3);
        setTimeout(() => this.playTone(659.25, 100, 'sine', 0.3), 100);
        setTimeout(() => this.playTone(783.99, 200, 'sine', 0.3), 200);
    },
    
    /**
     * 失败音效
     */
    playFailure() {
        this.playTone(300, 200, 'sawtooth', 0.3);
        setTimeout(() => this.playTone(250, 300, 'sawtooth', 0.3), 200);
    },
    
    /**
     * 游戏胜利音效
     */
    playVictory() {
        // 胜利号角
        const melody = [
            { f: 523.25, d: 200 },
            { f: 523.25, d: 200 },
            { f: 523.25, d: 200 },
            { f: 659.25, d: 400 },
            { f: 783.99, d: 200 },
            { f: 659.25, d: 400 }
        ];
        
        let time = 0;
        melody.forEach(note => {
            setTimeout(() => {
                this.playTone(note.f, note.d, 'sine', 0.4);
            }, time);
            time += note.d;
        });
    },
    
    /**
     * 游戏结束音效
     */
    playGameOver() {
        // 悲伤的下降音阶
        const notes = [392.00, 349.23, 311.13, 293.66]; // G4, F4, Eb4, D4
        notes.forEach((freq, i) => {
            setTimeout(() => {
                this.playTone(freq, 300, 'sine', 0.3);
            }, i * 300);
        });
    },
    
    /**
     * 获得物品音效
     */
    playItemGet() {
        this.playTone(880, 80, 'sine', 0.25);
        setTimeout(() => this.playTone(1100, 120, 'sine', 0.2), 80);
    },
    
    /**
     * 资源减少警告
     */
    playResourceLow() {
        this.playTone(400, 150, 'sine', 0.2);
        setTimeout(() => this.playTone(350, 150, 'sine', 0.2), 150);
    },
    
    // ==================== 音量控制 ====================
    
    /**
     * 设置主音量
     * @param {number} volume - 音量(0-1)
     */
    setMasterVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
    },
    
    /**
     * 设置环境音效音量
     * @param {number} volume - 音量(0-1)
     */
    setAmbientVolume(volume) {
        this.ambientVolume = Math.max(0, Math.min(1, volume));
    },
    
    /**
     * 开关音效
     * @param {boolean} enabled - 是否启用
     */
    toggle(enabled) {
        this.enabled = enabled;
    },
    
    /**
     * 静音/取消静音
     */
    mute() {
        this.enabled = !this.enabled;
        return this.enabled;
    }
};

// ==================== 导出音效系统 ====================

// 在模块系统中导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AudioSystem;
}
