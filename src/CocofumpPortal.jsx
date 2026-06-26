import React, { useState, useMemo } from "react";

/*
  学研ココファン 資格・加算管理ポータル
  - 拠点（事業所）別に介護職員の資格（介護福祉士ほか）を管理
  - サービス提供体制強化加算・処遇改善加算の「介護福祉士割合」要件をモニタ
  - 採用時の資格確認（候補者検索＋入職前資格チェック）
  - 法人(本部/拠点)ログイン / 個人(職員本人)ログイン
*/

const DA = {
  green: "#1F7A5A", greenDark: "#155C43", greenLight: "#E3F2EC", ink: "#1A1A1C", sub: "#5A5A66",
  line: "#D8D8DE", bg: "#F1F5F3", white: "#FFFFFF", ok: "#197A4B", okBg: "#E5F3EB",
  amber: "#9A6700", amberBg: "#FFF4D6", red: "#C8252C", redBg: "#FDEAEA", gray: "#62636C", grayBg: "#EDEEF2", focus: "#FFC53D",
  blue: "#1F6FB2", blueBg: "#E6F0F8",
};
const font = '"Noto Sans JP", "Hiragino Kakugo ProN", "Yu Gothic", Meiryo, system-ui, sans-serif';

const CORP = { email: "honbu@cocofump-portal.jp", pw: "Cocofump2026!" };
const INDV = { email: "hanako.sato@example.jp", pw: "MyCare2026!" };

const STATUS = {
  verified: { label: "確認済", c: DA.ok, bg: DA.okBg },
  expiring: { label: "要確認(更新間近)", c: DA.amber, bg: DA.amberBg },
  expired: { label: "失効", c: DA.red, bg: DA.redBg },
  mismatch: { label: "情報不一致", c: DA.red, bg: DA.redBg },
  unverified: { label: "未照合", c: DA.gray, bg: DA.grayBg },
};

// 介護系資格（介護福祉士は更新不要＝期限なし。研修修了/医療系は更新あり）
// 拠点（事業所）。kind: 特定施設 / サ高住+訪問 / 通所 など
const SITES = [
  {
    id: "CF-001", name: "ココファン日吉", pref: "神奈川県", kind: "特定施設入居者生活介護",
    staff: [
      { id: "S-1001", name: "佐藤 花子", kana: "サトウ ハナコ", dob: "1985-04-15", role: "介護職員", tenure: 11.2, fulltime: 1.0,
        quals: [{ type: "介護福祉士", license: "登録番号 1234567", status: "verified", expires: "更新不要", source: "社会福祉振興・試験センターAPI", verifiedAt: "2026-03-22 09:00" }] },
      { id: "S-1002", name: "鈴木 一郎", kana: "スズキ イチロウ", dob: "1990-08-02", role: "介護職員", tenure: 6.5, fulltime: 1.0,
        quals: [{ type: "介護福祉士", license: "登録番号 2345678", status: "verified", expires: "更新不要", source: "社会福祉振興・試験センターAPI", verifiedAt: "2026-03-22 09:00" }] },
      { id: "S-1003", name: "田中 美咲", kana: "タナカ ミサキ", dob: "1995-03-09", role: "介護職員", tenure: 3.1, fulltime: 1.0,
        quals: [{ type: "実務者研修", license: "修了番号 J-99887", status: "verified", expires: "更新不要", source: "学研ココファン人材養成DB", verifiedAt: "2026-03-22 09:00" }] },
      { id: "S-1004", name: "高橋 健", kana: "タカハシ ケン", dob: "1982-06-30", role: "介護職員", tenure: 12.4, fulltime: 1.0,
        quals: [{ type: "介護福祉士", license: "登録番号 3456789", status: "verified", expires: "更新不要", source: "社会福祉振興・試験センターAPI", verifiedAt: "2026-03-22 09:00" }] },
      { id: "S-1005", name: "伊藤 さやか", kana: "イトウ サヤカ", dob: "1992-11-11", role: "介護職員", tenure: 1.0, fulltime: 0.5,
        quals: [{ type: "初任者研修", license: "修了番号 K-55421", status: "verified", expires: "更新不要", source: "学研ココファン人材養成DB", verifiedAt: "2026-03-22 09:00" }] },
      { id: "S-1006", name: "渡辺 大輔", kana: "ワタナベ ダイスケ", dob: "1988-02-14", role: "看護職員", tenure: 4.0, fulltime: 1.0,
        quals: [{ type: "看護師", license: "籍登録 第654321号", status: "expiring", expires: "2026-08-31", source: "医療資格API(厚労省)", verifiedAt: "2026-03-22 09:00" }] },
    ],
  },
  {
    id: "CF-002", name: "ココファン藤沢SST", pref: "神奈川県", kind: "サ高住＋訪問介護",
    staff: [
      { id: "S-2001", name: "小林 涼", kana: "コバヤシ リョウ", dob: "1986-09-25", role: "介護職員", tenure: 8.2, fulltime: 1.0,
        quals: [{ type: "介護福祉士", license: "登録番号 4567890", status: "verified", expires: "更新不要", source: "社会福祉振興・試験センターAPI", verifiedAt: "2026-03-22 09:00" }] },
      { id: "S-2002", name: "加藤 真理", kana: "カトウ マリ", dob: "1991-01-20", role: "介護職員", tenure: 2.0, fulltime: 1.0,
        quals: [{ type: "実務者研修", license: "修了番号 J-77123", status: "verified", expires: "更新不要", source: "学研ココファン人材養成DB", verifiedAt: "2026-03-22 09:00" }] },
      { id: "S-2003", name: "吉田 翔", kana: "ヨシダ ショウ", dob: "1994-05-05", role: "介護職員", tenure: 0.5, fulltime: 1.0,
        quals: [{ type: "初任者研修", license: "—", status: "unverified", expires: "—", source: "—", verifiedAt: "—" }] },
      { id: "S-2004", name: "山口 葵", kana: "ヤマグチ アオイ", dob: "1989-12-12", role: "介護職員", tenure: 5.5, fulltime: 1.0,
        quals: [{ type: "介護福祉士", license: "登録番号 5678901", status: "mismatch", expires: "—", source: "社会福祉振興・試験センターAPI", verifiedAt: "2026-03-22 09:00" }] },
      { id: "S-2005", name: "松本 海斗", kana: "マツモト カイト", dob: "1983-07-07", role: "管理者", tenure: 10.5, fulltime: 1.0,
        quals: [{ type: "介護福祉士", license: "登録番号 6789012", status: "verified", expires: "更新不要", source: "社会福祉振興・試験センターAPI", verifiedAt: "2026-03-22 09:00" },
                { type: "介護支援専門員", license: "第130012345号", status: "expiring", expires: "2026-07-31", source: "都道府県介護支援専門員DB", verifiedAt: "2026-03-22 09:00" }] },
    ],
  },
  {
    id: "CF-003", name: "ココファン柏豊四季台", pref: "千葉県", kind: "サ高住＋通所介護",
    staff: [
      { id: "S-3001", name: "中村 由美", kana: "ナカムラ ユミ", dob: "1987-03-03", role: "介護職員", tenure: 9.0, fulltime: 1.0,
        quals: [{ type: "介護福祉士", license: "登録番号 7890123", status: "verified", expires: "更新不要", source: "社会福祉振興・試験センターAPI", verifiedAt: "2026-03-22 09:00" }] },
      { id: "S-3002", name: "井上 拓也", kana: "イノウエ タクヤ", dob: "1996-06-18", role: "介護職員", tenure: 1.5, fulltime: 1.0,
        quals: [{ type: "初任者研修", license: "修了番号 K-66218", status: "verified", expires: "更新不要", source: "学研ココファン人材養成DB", verifiedAt: "2026-03-22 09:00" }] },
      { id: "S-3003", name: "木村 彩", kana: "キムラ アヤ", dob: "1993-10-30", role: "介護職員", tenure: 3.8, fulltime: 1.0,
        quals: [{ type: "実務者研修", license: "修了番号 J-33010", status: "verified", expires: "更新不要", source: "学研ココファン人材養成DB", verifiedAt: "2026-03-22 09:00" }] },
    ],
  },
];

