# 教材構造化（章・節・連番）および学習タスク・日割りペース算出機能 実装計画

## 概要
先生画面において、参考書・問題集・教科書の構造（章、節、連番アイテム、ページ番号、接頭辞/接尾辞）を直感的に作成・編集できるようにし、定期テストや課題の範囲に合わせて生徒が効率的な学習タスクを設定・進捗チェック・日割りの必要消化ペース（予備日設定つき）を把握できるようにします。

---

## ユーザー確認・合意事項
- **生徒側メイン配置**: 「計画」タブを本格的なタスク・スケジュール管理画面（PlannedView）として実装・刷新。
- **ホーム画面ウィジェット**: ホーム画面（HomeView）にも「本日のノルマ / タスク進捗」のコンパクトなウィジェットを配置し、日割り目標の確認とクイックチェックを可能にする。
- **先生画面の構造登録**: 章・節の階層ツリーと、連番ジェネレーター（接頭辞・接尾辞・開始番号・終了番号）およびページ入力のハイブリッドUIを採用し、PCで素早く登録・プレビュー可能にする。
- **日割りペース算出**: 提出期日までの残り日数と未完了数から自動計算し、直前の見直しや急な予定に備える「予備日（デフォルト1〜2日）」の自動考慮・調整機能を提供する。
- **テスト範囲公開時の促し**: 教員が配信した定期テスト課題からワンクリックで「この範囲でタスクを作成」できる促しバナー・カードを提示。

---

## データモデル・ドメイン層の設計 (`src/domain/models/index.ts`)

### 1. 教材の構造定義 (`MaterialStructure`, `MaterialUnit`)
```typescript
export interface MaterialUnitItem {
  id: string;
  type: 'numbered' | 'page'; // 連番型 (例題1〜45等) or ページ型 (p.10〜25)
  label: string;             // 例: "例題 1", "問 3", "p.42"
  itemNumber?: number;       // ソート・連番用
  page?: number;             // 該当ページ
}

export interface MaterialSection {
  id: string;
  title: string;             // 例: "第1節 2次方程式とその解"
  items: MaterialUnitItem[]; // 連番アイテムまたはページ
}

export interface MaterialChapter {
  id: string;
  chapterNumber: number;     // 1, 2, ...
  title: string;             // 例: "第1章 数と式"
  pageStart?: number;
  pageEnd?: number;
  sections: MaterialSection[];
}

export interface MaterialStructure {
  mode: 'structured' | 'pages_only'; // 構造化(章/節/連番) または 読み物・教科書(ページのみ)
  chapters: MaterialChapter[];
}
```

### 2. 生徒学習タスクモデル (`StudentStudyTask`)
```typescript
export interface StudentStudyTask {
  id: string;
  userId: string;
  materialId: string;
  materialTitle: string;
  subjectId: string;
  relatedTestTaskId?: string; // 関連する教員配信の定期テスト課題ID（任意）
  title: string;              // タスク名 (例: "数I定期テスト対策：二次関数")
  deadline: string;           // YYYY-MM-DD
  bufferDays: number;         // 予備日日数 (デフォルト1日)
  
  // 対象の学習項目リストと完了ステータス
  items: {
    unitItemId: string;
    label: string;
    page?: number;
    completed: boolean;
    completedAt?: string;
  }[];

  createdAt: string;
  updatedAt: string;
}
```

---

## 変更予定ファイルとレイヤー別実装

### 1. ドメイン & リポジトリ層
- **`src/domain/models/index.ts`**
  - 教材の構造化データ定義（`MaterialChapter`, `MaterialSection`, `MaterialUnitItem`, `MaterialStructure`）を追加。
  - 生徒の学習タスク（`StudentStudyTask`）と日割りノルマ計算の型定義を追加。
  - `Material` に `structure?: MaterialStructure` を追加。
- **`src/domain/repositories/index.ts`**
  - `IMaterialRepository` に教材の更新（`updateMaterial`）、削除（`deleteMaterial`）を追加。
  - `IStudentTaskRepository` を新設（生徒ごとのタスク取得・作成・更新・チェック切り替え・削除）。
- **`src/infrastructure/repositories/LocalStorageStudentTaskRepository.ts`**
  - 新設: LocalStorage による生徒タスクの永続化実装。
- **`src/infrastructure/repositories/LocalStorageMaterialRepository.ts`**
  - 教材の更新・削除、構造データの保存に対応。
- **`src/infrastructure/ServiceContainer.ts`**
  - `studentTaskRepository` をサービスコンテナに追加。
- **`src/infrastructure/seedData.ts`**
  - 主要な高校・中学校の参考書（数学チャート式、英語総合問題集、現代文教科書、化学基礎問題精講等）のリアルな構造化初期データを追加。

