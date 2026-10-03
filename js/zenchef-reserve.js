(function () {
  var RESTAURANT_ID = "385591";
  var SDK_WAIT_MS = 8000;
  var POLL_MS = 120;
  var PANEL_GAP = 12;
  var PANEL_MIN_HEIGHT = 440;
  var PANEL_WIDTH = 400;
  var suppressOpen = false;
  var userRequestedOpen = false;
  var sdkGuardTimer = null;

  var PANEL_STYLE_PROPS = [
    "position",
    "left",
    "right",
    "top",
    "bottom",
    "z-index",
    "width",
    "max-width",
    "height",
    "min-height",
    "max-height",
    "border-radius",
    "box-shadow",
    "overflow",
    "pointer-events",
    "visibility",
    "display",
    "border",
    "background",
  ];

  function getFab() {
    return document.querySelector(".zenchef-fab--fixed");
  }

  function getAnchor() {
    return document.querySelector(".zenchef-reserve-anchor");
  }

  function ensureWidgetConfig() {
    var config = document.querySelector(".zc-widget-config");
    if (!config) {
      config = document.createElement("div");
      config.className = "zc-widget-config";
      document.body.appendChild(config);
    }
    config.setAttribute("data-restaurant", RESTAURANT_ID);
    config.setAttribute("data-lang", "fr");
    config.setAttribute("data-position", "right");
    config.setAttribute("data-hide-default-button", "true");
    config.setAttribute("data-auto-open", "false");
    config.setAttribute("data-open-delay", "0");
    config.setAttribute("aria-hidden", "true");
  }

  function clearZenchefHash() {
    if (!window.location.hash) return;
    if (/zc-action/i.test(window.location.hash)) {
      history.replaceState(
        null,
        "",
        window.location.pathname + window.location.search
      );
    }
  }

  function setUserOpenedState(isOpen) {
    document.documentElement.classList.toggle("zc-user-opened", !!isOpen);
  }

  function hidePanelsUntilUserOpens() {
    if (userRequestedOpen) return;
    setUserOpenedState(false);
    getBookingPanels().forEach(function (el) {
      el.style.setProperty("display", "none", "important");
      el.style.setProperty("visibility", "hidden", "important");
      el.style.setProperty("pointer-events", "none", "important");
    });
  }

  function enforceClosedUntilClick() {
    if (userRequestedOpen) return;
    if (isWidgetOpen()) {
      if (window.ZenchefWidget && typeof window.ZenchefWidget.close === "function") {
        window.ZenchefWidget.close();
      }
      cleanupAfterClose();
    }
    hidePanelsUntilUserOpens();
  }

  function startSdkOpenGuard() {
    if (sdkGuardTimer) clearInterval(sdkGuardTimer);
    var started = Date.now();
    sdkGuardTimer = setInterval(function () {
      enforceClosedUntilClick();
      if (Date.now() - started > 12000) {
        clearInterval(sdkGuardTimer);
        sdkGuardTimer = null;
      }
    }, 200);
  }

  function patchZenchefApi() {
    if (!window.ZenchefWidget || window.ZenchefWidget.__zcClickOnlyPatched) return;

    var widget = window.ZenchefWidget;
    var originalOpen =
      typeof widget.open === "function" ? widget.open.bind(widget) : null;
    var originalToggle =
      typeof widget.toggle === "function" ? widget.toggle.bind(widget) : null;

    if (originalOpen) {
      widget.open = function () {
        if (!userRequestedOpen) return;
        return originalOpen();
      };
    }

    if (originalToggle) {
      widget.toggle = function () {
        if (!userRequestedOpen) {
          if (typeof widget.close === "function") widget.close();
          return;
        }
        return originalToggle();
      };
    }

    widget.__zcClickOnlyPatched = true;
  }

  function isOurFab(el) {
    return el && (el.classList.contains("zenchef-fab") || el.closest(".zenchef-fab"));
  }

  function isBookingPanel(el) {
    if (!el || el.nodeType !== 1) return false;
    if (el.classList.contains("zc-widget-config")) return false;
    if (el.id === "zc-hover-bridge") return false;
    if (isOurFab(el)) return false;
    if (el.closest(".zenchef-reserve-anchor")) return false;

    var tag = el.tagName;
    var src = el.src || "";
    var id = el.id || "";
    var cls = typeof el.className === "string" ? el.className : "";

    if (tag === "IFRAME" && /zenchef|bookings\.zenchef/i.test(src)) {
      return true;
    }

    if (/zc/i.test(id + cls)) {
      var rect = el.getBoundingClientRect();
      return rect.width > 80 || rect.height > 80;
    }

    return false;
  }

  function getBookingPanels() {
    var panels = [];
    document.querySelectorAll("iframe").forEach(function (el) {
      if (isBookingPanel(el)) panels.push(el);
    });
    document.querySelectorAll("body > div").forEach(function (el) {
      if (isBookingPanel(el) && panels.indexOf(el) === -1) panels.push(el);
    });
    return panels;
  }

  function isZenchefCloseControl(el) {
    if (!el || el.nodeType !== 1) return false;
    var cls = (typeof el.className === "string" ? el.className : "").toLowerCase();
    var label = (el.getAttribute("aria-label") || "").toLowerCase();
    return (
      el.getAttribute("data-zc-action") === "close" ||
      /close|fermer/i.test(cls + " " + label)
    );
  }

  function hideNativeZenchefTriggers() {
    document.querySelectorAll(
      [
        ".zc-widget-button",
        ".zc-floating-button",
        "[data-zc-floating]",
        "button[class*='zc-']",
        "a[class*='zc-'][class*='button']",
        "div[class*='zc-floating']",
        "div[class*='zc-button']",
      ].join(",")
    ).forEach(function (el) {
      if (isOurFab(el)) return;
      if (isBookingPanel(el)) return;
      if (isZenchefCloseControl(el)) return;
      el.style.setProperty("display", "none", "important");
      el.style.setProperty("visibility", "hidden", "important");
      el.style.setProperty("pointer-events", "none", "important");
    });
  }

  function resetPanelStyles(el) {
    if (!el) return;
    el.classList.remove("zc-booking-panel-positioned");
    PANEL_STYLE_PROPS.forEach(function (prop) {
      el.style.removeProperty(prop);
    });
  }

  function stripPanelChrome(el) {
    if (!el || el.nodeType !== 1) return;
    el.style.setProperty("background", "transparent", "important");
    el.style.setProperty("box-shadow", "none", "important");
    el.style.setProperty("border", "0", "important");
    el.style.setProperty("border-radius", "0", "important");

    var parent = el.parentElement;
    while (parent && parent !== document.body) {
      var id = parent.id || "";
      var cls = typeof parent.className === "string" ? parent.className : "";
      if (/zc/i.test(id + cls)) {
        parent.style.setProperty("background", "transparent", "important");
        parent.style.setProperty("box-shadow", "none", "important");
        parent.style.setProperty("border", "0", "important");
        parent.style.setProperty("border-radius", "0", "important");
      }
      parent = parent.parentElement;
    }
  }

  function cleanupAfterClose() {
    var bridge = document.getElementById("zc-hover-bridge");
    if (bridge) bridge.remove();
    document.documentElement.classList.remove("zc-panel-above-fab");
    document.querySelectorAll(".zc-booking-panel-positioned").forEach(resetPanelStyles);
  }

  function closeWidget() {
    userRequestedOpen = false;
    suppressOpen = true;
    if (window.ZenchefWidget && typeof window.ZenchefWidget.close === "function") {
      window.ZenchefWidget.close();
    }
    cleanupAfterClose();
    hidePanelsUntilUserOpens();
  }

  function releaseSuppressOpen() {
    setTimeout(function () {
      suppressOpen = false;
    }, 400);
  }

  function isWidgetOpen() {
    return (
      window.ZenchefWidget &&
      typeof window.ZenchefWidget.isOpened === "function" &&
      window.ZenchefWidget.isOpened()
    );
  }

  function positionPanelAboveFab() {
    if (!userRequestedOpen) return;
    var fab = getFab();
    if (!fab) return;

    var rect = fab.getBoundingClientRect();
    var rightOffset = Math.max(16, window.innerWidth - rect.right);
    var bottomOffset = Math.max(16, window.innerHeight - rect.top + PANEL_GAP);
    var maxHeight = Math.max(PANEL_MIN_HEIGHT, Math.min(560, rect.top - PANEL_GAP - 16));

    getBookingPanels().forEach(function (el) {
      el.classList.add("zc-booking-panel-positioned");
      el.style.setProperty("position", "fixed", "important");
      el.style.setProperty("left", "auto", "important");
      el.style.setProperty("right", rightOffset + "px", "important");
      el.style.setProperty("top", "auto", "important");
      el.style.setProperty("bottom", bottomOffset + "px", "important");
      el.style.setProperty("z-index", "9998", "important");
      el.style.setProperty("width", "min(" + PANEL_WIDTH + "px, calc(100vw - 32px))", "important");
      el.style.setProperty("max-width", "min(" + PANEL_WIDTH + "px, calc(100vw - 32px))", "important");
      el.style.setProperty("height", maxHeight + "px", "important");
      el.style.setProperty("min-height", PANEL_MIN_HEIGHT + "px", "important");
      el.style.setProperty("max-height", maxHeight + "px", "important");
      el.style.setProperty("border-radius", "0", "important");
      el.style.setProperty("box-shadow", "none", "important");
      el.style.setProperty("overflow", "visible", "important");
      el.style.setProperty("pointer-events", "auto", "important");
      el.style.setProperty("visibility", "visible", "important");
      el.style.setProperty("background", "transparent", "important");
      el.style.setProperty("border", "0", "important");

      if (el.tagName === "IFRAME") {
        el.style.setProperty("display", "block", "important");
      }

      stripPanelChrome(el);
    });

    document.documentElement.classList.add("zc-panel-above-fab");
  }

  function schedulePositionPanel() {
    positionPanelAboveFab();
    [80, 200, 400, 800, 1200].forEach(function (delay) {
      setTimeout(positionPanelAboveFab, delay);
    });
  }

  function openWidget() {
    if (!userRequestedOpen) return false;
    if (window.ZenchefWidget && typeof window.ZenchefWidget.open === "function") {
      window.ZenchefWidget.open();
      hideNativeZenchefTriggers();
      schedulePositionPanel();
      return true;
    }
    return false;
  }

  function waitThenOpen(start) {
    if (!userRequestedOpen) return;
    if (openWidget()) return;
    if (Date.now() - start > SDK_WAIT_MS) return;
    setTimeout(function () {
      waitThenOpen(start);
    }, POLL_MS);
  }

  function requestOpen() {
    if (suppressOpen) return;
    userRequestedOpen = true;
    setUserOpenedState(true);
    patchZenchefApi();
    if (!openWidget()) {
      waitThenOpen(Date.now());
    } else {
      schedulePositionPanel();
    }
  }

  function wireFabButton(link) {
    if (link.dataset.zcWired === "true") return;
    link.dataset.zcWired = "true";
    link.removeAttribute("data-zc-action");
    link.setAttribute("role", "button");
    link.href = "#";

    var lastActivateAt = 0;

    function handleFabActivate(e) {
      var now = Date.now();
      if (now - lastActivateAt < 450) return;
      lastActivateAt = now;

      e.preventDefault();
      e.stopPropagation();
      if (isWidgetOpen()) {
        closeWidget();
        releaseSuppressOpen();
        return;
      }
      suppressOpen = false;
      requestOpen();
    }

    link.addEventListener(
      "touchend",
      function (e) {
        handleFabActivate(e);
      },
      { passive: false }
    );

    link.addEventListener("click", function (e) {
      if (e.defaultPrevented) return;
      handleFabActivate(e);
    });
  }

  function wireAllFabs() {
    document.querySelectorAll(".zenchef-fab--fixed").forEach(wireFabButton);
  }

  function ensureSingleFab() {
    var anchor = getAnchor();
    var fab = getFab();
    if (anchor && fab && fab.parentNode !== anchor) {
      anchor.appendChild(fab);
    }
  }

  function ensureSdkScript() {
    if (document.getElementById("zenchef-sdk")) return;
    var script = document.createElement("script");
    script.id = "zenchef-sdk";
    script.src = "https://sdk.zenchef.com/v1/sdk.min.js";
    script.async = true;
    script.onload = function () {
      patchZenchefApi();
      enforceClosedUntilClick();
      startSdkOpenGuard();
      hideNativeZenchefTriggers();
      wireAllFabs();
    };
    document.body.appendChild(script);
  }

  function watchDom() {
    if (!window.MutationObserver) return;
    var timer;
    var observer = new MutationObserver(function () {
      clearTimeout(timer);
      timer = setTimeout(function () {
        hideNativeZenchefTriggers();
        enforceClosedUntilClick();
        if (userRequestedOpen && isWidgetOpen()) {
          positionPanelAboveFab();
        }
      }, 80);
    });
    observer.observe(document.body, { childList: true, subtree: true, attributes: true });
  }

  function bindWidgetEvents() {
    window.addEventListener("zc-widget-opened", function () {
      if (!userRequestedOpen) {
        enforceClosedUntilClick();
        return;
      }
      suppressOpen = false;
      schedulePositionPanel();
    });

    window.addEventListener("zc-widget-closed", function () {
      userRequestedOpen = false;
      suppressOpen = true;
      cleanupAfterClose();
      hidePanelsUntilUserOpens();
      releaseSuppressOpen();
    });

    window.addEventListener(
      "message",
      function (event) {
        if (!event || !event.data) return;
        var data = event.data;
        if (typeof data === "string") {
          if (/close|closed/i.test(data)) {
            suppressOpen = true;
            cleanupAfterClose();
            releaseSuppressOpen();
          }
          return;
        }
        if (typeof data === "object") {
          var action = data.action || data.type || data.event || "";
          if (/close|closed/i.test(String(action))) {
            suppressOpen = true;
            cleanupAfterClose();
            releaseSuppressOpen();
          }
        }
      },
      false
    );

    window.addEventListener("resize", positionPanelAboveFab);
    window.addEventListener("scroll", positionPanelAboveFab, true);
  }

  function init() {
    clearZenchefHash();
    ensureWidgetConfig();
    ensureSingleFab();
    wireAllFabs();
    ensureSdkScript();
    hideNativeZenchefTriggers();
    hidePanelsUntilUserOpens();
    watchDom();
    bindWidgetEvents();
    if (window.ZenchefWidget) {
      patchZenchefApi();
      enforceClosedUntilClick();
      startSdkOpenGuard();
      hideNativeZenchefTriggers();
      wireAllFabs();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
