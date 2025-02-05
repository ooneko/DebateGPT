package domain

import (
	"context"
	"errors"
	"fmt"
	"io"
	"time"

	"github.com/ooneko/DebateGPT/internal/client"
	"github.com/ooneko/DebateGPT/internal/config"

	"github.com/google/uuid"
	"github.com/sashabaranov/go-openai"
)

// DebateAction 表示辩论中的一个行动
type DebateAction struct {
	ID        string    // 行动ID
	Type      string    // 行动类型（如：提出论点、反驳等）
	Content   string    // 行动内容
	Timestamp time.Time // 行动发生时间
	ActorID   string    // 执行者ID（红方/蓝方）
}

// 添加辩论状态枚举类型
type DebateStatus string

const (
	DebateStatusOngoing  DebateStatus = "ONGOING"
	DebateStatusFinished DebateStatus = "FINISHED"
)

// DebateContext 定义辩论上下文（新增）
type DebateContext struct {
	ID        string         // 辩论ID
	Topic     string         // 辩论主题
	Round     int            // 当前轮次
	MaxRounds int            // 最大轮次
	Status    DebateStatus   // 修改为枚举类型
	History   []DebateAction // 行动历史
	RedScore  float64        // 红方总分
	BlueScore float64        // 蓝方总分
	CreatedAt time.Time      // 创建时间
	UpdatedAt time.Time      // 最后更新时间
}

// NewDebateContext 创建新的辩论上下文（更新版）
func NewDebateContext(topic string, maxRounds int) *DebateContext {
	now := time.Now()
	return &DebateContext{
		ID:        uuid.New().String(),
		Topic:     topic,
		Round:     1,
		MaxRounds: maxRounds,
		Status:    DebateStatusOngoing, // 使用枚举常量
		History:   make([]DebateAction, 0),
		RedScore:  0,
		BlueScore: 0,
		CreatedAt: now,
		UpdatedAt: now,
	}
}

// AddAction 添加一个辩论行动
func (ctx *DebateContext) AddAction(actionType string, content string, actorID string) {
	action := DebateAction{
		ID:        uuid.New().String(),
		Type:      actionType,
		Content:   content,
		Timestamp: time.Now(),
		ActorID:   actorID,
	}
	ctx.History = append(ctx.History, action)
}

// UpdateScores 更新双方得分
func (ctx *DebateContext) UpdateScores(redScore, blueScore float64) {
	ctx.RedScore = redScore
	ctx.BlueScore = blueScore
}

// NextRound 进入下一轮
func (ctx *DebateContext) NextRound() bool {
	if ctx.Round >= ctx.MaxRounds {
		return false
	}
	ctx.Round++
	return true
}

// EndDebate 结束辩论
func (ctx *DebateContext) EndDebate() {
	now := time.Now()
	ctx.UpdatedAt = now
	ctx.Status = DebateStatusFinished // 使用枚举常量
}

// 添加AI辩论服务
type AIDebater struct {
	client    *openai.Client
	model     string
	maxTokens int
}

func NewAIDebater(cfg *config.Config) *AIDebater {
	return &AIDebater{
		client:    client.NewClient(cfg),
		model:     cfg.API.Model,
		maxTokens: cfg.API.MaxTokens,
	}
}

