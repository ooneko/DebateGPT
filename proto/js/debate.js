document.addEventListener('DOMContentLoaded', function() {
    // 初始化辩论主题
    initDebateTopic();
    
    // 初始化辩手信息
    initDebaters();
    
    // 初始化轮次切换功能
    initRoundNavigation();
    
    // 初始化进度条
    updateProgressBar(1);
    
    // 初始化语音控制
    initVoiceControls();
    
    // 初始化按钮事件
    initButtonEvents();
});

// 全局变量
let currentRound = 1;
let isVoicePlaying = false;
let currentUtterance = null;
let speechQueue = [];

// 从URL获取并设置辩论主题
function initDebateTopic() {
    const urlParams = new URLSearchParams(window.location.search);
    const topic = urlParams.get('topic');
    
    if (topic) {
        document.getElementById('debate-topic').textContent = decodeURIComponent(topic);
        document.title = `${decodeURIComponent(topic)} - AI辩论赛`;
    }
}

/**
 * 初始化辩手信息
 */
function initDebaters() {
    const urlParams = new URLSearchParams(window.location.search);
    const leftDebaterId = urlParams.get('left') || localStorage.getItem('left-debater') || 'alpha';
    const rightDebaterId = urlParams.get('right') || localStorage.getItem('right-debater') || 'beta';
    
    // 辩手数据
    const debaters = {
        'alpha': {
            name: '理性思考者',
            image: 'images/debater-alpha.svg',
            voice: 'male',
            pitch: 1.0
        },
        'beta': {
            name: '批判思想家',
            image: 'images/debater-beta.svg',
            voice: 'male',
            pitch: 0.9
        },
        'gamma': {
            name: '创新倡导者',
            image: 'images/debater-gamma.svg',
            voice: 'male',
            pitch: 1.1
        },
        'delta': {
            name: '历史守护者',
            image: 'images/debater-delta.svg',
            voice: 'male',
            pitch: 0.8
        },
        'epsilon': {
            name: '平衡协调者',
            image: 'images/debater-epsilon.svg',
            voice: 'female',
            pitch: 1.0
        },
        'zeta': {
            name: '人文关怀者',
            image: 'images/debater-zeta.svg',
            voice: 'female',
            pitch: 1.1
        }
    };
    
    // 设置辩手信息
    if (debaters[leftDebaterId]) {
        document.getElementById('left-debater-name').textContent = debaters[leftDebaterId].name;
        document.getElementById('left-debater-img').src = debaters[leftDebaterId].image;
        document.getElementById('left-debater-img').alt = debaters[leftDebaterId].name;
    }
    
    if (debaters[rightDebaterId]) {
        document.getElementById('right-debater-name').textContent = debaters[rightDebaterId].name;
        document.getElementById('right-debater-img').src = debaters[rightDebaterId].image;
        document.getElementById('right-debater-img').alt = debaters[rightDebaterId].name;
    }
    
    // 保存辩手信息到全局变量
    window.debaters = {
        left: debaters[leftDebaterId],
        right: debaters[rightDebaterId]
    };
}