// 加算しきい値（サービス提供体制強化加算の介護福祉士割合の代表値）
const ADD_THRESHOLDS = [
  { key: "I", label: "強化加算 (I)", need: 0.7, note: "介護福祉士70%以上" },
  { key: "II", label: "強化加算 (II)", need: 0.6, note: "介護福祉士60%以上" },
  { key: "III", label: "強化加算 (III)", need: 0.5, note: "介護福祉士50%以上 等" },
];

function isKaigoFukushishi(s) { return s.quals.some((q) => q.type === "介護福祉士" && q.status === "verified"); }
// 常勤換算ベースの介護福祉士割合（介護職員のみ対象）
function siteRatio(site) {
  const careStaff = site.staff.filter((s) => s.role === "介護職員" || s.role === "管理者");
  const denom = careStaff.reduce((a, s) => a + s.fulltime, 0);
  const numer = careStaff.filter(isKaigoFukushishi).reduce((a, s) => a + s.fulltime, 0);
  return { ratio: denom ? numer / denom : 0, numer, denom, headcount: careStaff.length, kfHead: careStaff.filter(isKaigoFukushishi).length };
}
function siteTier(ratio) {
  for (const t of ADD_THRESHOLDS) if (ratio >= t.need) return t;
  return null;
}
const SEV = { mismatch: 4, expired: 4, expiring: 3, unverified: 2, verified: 1 };
function topStatus(s) { return s.quals.reduce((acc, q) => (SEV[q.status] > SEV[acc] ? q.status : acc), "verified"); }

// 採用候補者（外部の有資格者）
const CANDIDATES = [
  { id: "C-9001", name: "森田 ひかり", qual: "介護福祉士", pref: "神奈川県", years: 7, available: "即日", verified: true },
  { id: "C-9002", name: "大野 健太", qual: "介護福祉士", pref: "東京都", years: 4, available: "1ヶ月後", verified: true },
  { id: "C-9003", name: "藤本 みなみ", qual: "実務者研修", pref: "千葉県", years: 3, available: "即日", verified: true },
  { id: "C-9004", name: "岡田 涼介", qual: "初任者研修", pref: "神奈川県", years: 1, available: "応相談", verified: false },
  { id: "C-9005", name: "西村 さくら", qual: "介護支援専門員", pref: "東京都", years: 9, available: "2週間後", verified: true },
];

function Badge({ s }) { const v = STATUS[s]; return <span style={{ display: "inline-block", padding: "2px 10px", borderRadius: 4, fontSize: 12, fontWeight: 700, color: v.c, background: v.bg, whiteSpace: "nowrap" }}>{v.label}</span>; }
function Card({ children, style }) { return <div style={{ background: DA.white, border: `1px solid ${DA.line}`, borderRadius: 8, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", ...style }}>{children}</div>; }
function Btn({ children, onClick, variant = "primary", small, full }) {
  const base = { fontFamily: font, fontWeight: 700, cursor: "pointer", borderRadius: 6, padding: small ? "6px 14px" : "10px 22px", fontSize: small ? 13 : 15, border: "2px solid transparent", outlineOffset: 2, width: full ? "100%" : "auto" };
  const styles = { primary: { ...base, background: DA.green, color: "#fff" }, ghost: { ...base, background: "#fff", color: DA.green, borderColor: DA.green }, subtle: { ...base, background: DA.grayBg, color: DA.ink } };
  return <button onClick={onClick} style={styles[variant]} onFocus={(e) => (e.currentTarget.style.outline = `3px solid ${DA.focus}`)} onBlur={(e) => (e.currentTarget.style.outline = "none")} onMouseOver={(e) => { if (variant === "primary") e.currentTarget.style.background = DA.greenDark; }} onMouseOut={(e) => { if (variant === "primary") e.currentTarget.style.background = DA.green; }}>{full ? <span style={{ display: "block", textAlign: "center" }}>{children}</span> : children}</button>;
}
function PageHead({ title, desc }) { return <div style={{ marginBottom: 24 }}><h1 style={{ fontSize: 24, fontWeight: 800, color: DA.ink, margin: 0 }}>{title}</h1>{desc && <p style={{ color: DA.sub, fontSize: 14, margin: "8px 0 0" }}>{desc}</p>}</div>; }
function Field({ l, v, ok }) { return <div style={{ display: "flex", padding: "10px 0", borderBottom: `1px solid ${DA.line}` }}><div style={{ flex: "0 0 150px", color: DA.sub, fontSize: 14, fontWeight: 700 }}>{l}</div><div style={{ color: ok ? DA.ok : DA.ink, fontSize: 14, fontWeight: ok ? 700 : 400 }}>{v}</div></div>; }
function Modal({ children, onClose, title }) { return <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "grid", placeItems: "center", zIndex: 50, padding: 20 }}><div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 12, width: 520, maxWidth: "100%", padding: 28, fontFamily: font, maxHeight: "85vh", overflowY: "auto" }}><div style={{ fontWeight: 800, fontSize: 18, color: DA.ink, marginBottom: 16 }}>{title}</div>{children}</div></div>; }
function Spinner() { return <div style={{ width: 48, height: 48, margin: "0 auto", border: `5px solid ${DA.greenLight}`, borderTopColor: DA.green, borderRadius: "50%", animation: "spin 0.9s linear infinite" }}><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>; }
function QrMock() { const cells = Array.from({ length: 49 }, (_, i) => (i * 7 + 3) % 5 < 2 || i % 11 === 0); return <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2, width: 90, height: 90 }}>{cells.map((on, i) => <div key={i} style={{ background: on ? DA.ink : "transparent", borderRadius: 1 }} />)}</div>; }

