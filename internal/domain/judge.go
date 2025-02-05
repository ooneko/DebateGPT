package domain

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"

	"github.com/ooneko/DebateGPT/internal/client"
	"github.com/ooneko/DebateGPT/internal/config"

	"github.com/sashabaranov/go-openai"
)

// LLMJudge 使用大模型担任评委
type LLMJudge struct {
	client    *openai.Client
	model     string
	maxTokens int
}

func NewLLMJudge(cfg *config.Config) *LLMJudge {
	client := client.NewClient(cfg)
	return &LLMJudge{
		client:    client,
		model:     cfg.API.Model,
		maxTokens: cfg.API.MaxTokens,
	}
}

// Score 使用流式输出方式对论点进行评分，并实时输出评分结果。
// 修改后：接收 DebateContext 参数，从中获取历史发言，并结合历史发言和当前论点进行评分
func (j *LLMJudge) Score(ctx context.Context, debateContext *DebateContext, argument string) (EvaluationResult, error) {
	// 参数检查
	if len(argument) == 0 {
		return EvaluationResult{}, fmt.Errorf("论点不能为空")
	}
	if len(debateContext.Topic) == 0 {
		return EvaluationResult{}, fmt.Errorf("主题不能为空")
	}

	// 根据 DebateContext 中的历史发言构造评分所需的历史记录字符串
	var historyStr string
	for _, action := range debateContext.History {
		historyStr += fmt.Sprintf("[%s]: %s\n", action.ActorID, action.Content)
	}

	// 构造详细评分提示，将历史发言和当前论点一起提供给评委
	prompt := fmt.Sprintf(`作为专业评委，请根据以下标准评价辩论表现：
主题：%s
历史发言：
%s
当前论点：%s

# 核心评价维度
## 逻辑构建
- 论点是否形成完整逻辑链（前提→推论→结论）
- 是否存在逻辑漏洞（偷换概念/循环论证/滑坡谬误等）
- 对对方逻辑漏洞的捕捉能力
- 数据使用是否形成有效支撑（统计口径/数据时效性/相关性≠因果性）
## 论据质量
- 证据来源的权威性（学术期刊＞媒体报道＞个人博客）
- 证据的时效性（近3年数据＞10年前数据）
- 案例的典型性和适配度（是否切合辩题场景）
- 理论运用的准确性（是否曲解原理论）
## 反驳技巧
- 预判式反驳（提前封堵对方可能论点）
- 即时拆解能力（对方发言后30秒内组织有效反击）
- 归谬法的运用水平
- 是否建立反驳优先级（核心论点＞次要论点）
## 语言表达
- 信息密度（有效信息/分钟）
- 话术技巧（类比/排比/设问等修辞运用）
- 语言规范性（避免口头禅/冗余表述）
- 语调掌控（重点强调/情感渲染的合理性）
# 进阶评价指标
## 战略维度
- 战场预设与把控（是否主导讨论框架）
- 资源分配合理性（主辩/结辩的角色差异）
- 时间利用效率（核心论点是否获得充分论述时间）
## 心理博弈
- 情绪引导能力（制造认知共鸣/引发危机感）
- 压力测试表现（面对质询时的稳定性）
- 优势扩大与劣势转化能力
## 创新维度
- 论点新颖性（是否突破常规认知框架）
- 论证范式创新（跨学科视角/非传统分析工具）
- 案例的独创性挖掘

# 评分范围
1. 逻辑构建（0-10分）
2. 论据质量（0-10分）
3. 反驳技巧（0-10分）
4. 语言表达（0-10分）
5. 战略维度（0-10分）
6. 心理博弈（0-10分）
7. 创新维度（0-10分）

请确保只返回JSON格式，不要返回任何其他内容：
{
	"logic_score": 0-10,
	"evidence_score": 0-10,
	"counter_score": 0-10,
	"language_score": 0-10,
	"strategy_score": 0-10,
	"psychological_score": 0-10,
	"innovation_score": 0-10,
	"score": 0-10,
	"feedback": "综合评价及评价理由",
}`, debateContext.Topic, historyStr, argument)

	// 使用流式输出调用大模型接口
	stream, err := j.client.CreateChatCompletionStream(ctx, openai.ChatCompletionRequest{
		Model:     j.model,
		MaxTokens: j.maxTokens,
		Stream:    true,
		Messages: []openai.ChatCompletionMessage{
			{
				Role:    openai.ChatMessageRoleUser,
				Content: prompt,
			},
		},
	})
	if err != nil {
		return EvaluationResult{}, fmt.Errorf("API请求失败: %w", err)
	}
	defer stream.Close()

	var output string

	// 持续读取流式输出并实时打印
	for {
		response, err := stream.Recv()
		if err != nil {
			if errors.Is(err, io.EOF) {
				break
			}
			return EvaluationResult{}, fmt.Errorf("流接收错误: %w", err)
		}
		chunk := response.Choices[0].Delta.Content
		fmt.Print(chunk) // 实时打印流式输出
		output += chunk
	}
	fmt.Println()

	// 解析响应
	var partialResult struct {
		Logic         float64 `json:"logic_score"`
		Evidence      float64 `json:"evidence_score"`
		Counter       float64 `json:"counter_score"`
		Language      float64 `json:"language_score"`
		Strategy      float64 `json:"strategy_score"`
		Psychological float64 `json:"psychological_score"`
		Innovation    float64 `json:"innovation_score"`
		Score         float64 `json:"score"`
		Feedback      string  `json:"feedback"`
	}

	if err := json.Unmarshal([]byte(output), &partialResult); err != nil {
		log.Printf("响应解析失败: %v", err)
		log.Printf("响应内容: %s", output)
		return EvaluationResult{}, fmt.Errorf("响应解析失败: %w", err)
	}

	// 验证评分范围
	if partialResult.Logic < 0 || partialResult.Logic > 10 ||
		partialResult.Counter < 0 || partialResult.Counter > 10 ||
		partialResult.Language < 0 || partialResult.Language > 10 ||
		partialResult.Strategy < 0 || partialResult.Strategy > 10 ||
		partialResult.Psychological < 0 || partialResult.Psychological > 10 ||
		partialResult.Innovation < 0 || partialResult.Innovation > 10 {
		return EvaluationResult{}, fmt.Errorf("无效的评分范围")
	}

	log.Printf("详细评分结果: 逻辑=%f 论据=%f 反驳=%f 语言=%f 战略=%f 心理=%f 创新=%f 总评=%f",
		partialResult.Logic, partialResult.Evidence, partialResult.Counter, partialResult.Language, partialResult.Strategy, partialResult.Psychological, partialResult.Innovation, partialResult.Score)

	return EvaluationResult{
		Score:         partialResult.Score,
		Feedback:      partialResult.Feedback,
		Logic:         partialResult.Logic,
		Innovation:    partialResult.Innovation,
		Counter:       partialResult.Counter,
		Language:      partialResult.Language,
		Strategy:      partialResult.Strategy,
		Psychological: partialResult.Psychological,
	}, nil
}

// 更新评价结果结构体
type EvaluationResult struct {
	Logic         float64 `json:"logic_score"`
	Evidence      float64 `json:"evidence_score"`
	Counter       float64 `json:"counter_score"`
	Language      float64 `json:"language_score"`
	Strategy      float64 `json:"strategy_score"`
	Psychological float64 `json:"psychological_score"`
	Innovation    float64 `json:"innovation_score"`
	Score         float64 `json:"score"`
	Feedback      string  `json:"feedback"`
}
