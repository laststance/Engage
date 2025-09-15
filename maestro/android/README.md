# 🤖 Android Maestro Tests

## 状態
**現在未実装** - iOS専用テストが完成後に開発予定

## 計画されている実装

### 予想される課題
1. **座標調整**: Androidデバイスのタブバー位置はiOSと異なる可能性
2. **アニメーション**: Android特有のUI遷移タイミング
3. **デバイス多様性**: 様々な画面サイズ・解像度への対応

### 実装戦略
1. **iOSテストの移植**: 座標を除く全ロジックを再利用
2. **座標最適化**: Android Emulatorでの座標調整
3. **デバイス固有テスト**: 主要なAndroidデバイスでの検証

### ファイル命名規則
```
android/
├── app-launch.yaml
├── navigation.yaml
├── ui-elements.yaml
└── README.md
```

## 🚀 将来の実行予定

```bash
# Android専用テストスイート（実装後）
npm run test:e2e:android

# 個別テスト（実装後）
npm run test:e2e:android:launch
npm run test:e2e:android:navigation
npm run test:e2e:android:ui
```

## 🔧 必要な環境（実装時）

```bash
# Android Emulator起動
emulator -avd <your_android_avd>

# アプリビルド・インストール
npx expo run:android

# Maestro実行
export JAVA_HOME="/opt/homebrew/opt/openjdk@17"
export PATH="$JAVA_HOME/bin:$PATH"
npm run test:e2e:android
```

---

*注意: 現在はプレースホルダーディレクトリです。iOS実装が安定した後に開発を開始します。*
