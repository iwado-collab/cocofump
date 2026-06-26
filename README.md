# ココファン 資格・加算管理ポータル

React + Vite のシングルページアプリです。Vercel にそのままデプロイできます。

## ローカルで動かす

```bash
npm install
npm run dev
```

ブラウザで http://localhost:5173 を開きます。

## ログイン情報（デモ）

- 本部・拠点: `honbu@cocofump-portal.jp` / `Cocofump2026!`
- 職員本人: `hanako.sato@example.jp` / `MyCare2026!`
- 多要素認証コードは任意の6桁
- マイナンバーカードログインの暗証番号は任意の4桁

## Vercel へのデプロイ

### 方法A: GitHub 連携（おすすめ・以後は push で自動デプロイ）

1. このフォルダを GitHub リポジトリにプッシュする
   ```bash
   git init
   git add .
   git commit -m "init"
   git branch -M main
   git remote add origin https://github.com/<ユーザー名>/<リポジトリ名>.git
   git push -u origin main
   ```
2. https://vercel.com にログイン → 「Add New」→「Project」
3. 対象リポジトリを Import
4. Framework Preset は **Vite** が自動検出される（設定はそのままでOK）
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. 「Deploy」を押すと公開URLが発行される

### 方法B: Vercel CLI（リポジトリ不要・手元から直接）

```bash
npm install -g vercel
vercel        # 初回はログイン。質問はほぼEnterでOK
vercel --prod # 本番URLを発行
```

設定を聞かれたら次の通り:
- Build Command: `npm run build`
- Output Directory: `dist`
- Development Command: `npm run dev`

## 構成

- `index.html` … エントリ。Noto Sans JP を読み込み
- `src/main.jsx` … React の起動
- `src/CocofumpPortal.jsx` … アプリ本体（法人版・個人版・ログイン）
- `vercel.json` … SPA のルーティング設定
