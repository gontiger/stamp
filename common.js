// アプリ本体と管理者ページで共通に使う部分
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import * as A from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import * as fs from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import * as cfg from "./config.js";
export { fs };

if (!cfg.firebaseConfig || String(cfg.firebaseConfig.apiKey).startsWith("ここに")) throw new Error("config.js is not filled in");

export const ADMINS = (cfg.admins || []).map(s => String(s).toLowerCase());
const app = initializeApp(cfg.firebaseConfig);
export const auth = A.getAuth(app);
export const db = fs.getFirestore(app);

// ---------- データの住所 ----------
export const LIST_ID = "main";
export const listRef = fs.doc(db, "lists", LIST_ID);
export const itemsRef = fs.collection(db, "lists", LIST_ID, "items");
export const itemDoc = id => fs.doc(db, "lists", LIST_ID, "items", id);
export const pageDoc = id => fs.doc(db, "lists", LIST_ID, "pages", id);
export const photosRef = id => fs.collection(db, "lists", LIST_ID, "pages", id, "photos");
export const photoDoc = (id, pid) => fs.doc(db, "lists", LIST_ID, "pages", id, "photos", pid);
export const stampsRef = fs.collection(db, "lists", LIST_ID, "stamps");
export const stampDoc = id => fs.doc(db, "lists", LIST_ID, "stamps", id);
export const DEFAULT_TITLE = "わたしたちのやりたいことスタンプ帳";

// ---------- ログイン ----------
export const isAdmin = u => !!u && ADMINS.includes(String(u.email || "").toLowerCase());
export const onUser = cb => A.onAuthStateChanged(auth, cb);
export const logout = () => A.signOut(auth);
export async function login(){
  const retry = () => toast("ログインがまだ完了していません。もう一度「Googleでログイン」を押してください。");
  try {
    await A.signInWithPopup(auth, new A.GoogleAuthProvider());
    setTimeout(() => { if (!auth.currentUser) retry(); }, 1500);
  }
  catch (e) {
    console.error(e);
    if (e.code === "auth/popup-closed-by-user" || e.code === "auth/cancelled-popup-request") { setTimeout(() => { if (!auth.currentUser) retry(); }, 1500); return; }
    const why = {
      "auth/unauthorized-domain": "このURLがFirebaseの「承認済みドメイン」に登録されていません。",
      "auth/operation-not-allowed": "FirebaseでGoogleログインが有効になっていません。",
      "auth/popup-blocked": "ブラウザがログイン画面のポップアップをブロックしました。",
      "auth/network-request-failed": "通信できませんでした。電波の状況を確認してください。"
    }[e.code] || "SafariやChromeで開いてもう一度お試しください。";
    toast("ログインできませんでした。" + why + "（" + (e.code || "不明なエラー") + "）");
  }
}

// ---------- 便利な道具 ----------
export const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const pad = n => String(n).padStart(2, "0");
export const today = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; };
export const nowTime = () => { const d = new Date(); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };
export const fmt = d => d ? d.replace(/-/g, ".") : "";
export const fmtJ = d => { if (!d) return ""; const [y, m, dd] = d.split("-").map(Number); const w = "日月火水木金土"[new Date(y, m-1, dd).getDay()]; return `${m}/${dd}（${w}）`; };
export const hash = id => { let h = 7; for (const c of String(id)) h = (h*31 + c.charCodeAt(0)) | 0; return Math.abs(h); };
export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
export function toast(t){
  let el = document.getElementById("toast");
  if (!el) { el = document.createElement("div"); el.id = "toast"; el.setAttribute("role", "status"); document.body.appendChild(el); }
  el.textContent = t; el.classList.add("on"); clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove("on"), 3200);
}
export function fail(e){
  console.error(e);
  toast(e && e.code === "permission-denied" ? "この操作をする権限がありません。" : "保存できませんでした。通信状況を確認してもう一度お試しください。");
}

