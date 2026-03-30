/* ============================================================
   セカイムラ京都 — Google Sheets 連携ユーティリティ
   ============================================================

   ■ 使い方
   1. Google スプレッドシートを作成する
   2. 「共有」→「リンクを知っている全員が閲覧可能」に設定する
   3. スプレッドシートの URL から SHEET_ID をコピーする
      例: https://docs.google.com/spreadsheets/d/【SHEET_ID】/edit
   4. 下の SHEET_ID を書き換える
   5. 各シート名（タブ名）は下記の SHEET_NAMES に合わせる

   ■ シート構成
   - Events   : タイトル / 日時 / 場所 / 説明 / 画像URL / 詳細URL / 種別(upcoming|past)
   - Members  : 名前 / 居住地 / 画像URL / 得意なこと / 苦手なこと / DDP / SNSリンク / ひとこと / セカイムラ京都への想い
   ============================================================ */

/**
 * GViz API のセル値を適切な文字列に変換する
 * - 日付型: "Date(YYYY,M,D)" → "YYYY/MM/DD"  ※月は0始まりなので+1する
 * - その他: String() で文字列化
 */
function parseGVizValue(value) {
  if (typeof value === 'string') {
    const m = value.match(/^Date\((\d+),(\d+),(\d+)\)$/);
    if (m) {
      const year  = parseInt(m[1], 10);
      const month = parseInt(m[2], 10) + 1; // 0始まり → 1始まりに補正
      const day   = parseInt(m[3], 10);
      return `${year}/${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}`;
    }
  }
  return String(value).trim();
}

/**
 * Google Drive の共有URLを <img> で直接表示できる形式に変換する
 *   uc?export=view&id=FILE_ID  →  lh3.googleusercontent.com/d/FILE_ID
 *   /file/d/FILE_ID/view       →  lh3.googleusercontent.com/d/FILE_ID
 * Drive 以外のURLはそのまま返す
 */
function toDriveImgUrl(url) {
  if (!url) return '';
  // パターン1: ?id=FILE_ID または &id=FILE_ID
  const idParam = url.match(/[?&]id=([\w-]+)/);
  if (idParam && url.includes('drive.google.com')) {
    return `https://lh3.googleusercontent.com/d/${idParam[1]}`;
  }
  // パターン2: /file/d/FILE_ID/
  const filePath = url.match(/\/file\/d\/([\w-]+)/);
  if (filePath) {
    return `https://lh3.googleusercontent.com/d/${filePath[1]}`;
  }
  return url;
}

// ▼▼▼ ここを自分のスプレッドシートIDに書き換えてください ▼▼▼
const SHEET_ID = '1Tk9lCByGs2MegH2AdGYOfmEh3Mv_HkvNLFgEuc9UGrA';
// ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

const SHEET_NAMES = {
  events:     'pastevent',
  pastEvents: 'PastEvents',
  members:    'Members',
};

/**
 * Google Sheets GViz JSON API からデータを取得し
 * オブジェクトの配列として返す
 * @param {string} sheetName - シート名（タブ名）
 * @returns {Promise<Array<Object>>}
 */
async function fetchSheetData(sheetName) {
  if (SHEET_ID === 'YOUR_SHEET_ID_HERE') {
    console.warn('[sheets.js] SHEET_ID が設定されていません。js/sheets.js を編集してください。');
    return [];
  }

  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();

    // GViz は JSONP 形式なのでラッパーを除去する
    const match = text.match(/google\.visualization\.Query\.setResponse\(([\s\S]*)\)/);
    if (!match) throw new Error('GViz レスポンスのパースに失敗しました');

    const json = JSON.parse(match[1]);

    if (json.status !== 'ok') {
      console.error('[sheets.js] GViz エラー:', json.errors);
      return [];
    }

    let cols = json.table.cols.map(c => c.label.trim());
    let dataRows = json.table.rows || [];

    // 列ラベルがすべて空の場合（GVizがヘッダーを認識できなかった）は
    // 1行目をヘッダーとして使い、残りをデータ行とする
    if (cols.every(c => c === '') && dataRows.length > 0) {
      const headerRow = dataRows[0];
      cols = (headerRow.c || []).map(cell => cell && cell.v !== null ? String(cell.v).trim() : '');
      dataRows = dataRows.slice(1);
    }

    const rows = dataRows.map(row => {
      const obj = {};
      (row.c || []).forEach((cell, i) => {
        obj[cols[i]] = cell && cell.v !== null ? parseGVizValue(cell.v) : '';
      });
      return obj;
    });

    // 空行（全列が空）を除去
    return rows.filter(row => Object.values(row).some(v => v !== ''));

  } catch (err) {
    console.error('[sheets.js] データ取得エラー:', err);
    return [];
  }
}

/**
 * イベントデータを取得
 * @param {'upcoming'|'past'|'all'} filter
 */
async function fetchEvents(filter = 'all') {
  const rows = await fetchSheetData(SHEET_NAMES.events);
  if (filter === 'all') return rows;
  return rows.filter(r => r['種別'] === filter);
}

/**
 * 過去イベントデータを取得（新しい順）
 * シート列: 日付 | タイトル | 説明 | 画像URL
 */
async function fetchPastEvents() {
  const rows = await fetchSheetData(SHEET_NAMES.pastEvents);
  // 日付で降順ソート（新しい順）
  return rows.sort((a, b) => {
    const da = new Date(a['日付'] || 0);
    const db = new Date(b['日付'] || 0);
    return db - da;
  });
}

/**
 * メンバーデータを取得
 */
async function fetchMembers() {
  return await fetchSheetData(SHEET_NAMES.members);
}