// GenerateArgument 通过流式输出生成AI论点，实时打印响应内容
func (d *AIDebater) GenerateArgument(ctx context.Context, debateContext *DebateContext, side string) (string, error) {
	// 构建历史记录提示
	historyPrompt := "以下是辩论历史记录：\n"
	for _, action := range debateContext.History {
		historyPrompt += fmt.Sprintf("[%s方 第%d轮] %s\n", action.ActorID, debateContext.Round, action.Content)
	}

	prompt := fmt.Sprintf(`你作为%s方辩手，正在参与关于'%s'的辩论（当前第%d轮/共%d轮）。
请注意使用如下辩论技巧：
# 准备阶段
1. 深度破题
定义拆解：区分「应然」与「实然」层面（如辩题"AI应取代人类法官"需明确"取代"标准是辅助决策/完全替代）
战场预判：绘制双方可能的核心论点图谱（用MECE原则确保分类穷尽且互斥）
价值分层：识别表层争议点（效率提升）与深层价值冲突 (司法公正与技术异化）

2. 证据体系搭建
建立三级证据库：
核心证据（权威机构5年内数据）
辅助案例（典型国家/行业实践）
理论武器（法学中的程序正义理论、AI领域的莫拉维克悖论）
使用「金字塔原理」结构化存储：结论→分论点→数据支撑

3. 战术沙盘
设计攻防矩阵：
防守侧：预埋「防切割点」（如承认AI辅助价值但否定替代可能性）
攻击侧：准备「归谬弹药」（若对方主张AI无偏见，则用COMPAS算法歧视案例反证）

# 立论阶段（首轮发言）
1. 框架构建
使用「三层次立论法」：事实层、逻辑层、价值层

2. 锚定技术
植入「认知坐标」：
对比标准：「效率提升≠制度革新」
重新定义：「取代」应指系统主导权转移
使用「冰山模型」呈现：显性论点（20%%）+隐性价值（80%%）

# 攻防对抗阶段
1. 质询策略
SEDA模型：
Setup（设问铺垫）："您方是否承认AI存在算法黑箱？"
Engage（锁定回答）："请明确回答是或不是"
Develop（纵深切入）："既然承认，如何保证审判透明度？"
Anchor（结论锚定）："可见AI无法满足司法公开原则"

2. 反驳技术
四步拆解法：
指认：锁定对方论点（您方第二个论点称AI提升效率）
切割：区分事实与推论（数据真实≠结论成立）
解构：揭示逻辑断层（效率≠正义）
重构：植入己方框架（正义需要人类价值判断）

3. 战场控制
使用「红绿灯法则」：
绿灯区：主动引导至己方预设战场（技术伦理）
黄灯区：模糊地带快速过渡（技术迭代速度）
红灯区：坚决切割不利讨论（具体算法细节）

# 总结阶段（结辩）
1. 升维打击
跳出原有框架，进行价值升华：
"这不是技术能否的问题，而是人类是否准备好将终极裁判权交给没有同理心的机器"
2. 记忆点塑造
使用「三重复现」：
金句收束（"代码可以计算得失，但无法称量灵魂的重量"）
意象强化（"当法槌变成电路板..."）
首尾呼应（回归开场案例的新解读）

# 高阶技巧
认知操控术：
制造「语义场域」（将AI定义为"工具"而非"主体"）
运用「认知失调」（强调对方主张与基本法理冲突）
数据武器化：
精确打击：准备数据反例（"您方引用的95%%准确率实为实验室数据"）
维度转换："效率提升30%%的代价是15%%的误判率，这是否符合比例原则？"
心理战法：
压力测试：连续追问迫使对方进入防御状态
情感共振：在价值层发言时降低语速，增强眼神交流

# 避坑指南
逻辑雷区：
避免「稻草人谬误」（曲解对方观点）
警惕「举证倒置」（要求对方证伪需先自证）
表达禁忌：
忌「绝对化表述」（必须/必然→可能/倾向于）
忌「专业术语堆砌」（用"算法偏见"替代"非监督学习中的标签偏差"）
团队协同：
采用「接力式论证」：前位埋设论点，后位收割发展
建立「暗号系统」：手势/关键词提示战场转移


请参考前几轮的发言：
%s
请发表新的论点：`,
		side,
		debateContext.Topic,
		debateContext.Round,
		debateContext.MaxRounds,
		historyPrompt)

	// 使用流式输出调用大模型接口
	stream, err := d.client.CreateChatCompletionStream(ctx, openai.ChatCompletionRequest{
		Model:     d.model,
		MaxTokens: d.maxTokens,
		Stream:    true,
		Messages: []openai.ChatCompletionMessage{
			{
				Role:    openai.ChatMessageRoleSystem,
				Content: "你是一个专业辩论选手，能够根据历史发言进行有针对性的论点阐述",
			},
			{
				Role:    openai.ChatMessageRoleUser,
				Content: prompt,
			},
		},
	})
	if err != nil {
		return "", fmt.Errorf("API请求失败: %w", err)
	}
	defer stream.Close()

	var result string

	// 持续读取流式输出并实时打印
	for {
		response, err := stream.Recv()
		if err != nil {
			if errors.Is(err, io.EOF) {
				break
			}
			return "", fmt.Errorf("流接收错误: %w", err)
		}
		chunk := response.Choices[0].Delta.Content
		fmt.Print(chunk) // 实时打印流式输出
		result += chunk
	}
	fmt.Println()

	return result, nil
}

