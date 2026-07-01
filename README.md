# 案件・見積・仕様書・請求・粗利・入金管理システム

建築業向けに、案件・見積・仕様書・請求・粗利・入金をひとつの画面で管理できるWebシステムです。

開発: 株式会社フォーバル / 利用者: お客様(他社)を想定しているため、**お客様側は普通のWebサイトと同じようにブラウザでURLを開くだけ**で使えます。インストールは一切不要です。

このドキュメントは、**永井さんの会社PCではソフトのインストールができない**という前提のもと、
すべてブラウザ操作だけで公開まで完了できる手順にしてあります。

---

## 📌 全体の流れ(所要時間の目安: 30〜40分、すべて無料プランでOK)

1. **Supabase**(データを保存する場所)のアカウントを作る
2. **GitHub**(コードを置く場所)のアカウントを作り、コード一式をアップロードする
3. **Vercel**(実際にサイトを公開する場所)のアカウントを作り、GitHubと連携してデプロイする
4. 発行されたURLをお客様に共有する

どのステップも「Webサイトにログインしてボタンを押す」作業だけです。コマンド入力やソフトのインストールは一切ありません。

---

## ステップ1: Supabase(データベース)の準備

1. https://supabase.com/ にアクセスし、「Start your project」からアカウントを作成(GitHubアカウントでlog inするのが簡単です)
2. 「New project」を作成
   - Name: 好きな名前(例: `case-management-system`)
   - Database Password: 好きなパスワードを設定して**必ずメモしておく**
   - Region: `Northeast Asia (Tokyo)` を選択
3. プロジェクトが出来たら、左メニューの **Project Settings → Database** を開く
4. **Connection string** の欄で **「URI」** タブを選び、表示された文字列をコピーする
   - 例: `postgresql://postgres.xxxxxxxx:[YOUR-PASSWORD]@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres`
   - `[YOUR-PASSWORD]` の部分は、手順2で決めたパスワードに置き換えてください
5. このURLは後で使うので、メモ帳などに一時的に貼り付けておいてください

**なぜSupabaseが必要か**: このシステムのデータ(顧客・案件・見積・請求書など)を保存する場所です。テーブルは初回アクセス時にシステムが自動で作成するので、事前の設定は不要です。

---

## ステップ2: GitHub(コード置き場)の準備

1. https://github.com/ でアカウントを作成
2. 右上の「+」→「New repository」で新しいリポジトリを作成
   - Repository name: 例 `case-management-system`
   - 「Public」または「Private」はどちらでも構いません(お客様データが直接入るわけではないので)
   - 「Create repository」をクリック
3. お渡ししたZIPファイルを、パソコンの適当な場所に展開(解凍)してください(Windows標準の機能で解凍できます。右クリック→「すべて展開」)
4. GitHubのリポジトリ画面で「uploading an existing file」というリンクをクリック
5. 展開したフォルダの中身(`src`、`prisma`、`package.json` など)を全部まとめてドラッグ&ドロップでアップロード
   - **`node_modules` フォルダはZIPに含まれていないので気にしなくて大丈夫です**
6. 画面下の「Commit changes」をクリック

これでコードがGitHub上に保存されました。

---

## ステップ3: Vercel(公開先)の準備とデプロイ

1. https://vercel.com/ にアクセスし、「Sign Up」→ **GitHubアカウントでサインアップ**
2. ダッシュボードで「Add New...」→「Project」
3. 「Import Git Repository」の一覧から、ステップ2で作ったリポジトリを選択して「Import」
4. 「Environment Variables」という欄に、以下の2つを追加します
   | Name | Value |
   |---|---|
   | `DATABASE_URL` | ステップ1でコピーしたSupabaseの接続文字列 |
   | `AUTH_SECRET` | 適当なランダムな文字列(例: `xJ8kL2pQ9mN4vR7t...` など何でも良いです) |
5. 「Deploy」ボタンをクリック

2〜3分待つと、`https://(プロジェクト名).vercel.app` のようなURLが発行されます。これが本番URLです。

---

## ステップ4: 初期データを投入する

初回だけ、ログイン用のアカウントとサンプルデータを投入する必要があります。これは唯一「コマンドが必要な作業」ですが、**永井さんのPCで実行する必要はありません**。以下のいずれかの方法で行ってください。

### 方法A: Vercelの「無料お試し実行環境」を使う(おすすめ・インストール不要)

1. GitHubの https://github.com/codespaces でご自身のリポジトリを開く(「Code」ボタン→「Codespaces」タブ→「Create codespace on main」)
2. ブラウザの中にVSCodeのような画面と黒い操作画面(ターミナル)が開きます。これは**ブラウザの中で動く仮想パソコン**なので、永井さんのPCには何も入りません
3. ターミナルに以下を貼り付けて実行(1行ずつ)
   ```
   npm install
   ```
   ```
   echo 'DATABASE_URL="(ステップ1でコピーした接続文字列)"' > .env
   ```
   ```
   npm run db:seed
   ```
4. 「初期データ投入が完了しました」と表示されれば成功です

### 方法B: 情報システム部やご自宅のPCなど、インストール制限のない環境で1回だけ実行する