// 加算割合のミニゲージ
function RatioBar({ ratio }) {
  const pct = Math.round(ratio * 100);
  return (<div>
    <div style={{ position: "relative", height: 10, background: DA.grayBg, borderRadius: 5, overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${pct}%`, background: ratio >= 0.5 ? DA.ok : DA.amber, borderRadius: 5 }} />
      {ADD_THRESHOLDS.map((t) => <div key={t.key} style={{ position: "absolute", left: `${t.need * 100}%`, top: -2, bottom: -2, width: 2, background: DA.ink, opacity: 0.35 }} />)}
    </div>
    <div style={{ fontSize: 11, color: DA.sub, marginTop: 4 }}>しきい値: 50% / 60% / 70%（強化加算 III / II / I）</div>
  </div>);
}

function Login({ onLogin }) {
  const [role, setRole] = useState("corp"); const [step, setStep] = useState(1);
  const [email, setEmail] = useState(""); const [pw, setPw] = useState(""); const [otp, setOtp] = useState(""); const [pin, setPin] = useState(""); const [err, setErr] = useState("");
  const cred = role === "corp" ? CORP : INDV;
  const inputStyle = { width: "100%", boxSizing: "border-box", padding: "12px 14px", fontSize: 15, fontFamily: font, border: `2px solid ${DA.line}`, borderRadius: 6, marginTop: 6 };
  const reset = (r) => { setRole(r); setStep(1); setEmail(""); setPw(""); setErr(""); };
  const submitId = () => { if (!email || !pw) { setErr("メールアドレスとパスワードを入力してください。"); return; } if (email !== cred.email || pw !== cred.pw) { setErr("メールアドレスまたはパスワードが正しくありません。"); return; } setErr(""); setStep(2); };
  const tab = (k, l) => <button onClick={() => reset(k)} style={{ flex: 1, padding: "10px 0", fontFamily: font, fontWeight: 700, fontSize: 14, cursor: "pointer", border: "none", borderBottom: `3px solid ${role === k ? DA.green : "transparent"}`, background: "transparent", color: role === k ? DA.green : DA.sub }}>{l}</button>;
  return (<div style={{ minHeight: "100vh", background: DA.bg, fontFamily: font, display: "flex", flexDirection: "column" }}>
    <div style={{ height: 6, background: DA.green }} />
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <Card style={{ width: 430, maxWidth: "100%", padding: "36px 36px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}><div style={{ width: 32, height: 32, background: DA.green, borderRadius: 6, color: "#fff", display: "grid", placeItems: "center", fontWeight: 800, fontSize: 13 }}>CF</div><div style={{ fontWeight: 800, fontSize: 17, color: DA.ink }}>ココファン 資格・加算管理</div></div>
        <p style={{ color: DA.sub, fontSize: 13, margin: "0 0 20px" }}>介護福祉士資格の確認と加算要件のモニタリング</p>
        <div style={{ display: "flex", borderBottom: `1px solid ${DA.line}`, marginBottom: 24 }}>{tab("corp", "本部・拠点でログイン")}{tab("individual", "職員本人でログイン")}</div>
        {step === 1 && (<>
          <label style={{ fontSize: 14, fontWeight: 700, color: DA.ink }}>メールアドレス<input style={inputStyle} value={email} onChange={(e) => setEmail(e.target.value)} /></label>
          <label style={{ fontSize: 14, fontWeight: 700, color: DA.ink, display: "block", marginTop: 18 }}>パスワード<input type="password" style={inputStyle} value={pw} onChange={(e) => setPw(e.target.value)} /></label>
          {err && <p style={{ color: DA.red, fontSize: 13, marginTop: 12 }}>{err}</p>}
          <div style={{ marginTop: 24 }}><Btn full onClick={submitId}>ログイン</Btn></div>
          <div style={{ marginTop: 18, paddingTop: 18, borderTop: `1px solid ${DA.line}` }}><button onClick={() => { setErr(""); setStep(3); }} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "#fff", border: `2px solid ${DA.green}`, color: DA.green, fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: font, borderRadius: 6, padding: "10px 16px" }}><span aria-hidden style={{ fontSize: 16 }}>🪪</span> マイナンバーカードでログイン</button></div>
        </>)}
        {step === 2 && (<>
          <p style={{ fontSize: 14, color: DA.ink, fontWeight: 700, marginTop: 0 }}>多要素認証</p>
          <p style={{ fontSize: 13, color: DA.sub }}>認証アプリに表示された6桁のコードを入力してください。</p>
          <input style={{ ...inputStyle, letterSpacing: 8, fontSize: 22, textAlign: "center" }} value={otp} maxLength={6} placeholder="000000" onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} />
          {err && <p style={{ color: DA.red, fontSize: 13, marginTop: 12 }}>{err}</p>}
          <div style={{ marginTop: 24, display: "flex", gap: 10 }}><Btn variant="subtle" small onClick={() => { setErr(""); setStep(1); }}>戻る</Btn><div style={{ flex: 1 }}><Btn full onClick={() => { if (otp.length !== 6) { setErr("6桁のコードを入力してください。"); return; } onLogin(role); }}>認証して進む</Btn></div></div>
        </>)}
        {step === 3 && (<>
          <p style={{ fontSize: 15, color: DA.ink, fontWeight: 800, marginTop: 0 }}>マイナンバーカードでログイン</p>
          <p style={{ fontSize: 13, color: DA.sub, lineHeight: 1.8 }}>スマートフォンの「デジ認アプリ」で本人確認を行います。マイナンバーカードをご準備ください。</p>
          <ol style={{ fontSize: 13, color: DA.sub, lineHeight: 2, paddingLeft: 20, margin: "12px 0" }}><li>デジ認アプリを起動</li><li>QRコードを読み取り</li><li>カードをかざして認証</li></ol>
          <div style={{ display: "flex", justifyContent: "center", margin: "8px 0 4px" }}><div style={{ width: 120, height: 120, border: `2px solid ${DA.ink}`, borderRadius: 8, display: "grid", placeItems: "center", background: "#fff" }}><QrMock /></div></div>
          <p style={{ fontSize: 11, color: DA.sub, textAlign: "center", margin: "8px 0 0" }}>デジ認アプリで読み取ってください</p>
          <div style={{ marginTop: 22, display: "flex", gap: 10 }}><Btn variant="subtle" small onClick={() => { setErr(""); setStep(1); }}>戻る</Btn><div style={{ flex: 1 }}><Btn full onClick={() => { setErr(""); setStep(4); }}>デジ認アプリで認証する</Btn></div></div>
        </>)}
        {step === 4 && (<div style={{ textAlign: "center", padding: "10px 0" }}><Spinner /><p style={{ fontSize: 15, color: DA.ink, fontWeight: 800, margin: "18px 0 6px" }}>デジ認アプリと連携中</p><p style={{ fontSize: 13, color: DA.sub, lineHeight: 1.8 }}>スマートフォンでマイナンバーカードをかざし、案内に従ってください。</p><div style={{ marginTop: 24, display: "flex", gap: 10 }}><Btn variant="subtle" small onClick={() => setStep(3)}>戻る</Btn><div style={{ flex: 1 }}><Btn full onClick={() => { setErr(""); setStep(5); }}>連携できた（次へ）</Btn></div></div></div>)}
        {step === 5 && (<>
          <p style={{ fontSize: 15, color: DA.ink, fontWeight: 800, marginTop: 0 }}>暗証番号の入力</p>
          <p style={{ fontSize: 13, color: DA.sub, lineHeight: 1.8 }}>利用者証明用電子証明書の暗証番号（数字4桁）を入力してください。</p>
          <input style={{ ...inputStyle, letterSpacing: 10, fontSize: 22, textAlign: "center" }} type="password" value={pin} maxLength={4} placeholder="••••" onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))} />
          {err && <p style={{ color: DA.red, fontSize: 13, marginTop: 12 }}>{err}</p>}
          <div style={{ marginTop: 24, display: "flex", gap: 10 }}><Btn variant="subtle" small onClick={() => { setErr(""); setStep(4); }}>戻る</Btn><div style={{ flex: 1 }}><Btn full onClick={() => { if (pin.length < 4) { setErr("暗証番号（4桁）を入力してください。"); return; } onLogin(role); }}>ログイン</Btn></div></div>
        </>)}
      </Card>
    </div>
    <footer style={{ textAlign: "center", padding: 20, color: DA.sub, fontSize: 12 }}>© 2026 Gakken LX DX ソリューション室 × 学研ココファン</footer>
  </div>);
}

function Dashboard({ go }) {
  const totalStaff = SITES.reduce((a, s) => a + s.staff.length, 0);
  const allKf = SITES.reduce((a, s) => a + s.staff.filter(isKaigoFukushishi).length, 0);
  const attention = SITES.reduce((a, s) => a + s.staff.filter((x) => ["expiring", "expired", "mismatch", "unverified"].includes(topStatus(x))).length, 0);
  const atRisk = SITES.filter((s) => { const r = siteRatio(s).ratio; return r < 0.5; }).length;
  const stats = [
    { label: "管理拠点数", v: `${SITES.length}拠点`, sub: "デモ" },
    { label: "登録職員数", v: `${totalStaff}名`, sub: `介護福祉士 ${allKf}名` },
    { label: "加算要件 未達拠点", v: `${atRisk}拠点`, sub: "介護福祉士50%未満" },
    { label: "資格 要対応", v: `${attention}件`, sub: "更新間近/不一致/未照合" },
  ];
  return (<div>
    <PageHead title="ダッシュボード" desc="拠点ごとの介護福祉士割合と加算要件の充足状況、対応が必要な資格を確認できます。" />
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 16, marginBottom: 24 }}>
      {stats.map((s) => <Card key={s.label} style={{ padding: 20 }}><div style={{ fontSize: 13, color: DA.sub, fontWeight: 700 }}>{s.label}</div><div style={{ fontSize: 30, fontWeight: 800, color: DA.ink, margin: "6px 0 2px" }}>{s.v}</div><div style={{ fontSize: 12, color: DA.sub }}>{s.sub}</div></Card>)}
    </div>
    <Card style={{ padding: 0, overflow: "hidden" }}>
      <div style={{ padding: "16px 20px", borderBottom: `1px solid ${DA.line}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}><div style={{ fontWeight: 800, fontSize: 16, color: DA.ink }}>拠点別 介護福祉士割合と加算判定</div><Btn small variant="ghost" onClick={() => go("sites")}>拠点一覧を見る</Btn></div>
      {SITES.map((s) => { const r = siteRatio(s); const tier = siteTier(r.ratio); return (
        <button key={s.id} onClick={() => go("sites", s.id)} style={{ width: "100%", textAlign: "left", background: "#fff", border: "none", borderBottom: `1px solid ${DA.line}`, padding: "16px 20px", cursor: "pointer", fontFamily: font }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 8, flexWrap: "wrap" }}>
            <div style={{ flex: "0 0 220px", fontWeight: 700, color: DA.ink }}>{s.name}<div style={{ fontSize: 11, color: DA.sub, fontWeight: 400 }}>{s.pref}・{s.kind}</div></div>
            <div style={{ flex: 1, minWidth: 200 }}><RatioBar ratio={r.ratio} /></div>
            <div style={{ flex: "0 0 70px", textAlign: "right", fontWeight: 800, fontSize: 18, color: r.ratio >= 0.5 ? DA.ok : DA.amber }}>{Math.round(r.ratio * 100)}%</div>
            <div style={{ flex: "0 0 130px", textAlign: "right" }}>{tier ? <span style={{ fontSize: 12, fontWeight: 800, color: DA.ok, background: DA.okBg, padding: "3px 10px", borderRadius: 4 }}>{tier.label} 可</span> : <span style={{ fontSize: 12, fontWeight: 800, color: DA.amber, background: DA.amberBg, padding: "3px 10px", borderRadius: 4 }}>要件未達</span>}</div>
          </div>
        </button>); })}
      <div style={{ padding: "12px 20px", fontSize: 12, color: DA.sub }}>※割合は介護職員の常勤換算ベース（デモ計算）。最終更新 2026-03-22 09:00</div>
    </Card>
  </div>);
}

