document.addEventListener('DOMContentLoaded', function() {
    initDebateTopic();
    initDebaterSelection();
    initVoiceSamples();
    initVoiceSettings();
    initButtons();
});

/**
 * 初始化辩题显示
 */
function initDebateTopic() {
    // 从URL获取辩题
    const urlParams = new URLSearchParams(window.location.search);
    const topic = urlParams.get('topic');
    
    if (topic) {
        document.getElementById('debate-topic').textContent = decodeURIComponent(topic);
    }
}

/**
 * 初始化辩手选择功能
 */
function initDebaterSelection() {
    // 正方辩手选择
    const leftDebaters = document.querySelectorAll('.left-side .debater-card');
    leftDebaters.forEach(card => {
        card.addEventListener('click', function() {
            // 移除所有正方辩手的选中状态
            leftDebaters.forEach(c => c.classList.remove('selected'));
            // 添加当前辩手的选中状态
            this.classList.add('selected');
        });
    });
    
    // 反方辩手选择
    const rightDebaters = document.querySelectorAll('.right-side .debater-card');
    rightDebaters.forEach(card => {
        card.addEventListener('click', function() {
            // 移除所有反方辩手的选中状态
            rightDebaters.forEach(c => c.classList.remove('selected'));
            // 添加当前辩手的选中状态
            this.classList.add('selected');
        });
    });
}

/**
 * 初始化声音试听功能
 */
function initVoiceSamples() {
    const voicePlayer = document.getElementById('voice-player');
    const playButtons = document.querySelectorAll('.play-voice');
    
    // 声音样本数据
    const voiceSamples = {
        'alpha': {
            text: '作为理性思考者，我将基于事实和逻辑进行分析，提供有力的论证。',
            voice: 'male', // 在实际应用中，这里可以是语音API的声音ID
            pitch: 1.0
        },
        'beta': {
            text: '作为批判思想家，我将深入探究问题本质，提出关键质疑，挑战既有观点。',
            voice: 'male',
            pitch: 0.9
        },
        'gamma': {
            text: '作为创新倡导者，我将带来前瞻性视角，突破传统思维，探索未来可能性。',
            voice: 'male',
            pitch: 1.1
        },
        'delta': {
            text: '作为历史守护者，我将从历史经验中汲取智慧，保持稳健和谨慎的态度。',
            voice: 'male',
            pitch: 0.8
        },
        'epsilon': {
            text: '作为平衡协调者，我将权衡各方观点，寻求共识，追求整体最优解。',
            voice: 'female',
            pitch: 1.0
        },
        'zeta': {
            text: '作为人文关怀者，我将关注人的价值和尊严，强调社会责任和道德伦理。',
            voice: 'female',
            pitch: 1.1
        }
    };
    
    // 为每个试听按钮添加点击事件
    playButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.stopPropagation(); // 防止触发卡片选择
            
            const voiceId = this.getAttribute('data-voice');
            const sample = voiceSamples[voiceId];
            
            if (sample) {
                // 在实际应用中，这里应该调用语音合成API
                // 这里使用Web Speech API作为示例
                if ('speechSynthesis' in window) {
                    // 停止当前正在播放的语音
                    window.speechSynthesis.cancel();
                    
                    const utterance = new SpeechSynthesisUtterance(sample.text);
                    utterance.lang = 'zh-CN';
                    utterance.pitch = sample.pitch;
                    
                    // 选择合适的声音
                    const voices = window.speechSynthesis.getVoices();
                    const chineseVoices = voices.filter(voice => voice.lang.includes('zh'));
                    
                    if (chineseVoices.length > 0) {
                        // 根据性别选择声音
                        const genderVoices = chineseVoices.filter(voice => 
                            sample.voice === 'male' ? voice.name.includes('Male') : voice.name.includes('Female')
                        );
                        
                        if (genderVoices.length > 0) {
                            utterance.voice = genderVoices[0];
                        } else {
                            utterance.voice = chineseVoices[0];
                        }
                    }
                    
                    // 播放语音
                    window.speechSynthesis.speak(utterance);
                    
                    // 更新按钮状态
                    this.innerHTML = '<i class="fas fa-volume-up fa-spin"></i> 播放中...';
                    
                    // 播放结束后恢复按钮状态
                    utterance.onend = () => {
                        this.innerHTML = '<i class="fas fa-volume-up"></i> 试听声音';
                    };
                } else {
                    alert('您的浏览器不支持语音合成功能');
                }
            }
        });
    });
    
    // 确保语音列表已加载
    if ('speechSynthesis' in window) {
        if (window.speechSynthesis.getVoices().length === 0) {
            window.speechSynthesis.onvoiceschanged = function() {
                // 语音列表已加载
            };
        }
    }
}

/**
 * 初始化语音设置功能
 */
function initVoiceSettings() {
    const enableVoice = document.getElementById('enable-voice');
    const voiceSpeed = document.getElementById('voice-speed');
    const voiceVolume = document.getElementById('voice-volume');
    
    // 加载保存的设置
    if (localStorage.getItem('voice-enabled') === 'false') {
        enableVoice.checked = false;
    }
    
    if (localStorage.getItem('voice-speed')) {
        voiceSpeed.value = localStorage.getItem('voice-speed');
    }
    
    if (localStorage.getItem('voice-volume')) {
        voiceVolume.value = localStorage.getItem('voice-volume');
    }
    
    // 保存设置变更
    enableVoice.addEventListener('change', function() {
        localStorage.setItem('voice-enabled', this.checked);
    });
    
    voiceSpeed.addEventListener('change', function() {
        localStorage.setItem('voice-speed', this.value);
    });
    
    voiceVolume.addEventListener('input', function() {
        localStorage.setItem('voice-volume', this.value);
    });
}

/**
 * 初始化按钮功能
 */
function initButtons() {
    const backBtn = document.getElementById('back-btn');
    const startDebateBtn = document.getElementById('start-debate-btn');
    
    // 返回选题页面
    backBtn.addEventListener('click', function() {
        window.location.href = 'topic.html';
    });
    
    // 开始辩论
    startDebateBtn.addEventListener('click', function() {
        // 获取选中的辩手
        const leftDebater = document.querySelector('.left-side .debater-card.selected').getAttribute('data-debater-id');
        const rightDebater = document.querySelector('.right-side .debater-card.selected').getAttribute('data-debater-id');
        
        // 获取辩题
        const topic = document.getElementById('debate-topic').textContent;
        
        // 获取语音设置
        const voiceEnabled = document.getElementById('enable-voice').checked;
        const voiceSpeed = document.getElementById('voice-speed').value;
        const voiceVolume = document.getElementById('voice-volume').value;
        
        // 保存辩手选择和设置
        localStorage.setItem('left-debater', leftDebater);
        localStorage.setItem('right-debater', rightDebater);
        localStorage.setItem('voice-enabled', voiceEnabled);
        localStorage.setItem('voice-speed', voiceSpeed);
        localStorage.setItem('voice-volume', voiceVolume);
        
        // 跳转到辩论页面
        window.location.href = `debate.html?topic=${encodeURIComponent(topic)}&left=${leftDebater}&right=${rightDebater}`;
    });
} 