document.addEventListener('DOMContentLoaded', function() {
    initLoginTabs();
    initPhoneLogin();
    initWechatLogin();
    initGoogleLogin();
});

/**
 * 初始化登录选项卡切换功能
 */
function initLoginTabs() {
    const tabs = document.querySelectorAll('.login-tab');
    const contents = document.querySelectorAll('.login-tab-content');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // 移除所有标签的active类
            tabs.forEach(t => t.classList.remove('active'));
            
            // 添加当前标签的active类
            this.classList.add('active');
            
            // 获取当前标签对应的内容区域
            const tabName = this.getAttribute('data-tab');
            
            // 隐藏所有内容区域
            contents.forEach(content => content.classList.remove('active'));
            
            // 显示当前标签对应的内容区域
            document.getElementById(`${tabName}-login`).classList.add('active');
        });
    });
}

/**
 * 初始化手机号登录功能
 */
function initPhoneLogin() {
    const phoneForm = document.querySelector('.login-form');
    const getCodeBtn = document.querySelector('.get-code-btn');
    const phoneInput = document.getElementById('phone');
    
    // 获取验证码按钮点击事件
    if (getCodeBtn) {
        getCodeBtn.addEventListener('click', function() {
            if (!phoneInput.value) {
                alert('请输入手机号');
                return;
            }
            
            // 验证手机号格式
            if (!validatePhone(phoneInput.value)) {
                alert('请输入有效的手机号');
                return;
            }
            
            // 倒计时
            startCountdown(this);
            
            // 这里应该发送获取验证码的请求
            // 为了演示，仅显示提示信息
            console.log('发送验证码到', phoneInput.value);
        });
    }
    
    // 表单提交事件
    if (phoneForm) {
        phoneForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const phone = phoneInput.value;
            const verification = document.getElementById('verification').value;
            
            if (!phone) {
                alert('请输入手机号');
                return;
            }
            
            if (!validatePhone(phone)) {
                alert('请输入有效的手机号');
                return;
            }
            
            if (!verification) {
                alert('请输入验证码');
                return;
            }
            
            // 这里应该发送登录请求
            // 为了演示，仅显示提示信息并重定向
            console.log('登录信息：', { phone, verification });
            
            // 模拟登录成功后重定向
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        });
    }
}

/**
 * 初始化微信登录功能
 */
function initWechatLogin() {
    const refreshBtn = document.querySelector('.refresh-btn');
    
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            // 刷新二维码的逻辑
            const qrcodeImg = document.querySelector('.qrcode-box img');
            
            // 添加加载效果
            qrcodeImg.style.opacity = '0.5';
            
            // 模拟刷新过程
            setTimeout(() => {
                // 实际应用中这里应该请求新的二维码
                qrcodeImg.style.opacity = '1';
                alert('二维码已刷新');
            }, 1000);
        });
    }
    
    // 实际应用中，这里应该有轮询检查微信扫码状态的逻辑
}

/**
 * 初始化Google登录功能
 */
function initGoogleLogin() {
    const googleBtn = document.querySelector('.google-login-btn');
    
    if (googleBtn) {
        googleBtn.addEventListener('click', function() {
            // 实际应用中这里应该触发Google OAuth登录流程
            console.log('开始Google登录流程');
            
            // 模拟登录跳转
            alert('正在跳转到Google登录页面');
            
            // 实际应该跳转到Google授权页面
        });
    }
}

/**
 * 验证手机号格式
 * @param {string} phone - 手机号
 * @returns {boolean} - 是否是有效的手机号
 */
function validatePhone(phone) {
    // 这里使用简单的验证规则，实际应用中应该根据不同国家/地区使用更精确的规则
    return /^\d{11}$/.test(phone);
}

/**
 * 获取验证码按钮倒计时
 * @param {HTMLElement} button - 获取验证码按钮
 */
function startCountdown(button) {
    let seconds = 60;
    const originalText = button.textContent;
    
    button.disabled = true;
    button.textContent = `${seconds}秒后重试`;
    
    const interval = setInterval(() => {
        seconds--;
        button.textContent = `${seconds}秒后重试`;
        
        if (seconds <= 0) {
            clearInterval(interval);
            button.disabled = false;
            button.textContent = originalText;
        }
    }, 1000);
} 