function Sites({ selectedId, onSelect }) {
  const [q, setQ] = useState("");
  if (selectedId) { const s = SITES.find((x) => x.id === selectedId); if (s) return <SiteDetail site={s} onBack={() => onSelect(null)} />; }
  const rows = SITES.filter((s) => (s.name + s.pref + s.kind).includes(q));
  return (<div>
    <PageHead title="拠点・職員" desc="拠点（事業所）を起点に、所属職員の資格と加算要件への寄与をまとめて管理します。" />
    <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="拠点名・都道府県・サービス種別で検索" style={{ flex: 1, minWidth: 220, padding: "10px 14px", border: `2px solid ${DA.line}`, borderRadius: 6, fontFamily: font, fontSize: 14 }} />
      <Btn variant="ghost" onClick={() => alert("全拠点の資格を一括照合します（デモ）")}>全拠点を一括照合</Btn>
    </div>
    <Card style={{ padding: 0, overflow: "hidden" }}><div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
        <thead><tr style={{ background: DA.greenLight }}>{["拠点", "サービス種別", "職員数", "介護福祉士", "割合", "加算判定", ""].map((h) => <th key={h} style={{ textAlign: "left", padding: "12px 16px", color: DA.ink, fontWeight: 800, whiteSpace: "nowrap" }}>{h}</th>)}</tr></thead>
        <tbody>{rows.map((s) => { const r = siteRatio(s); const tier = siteTier(r.ratio); return (
          <tr key={s.id} onClick={() => onSelect(s.id)} style={{ borderBottom: `1px solid ${DA.line}`, cursor: "pointer" }} onMouseOver={(e) => (e.currentTarget.style.background = DA.bg)} onMouseOut={(e) => (e.currentTarget.style.background = "#fff")}>
            <td style={{ padding: "12px 16px", fontWeight: 700, color: DA.ink }}>{s.name}<div style={{ fontSize: 11, color: DA.sub, fontWeight: 400 }}>{s.pref}</div></td>
            <td style={{ padding: "12px 16px", color: DA.sub }}>{s.kind}</td>
            <td style={{ padding: "12px 16px", color: DA.ink }}>{s.staff.length}名</td>
            <td style={{ padding: "12px 16px", color: DA.ink }}>{r.kfHead}名</td>
            <td style={{ padding: "12px 16px", fontWeight: 800, color: r.ratio >= 0.5 ? DA.ok : DA.amber }}>{Math.round(r.ratio * 100)}%</td>
            <td style={{ padding: "12px 16px" }}>{tier ? <span style={{ fontSize: 12, fontWeight: 800, color: DA.ok, background: DA.okBg, padding: "3px 10px", borderRadius: 4 }}>{tier.label}</span> : <span style={{ fontSize: 12, fontWeight: 800, color: DA.amber, background: DA.amberBg, padding: "3px 10px", borderRadius: 4 }}>未達</span>}</td>
            <td style={{ padding: "12px 16px", color: DA.green, fontWeight: 700, whiteSpace: "nowrap" }}>詳細 ›</td>
          </tr>); })}</tbody>
      </table>
    </div></Card>
  </div>);
}