### 2. コンテキスト層 (`src/context/AppContext.tsx`)
- 生徒タスク一覧（`studentTasks`）の状態管理とロード。
- タスク追加（`addStudentTask`）、タスク項目のチェック切り替え（`toggleTaskItem`）、タスク編集・削除の公開。
- 教材追加・更新・削除の公開。

### 3. 先生画面: 教材構造ビルダー (`src/components/teacher/`)
- **`src/components/teacher/TeacherMaterialsView.tsx` または `MaterialStructureModal.tsx`**
  - PC画面に最適化したレイアウト（左：章・節ツリー／右：分節アイテムジェネレーターと即時プレビュー）。
  - **連番ジェネレーター**:
    - 接頭辞（例: `例題`, `問題`, `Exercise`, `重要例題`, `問`, `Step` 等のプリセット＋自由入力）
    - 連番開始〜終了（例: 1 〜 30）
    - 接尾辞（例: ``, ` (A)`, ` (B)`, `*` 等）
    - ページ範囲（例: p.15 〜 p.38）
    - 「一括生成」ボタンで数十問・数十ページを一発で階層下に展開。
  - **教科書・読み物モード**:
    - ページのみの範囲追加（「第1章：p.10〜35」「第2章：p.36〜62」など）を1クリックで登録。
  - キーボード操作や直感的な削除・リネームUI。

### 4. 生徒画面: 計画タブ・タスク管理 (`src/components/student/PlannedView.tsx`)
- プレースホルダーから実稼働の本格タスク・スケジュール画面へ刷新。
- **日割りペース（ノルマ）算出パネル**:
  - `(残り項目数) ÷ (提出期日までの残り日数 - 予備日)` により「今日やるべき問題数/ページ数」を算出して大きく表示。
  - 今日消化した項目数と、残りノルマのプログレスバー表示。
- **タスク詳細アコーディオン & チェックリスト**:
  - 章・節ごとに整理されたアイテム一覧。
  - チェックボックスで完了/未完了を切り替え。
  - チェックした分がリアルタイムで学習記録の登録候補に連携可能。
- **新規タスク作成モーダル (`CreateTaskModal.tsx`)**:
  - 先生が登録した参考書・問題集を選択。
  - 章・節・問題番号を範囲指定（例: 「第2章 例題15〜35」を複数選択可能）。
  - 目標提出期日と予備日（0〜3日）を設定。

### 5. 生徒画面: ホーム画面連携 (`src/components/student/HomeView.tsx`)
- **定期テスト範囲からのタスク作成促進バナー**:
  - 先生が配信した定期テスト課題カードに「⚡️ この範囲で学習タスクを作成する」ボタンを追加。
  - クリックすると対象科目の教材と範囲が自動プリセットされたタスク作成モーダルが開く。
- **本日のノルマ・コンパクトウィジェット**:
  - 今日の目標（例: 「数学: 例題 3問 / 英語: p.45〜48」）と達成状況をミニカードで一覧表示。
  - ホーム画面から直接ワンクリックでチェック可能。

---

## 検証手順 (Verification Plan)

### 自動ビルド & 型検証
1. `compile_applet` によるTypeScriptコンパイルチェック。
2. `lint_applet` による構文・インポートエラーのゼロ確認。

### 手動・ブラウザ動作検証
1. **先生画面（教材管理）**:
   - 右上ロール切替で「先生」を選択。
   - 参考書「青チャート数学I+A」または新規教材を開き、章・節を追加。
   - 連番ジェネレーターで接頭辞「例題」、1〜20、接尾辞「」で一括生成し、プレビューに即時反映されることを確認。
   - 教科書モードでページ「p.12〜45」を登録。
2. **定期テスト課題配信**:
   - 先生画面で課題（例: 「中間テスト範囲: 第2章 二次関数 例題10〜25」）を確認または配信。
3. **生徒画面（タスク作成・促しバナー）**:
   - ロールを「生徒」に切り替え。
   - ホーム画面で「定期テスト課題の範囲」カードから「この範囲で学習タスクを作成」をクリック。
   - 期限日（2週間後）と予備日（1日）を指定してタスクを作成。
4. **日割りペース算出 & チェックイン**:
   - 計画タブ（またはホーム画面のウィジェット）で、1日あたりの目標数（例: 「1日 2問」）が正しく計算されているか確認。
   - アイテムをチェックし、進捗率の更新と残りノルマの再計算を確認。
5. **レスポンシブ & テーマ確認**:
   - ダークモード切り替え時の視認性とPC/モバイルでの表示崩れがないか確認。
