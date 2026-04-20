"use strict";
(self["webpackChunktext_to_audio"] = self["webpackChunktext_to_audio"] || []).push([["tab-maintenance"],{

/***/ "./src/dashboard/components/dashboard/maintenance/Maintenance.js":
/*!***********************************************************************!*\
  !*** ./src/dashboard/components/dashboard/maintenance/Maintenance.js ***!
  \***********************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ Maintenance)
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "./node_modules/react/index.js");
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wordpress/i18n */ "./node_modules/@wordpress/i18n/build-module/index.js");
/* harmony import */ var react_toastify__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! react-toastify */ "./node_modules/react-toastify/dist/react-toastify.esm.js");
/* harmony import */ var react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! react/jsx-runtime */ "./node_modules/react/jsx-runtime.js");
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _regeneratorRuntime() { "use strict"; /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */ _regeneratorRuntime = function _regeneratorRuntime() { return r; }; var t, r = {}, e = Object.prototype, n = e.hasOwnProperty, o = "function" == typeof Symbol ? Symbol : {}, i = o.iterator || "@@iterator", a = o.asyncIterator || "@@asyncIterator", u = o.toStringTag || "@@toStringTag"; function c(t, r, e, n) { return Object.defineProperty(t, r, { value: e, enumerable: !n, configurable: !n, writable: !n }); } try { c({}, ""); } catch (t) { c = function c(t, r, e) { return t[r] = e; }; } function h(r, e, n, o) { var i = e && e.prototype instanceof Generator ? e : Generator, a = Object.create(i.prototype); return c(a, "_invoke", function (r, e, n) { var o = 1; return function (i, a) { if (3 === o) throw Error("Generator is already running"); if (4 === o) { if ("throw" === i) throw a; return { value: t, done: !0 }; } for (n.method = i, n.arg = a;;) { var u = n.delegate; if (u) { var c = d(u, n); if (c) { if (c === f) continue; return c; } } if ("next" === n.method) n.sent = n._sent = n.arg;else if ("throw" === n.method) { if (1 === o) throw o = 4, n.arg; n.dispatchException(n.arg); } else "return" === n.method && n.abrupt("return", n.arg); o = 3; var h = s(r, e, n); if ("normal" === h.type) { if (o = n.done ? 4 : 2, h.arg === f) continue; return { value: h.arg, done: n.done }; } "throw" === h.type && (o = 4, n.method = "throw", n.arg = h.arg); } }; }(r, n, new Context(o || [])), !0), a; } function s(t, r, e) { try { return { type: "normal", arg: t.call(r, e) }; } catch (t) { return { type: "throw", arg: t }; } } r.wrap = h; var f = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} var l = {}; c(l, i, function () { return this; }); var p = Object.getPrototypeOf, y = p && p(p(x([]))); y && y !== e && n.call(y, i) && (l = y); var v = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(l); function g(t) { ["next", "throw", "return"].forEach(function (r) { c(t, r, function (t) { return this._invoke(r, t); }); }); } function AsyncIterator(t, r) { function e(o, i, a, u) { var c = s(t[o], t, i); if ("throw" !== c.type) { var h = c.arg, f = h.value; return f && "object" == _typeof(f) && n.call(f, "__await") ? r.resolve(f.__await).then(function (t) { e("next", t, a, u); }, function (t) { e("throw", t, a, u); }) : r.resolve(f).then(function (t) { h.value = t, a(h); }, function (t) { return e("throw", t, a, u); }); } u(c.arg); } var o; c(this, "_invoke", function (t, n) { function i() { return new r(function (r, o) { e(t, n, r, o); }); } return o = o ? o.then(i, i) : i(); }, !0); } function d(r, e) { var n = e.method, o = r.i[n]; if (o === t) return e.delegate = null, "throw" === n && r.i["return"] && (e.method = "return", e.arg = t, d(r, e), "throw" === e.method) || "return" !== n && (e.method = "throw", e.arg = new TypeError("The iterator does not provide a '" + n + "' method")), f; var i = s(o, r.i, e.arg); if ("throw" === i.type) return e.method = "throw", e.arg = i.arg, e.delegate = null, f; var a = i.arg; return a ? a.done ? (e[r.r] = a.value, e.next = r.n, "return" !== e.method && (e.method = "next", e.arg = t), e.delegate = null, f) : a : (e.method = "throw", e.arg = new TypeError("iterator result is not an object"), e.delegate = null, f); } function w(t) { this.tryEntries.push(t); } function m(r) { var e = r[4] || {}; e.type = "normal", e.arg = t, r[4] = e; } function Context(t) { this.tryEntries = [[-1]], t.forEach(w, this), this.reset(!0); } function x(r) { if (null != r) { var e = r[i]; if (e) return e.call(r); if ("function" == typeof r.next) return r; if (!isNaN(r.length)) { var o = -1, a = function e() { for (; ++o < r.length;) if (n.call(r, o)) return e.value = r[o], e.done = !1, e; return e.value = t, e.done = !0, e; }; return a.next = a; } } throw new TypeError(_typeof(r) + " is not iterable"); } return GeneratorFunction.prototype = GeneratorFunctionPrototype, c(v, "constructor", GeneratorFunctionPrototype), c(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = c(GeneratorFunctionPrototype, u, "GeneratorFunction"), r.isGeneratorFunction = function (t) { var r = "function" == typeof t && t.constructor; return !!r && (r === GeneratorFunction || "GeneratorFunction" === (r.displayName || r.name)); }, r.mark = function (t) { return Object.setPrototypeOf ? Object.setPrototypeOf(t, GeneratorFunctionPrototype) : (t.__proto__ = GeneratorFunctionPrototype, c(t, u, "GeneratorFunction")), t.prototype = Object.create(v), t; }, r.awrap = function (t) { return { __await: t }; }, g(AsyncIterator.prototype), c(AsyncIterator.prototype, a, function () { return this; }), r.AsyncIterator = AsyncIterator, r.async = function (t, e, n, o, i) { void 0 === i && (i = Promise); var a = new AsyncIterator(h(t, e, n, o), i); return r.isGeneratorFunction(e) ? a : a.next().then(function (t) { return t.done ? t.value : a.next(); }); }, g(v), c(v, u, "Generator"), c(v, i, function () { return this; }), c(v, "toString", function () { return "[object Generator]"; }), r.keys = function (t) { var r = Object(t), e = []; for (var n in r) e.unshift(n); return function t() { for (; e.length;) if ((n = e.pop()) in r) return t.value = n, t.done = !1, t; return t.done = !0, t; }; }, r.values = x, Context.prototype = { constructor: Context, reset: function reset(r) { if (this.prev = this.next = 0, this.sent = this._sent = t, this.done = !1, this.delegate = null, this.method = "next", this.arg = t, this.tryEntries.forEach(m), !r) for (var e in this) "t" === e.charAt(0) && n.call(this, e) && !isNaN(+e.slice(1)) && (this[e] = t); }, stop: function stop() { this.done = !0; var t = this.tryEntries[0][4]; if ("throw" === t.type) throw t.arg; return this.rval; }, dispatchException: function dispatchException(r) { if (this.done) throw r; var e = this; function n(t) { a.type = "throw", a.arg = r, e.next = t; } for (var o = e.tryEntries.length - 1; o >= 0; --o) { var i = this.tryEntries[o], a = i[4], u = this.prev, c = i[1], h = i[2]; if (-1 === i[0]) return n("end"), !1; if (!c && !h) throw Error("try statement without catch or finally"); if (null != i[0] && i[0] <= u) { if (u < c) return this.method = "next", this.arg = t, n(c), !0; if (u < h) return n(h), !1; } } }, abrupt: function abrupt(t, r) { for (var e = this.tryEntries.length - 1; e >= 0; --e) { var n = this.tryEntries[e]; if (n[0] > -1 && n[0] <= this.prev && this.prev < n[2]) { var o = n; break; } } o && ("break" === t || "continue" === t) && o[0] <= r && r <= o[2] && (o = null); var i = o ? o[4] : {}; return i.type = t, i.arg = r, o ? (this.method = "next", this.next = o[2], f) : this.complete(i); }, complete: function complete(t, r) { if ("throw" === t.type) throw t.arg; return "break" === t.type || "continue" === t.type ? this.next = t.arg : "return" === t.type ? (this.rval = this.arg = t.arg, this.method = "return", this.next = "end") : "normal" === t.type && r && (this.next = r), f; }, finish: function finish(t) { for (var r = this.tryEntries.length - 1; r >= 0; --r) { var e = this.tryEntries[r]; if (e[2] === t) return this.complete(e[4], e[3]), m(e), f; } }, "catch": function _catch(t) { for (var r = this.tryEntries.length - 1; r >= 0; --r) { var e = this.tryEntries[r]; if (e[0] === t) { var n = e[4]; if ("throw" === n.type) { var o = n.arg; m(e); } return o; } } throw Error("illegal catch attempt"); }, delegateYield: function delegateYield(r, e, n) { return this.delegate = { i: x(r), r: e, n: n }, "next" === this.method && (this.arg = t), f; } }, r; }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }
function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
/**
 * TTS-239: Maintenance tab — scan and delete orphan per-batch temp files
 * (e.g. title-1.mp3, title-2.mp3) left behind under uploads/TTA_Pro/ when
 * batch generation never finished its cleanup. The flow is:
 *
 *   1. Warning banner (destructive action).
 *   2. "Scan" — hits /tta_pro/v1/scan_orphan_temp_files, shows paginated list.
 *   3. User reviews files / selects which to delete (or selects all).
 *   4. First confirmation modal — re-states count + size.
 *   5. Second confirmation (type DELETE) — final safety net.
 *   6. Calls /tta_pro/v1/delete_orphan_temp_files; shows result.
 */