`npm install` → `.env` に `DATABASE_URL` を設定 → `npm run db:seed` を実行するだけです(詳細は本ドキュメント末尾の「開発者向け補足」を参照)。

---

## ログインアカウントと権限

| 役割 | メールアドレス | できること |
|---|---|---|
| forval_admin(フォーバル管理者) | admin@forval.local | すべての操作・取消/再発行・CSV出力・設定変更 |
| customer_admin(顧客管理者) | customer-admin@forval.local | 自社データの編集・取消/再発行・CSV出力 |
| staff(担当者) | staff@forval.local | 通常の入力業務 |

パスワードは3アカウントとも `password123` です。**本番運用の前に、必ず「設定」画面やSupabase上でパスワードを変更してください。**

---

## 今後、内容を修正したいとき

コードの修正が必要になった場合は、Claudeとのチャットで「ここを直してほしい」と伝えていただければ、修正済みのファイルをお渡しします。差分のファイルをGitHubの該当ファイル画面から「Edit」→貼り替え→「Commit changes」で更新すると、Vercelが自動で再デプロイします(これもブラウザ操作だけで完結します)。

---

## 基本的な使い方の流れ

1. **顧客管理** → 顧客を登録
2. **案件管理** → その顧客の案件(現場)を登録
3. **品目マスター** → よく使う工事項目を登録しておく
4. **見積** → 案件を選んで見積を作成し、品目マスターから明細を追加
5. 見積が完成したら「提出済にする」→ 客先提示後に「受注にする」
6. 見積詳細画面から「見積書PDF出力」でPDFをダウンロード
7. 同じ画面で「仕様書」を作成・PDF出力
8. 受注済みの見積から「請求予定作成」(通常請求は1行、分割請求は複数行)
9. 「月次請求作成」画面で顧客と請求月を選び、対象の請求予定にチェックを入れて請求書を作成
10. 請求書詳細画面で「PDF出力」「送付済にする」「入金済にする(入金日必須)」
11. 「PDF出力履歴」「CSVエクスポート」もサイドバーから確認できます

---

## 開発者向け補足

<details>
<summary>クリックして展開</summary>

### 技術構成

- Next.js 14(App Router)/ TypeScript / Tailwind CSS
- データベース: PostgreSQL(Supabase)、`pg` (node-postgres) で直接SQLを実行
- PDF生成: `@react-pdf/renderer` + Noto Sans JP フォント
- 認証: 簡易な自前セッション(Cookie + HMAC署名)。`src/lib/auth.ts` に集約

### なぜPrisma(ORM)を使っていないのか

当初の設計はPrisma + SQLiteでしたが、開発時のサンドボックス環境ではPrisma CLIの実行エンジンがダウンロードできず動作しなかったため、`pg` を使った軽量なリポジトリ層(`src/lib/db/` 以下)に置き換えました。加えて、今回は「開発者PCにインストールできない」という制約から、最初からSupabase PostgreSQL上で動く構成にしています。

`prisma/schema.prisma` には参考としてテーブル定義を残していますが、実行時には使用していません(`npm install` の対象にも含めていません)。将来的にPrisma経由の開発に戻したい場合は、通常のインターネット環境で `npm install prisma @prisma/client` の上、このファイルを使って `npx prisma generate` を実行してください。

### ローカルPCで開発したい場合(将来、制限のない環境が使えるようになったら)

```bash
npm install
# .env に Supabase の DATABASE_URL と AUTH_SECRET を設定
npm run db:seed   # 初回のみ
npm run dev
```

`http://localhost:3000` で動作します。ローカルで動かした場合も、Supabase上の本番データベースに直接つながる点に注意してください(テスト用に別のSupabaseプロジェクトを分けることを推奨します)。

### ディレクトリ構成

```
src/
  app/                  画面(Next.js App Router)
    (app)/              ログイン後の画面(サイドバー付き)
    api/pdf/            PDF生成API
    api/csv/            CSVエクスポートAPI
    login/              ログイン画面
  components/ui/        共通UI部品
  lib/
    db/                 データアクセス層(pg を使った生SQL)
    actions/            フォームから呼ばれるサーバーアクション
    pdf/                PDFテンプレート(見積書・仕様書・請求書)
    auth.ts             認証・権限
    calc.ts             粗利・消費税などの計算ロジック
db/postgres.sql          PostgreSQLのテーブル定義(起動時に自動実行)
prisma/schema.prisma      参考資料(実行時には未使用)
scripts/seed.ts           初期データ投入スクリプト
scripts/reset.ts           全テーブル削除スクリプト(開発用)
```

### 将来の展望チェックリスト(仕様書より)

- [x] SQLite → PostgreSQL(Supabase) — 対応済み
- [ ] 簡易ログイン → Supabase Auth(`src/lib/auth.ts` を置き換え)
- [x] ローカル起動 → Vercel公開 — 対応済み
- [ ] PDFローカルダウンロード → Supabase Storage / Google Drive保存
- [x] 1社(tenant)運用 → 複数社運用の土台(tenant_idは全主要テーブルに実装済み。複数社を有効にするにはtenant切り替えUIの追加が必要)

</details>
