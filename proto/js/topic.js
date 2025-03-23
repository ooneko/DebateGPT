document.addEventListener('DOMContentLoaded', function() {
    // 初始化分类标签切换功能
    initCategoryTabs();
    
    // 初始化辩题选择功能
    initTopicSelection();
});

// 实现分类标签切换功能
function initCategoryTabs() {
    const categoryTabs = document.querySelectorAll('.category-tab');
    const topicItems = document.querySelectorAll('.topic-item');
    
    categoryTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // 移除所有标签的活跃状态
            categoryTabs.forEach(t => t.classList.remove('active'));
            
            // 为当前点击的标签添加活跃状态
            this.classList.add('active');
            
            const category = this.getAttribute('data-category');
            
            // 根据选择的分类显示或隐藏辩题
            topicItems.forEach(item => {
                if (category === 'all') {
                    item.style.display = 'flex';
                } else {
                    const itemCategories = item.getAttribute('data-category');
                    if (itemCategories.includes(category)) {
                        item.style.display = 'flex';
                    } else {
                        item.style.display = 'none';
                    }
                }
            });
        });
    });
}

// 实现辩题选择功能
function initTopicSelection() {
    const topicForm = document.getElementById('topic-form');
    const customTopicInput = document.getElementById('custom-topic');
    const selectButtons = document.querySelectorAll('.select-topic-btn');
    
    // 选择推荐辩题
    selectButtons.forEach(button => {
        button.addEventListener('click', function() {
            const topic = this.getAttribute('data-topic');
            customTopicInput.value = topic;
            highlightSubmitButton();
        });
    });
    
    // 自定义辩题输入
    customTopicInput.addEventListener('input', function() {
        if (this.value.trim().length > 0) {
            highlightSubmitButton();
        }
    });
    
    // 表单提交
    topicForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const topic = customTopicInput.value.trim();
        
        if (topic.length === 0) {
            alert('请输入或选择一个辩题');
            return;
        }
        
        // 修改为跳转到辩手选择页面
        window.location.href = `debater-select.html?topic=${encodeURIComponent(topic)}`;
    });
}

// 高亮提交按钮提示用户点击
function highlightSubmitButton() {
    const submitButton = document.querySelector('.primary-btn');
    
    // 添加脉冲动画效果
    submitButton.classList.add('pulse-effect');
    
    // 移除动画效果
    setTimeout(() => {
        submitButton.classList.remove('pulse-effect');
    }, 2000);
}

// 为CSS添加脉冲动画
const style = document.createElement('style');
style.textContent = `
    @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
    }
    
    .pulse-effect {
        animation: pulse 0.5s ease-in-out infinite;
        box-shadow: 0 0 0 5px rgba(63, 81, 181, 0.2);
    }
`;
document.head.appendChild(style); 