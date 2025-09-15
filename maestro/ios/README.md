# 📱 iOS Maestro Tests

## 概要
このディレクトリにはiOS専用のMaestroテストファイルが含まれています。

## ⚠️ 重要な制限事項

### 座標ベースナビゲーション
現在のテストは **座標ベース** のタップを使用しています。これは **Maestroベストプラクティスに反しますが**、Expo Routerの制限により必要です：

- `tabBarTestID` がMaestro CLIで認識されない
- `tabBarAccessibilityLabel` も同様に機能しない
- 座標 `point: X%, Y%` がタブナビゲーションの唯一の実用的解決策

### プラットフォーム固有の最適化
- **iPhone Simulator**: iPhone 16 Pro (iOS 18.6) で最適化・検証済み
- **座標設定**: `50%, 93%` (Today), `83%, 93%` (Stats), `17%, 93%` (Calendar)
- **タイミング**: iOS特有のアニメーション・遷移時間に最適化

## 📋 テストファイル

| ファイル | 目的 | 戦略 |
|----------|------|------|
| `app-launch.yaml` | 🚀 アプリ起動確認 | testIDベース (安定) |
| `navigation.yaml` | 🔄 タブナビゲーション | 座標ベース + 条件分岐 |
| `ui-elements.yaml` | 🎨 UI要素確認 | 座標ベース + UI検証 |

## 🚀 実行方法

```bash
# iOS専用テストスイート実行
npm run test:e2e         # デフォルト（iOS）
npm run test:e2e:ios     # iOS明示的実行
```

## 🔧 環境要件

```bash
# Java Runtime
export JAVA_HOME="/opt/homebrew/opt/openjdk@17"
export PATH="$JAVA_HOME/bin:$PATH"

# iOS Simulator (例: iPhone 16 Pro)
xcrun simctl boot BD11E026-36E4-434E-B630-2513C5C69D9B
open -a Simulator

# アプリビルド・インストール
npx expo run:ios
```

## 🔮 将来のAndroid対応

### 予想される調整点
1. **座標の微調整**: Androidデバイスのタブバー位置に合わせる
2. **タイミング調整**: Android特有の性能・アニメーション特性
3. **プラットフォーム分岐**: 条件分岐によるデバイス別最適化

### ベストプラクティスへの移行
- Expo Routerの改善によりtestID認識が向上した場合、座標ベースから移行
- アプリ側のカスタムタブコンポーネント実装によるTestID公開
- プラットフォーム間共通のセマンティックセレクター採用

---

*注意: 現在のテストは実用性を優先し、座標ベースアプローチを採用していますが、技術的制約が解決され次第、Maestroベストプラクティスに準拠したtestIDベース手法への移行を推奨します。*