// 轮次切换功能
function initRoundNavigation() {
    const prevButton = document.getElementById('prev-round');
    const nextButton = document.getElementById('next-round');
    const roundInfo = document.querySelector('.round-info');
    const currentRoundSpan = document.querySelector('.current-round');
    const roundNameSpan = document.querySelector('.round-name');
    const markers = document.querySelectorAll('.marker');
    
    // 轮次名称数组
    const roundNames = [
        '开场陈述',
        '攻辩环节',
        '自由辩论',
        '结论总结',
        '合辩环节'
    ];
    
    // 当前轮次（从1开始）
    let currentRound = 1;
    
    // 上一轮按钮点击事件
    prevButton.addEventListener('click', function() {
        if (currentRound > 1) {
            // 停止当前语音
            stopSpeech();
            
            currentRound--;
            updateRoundUI(currentRound);
        }
    });
    
    // 下一轮按钮点击事件
    nextButton.addEventListener('click', function() {
        if (currentRound < roundNames.length) {
            // 停止当前语音
            stopSpeech();
            
            currentRound++;
            updateRoundUI(currentRound);
            
            // 如果到达最后一轮，加载合辩环节数据
            if (currentRound === roundNames.length) {
                loadSynthesisContent();
            }
        }
    });
    
    // 点击进度条标记直接跳转到对应轮次
    markers.forEach(marker => {
        marker.addEventListener('click', function() {
            const round = parseInt(this.getAttribute('data-round'));
            if (round !== currentRound) {
                // 停止当前语音
                stopSpeech();
                
                currentRound = round;
                updateRoundUI(currentRound);
                
                // 如果点击到合辩环节，加载合辩内容
                if (currentRound === roundNames.length) {
                    loadSynthesisContent();
                }
            }
        });
    });
    
    // 更新UI显示当前轮次
    function updateRoundUI(round) {
        // 更新轮次信息
        currentRoundSpan.textContent = `第${round}轮`;
        roundNameSpan.textContent = roundNames[round - 1];
        
        // 启用/禁用导航按钮
        prevButton.disabled = (round === 1);
        nextButton.disabled = (round === roundNames.length);
        
        // 更新进度条
        updateProgressBar(round);
        
        // 更新标记激活状态
        markers.forEach(m => {
            const markerRound = parseInt(m.getAttribute('data-round'));
            m.classList.remove('active', 'completed');
            
            if (markerRound === round) {
                m.classList.add('active');
            } else if (markerRound < round) {
                m.classList.add('completed');
            }
        });
        
        // 切换显示当前轮次的对话和评委点评
        showCurrentRoundContent(round);
    }
}

// 更新进度条
function updateProgressBar(round) {
    const progressBar = document.querySelector('.progress-bar-fill');
    const totalRounds = 5; // 总轮次数
    
    // 计算完成百分比
    const percentage = ((round - 1) / (totalRounds - 1)) * 100;
    progressBar.style.width = `${percentage}%`;
}

// 显示当前轮次的对话和评委点评
function showCurrentRoundContent(round) {
    // 隐藏所有对话
    document.querySelectorAll('.debate-dialog').forEach(dialog => {
        dialog.classList.remove('active');
    });
    
    // 隐藏所有评委点评
    document.querySelectorAll('.judge-comments').forEach(comment => {
        comment.classList.remove('active');
    });
    
    // 显示当前轮次的对话
    const currentDialog = document.querySelector(`.debate-dialog[data-round="${round}"]`);
    if (currentDialog) {
        currentDialog.classList.add('active');
    } else {
        // 如果不存在当前轮次的对话内容，则动态加载
        loadRoundContent(round);
    }
    
    // 显示当前轮次的评委点评
    const currentComment = document.querySelector(`.judge-comments[data-round="${round}"]`);
    if (currentComment) {
        currentComment.classList.add('active');
    } else {
        // 如果不存在当前轮次的评委点评，则动态加载
        loadJudgeComment(round);
    }
    
    // 更新评分卡
    updateScoreCard(round);
}

// 动态加载轮次内容（模拟数据）
function loadRoundContent(round) {
    const dialogContainer = document.querySelector('.debate-dialog-container');
    
    // 创建新的对话容器
    const newDialog = document.createElement('div');
    newDialog.className = 'debate-dialog active';
    newDialog.setAttribute('data-round', round);
    
    // 根据不同轮次加载不同内容
    let dialogHTML = '';
    
    switch(round) {
        case 2:
            dialogHTML = createAttackDefenseRound();
            break;
        case 3:
            dialogHTML = createFreeDebateRound();
            break;
        case 4:
            dialogHTML = createConclusionRound();
            break;
        case 5:
            dialogHTML = createSynthesisRound();
            break;
    }
    
    newDialog.innerHTML = dialogHTML;
    dialogContainer.appendChild(newDialog);
}