// ---------- スタンプ ----------
export const INKS = ["#B8323B","#2B64A8","#2F7D52","#C46A1C","#7A4BA6","#B23A6A","#1E7F86"];
export const FRAMES = ["丸","角","楕円"];
const F = 'fill="currentColor" stroke="none"';
const fireworks = (() => { let s = ""; for (let k = 0; k < 12; k++) { const a = k * Math.PI / 6, c = Math.cos(a), d = Math.sin(a); s += `M${(20+c*5).toFixed(1)} ${(17+d*5).toFixed(1)} L${(20+c*14).toFixed(1)} ${(17+d*14).toFixed(1)} `; } return `<path d="${s}"/><circle cx="20" cy="17" r="2" ${F}/><path d="M6 38 L6 31 M34 38 L34 33 M2 38 H38"/>`; })();
const sakura = [0,1,2,3,4].map(k => { const a = (k*72-90)*Math.PI/180, x = (20+Math.cos(a)*9).toFixed(1), y = (19+Math.sin(a)*9).toFixed(1); return `<ellipse cx="${x}" cy="${y}" rx="5.5" ry="7.5" transform="rotate(${k*72} ${x} ${y})"/>`; }).join("");
export const MOTIFS = {
  kimono:["着物",`<path d="M3 10 L12 5 L28 5 L37 10 L37 19 L29 19 L29 37 L11 37 L11 19 L3 19 Z"/><path d="M16 5 L20 15 L24 5"/><rect x="11" y="22" width="18" height="5" ${F}/>`],
  sewing:["手芸",`<rect x="7" y="5" width="20" height="5" rx="1.5" ${F}/><rect x="7" y="32" width="20" height="5" rx="1.5" ${F}/><rect x="10" y="10" width="14" height="22"/><path d="M10 16 H24 M10 21 H24 M10 26 H24"/><path d="M32 3 L37 37"/><path d="M24 19 Q35 24 33 8"/>`],
  dining:["食事",`<circle cx="20" cy="21" r="10"/><circle cx="20" cy="21" r="5.5"/><path d="M4 5 V13 M7 5 V13 M10 5 V13 M4 13 H10 M7 13 V37"/><path d="M34 5 Q40 14 34 21 V37"/>`],
  tea:["お茶",`<path d="M7 16 H30 V23 Q30 34 18.5 34 Q7 34 7 23 Z"/><path d="M30 19 Q37 19 36 24.5 Q35 29.5 29 29"/><path d="M3 37.5 H35"/><path d="M14 12 Q11 8 14 4 M21 12 Q18 8 21 4"/>`],
  cake:["ケーキ",`<rect x="5" y="23" width="30" height="13" rx="1.5"/><rect x="10" y="13" width="20" height="10" rx="1.5"/><path d="M5 28 Q9 31 12.5 28 T20 28 T27.5 28 T35 28"/><path d="M20 6 V13"/><circle cx="20" cy="4" r="1.8" ${F}/>`],
  onsen:["温泉",`<path d="M4 25 Q4 37 20 37 Q36 37 36 25"/><path d="M12 22 Q8 17 12 12 Q16 7 12 2 M20 22 Q16 17 20 12 Q24 7 20 2 M28 22 Q24 17 28 12 Q32 7 28 2"/>`],
  sakura:["桜",`${sakura}<circle cx="20" cy="19" r="2.6" ${F}/><path d="M30 34 Q34 31 37 35 M5 36 Q8 33 11 36"/>`],
  camera:["カメラ",`<rect x="3" y="12" width="34" height="23" rx="3"/><rect x="13" y="7" width="12" height="5" rx="1" ${F}/><circle cx="20" cy="23.5" r="7.5"/><circle cx="20" cy="23.5" r="3" ${F}/><circle cx="31.5" cy="17" r="1.6" ${F}/>`],
  mic:["マイク",`<rect x="14" y="3" width="12" height="19" rx="6"/><path d="M14 10 H26 M14 15 H26"/><path d="M9 17 Q9 29 20 29 Q31 29 31 17"/><path d="M20 29 V36 M13 37 H27"/>`],
  tent:["キャンプ",`<path d="M3 34 L18 6 L33 34 Z"/><path d="M18 34 L18 17 L24 34"/><path d="M1 35 H39"/><path d="M33 34 L36 24 L39 34 Z" ${F}/><circle cx="33" cy="7" r="3"/>`],
  plane:["飛行機",`<path d="M2 21 L15 20 L24 5 L28.5 5 L24 20 L34 19.5 Q39.5 20.5 34 23 L24 23.5 L28.5 35 L24 35 L15 25 L2 24 Z" ${F}/><path d="M3 31 Q10 29 16 32"/>`],
  train:["電車",`<path d="M2 30 V20 Q2 13 10 13 H25 Q35 15 38 27 V30 Z"/><rect x="7" y="17" width="5" height="5" ${F}/><rect x="15" y="17" width="5" height="5" ${F}/><path d="M24 17 H29 Q31 19 32 22 H24 Z" ${F}/><path d="M0 35 H40 M6 35 V38 M18 35 V38 M30 35 V38"/>`],
  shrine:["鳥居",`<path d="M1 7 Q20 2 39 7 L38 11 Q20 7 2 11 Z" ${F}/><rect x="6" y="15" width="28" height="3.2" ${F}/><rect x="9" y="10" width="3.6" height="27" ${F}/><rect x="27.4" y="10" width="3.6" height="27" ${F}/><rect x="18.2" y="10" width="3.6" height="5" ${F}/>`],
  mountain:["山",`<path d="M1 36 L15 11 L22 22 L28 13 L39 36 Z"/><path d="M10.5 19 L15 11 L19.5 19 L17 17 L15 19.5 L13 17 Z" ${F}/><circle cx="32" cy="6" r="3"/>`],
  beach:["海",`<path d="M10 37 Q13 25 10 14"/><path d="M10 14 Q4 9 0 14 M10 14 Q16 8 21 13 M10 14 Q8 5 2 6 M10 14 Q14 5 19 5"/><path d="M24 17 A7 7 0 0 1 38 17 Z" ${F}/><path d="M18 26 Q22 23 26 26 T34 26 T42 26 M14 32 Q18 29 22 32 T30 32 T38 32"/>`],
  fireworks:["花火",fireworks],
  movie:["映画",`<rect x="3" y="15" width="34" height="21" rx="2"/><path d="M3 15 L35 7 L36.5 12 L4.5 20"/><path d="M11 13 L15 18 M19 11 L23 16 M27 9 L31 14"/><path d="M16 21 L25 25.5 L16 30 Z" ${F}/>`],
  book:["本",`<path d="M20 10 Q12 5 2 7 V33 Q12 31 20 35 Q28 31 38 33 V7 Q28 5 20 10 Z"/><path d="M20 10 V35"/><path d="M7 14 Q12 13 16 15 M7 20 Q12 19 16 21 M24 15 Q28 13 33 14 M24 21 Q28 19 33 20"/>`],
  museum:["美術館",`<path d="M2 13 L20 3 L38 13 Z" ${F}/><rect x="5" y="15" width="30" height="2.5" ${F}/><path d="M9 19 V31 M16 19 V31 M24 19 V31 M31 19 V31"/><rect x="3" y="32" width="34" height="4" ${F}/>`],
  star:["星",`<path d="M20 4 L24.4 14.5 L35.5 15.3 L27 22.6 L29.7 33.5 L20 27.5 L10.3 33.5 L13 22.6 L4.5 15.3 L15.6 14.5 Z"/><path d="M34 3 V9 M31 6 H37 M6 30 V36 M3 33 H9"/>`]
};
const KEYWORDS = [
  ["kimono",["着物","浴衣","和装","きもの","ゆかた"]],
  ["sewing",["手芸","裁縫","刺繍","編み物","ハンドメイド","ミシン","手作り"]],
  ["fireworks",["花火","祭り","まつり"]],
  ["sakura",["花見","桜","さくら"]],
  ["tea",["お茶","茶道","カフェ","抹茶","紅茶","喫茶","コーヒー","ティー"]],
  ["cake",["ケーキ","スイーツ","パフェ","お菓子","誕生日","ビュッフェ"]],
  ["dining",["マナー","ディナー","レストラン","フレンチ","ランチ","食事","ごはん","グルメ","食べ"]],
  ["onsen",["温泉","銭湯","サウナ","スパ"]],
  ["camera",["写真","カメラ","撮影","プリクラ"]],
  ["mic",["カラオケ","ライブ","コンサート","フェス","歌"]],
  ["tent",["キャンプ","グランピング","BBQ","バーベキュー","アウトドア"]],
  ["train",["電車","新幹線","鉄道","列車"]],
  ["plane",["旅行","旅","海外","飛行機"]],
  ["shrine",["神社","お寺","寺","参拝","初詣","御朱印"]],
  ["mountain",["登山","ハイキング","紅葉","山"]],
  ["beach",["海","ビーチ","プール","夏","島"]],
  ["movie",["映画","シネマ"]],
  ["museum",["美術館","博物館","展示","展覧会","アート"]],
  ["book",["読書","図書館","本"]]
];
export function motifKey(i){
  if (i.motif && MOTIFS[i.motif]) return i.motif;
  const t = String(i.title || "");
  for (const [m, words] of KEYWORDS) if (words.some(w => t.includes(w))) return m;
  return "star";
}
export const inkOf = i => INKS[Number.isInteger(i.ink) ? i.ink % INKS.length : hash(i.id) % INKS.length];
export const frameOf = i => Number.isInteger(i.frame) ? i.frame % 3 : hash(i.id) % 3;

