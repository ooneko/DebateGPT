package main

import (
	"fmt"
	"log"
	"net/http"

	"github.com/ooneko/DebateGPT/internal/application"
	"github.com/ooneko/DebateGPT/internal/config"
	"github.com/ooneko/DebateGPT/internal/domain"
	"github.com/ooneko/DebateGPT/internal/interfaces/rest"
)

func main() {
	cfg, err := config.LoadConfig("config.yaml")
	if err != nil {
		log.Fatalf("加载配置失败: %v", err)
	}

	// 初始化领域层
	debateService := domain.NewDebateService(cfg)

	// 初始化应用层
	appService := application.NewDebateAppService(debateService)

	// 启动HTTP服务器
	router := rest.NewRouter(appService)

	srv := &http.Server{
		Addr:         fmt.Sprintf(":%d", cfg.Server.Port),
		Handler:      router,
		ReadTimeout:  cfg.Server.ReadTimeout,
		WriteTimeout: cfg.Server.WriteTimeout,
	}

	log.Printf("启动服务在 :%d", cfg.Server.Port)
	if err := srv.ListenAndServe(); err != nil {
		log.Fatalf("服务器启动失败: %v", err)
	}
}
