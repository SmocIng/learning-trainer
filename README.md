# Learning Trainer - AIエージェント学習システム

**次世代のマルチモーダル学習体験を提供するAIエージェントシステム**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.6+-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15-black.svg)](https://nextjs.org/)
[![LangChain](https://img.shields.io/badge/LangChain-0.3-green.svg)](https://js.langchain.com/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## 📖 概要

Learning Trainer は、`output/` ディレクトリ内の学習コンテンツを、単なる知識詰め込みではなく、体験型・対話型の学習体験を通じて「血肉」として定着させる次世代AIエージェントシステムです。

### ✨ 主な特徴

- 🤖 **マルチエージェント協調**: LangGraph による複数のAIエージェントが連携
- 🎯 **適応型学習**: ユーザーの理解度に応じた動的な難易度調整
- 📚 **多様な学習形式**: 選択問題、記述、穴埋め、コーディング、対話型など
- 🎮 **ゲーミフィケーション**: ポイント、バッジ、ストリーク機能
- 🔄 **間隔反復学習**: エビングハウスの忘却曲線に基づく復習システム
- 🌐 **マルチモーダル**: テキスト、画像、動画、音声に対応
- ⚙️ **完全カスタマイズ可能**: 学習スタイルに合わせた柔軟な設定

## 🚀 クイックスタート

### 前提条件

- Node.js 22 LTS 以上
- pnpm 8.0 以上
- PostgreSQL 16 以上
- Redis 7.x（オプション、推奨）

### インストール

```bash
# リポジトリのクローン
git clone https://github.com/YOUR_USERNAME/learning-trainer.git
cd learning-trainer

# 依存関係のインストール
pnpm install

# 環境変数の設定
cp .env.example .env.local
# .env.local を編集して必要な設定を記入

# データベースのセットアップ
pnpm prisma migrate dev

# 開発サーバーの起動
pnpm dev
```

ブラウザで http://localhost:3000 を開いてください。

## 📁 プロジェクト構造

```
learning-trainer/
├── docs/                    # ドキュメント
│   ├── requirements/        # 要件定義
│   ├── architecture/        # アーキテクチャ設計
│   ├── api/                 # API設計
│   ├── testing/             # テスト設計
│   └── guides/              # 開発ガイド
├── src/                     # ソースコード
│   ├── app/                 # Next.js App Router
│   ├── components/          # Reactコンポーネント
│   ├── lib/                 # ユーティリティ
│   │   ├── agents/          # LangChainエージェント
│   │   ├── db/              # データベース
│   │   └── utils/           # 共通ユーティリティ
│   └── types/               # TypeScript型定義
├── prisma/                  # Prismaスキーマ
├── tests/                   # テスト
│   ├── unit/                # 単体テスト
│   ├── integration/         # 統合テスト
│   └── e2e/                 # E2Eテスト
├── public/                  # 静的ファイル
└── output/                  # 学習コンテンツ（ユーザー配置）
```

## 🛠️ 技術スタック

### フロントエンド

- **Framework**: Next.js 15 (App Router)
- **UI Library**: React 19
- **Styling**: Tailwind CSS 4.x + shadcn/ui
- **State Management**: Zustand + TanStack Query v5

### バックエンド

- **Runtime**: Node.js 22 LTS
- **Language**: TypeScript 5.6+
- **API**: tRPC (型安全API)
- **Database**: PostgreSQL 16 + Prisma 5.x
- **Vector Store**: pgvector
- **Cache**: Redis 7.x / Upstash Redis

### AI/ML

- **Framework**: LangGraph + LangChain.js 0.3.x
- **LLM**: OpenAI GPT-4o, Anthropic Claude 3.5, Google Gemini
- **Observability**: LangSmith, Helicone

## 📚 ドキュメント

詳細なドキュメントは [docs/](./docs/) ディレクトリを参照してください：

- [要件定義書](./docs/requirements/REQUIREMENTS.md)
- [アーキテクチャ設計](./docs/architecture/ARCHITECTURE.md)
- [API設計](./docs/api/API_DESIGN.md)
- [テスト設計](./docs/testing/TESTING_STRATEGY.md)
- [開発ガイド](./docs/guides/DEVELOPMENT.md)

## 🧪 テスト

本プロジェクトはBDD/TDDアプローチを採用しています。

```bash
# 単体テスト
pnpm test:unit

# 統合テスト
pnpm test:integration

# E2Eテスト
pnpm test:e2e

# 全テスト実行
pnpm test

# カバレッジ
pnpm test:coverage
```

## 🤝 開発への参加

詳細は [CONTRIBUTING.md](./CONTRIBUTING.md) を参照してください。

### 開発フロー

1. Issue を作成または選択
2. Feature ブランチを作成 (`git checkout -b feature/amazing-feature`)
3. TDD でテストを先に書く
4. 実装
5. テストが全てパス (`pnpm test`)
6. コミット (`git commit -m 'Add amazing feature'`)
7. Push (`git push origin feature/amazing-feature`)
8. Pull Request を作成

### コミットメッセージ規約

[Conventional Commits](https://www.conventionalcommits.org/) に従います：

```
feat: 新機能
fix: バグ修正
docs: ドキュメント更新
test: テスト追加・修正
refactor: リファクタリング
style: コードスタイル修正
chore: ビルド・設定変更
```

## 📄 ライセンス

MIT License - 詳細は [LICENSE](./LICENSE) を参照してください。

## 🙏 謝辞

このプロジェクトは以下のオープンソースプロジェクトを使用しています：

- [Next.js](https://nextjs.org/)
- [LangChain](https://js.langchain.com/)
- [Prisma](https://www.prisma.io/)
- [shadcn/ui](https://ui.shadcn.com/)

## 📞 サポート

- 📖 [ドキュメント](./docs/)
- 🐛 [Issue報告](https://github.com/YOUR_USERNAME/learning-trainer/issues)
- 💬 [Discussions](https://github.com/YOUR_USERNAME/learning-trainer/discussions)

---

**Generated with ❤️ and AI**