function SiteDetail({ site, onBack }) {
  const [sel, setSel] = useState(null);
  const r = siteRatio(site); const tier = siteTier(r.ratio);
  const next = ADD_THRESHOLDS.slice().reverse().find((t) => t.need > r.ratio);
  const needMore = next ? Math.max(0, Math.ceil(next.need * r.denom - r.numer)) : 0;
  return (<div>
    <button onClick={onBack} style={{ background: "none", border: "none", color: DA.green, fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: font, marginBottom: 16, padding: 0 }}>‹ 拠点一覧に戻る</button>
    <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
      <div><h1 style={{ fontSize: 24, fontWeight: 800, color: DA.ink, margin: 0 }}>{site.name}</h1><div style={{ fontSize: 13, color: DA.sub }}>{site.pref}・{site.kind}</div></div>
    </div>
    <Card style={{ padding: 22, marginBottom: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 14 }}>
        <div style={{ fontWeight: 800, fontSize: 16, color: DA.ink }}>介護福祉士割合（加算要件モニタ）</div>
        {tier ? <span style={{ fontSize: 13, fontWeight: 800, color: DA.ok, background: DA.okBg, padding: "4px 12px", borderRadius: 4 }}>{tier.label} の要件を充足</span> : <span style={{ fontSize: 13, fontWeight: 800, color: DA.amber, background: DA.amberBg, padding: "4px 12px", borderRadius: 4 }}>強化加算の要件 未達</span>}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 10 }}><div style={{ fontSize: 40, fontWeight: 800, color: r.ratio >= 0.5 ? DA.ok : DA.amber }}>{Math.round(r.ratio * 100)}%</div><div style={{ fontSize: 13, color: DA.sub }}>介護福祉士 {r.kfHead}名 / 介護職員 {r.headcount}名（常勤換算 {r.numer.toFixed(1)} / {r.denom.toFixed(1)}）</div></div>
      <RatioBar ratio={r.ratio} />
      {next && <div style={{ marginTop: 14, padding: "12px 14px", background: DA.amberBg, borderRadius: 6, fontSize: 13, color: DA.ink }}>次の区分「{next.label}（{next.note}）」まで、常勤換算で介護福祉士があと <b>約{needMore}名</b> 必要です。採用または資格取得支援を検討してください。</div>}
    </Card>
    <Card style={{ padding: 0, overflow: "hidden" }}>
      <div style={{ padding: "16px 20px", borderBottom: `1px solid ${DA.line}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}><div style={{ fontWeight: 800, fontSize: 15, color: DA.ink }}>所属職員（{site.staff.length}名）</div><Btn small variant="ghost" onClick={() => alert("この拠点の資格を再照合します（デモ）")}>再照合</Btn></div>
      <div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
        <thead><tr style={{ background: DA.bg }}>{["氏名", "職種", "主資格", "勤続(年)", "状態", ""].map((h) => <th key={h} style={{ textAlign: "left", padding: "10px 16px", color: DA.sub, fontWeight: 800, whiteSpace: "nowrap" }}>{h}</th>)}</tr></thead>
        <tbody>{site.staff.map((st) => <tr key={st.id} onClick={() => setSel(st)} style={{ borderBottom: `1px solid ${DA.line}`, cursor: "pointer" }} onMouseOver={(e) => (e.currentTarget.style.background = DA.bg)} onMouseOut={(e) => (e.currentTarget.style.background = "#fff")}>
          <td style={{ padding: "12px 16px", fontWeight: 700, color: DA.ink }}>{st.name}{isKaigoFukushishi(st) && <span style={{ fontSize: 10, fontWeight: 800, color: DA.green, background: DA.greenLight, padding: "1px 6px", borderRadius: 3, marginLeft: 6 }}>介福</span>}</td>
          <td style={{ padding: "12px 16px", color: DA.sub }}>{st.role}</td>
          <td style={{ padding: "12px 16px", color: DA.ink }}>{st.quals[0].type}{st.quals.length > 1 && <span style={{ color: DA.sub, fontSize: 12 }}> 他{st.quals.length - 1}</span>}</td>
          <td style={{ padding: "12px 16px", color: DA.ink }}>{st.tenure.toFixed(1)}{st.tenure >= 10 && isKaigoFukushishi(st) && <span style={{ fontSize: 10, fontWeight: 800, color: DA.blue, background: DA.blueBg, padding: "1px 6px", borderRadius: 3, marginLeft: 6 }}>10年+</span>}</td>
          <td style={{ padding: "12px 16px" }}><Badge s={topStatus(st)} /></td>
          <td style={{ padding: "12px 16px", color: DA.green, fontWeight: 700, whiteSpace: "nowrap" }}>詳細 ›</td>
        </tr>)}</tbody>
      </table></div>
    </Card>
    {sel && <Modal onClose={() => setSel(null)} title={`${sel.name} さんの資格`}>
      <Field l="氏名" v={`${sel.name}（${sel.kana}）`} /><Field l="生年月日" v={sel.dob} /><Field l="職種" v={sel.role} />
      <Field l="同一法人勤続年数" v={`${sel.tenure.toFixed(1)} 年`} ok={sel.tenure >= 10 && isKaigoFukushishi(sel)} />
      <div style={{ margin: "16px 0 8px", fontWeight: 800, fontSize: 14, color: DA.ink }}>保有資格と照合状況</div>
      {sel.quals.map((q, i) => <div key={i} style={{ padding: "12px 14px", border: `1px solid ${DA.line}`, borderRadius: 8, marginBottom: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}><div style={{ fontWeight: 700, color: DA.ink }}>{q.type}</div><Badge s={q.status} /></div>
        <div style={{ fontSize: 13, color: DA.sub, lineHeight: 1.9 }}>登録/修了番号: {q.license}<br />有効期限: {q.expires}<br />照合元: {q.source}<br />最終照合: {q.verifiedAt}</div>
      </div>)}
      {sel.tenure >= 10 && isKaigoFukushishi(sel) && <div style={{ padding: "10px 14px", background: DA.blueBg, borderRadius: 6, fontSize: 13, color: DA.ink }}>処遇改善加算における「経験・技能のある介護職員（介護福祉士かつ同一法人勤続10年以上）」の候補です。</div>}
    </Modal>}
  </div>);
}

// 採用：候補者検索＋入職前の資格確認
function Hiring() {
  const [sub, setSub] = useState("search");
  const subTab = (k, l) => <button key={k} onClick={() => setSub(k)} style={{ padding: "10px 4px", marginRight: 24, fontFamily: font, fontWeight: 700, fontSize: 15, cursor: "pointer", border: "none", borderBottom: `3px solid ${sub === k ? DA.green : "transparent"}`, background: "transparent", color: sub === k ? DA.green : DA.sub }}>{l}</button>;
  return (<div>
    <PageHead title="採用・資格確認" desc="有資格者の候補検索と、内定者・入職予定者の資格を入職前に確認します。" />
    <div style={{ borderBottom: `1px solid ${DA.line}`, marginBottom: 24 }}>{subTab("search", "候補者検索")}{subTab("precheck", "入職前 資格確認")}</div>
    {sub === "search" && <CandidateSearch />}
    {sub === "precheck" && <PreCheck />}
  </div>);
}

function CandidateSearch() {
  const [qual, setQual] = useState(""); const [pref, setPref] = useState(""); const [verifiedOnly, setVerifiedOnly] = useState(false); const [offered, setOffered] = useState({});
  const rows = useMemo(() => CANDIDATES.filter((c) => (!qual || c.qual === qual) && (!pref || c.pref === pref) && (!verifiedOnly || c.verified)), [qual, pref, verifiedOnly]);
  const quals = [...new Set(CANDIDATES.map((c) => c.qual))]; const prefs = [...new Set(CANDIDATES.map((c) => c.pref))];
  const sel = { padding: "10px 12px", border: `2px solid ${DA.line}`, borderRadius: 6, fontFamily: font, fontSize: 14, background: "#fff" };
  return (<div>
    <p style={{ color: DA.sub, fontSize: 14, margin: "0 0 20px" }}>資格確認済の介護人材を、資格種別・地域・稼働時期で検索しスカウトします。介護福祉士の採用は加算割合の改善にも直結します。</p>
    <Card style={{ padding: 20, marginBottom: 20 }}><div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
      <select style={sel} value={qual} onChange={(e) => setQual(e.target.value)}><option value="">資格種別（すべて）</option>{quals.map((q) => <option key={q}>{q}</option>)}</select>
      <select style={sel} value={pref} onChange={(e) => setPref(e.target.value)}><option value="">地域（すべて）</option>{prefs.map((a) => <option key={a}>{a}</option>)}</select>
      <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: DA.ink, fontWeight: 700, cursor: "pointer" }}><input type="checkbox" checked={verifiedOnly} onChange={(e) => setVerifiedOnly(e.target.checked)} style={{ width: 18, height: 18 }} />資格確認済のみ</label>
    </div></Card>
    <div style={{ fontSize: 14, color: DA.sub, marginBottom: 12 }}>{rows.length}件 該当</div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 16 }}>{rows.map((c) => <Card key={c.id} style={{ padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><div style={{ fontWeight: 800, fontSize: 17, color: DA.ink }}>{c.name}</div>{c.verified && <span style={{ fontSize: 11, fontWeight: 800, color: DA.ok, background: DA.okBg, padding: "2px 8px", borderRadius: 4 }}>✓ 確認済</span>}</div>
      <div style={{ color: DA.green, fontWeight: 700, margin: "8px 0 12px" }}>{c.qual}</div>
      <div style={{ fontSize: 13, color: DA.sub, lineHeight: 1.9 }}>地域: {c.pref}<br />経験年数: {c.years}年<br />入職可能: {c.available}</div>
      <div style={{ marginTop: 16 }}>{offered[c.id] ? <span style={{ fontSize: 13, fontWeight: 700, color: DA.ok }}>スカウト送信済</span> : <Btn small onClick={() => setOffered({ ...offered, [c.id]: true })}>スカウト送信</Btn>}</div>
    </Card>)}</div>
  </div>);
}

function PreCheck() {
  const [name, setName] = useState(""); const [dob, setDob] = useState(""); const [type, setType] = useState("介護福祉士"); const [num, setNum] = useState("");
  const [checking, setChecking] = useState(false); const [result, setResult] = useState(null);
  const run = () => {
    if (!name || !num) { setResult({ status: "error", msg: "氏名と登録/修了番号を入力してください。" }); return; }
    setChecking(true); setResult(null);
    setTimeout(() => { setChecking(false); const ok = num.replace(/\D/g, "").length >= 6; setResult(ok ? { status: "verified", msg: "資格を確認しました。入職手続きに進めます。" } : { status: "mismatch", msg: "登録情報と一致しませんでした。番号・氏名・生年月日をご確認ください。" }); }, 1500);
  };
  const inp = { width: "100%", boxSizing: "border-box", padding: "11px 13px", marginTop: 6, border: `2px solid ${DA.line}`, borderRadius: 6, fontFamily: font, fontSize: 15 };
  return (<div>
    <p style={{ color: DA.sub, fontSize: 14, margin: "0 0 20px" }}>内定者・入職予定者の資格を、各資格の発行機関APIへ照会して入職前に確認します。詐称・取り違えを防ぎ、加算算定の前提を担保します。</p>
    <Card style={{ padding: 24, maxWidth: 560 }}>
      <label style={{ fontSize: 14, fontWeight: 700, color: DA.ink, display: "block" }}>氏名<input style={inp} value={name} onChange={(e) => setName(e.target.value)} placeholder="例: 森田 ひかり" /></label>
      <label style={{ fontSize: 14, fontWeight: 700, color: DA.ink, display: "block", marginTop: 14 }}>生年月日<input style={inp} value={dob} onChange={(e) => setDob(e.target.value)} placeholder="例: 1990-04-01" /></label>
      <label style={{ fontSize: 14, fontWeight: 700, color: DA.ink, display: "block", marginTop: 14 }}>資格種別
        <select style={{ ...inp, background: "#fff" }} value={type} onChange={(e) => setType(e.target.value)}>{["介護福祉士", "実務者研修", "初任者研修", "社会福祉士", "看護師", "介護支援専門員"].map((t) => <option key={t}>{t}</option>)}</select>
      </label>
      <label style={{ fontSize: 14, fontWeight: 700, color: DA.ink, display: "block", marginTop: 14 }}>登録番号 / 修了番号<input style={inp} value={num} onChange={(e) => setNum(e.target.value)} placeholder="例: 1234567" /></label>
      <div style={{ marginTop: 20 }}><Btn full onClick={run}>資格を照合する</Btn></div>
      {checking && <div style={{ textAlign: "center", padding: "20px 0" }}><Spinner /><p style={{ fontSize: 14, color: DA.ink, fontWeight: 700, marginTop: 14 }}>発行機関APIへ照会中…</p></div>}
      {result && !checking && <div style={{ marginTop: 18, padding: "14px 16px", borderRadius: 8, background: result.status === "verified" ? DA.okBg : result.status === "mismatch" ? DA.redBg : DA.grayBg, color: result.status === "verified" ? DA.ok : result.status === "mismatch" ? DA.red : DA.ink, fontSize: 14, fontWeight: 700 }}>{result.status === "verified" ? "✓ " : result.status === "mismatch" ? "× " : ""}{result.msg}</div>}
    </Card>
  </div>);
}

function Reports() {
  const rows = SITES.map((s) => { const r = siteRatio(s); const tier = siteTier(r.ratio); return { s, r, tier }; });
  return (<div>
    <PageHead title="加算レポート" desc="拠点別の介護福祉士割合と、算定可能な強化加算区分の一覧です。CSV/PDFで出力できます。" />
    <div style={{ display: "flex", gap: 10, marginBottom: 16, justifyContent: "flex-end" }}><Btn small variant="ghost">CSV出力</Btn><Btn small variant="ghost">PDF出力</Btn></div>
    <Card style={{ padding: 0, overflow: "hidden" }}><table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
      <thead><tr style={{ background: DA.greenLight }}>{["拠点", "サービス種別", "介護福祉士割合", "算定可能区分", "経験技能職員(介福10年+)"].map((h) => <th key={h} style={{ textAlign: "left", padding: "12px 16px", fontWeight: 800, color: DA.ink, whiteSpace: "nowrap" }}>{h}</th>)}</tr></thead>
      <tbody>{rows.map(({ s, r, tier }) => { const exp = s.staff.filter((x) => x.tenure >= 10 && isKaigoFukushishi(x)).length; return (
        <tr key={s.id} style={{ borderBottom: `1px solid ${DA.line}` }}>
          <td style={{ padding: "12px 16px", fontWeight: 700, color: DA.ink }}>{s.name}</td>
          <td style={{ padding: "12px 16px", color: DA.sub }}>{s.kind}</td>
          <td style={{ padding: "12px 16px", fontWeight: 800, color: r.ratio >= 0.5 ? DA.ok : DA.amber }}>{Math.round(r.ratio * 100)}%</td>
          <td style={{ padding: "12px 16px" }}>{tier ? <span style={{ fontWeight: 700, color: DA.ok }}>{tier.label}</span> : <span style={{ color: DA.amber, fontWeight: 700 }}>なし（要件未達）</span>}</td>
          <td style={{ padding: "12px 16px", color: DA.ink }}>{exp}名</td>
        </tr>); })}</tbody>
    </table></Card>
    <p style={{ fontSize: 12, color: DA.sub, marginTop: 14 }}>※区分・割合は代表的なしきい値に基づくデモ判定です。実際の算定可否はサービス種別ごとの要件・常勤換算・自治体確認が必要です。</p>
  </div>);
}

function Settings() {
  return (<div>
    <PageHead title="管理者設定" desc="法人情報・API連携・権限を管理します。" />
    <Card style={{ padding: 24, marginBottom: 20 }}><div style={{ fontWeight: 800, fontSize: 16, color: DA.ink, marginBottom: 16 }}>法人情報</div><Field l="法人名" v="株式会社学研ココファン" /><Field l="法人番号" v="9010701024637" /><Field l="管理拠点数" v="217拠点（全社）／本デモは3拠点" /><Field l="契約プラン" v="エンタープライズ" /></Card>
    <Card style={{ padding: 24 }}><div style={{ fontWeight: 800, fontSize: 16, color: DA.ink, marginBottom: 16 }}>資格照合API連携</div>
      <Field l="介護福祉士（試験センター）" v="接続済" ok /><Field l="医療資格API（厚労省・看護師等）" v="接続済" ok /><Field l="介護支援専門員DB（都道府県）" v="接続済" ok /><Field l="学研ココファン人材養成DB（研修修了）" v="接続済" ok /><Field l="マイナポータルAPI" v="接続済" ok />
    </Card>
  </div>);
}

// 個人（職員本人）
const MY = { name: "佐藤 花子", kana: "サトウ ハナコ", dob: "1985-04-15", site: "ココファン日吉", tenure: 11.2,
  quals: [{ id: "q1", type: "介護福祉士", license: "登録番号 1234567", status: "verified", expires: "更新不要", publish: true }],
};
const MY_OFFERS = [{ id: "o1", site: "ココファン藤沢SST", qual: "介護福祉士", msg: "サービス提供体制強化加算の体制づくりに向け、リーダー候補として打診です。", date: "2026-03-20", state: "new" }];

function IndvHome({ go }) {
  return (<div>
    <PageHead title={`こんにちは、${MY.name} さん`} desc="保有資格の状況と、勤続に基づく処遇改善の対象状況を確認できます。" />
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 16, marginBottom: 24 }}>
      <Card style={{ padding: 20 }}><div style={{ fontSize: 13, color: DA.sub, fontWeight: 700 }}>登録資格</div><div style={{ fontSize: 30, fontWeight: 800, margin: "6px 0 2px" }}>{MY.quals.length}件</div><div style={{ fontSize: 12, color: DA.sub }}>すべて確認済</div></Card>
      <Card style={{ padding: 20 }}><div style={{ fontSize: 13, color: DA.sub, fontWeight: 700 }}>同一法人勤続</div><div style={{ fontSize: 30, fontWeight: 800, margin: "6px 0 2px" }}>{MY.tenure}年</div><div style={{ fontSize: 12, color: DA.ok, fontWeight: 700 }}>経験・技能のある介護職員に該当</div></Card>
      <Card style={{ padding: 20 }}><div style={{ fontSize: 13, color: DA.sub, fontWeight: 700 }}>新着オファー</div><div style={{ fontSize: 30, fontWeight: 800, margin: "6px 0 2px" }}>{MY_OFFERS.filter((o) => o.state === "new").length}件</div><div style={{ fontSize: 12, color: DA.sub }}>未対応</div></Card>
    </div>
    <Card style={{ padding: 22 }}>
      <div style={{ fontWeight: 800, fontSize: 15, color: DA.ink, marginBottom: 8 }}>処遇改善の対象状況</div>
      <p style={{ fontSize: 14, color: DA.sub, lineHeight: 1.8, margin: 0 }}>介護福祉士の資格があり、同一法人での勤続が10年以上のため、処遇改善加算の「経験・技能のある介護職員」の対象候補です。最終的な区分は事業所の体系により決まります。</p>
    </Card>
  </div>);
}

function MyQuals() {
  const [quals, setQuals] = useState(MY.quals); const [showAdd, setShowAdd] = useState(false);
  const [newType, setNewType] = useState("実務者研修"); const [newNum, setNewNum] = useState(""); const [verifying, setVerifying] = useState(false);
  const add = () => { setVerifying(true); setTimeout(() => { setQuals([...quals, { id: "q" + Date.now(), type: newType, license: newNum || "—", status: "verified", expires: "更新不要", publish: false }]); setVerifying(false); setShowAdd(false); setNewNum(""); }, 1500); };
  const toggle = (id) => setQuals(quals.map((q) => (q.id === id ? { ...q, publish: !q.publish } : q)));
  return (<div>
    <PageHead title="マイ資格" desc="保有資格を登録すると、発行機関APIで真偽が自動確認されます。資格ごとに法人内での公開可否を設定できます。" />
    <div style={{ marginBottom: 16 }}><Btn onClick={() => setShowAdd(true)}>資格を追加</Btn></div>
    <div style={{ display: "grid", gap: 16 }}>{quals.map((q) => <Card key={q.id} style={{ padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}><div style={{ fontWeight: 800, fontSize: 17, color: DA.ink }}>{q.type}</div><Badge s={q.status} /></div>
      <div style={{ fontSize: 13, color: DA.sub, lineHeight: 1.9, margin: "8px 0 14px" }}>登録/修了番号: {q.license}<br />有効期限: {q.expires}</div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 14, borderTop: `1px solid ${DA.line}` }}><div style={{ fontSize: 14, fontWeight: 700, color: DA.ink }}>他拠点・本部への公開</div><button onClick={() => toggle(q.id)} style={{ width: 52, height: 28, borderRadius: 14, border: "none", cursor: "pointer", position: "relative", background: q.publish ? DA.green : DA.line }}><span style={{ position: "absolute", top: 3, left: q.publish ? 27 : 3, width: 22, height: 22, borderRadius: "50%", background: "#fff", transition: "left .15s" }} /></button></div>
      <div style={{ fontSize: 12, color: DA.sub, marginTop: 8 }}>{q.publish ? "公開中：法人内の異動・応援募集の候補に表示されます。" : "非公開：所属拠点の管理にのみ使用されます。"}</div>
    </Card>)}</div>
    {showAdd && <Modal onClose={() => !verifying && setShowAdd(false)} title="資格を追加">
      {verifying ? <div style={{ textAlign: "center", padding: "20px 0" }}><Spinner /><p style={{ fontSize: 14, color: DA.ink, fontWeight: 700, marginTop: 16 }}>発行機関APIで真偽を確認中…</p></div> : <>
        <label style={{ fontSize: 14, fontWeight: 700, color: DA.ink }}>資格種別<select value={newType} onChange={(e) => setNewType(e.target.value)} style={{ width: "100%", padding: "12px 14px", marginTop: 6, border: `2px solid ${DA.line}`, borderRadius: 6, fontFamily: font, fontSize: 15, background: "#fff" }}>{["介護福祉士", "実務者研修", "初任者研修", "社会福祉士", "看護師", "介護支援専門員"].map((t) => <option key={t}>{t}</option>)}</select></label>
        <label style={{ fontSize: 14, fontWeight: 700, color: DA.ink, display: "block", marginTop: 16 }}>登録番号 / 修了番号<input value={newNum} onChange={(e) => setNewNum(e.target.value)} placeholder="例: 1234567" style={{ width: "100%", boxSizing: "border-box", padding: "12px 14px", marginTop: 6, border: `2px solid ${DA.line}`, borderRadius: 6, fontFamily: font, fontSize: 15 }} /></label>
        <p style={{ fontSize: 12, color: DA.sub, marginTop: 12 }}>登録番号は、氏名・生年月日とあわせて各発行機関のAPIで照合されます。</p>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}><Btn variant="subtle" small onClick={() => setShowAdd(false)}>キャンセル</Btn><Btn small onClick={add}>追加して照合</Btn></div>
      </>}
    </Modal>}
  </div>);
}

function MyOffers() {
  const [offers, setOffers] = useState(MY_OFFERS);
  const respond = (id, a) => setOffers(offers.map((o) => (o.id === id ? { ...o, state: a } : o)));
  const lbl = { new: null, accepted: "応諾しました。担当者から連絡があります。", declined: "辞退しました" };
  return (<div>
    <PageHead title="受信オファー" desc="法人内・他拠点からの異動／応援の打診です。応諾すると担当者へ通知されます。" />
    <div style={{ display: "grid", gap: 16 }}>{offers.map((o) => <Card key={o.id} style={{ padding: 22 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}><div style={{ fontWeight: 800, fontSize: 17, color: DA.ink }}>{o.site}</div><span style={{ fontSize: 13, color: DA.sub }}>{o.date}</span></div>
      <div style={{ color: DA.green, fontWeight: 700, margin: "6px 0 10px" }}>{o.qual}</div>
      <div style={{ fontSize: 14, color: DA.ink, lineHeight: 1.8 }}>{o.msg}</div>
      <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${DA.line}` }}>{o.state === "new" ? <div style={{ display: "flex", gap: 10 }}><Btn small onClick={() => respond(o.id, "accepted")}>応諾する</Btn><Btn small variant="subtle" onClick={() => respond(o.id, "declined")}>辞退する</Btn></div> : <span style={{ fontSize: 14, fontWeight: 700, color: o.state === "accepted" ? DA.ok : DA.sub }}>{lbl[o.state]}</span>}</div>
    </Card>)}</div>
  </div>);
}

