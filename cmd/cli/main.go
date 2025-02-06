package main

import (
	"context"
	"flag"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/ooneko/DebateGPT/internal/config"
	"github.com/ooneko/DebateGPT/internal/domain"
)

func main() {
	// 加载配置文件
	cfg, err := config.LoadConfig("config.yaml")
	if err != nil {
		log.Fatalf("配置加载失败: %v", err)
	}

	// 定义命令行参数
	topic := flag.String("topic", "", "辩论主题")
	rounds := flag.Int("rounds", 3, "最大轮次")
	flag.Parse()

	// 验证必要参数
	if *topic == "" {
		fmt.Println("错误：必须指定辩论主题 (-topic)")
		os.Exit(1)
	}

	// 创建辩论服务，使用自动化的辩论流程
	debateService := domain.NewDebateService(cfg)

	// 设置全局上下文，超时时间按轮次数量进行扩展
	ctx, cancel := context.WithTimeout(context.Background(), time.Duration(*rounds)*cfg.API.Timeout)
	defer cancel()

	// 运行自动辩论流程
	result, err := debateService.RunDebate(ctx, *topic, *rounds)
	if err != nil {
		log.Fatalf("辩论运行失败: %v", err)
	}

	// 显示最终结果
	fmt.Printf("辩论结束！\n")
	fmt.Printf("辩论主题: %s\n", result.Topic)
	fmt.Printf("总轮次: %d\n", result.TotalRounds)
	fmt.Printf("正方总分: %.1f\n", result.ProponentScore)
	fmt.Printf("反方总分: %.1f\n", result.OpponentScore)
	fmt.Printf("赢家: %s\n", result.Winner)
}
