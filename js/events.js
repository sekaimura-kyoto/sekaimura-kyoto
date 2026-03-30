/* ============================================================
   セカイムラ京都 — イベント描画
   ============================================================ */

/* ── SVG アイコン ── */
const arrowSVG = `<svg viewBox="0 0 16 16"><path d="M3 8h10M9 4l4 4-4 4"/></svg>`;

/**
 * イベントカードの HTML を生成
 */
function renderEventCard(ev) {
  const title   = ev['タイトル']    || '';
  const date    = ev['日時']        || '';
  const place   = ev['場所']        || '';
  const desc    = ev['詳細']        || '';
  const recruit = ev['募集要項']    || '';
  const apply   = ev['お申し込み方法'] || '';
  const imgUrl  = toDriveImgUrl(ev['画像URL'] || '');
  const detUrl  = ev['詳細URL']     || '';

  const imgHtml = imgUrl
    ? `<img src="${escHtml(imgUrl)}" alt="${escHtml(title)}" loading="lazy">`
    : `<div class="event-card__img-placeholder">🌿</div>`;

  const hasDetail = desc || recruit || apply || detUrl;
  const cardId = `ev-${Math.random().toString(36).slice(2, 7)}`;

  const detailHtml = hasDetail ? `
    <div class="event-card__detail" id="${cardId}" hidden>
      ${desc    ? `<p class="event-card__desc">${escHtml(desc)}</p>` : ''}
      ${recruit ? `<div class="event-card__section"><span class="event-card__section-label">募集要項</span><p>${escHtml(recruit)}</p></div>` : ''}
      ${apply   ? `<div class="event-card__section"><span class="event-card__section-label">お申し込み方法</span><p>${escHtml(apply)}</p></div>` : ''}
      ${detUrl  ? `<a href="${escHtml(detUrl)}" class="event-card__link" target="_blank" rel="noopener">詳細・申し込みページへ ${arrowSVG}</a>` : ''}
    </div>
    <button class="event-card__toggle" data-target="${cardId}" aria-expanded="false">
      詳細を見る <span class="event-card__chevron">▼</span>
    </button>` : '';

  return `
    <article class="event-card fade-in">
      <div class="event-card__img">${imgHtml}</div>
      <div class="event-card__body">
        <div class="event-card__meta">
          <span class="event-card__date">${escHtml(date)}</span>
          ${place ? `<span class="event-card__place">📍 ${escHtml(place)}</span>` : ''}
        </div>
        <h3 class="event-card__title">${escHtml(title)}</h3>
        ${detailHtml}
      </div>
    </article>`;
}

/**
 * イベントグリッドをレンダリングする
 * @param {string} containerId - 描画先要素の ID
 * @param {'upcoming'|'past'|'all'} filter
 * @param {number} limit - 0 = 全件
 */
async function renderEvents(containerId, filter = 'upcoming', limit = 0) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = '<div class="loading">読み込み中…</div>';

  let events = await fetchEvents(filter);

  if (limit > 0) events = events.slice(0, limit);

  if (events.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <p>現在イベント情報はありません。</p>
      </div>`;
    return;
  }

  container.innerHTML = `<div class="events-grid">${events.map(renderEventCard).join('')}</div>`;

  // アコーディオン開閉
  container.querySelectorAll('.event-card__toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const detail = document.getElementById(btn.dataset.target);
      if (!detail) return;
      const opening = detail.hidden; // これから開く場合 true
      detail.hidden = !opening;
      btn.setAttribute('aria-expanded', opening);
      btn.innerHTML = opening
        ? '閉じる <span class="event-card__chevron">▲</span>'
        : '詳細を見る <span class="event-card__chevron">▼</span>';
    });
  });

  // Fade-in を再初期化（動的追加要素のため）
  initFadeIn(container);
}

/* ── HTML エスケープ ── */
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ── Intersection Observer 再適用 ── */
function initFadeIn(parent) {
  const els = parent.querySelectorAll('.fade-in');
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.1 });
  els.forEach((el, i) => {
    el.style.transitionDelay = `${(i % 6) * 0.08}s`;
    obs.observe(el);
  });
}

/**
 * 過去イベントカードの HTML を生成（複数画像対応）
 */
function renderPastEventCard(ev) {
  const title = ev['タイトル'] || '';
  const date  = ev['日付']    || '';
  const desc  = ev['説明']    || '';

  // 画像1URL〜4URL を収集（空でないもの）
  const imgs = ['画像1URL','画像2URL','画像3URL','画像4URL']
    .map(k => ev[k] || '')
    .filter(u => u);

  const imgHtml = imgs.length > 0
    ? `<div class="past-event-card__imgs">
        ${imgs.map(u => `<img src="${escHtml(u)}" alt="${escHtml(title)}" loading="lazy">`).join('')}
       </div>`
    : `<div class="past-event-card__img-placeholder">🌿</div>`;

  return `
    <article class="past-event-card fade-in">
      ${imgHtml}
      <div class="past-event-card__body">
        <span class="past-event-card__date">${escHtml(date)}</span>
        <h3 class="past-event-card__title">${escHtml(title)}</h3>
        ${desc ? `<p class="past-event-card__desc">${escHtml(desc)}</p>` : ''}
      </div>
    </article>`;
}

/**
 * 過去イベントをレンダリング（PastEventsシート使用）
 */
async function renderPastEventsList(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = '<div class="loading">読み込み中…</div>';

  const events = await fetchPastEvents();

  if (events.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <p>まだ記録がありません。</p>
      </div>`;
    return;
  }

  container.innerHTML = events.map(renderPastEventCard).join('');
  initFadeIn(container);
}

/* ── ホームページ用: 直近3件 ── */
async function renderHomeEvents() {
  await renderEvents('home-events', 'upcoming', 3);
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('home-events'))       renderHomeEvents();
  if (document.getElementById('events-list'))       renderEvents('events-list', 'upcoming', 0);
  if (document.getElementById('past-events-list'))  renderPastEventsList('past-events-list');
});
