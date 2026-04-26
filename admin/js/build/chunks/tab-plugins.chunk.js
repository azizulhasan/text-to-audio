"use strict";
(self["webpackChunktext_to_audio"] = self["webpackChunktext_to_audio"] || []).push([["tab-plugins"],{

/***/ "./src/dashboard/components/dashboard/plugins/Plugins.js":
/*!***************************************************************!*\
  !*** ./src/dashboard/components/dashboard/plugins/Plugins.js ***!
  \***************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ Plugins)
/* harmony export */ });
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "./node_modules/react/index.js");

function Plugins() {
  (0,react__WEBPACK_IMPORTED_MODULE_0__.useEffect)(function () {
    var adminUrl = window.tta_obj && window.tta_obj.admin_url ? window.tta_obj.admin_url : "/wp-admin/";
    window.location.href = adminUrl + "admin.php?page=atlasvoice-other-plugins";
  }, []);
  return null;
}

/***/ })

}]);