/**
 * Tip page behaviour.
 *
 * Reads ?src= and ?a= from the URL, renders a card per payment method with a QR code
 * and copyable address, and reports to the API which article sent the reader here and
 * which method they opened.
 *
 * Everything degrades: if the API is unreachable the page still works, because the
 * addresses and QR codes are generated locally.
 */

(function () {
  'use strict';

  var CFG = window.TIP_CONFIG;
  var params = new URLSearchParams(location.search);
  var src = params.get('src');
  var article = params.get('a');

  if (!CFG.sources[src]) src = null;
  if (article && article.length > 200) article = article.slice(0, 200);

  var accent = src ? CFG.sources[src].accent : '#22d3ee';
  document.documentElement.style.setProperty('--tip-accent', accent);

  // A stable per-visit id. Solana Pay can carry it as `reference`, which is the one
  // chain where a tip can later be tied back to the article that prompted it.
  var visitRef = randomRef();

  function randomRef() {
    var b = new Uint8Array(16);
    (window.crypto || {}).getRandomValues
      ? window.crypto.getRandomValues(b)
      : b.forEach(function (_, i) { b[i] = Math.floor(Math.random() * 256); });
    return Array.from(b).map(function (x) { return x.toString(16).padStart(2, '0'); }).join('');
  }

  // ---- API -----------------------------------------------------------------

  var reported = {};

  function report(method) {
    if (!src) return;                       // nothing meaningful to attribute
    var key = method || '_view';
    if (reported[key]) return;              // one row per method per visit
    reported[key] = true;

    var body = JSON.stringify({
      src: src,
      article: article || null,
      method: method || null,
    });

    // keepalive lets the request survive the page being closed or navigating to a
    // wallet app, which is exactly when a method click happens.
    try {
      fetch(CFG.api + '/api/tips/visit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: body,
        keepalive: true,
        mode: 'cors',
      }).catch(function () { /* telemetry must never break tipping */ });
    } catch (e) { /* ignore */ }
  }

  // ---- QR ------------------------------------------------------------------

  function qrDataUri(text) {
    // Type 0 = auto-size. 'M' tolerates ~15% damage, fine for a screen.
    var q = qrcode(0, 'M');
    q.addData(text);
    q.make();
    return q.createDataURL(4, 8);
  }

  // ---- Rendering -----------------------------------------------------------

  function renderContext() {
    if (!src) return;
    var el = document.getElementById('tip-context');
    var from = document.createElement('span');
    from.className = 'tip-from';
    from.textContent = 'You came from ' + CFG.sources[src].name;
    if (article) {
      var a = document.createElement('span');
      a.className = 'tip-article';
      a.textContent = ' — ' + article.replace(/-/g, ' ');
      from.appendChild(a);
    }
    el.appendChild(from);
  }

  function renderMethod(m) {
    var isPlaceholder = m.address.indexOf('PLACEHOLDER') === 0;

    var d = document.createElement('details');
    d.className = 'tip-method';

    var s = document.createElement('summary');
    s.textContent = m.label;
    var sym = document.createElement('span');
    sym.className = 'tip-method-symbol';
    sym.textContent = m.symbol + (m.chain ? ' · ' + m.chain : '');
    s.appendChild(sym);
    d.appendChild(s);

    var body = document.createElement('div');
    body.className = 'tip-method-body';

    if (m.note) {
      var note = document.createElement('p');
      note.className = 'tip-note';
      note.textContent = m.note;
      body.appendChild(note);
    }

    var selected = null;

    var amounts = document.createElement('div');
    amounts.className = 'tip-amounts';
    m.amounts.forEach(function (amt) {
      var b = document.createElement('button');
      b.className = 'tip-amount';
      b.type = 'button';
      b.setAttribute('aria-pressed', 'false');
      b.textContent = amt + ' ' + m.symbol;
      b.addEventListener('click', function () {
        selected = (selected === amt) ? null : amt;   // click again to clear
        Array.prototype.forEach.call(amounts.children, function (c) {
          c.setAttribute('aria-pressed', String(c === b && selected !== null));
        });
        update();
      });
      amounts.appendChild(b);
    });
    body.appendChild(amounts);

    var qrWrap = document.createElement('div');
    qrWrap.className = 'tip-qr';
    body.appendChild(qrWrap);

    var row = document.createElement('div');
    row.className = 'tip-address-row';
    var addr = document.createElement('code');
    addr.className = 'tip-address';
    addr.textContent = m.address;
    row.appendChild(addr);

    var copy = document.createElement('button');
    copy.className = 'tip-copy';
    copy.type = 'button';
    copy.textContent = 'Copy';
    copy.addEventListener('click', function () {
      copyText(m.address, copy);
    });
    row.appendChild(copy);
    body.appendChild(row);

    var open = document.createElement('a');
    open.className = 'tip-open-wallet';
    open.textContent = 'Open in wallet →';
    body.appendChild(open);

    function update() {
      var uri = m.uri(m.address, selected, m.id === 'sol' ? visitRef : null);
      qrWrap.innerHTML = '';
      var img = new Image();
      img.src = qrDataUri(uri);
      img.alt = m.label + ' address QR code';
      qrWrap.appendChild(img);
      open.href = uri;
      // A bare account identifier is not a link; ICP wallets take a pasted address.
      open.hidden = (m.id === 'icp');
    }

    update();

    d.addEventListener('toggle', function () {
      if (d.open) report(m.id);
    });

    d.appendChild(body);

    if (isPlaceholder) d.dataset.placeholder = 'true';
    return d;
  }

  function copyText(text, btn) {
    var done = function () {
      var was = btn.textContent;
      btn.textContent = 'Copied';
      btn.classList.add('copied');
      setTimeout(function () {
        btn.textContent = was;
        btn.classList.remove('copied');
      }, 1600);
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, fallback);
    } else {
      fallback();
    }

    function fallback() {
      // execCommand is deprecated but remains the only path in insecure contexts
      // and some in-app browsers.
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); done(); } catch (e) { /* ignore */ }
      document.body.removeChild(ta);
    }
  }

  // ---- Boot ----------------------------------------------------------------

  renderContext();

  var container = document.getElementById('methods');
  var anyPlaceholder = false;

  CFG.methods.forEach(function (m) {
    if (m.address.indexOf('PLACEHOLDER') === 0) anyPlaceholder = true;
    container.appendChild(renderMethod(m));
  });

  if (anyPlaceholder) {
    document.getElementById('placeholder-warning').hidden = false;
  }

  if (CFG.card.enabled) {
    document.getElementById('card-section').hidden = false;
  }

  report(null);   // page view
})();
