package rest

import (
	"github.com/gin-gonic/gin"
	"github.com/ooneko/DebateGPT/internal/application"
)

func NewRouter(appService *application.DebateAppService) *gin.Engine {
	router := gin.Default()

	// 添加中间件
	router.Use(gin.Logger())
	router.Use(gin.Recovery())

	// 注册路由
	debateHandler := NewDebateHandler(appService)

	api := router.Group("/api")
	{
		api.POST("/debates", debateHandler.CreateDebate)
		api.GET("/debates/:id", debateHandler.GetDebateStatus)
		api.GET("/debates/:id/result", debateHandler.GetDebateResult)
		api.GET("/debates/:id/history", debateHandler.GetDebateHistory)
	}

	return router
}
