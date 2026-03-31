/* ============================================================
   セカイムラ京都 — 過去の活動 表示 + 絞り込み + ページネーション
   ============================================================ */

const CATEGORY_TAGS = [
  '田んぼ', '畑', '年中行事', '里山体験', '一般募集',
  'ご縁祭り', 'マルシェ', 'さとうみつろうさん', '発酵･保存食',
  '遊び企画', '新月･満月会', '忘年･新年会', '祭り部',
  '美山町', '京都市', 'その他'
];

const ITEMS_PER_PAGE = 3;

let allEvents     = [];
let filteredEvents = [];
let selectedYear  = '';
let selectedTag   = '';
let currentPage   = 1;

/* ── 日付フォーマット ── */
function formatDate(str) {
  if (!str) return '';
  const d = new Date(str);
  if (isNaN(d)) return str;
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

/* ── イベントカード生成 ── */
function renderPastEventCard(ev) {
  const imgs = ['画像1URL','画像2URL','画像3URL','画像4URL']
    .map(k => toDriveImgUrl((ev[k] || '').trim()))
    .filter(u => u);

  const imgHtml = imgs.length
    ? `<div class="past-ev__imgs">
        ${imgs.map(u =>
          `<img src="${u}" alt="${ev['タイトル'] || ''}" loading="lazy">`
        ).join('')}
       </div>`
    : '';

  const date  = ev['日付']    ? `<p class="past-ev__date">${formatDate(ev['日付'])}</p>` : '';
  const title = ev['タイトル'] ? `<h3 class="past-ev__title">${ev['タイトル']}</h3>`     : '';
  const desc  = ev['説明']    ? `<p class="past-ev__desc">${ev['説明']}</p>` : '';

  const tagBadges = [ev['タグ2'], ev['タグ3'], ev['場所タグ']]
    .filter(t => t && t.trim())
    .map(t => `<span class="past-ev__tag">${t}</span>`)
    .join('');
  const tagHtml = tagBadges ? `<div class="past-ev__tags">${tagBadges}</div>` : '';

  return `
    <article class="past-ev">
      <div class="past-ev__body">
        ${date}
        ${title}
        ${tagHtml}
      </div>
      ${imgHtml}
      <div class="past-ev__body">
        ${desc}
      </div>
    </article>`;
}

/* ── ページネーション HTML ── */
function buildPaginationHTML(total, current) {
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);
  if (totalPages <= 1) return '';

  return `
    <div class="pagination">
      <button class="pagination__btn" data-action="first"  ${current === 1 ? 'disabled' : ''}>&laquo; 最初</button>
      <button class="pagination__btn" data-action="prev"   ${current === 1 ? 'disabled' : ''}>&lsaquo; 前へ</button>
      <span class="pagination__info">${current} / ${totalPages}</span>
      <button class="pagination__btn" data-action="next"   ${current === totalPages ? 'disabled' : ''}>次へ &rsaquo;</button>
      <button class="pagination__btn" data-action="last"   ${current === totalPages ? 'disabled' : ''}>最後 &raquo;</button>
    </div>`;
}

/* ── 現在のページを描画 ── */
function renderCurrentPage() {
  const container = document.getElementById('past-events-list');
  if (!container) return;

  const totalPages = Math.ceil(filteredEvents.length / ITEMS_PER_PAGE);

  if (!filteredEvents.length) {
    container.innerHTML = '<p class="no-data">該当する活動がありません。</p>';
    return;
  }

  const start = (currentPage - 1) * ITEMS_PER_PAGE;
  const pageItems = filteredEvents.slice(start, start + ITEMS_PER_PAGE);

  container.innerHTML =
    pageItems.map(renderPastEventCard).join('') +
    buildPaginationHTML(filteredEvents.length, currentPage);

  // ページネーションイベント
  container.querySelectorAll('.pagination__btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;
      if (action === 'first') currentPage = 1;
      if (action === 'prev')  currentPage = Math.max(1, currentPage - 1);
      if (action === 'next')  currentPage = Math.min(totalPages, currentPage + 1);
      if (action === 'last')  currentPage = totalPages;
      renderCurrentPage();
      document.getElementById('past-events-filter')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

/* ── フィルターUI生成 ── */
function buildFilterUI(events) {
  const years = [...new Set(events.map(e => (e['年別タグ'] || '').trim()).filter(y => y))]
    .sort().reverse();

  const yearOptions = [
    '<option value="">すべての年</option>',
    ...years.map(y => `<option value="${y}">${y}</option>`)
  ].join('');

  const tagBtns = ['すべて表示', ...CATEGORY_TAGS]
    .map(t => {
      const val = t === 'すべて表示' ? '' : t;
      const active = val === '' ? ' active' : '';
      return `<button class="filter-tag${active}" data-tag="${val}">${t}</button>`;
    }).join('');

  return `
    <div class="filter-bar">
      <div class="filter-bar__year">
        <label class="filter-bar__label">年別</label>
        <select id="filter-year" class="filter-year-select">${yearOptions}</select>
      </div>
      <div class="filter-bar__category">
        <label class="filter-bar__label">カテゴリ</label>
        <div class="filter-bar__tags">${tagBtns}</div>
      </div>
    </div>`;
}

/* ── 絞り込み適用（ページを1に戻す） ── */
function applyFilter() {
  filteredEvents = allEvents.filter(ev => {
    const yearMatch = !selectedYear || (ev['年別タグ'] || '').trim() === selectedYear;
    const evTags = [ev['タグ2'], ev['タグ3'], ev['場所タグ']]
      .filter(t => t && t.trim());
    const tagMatch = !selectedTag || evTags.includes(selectedTag);
    return yearMatch && tagMatch;
  });
  currentPage = 1;
  renderCurrentPage();
}

/* ── メイン ── */
async function renderPastEvents(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = '<p class="loading-text">読み込み中…</p>';
  allEvents = await fetchPastEvents();

  if (!allEvents.length) {
    container.innerHTML = '<p class="no-data">現在、掲載できる活動情報がありません。</p>';
    return;
  }

  filteredEvents = [...allEvents];

  // フィルターUI挿入
  const filterWrapper = document.getElementById('past-events-filter');
  if (filterWrapper) {
    filterWrapper.innerHTML = buildFilterUI(allEvents);

    document.getElementById('filter-year').addEventListener('change', e => {
      selectedYear = e.target.value;
      applyFilter();
    });

    filterWrapper.querySelectorAll('.filter-tag').forEach(btn => {
      btn.addEventListener('click', () => {
        filterWrapper.querySelectorAll('.filter-tag').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedTag = btn.dataset.tag;
        applyFilter();
      });
    });
  }

  renderCurrentPage();
}

document.addEventListener('DOMContentLoaded', () => {
  renderPastEvents('past-events-list');
});
