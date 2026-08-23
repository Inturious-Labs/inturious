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

  // ---- Rates ---------------------------------------------------------------

  var rates = null;          // { btc: 77000, ... } once loaded
  var ratesStale = false;

  function loadRates() {
    return fetch(CFG.api + '/api/tips/rates', { mode: 'cors' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        if (d && d.rates) {
          rates = d.rates;
          ratesStale = !!d.stale;
        }
      })
      .catch(function () { /* page still works without amounts */ });
  }

  // Dollars -> native units, trimmed to the asset's useful precision.
  function toNative(usd, method) {
    if (!rates || !rates[method.id]) return null;
    var raw = usd / rates[method.id];
    var d = method.decimals != null ? method.decimals : 6;
    var v = Number(raw.toFixed(d));
    return v > 0 ? v : null;
  }

  // Stablecoins sit at ~$1.00; assets worth thousands do not want cents.
  function formatUsd(v) {
    var opts = v >= 100 ? { maximumFractionDigits: 0 }
             : v >= 1   ? { maximumFractionDigits: 2 }
                        : { maximumFractionDigits: 4 };
    return '$' + v.toLocaleString('en-US', opts);
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

  function renderMethod(m, rerenderers) {
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

    var selectedUsd = CFG.defaultUsd;

    var amounts = document.createElement('div');
    amounts.className = 'tip-amounts';

    CFG.amountsUsd.forEach(function (usd) {
      var b = document.createElement('button');
      b.className = 'tip-amount';
      b.type = 'button';
      b.dataset.usd = String(usd);
      b.setAttribute('aria-pressed', String(usd === selectedUsd));

      b.textContent = '$' + usd;

      b.addEventListener('click', function () {
        selectedUsd = (selectedUsd === usd) ? null : usd;   // click again to clear
        Array.prototype.forEach.call(amounts.children, function (c) {
          c.setAttribute('aria-pressed', String(Number(c.dataset.usd) === selectedUsd));
        });
        update();
      });
      amounts.appendChild(b);
    });
    body.appendChild(amounts);

    var rateNote = document.createElement('p');
    rateNote.className = 'tip-rate-note';
    body.appendChild(rateNote);

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
      // A single quoted rate, linked to the source it came from, so a reader who
      // wants to check the number can do so in one click.
      rateNote.textContent = '';
      if (!rates || !rates[m.id]) {
        rateNote.textContent = 'Live rates unavailable — send any amount to the address below.';
      } else {
        rateNote.appendChild(document.createTextNode(
          '1 ' + m.symbol + ' \u2248 ' + formatUsd(rates[m.id])
          + (ratesStale ? ' (a few minutes old)' : '') + ' \u00b7 '
        ));
        var link = document.createElement('a');
        link.className = 'tip-rate-link';
        link.href = m.rateUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = 'check on CoinGecko';
        rateNote.appendChild(link);
      }

      var amt = selectedUsd == null ? null : toNative(selectedUsd, m);
      var uri = m.uri(m.address, amt, m.id === 'sol' ? visitRef : null);
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
    if (rerenderers) rerenderers.push(update);

    d.addEventListener('toggle', function () {
      if (d.open) report(m.id);
    });

    d.appendChild(body);

    if (isPlaceholder) d.dataset.placeholder = 'true';
    return d;
  }

  // Card is rendered like the crypto methods, but instead of an address it shows a
  // button that hands off to Stripe's hosted checkout.
  function renderCard() {
    var c = CFG.card;

    var d = document.createElement('details');
    d.className = 'tip-method';

    var s = document.createElement('summary');
    s.textContent = c.label;
    var sym = document.createElement('span');
    sym.className = 'tip-method-symbol';
    sym.textContent = c.symbol;
    s.appendChild(sym);
    d.appendChild(s);

    var body = document.createElement('div');
    body.className = 'tip-method-body';

    if (c.note) {
      var note = document.createElement('p');
      note.className = 'tip-note';
      note.textContent = c.note;
      body.appendChild(note);
    }

    var selectedUsd = CFG.defaultUsd;

    var amounts = document.createElement('div');
    amounts.className = 'tip-amounts';
    CFG.amountsUsd.forEach(function (usd) {
      var b = document.createElement('button');
      b.className = 'tip-amount';
      b.type = 'button';
      b.dataset.usd = String(usd);
      b.setAttribute('aria-pressed', String(usd === selectedUsd));
      b.textContent = '$' + usd;
      b.addEventListener('click', function () {
        selectedUsd = usd;   // card always needs an amount, so no toggling off
        Array.prototype.forEach.call(amounts.children, function (x) {
          x.setAttribute('aria-pressed', String(Number(x.dataset.usd) === selectedUsd));
        });
        go.textContent = 'Tip $' + selectedUsd;
      });
      amounts.appendChild(b);
    });
    body.appendChild(amounts);

    var go = document.createElement('button');
    go.className = 'tip-primary';
    go.type = 'button';
    go.textContent = 'Tip $' + selectedUsd;
    body.appendChild(go);

    var err = document.createElement('p');
    err.className = 'tip-card-error';
    err.hidden = true;
    body.appendChild(err);

    go.addEventListener('click', function () {
      go.disabled = true;
      go.textContent = 'Opening checkout…';
      err.hidden = true;

      fetch(CFG.api + '/api/tips/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        mode: 'cors',
        body: JSON.stringify({
          amount_usd: selectedUsd,
          src: src || null,
          article: article || null,
        }),
      })
        .then(function (r) { return r.ok ? r.json() : r.json().then(function (j) { throw new Error(j.error || 'failed'); }); })
        .then(function (j) {
          if (!j.url) throw new Error('no checkout url');
          window.location.href = j.url;
        })
        .catch(function (e) {
          go.disabled = false;
          go.textContent = 'Tip $' + selectedUsd;
          err.textContent = 'Could not open checkout. Please try again, or use one of the options above.';
          err.hidden = false;
        });
    });

    d.addEventListener('toggle', function () { if (d.open) report('card'); });
    d.appendChild(body);
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
  var rerenderers = [];

  CFG.methods.forEach(function (m) {
    if (m.address.indexOf('PLACEHOLDER') === 0) anyPlaceholder = true;
    container.appendChild(renderMethod(m, rerenderers));
  });

  // Render immediately with addresses, then fill in amounts when rates arrive.
  // The page is useful either way; this only ever adds information.
  loadRates().then(function () {
    rerenderers.forEach(function (fn) { fn(); });
  });

  if (anyPlaceholder) {
    document.getElementById('placeholder-warning').hidden = false;
  }

  if (CFG.card.enabled) {
    container.appendChild(renderCard());
  }

  // Stripe returns the reader here after a successful payment. The tip itself is
  // recorded from the webhook, so this is only an acknowledgement.
  if (params.get('tipped')) {
    var thanks = document.getElementById('tip-thanks');
    if (thanks) thanks.hidden = false;
    var url = new URL(location);
    url.searchParams.delete('tipped');
    history.replaceState({}, '', url);
  }

  report(null);   // page view
})();
