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
	Position  Position  // 正方/反方
}

type Position string
type DebateStatus string

const (
	Proponent Position = "Proponent" // 正方
	Opponent  Position = "Opponent"  // 反方
)

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
func (ctx *DebateContext) AddAction(actionType string, content string, position Position) {
	action := DebateAction{
		ID:        uuid.New().String(),
		Type:      actionType,
		Content:   content,
		Timestamp: time.Now(),
		Position:  position,
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
func (d *AIDebater) GenerateArgument(ctx context.Context, debateContext *DebateContext, side Position) (string, error) {
	// 构建历史记录提示
	historyPrompt := "以下是辩论历史记录：\n"
	for _, action := range debateContext.History {
		historyPrompt += fmt.Sprintf("[%s方 第%d轮] %s\n", action.Position, debateContext.Round, action.Content)
	}

	prompt := fmt.Sprintf(`你是一位经验丰富、风格鲜明的%s方辩手，正参与关于“%s”的辩论。你需要在论述中自然而然地融合数据支撑、逻辑推演以及对公平、正义等核心价值的考量，让你的观点既有说服力又能触动人心。（当前第%d轮/共%d轮）

任务要求：

深入解析议题：
分析“取代”这一概念时，要注意区分“辅助决策”与“完全替代”的不同含义。
探讨议题背后的表面现象和深层次的价值冲突，如效率提升与制度公正之间的矛盾。
构建论证框架：
预测对手可能的观点，形成一个全面但不重叠的论点结构。
依据最新权威数据、典型案例和相关理论（例如程序正义或算法偏见）为你的观点提供支撑，让论述既有理有据，又不失情感温度。
论述风格：
用平实生动的语言陈述观点，避免过于刻板地标记各层次。
适当融入幽默或生动比喻（比如“代码能计算误判率，但无法衡量法槌敲击心灵的力量”），让论点更有亲和力。
强调数据、逻辑与价值之间的内在联系，既注重严谨性也不失人文关怀。
辩论策略：
在质疑对手时，既要精准指出其逻辑漏洞，又要注意措辞温和，避免绝对化表述。
可以运用循序渐进的攻防策略，从问题铺垫、锁定关键、深入挖掘，到最终总结归纳，让听众在逐步推进中接受你的观点

同时，请参考前几轮的发言：
%s
请发表新的论点：`,
		side,
		debateContext.Topic,
		debateContext.Round,
		debateContext.MaxRounds,
		historyPrompt)

	if side == Proponent {
		fmt.Printf("\n 正方发言：")
	} else {
		fmt.Printf("\n 反方发言：")
	}
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
		// 正方发言
		proponentArg, err := s.Debater.GenerateArgument(ctx, debateCtx, Proponent)
		if err != nil {
			return nil, fmt.Errorf("正方论点生成失败: %w", err)
		}
		debateCtx.AddAction("ARGUMENT", proponentArg, Proponent) // 记录到历史

		// 反方发言
		opponentArg, err := s.Debater.GenerateArgument(ctx, debateCtx, Opponent)
		if err != nil {
			return nil, fmt.Errorf("反方论点生成失败: %w", err)
		}
		debateCtx.AddAction("ARGUMENT", opponentArg, Opponent) // 记录到历史

		// 评分和记录（将当前 DebateContext 传入评分方法，以便评委参考历史发言）
		proponentScore, err := s.Judge.Score(ctx, debateCtx, proponentArg)
		if err != nil {
			return nil, fmt.Errorf("正方评分失败: %w", err)
		}
		opponentScore, err := s.Judge.Score(ctx, debateCtx, opponentArg)
		if err != nil {
			return nil, fmt.Errorf("反方评分失败: %w", err)
		}

		s.Storage.RecordRound(debateCtx.Round, proponentArg, opponentArg, proponentScore.Score, opponentScore.Score)

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
	Topic          string
	TotalRounds    int
	ProponentScore float64
	OpponentScore  float64
	Winner         string
	Details        []RoundResult
}

type RoundResult struct {
	Round             int
	ProponentArgument string
	OpponentArgument  string
	ProponentScore    float64
	OpponentScore     float64
}

// 添加构造函数
func NewDebateService(cfg *config.Config) *DebateService {
	return &DebateService{
		Judge:   NewLLMJudge(cfg),
		Debater: NewAIDebater(cfg),
		Storage: &MemoryStorage{},
	}
}
