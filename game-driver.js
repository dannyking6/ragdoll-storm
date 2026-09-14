/*
 * game-driver.js — neutral offline bridge for this Unity WebGL build.
 * Loaded FIRST, before the engine loader. Provides the gameplay-session /
 * ad-break bridge the build expects, backed by a local no-op SDK: ads resolve
 * instantly, progress stays on the device, and no network call is ever made.
 */
(function () {
  'use strict';

  // --- Local SDK shim (every method resolves immediately, never blocks) -----
  var localSDK = {
    init: function () { return Promise.resolve(); },
    setDebug: function () {},
    gameLoadingStart: function () {},
    gameLoadingProgress: function () {},
    gameLoadingFinished: function () {},
    gameplayStart: function () {},
    gameplayStop: function () {},
    happytime: function () {},
    happyTime: function () {},
    commercialBreak: function () { return Promise.resolve(); },
    rewardedBreak: function () { return Promise.resolve(true); },
    customBreak: function () { return Promise.resolve(); },
    isAdBlocked: function () { return false; },
    getLanguage: function () {
      return (navigator.languages && navigator.languages[0]) || navigator.language || 'en';
    },
    getURLParam: function () { return ''; },
    logError: function () {},
    log: function () {},
    measure: function () {},
    customEvent: function () {},
    sendEvent: function () {},
    openExternalLink: function () {},
    shareableURL: function () { return Promise.resolve(''); },
    getUser: function () { return Promise.reject(new Error('offline')); },
    getToken: function () { return Promise.reject(new Error('offline')); },
    login: function () { return Promise.reject(new Error('offline')); },
    destroyAd: function () {},
    displayAd: function () {},
    setBanner: function () {},
    hideBanner: function () {},
    moveTopRightLogo: function () {},
    position: function () { return { width: 0, height: 0, x: 0, y: 0 }; }
  };

  // The Unity framework resolves the SDK through the window global; the
  // jslib glue also calls window.commercialBreak / window.rewardedBreak /
  // window.shareableURL directly. All are served by the same local shim.
  window.SDK = window.SDK || localSDK;
  for (var k in localSDK) { if (!(k in window.SDK)) window.SDK[k] = localSDK[k]; }
  window.LokiSDK = window.SDK;
  window.GameDriver = window.SDK;

  // --- Engine-facing bridge -------------------------------------------------
  // The build calls these globals from jslib glue; results are delivered back
  // to the engine GameObject via SendMessage. The object name arrives via
  // initBridge (the glue passes it before any break is requested).
  var bridgeObj = null;

  function send(method, param) {
    try {
      if (window.unityGame && bridgeObj) window.unityGame.SendMessage(bridgeObj, method, param);
    } catch (e) { /* engine not ready or object gone: nothing to do */ }
  }

  window.initLokiBridge = function (name) {
    bridgeObj = name;
    // Engine may already be past init; confirm the bridge either way.
    send('OnSDKBridgeReady', '');
  };

  window.commercialBreak = function () {
    return Promise.resolve().then(function () { send('commercialBreakCompleted', ''); });
  };

  window.rewardedBreak = function () {
    // Standalone build: treat every rewarded request as granted.
    return Promise.resolve(true).then(function (r) { send('rewardedBreakCompleted', String(r)); });
  };

  window.shareableURL = function () {
    return Promise.resolve('').then(function (u) { send('shareableURLResolved', u); })
      .catch(function () { send('shareableURLRejected', ''); });
  };

  window.getUser = function () {
    // No accounts offline: the game falls back to local save.
    return Promise.reject().catch(function () { send('getUserRejected', ''); });
  };

  window.getToken = function () {
    return Promise.reject().catch(function () { send('getTokenRejected', ''); });
  };

  window.login = function () {
    return Promise.reject().catch(function () { send('loginRejected', ''); });
  };

  // Store/social URLs encoded in the build must never open: this is a
  // fully standalone delivery.
  window.open = function () { return null; };
})();
