/**
 * Case study pages (projects/{slug}/) — keep project-only behavior out of custom-scripts.js
 */
(function () {
  'use strict';

  var back = document.querySelector('[data-case-study-back]');
  if (!back) return;

  back.addEventListener('click', function (e) {
    if (history.length < 2) return;
    try {
      var ref = document.referrer;
      if (!ref) return;
      var refUrl = new URL(ref);
      if (refUrl.origin !== location.origin) return;
      var path = refUrl.pathname.replace(/\/$/, '') || '/';
      if (path === '/' || path.endsWith('/index.html')) {
        e.preventDefault();
        history.back();
      }
    } catch (err) {
      /* fall through to href */
    }
  });
})();