// 添加辩论服务
type DebateService struct {
	Judge   Judge
	Debater Debater
	Storage DebateStorage
}

// 辩论流程控制
func (s *DebateService) RunDebate(ctx context.Context, topic string, rounds int) (*DebateResult, error) {
	if rounds <= 0 {
		return nil, fmt.Errorf("轮次必须大于0")
	}

	debateCtx := NewDebateContext(topic, rounds) // 创建辩论上下文

	for debateCtx.Round <= debateCtx.MaxRounds {
		// 红方发言
		redArg, err := s.Debater.GenerateArgument(ctx, debateCtx, "RED")
		if err != nil {
			return nil, fmt.Errorf("红方论点生成失败: %w", err)
		}
		debateCtx.AddAction("ARGUMENT", redArg, "RED") // 记录到历史

		// 蓝方发言
		blueArg, err := s.Debater.GenerateArgument(ctx, debateCtx, "BLUE")
		if err != nil {
			return nil, fmt.Errorf("蓝方论点生成失败: %w", err)
		}
		debateCtx.AddAction("ARGUMENT", blueArg, "BLUE") // 记录到历史

		// 评分和记录（将当前 DebateContext 传入评分方法，以便评委参考历史发言）
		redScore, err := s.Judge.Score(ctx, debateCtx, redArg)
		if err != nil {
			return nil, fmt.Errorf("红方评分失败: %w", err)
		}
		blueScore, err := s.Judge.Score(ctx, debateCtx, blueArg)
		if err != nil {
			return nil, fmt.Errorf("蓝方评分失败: %w", err)
		}

		s.Storage.RecordRound(debateCtx.Round, redArg, blueArg, redScore.Score, blueScore.Score)

		// 进入下一轮
		if !debateCtx.NextRound() {
			break
		}
	}

	debateCtx.EndDebate()

	// 将辩论结果中的Topic字段设置为当前辩论的主题
	result := s.Storage.GetResult()
	result.Topic = topic
	return result, nil
}

// 添加辩论结果结构体
type DebateResult struct {
	Topic       string
	TotalRounds int
	RedScore    float64
	BlueScore   float64
	Winner      string
	Details     []RoundResult
}

type RoundResult struct {
	Round        int
	RedArgument  string
	BlueArgument string
	RedScore     float64
	BlueScore    float64
}

// 添加内存存储实现
type MemoryStorage struct {
	results []RoundResult
}

func (m *MemoryStorage) RecordRound(round int, redArg, blueArg string, redScore, blueScore float64) {
	m.results = append(m.results, RoundResult{
		Round:        round,
		RedArgument:  redArg,
		BlueArgument: blueArg,
		RedScore:     redScore,
		BlueScore:    blueScore,
	})
}

func (m *MemoryStorage) GetResult() *DebateResult {
	totalRed := 0.0
	totalBlue := 0.0
	for _, r := range m.results {
		totalRed += r.RedScore
		totalBlue += r.BlueScore
	}

	winner := "平局"
	if totalRed > totalBlue {
		winner = "红方"
	} else if totalBlue > totalRed {
		winner = "蓝方"
	}

	return &DebateResult{
		TotalRounds: len(m.results),
		RedScore:    totalRed,
		BlueScore:   totalBlue,
		Winner:      winner,
		Details:     m.results,
	}
}

// 添加构造函数
func NewDebateService(cfg *config.Config) *DebateService {
	return &DebateService{
		Judge:   NewLLMJudge(cfg),
		Debater: NewAIDebater(cfg),
		Storage: &MemoryStorage{},
	}
}
