document.addEventListener('DOMContentLoaded', function() {
    // 初始化历史记录数据
    initHistoryData();
    
    // 初始化搜索和筛选功能
    initSearchAndFilter();
    
    // 初始化删除功能
    initDeleteFeature();
    
    // 初始化分页功能
    initPagination();
});

// 初始化历史记录数据
function initHistoryData() {
    // 实际应用中，这些数据应该从服务器或localStorage中获取
    // 这里为了演示，使用模拟数据
    const savedDebates = localStorage.getItem('savedDebates');
    
    if (savedDebates) {
        const debates = JSON.parse(savedDebates);
        
        if (debates.length === 0) {
            // 如果没有历史记录，显示空状态
            showEmptyState();
        } else {
            // 渲染历史记录
            renderHistoryItems(debates);
        }
    } else {
        // 如果localStorage中没有数据，使用模拟数据
        const mockDebates = [
            {
                id: '12345',
                topic: '技术发展是否应该被限制',
                date: '2023-06-15T14:30:00',
                leftScore: 8.7,
                rightScore: 8.6,
                completed: true
            },
            {
                id: '12344',
                topic: 'AI是否会取代人类工作',
                date: '2023-06-10T10:15:00',
                leftScore: 8.4,
                rightScore: 8.9,
                completed: true
            },
            {
                id: '12343',
                topic: '网络隐私与安全孰轻孰重',
                date: '2023-06-05T16:45:00',
                leftScore: 9.1,
                rightScore: 8.7,
                completed: true
            },
            {
                id: '12342',
                topic: '现代教育应注重知识还是能力',
                date: '2023-05-28T09:20:00',
                progress: 3,
                completed: false
            }
        ];
        
        // 保存到localStorage（实际应用中可能不需要）
        localStorage.setItem('savedDebates', JSON.stringify(mockDebates));
    }
}

// 显示空状态
function showEmptyState() {
    const historyList = document.querySelector('.history-list');
    const emptyState = document.querySelector('.empty-history');
    const pagination = document.querySelector('.history-pagination');
    
    if (historyList && emptyState && pagination) {
        historyList.style.display = 'none';
        pagination.style.display = 'none';
        emptyState.style.display = 'block';
    }
}

// 渲染历史记录列表
function renderHistoryItems(debates) {
    // 实际应用中，这里应该根据分页参数只渲染当前页的数据
    // 这里为了简单演示，直接使用已有的HTML结构
}

// 初始化搜索和筛选功能
function initSearchAndFilter() {
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    const sortFilter = document.getElementById('sort-filter');
    
    // 搜索功能
    if (searchBtn && searchInput) {
        searchBtn.addEventListener('click', function() {
            const searchTerm = searchInput.value.trim().toLowerCase();
            
            if (searchTerm) {
                filterHistoryItems(searchTerm);
            } else {
                // 如果搜索框为空，重置显示所有记录
                resetHistoryDisplay();
            }
        });
        
        // 按回车键触发搜索
        searchInput.addEventListener('keypress', function(event) {
            if (event.key === 'Enter') {
                searchBtn.click();
            }
        });
    }
    
    // 排序功能
    if (sortFilter) {
        sortFilter.addEventListener('change', function() {
            sortHistoryItems(this.value);
        });
    }
}

// 根据搜索词过滤历史记录
function filterHistoryItems(searchTerm) {
    const historyItems = document.querySelectorAll('.history-item');
    
    let hasVisibleItems = false;
    
    historyItems.forEach(item => {
        const topicElement = item.querySelector('.history-topic');
        const topic = topicElement.textContent.toLowerCase();
        
        if (topic.includes(searchTerm)) {
            item.style.display = 'flex';
            hasVisibleItems = true;
        } else {
            item.style.display = 'none';
        }
    });
    
    // 如果没有匹配的记录，显示提示
    const historyList = document.querySelector('.history-list');
    let noResultMsg = historyList.querySelector('.no-result-message');
    
    if (!hasVisibleItems) {
        if (!noResultMsg) {
            noResultMsg = document.createElement('div');
            noResultMsg.className = 'no-result-message';
            noResultMsg.innerHTML = `
                <p>未找到与"${searchTerm}"相关的辩论记录</p>
                <button class="btn secondary-btn reset-search-btn">显示所有记录</button>
            `;
            historyList.appendChild(noResultMsg);
            
            // 添加重置按钮事件
            const resetBtn = noResultMsg.querySelector('.reset-search-btn');
            resetBtn.addEventListener('click', function() {
                resetHistoryDisplay();
                searchInput.value = '';
            });
        }
    } else if (noResultMsg) {
        noResultMsg.remove();
    }
}

// 重置历史记录显示
function resetHistoryDisplay() {
    const historyItems = document.querySelectorAll('.history-item');
    const noResultMsg = document.querySelector('.no-result-message');
    
    historyItems.forEach(item => {
        item.style.display = 'flex';
    });
    
    if (noResultMsg) {
        noResultMsg.remove();
    }
}

