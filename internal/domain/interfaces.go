package domain

import "context"

// 辩论者接口
type Debater interface {
	GenerateArgument(ctx context.Context, debateContext *DebateContext, side Position) (string, error)
}

// 存储接口
type DebateStorage interface {
	RecordRound(round int, proponentArg, opponentArg string, proponentScore, opponentScore float64)
	GetResult() *DebateResult
}

// 评委接口
type Judge interface {
	Score(ctx context.Context, debateContext *DebateContext, argument string) (EvaluationResult, error)
}
