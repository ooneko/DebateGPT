package domain

// 添加内存存储实现
type MemoryStorage struct {
	results []RoundResult
}

func (m *MemoryStorage) RecordRound(round int, proponentArg, opponentArg string, proponentScore, opponentScore float64) {
	m.results = append(m.results, RoundResult{
		Round:             round,
		ProponentArgument: proponentArg,
		OpponentArgument:  opponentArg,
		ProponentScore:    proponentScore,
		OpponentScore:     opponentScore,
	})
}

func (m *MemoryStorage) GetResult() *DebateResult {
	totalProponent := 0.0
	totalOpponent := 0.0
	for _, r := range m.results {
		totalProponent += r.ProponentScore
		totalOpponent += r.OpponentScore
	}

	winner := "平局"
	if totalProponent > totalOpponent {
		winner = "正方"
	} else if totalOpponent > totalProponent {
		winner = "反方"
	}

	return &DebateResult{
		TotalRounds:    len(m.results),
		ProponentScore: totalProponent,
		OpponentScore:  totalOpponent,
		Winner:         winner,
		Details:        m.results,
	}
}
