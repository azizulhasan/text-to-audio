/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./admin/js/blocks/customize-button/customize-button.js":
/*!**************************************************************!*\
  !*** ./admin/js/blocks/customize-button/customize-button.js ***!
  \**************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @wordpress/element */ "@wordpress/element");
/* harmony import */ var _wordpress_element__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_wordpress_element__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @wordpress/i18n */ "@wordpress/i18n");
/* harmony import */ var _wordpress_i18n__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__);

 //wp block editor

const {
  InspectorControls
} = wp.blockEditor; //wp components

const {
  PanelBody
} = wp.components;
const customizeButton = {
  namespace: 'tta/customize-button',
  object: {
    title: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('Customize Button'),
    description: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('Text to audio customize button.'),
    icon: 'controls-play',
    category: 'design',
    keywords: ['customize', 'text-to-audio', 'speech', 'audio', 'text-to-speech'],
    example: {},
    attributes: {
      backgroundColor: {
        type: 'string',
        default: '#184c53'
      },
      color: {
        type: 'string',
        default: '#ffffff'
      },
      width: {
        type: 'string',
        default: '100'
      },
      border: {
        type: 'string',
        default: '0'
      },
      custom_css: {
        type: 'string',
        default: ''
      }
    },
    edit: Customize,
    save: function (props) {
      return null;
    }
  }
};

function Customize(props) {
  const setBackgroundColor = e => {
    props.setAttributes({
      backgroundColor: e.target.value
    });
  };

  const setColor = e => {
    props.setAttributes({
      color: e.target.value
    });
  };

  const setWidth = e => {
    props.setAttributes({
      width: e.target.value
    });
  };

  const setcustom_css = e => {
    props.setAttributes({
      custom_css: e.target.value
    });
  };

  const {
    color,
    backgroundColor,
    width,
    border,
    custom_css
  } = props.attributes;
  return [(0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.createElement)(InspectorControls, {
    style: {
      marginBottom: '40px'
    }
  }, (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.createElement)(PanelBody, {
    className: "tta_block_body",
    title: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('Customize Button')
  }, (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.createElement)("div", null, (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.createElement)("label", {
    htmlFor: "backgroundColor"
  }, (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('BackGround Color')), (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.createElement)("input", {
    type: "color",
    name: "backgroundColor",
    onChange: setBackgroundColor,
    id: "backgroundColor",
    value: backgroundColor,
    title: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('Choose your color')
  })), (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.createElement)("div", null, (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.createElement)("label", {
    htmlFor: "color"
  }, " ", (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('Text Color')), (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.createElement)("input", {
    type: "color",
    name: "color",
    onChange: setColor,
    id: "color",
    value: color,
    title: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('Choose your color')
  })), (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.createElement)("div", null, (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.createElement)("label", {
    htmlFor: "width"
  }, (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('Button Width (%)')), (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.createElement)("input", {
    type: "number",
    name: "width",
    onChange: setWidth,
    id: "width",
    min: '0',
    max: "100",
    value: width,
    title: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('Button Width')
  })), (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.createElement)("div", null, (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.createElement)("label", {
    htmlFor: "custom_css"
  }, (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('Custom CSS')), (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.createElement)("textarea", {
    name: "custom_css",
    onChange: setcustom_css,
    value: custom_css ? custom_css : '',
    placeholder: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('class selector .tta__listen_content')
  }))), (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.createElement)("style", {
    dangerouslySetInnerHTML: {
      __html: ['.tta_block_body div input, .tta_block_body div textarea {', 'float:right;', '}', '.tta_block_body div {', 'padding: 15px 0;', 'border-bottom: 1px solid #d7d7d7;', '}', '.tta_block_body div:last-child {', 'padding: 15px 0 30px;', '}'].join('\n')
    }
  })), (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.createElement)("div", {
    className: "tta_block"
  }, (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.createElement)("button", {
    id: "tta__listen_content_block",
    className: "tta__listen_content",
    onClick: e => ttaListenCotentInDashboard('tta__listen_content_block', '', ttaBlocks.listeningSettings),
    style: {
      backgroundColor: backgroundColor,
      color: color,
      width: width + '%',
      border: border
    },
    type: "button",
    title: (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('Text To Audio:  Tap to listen post.')
  }, (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.createElement)("span", {
    className: "dashicons dashicons-controls-play",
    style: {
      lineHeight: '1.5;'
    }
  }), (0,_wordpress_i18n__WEBPACK_IMPORTED_MODULE_1__.__)('Listen')), (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.createElement)("style", {
    dangerouslySetInnerHTML: {
      __html: ['button.tta__listen_content .dashicons {', 'line-height: 1.5;', '}'].join('\n')
    }
  }), (0,_wordpress_element__WEBPACK_IMPORTED_MODULE_0__.createElement)("style", null, custom_css))];
}

/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (customizeButton);

/***/ }),

/***/ "@wordpress/element":
/*!*********************************!*\
  !*** external ["wp","element"] ***!
  \*********************************/
/***/ ((module) => {

module.exports = window["wp"]["element"];

/***/ }),

/***/ "@wordpress/i18n":
/*!******************************!*\
  !*** external ["wp","i18n"] ***!
  \******************************/
/***/ ((module) => {

module.exports = window["wp"]["i18n"];

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	(() => {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = (module) => {
/******/ 			var getter = module && module.__esModule ?
/******/ 				() => (module['default']) :
/******/ 				() => (module);
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
/*!***********************************!*\
  !*** ./admin/js/blocks/blocks.js ***!
  \***********************************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _customize_button_customize_button__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./customize-button/customize-button */ "./admin/js/blocks/customize-button/customize-button.js");
// Customize button

let blocks = [_customize_button_customize_button__WEBPACK_IMPORTED_MODULE_0__["default"]]; // Register blocks.

blocks.map(block => {
  wp.blocks.registerBlockType(block.namespace, block.object);
});
})();

/******/ })()
;
//# sourceMappingURL=blocks.js.map