// インクのかすれ（SVGフィルター）
(function installInk(){
  const s = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  s.setAttribute("width", "0"); s.setAttribute("height", "0"); s.setAttribute("aria-hidden", "true");
  s.style.position = "absolute";
  s.innerHTML = `<defs>${[0,1,2,3].map(n => `
    <filter id="ink${n}" x="-8%" y="-8%" width="116%" height="116%" color-interpolation-filters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="${n*7+3}" result="n"/>
      <feDisplacementMap in="SourceGraphic" in2="n" scale="1.5" xChannelSelector="R" yChannelSelector="G" result="d"/>
      <feTurbulence type="fractalNoise" baseFrequency="1.5" numOctaves="2" seed="${n*5+11}" result="n2"/>
      <feColorMatrix in="n2" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  11 0 0 0 -3.1" result="m"/>
      <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" seed="${n*3+29}" result="n3"/>
      <feColorMatrix in="n3" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  5 0 0 0 -0.95" result="m3"/>
      <feComposite in="m" in2="m3" operator="in" result="mm"/>
      <feComposite in="d" in2="mm" operator="in"/>
    </filter>`).join("")}
    <filter id="invlum" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="-0.3 -0.59 -0.11 0 1  -0.3 -0.59 -0.11 0 1  -0.3 -0.59 -0.11 0 1  0 0 0 1 0"/></filter></defs>`;
  document.body.appendChild(s);
})();