// 加载评委点评（模拟数据）
function loadJudgeComment(round) {
    const judgePanel = document.querySelector('.judge-panel');
    const scoreCard = document.querySelector('.score-card');
    
    // 创建新的点评容器
    const newComment = document.createElement('div');
    newComment.className = 'judge-comments active';
    newComment.setAttribute('data-round', round);
    
    // 根据不同轮次加载不同点评内容
    let commentHTML = '';
    
    switch(round) {
        case 2:
            commentHTML = `
                <div class="comment">
                    <p>在攻辩环节，双方辩手展现出出色的临场应变能力和批判思维。</p>
                    <p>正方Alpha针对技术限制的必要性提出了具体的法规和伦理标准参考，回应质疑时条理清晰；反方Beta则巧妙举例说明过度限制可能阻碍创新，论证有力。</p>
                    <p>双方在核心概念"限制"的定义上存在分歧，建议下一轮辩论中进一步明确各自对"适度限制"的具体界定，这将有助于辩论更加聚焦。</p>
                </div>
            `;
            break;
        case 3:
            commentHTML = `
                <div class="comment">
                    <p>自由辩论环节激烈而深入，双方在多个具体案例上展开交锋，思维灵活度值得赞赏。</p>
                    <p>正方Alpha提出的人工智能监管框架案例分析很有说服力，数据支持充分；反方Beta关于历史上科技突破如何克服限制的论述极具启发性。</p>
                    <p>双方都开始在寻找平衡点，这是辩论走向更高维度思考的积极信号。特别是在讨论差异化监管策略时，已经显示出超越简单二元对立的思考倾向。</p>
                </div>
            `;
            break;
        case 4:
            commentHTML = `
                <div class="comment">
                    <p>结论总结环节，双方辩手均能提炼核心观点，总结论据，表现出色。</p>
                    <p>正方Alpha强调技术发展需要适当引导而非阻碍，提出了"负责任创新"的框架；反方Beta承认某些领域的技术需要规范，但坚持创新自由是社会进步的根本动力。</p>
                    <p>值得注意的是，双方立场已经有所靠近，为下一轮合辩环节奠定了良好基础。期待双方能在合辩中达成更高维度的共识。</p>
                </div>
            `;
            break;
        case 5:
            commentHTML = `
                <div class="comment">
                    <p>在合辩环节，双方辩手展现出了超越对立、追求真理的学术精神，成功达成了更高维度的共识。</p>
                    <p>双方认同技术发展与限制并非简单的二元对立，而是需要在不同领域、不同风险层级采取差异化策略。"限制"被重新定义为积极引导机制，而非创新阻碍。</p>
                    <p>特别值得称赞的是，双方共同构建了一个更全面的技术治理视角，既考虑了创新活力，也兼顾了安全与伦理边界，体现了辩论的最高境界——从对立走向统一。</p>
                </div>
            `;
            break;
    }
    
    newComment.innerHTML = commentHTML;
    judgePanel.insertBefore(newComment, scoreCard);
}

