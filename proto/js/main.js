document.addEventListener('DOMContentLoaded', function() {
    // 初始化导航菜单高亮
    highlightCurrentNavItem();
    
    // 初始化热门辩题链接
    initPopularTopicLinks();
});

// 根据当前页面路径高亮导航菜单项
function highlightCurrentNavItem() {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('nav ul li a');
    
    navLinks.forEach(link => {
        // 移除所有active类
        link.classList.remove('active');
        
        // 获取链接路径
        const linkPath = new URL(link.href, window.location.origin).pathname;
        
        // 如果当前页面路径与链接路径匹配，添加active类
        if (currentPath === linkPath || 
            (currentPath === '/' && linkPath.includes('index.html'))) {
            link.classList.add('active');
        }
    });
}

// 初始化热门辩题链接
function initPopularTopicLinks() {
    const topicCards = document.querySelectorAll('.topic-card');
    
    topicCards.forEach(card => {
        card.addEventListener('click', function(event) {
            // 防止默认链接行为
            event.preventDefault();
            
            // 获取辩题
            const topic = this.getAttribute('href').split('=')[1];
            
            // 跳转到辩论页面
            window.location.href = `debate.html?topic=${topic}`;
        });
    });
}

// 平滑滚动到锚点
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;
        
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            window.scrollTo({
                top: targetElement.offsetTop - 100,
                behavior: 'smooth'
            });
        }
    });
}); 