let uidc = 0;
function fitText(str, x, y, size, maxW, cls = ""){
  const t = [...String(str)].slice(0, 14).join("");
  const est = [...t].reduce((w, ch) => w + (ch.charCodeAt(0) < 256 ? size*0.6 : size), 0);
  const fit = est > maxW ? ` textLength="${maxW}" lengthAdjust="spacingAndGlyphs"` : "";
  return `<text x="${x}" y="${y}" font-size="${size}" text-anchor="middle" class="${cls}"${fit}>${esc(t)}</text>`;
}
// 管理者が用意した画像のスタンプ（cs: {data, mode, date}）
function customSVG(i, dateStr, cs){
  const h = hash(i.id), u = "cm" + (++uidc), withDate = cs.date !== false && !!dateStr;
  const img = `<image href="${esc(cs.data)}" x="0" y="0" width="120" height="${withDate ? 102 : 120}" preserveAspectRatio="xMidYMid meet"`;
  const dateT = withDate ? fitText(fmt(dateStr), 60, 115, 10, 70, "num") : "";
  const body = cs.mode === "original"
    ? `${img}/><g filter="url(#ink${h % 4})">${dateT}</g>`
    : `<g filter="url(#ink${h % 4})" opacity="0.92"><mask id="${u}" maskUnits="userSpaceOnUse" x="0" y="0" width="120" height="120">${img} filter="url(#invlum)"/></mask><rect width="120" height="120" fill="currentColor" mask="url(#${u})"/>${dateT}</g>`;
  return `<svg class="stp-svg" viewBox="0 0 120 120" aria-hidden="true" style="color:${inkOf(i)}">${body}</svg>`;
}
// スタンプのSVGを作る（i: 項目、dateStr: 押した日、custom: 画像スタンプの情報）
export function stampSVG(i, dateStr, custom){
  if (custom && String(custom.data || "").startsWith("data:image/")) return customSVG(i, dateStr, custom);
  const h = hash(i.id), style = frameOf(i), u = "sp" + (++uidc), m = motifKey(i);
  const icon = (tx, ty, s) => `<g transform="translate(${tx} ${ty}) scale(${s})" fill="none" stroke="currentColor" stroke-width="2.7" stroke-linecap="round" stroke-linejoin="round">${MOTIFS[m][1]}</g>`;
  const date = dateStr ? fmt(dateStr) : "";
  let body;
  if (style === 0) {
    const t = [...String(i.title)].slice(0, 12).join(""), est = [...t].length * 12;
    body = `<circle cx="60" cy="60" r="52" fill="none" stroke="currentColor" stroke-width="3.6"/>
      <circle cx="60" cy="60" r="45" fill="none" stroke="currentColor" stroke-width="1.3"/>
      <path id="${u}" d="M26 62 A34 34 0 0 1 94 62" fill="none"/>
      <text font-size="12"${est > 84 ? ` textLength="84" lengthAdjust="spacingAndGlyphs"` : ""}><textPath href="#${u}" startOffset="50%" text-anchor="middle">${esc(t)}</textPath></text>
      ${icon(42, 46, .9)}
      ${date ? fitText(date, 60, 96, 9.5, 52, "num") : ""}
      <path d="M86 6 q5 -4 10 0 t10 0 t10 0 M89 13 q5 -4 10 0 t10 0 t10 0 M92 20 q5 -4 10 0 t10 0 t8 0" fill="none" stroke="currentColor" stroke-width="2"/>`;
  } else if (style === 1) {
    body = `<rect x="9" y="9" width="102" height="102" rx="13" fill="none" stroke="currentColor" stroke-width="3.6"/>
      <rect x="15.5" y="15.5" width="89" height="89" rx="8" fill="none" stroke="currentColor" stroke-width="1.3"/>
      ${fitText(i.title, 60, 35, 13, 78)}
      <path d="M24 42 H96" stroke="currentColor" stroke-width="1.3"/>
      ${icon(42, 48, .9)}
      ${date ? `<path d="M24 89 H96" stroke="currentColor" stroke-width="1.3"/>${fitText(date, 60, 100, 9.5, 60, "num")}` : ""}`;
  } else {
    body = `<ellipse cx="60" cy="60" rx="45" ry="55" fill="none" stroke="currentColor" stroke-width="3.6"/>
      <ellipse cx="60" cy="60" rx="38.5" ry="48.5" fill="none" stroke="currentColor" stroke-width="1.3"/>
      <path d="M44 22 l3 -4 l3 4 M70 22 l3 -4 l3 4" fill="none" stroke="currentColor" stroke-width="1.4"/>
      ${fitText(i.title, 60, 36, 12, 60)}
      ${icon(41, 43, .95)}
      ${date ? fitText(date, 60, 96, 9.5, 52, "num") : ""}`;
  }
  return `<svg class="stp-svg" viewBox="0 0 120 120" aria-hidden="true" style="color:${inkOf(i)}"><g filter="url(#ink${h % 4})" opacity="0.9">${body}</g></svg>`;
}
