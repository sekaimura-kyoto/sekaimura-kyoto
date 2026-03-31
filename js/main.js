/* ============================================================
   セカイムラ京都 — 共通 JavaScript
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ===== Header scroll behavior ===== */
  const header = document.querySelector('.header');
  const isHeroPage = document.querySelector('.hero') !== null;

  function updateHeader() {
    const scrolled = window.scrollY > 60;
    header.classList.toggle('scrolled', scrolled);
    if (isHeroPage) {
      header.classList.toggle('hero-top', !scrolled);
    }
  }

  if (header) {
    if (isHeroPage) header.classList.add('hero-top');
    window.addEventListener('scroll', updateHeader, { passive: true });
    updateHeader();
  }

  /* ===== Mobile drawer ===== */
  const hamburger  = document.querySelector('.hamburger');
  const navDrawer  = document.querySelector('.nav-drawer');
  const drawerLinks = document.querySelectorAll('.nav-drawer .nav__link');

  if (hamburger && navDrawer) {
    hamburger.addEventListener('click', () => {
      const open = hamburger.classList.toggle('open');
      navDrawer.classList.toggle('open', open);
      document.body.style.overflow = open ? 'hidden' : '';
    });

    drawerLinks.forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('open');
        navDrawer.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }

  /* ===== Active nav link ===== */
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav__link[data-page]').forEach(link => {
    if (link.dataset.page === currentPath) {
      link.classList.add('active');
    }
  });

  /* ===== Carousel ===== */
  const carousel    = document.getElementById('top-carousel');
  const dotsWrap    = document.getElementById('carousel-dots');
  const btnPrev     = document.querySelector('.carousel__btn--prev');
  const btnNext     = document.querySelector('.carousel__btn--next');

  if (carousel) {
    const items      = carousel.querySelectorAll('.carousel__item');
    const total      = items.length;
    let current      = 0;
    let autoTimer;

    // 1画面に表示する枚数
    function visibleCount() {
      const w = window.innerWidth;
      if (w <= 640) return 1;
      if (w <= 860) return 2;
      return 3;
    }

    // スライド可能なポジション数（1枚ずつ移動）
    function pageCount() {
      return total - visibleCount() + 1;
    }

    // ドット生成
    function buildDots() {
      if (!dotsWrap) return;
      dotsWrap.innerHTML = '';
      const pages = pageCount();
      for (let i = 0; i < pages; i++) {
        const btn = document.createElement('button');
        btn.className = 'carousel__dot' + (i === 0 ? ' active' : '');
        btn.setAttribute('aria-label', `${i + 1}枚目`);
        btn.addEventListener('click', () => goTo(i));
        dotsWrap.appendChild(btn);
      }
    }

    function goTo(page) {
      const pages  = pageCount();
      current      = ((page % pages) + pages) % pages;
      const offset = current * (100 / total);
      carousel.style.transform = `translateX(-${offset}%)`;
      // ドット更新
      dotsWrap?.querySelectorAll('.carousel__dot').forEach((d, i) => {
        d.classList.toggle('active', i === current);
      });
    }

    function next() { goTo(current + 1); }
    function prev() { goTo(current - 1); }

    function startAuto() {
      autoTimer = setInterval(next, 4000);
    }
    function stopAuto() {
      clearInterval(autoTimer);
    }

    // 初期化
    buildDots();
    goTo(0);
    startAuto();

    btnPrev?.addEventListener('click', () => { stopAuto(); prev(); startAuto(); });
    btnNext?.addEventListener('click', () => { stopAuto(); next(); startAuto(); });

    // タッチスワイプ
    let touchX = 0;
    carousel.addEventListener('touchstart', e => { touchX = e.touches[0].clientX; }, { passive: true });
    carousel.addEventListener('touchend',   e => {
      const diff = touchX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 40) { stopAuto(); diff > 0 ? next() : prev(); startAuto(); }
    });

    // リサイズ時ドット再生成
    window.addEventListener('resize', () => { buildDots(); goTo(0); });
  }

  /* ===== Image Protection ===== */
  document.addEventListener('contextmenu', e => {
    if (e.target.tagName === 'IMG') e.preventDefault();
  });
  document.addEventListener('dragstart', e => {
    if (e.target.tagName === 'IMG') e.preventDefault();
  });

  // 透明レイヤー＋透かしのラッパーを画像に付加
  function wrapImg(img) {
    if (img.dataset.pw === '1') return;
    if (img.closest('.header') || img.closest('.back-to-top')) return;
    if (img.src && img.src.includes('ig.png')) return;

    img.dataset.pw = '1';
    const wrap = document.createElement('span');
    wrap.className = 'img-pw';
    img.parentNode.insertBefore(wrap, img);
    wrap.appendChild(img);
  }

  // 既存の画像を処理
  document.querySelectorAll('img').forEach(wrapImg);

  // 動的に追加される画像（スプレッドシートから描画）も処理
  const pwObserver = new MutationObserver(mutations => {
    mutations.forEach(m => m.addedNodes.forEach(node => {
      if (node.nodeType !== 1) return;
      if (node.tagName === 'IMG') { wrapImg(node); return; }
      node.querySelectorAll('img').forEach(wrapImg);
    }));
  });
  pwObserver.observe(document.body, { childList: true, subtree: true });

  /* ===== Back to Top Button ===== */
  const backToTop = document.createElement('button');
  backToTop.className = 'back-to-top';
  backToTop.setAttribute('aria-label', 'ページ上部に戻る');
  backToTop.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20"><path d="M12 4l-8 8h5v8h6v-8h5z" fill="currentColor"/></svg>';
  document.body.appendChild(backToTop);

  window.addEventListener('scroll', () => {
    backToTop.classList.toggle('visible', window.scrollY > 400);
  }, { passive: true });

  backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  /* ===== Fade-in on scroll ===== */
  const fadeEls = document.querySelectorAll('.fade-in');
  if (fadeEls.length > 0) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    fadeEls.forEach((el, i) => {
      // Stagger delay for sibling elements
      el.style.transitionDelay = `${(i % 6) * 0.08}s`;
      observer.observe(el);
    });
  }

});
