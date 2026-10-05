(function () {
  'use strict';
  var key = 'rao-dental-cookie-preference';
  var version = 1;
  var lifetime = 180 * 24 * 60 * 60 * 1000;
  var preference = null;
  try {
    var saved = JSON.parse(localStorage.getItem(key));
    if (saved && saved.version === version && typeof saved.optional === 'boolean' &&
        typeof saved.savedAt === 'number' && saved.savedAt <= Date.now() &&
        Date.now() - saved.savedAt < lifetime) preference = saved;
  } catch (error) { /* The banner also works when browser storage is unavailable. */ }

  var banner = document.createElement('section');
  banner.className = 'cookie-banner';
  banner.setAttribute('aria-label', 'Cookie preferences');
  banner.hidden = Boolean(preference);
  banner.innerHTML = '<p class="cookie-eyebrow">Privacy &amp; cookies</p>' +
    '<h2 class="cookie-title">A little care for your privacy.</h2>' +
    '<p class="cookie-copy">We don’t currently use analytics or advertising cookies. ' +
    'You can set your preference for optional cookies below. We’ll remember your choice on this device.</p>' +
    '<div class="cookie-actions"><button class="cookie-button" type="button" data-optional="true">Accept all</button>' +
    '<button class="cookie-button cookie-button-secondary" type="button" data-optional="false">Essential only</button></div>' +
    '<details class="cookie-details"><summary>Cookie details</summary>' +
    '<p>Your preference is stored in your browser for 180 days. No analytics or advertising cookies are currently installed, whichever option you choose.</p></details>' +
    '<p class="cookie-current" hidden></p>';
  document.body.appendChild(banner);

  var settings = null;
  var reopened = false;
  var footer = document.querySelector('.ft-legal > span:last-child');
  if (footer) {
    settings = document.createElement('button');
    settings.type = 'button';
    settings.className = 'cookie-settings lnk';
    settings.textContent = 'Cookie Settings';
    footer.appendChild(settings);
    settings.addEventListener('click', function () {
      reopened = true;
      var current = banner.querySelector('.cookie-current');
      current.hidden = !preference;
      if (preference) current.textContent = 'Current preference: ' + (preference.optional ? 'Accept all' : 'Essential only');
      banner.hidden = false;
      banner.querySelector('.cookie-button').focus();
    });
  }
  banner.querySelectorAll('[data-optional]').forEach(function (button) {
    button.addEventListener('click', function () {
      preference = {version: version, optional: button.dataset.optional === 'true', savedAt: Date.now()};
      try { localStorage.setItem(key, JSON.stringify(preference)); } catch (error) { /* Keep the choice for this page session. */ }
      banner.hidden = true;
      if (settings && reopened) settings.focus({preventScroll: true});
    });
  });
  banner.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && preference) {
      banner.hidden = true;
      if (settings) settings.focus({preventScroll: true});
    }
  });
})();
