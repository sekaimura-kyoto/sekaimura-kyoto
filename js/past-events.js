/* ============================================================
   セカイムラ京都 — 過去のイベント表示
   ============================================================
   PastEvents シート列: 日付 | タイトル | 説明 | 画像URL
   ============================================================ */

function formatDate(str) {
  if (!str) return '';
  const d = new Date(str);
  if (isNaN(d)) return str;
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

function renderPastEventCard(ev) {
  // 画像1URL〜画像4URL を収集（空でないもの）
  const imgs = ['画像1URL','画像2URL','画像3URL','画像4URL']
    .map(k => toDriveImgUrl(ev[k] || ''))
    .filter(u => u);

  const imgHtml = imgs.length
    ? `<div class="past-ev__imgs">
        ${imgs.map(u => `<img src="${u}" alt="${ev['タイトル'] || ''}" loading="lazy">`).join('')}
       </div>`
    : '';

  const date  = ev['日付']    ? `<p class="past-ev__date">${formatDate(ev['日付'])}</p>` : '';
  const title = ev['タイトル'] ? `<h3 class="past-ev__title">${ev['タイトル']}</h3>`     : '';
  const desc  = ev['説明']    ? `<p class="past-ev__desc">${ev['説明']}</p>` : '';

  return `
    <article class="past-ev">
      <div class="past-ev__body">
        ${date}
        ${title}
      </div>
      ${imgHtml}
      <div class="past-ev__body">
        ${desc}
      </div>
    </article>`;
}

async function renderPastEvents(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = '<p class="loading-text">読み込み中…</p>';

  const events = await fetchPastEvents();

  if (!events.length) {
    container.innerHTML = '<p class="no-data">現在、掲載できるイベント情報がありません。</p>';
    return;
  }

  container.innerHTML = events.map(renderPastEventCard).join('');
}

document.addEventListener('DOMContentLoaded', () => {
  renderPastEvents('past-events-list');
});
