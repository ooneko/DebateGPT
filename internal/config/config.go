package config

import (
	"fmt"
	"os"
	"time"

	"gopkg.in/yaml.v3"
)

var ReadFile = os.ReadFile

// Config 定义完整的配置结构
type Config struct {
	API struct {
		Endpoint  string        `yaml:"endpoint"`
		Key       string        `yaml:"key"`
		Model     string        `yaml:"model"`
		MaxTokens int           `yaml:"max_tokens"`
		Timeout   time.Duration `yaml:"timeout"`
	} `yaml:"api"`
	Server struct {
		Port         int           `yaml:"port"`
		ReadTimeout  time.Duration `yaml:"read_timeout"`
		WriteTimeout time.Duration `yaml:"write_timeout"`
	} `yaml:"server"`
}

// LoadConfig 加载并验证配置
func LoadConfig(filename string) (*Config, error) {
	data, err := ReadFile(filename)
	if err != nil {
		return nil, fmt.Errorf("读取配置文件失败: %v", err)
	}

	var cfg Config
	if err := yaml.Unmarshal(data, &cfg); err != nil {
		return nil, fmt.Errorf("解析配置文件失败: %v", err)
	}

	// 验证必要配置项
	if cfg.API.Key == "" {
		return nil, fmt.Errorf("缺少API密钥(api.key)")
	}
	if cfg.API.Model == "" {
		return nil, fmt.Errorf("缺少模型名称(api.model)")
	}

	// 设置默认值
	if cfg.API.Endpoint == "" {
		cfg.API.Endpoint = "https://api.openai.com/v1"
	}
	if cfg.API.MaxTokens == 0 {
		cfg.API.MaxTokens = 1000
	}
	if cfg.API.Timeout == 0 {
		cfg.API.Timeout = 30 * time.Second
	}

	// 验证数值范围
	if cfg.API.MaxTokens < 100 || cfg.API.MaxTokens > 100000 {
		return nil, fmt.Errorf("max_tokens值无效，应在100-100000之间")
	}

	return &cfg, nil
}
