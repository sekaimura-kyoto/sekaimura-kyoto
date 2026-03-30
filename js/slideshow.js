/* ============================================================
   slideshow.js — ヒーロー直下スライドショー
   18枚（s1〜s18）を3枚ずつ、6セットでループ再生
   ============================================================ */
(function () {
  const TOTAL   = 18;
  const PER_SET = 3;
  const SETS    = TOTAL / PER_SET; // 6

  const STAGGER = 350;  // 各画像のフェードイン/アウトの時間差 (ms)
  const FADE    = 800;  // CSS transition の長さ (ms)
  const HOLD    = 2800; // 3枚揃ってから次のフェードアウトまでの保持時間 (ms)

  const IMAGES = Array.from({ length: TOTAL }, (_, i) =>
    'image/slide/s' + (i + 1) + '.jpg'
  );

  let items = [];

  /* ---- 初期化 ---- */
  function init() {
    items = Array.from(document.querySelectorAll('.slide-item'));
    if (!items.length) return;

    // 全画像をプリロード
    IMAGES.forEach(src => {
      const img = new Image();
      img.src = src;
    });

    runSet(0);
  }

  /* ---- 1セット分のアニメーション ---- */
  function runSet(setIndex) {
    const base = setIndex * PER_SET;

    // 画像ソースを更新（まだ非表示）
    items.forEach((item, i) => {
      item.querySelector('img').src = IMAGES[base + i];
    });

    // 左から順にフェードイン
    items.forEach((item, i) => {
      setTimeout(() => {
        item.classList.add('slide-visible');
      }, i * STAGGER);
    });

    // 全3枚が表示された後、保持してからフェードアウト開始
    const fadeOutStart = (PER_SET - 1) * STAGGER + FADE + HOLD;

    items.forEach((item, i) => {
      setTimeout(() => {
        item.classList.remove('slide-visible');
      }, fadeOutStart + i * STAGGER);
    });

    // 全消えたら次のセットへ
    const nextAt = fadeOutStart + (PER_SET - 1) * STAGGER + FADE + 300;
    setTimeout(() => {
      runSet((setIndex + 1) % SETS);
    }, nextAt);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