var PER_PAGE_OPTIONS = [25, 50, 100, 200];
// TTS-239: age-threshold options — "safe" default hides files < 1h old so that
// any in-flight batch is never deleted. Shorter values are opt-in with a warning.
var AGE_THRESHOLD_OPTIONS = [{
  value: 3600,
  label: "1 hour (safe)"
}, {
  value: 600,
  label: "10 minutes"
}, {
  value: 60,
  label: "1 minute (include recent)"
}];
var SAFE_THRESHOLD = 3600;
var API_BASE = window.ttsObj && window.ttsObj.api_url || "/wp-json/";
function formatBytes(bytes) {
  if (!bytes || bytes <= 0) return "0 B";
  var units = ["B", "KB", "MB", "GB"];
  var i = 0;
  var n = bytes;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }
  return "".concat(n.toFixed(i === 0 ? 0 : 2), " ").concat(units[i]);
}
function formatTime(epoch) {
  if (!epoch) return "";
  var d = new Date(epoch * 1000);
  return d.toLocaleString();
}
function Maintenance() {
  var isProActive = Boolean(window.ttsObj && window.ttsObj.is_pro_active);
  var _useState = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(false),
    _useState2 = _slicedToArray(_useState, 2),
    isScanning = _useState2[0],
    setIsScanning = _useState2[1];
  var _useState3 = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(false),
    _useState4 = _slicedToArray(_useState3, 2),
    isDeleting = _useState4[0],
    setIsDeleting = _useState4[1];
  var _useState5 = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)([]),
    _useState6 = _slicedToArray(_useState5, 2),
    items = _useState6[0],
    setItems = _useState6[1];
  var _useState7 = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(1),
    _useState8 = _slicedToArray(_useState7, 2),
    page = _useState8[0],
    setPage = _useState8[1];
  var _useState9 = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(50),
    _useState0 = _slicedToArray(_useState9, 2),
    perPage = _useState0[0],
    setPerPage = _useState0[1];
  var _useState1 = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(0),
    _useState10 = _slicedToArray(_useState1, 2),
    totalPages = _useState10[0],
    setTotalPages = _useState10[1];
  var _useState11 = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(0),
    _useState12 = _slicedToArray(_useState11, 2),
    total = _useState12[0],
    setTotal = _useState12[1];
  var _useState13 = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(0),
    _useState14 = _slicedToArray(_useState13, 2),
    totalSize = _useState14[0],
    setTotalSize = _useState14[1];
  var _useState15 = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)({}),
    _useState16 = _slicedToArray(_useState15, 2),
    selected = _useState16[0],
    setSelected = _useState16[1];
  var _useState17 = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(false),
    _useState18 = _slicedToArray(_useState17, 2),
    hasScanned = _useState18[0],
    setHasScanned = _useState18[1];
  // TTS-239: age threshold — server-side filter for "file older than X seconds".
  // Defaults to 3600 (safe). Shorter values show a warning banner.
  var _useState19 = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(SAFE_THRESHOLD),
    _useState20 = _slicedToArray(_useState19, 2),
    ageThreshold = _useState20[0],
    setAgeThreshold = _useState20[1];
  var _useState21 = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(0),
    _useState22 = _slicedToArray(_useState21, 2),
    confirmStep = _useState22[0],
    setConfirmStep = _useState22[1]; // 0 = closed, 1 = first confirm, 2 = type DELETE
  var _useState23 = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(""),
    _useState24 = _slicedToArray(_useState23, 2),
    confirmText = _useState24[0],
    setConfirmText = _useState24[1];
  var _useState25 = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)("selected"),
    _useState26 = _slicedToArray(_useState25, 2),
    deleteMode = _useState26[0],
    setDeleteMode = _useState26[1]; // "selected" | "all"
  // TTS-239: When true, behave as if every orphan on the server is selected
  // (across all pages), without needing to materialize thousands of paths in
  // client state. Any manual toggle clears this flag and falls back to the
  // per-path `selected` map.
  var _useState27 = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(false),
    _useState28 = _slicedToArray(_useState27, 2),
    selectAllPages = _useState28[0],
    setSelectAllPages = _useState28[1];
  var nonce = (0,react__WEBPACK_IMPORTED_MODULE_0__.useMemo)(function () {
    return window.ttsObj && window.ttsObj.rest_nonce || "";
  }, []);
  var allVisibleSelected = (0,react__WEBPACK_IMPORTED_MODULE_0__.useMemo)(function () {
    if (!items.length) return false;
    if (selectAllPages) return true;
    return items.every(function (it) {
      return selected[it.file];
    });
  }, [items, selected, selectAllPages]);
  function scan() {
    return _scan.apply(this, arguments);
  }
  function _scan() {
    _scan = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee() {
      var nextPage,
        nextPerPage,
        nextAge,
        url,
        res,
        data,
        _args = arguments;
      return _regeneratorRuntime().wrap(function _callee$(_context) {
        while (1) switch (_context.prev = _context.next) {
          case 0:
            nextPage = _args.length > 0 && _args[0] !== undefined ? _args[0] : 1;
            nextPerPage = _args.length > 1 && _args[1] !== undefined ? _args[1] : perPage;
            nextAge = _args.length > 2 && _args[2] !== undefined ? _args[2] : ageThreshold;
            if (isProActive) {
              _context.next = 5;
              break;
            }
            return _context.abrupt("return");
          case 5:
            setIsScanning(true);
            _context.prev = 6;
            url = "".concat(API_BASE, "tta_pro/v1/scan_orphan_temp_files?page=").concat(nextPage, "&per_page=").concat(nextPerPage, "&min_age_seconds=").concat(nextAge);
            _context.next = 10;
            return fetch(url, {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                "X-WP-Nonce": nonce
              }
            });
          case 10:
            res = _context.sent;
            _context.next = 13;
            return res.json();
          case 13:
            data = _context.sent;
            if (data && data.status) {
              setItems(Array.isArray(data.data) ? data.data : []);
              setPage(data.page || nextPage);
              setPerPage(data.per_page || nextPerPage);
              setTotal(data.total || 0);
              setTotalPages(data.total_pages || 0);
              setTotalSize(data.total_size || 0);
              setHasScanned(true);
            } else {
              react_toastify__WEBPACK_IMPORTED_MODULE_2__.toast.error(data && data.message || (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)("Scan failed.", "text-to-audio"));
            }
            _context.next = 20;
            break;
          case 17:
            _context.prev = 17;
            _context.t0 = _context["catch"](6);
            react_toastify__WEBPACK_IMPORTED_MODULE_2__.toast.error((0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)("Scan failed: ", "text-to-audio") + String(_context.t0));
          case 20:
            _context.prev = 20;
            setIsScanning(false);
            return _context.finish(20);
          case 23:
          case "end":
            return _context.stop();
        }
      }, _callee, null, [[6, 17, 20, 23]]);
    }));
    return _scan.apply(this, arguments);
  }
  function toggleOne(file) {
    // TTS-239: manual toggle cancels "select all across all pages" and
    // materializes current-page items into the explicit selected map.
    if (selectAllPages) {
      var materialized = {};
      items.forEach(function (it) {
        return materialized[it.file] = true;
      });
      if (materialized[file]) {
        delete materialized[file];
      } else {
        materialized[file] = true;
      }
      setSelected(materialized);
      setSelectAllPages(false);
      return;
    }
    setSelected(function (s) {
      var next = _objectSpread({}, s);
      if (next[file]) delete next[file];else next[file] = true;
      return next;
    });
  }
  function toggleAllVisible() {
    // TTS-239: any header-checkbox action clears the cross-page flag — it
    // only governs the current page.
    setSelectAllPages(false);
    if (allVisibleSelected) {
      setSelected(function (s) {
        var next = _objectSpread({}, s);
        items.forEach(function (it) {
          return delete next[it.file];
        });
        return next;
      });
    } else {
      setSelected(function (s) {
        var next = _objectSpread({}, s);
        items.forEach(function (it) {
          return next[it.file] = true;
        });
        return next;
      });
    }
  }
  function selectAllAcrossPages() {
    setSelectAllPages(true);
    setSelected({});
  }
  function clearAllSelections() {
    setSelectAllPages(false);
    setSelected({});
  }
  function startDelete(mode) {
    setDeleteMode(mode);
    setConfirmStep(1);
    setConfirmText("");
  }
  function cancelConfirm() {
    setConfirmStep(0);
    setConfirmText("");
  }
  function runDelete() {
    return _runDelete.apply(this, arguments);
  } // TTS-239: Effective selected count — "select all across all pages" counts
  // as every orphan currently on the server.
  function _runDelete() {
    _runDelete = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee2() {
      var body, paths, res, data;
      return _regeneratorRuntime().wrap(function _callee2$(_context2) {
        while (1) switch (_context2.prev = _context2.next) {
          case 0:
            if (!(confirmText !== "DELETE")) {
              _context2.next = 2;
              break;
            }
            return _context2.abrupt("return");
          case 2:
            setIsDeleting(true);
            _context2.prev = 3;
            body = new FormData(); // TTS-239: "Delete all" OR "selected across all pages" both use the
            // server-side all=1 path so we don't ship thousands of paths over
            // the wire.
            // TTS-239: pass age threshold so server-side re-scan/re-validate uses the same cutoff.
            body.append("min_age_seconds", String(ageThreshold));
            if (!(deleteMode === "all" || deleteMode === "selected" && selectAllPages)) {
              _context2.next = 10;
              break;
            }
            body.append("all", "1");
            _context2.next = 16;
            break;
          case 10:
            paths = Object.keys(selected);
            if (paths.length) {
              _context2.next = 15;
              break;
            }
            react_toastify__WEBPACK_IMPORTED_MODULE_2__.toast.info((0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)("No files selected.", "text-to-audio"));
            setIsDeleting(false);
            return _context2.abrupt("return");
          case 15:
            paths.forEach(function (p) {
              return body.append("paths[]", p);
            });
          case 16:
            _context2.next = 18;
            return fetch("".concat(API_BASE, "tta_pro/v1/delete_orphan_temp_files"), {
              method: "POST",
              headers: {
                "X-WP-Nonce": nonce
              },
              body: body
            });
          case 18:
            res = _context2.sent;
            _context2.next = 21;
            return res.json();
          case 21:
            data = _context2.sent;
            if (data && data.status) {
              react_toastify__WEBPACK_IMPORTED_MODULE_2__.toast.success("".concat((0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)("Deleted", "text-to-audio"), " ").concat(data.deleted, " \xB7 ").concat((0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)("Freed", "text-to-audio"), " ").concat(formatBytes(data.freed_bytes)));
              setSelected({});
              setSelectAllPages(false);
              setConfirmStep(0);
              setConfirmText("");
              scan(1, perPage, ageThreshold);
            } else {
              react_toastify__WEBPACK_IMPORTED_MODULE_2__.toast.error(data && data.message || (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)("Deletion failed.", "text-to-audio"));
            }
            _context2.next = 28;
            break;
          case 25:
            _context2.prev = 25;
            _context2.t0 = _context2["catch"](3);
            react_toastify__WEBPACK_IMPORTED_MODULE_2__.toast.error((0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)("Deletion failed: ", "text-to-audio") + String(_context2.t0));
          case 28:
            _context2.prev = 28;
            setIsDeleting(false);
            return _context2.finish(28);
          case 31:
          case "end":
            return _context2.stop();
        }
      }, _callee2, null, [[3, 25, 28, 31]]);
    }));
    return _runDelete.apply(this, arguments);
  }
  var selectedCount = selectAllPages ? total : Object.keys(selected).length;
  if (!isProActive) {
    return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)("div", {
      className: "card mb-4",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("div", {
        className: "card-header",
        children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)("Maintenance", "text-to-audio")
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("div", {
        className: "card-body",
        children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("p", {
          children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)("Maintenance tools are available with the Pro plugin active.", "text-to-audio")
        })
      })]
    });
  }
  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)("div", {
    className: "maintenance-tab",
    style: {
      width: "100%"
    },
    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("style", {
      children: ".maintenance-tab .card { max-width: 100% !important; width: 100% !important; }"
    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)("div", {
      className: "card mb-4",
      children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("div", {
        className: "card-header d-flex align-items-center justify-content-between",
        children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)("div", {
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("span", {
            className: "dashicons dashicons-admin-tools"
          }), " ", (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)("Maintenance", "text-to-audio")]
        })
      }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)("div", {
        className: "card-body",
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)("div", {
          className: "alert alert-warning",
          role: "alert",
          style: {
            marginBottom: 20
          },
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("strong", {
            children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)("⚠ Destructive action.", "text-to-audio")
          }), " ", (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)("This tool permanently deletes leftover per-batch MP3 chunks (files like title-1.mp3, title-2.mp3) from uploads/TTA_Pro/. Only files that meet all of the following are listed:", "text-to-audio"), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)("ul", {
            style: {
              marginTop: 8,
              marginBottom: 0
            },
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("li", {
              children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)("Filename ends with -N.mp3 where N is a number", "text-to-audio")
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("li", {
              children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)("The final concatenated file (title.mp3) already exists in the same folder", "text-to-audio")
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("li", {
              children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)("The file is older than 1 hour (so an in-flight batch is never affected)", "text-to-audio")
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("li", {
              children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)("The file sits under wp-uploads/TTA_Pro/ (path traversal is rejected)", "text-to-audio")
            })]
          })]
        }), ageThreshold < SAFE_THRESHOLD && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)("div", {
          className: "alert alert-danger",
          role: "alert",
          style: {
            marginBottom: 16
          },
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("strong", {
            children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)("⚠ Reduced safety margin.", "text-to-audio")
          }), " ", (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)("You have lowered the age threshold below the 1-hour safe default. Files created by an in-flight batch could match. Only use this if no generation is currently running.", "text-to-audio")]
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)("div", {
          className: "d-flex align-items-center",
          style: {
            gap: 10,
            flexWrap: "wrap"
          },
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("span", {
            children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)("Include files older than:", "text-to-audio")
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("select", {
            className: "form-select",
            style: {
              width: "auto"
            },
            value: ageThreshold,
            disabled: isScanning || isDeleting,
            onChange: function onChange(e) {
              var v = Number(e.target.value);
              setAgeThreshold(v);
              if (hasScanned) scan(1, perPage, v);
            },
            children: AGE_THRESHOLD_OPTIONS.map(function (opt) {
              return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("option", {
                value: opt.value,
                children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)(opt.label, "text-to-audio")
              }, opt.value);
            })
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("button", {
            type: "button",
            className: "btn btn-primary",
            disabled: isScanning || isDeleting,
            onClick: function onClick() {
              return scan(1, perPage, ageThreshold);
            },
            children: isScanning ? (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)("Scanning…", "text-to-audio") : (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)("Scan for orphan files", "text-to-audio")
          }), hasScanned && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.Fragment, {
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("span", {
              children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)("Per page:", "text-to-audio")
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("select", {
              className: "form-select",
              style: {
                width: "auto"
              },
              value: perPage,
              onChange: function onChange(e) {
                var v = Number(e.target.value);
                setPerPage(v);
                scan(1, v, ageThreshold);
              },
              children: PER_PAGE_OPTIONS.map(function (n) {
                return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("option", {
                  value: n,
                  children: n
                }, n);
              })
            })]
          }), hasScanned && total > 0 && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.Fragment, {
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)("button", {
              type: "button",
              className: "btn btn-outline-danger",
              disabled: isScanning || isDeleting || selectedCount === 0,
              onClick: function onClick() {
                return startDelete("selected");
              },
              children: [(0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)("Delete selected", "text-to-audio"), " ", "(", selectedCount, ")"]
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)("button", {
              type: "button",
              className: "btn btn-danger",
              disabled: isScanning || isDeleting,
              onClick: function onClick() {
                return startDelete("all");
              },
              children: [(0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)("Delete all", "text-to-audio"), " ", "(", total, ")"]
            })]
          })]
        }), hasScanned && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)("div", {
          style: {
            marginTop: 16
          },
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)("p", {
            children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("strong", {
              children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)("Total orphans:", "text-to-audio")
            }), " ", total, " · ", /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("strong", {
              children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)("Disk usage:", "text-to-audio")
            }), " ", formatBytes(totalSize)]
          }), total === 0 ? /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("div", {
            className: "alert alert-success",
            role: "alert",
            children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)("Nothing to clean — no orphan temp files found.", "text-to-audio")
          }) : /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.Fragment, {
            children: [(allVisibleSelected || selectAllPages) && total > items.length && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("div", {
              className: "alert alert-info d-flex align-items-center justify-content-between",
              role: "alert",
              style: {
                marginBottom: 12
              },
              children: selectAllPages ? /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.Fragment, {
                children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)("span", {
                  children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)("strong", {
                    children: [(0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)("All", "text-to-audio"), " ", total, " ", (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)("orphan files", "text-to-audio")]
                  }), " ", (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)("across all pages are selected.", "text-to-audio")]
                }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("button", {
                  type: "button",
                  className: "btn btn-sm btn-link",
                  onClick: clearAllSelections,
                  children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)("Clear selection", "text-to-audio")
                })]
              }) : /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.Fragment, {
                children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)("span", {
                  children: [(0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)("All", "text-to-audio"), " ", /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("strong", {
                    children: items.length
                  }), " ", (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)("files on this page are selected.", "text-to-audio")]
                }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)("button", {
                  type: "button",
                  className: "btn btn-sm btn-link",
                  onClick: selectAllAcrossPages,
                  children: [(0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)("Select all", "text-to-audio"), " ", total, " ", (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)("files across all pages", "text-to-audio")]
                })]
              })
            }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)("table", {
              className: "table table-sm table-striped",
              children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("thead", {
                children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)("tr", {
                  children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("th", {
                    style: {
                      width: 32
                    },
                    children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("input", {
                      type: "checkbox",
                      checked: allVisibleSelected,
                      onChange: toggleAllVisible,
                      "aria-label": "toggle all"
                    })
                  }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("th", {
                    children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)("File", "text-to-audio")
                  }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("th", {
                    children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)("Provider", "text-to-audio")
                  }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("th", {
                    children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)("Size", "text-to-audio")
                  }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("th", {
                    children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)("Modified", "text-to-audio")
                  })]
                })
              }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("tbody", {
                children: items.map(function (it) {
                  return /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)("tr", {
                    children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("td", {
                      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("input", {
                        type: "checkbox",
                        checked: selectAllPages || !!selected[it.file],
                        onChange: function onChange() {
                          return toggleOne(it.file);
                        }
                      })
                    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("td", {
                      style: {
                        wordBreak: "break-all",
                        fontFamily: "monospace",
                        fontSize: 12
                      },
                      title: it.file,
                      children: it.file
                    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("td", {
                      children: it.provider
                    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("td", {
                      children: formatBytes(it.size)
                    }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("td", {
                      children: formatTime(it.mtime)
                    })]
                  }, it.file);
                })
              })]
            }), totalPages > 1 && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)("div", {
              className: "d-flex align-items-center",
              style: {
                gap: 8
              },
              children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("button", {
                type: "button",
                className: "btn btn-sm btn-outline-secondary",
                disabled: page <= 1 || isScanning,
                onClick: function onClick() {
                  return scan(page - 1, perPage, ageThreshold);
                },
                children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)("Previous", "text-to-audio")
              }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)("span", {
                children: [(0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)("Page", "text-to-audio"), " ", page, " / ", totalPages]
              }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("button", {
                type: "button",
                className: "btn btn-sm btn-outline-secondary",
                disabled: page >= totalPages || isScanning,
                onClick: function onClick() {
                  return scan(page + 1, perPage, ageThreshold);
                },
                children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)("Next", "text-to-audio")
              })]
            })]
          })]
        })]
      })]
    }), confirmStep > 0 && /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("div", {
      style: {
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 99999
      },
      onClick: cancelConfirm,
      children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)("div", {
        className: "card",
        style: {
          maxWidth: 560,
          width: "90%",
          background: "#fff"
        },
        onClick: function onClick(e) {
          return e.stopPropagation();
        },
        children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("div", {
          className: "card-header",
          children: /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("strong", {
            children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)("Confirm deletion", "text-to-audio")
          })
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)("div", {
          className: "card-body",
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("p", {
            children: deleteMode === "all" ? /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.Fragment, {
              children: [(0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)("You are about to permanently delete", "text-to-audio"), " ", /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)("strong", {
                children: [total, " ", (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)("files", "text-to-audio")]
              }), " ", "(", formatBytes(totalSize), ")."]
            }) : /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.Fragment, {
              children: [(0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)("You are about to permanently delete", "text-to-audio"), " ", /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)("strong", {
                children: [selectedCount, " ", (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)("files", "text-to-audio")]
              }), "."]
            })
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("p", {
            children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)("This cannot be undone. Server-side safety rules will re-validate each file before deletion.", "text-to-audio")
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)("p", {
            style: {
              marginTop: 12
            },
            children: [(0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)("Type ", "text-to-audio"), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("code", {
              children: "DELETE"
            }), (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)(" to confirm:", "text-to-audio")]
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("input", {
            type: "text",
            className: "form-control",
            value: confirmText,
            onChange: function onChange(e) {
              return setConfirmText(e.target.value);
            },
            autoFocus: true
          })]
        }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsxs)("div", {
          className: "card-footer d-flex justify-content-end",
          style: {
            gap: 8
          },
          children: [/*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("button", {
            type: "button",
            className: "btn btn-secondary",
            onClick: cancelConfirm,
            disabled: isDeleting,
            children: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)("Cancel", "text-to-audio")
          }), /*#__PURE__*/(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_3__.jsx)("button", {
            type: "button",
            className: "btn btn-danger",
            onClick: runDelete,
            disabled: isDeleting || confirmText !== "DELETE",
            children: isDeleting ? (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)("Deleting…", "text-to-audio") : (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)("Permanently delete", "text-to-audio")
          })]
        })]
      })
    })]
  });
}

/***/ })

}]);