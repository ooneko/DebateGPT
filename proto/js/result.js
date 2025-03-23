document.addEventListener('DOMContentLoaded', function() {
    // 初始化分享功能
    initShareModal();
    
    // 初始化辩论主题（从URL获取）
    initDebateTopic();
    
    // 初始化按钮事件
    initButtonEvents();
});

// 初始化分享模态框
function initShareModal() {
    const shareBtn = document.querySelector('.share-btn');
    const shareModal = document.getElementById('shareModal');
    const closeModal = document.querySelector('.close-modal');
    const copyBtn = document.querySelector('.copy-btn');
    
    // 点击分享按钮打开模态框
    if (shareBtn && shareModal) {
        shareBtn.addEventListener('click', function() {
            shareModal.style.display = 'flex';
        });
    }
    
    // 点击关闭按钮关闭模态框
    if (closeModal && shareModal) {
        closeModal.addEventListener('click', function() {
            shareModal.style.display = 'none';
        });
    }
    
    // 点击模态框外部区域关闭模态框
    if (shareModal) {
        shareModal.addEventListener('click', function(event) {
            if (event.target === shareModal) {
                shareModal.style.display = 'none';
            }
        });
    }
    
    // 复制链接功能
    if (copyBtn) {
        copyBtn.addEventListener('click', function() {
            const linkInput = document.querySelector('.share-link input');
            linkInput.select();
            document.execCommand('copy');
            
            // 显示复制成功提示
            copyBtn.textContent = '已复制';
            setTimeout(() => {
                copyBtn.innerHTML = '<i class="fas fa-copy"></i> 复制';
            }, 2000);
        });
    }
    
    // 设置分享平台按钮事件
    initSharePlatforms();
}

// 初始化分享平台按钮
function initSharePlatforms() {
    const wechatBtn = document.querySelector('.share-platform.wechat');
    const weiboBtn = document.querySelector('.share-platform.weibo');
    const twitterBtn = document.querySelector('.share-platform.twitter');
    
    // 获取分享URL和标题
    const shareUrl = window.location.href;
    const shareTitle = document.querySelector('.debate-topic')?.textContent || 'AI辩论赛结果';
    
    // 微信分享（实际应用中可能需要调用微信JS SDK）
    if (wechatBtn) {
        wechatBtn.addEventListener('click', function() {
            // 模拟微信分享
            alert('请使用微信扫描二维码分享（实际应用中会显示二维码）');
        });
    }
    
    // 微博分享
    if (weiboBtn) {
        weiboBtn.addEventListener('click', function() {
            const weiboUrl = `http://service.weibo.com/share/share.php?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent('【AI辩论赛】' + shareTitle)}`;
            window.open(weiboUrl, '_blank');
        });
    }
    
    // Twitter分享
    if (twitterBtn) {
        twitterBtn.addEventListener('click', function() {
            const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent('【AI辩论赛】' + shareTitle)}&url=${encodeURIComponent(shareUrl)}`;
            window.open(twitterUrl, '_blank');
        });
    }
}

// 从URL获取并设置辩论主题
function initDebateTopic() {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    
    // 实际应用中应从服务器或localStorage获取辩题数据
    // 这里简单模拟一下
    if (id) {
        // 假设有一个API获取辩论数据
        // fetchDebateResult(id).then(data => updateUI(data));
    }
}

// 初始化按钮事件
function initButtonEvents() {
    const newDebateBtn = document.querySelector('.primary-btn');
    
    if (newDebateBtn) {
        newDebateBtn.addEventListener('click', function() {
            window.location.href = 'topic.html';
        });
    }
} 