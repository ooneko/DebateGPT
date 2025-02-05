package config_test

import (
	"testing"
	"time"

	"github.com/ooneko/DebateGPT/internal/config"

	"github.com/stretchr/testify/assert"
)

func TestLoadConfig(t *testing.T) {
	cfg, err := config.LoadConfig("../../config.yaml")
	assert.NoError(t, err)

	assert.Equal(t, "https://ark.cn-beijing.volces.com/api/v3", cfg.API.Endpoint)
	assert.Equal(t, 600*time.Second, cfg.API.Timeout) // 验证实际配置值
}
