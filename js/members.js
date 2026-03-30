/* ============================================================
   セカイムラ京都 — メンバー描画
   ============================================================ */

/* ── SVG アイコン ── */
const chevronSVG  = `<svg viewBox="0 0 16 16"><path d="M4 6l4 4 4-4"/></svg>`;
const instaSVG    = `<svg viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>`;

/**
 * メンバーカードの HTML を生成
 */
function renderMemberCard(m) {
  const name    = m['名前']               || '';
  const area    = m['居住地']             || '';
  const imgUrl  = toDriveImgUrl(m['画像URL'] || '');
  const good    = m['得意なこと']         || '';
  const bad     = m['苦手なこと']         || '';
  const ddp     = m['DDP']               || '';
  const sns     = m['SNSリンク']          || '';
  const word    = m['ひとこと']           || '';
  const thought = m['セカイムラ京都への想い'] || '';

  const imgHtml = imgUrl
    ? `<img src="${escHtml(imgUrl)}" alt="${escHtml(name)}" loading="lazy">`
    : `<div class="member-card__img-placeholder">👤</div>`;

  const snsHtml = sns
    ? `<div class="member-card__sns">
        <a href="${escHtml(sns)}" target="_blank" rel="noopener">
          ${instaSVG} Instagram
        </a>
       </div>`
    : '';

  const rows = [
    ['得意なこと', good],
    ['苦手なこと', bad],
    ['DDP',       ddp],
    ['ひとこと',  word],
    ['想い',      thought],
  ].filter(([, v]) => v);

  const detailHtml = rows.map(([label, val]) => `
    <div class="member-detail-row">
      <span class="member-detail-label">${escHtml(label)}</span>
      <span class="member-detail-value">${escHtml(val)}</span>
    </div>`).join('');

  const cardId = `mc-${Math.random().toString(36).slice(2, 7)}`;

  return `
    <article class="member-card fade-in">
      <div class="member-card__img">${imgHtml}</div>
      <div class="member-card__body">
        ${area ? `<p class="member-card__area">${escHtml(area)}</p>` : ''}
        <h3 class="member-card__name">${escHtml(name)}</h3>
        ${word ? `<p class="member-card__tagline">${escHtml(word)}</p>` : ''}
        ${(rows.length > 0 || sns) ? `
          <button class="member-card__toggle" data-target="${cardId}" aria-expanded="false">
            もっと見る ${chevronSVG}
          </button>
          <div class="member-card__detail" id="${cardId}">
            ${detailHtml}
            ${snsHtml}
          </div>
        ` : ''}
      </div>
    </article>`;
}

/**
 * メンバーグリッドをレンダリング
 */
async function renderMembers() {
  const container = document.getElementById('members-list');
  if (!container) return;

  container.innerHTML = '<div class="loading">読み込み中…</div>';

  const members = await fetchMembers();

  if (members.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <p>現在メンバー情報はありません。</p>
      </div>`;
    return;
  }

  container.innerHTML = `<div class="members-grid">${members.map(renderMemberCard).join('')}</div>`;

  // アコーディオン
  container.querySelectorAll('.member-card__toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = document.getElementById(btn.dataset.target);
      if (!target) return;
      const open = target.classList.toggle('open');
      btn.classList.toggle('open', open);
      btn.setAttribute('aria-expanded', open);
      btn.querySelector('span') && (btn.querySelector('span').textContent = open ? '閉じる' : 'もっと見る');
      // テキストノード更新（SVG前のテキスト）
      btn.childNodes.forEach(n => {
        if (n.nodeType === 3) n.textContent = open ? '閉じる ' : 'もっと見る ';
      });
    });
  });

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

document.addEventListener('DOMContentLoaded', renderMembers);
