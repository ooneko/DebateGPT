package domain

import (
	"context"
	"os"
	"testing"
	"time"

	"llm-debate/internal/config"

	"github.com/stretchr/testify/assert"
)

func TestLLMJudge_Integration(t *testing.T) {
	// 跳过CI环境中的集成测试
	if os.Getenv("CI") == "true" {
		t.Skip("跳过集成测试")
	}

	// 加载真实配置
	cfg, err := config.LoadConfig("../../config.yaml")
	if err != nil {
		t.Fatalf("加载配置失败: %v", err)
	}

	// 初始化评委
	judge := NewLLMJudge(cfg)

	testCases := []struct {
		name     string
		argument string
		topic    string
		wantErr  bool
	}{
		{
			name:     "有效论点-科技",
			argument: "人工智能通过深度学习算法可以分析医学影像的细微异常，这比人类放射科医生平均准确率提高30%",
			topic:    "人工智能在医疗诊断中的应用",
		},
		{
			name:     "有效论点-教育",
			argument: "在线教育平台通过个性化学习路径推荐，可以使偏远地区学生获得与城市学生同等的优质教育资源",
			topic:    "在线教育的社会影响",
		},
		{
			name:     "边界情况-长论点",
			argument: `自动驾驶技术通过多传感器融合（包括激光雷达、摄像头、毫米波雷达）实现环境感知，结合高精度地图和V2X车路协同系统，可以在复杂城市道路中实现厘米级定位和毫秒级反应，这将比人类驾驶员的平均反应时间快200毫秒，有效减少90%以上的人为失误事故。`,
			topic:    "自动驾驶技术的安全性",
		},
		{
			name:     "无效论点-空内容",
			argument: "",
			topic:    "测试空论点",
			wantErr:  true,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			ctx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
			defer cancel()

			// 创建 DebateContext 对象，传入 topic 和默认轮次数（例如：3）
			debateCtx := NewDebateContext(tc.topic, 3)
			result, err := judge.Score(ctx, debateCtx, tc.argument)

			if tc.wantErr {
				assert.Error(t, err, "预期错误未发生")
				return
			}

			assert.NoError(t, err, "API调用失败")
			assert.InDelta(t, 5.0, result.Score, 5.0, "分数超出合理范围")
			assert.Greater(t, len(result.Feedback), 30, "评语应包含详细分析")

			// 验证分项评分
			assert.GreaterOrEqual(t, result.Logic, 0.0, "逻辑性评分异常")
			assert.LessOrEqual(t, result.Logic, 10.0, "逻辑性评分异常")
			assert.GreaterOrEqual(t, result.Evidence, 0.0, "论据评分异常")
			assert.LessOrEqual(t, result.Evidence, 10.0, "论据评分异常")
			assert.GreaterOrEqual(t, result.Counter, 0.0, "反驳评分异常")
			assert.LessOrEqual(t, result.Counter, 10.0, "反驳评分异常")
			assert.GreaterOrEqual(t, result.Language, 0.0, "语言评分异常")
			assert.LessOrEqual(t, result.Language, 10.0, "语言评分异常")
			assert.GreaterOrEqual(t, result.Strategy, 0.0, "战略评分异常")
			assert.LessOrEqual(t, result.Strategy, 10.0, "战略评分异常")
			assert.GreaterOrEqual(t, result.Psychological, 0.0, "心理评分异常")
			assert.LessOrEqual(t, result.Psychological, 10.0, "心理评分异常")
			assert.GreaterOrEqual(t, result.Innovation, 0.0, "创新评分异常")
			assert.LessOrEqual(t, result.Innovation, 10.0, "创新评分异常")

			t.Logf("\n测试用例: %s\n论点: %s\n主题: %s\n评分详情:\n  逻辑: %.1f\n  论据: %.1f\n  反驳: %.1f\n  语言: %.1f\n  战略: %.1f\n  心理: %.1f\n  创新: %.1f\n总评: %.1f\n反馈: %s",
				tc.name,
				shortenString(tc.argument, 50),
				tc.topic,
				result.Logic,
				result.Evidence,
				result.Counter,
				result.Language,
				result.Strategy,
				result.Psychological,
				result.Innovation,
				result.Score,
				result.Feedback,
			)
		})
	}
}

// 辅助函数：截断长字符串
func shortenString(s string, maxLen int) string {
	if len(s) <= maxLen {
		return s
	}
	return s[:maxLen] + "..."
}
