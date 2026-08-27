(function () {
  var VCARD = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    'FN:Niloy Biswas',
    'N:Biswas;Niloy;;;',
    'ORG:10 Minute School',
    'TITLE:BI Analyst and AI/LLM Engineer',
    'EMAIL;TYPE=INTERNET:niloy.swe@gmail.com',
    'TEL;TYPE=CELL:+8801756770501',
    'URL:https://niloy.tech',
    'URL:https://www.linkedin.com/in/niloy--biswas/',
    'ADR;TYPE=WORK:;;Dhaka;;;Bangladesh;',
    'END:VCARD'
  ].join('\r\n');

  function saveContact() {
    var btn = document.getElementById('save-contact');
    var blob = new Blob([VCARD], { type: 'text/vcard;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = url;
    link.download = 'Niloy-Biswas.vcf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);

    if (btn) {
      btn.classList.add('is-saved');
      var label = btn.querySelector('span');
      if (label) label.textContent = 'Saved!';
      setTimeout(function () {
        btn.classList.remove('is-saved');
        if (label) label.textContent = 'Save Contact';
      }, 2000);
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    var btn = document.getElementById('save-contact');
    if (btn) btn.addEventListener('click', saveContact);
  });
})();