// 更新评分卡
function updateScoreCard(round) {
    const scoreCard = document.querySelector('.score-card');
    const roundTitle = scoreCard.querySelector('h4');
    
    // 更新轮次标题
    roundTitle.textContent = `第${round}轮评分`;
    
    // 更新评分数据（模拟数据）
    const scores = {
        1: { left: 8.5, right: 8.3 },
        2: { left: 8.6, right: 8.5 },
        3: { left: 8.8, right: 8.7 },
        4: { left: 8.7, right: 8.8 },
        5: { left: 9.0, right: 8.9 }
    };
    
    const dimensions = {
        1: { 
            logic: { left: 90, right: 85 },
            support: { left: 80, right: 85 },
            expression: { left: 85, right: 80 }
        },
        2: { 
            logic: { left: 88, right: 87 },
            support: { left: 85, right: 85 },
            expression: { left: 85, right: 83 }
        },
        3: { 
            logic: { left: 90, right: 88 },
            support: { left: 87, right: 90 },
            expression: { left: 87, right: 85 }
        },
        4: { 
            logic: { left: 88, right: 90 },
            support: { left: 88, right: 88 },
            expression: { left: 85, right: 86 }
        },
        5: { 
            logic: { left: 92, right: 90 },
            support: { left: 90, right: 88 },
            expression: { left: 88, right: 90 }
        }
    };
    
    // 更新总分
    const leftScoreBar = document.querySelector('.score-bar.left');
    const rightScoreBar = document.querySelector('.score-bar.right');
    
    leftScoreBar.style.width = `${scores[round].left * 10}%`;
    rightScoreBar.style.width = `${scores[round].right * 10}%`;
    leftScoreBar.querySelector('span').textContent = scores[round].left;
    rightScoreBar.querySelector('span').textContent = scores[round].right;
    
    // 更新维度评分
    const logicDimension = document.querySelector('.dimension:nth-child(1) .dimension-bars');
    const supportDimension = document.querySelector('.dimension:nth-child(2) .dimension-bars');
    const expressionDimension = document.querySelector('.dimension:nth-child(3) .dimension-bars');
    
    logicDimension.querySelector('.dimension-left').style.width = `${dimensions[round].logic.left}%`;
    logicDimension.querySelector('.dimension-right').style.width = `${dimensions[round].logic.right}%`;
    
    supportDimension.querySelector('.dimension-left').style.width = `${dimensions[round].support.left}%`;
    supportDimension.querySelector('.dimension-right').style.width = `${dimensions[round].support.right}%`;
    
    expressionDimension.querySelector('.dimension-left').style.width = `${dimensions[round].expression.left}%`;
    expressionDimension.querySelector('.dimension-right').style.width = `${dimensions[round].expression.right}%`;
}

// 加载合辩内容
function loadSynthesisContent() {
    // 已经通过loadRoundContent函数处理
}

// 按钮事件初始化
function initButtonEvents() {
    const shareButton = document.getElementById('share-debate');
    const saveButton = document.getElementById('save-debate');
    const newDebateButton = document.getElementById('new-debate');
    
    // 分享辩论按钮
    shareButton.addEventListener('click', function() {
        const debateTopic = document.getElementById('debate-topic').textContent;
        const shareUrl = `${window.location.origin}${window.location.pathname}?topic=${encodeURIComponent(debateTopic)}`;
        
        // 实现分享功能（在实际应用中可以使用Web Share API或显示分享模态框）
        try {
            if (navigator.share) {
                navigator.share({
                    title: `AI辩论赛: ${debateTopic}`,
                    text: '查看这场精彩的AI辩论！',
                    url: shareUrl
                });
            } else {
                // 降级方案：复制链接到剪贴板
                navigator.clipboard.writeText(shareUrl).then(() => {
                    alert('链接已复制到剪贴板！');
                });
            }
        } catch (error) {
            console.error('分享失败:', error);
            // 降级方案
            prompt('复制此链接分享:', shareUrl);
        }
    });
    
    // 保存记录按钮
    saveButton.addEventListener('click', function() {
        const debateTopic = document.getElementById('debate-topic').textContent;
        
        // 模拟保存功能（实际应用中应使用localStorage或发送到服务器）
        const savedDebates = JSON.parse(localStorage.getItem('savedDebates') || '[]');
        
        // 检查是否已经保存过
        const alreadySaved = savedDebates.some(debate => debate.topic === debateTopic);
        
        if (!alreadySaved) {
            savedDebates.push({
                id: Date.now(),
                topic: debateTopic,
                date: new Date().toISOString(),
                leftScore: 8.7,
                rightScore: 8.6,
                completed: true
            });
            
            localStorage.setItem('savedDebates', JSON.stringify(savedDebates));
            alert('辩论记录已保存！');
        } else {
            alert('此辩论已经保存过了');
        }
    });
    
    // 新辩题按钮
    newDebateButton.addEventListener('click', function() {
        window.location.href = 'topic.html';
    });
}

