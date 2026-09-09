(function () {
  var CONTACT = {
    name: 'Niloy Biswas',
    familyName: 'Biswas',
    givenName: 'Niloy',
    phone: '+8801756770501',
    email: 'niloy.swe@gmail.com',
    company: '10 Minute School',
    jobTitle: 'BI Analyst and AI/LLM Engineer',
    website: 'https://niloy.tech',
    linkedin: 'https://www.linkedin.com/in/niloy--biswas/',
    postal: 'Dhaka, Bangladesh'
  };

  var VCARD = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    'FN:' + CONTACT.name,
    'N:' + CONTACT.familyName + ';' + CONTACT.givenName + ';;;',
    'ORG:' + CONTACT.company,
    'TITLE:' + CONTACT.jobTitle,
    'EMAIL;TYPE=INTERNET:' + CONTACT.email,
    'TEL;TYPE=CELL:' + CONTACT.phone,
    'URL:' + CONTACT.website,
    'URL:' + CONTACT.linkedin,
    'ADR;TYPE=WORK:;;Dhaka;;;Bangladesh;',
    'END:VCARD'
  ].join('\r\n');

  function isAndroid() {
    return /Android/i.test(navigator.userAgent);
  }

  function flashButton(btn, labelText) {
    if (!btn) return;
    var label = btn.querySelector('span');
    btn.classList.add('is-saved');
    if (label) label.textContent = labelText;
    setTimeout(function () {
      btn.classList.remove('is-saved');
      if (label) label.textContent = 'Save Contact';
    }, 2000);
  }

  function downloadVCard() {
    var blob = new Blob([VCARD], { type: 'text/vcard;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = url;
    link.download = 'Niloy-Biswas.vcf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  /**
   * Chrome / WebView on Android can open the native "Add contact" screen
   * via an Intent URI (same idea as iOS opening a .vcf). Other browsers
   * fall back to downloading the vCard.
   */
  function openAndroidAddContact() {
    var extras = [
      'S.name=' + encodeURIComponent(CONTACT.name),
      'S.phone=' + encodeURIComponent(CONTACT.phone),
      'S.email=' + encodeURIComponent(CONTACT.email),
      'S.company=' + encodeURIComponent(CONTACT.company),
      'S.job_title=' + encodeURIComponent(CONTACT.jobTitle),
      'S.postal=' + encodeURIComponent(CONTACT.postal),
      'S.notes=' + encodeURIComponent(CONTACT.website + '\n' + CONTACT.linkedin)
    ].join(';');

    window.location.href =
      'intent:#Intent;' +
      'action=android.intent.action.INSERT;' +
      'type=vnd.android.cursor.dir/contact;' +
      extras +
      ';end';
  }

  function saveContact() {
    var btn = document.getElementById('save-contact');

    if (isAndroid()) {
      openAndroidAddContact();
      flashButton(btn, 'Opening…');
      return;
    }

    downloadVCard();
    flashButton(btn, 'Saved!');
  }

  document.addEventListener('DOMContentLoaded', function () {
    var btn = document.getElementById('save-contact');
    if (btn) btn.addEventListener('click', saveContact);
  });
})();