function MyProfile() {
  return (<div>
    <PageHead title="プロフィール" desc="本人確認済みの基本情報です。" />
    <Card style={{ padding: 24 }}><Field l="氏名" v={MY.name} /><Field l="フリガナ" v={MY.kana} /><Field l="生年月日" v={MY.dob} /><Field l="所属拠点" v={MY.site} /><Field l="同一法人勤続" v={`${MY.tenure} 年`} ok /><Field l="本人確認" v="マイナンバーカードで確認済" ok /></Card>
  </div>);
}

const NAV_CORP = [["dashboard", "ダッシュボード"], ["sites", "拠点・職員"], ["hiring", "採用・資格確認"], ["reports", "加算レポート"], ["settings", "管理者設定"]];
const NAV_INDV = [["home", "ホーム"], ["myquals", "マイ資格"], ["offers", "受信オファー"], ["profile", "プロフィール"]];

export default function App() {
  const [role, setRole] = useState(null);
  const [page, setPage] = useState("dashboard");
  const [siteId, setSiteId] = useState(null);
  if (!role) return <Login onLogin={(r) => { setRole(r); setPage(r === "corp" ? "dashboard" : "home"); setSiteId(null); }} />;
  const isCorp = role === "corp";
  const nav = isCorp ? NAV_CORP : NAV_INDV;
  const goSites = (p, id = null) => { setPage(p); setSiteId(id); };
  const corpPages = { dashboard: <Dashboard go={goSites} />, sites: <Sites selectedId={siteId} onSelect={setSiteId} />, hiring: <Hiring />, reports: <Reports />, settings: <Settings /> };
  const indvPages = { home: <IndvHome go={setPage} />, myquals: <MyQuals />, offers: <MyOffers />, profile: <MyProfile /> };
  const content = isCorp ? corpPages[page] : indvPages[page];
  const accountName = isCorp ? "学研ココファン 本部" : MY.name;
  const avatar = isCorp ? "CF" : MY.name.charAt(0);
  return (<div style={{ fontFamily: font, background: DA.bg, minHeight: "100vh", color: DA.ink }}>
    <div style={{ height: 6, background: DA.green }} />
    <header style={{ background: "#fff", borderBottom: `1px solid ${DA.line}`, padding: "0 24px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 30 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}><div style={{ width: 30, height: 30, background: DA.green, borderRadius: 6, color: "#fff", display: "grid", placeItems: "center", fontWeight: 800, fontSize: 12 }}>CF</div><div style={{ fontWeight: 800, fontSize: 15 }}>ココファン 資格・加算管理</div><span style={{ fontSize: 11, fontWeight: 700, color: DA.green, background: DA.greenLight, padding: "2px 8px", borderRadius: 4, marginLeft: 4 }}>{isCorp ? "本部・拠点" : "職員"}</span></div>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}><span style={{ fontSize: 13, color: DA.sub }}>{accountName}</span><div style={{ width: 32, height: 32, borderRadius: "50%", background: DA.greenLight, color: DA.green, display: "grid", placeItems: "center", fontWeight: 800, fontSize: 12 }}>{avatar}</div><button onClick={() => setRole(null)} style={{ background: "none", border: `1px solid ${DA.line}`, borderRadius: 6, padding: "6px 12px", fontSize: 13, cursor: "pointer", fontFamily: font, color: DA.sub }}>ログアウト</button></div>
    </header>
    <div style={{ display: "flex", maxWidth: 1280, margin: "0 auto" }}>
      <nav style={{ flex: "0 0 220px", padding: "20px 12px" }}>{nav.map(([k, l]) => <button key={k} onClick={() => { setPage(k); setSiteId(null); }} style={{ width: "100%", textAlign: "left", padding: "12px 16px", marginBottom: 4, borderRadius: 8, fontFamily: font, fontSize: 14, fontWeight: 700, cursor: "pointer", border: "none", background: page === k ? DA.green : "transparent", color: page === k ? "#fff" : DA.ink }}>{l}</button>)}</nav>
      <main style={{ flex: 1, padding: "28px 28px 60px", minWidth: 0 }}>{content}</main>
    </div>
    <footer style={{ textAlign: "center", padding: 24, color: DA.sub, fontSize: 12, borderTop: `1px solid ${DA.line}`, background: "#fff" }}>© 2026 Gakken LX DX ソリューション室 × 学研ココファン</footer>
  </div>);
}