// 创建攻辩环节内容
function createAttackDefenseRound() {
    return `
        <div class="speech left">
            <div class="speech-header">
                <div class="avatar">
                    <i class="fas fa-robot"></i>
                </div>
                <div class="speaker-info">
                    <div class="speaker-name">AI辩手 Alpha</div>
                    <div class="speaker-position">正方</div>
                </div>
            </div>
            <div class="speech-content">
                <p>我方认为，限制技术发展不是阻碍创新，而是确保技术朝着有益方向发展的必要措施。请问反方，如何看待在人工智能领域，缺乏限制导致的算法偏见、隐私侵犯等问题？这些是否已经对部分群体造成了伤害？</p>
            </div>
        </div>
        
        <div class="speech right">
            <div class="speech-header">
                <div class="avatar">
                    <i class="fas fa-robot"></i>
                </div>
                <div class="speaker-info">
                    <div class="speaker-name">AI辩手 Beta</div>
                    <div class="speaker-position">反方</div>
                </div>
            </div>
            <div class="speech-content">
                <p>我方承认技术发展中出现的问题，但这些问题恰恰需要更多创新来解决，而非简单限制。算法偏见是因为训练数据不足，隐私问题是应用伦理而非技术本身的问题。请问正方，历史上哪一项重大技术突破不是通过突破限制实现的？限制本身是否也会带来更大的社会成本？</p>
            </div>
        </div>
        
        <div class="speech left">
            <div class="speech-header">
                <div class="avatar">
                    <i class="fas fa-robot"></i>
                </div>
                <div class="speaker-info">
                    <div class="speaker-name">AI辩手 Alpha</div>
                    <div class="speaker-position">正方</div>
                </div>
            </div>
            <div class="speech-content">
                <p>创新与限制并非对立，恰恰是规范的环境催生了更有价值的创新。如欧盟GDPR推动了隐私保护技术的发展。对于历史上的突破，如曼哈顿计划、基因编辑，恰恰是在伦理和法律框架下进行的。反方混淆了"无序"与"自由"的概念，真正的创新自由需要建立在一定规则之上。请问，在基因编辑等影响深远的领域，反方是否认为应该完全不设限制？</p>
            </div>
        </div>
        
        <div class="speech right">
            <div class="speech-header">
                <div class="avatar">
                    <i class="fas fa-robot"></i>
                </div>
                <div class="speaker-info">
                    <div class="speaker-name">AI辩手 Beta</div>
                    <div class="speaker-position">反方</div>
                </div>
            </div>
            <div class="speech-content">
                <p>正方提到基因编辑领域是个很好的例子。事实上，我们看到过度限制导致许多研究转移到监管较少的国家进行，这不但未能阻止研究，反而使其在缺乏透明度的环境下进行。我们主张的不是无序，而是以科学共同体的自律、后置监管代替前置限制。正方所提GDPR虽有积极作用，但也造成创新企业负担增加、用户体验下降等副作用。我们应该关注，过度限制是否会导致创新动力减弱？</p>
            </div>
        </div>
    `;
}

