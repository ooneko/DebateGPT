package rest

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/ooneko/DebateGPT/internal/application"
)

type DebateHandler struct {
	appService *application.DebateAppService
}

func NewDebateHandler(appService *application.DebateAppService) *DebateHandler {
	return &DebateHandler{appService: appService}
}

// @Summary 创建新辩论
// @Description 创建新的AI辩论
// @Tags debates
// @Accept  json
// @Produce  json
// @Param   input  body      CreateDebateRequest  true  "辩论参数"
// @Success 201 {object} DebateResponse
// @Router /api/debates [post]
func (h *DebateHandler) CreateDebate(c *gin.Context) {
	var req CreateDebateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 输入验证
	if req.Topic == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "辩论主题不能为空"})
		return
	}
	if req.MaxRounds <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "辩论轮次必须大于0"})
		return
	}

	// 调用应用服务
	dto, err := h.appService.CreateDebate(c.Request.Context(), application.CreateDebateCommand{
		Topic:     req.Topic,
		MaxRounds: req.MaxRounds,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, DebateResponse{
		ID:           dto.ID,
		Topic:        dto.Topic,
		CurrentRound: dto.CurrentRound,
		Status:       string(dto.Status),
	})
}

// 请求响应结构体
type CreateDebateRequest struct {
	Topic     string `json:"topic" binding:"required"`
	MaxRounds int    `json:"max_rounds" binding:"required,min=1"`
}

type DebateResponse struct {
	ID           string `json:"id"`
	Topic        string `json:"topic"`
	CurrentRound int    `json:"current_round"`
	Status       string `json:"status"`
}
