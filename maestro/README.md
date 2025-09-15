# 🧪 Maestro E2E Tests

Engageアプリの包括的なEnd-to-Endテストスイート。

## 📱 プラットフォーム対応状況

| プラットフォーム | 状態 | ディレクトリ | 備考 |
|-----------------|------|-------------|------|
| **iOS** | ✅ 完全実装 | `ios/` | iPhone Simulator最適化 |
| **Android** | 🚧 計画中 | `android/` | 将来実装予定 |

## 🚀 クイックスタート

### iOS テスト実行
```bash
# 環境設定
export JAVA_HOME="/opt/homebrew/opt/openjdk@17"
export PATH="$JAVA_HOME/bin:$PATH"

# E2Eテストスイート実行
npm run test:e2e          # デフォルト（iOS）
npm run test:e2e:ios      # iOS明示的実行
npm run test:e2e:android  # Android（未実装通知）
```

## 📋 テスト概要

### iOS Tests (`ios/`)
- **app-launch.yaml**: アプリ起動とCalendar画面表示確認
- **navigation.yaml**: タブ間ナビゲーション（Calendar ↔ Today ↔ Stats）
- **ui-elements.yaml**: 各画面のUI要素存在確認

### ✅ 検証済み機能
- ✅ アプリ起動・状態クリア
- ✅ Calendar画面の初期表示
- ✅ Today画面への遷移・表示
- ✅ Stats画面への遷移・表示
- ✅ Calendar画面への復帰
- ✅ 各画面のtestID要素確認

## ⚠️ 技術的制限・注意事項

### Expo Router制限
現在のテストは **座標ベースナビゲーション** を使用：
```yaml
- tapOn:
    point: 50%, 93%  # Today tab
    repeat: 2
    delay: 300
```

**理由**: 
- Expo Routerの`tabBarTestID`がMaestro CLIで認識されない（GitHub Issue #2448）
- 座標使用はMaestroベストプラクティスに反するが、現時点で唯一の実用的解決策

### iOS最適化
- **Target Device**: iPhone 16 Pro Simulator (iOS 18.6)
- **Coordinates**: iPhone画面サイズに最適化
- **Timing**: iOS特有のアニメーション待機時間

## 🔮 将来の改善計画

### 1. Android対応
- `android/` ディレクトリでAndroid専用テスト実装
- 座標とタイミングのAndroid最適化

### 2. ベストプラクティス準拠
- Expo Router改善によるtestID認識対応
- 座標ベース → testIDベースへの移行
- プラットフォーム間共通セレクター採用

### 3. テストスイート拡張
- 実際の機能テスト（データ入力、状態管理）
- パフォーマンステスト
- アクセシビリティテスト

## 📊 実行統計

```bash
# 最新の成功記録（2025-09-15）
npm run test:e2e
> [Passed] app-launch (3s) ✅
> [Passed] navigation (12s) ✅  
> [Passed] ui-elements (13s) ✅
> 3/3 Flows Passed in 28s
```

---

**リサーチ基盤**: この実装は2025年のMaestro公式ドキュメント、GitHub Issue #2448の回避策、Perplexity AIによるベストプラクティス調査に基づいています。