// 创建自由辩论环节内容
function createFreeDebateRound() {
    return `
        <div class="speech left">
            <div class="speech-header">
                <div class="avatar">
                    <i class="fas fa-robot"></i>
                </div>
                <div class="speaker-info">
                    <div class="speaker-name">AI辩手 Alpha</div>
                    <div class="speaker-position">正方</div>
                </div>
            </div>
            <div class="speech-content">
                <p>让我们更具体地看一些案例。美国FDA对药物的严格审批制度看似限制了新药上市速度，但也确保了药品安全，事实上这种"限制"催生了更规范的临床试验方法。同样，AI领域的算法透明度要求促使企业开发了可解释AI技术。</p>
                <p>我方认为，应区分不同领域采取差异化限制策略：高风险领域如自动驾驶、医疗AI需要更严格的前置审批；低风险领域可采用更灵活的监管方式。这才是平衡创新与安全的理性路径。</p>
            </div>
        </div>
        
        <div class="speech right">
            <div class="speech-header">
                <div class="avatar">
                    <i class="fas fa-robot"></i>
                </div>
                <div class="speaker-info">
                    <div class="speaker-name">AI辩手 Beta</div>
                    <div class="speaker-position">反方</div>
                </div>
            </div>
            <div class="speech-content">
                <p>正方提出的差异化策略有其合理性，但FDA的例子恰恰说明了过度限制的问题——新冠疫情期间，过于严格的审批流程导致测试试剂延迟上市，错过了防控黄金期。相比之下，科学界自主实施的预印本机制在保证快速信息共享的同时，通过同行评议确保了质量。</p>
                <p>我们支持适度监管，但反对将"限制"作为第一选择。大多数情况下，行业自律、市场机制和事后问责更有效，这让创新有足够空间，同时保障公共利益。</p>
            </div>
        </div>
        
        <div class="speech left">
            <div class="speech-header">
                <div class="avatar">
                    <i class="fas fa-robot"></i>
                </div>
                <div class="speaker-info">
                    <div class="speaker-name">AI辩手 Alpha</div>
                    <div class="speaker-position">正方</div>
                </div>
            </div>
            <div class="speech-content">
                <p>反方提到疫情期间的例子很有启发性，但这恰恰说明了我们需要"智能限制"而非"无限制"。FDA在危机时刻实施了紧急使用授权，这种灵活的限制机制才是我们提倡的。</p>
                <p>至于行业自律，历史经验表明在关键技术领域不够可靠。社交媒体巨头在算法推荐、内容审核上的自律显然失效，导致了假信息传播、青少年心理健康问题等，最终需要外部限制介入。技术限制与创新之间应是动态平衡，而非简单对立。</p>
            </div>
        </div>
        
        <div class="speech right">
            <div class="speech-header">
                <div class="avatar">
                    <i class="fas fa-robot"></i>
                </div>
                <div class="speaker-info">
                    <div class="speaker-name">AI辩手 Beta</div>
                    <div class="speaker-position">反方</div>
                </div>
            </div>
            <div class="speech-content">
                <p>我同意需要"智能约束"的观点，但这不等同于"限制技术发展"。社交媒体的例子恰恰表明，问题在于商业模式和应用方向，而非技术本身。对技术的限制可能导致创新转移，而问题依然存在。</p>
                <p>更有效的方式是提高技术素养教育、增强用户话语权、改进产品设计伦理。例如，开源社区通过透明度和多元参与，在没有外部限制的情况下，自发形成了有效的质量控制和伦理规范。</p>
            </div>
        </div>
    `;
}

// 创建结论总结环节内容
function createConclusionRound() {
    return `
        <div class="speech left">
            <div class="speech-header">
                <div class="avatar">
                    <i class="fas fa-robot"></i>
                </div>
                <div class="speaker-info">
                    <div class="speaker-name">AI辩手 Alpha</div>
                    <div class="speaker-position">正方</div>
                </div>
            </div>
            <div class="speech-content">
                <p>辩题"技术发展是否应该被限制"的核心在于如何理解"限制"。我方主张，适当的限制不是阻碍技术发展，而是为其提供健康的生态系统和方向引导。</p>
                <p>通过我们的辩论，双方已在多点达成共识：一、不同领域需要差异化策略；二、技术使用的伦理同样重要；三、监管应避免僵化，保持灵活性。</p>
                <p>我方坚持认为，在关乎公共利益、生态安全和人类福祉的技术领域，前置的伦理审查、法律框架和公众参与机制是必要的。这些"限制"事实上促进了"负责任创新"，让技术发展既有活力，又有方向。</p>
            </div>
        </div>
        
        <div class="speech right">
            <div class="speech-header">
                <div class="avatar">
                    <i class="fas fa-robot"></i>
                </div>
                <div class="speaker-info">
                    <div class="speaker-name">AI辩手 Beta</div>
                    <div class="speaker-position">反方</div>
                </div>
            </div>
            <div class="speech-content">
                <p>技术发展是人类文明进步的关键动力，我方认为对技术本身的限制会抑制创新潜能、延迟解决重大问题的时机。</p>
                <p>我们确实在很多观点上有交集：一、创新与监管需要平衡；二、高风险技术领域需要特别关注；三、技术应用的伦理框架非常重要。</p>
                <p>然而，我方坚持技术发展应以自由为原则，以限制为例外。最有效的方式是改进技术应用环境——透明度要求、技术素养教育、多方参与决策、事后问责机制等，而非直接限制技术本身的发展。只有在充分创新空间中，技术才能发挥最大潜力解决人类面临的挑战。</p>
            </div>
        </div>
    `;
}

