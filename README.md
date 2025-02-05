# DebateGPT

DebateGPT 是一个利用大型语言模型构建的自动化辩论系统，支持实时生成论点、流式评分以及智能辩论历史跟踪。该项目演示了如何整合 AI 辩论、流式输出和上下文记录实现端到端的辩论流程。

## 特性

- **自动生成论点**：使用 AI 模块实时生成辩论论点。
- **流式评分**：通过流式输出降低用户等待时间，实时展示评分过程。
- **历史记录管理**：维护辩论上下文，确保评分时参考完整的辩论历史。
- **模块化架构**：清晰的包结构，便于扩展和维护。

## 项目结构

```bash
.
├── cmd/
│   └── main.go                # 程序入口，辩论流程控制
├── internal/
│   ├── config/                # 配置加载模块（例如 config.yaml）
│   ├── client/                # 与外部大模型 API 的集成
│   └── domain/
│       ├── debate.go          # 辩论上下文、论点生成与辩论流程实现
│       ├── judge.go           # AI 评委评分模块（流式输出实现）
│       └── judge_integration_test.go  # 集成测试案例
├── .gitignore                 # 用于忽略 config.yaml 等敏感文件
└── README.md                  # 本文档
```

## 安装与配置

1. **克隆项目**

   ```bash
   git clone git@github.com:ooneko/DebateGPT.git
   cd DebateGPT
   ```

2. **配置文件**

   在项目根目录下创建 `config.yaml`（该文件被 `.gitignore` 忽略），例如：

   ```yaml
   API:
     Endpoint: "https://api.yourmodel.com"
     Timeout: 30s
     Model: "gpt-3.5-turbo"
     MaxTokens: 1024
   ```

3. **依赖安装**

   确保已安装 Go 1.22+，然后运行：

   ```bash
   go mod tidy
   ```

## 使用方法

通过命令行参数指定辩论主题及最大轮次来开始辩论：

```bash
go run cmd/main.go -topic="人工智能在医疗中的应用" -rounds=3
```

### 辩论流程简介

- **论点生成**：系统自动生成辩手论点，并记录辩论历史。
- **实时评分**：AI 评委根据辩论历史及当前论点进行流式评分，实时展示评分过程。
- **结果统计**：辩论结束后，展示每轮论点内容、评分详情及最终胜负判断。

## 测试

运行集成测试以验证评委模块和辩论流程：

```bash
go test -v -tags=integration ./internal/domain
```

## 注意事项

- **配置文件安全**：请勿将 `config.yaml` 上传至公共仓库，该文件已在 `.gitignore` 中忽略。
- **API 调用**：使用外部大模型 API 时，请注意调用频率及相关费用。

## 贡献

欢迎提交 Issue 或 Pull Request 来贡献代码和建议。

## 许可证

本项目采用 [MIT 许可证](LICENSE) 开源发布。

