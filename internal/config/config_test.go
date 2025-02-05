package config_test

import (
	"testing"
	"time"

	"github.com/ooneko/DebateGPT/internal/config"

	"github.com/stretchr/testify/assert"
)

func TestLoadConfig(t *testing.T) {
	yamlContent := `
api:
  endpoint: "https://ark.cn-beijing.volces.com/api/v3"
  key: "test"
  model: "gpt4o"
  max_tokens: 1000
  timeout: 600s
`
	// 使用替换函数模拟文件读取：返回 yamlContent 的内容
	originalReadFile := config.ReadFile
	config.ReadFile = func(filename string) ([]byte, error) {
		return []byte(yamlContent), nil
	}
	defer func() { config.ReadFile = originalReadFile }()

	// 传入任意字符串作为文件名（此处使用 "dummy"）
	cfg, err := config.LoadConfig("dummy")
	assert.NoError(t, err)

	assert.Equal(t, "https://ark.cn-beijing.volces.com/api/v3", cfg.API.Endpoint)
	assert.Equal(t, 600*time.Second, cfg.API.Timeout) // 验证实际配置值
}