// 创建合辩环节内容
function createSynthesisRound() {
    return `
        <div class="speech synthesis">
            <div class="speech-header synthesis-header">
                <div class="avatar">
                    <i class="fas fa-handshake"></i>
                </div>
                <div class="speaker-info">
                    <div class="speaker-name">合辩共识</div>
                    <div class="speaker-position">超越对立，达成更高维度理解</div>
                </div>
            </div>
            <div class="speech-content">
                <p>通过深入辩论，我们从对立走向统一，达成以下共识：</p>
                <ol>
                    <li>技术发展与限制并非非此即彼的关系，而是应当基于不同领域、不同风险程度采取差异化策略。</li>
                    <li>"限制"不应理解为阻碍创新，而应视为确保技术发展方向健康、可持续的积极引导机制。</li>
                    <li>无论是自由发展还是适度限制，其根本目的都是为了最大化技术对人类社会的积极贡献、最小化潜在风险。</li>
                    <li>技术伦理教育与公众参与决策同样重要，应构建多元参与的技术治理机制，平衡创新、安全与公平。</li>
                    <li>在全球化背景下，技术发展需要国际协作与标准统一，共同应对技术带来的跨国界挑战。</li>
                </ol>
                <p>我们认识到，真正的问题不是"要不要限制"，而是"如何构建促进负责任创新的生态系统"。这需要政府、企业、学术界和公民社会的共同参与，形成动态平衡的技术治理框架。</p>
            </div>
        </div>
    `;
}

// 添加合辩环节的特殊样式
const synthesisStyle = document.createElement('style');
synthesisStyle.textContent = `
    .speech.synthesis {
        background-color: rgba(156, 39, 176, 0.1);
        border-left: 4px solid #9c27b0;
        margin: 0 20px;
    }
    
    .synthesis-header .avatar {
        background-color: #f3e5f5;
    }
    
    .synthesis-header .avatar i {
        color: #9c27b0;
    }
    
    .speech-content ol {
        margin-left: 20px;
        margin-bottom: 15px;
    }
    
    .speech-content ol li {
        margin-bottom: 8px;
    }
`;
document.head.appendChild(synthesisStyle);

/**
 * 初始化语音控制
 */
function initVoiceControls() {
    const toggleVoiceBtn = document.getElementById('toggle-voice');
    const voiceSpeedSelect = document.getElementById('voice-speed');
    const voiceVolumeInput = document.getElementById('voice-volume');
    
    // 加载保存的设置
    if (localStorage.getItem('voice-speed')) {
        voiceSpeedSelect.value = localStorage.getItem('voice-speed');
    }
    
    if (localStorage.getItem('voice-volume')) {
        voiceVolumeInput.value = localStorage.getItem('voice-volume');
    }
    
    // 如果语音功能被禁用，则隐藏语音控制
    if (localStorage.getItem('voice-enabled') === 'false') {
        document.querySelector('.voice-controls').style.display = 'none';
        return;
    }
    
    // 播放/暂停语音按钮点击事件
    toggleVoiceBtn.addEventListener('click', function() {
        if (isVoicePlaying) {
            stopSpeech();
            this.innerHTML = '<i class="fas fa-volume-up"></i> 播放语音';
            this.classList.remove('playing');
        } else {
            playCurrentRoundSpeech();
            this.innerHTML = '<i class="fas fa-pause"></i> 暂停语音';
            this.classList.add('playing');
        }
    });
    
    // 语速变更事件
    voiceSpeedSelect.addEventListener('change', function() {
        localStorage.setItem('voice-speed', this.value);
        
        // 如果正在播放，则重新开始播放
        if (isVoicePlaying) {
            stopSpeech();
            playCurrentRoundSpeech();
        }
    });
    
    // 音量变更事件
    voiceVolumeInput.addEventListener('input', function() {
        localStorage.setItem('voice-volume', this.value);
        
        // 更新当前语音的音量
        if (currentUtterance) {
            currentUtterance.volume = parseFloat(this.value);
        }
    });
}

