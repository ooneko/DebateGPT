package client

import (
	"github.com/ooneko/DebateGPT/internal/config"

	"github.com/sashabaranov/go-openai"
)

// NewClient 创建OpenAI兼容客户端
func NewClient(cfg *config.Config) *openai.Client {
	clientConfig := openai.DefaultConfig(cfg.API.Key)
	clientConfig.BaseURL = cfg.API.Endpoint
	return openai.NewClientWithConfig(clientConfig)
}
