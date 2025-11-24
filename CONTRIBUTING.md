# 貢献ガイド

Learning Trainer プロジェクトへの貢献に興味を持っていただきありがとうございます！

## 開発プロセス

### 1. Issue作成

- バグ報告、機能要望、質問などは Issue で管理します
- 既存の Issue を確認し、重複していないかチェックしてください
- Issue テンプレートに従って記入してください

### 2. ブランチ作成

```bash
git checkout -b feature/issue-123-description
```

命名規則:

- `feature/` - 新機能
- `fix/` - バグ修正
- `docs/` - ドキュメント
- `test/` - テスト
- `refactor/` - リファクタリング
- `chore/` - その他

### 3. 開発

1. **TDDアプローチ**: テストを先に書く
2. **実装**: テストをパスする最小限の実装
3. **リファクタリング**: コードを改善
4. **ドキュメント**: 必要に応じて更新

### 4. テスト

```bash
# 全テスト実行
pnpm test

# カバレッジ確認
pnpm test:coverage
```

### 5. コミット

Conventional Commits に従います:

```bash
git commit -m "feat: add learning mode selection"
git commit -m "fix: resolve database connection issue"
git commit -m "docs: update API documentation"
```

フォーマット:

```
<type>: <subject>

<body>

<footer>
```

Types:

- `feat`: 新機能
- `fix`: バグ修正
- `docs`: ドキュメント
- `style`: コードスタイル
- `refactor`: リファクタリング
- `test`: テスト
- `chore`: ビルド・設定

### 6. Pull Request

- PRテンプレートに従って記入
- レビュアーを指定
- CI/CDが全てパスすることを確認

## コーディング規約

### TypeScript

- strict モード有効
- `any` 禁止
- すべての関数に型定義

### React

- 関数コンポーネント使用
- Props は interface で定義
- hooks の依存配列を正確に

### テスト

- AAA パターン（Arrange-Act-Assert）
- テスト名は動作を説明
- モックは必要最小限

## コミュニティ

- 敬意を持って接してください
- 建設的なフィードバックを心がけてください
- 質問は遠慮なくしてください

## ライセンス

貢献したコードは MIT ライセンスの下で公開されます。