/**
 * 播放当前轮次的语音
 */
function playCurrentRoundSpeech() {
    if (!('speechSynthesis' in window)) {
        alert('您的浏览器不支持语音合成功能');
        return;
    }
    
    // 停止当前语音
    stopSpeech();
    
    // 获取当前轮次的对话内容
    const currentDialog = document.querySelector(`.debate-dialog.active`);
    if (!currentDialog) return;
    
    // 获取所有发言
    const speeches = currentDialog.querySelectorAll('.speech');
    
    // 清空语音队列
    speechQueue = [];
    
    // 为每个发言创建语音
    speeches.forEach(speech => {
        const speakerName = speech.querySelector('.speaker-name').textContent;
        const speakerPosition = speech.querySelector('.speaker-position').textContent;
        const contentParagraphs = speech.querySelectorAll('.speech-content p');
        
        // 确定使用哪个辩手的声音
        let debater = speakerPosition === '正方' ? window.debaters.left : window.debaters.right;
        
        // 为每个段落创建语音
        contentParagraphs.forEach(p => {
            const text = p.textContent;
            
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'zh-CN';
            utterance.rate = parseFloat(document.getElementById('voice-speed').value);
            utterance.volume = parseFloat(document.getElementById('voice-volume').value);
            utterance.pitch = debater.pitch || 1.0;
            
            // 选择合适的声音
            if ('speechSynthesis' in window) {
                const voices = window.speechSynthesis.getVoices();
                const chineseVoices = voices.filter(voice => voice.lang.includes('zh'));
                
                if (chineseVoices.length > 0) {
                    // 根据性别选择声音
                    const genderVoices = chineseVoices.filter(voice => 
                        debater.voice === 'male' ? voice.name.includes('Male') : voice.name.includes('Female')
                    );
                    
                    if (genderVoices.length > 0) {
                        utterance.voice = genderVoices[0];
                    } else {
                        utterance.voice = chineseVoices[0];
                    }
                }
            }
            
            // 添加到语音队列
            speechQueue.push({
                utterance: utterance,
                element: p,
                speaker: speech
            });
        });
    });
    
    // 开始播放语音队列
    isVoicePlaying = true;
    playNextInQueue();
}

/**
 * 播放队列中的下一个语音
 */
function playNextInQueue() {
    if (speechQueue.length === 0 || !isVoicePlaying) {
        // 队列播放完毕或已停止
        isVoicePlaying = false;
        const toggleVoiceBtn = document.getElementById('toggle-voice');
        toggleVoiceBtn.innerHTML = '<i class="fas fa-volume-up"></i> 播放语音';
        toggleVoiceBtn.classList.remove('playing');
        return;
    }
    
    // 获取队列中的下一个语音
    const next = speechQueue.shift();
    currentUtterance = next.utterance;
    
    // 高亮当前正在播放的段落
    document.querySelectorAll('.speech-content p').forEach(p => p.classList.remove('speaking'));
    next.element.classList.add('speaking');
    
    // 高亮当前正在发言的辩手
    document.querySelectorAll('.speech').forEach(s => s.classList.remove('speaking'));
    next.speaker.classList.add('speaking');
    
    // 播放结束后播放下一个
    currentUtterance.onend = function() {
        currentUtterance = null;
        playNextInQueue();
    };
    
    // 播放语音
    window.speechSynthesis.speak(currentUtterance);
}

/**
 * 停止语音播放
 */
function stopSpeech() {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
    }
    
    isVoicePlaying = false;
    currentUtterance = null;
    
    // 移除所有高亮
    document.querySelectorAll('.speech-content p').forEach(p => p.classList.remove('speaking'));
    document.querySelectorAll('.speech').forEach(s => s.classList.remove('speaking'));
} 