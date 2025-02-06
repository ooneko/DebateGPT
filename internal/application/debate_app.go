package application

import (
	"context"

	"github.com/ooneko/DebateGPT/internal/domain"
)

// DebateAppService 应用服务
type DebateAppService struct {
	debateService *domain.DebateService
}

func NewDebateAppService(debateService *domain.DebateService) *DebateAppService {
	return &DebateAppService{debateService: debateService}
}

// CreateDebateCommand 创建辩论命令
type CreateDebateCommand struct {
	Topic     string
	MaxRounds int
}

// DebateDTO 辩论数据传输对象
type DebateDTO struct {
	ID           string
	Topic        string
	CurrentRound int
	Status       domain.DebateStatus
}

func (s *DebateAppService) CreateDebate(ctx context.Context, cmd CreateDebateCommand) (*DebateDTO, error) {
	result, err := s.debateService.RunDebate(ctx, cmd.Topic, cmd.MaxRounds)
	if err != nil {
		return nil, err
	}

	return &DebateDTO{
		ID:           result.Topic, // 暂时使用Topic作为示例ID
		Topic:        result.Topic,
		CurrentRound: result.TotalRounds,
		Status:       domain.DebateStatusFinished,
	}, nil
}

// 其他应用服务方法...