// 排序历史记录
function sortHistoryItems(sortBy) {
    const historyList = document.querySelector('.history-list');
    const historyItems = Array.from(document.querySelectorAll('.history-item'));
    
    if (!historyList || historyItems.length === 0) return;
    
    // 根据不同的排序选项进行排序
    historyItems.sort((a, b) => {
        if (sortBy === 'date-desc' || sortBy === 'date-asc') {
            // 按日期排序
            const dateA = a.querySelector('.history-date').textContent;
            const dateB = b.querySelector('.history-date').textContent;
            
            // 提取日期
            const dateRegex = /(\d{4})年(\d{1,2})月(\d{1,2})日/;
            const matchA = dateA.match(dateRegex);
            const matchB = dateB.match(dateRegex);
            
            if (matchA && matchB) {
                const dateStrA = `${matchA[1]}-${matchA[2].padStart(2, '0')}-${matchA[3].padStart(2, '0')}`;
                const dateStrB = `${matchB[1]}-${matchB[2].padStart(2, '0')}-${matchB[3].padStart(2, '0')}`;
                
                const comparison = dateStrA.localeCompare(dateStrB);
                return sortBy === 'date-desc' ? -comparison : comparison;
            }
            return 0;
        } else if (sortBy === 'topic-asc') {
            // 按辩题字母顺序排序
            const topicA = a.querySelector('.history-topic').textContent;
            const topicB = b.querySelector('.history-topic').textContent;
            return topicA.localeCompare(topicB);
        }
        return 0;
    });
    
    // 重新排列元素
    historyItems.forEach(item => {
        historyList.appendChild(item);
    });
}

// 初始化删除功能
function initDeleteFeature() {
    const deleteButtons = document.querySelectorAll('.delete-btn');
    const deleteModal = document.getElementById('deleteModal');
    const closeModalBtn = document.querySelector('.close-modal');
    const cancelBtn = document.querySelector('.cancel-btn');
    const confirmDeleteBtn = document.querySelector('.confirm-delete-btn');
    
    let itemToDelete = null;
    
    // 点击删除按钮显示确认模态框
    deleteButtons.forEach(button => {
        button.addEventListener('click', function() {
            // 记录要删除的项目
            itemToDelete = this.closest('.history-item');
            
            // 显示确认模态框
            if (deleteModal) {
                deleteModal.style.display = 'flex';
            }
        });
    });
    
    // 关闭模态框
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', function() {
            deleteModal.style.display = 'none';
        });
    }
    
    // 点击取消按钮
    if (cancelBtn) {
        cancelBtn.addEventListener('click', function() {
            deleteModal.style.display = 'none';
        });
    }
    
    // 点击确认删除按钮
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', function() {
            if (itemToDelete) {
                // 删除该项记录
                deleteHistoryItem(itemToDelete);
                
                // 关闭模态框
                deleteModal.style.display = 'none';
            }
        });
    }
    
    // 点击模态框外部区域关闭模态框
    if (deleteModal) {
        deleteModal.addEventListener('click', function(event) {
            if (event.target === deleteModal) {
                deleteModal.style.display = 'none';
            }
        });
    }
}

// 删除历史记录项
function deleteHistoryItem(item) {
    // 获取要删除的辩题
    const topic = item.querySelector('.history-topic').textContent;
    
    // 从localStorage中删除
    const savedDebates = JSON.parse(localStorage.getItem('savedDebates') || '[]');
    const updatedDebates = savedDebates.filter(debate => debate.topic !== topic);
    
    localStorage.setItem('savedDebates', JSON.stringify(updatedDebates));
    
    // 从DOM中移除
    item.remove();
    
    // 如果没有记录了，显示空状态
    const remainingItems = document.querySelectorAll('.history-item');
    if (remainingItems.length === 0) {
        showEmptyState();
    }
}

// 初始化分页功能
function initPagination() {
    const paginationButtons = document.querySelectorAll('.pagination-btn');
    
    paginationButtons.forEach(button => {
        if (!button.disabled) {
            button.addEventListener('click', function() {
                // 取消当前激活的按钮
                document.querySelector('.pagination-btn.active')?.classList.remove('active');
                
                // 激活当前点击的按钮
                this.classList.add('active');
                
                // 如果是数字按钮，加载对应页的数据
                if (!this.innerHTML.includes('fa-chevron')) {
                    const page = parseInt(this.textContent);
                    loadPageData(page);
                } else {
                    // 如果是上一页/下一页按钮，计算要加载的页码
                    const currentPage = parseInt(document.querySelector('.pagination-btn.active')?.textContent) || 1;
                    let targetPage = currentPage;
                    
                    if (this.innerHTML.includes('fa-chevron-left')) {
                        targetPage = Math.max(1, currentPage - 1);
                    } else if (this.innerHTML.includes('fa-chevron-right')) {
                        const maxPage = 3; // 假设总共有3页
                        targetPage = Math.min(maxPage, currentPage + 1);
                    }
                    
                    // 更新激活状态
                    document.querySelector(`.pagination-btn:nth-child(${targetPage + 1})`)?.classList.add('active');
                    
                    // 加载目标页数据
                    loadPageData(targetPage);
                }
            });
        }
    });
}

// 加载指定页的数据
function loadPageData(page) {
    // 实际应用中，这里应该根据页码加载对应的数据
    // 这里为了演示，简单地模拟一下页面变化
    
    console.log(`加载第${page}页数据`);
    
    // 实际应用中应该是这样：
    // 1. 向服务器请求该页数据或从缓存中获取
    // 2. 清空当前列表
    // 3. 使用新数据重新渲染列表
    
    // 模拟页面切换效果
    const historyItems = document.querySelectorAll('.history-item');
    
    // 简单地隐藏/显示不同项目来模拟分页
    historyItems.forEach((item, index) => {
        const itemsPerPage = 2;
        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = page * itemsPerPage;
        
        if (index >= startIndex && index < endIndex) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
    
    // 更新分页按钮状态
    updatePaginationButtons(page);
} 