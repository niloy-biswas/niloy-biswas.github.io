/**
 * Contact section — config, "Say hi!" focus, Formspree AJAX.
 * Styles: assets/css/contact-section.css
 */
(function () {
  'use strict';

  var CONFIG = {
    bookingUrl: 'https://calendar.app.google/iUkEPuo8fcdPuhgy6',
    successMessage: "Your message is received and I'll get back to you shortly.",
    errorMessage: 'Oops! There was a problem sending your message.'
  };

  document.addEventListener('DOMContentLoaded', function () {
    initSayHi();
    initBookingLink();
    initContactForm();
  });

  function initSayHi() {
    var focusBtn = document.querySelector('[data-contact-focus]');
    var firstInput = document.getElementById('firstName');
    if (!focusBtn || !firstInput) return;

    focusBtn.addEventListener('click', function () {
      firstInput.focus({ preventScroll: true });
      firstInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  function initBookingLink() {
    var link = document.getElementById('contact-booking-link');
    if (!link) return;

    var url = CONFIG.bookingUrl.trim();
    var item = link.closest('[data-contact-booking]');

    if (!url) {
      if (item) item.hidden = true;
      return;
    }

    link.href = url;
  }

  function initContactForm() {
    var form = document.getElementById('contactForm');
    var msgSubmit = document.getElementById('msgSubmit');
    if (!form || !msgSubmit) return;

    function showStatus(type, html) {
      msgSubmit.innerHTML = html;
      msgSubmit.classList.remove('hidden', 'is-success', 'is-error', 'is-visible');
      msgSubmit.classList.add(type === 'success' ? 'is-success' : 'is-error');
      void msgSubmit.offsetWidth;
      msgSubmit.classList.add('is-visible');
    }

    function showSuccess() {
      form.reset();
      showStatus(
        'success',
        '<span class="contact-section__form-status-icon" aria-hidden="true">&#10003;</span>' +
          '<span class="contact-section__form-status-copy">' +
          CONFIG.successMessage +
          '</span>'
      );
    }

    function showError() {
      showStatus(
        'error',
        '<span class="contact-section__form-status-copy">' + CONFIG.errorMessage + '</span>'
      );
    }

    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var xhr = new XMLHttpRequest();
      xhr.open(form.method, form.action);
      xhr.setRequestHeader('Accept', 'application/json');
      xhr.onreadystatechange = function () {
        if (xhr.readyState !== XMLHttpRequest.DONE) return;
        if (xhr.status === 200) showSuccess();
        else showError();
      };
      xhr.send(new FormData(form));
    });
  }
})();
