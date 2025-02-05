package domain_test

import (
	"context"
	"llm-debate/internal/config"
	"llm-debate/internal/domain"
	"os"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

// 集成测试配置（需要设置环境变量）
var testConfig *config.Config

func TestMain(m *testing.M) {
	// 加载测试配置（假设有测试用的配置文件）
	var err error
	testConfig, err = config.LoadConfig("../../config.yaml")
	if err != nil {
		panic("加载测试配置失败: " + err.Error())
	}

	// 设置API密钥（如果环境变量未设置）
	if os.Getenv("OPENAI_API_KEY") == "" {
		_ = os.Setenv("OPENAI_API_KEY", "sk-test-key") // 替换为有效测试密钥
	}

	os.Exit(m.Run())
}

func TestDebateFlow(t *testing.T) {
	if testing.Short() {
		t.Skip("跳过集成测试")
	}

	// 初始化服务
	service := domain.NewDebateService(testConfig)
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
	defer cancel()

	// 执行辩论
	topic := "人工智能是否会对人类构成威胁"
	result, err := service.RunDebate(ctx, topic, 2) // 测试2轮辩论

	// 验证结果
	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, 2, result.TotalRounds)
	assert.True(t, result.RedScore > 0, "红方得分应大于0")
	assert.True(t, result.BlueScore > 0, "蓝方得分应大于0")
	assert.Contains(t, []string{"红方", "蓝方", "平局"}, result.Winner)

	// 验证回合细节
	for _, round := range result.Details {
		assert.NotEmpty(t, round.RedArgument)
		assert.NotEmpty(t, round.BlueArgument)
		assert.True(t, round.RedScore > 0, "红方单轮得分应大于0")
		assert.True(t, round.BlueScore > 0, "蓝方单轮得分应大于0")
	}
}

func TestDebateWithDifferentTopics(t *testing.T) {
	if testing.Short() {
		t.Skip("跳过集成测试")
	}

	testCases := []struct {
		name  string
		topic string
	}{
		{"科技类", "自动驾驶汽车应该优先保护乘客还是行人"},
		{"伦理类", "人类应该追求永生吗"},
		{"社会类", "社交媒体是否改善了人际关系"},
	}

	service := domain.NewDebateService(testConfig)
	ctx := context.Background()

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			result, err := service.RunDebate(ctx, tc.topic, 1)
			assert.NoError(t, err)
			assert.Contains(t, []string{"红方", "蓝方", "平局"}, result.Winner)
			assert.Equal(t, tc.topic, result.Topic)
		})
	}
}

// 测试边界情况
func TestDebateEdgeCases_Integration(t *testing.T) {
	if testing.Short() {
		t.Skip("跳过集成测试")
	}

	service := domain.NewDebateService(testConfig)

	t.Run("零轮次测试", func(t *testing.T) {
		ctx := context.Background()
		_, err := service.RunDebate(ctx, "测试主题", 0)
		assert.Error(t, err)
	})

	t.Run("长文本主题测试", func(t *testing.T) {
		ctx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
		defer cancel()

		longTopic := `人工智能的发展应该受到严格监管，因为：
1. 可能带来就业市场冲击
2. 存在算法偏见风险
3. 可能被恶意利用
4. 需要确保符合伦理规范`

		result, err := service.RunDebate(ctx, longTopic, 2)
		assert.NoError(t, err)
		assert.Equal(t, 2, result.TotalRounds)
	})
}
