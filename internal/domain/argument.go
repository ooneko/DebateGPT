package domain

import (
	"time"

	"github.com/google/uuid"
)

// ArgumentStatus 表示论点的当前状态
type ArgumentStatus string

const (
	Proposed ArgumentStatus = "PROPOSED" // 已提出
	Refuted  ArgumentStatus = "REFUTED"  // 已反驳
	Retired  ArgumentStatus = "RETIRED"  // 已失效
)

// ArgumentNode 定义论点树的节点结构
type ArgumentNode struct {
	ID        string          // 论点唯一标识
	Content   string          // 论点内容
	Status    ArgumentStatus  // 当前状态
	ParentID  string          // 父论点ID（被反驳的论点）
	Children  []*ArgumentNode // 子论点（反驳论点）
	CreatedAt time.Time       // 创建时间
	UpdatedAt time.Time       // 更新时间
	Score     float64         // 评委评分
}

// NewArgumentNode 创建新的论点节点
func NewArgumentNode(content string, parentID string) *ArgumentNode {
	now := time.Now()
	return &ArgumentNode{
		ID:        uuid.New().String(),
		Content:   content,
		Status:    Proposed,
		ParentID:  parentID,
		Children:  make([]*ArgumentNode, 0),
		CreatedAt: now,
		UpdatedAt: now,
		Score:     0,
	}
}

// AddChild 添加子论点
func (n *ArgumentNode) AddChild(child *ArgumentNode) {
	n.Children = append(n.Children, child)
	n.UpdateStatus(Refuted)
}

// UpdateStatus 更新论点状态
func (n *ArgumentNode) UpdateStatus(status ArgumentStatus) {
	n.Status = status
	n.UpdatedAt = time.Now()
}
