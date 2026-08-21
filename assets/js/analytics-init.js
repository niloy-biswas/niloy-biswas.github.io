/**
 * GA4 + Microsoft Clarity bootstrap. Single source of truth for both snippets
 * so every page configures them identically (cookie_domain, IDs).
 * Also mints a persistent pseudonymous id (localStorage) so GA4/Clarity can
 * tie repeat visits from the same browser to one visitor. Not a real login-based
 * identity: cleared if the user clears storage, and not shared across browsers/devices.
 */
(function () {
  var GA_ID = 'G-MDND743N8W';
  var CLARITY_ID = 'jf2n0138eg';
  var UID_KEY = 'niloy_uid';

  function getOrCreateUid() {
    try {
      var uid = localStorage.getItem(UID_KEY);
      if (uid) return uid;
      uid = (crypto && crypto.randomUUID) ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0;
        var v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
      localStorage.setItem(UID_KEY, uid);
      return uid;
    } catch (e) {
      return null;
    }
  }

  // First-touch attribution: GA4 re-attributes source/medium every new session
  // (30min timeout / new day / new campaign param), so a lead who arrives via
  // LinkedIn today and submits the contact form next week shows as "direct".
  // Capture it once, keep it for the life of the browser profile.
  function getFirstTouch() {
    var KEY = 'niloy_first_touch';
    try {
      var stored = localStorage.getItem(KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {}

    var params = new URLSearchParams(window.location.search);
    var ref = document.referrer;
    var refHost = null;
    if (ref) {
      try { refHost = new URL(ref).hostname; } catch (e) {}
    }

    var data = {
      first_source: params.get('utm_source') || refHost || '(direct)',
      first_medium: params.get('utm_medium') || (refHost ? 'referral' : '(none)'),
      first_campaign: params.get('utm_campaign') || '(not set)',
      landing_page: window.location.pathname
    };

    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) {}
    return data;
  }

  var uid = getOrCreateUid();
  var firstTouch = getFirstTouch();
  window.niloyFirstTouch = firstTouch;

  // Google tag (gtag.js)
  window.dataLayer = window.dataLayer || [];
  function gtag() { dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag('js', new Date());

  gtag('set', 'user_properties', firstTouch);

  var gaConfig = { cookie_domain: 'niloy.tech' };
  if (uid) gaConfig.user_id = uid;
  gtag('config', GA_ID, gaConfig);

  var gaScript = document.createElement('script');
  gaScript.async = true;
  gaScript.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
  document.head.appendChild(gaScript);

  // Microsoft Clarity
  (function (c, l, a, r, i, t, y) {
    c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments) };
    t = l.createElement(r); t.async = 1; t.src = 'https://www.clarity.ms/tag/' + i;
    y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
  })(window, document, 'clarity', 'script', CLARITY_ID);

  if (uid) window.clarity('identify', uid);
  window.clarity('set', 'first_source', firstTouch.first_source);
  window.clarity('set', 'first_medium', firstTouch.first_medium);
})();
