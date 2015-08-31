(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.DjakotaClient = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
var inserted = {};

module.exports = function (css, options) {
    if (inserted[css]) return;
    inserted[css] = true;
    
    var elem = document.createElement('style');
    elem.setAttribute('type', 'text/css');

    if ('textContent' in elem) {
      elem.textContent = css;
    } else {
      elem.styleSheet.cssText = css;
    }
    
    var head = document.getElementsByTagName('head')[0];
    if (options && options.prepend) {
        head.insertBefore(elem, head.childNodes[0]);
    } else {
        head.appendChild(elem);
    }
};

},{}],2:[function(_dereq_,module,exports){
// Load modules

var Stringify = _dereq_('./stringify');
var Parse = _dereq_('./parse');


// Declare internals

var internals = {};


module.exports = {
    stringify: Stringify,
    parse: Parse
};

},{"./parse":3,"./stringify":4}],3:[function(_dereq_,module,exports){
// Load modules

var Utils = _dereq_('./utils');


// Declare internals

var internals = {
    delimiter: '&',
    depth: 5,
    arrayLimit: 20,
    parameterLimit: 1000,
    strictNullHandling: false,
    plainObjects: false,
    allowPrototypes: false
};


internals.parseValues = function (str, options) {

    var obj = {};
    var parts = str.split(options.delimiter, options.parameterLimit === Infinity ? undefined : options.parameterLimit);

    for (var i = 0, il = parts.length; i < il; ++i) {
        var part = parts[i];
        var pos = part.indexOf(']=') === -1 ? part.indexOf('=') : part.indexOf(']=') + 1;

        if (pos === -1) {
            obj[Utils.decode(part)] = '';

            if (options.strictNullHandling) {
                obj[Utils.decode(part)] = null;
            }
        }
        else {
            var key = Utils.decode(part.slice(0, pos));
            var val = Utils.decode(part.slice(pos + 1));

            if (!Object.prototype.hasOwnProperty.call(obj, key)) {
                obj[key] = val;
            }
            else {
                obj[key] = [].concat(obj[key]).concat(val);
            }
        }
    }

    return obj;
};


internals.parseObject = function (chain, val, options) {

    if (!chain.length) {
        return val;
    }

    var root = chain.shift();

    var obj;
    if (root === '[]') {
        obj = [];
        obj = obj.concat(internals.parseObject(chain, val, options));
    }
    else {
        obj = options.plainObjects ? Object.create(null) : {};
        var cleanRoot = root[0] === '[' && root[root.length - 1] === ']' ? root.slice(1, root.length - 1) : root;
        var index = parseInt(cleanRoot, 10);
        var indexString = '' + index;
        if (!isNaN(index) &&
            root !== cleanRoot &&
            indexString === cleanRoot &&
            index >= 0 &&
            (options.parseArrays &&
             index <= options.arrayLimit)) {

            obj = [];
            obj[index] = internals.parseObject(chain, val, options);
        }
        else {
            obj[cleanRoot] = internals.parseObject(chain, val, options);
        }
    }

    return obj;
};


internals.parseKeys = function (key, val, options) {

    if (!key) {
        return;
    }

    // Transform dot notation to bracket notation

    if (options.allowDots) {
        key = key.replace(/\.([^\.\[]+)/g, '[$1]');
    }

    // The regex chunks

    var parent = /^([^\[\]]*)/;
    var child = /(\[[^\[\]]*\])/g;

    // Get the parent

    var segment = parent.exec(key);

    // Stash the parent if it exists

    var keys = [];
    if (segment[1]) {
        // If we aren't using plain objects, optionally prefix keys
        // that would overwrite object prototype properties
        if (!options.plainObjects &&
            Object.prototype.hasOwnProperty(segment[1])) {

            if (!options.allowPrototypes) {
                return;
            }
        }

        keys.push(segment[1]);
    }

    // Loop through children appending to the array until we hit depth

    var i = 0;
    while ((segment = child.exec(key)) !== null && i < options.depth) {

        ++i;
        if (!options.plainObjects &&
            Object.prototype.hasOwnProperty(segment[1].replace(/\[|\]/g, ''))) {

            if (!options.allowPrototypes) {
                continue;
            }
        }
        keys.push(segment[1]);
    }

    // If there's a remainder, just add whatever is left

    if (segment) {
        keys.push('[' + key.slice(segment.index) + ']');
    }

    return internals.parseObject(keys, val, options);
};


module.exports = function (str, options) {

    options = options || {};
    options.delimiter = typeof options.delimiter === 'string' || Utils.isRegExp(options.delimiter) ? options.delimiter : internals.delimiter;
    options.depth = typeof options.depth === 'number' ? options.depth : internals.depth;
    options.arrayLimit = typeof options.arrayLimit === 'number' ? options.arrayLimit : internals.arrayLimit;
    options.parseArrays = options.parseArrays !== false;
    options.allowDots = options.allowDots !== false;
    options.plainObjects = typeof options.plainObjects === 'boolean' ? options.plainObjects : internals.plainObjects;
    options.allowPrototypes = typeof options.allowPrototypes === 'boolean' ? options.allowPrototypes : internals.allowPrototypes;
    options.parameterLimit = typeof options.parameterLimit === 'number' ? options.parameterLimit : internals.parameterLimit;
    options.strictNullHandling = typeof options.strictNullHandling === 'boolean' ? options.strictNullHandling : internals.strictNullHandling;

    if (str === '' ||
        str === null ||
        typeof str === 'undefined') {

        return options.plainObjects ? Object.create(null) : {};
    }

    var tempObj = typeof str === 'string' ? internals.parseValues(str, options) : str;
    var obj = options.plainObjects ? Object.create(null) : {};

    // Iterate over the keys and setup the new object

    var keys = Object.keys(tempObj);
    for (var i = 0, il = keys.length; i < il; ++i) {
        var key = keys[i];
        var newObj = internals.parseKeys(key, tempObj[key], options);
        obj = Utils.merge(obj, newObj, options);
    }

    return Utils.compact(obj);
};

},{"./utils":5}],4:[function(_dereq_,module,exports){
// Load modules

var Utils = _dereq_('./utils');


// Declare internals

var internals = {
    delimiter: '&',
    arrayPrefixGenerators: {
        brackets: function (prefix, key) {

            return prefix + '[]';
        },
        indices: function (prefix, key) {

            return prefix + '[' + key + ']';
        },
        repeat: function (prefix, key) {

            return prefix;
        }
    },
    strictNullHandling: false
};


internals.stringify = function (obj, prefix, generateArrayPrefix, strictNullHandling, filter) {

    if (typeof filter === 'function') {
        obj = filter(prefix, obj);
    }
    else if (Utils.isBuffer(obj)) {
        obj = obj.toString();
    }
    else if (obj instanceof Date) {
        obj = obj.toISOString();
    }
    else if (obj === null) {
        if (strictNullHandling) {
            return Utils.encode(prefix);
        }

        obj = '';
    }

    if (typeof obj === 'string' ||
        typeof obj === 'number' ||
        typeof obj === 'boolean') {

        return [Utils.encode(prefix) + '=' + Utils.encode(obj)];
    }

    var values = [];

    if (typeof obj === 'undefined') {
        return values;
    }

    var objKeys = Array.isArray(filter) ? filter : Object.keys(obj);
    for (var i = 0, il = objKeys.length; i < il; ++i) {
        var key = objKeys[i];

        if (Array.isArray(obj)) {
            values = values.concat(internals.stringify(obj[key], generateArrayPrefix(prefix, key), generateArrayPrefix, strictNullHandling, filter));
        }
        else {
            values = values.concat(internals.stringify(obj[key], prefix + '[' + key + ']', generateArrayPrefix, strictNullHandling, filter));
        }
    }

    return values;
};


module.exports = function (obj, options) {

    options = options || {};
    var delimiter = typeof options.delimiter === 'undefined' ? internals.delimiter : options.delimiter;
    var strictNullHandling = typeof options.strictNullHandling === 'boolean' ? options.strictNullHandling : internals.strictNullHandling;
    var objKeys;
    var filter;
    if (typeof options.filter === 'function') {
        filter = options.filter;
        obj = filter('', obj);
    }
    else if (Array.isArray(options.filter)) {
        objKeys = filter = options.filter;
    }

    var keys = [];

    if (typeof obj !== 'object' ||
        obj === null) {

        return '';
    }

    var arrayFormat;
    if (options.arrayFormat in internals.arrayPrefixGenerators) {
        arrayFormat = options.arrayFormat;
    }
    else if ('indices' in options) {
        arrayFormat = options.indices ? 'indices' : 'repeat';
    }
    else {
        arrayFormat = 'indices';
    }

    var generateArrayPrefix = internals.arrayPrefixGenerators[arrayFormat];

    if (!objKeys) {
        objKeys = Object.keys(obj);
    }
    for (var i = 0, il = objKeys.length; i < il; ++i) {
        var key = objKeys[i];
        keys = keys.concat(internals.stringify(obj[key], key, generateArrayPrefix, strictNullHandling, filter));
    }

    return keys.join(delimiter);
};

},{"./utils":5}],5:[function(_dereq_,module,exports){
// Load modules


// Declare internals

var internals = {};
internals.hexTable = new Array(256);
for (var h = 0; h < 256; ++h) {
    internals.hexTable[h] = '%' + ((h < 16 ? '0' : '') + h.toString(16)).toUpperCase();
}


exports.arrayToObject = function (source, options) {

    var obj = options.plainObjects ? Object.create(null) : {};
    for (var i = 0, il = source.length; i < il; ++i) {
        if (typeof source[i] !== 'undefined') {

            obj[i] = source[i];
        }
    }

    return obj;
};


exports.merge = function (target, source, options) {

    if (!source) {
        return target;
    }

    if (typeof source !== 'object') {
        if (Array.isArray(target)) {
            target.push(source);
        }
        else if (typeof target === 'object') {
            target[source] = true;
        }
        else {
            target = [target, source];
        }

        return target;
    }

    if (typeof target !== 'object') {
        target = [target].concat(source);
        return target;
    }

    if (Array.isArray(target) &&
        !Array.isArray(source)) {

        target = exports.arrayToObject(target, options);
    }

    var keys = Object.keys(source);
    for (var k = 0, kl = keys.length; k < kl; ++k) {
        var key = keys[k];
        var value = source[key];

        if (!Object.prototype.hasOwnProperty.call(target, key)) {
            target[key] = value;
        }
        else {
            target[key] = exports.merge(target[key], value, options);
        }
    }

    return target;
};


exports.decode = function (str) {

    try {
        return decodeURIComponent(str.replace(/\+/g, ' '));
    } catch (e) {
        return str;
    }
};

exports.encode = function (str) {

    // This code was originally written by Brian White (mscdex) for the io.js core querystring library.
    // It has been adapted here for stricter adherence to RFC 3986
    if (str.length === 0) {
        return str;
    }

    if (typeof str !== 'string') {
        str = '' + str;
    }

    var out = '';
    for (var i = 0, il = str.length; i < il; ++i) {
        var c = str.charCodeAt(i);

        if (c === 0x2D || // -
            c === 0x2E || // .
            c === 0x5F || // _
            c === 0x7E || // ~
            (c >= 0x30 && c <= 0x39) || // 0-9
            (c >= 0x41 && c <= 0x5A) || // a-z
            (c >= 0x61 && c <= 0x7A)) { // A-Z

            out += str[i];
            continue;
        }

        if (c < 0x80) {
            out += internals.hexTable[c];
            continue;
        }

        if (c < 0x800) {
            out += internals.hexTable[0xC0 | (c >> 6)] + internals.hexTable[0x80 | (c & 0x3F)];
            continue;
        }

        if (c < 0xD800 || c >= 0xE000) {
            out += internals.hexTable[0xE0 | (c >> 12)] + internals.hexTable[0x80 | ((c >> 6) & 0x3F)] + internals.hexTable[0x80 | (c & 0x3F)];
            continue;
        }

        ++i;
        c = 0x10000 + (((c & 0x3FF) << 10) | (str.charCodeAt(i) & 0x3FF));
        out += internals.hexTable[0xF0 | (c >> 18)] + internals.hexTable[0x80 | ((c >> 12) & 0x3F)] + internals.hexTable[0x80 | ((c >> 6) & 0x3F)] + internals.hexTable[0x80 | (c & 0x3F)];
    }

    return out;
};

exports.compact = function (obj, refs) {

    if (typeof obj !== 'object' ||
        obj === null) {

        return obj;
    }

    refs = refs || [];
    var lookup = refs.indexOf(obj);
    if (lookup !== -1) {
        return refs[lookup];
    }

    refs.push(obj);

    if (Array.isArray(obj)) {
        var compacted = [];

        for (var i = 0, il = obj.length; i < il; ++i) {
            if (typeof obj[i] !== 'undefined') {
                compacted.push(obj[i]);
            }
        }

        return compacted;
    }

    var keys = Object.keys(obj);
    for (i = 0, il = keys.length; i < il; ++i) {
        var key = keys[i];
        obj[key] = exports.compact(obj[key], refs);
    }

    return obj;
};


exports.isRegExp = function (obj) {

    return Object.prototype.toString.call(obj) === '[object RegExp]';
};


exports.isBuffer = function (obj) {

    if (obj === null ||
        typeof obj === 'undefined') {

        return false;
    }

    return !!(obj.constructor &&
              obj.constructor.isBuffer &&
              obj.constructor.isBuffer(obj));
};

},{}],6:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;
exports['default'] = createStore;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _utilsIsPlainObject = _dereq_('./utils/isPlainObject');

var _utilsIsPlainObject2 = _interopRequireDefault(_utilsIsPlainObject);

/**
 * These are private action types reserved by Redux.
 * For any unknown actions, you must return the current state.
 * If the current state is undefined, you must return the initial state.
 * Do not reference these action types directly in your code.
 */
var ActionTypes = {
  INIT: '@@redux/INIT'
};

exports.ActionTypes = ActionTypes;
/**
 * Creates a Redux store that holds the state tree.
 * The only way to change the data in the store is to call `dispatch()` on it.
 *
 * There should only be a single store in your app. To specify how different
 * parts of the state tree respond to actions, you may combine several reducers
 * into a single reducer function by using `combineReducers`.
 *
 * @param {Function} reducer A function that returns the next state tree, given
 * the current state tree and the action to handle.
 *
 * @param {any} [initialState] The initial state. You may optionally specify it
 * to hydrate the state from the server in universal apps, or to restore a
 * previously serialized user session.
 * If you use `combineReducers` to produce the root reducer function, this must be
 * an object with the same shape as `combineReducers` keys.
 *
 * @returns {Store} A Redux store that lets you read the state, dispatch actions
 * and subscribe to changes.
 */

function createStore(reducer, initialState) {
  if (typeof reducer !== 'function') {
    throw new Error('Expected the reducer to be a function.');
  }

  var currentReducer = reducer;
  var currentState = initialState;
  var listeners = [];
  var isDispatching = false;

  /**
   * Reads the state tree managed by the store.
   *
   * @returns {any} The current state tree of your application.
   */
  function getState() {
    return currentState;
  }

  /**
   * Adds a change listener. It will be called any time an action is dispatched,
   * and some part of the state tree may potentially have changed. You may then
   * call `getState()` to read the current state tree inside the callback.
   *
   * @param {Function} listener A callback to be invoked on every dispatch.
   * @returns {Function} A function to remove this change listener.
   */
  function subscribe(listener) {
    listeners.push(listener);

    return function unsubscribe() {
      var index = listeners.indexOf(listener);
      listeners.splice(index, 1);
    };
  }

  /**
   * Dispatches an action. It is the only way to trigger a state change.
   *
   * The `reducer` function, used to create the store, will be called with the
   * current state tree and the given `action`. Its return value will
   * be considered the **next** state of the tree, and the change listeners
   * will be notified.
   *
   * The base implementation only supports plain object actions. If you want to
   * dispatch a Promise, an Observable, a thunk, or something else, you need to
   * wrap your store creating function into the corresponding middleware. For
   * example, see the documentation for the `redux-thunk` package. Even the
   * middleware will eventually dispatch plain object actions using this method.
   *
   * @param {Object} action A plain object representing “what changed”. It is
   * a good idea to keep actions serializable so you can record and replay user
   * sessions, or use the time travelling `redux-devtools`.
   *
   * @returns {Object} For convenience, the same action object you dispatched.
   *
   * Note that, if you use a custom middleware, it may wrap `dispatch()` to
   * return something else (for example, a Promise you can await).
   */
  function dispatch(action) {
    if (!_utilsIsPlainObject2['default'](action)) {
      throw new Error('Actions must be plain objects. Use custom middleware for async actions.');
    }

    if (isDispatching) {
      throw new Error('Reducers may not dispatch actions.');
    }

    try {
      isDispatching = true;
      currentState = currentReducer(currentState, action);
    } finally {
      isDispatching = false;
    }

    listeners.slice().forEach(function (listener) {
      return listener();
    });
    return action;
  }

  /**
   * Returns the reducer currently used by the store to calculate the state.
   *
   * It is likely that you will only need this function if you implement a hot
   * reloading mechanism for Redux.
   *
   * @returns {Function} The reducer used by the current store.
   */
  function getReducer() {
    return currentReducer;
  }

  /**
   * Replaces the reducer currently used by the store to calculate the state.
   *
   * You might need this if your app implements code splitting and you want to
   * load some of the reducers dynamically. You might also need this if you
   * implement a hot reloading mechanism for Redux.
   *
   * @param {Function} nextReducer The reducer for the store to use instead.
   * @returns {void}
   */
  function replaceReducer(nextReducer) {
    currentReducer = nextReducer;
    dispatch({ type: ActionTypes.INIT });
  }

  // When a store is created, an "INIT" action is dispatched so that every
  // reducer returns their initial state. This effectively populates
  // the initial state tree.
  dispatch({ type: ActionTypes.INIT });

  return {
    dispatch: dispatch,
    subscribe: subscribe,
    getState: getState,
    getReducer: getReducer,
    replaceReducer: replaceReducer
  };
}
},{"./utils/isPlainObject":12}],7:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _createStore = _dereq_('./createStore');

var _createStore2 = _interopRequireDefault(_createStore);

var _utilsCombineReducers = _dereq_('./utils/combineReducers');

var _utilsCombineReducers2 = _interopRequireDefault(_utilsCombineReducers);

var _utilsBindActionCreators = _dereq_('./utils/bindActionCreators');

var _utilsBindActionCreators2 = _interopRequireDefault(_utilsBindActionCreators);

var _utilsApplyMiddleware = _dereq_('./utils/applyMiddleware');

var _utilsApplyMiddleware2 = _interopRequireDefault(_utilsApplyMiddleware);

var _utilsCompose = _dereq_('./utils/compose');

var _utilsCompose2 = _interopRequireDefault(_utilsCompose);

exports.createStore = _createStore2['default'];
exports.combineReducers = _utilsCombineReducers2['default'];
exports.bindActionCreators = _utilsBindActionCreators2['default'];
exports.applyMiddleware = _utilsApplyMiddleware2['default'];
exports.compose = _utilsCompose2['default'];
},{"./createStore":6,"./utils/applyMiddleware":8,"./utils/bindActionCreators":9,"./utils/combineReducers":10,"./utils/compose":11}],8:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports['default'] = applyMiddleware;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _compose = _dereq_('./compose');

var _compose2 = _interopRequireDefault(_compose);

/**
 * Creates a store enhancer that applies middleware to the dispatch method
 * of the Redux store. This is handy for a variety of tasks, such as expressing
 * asynchronous actions in a concise manner, or logging every action payload.
 *
 * See `redux-thunk` package as an example of the Redux middleware.
 *
 * Because middleware is potentially asynchronous, this should be the first
 * store enhancer in the composition chain.
 *
 * Note that each middleware will be given the `dispatch` and `getState` functions
 * as named arguments.
 *
 * @param {...Function} middlewares The middleware chain to be applied.
 * @returns {Function} A store enhancer applying the middleware.
 */

function applyMiddleware() {
  for (var _len = arguments.length, middlewares = Array(_len), _key = 0; _key < _len; _key++) {
    middlewares[_key] = arguments[_key];
  }

  return function (next) {
    return function (reducer, initialState) {
      var store = next(reducer, initialState);
      var _dispatch = store.dispatch;
      var chain = [];

      var middlewareAPI = {
        getState: store.getState,
        dispatch: function dispatch(action) {
          return _dispatch(action);
        }
      };
      chain = middlewares.map(function (middleware) {
        return middleware(middlewareAPI);
      });
      _dispatch = _compose2['default'].apply(undefined, chain.concat([store.dispatch]));

      return _extends({}, store, {
        dispatch: _dispatch
      });
    };
  };
}

module.exports = exports['default'];
},{"./compose":11}],9:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;
exports['default'] = bindActionCreators;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _utilsMapValues = _dereq_('../utils/mapValues');

var _utilsMapValues2 = _interopRequireDefault(_utilsMapValues);

function bindActionCreator(actionCreator, dispatch) {
  return function () {
    return dispatch(actionCreator.apply(undefined, arguments));
  };
}

/**
 * Turns an object whose values are action creators, into an object with the
 * same keys, but with every function wrapped into a `dispatch` call so they
 * may be invoked directly. This is just a convenience method, as you can call
 * `store.dispatch(MyActionCreators.doSomething())` yourself just fine.
 *
 * For convenience, you can also pass a single function as the first argument,
 * and get a function in return.
 *
 * @param {Function|Object} actionCreators An object whose values are action
 * creator functions. One handy way to obtain it is to use ES6 `import * as`
 * syntax. You may also pass a single function.
 *
 * @param {Function} dispatch The `dispatch` function available on your Redux
 * store.
 *
 * @returns {Function|Object} The object mimicking the original object, but with
 * every action creator wrapped into the `dispatch` call. If you passed a
 * function as `actionCreators`, the return value will also be a single
 * function.
 */

function bindActionCreators(actionCreators, dispatch) {
  if (typeof actionCreators === 'function') {
    return bindActionCreator(actionCreators, dispatch);
  }

  if (typeof actionCreators !== 'object' || actionCreators == null) {
    throw new Error('bindActionCreators expected an object or a function, instead received ' + typeof actionCreators + '. ' + 'Did you write "import ActionCreators from" instead of "import * as ActionCreators from"?');
  }

  return _utilsMapValues2['default'](actionCreators, function (actionCreator) {
    return bindActionCreator(actionCreator, dispatch);
  });
}

module.exports = exports['default'];
},{"../utils/mapValues":13}],10:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;
exports['default'] = combineReducers;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _createStore = _dereq_('../createStore');

var _utilsIsPlainObject = _dereq_('../utils/isPlainObject');

var _utilsIsPlainObject2 = _interopRequireDefault(_utilsIsPlainObject);

var _utilsMapValues = _dereq_('../utils/mapValues');

var _utilsMapValues2 = _interopRequireDefault(_utilsMapValues);

var _utilsPick = _dereq_('../utils/pick');

var _utilsPick2 = _interopRequireDefault(_utilsPick);

function getErrorMessage(key, action) {
  var actionType = action && action.type;
  var actionName = actionType && '"' + actionType.toString() + '"' || 'an action';

  return 'Reducer "' + key + '" returned undefined handling ' + actionName + '. ' + 'To ignore an action, you must explicitly return the previous state.';
}

function verifyStateShape(initialState, currentState) {
  var reducerKeys = Object.keys(currentState);

  if (reducerKeys.length === 0) {
    console.error('Store does not have a valid reducer. Make sure the argument passed ' + 'to combineReducers is an object whose values are reducers.');
    return;
  }

  if (!_utilsIsPlainObject2['default'](initialState)) {
    console.error('initialState has unexpected type of "' + ({}).toString.call(initialState).match(/\s([a-z|A-Z]+)/)[1] + '". Expected initialState to be an object with the following ' + ('keys: "' + reducerKeys.join('", "') + '"'));
    return;
  }

  var unexpectedKeys = Object.keys(initialState).filter(function (key) {
    return reducerKeys.indexOf(key) < 0;
  });

  if (unexpectedKeys.length > 0) {
    console.error('Unexpected ' + (unexpectedKeys.length > 1 ? 'keys' : 'key') + ' ' + ('"' + unexpectedKeys.join('", "') + '" in initialState will be ignored. ') + ('Expected to find one of the known reducer keys instead: "' + reducerKeys.join('", "') + '"'));
  }
}

/**
 * Turns an object whose values are different reducer functions, into a single
 * reducer function. It will call every child reducer, and gather their results
 * into a single state object, whose keys correspond to the keys of the passed
 * reducer functions.
 *
 * @param {Object} reducers An object whose values correspond to different
 * reducer functions that need to be combined into one. One handy way to obtain
 * it is to use ES6 `import * as reducers` syntax. The reducers may never return
 * undefined for any action. Instead, they should return their initial state
 * if the state passed to them was undefined, and the current state for any
 * unrecognized action.
 *
 * @returns {Function} A reducer function that invokes every reducer inside the
 * passed object, and builds a state object with the same shape.
 */

function combineReducers(reducers) {
  var finalReducers = _utilsPick2['default'](reducers, function (val) {
    return typeof val === 'function';
  });

  Object.keys(finalReducers).forEach(function (key) {
    var reducer = finalReducers[key];
    if (typeof reducer(undefined, { type: _createStore.ActionTypes.INIT }) === 'undefined') {
      throw new Error('Reducer "' + key + '" returned undefined during initialization. ' + 'If the state passed to the reducer is undefined, you must ' + 'explicitly return the initial state. The initial state may ' + 'not be undefined.');
    }

    var type = Math.random().toString(36).substring(7).split('').join('.');
    if (typeof reducer(undefined, { type: type }) === 'undefined') {
      throw new Error('Reducer "' + key + '" returned undefined when probed with a random type. ' + ('Don\'t try to handle ' + _createStore.ActionTypes.INIT + ' or other actions in "redux/*" ') + 'namespace. They are considered private. Instead, you must return the ' + 'current state for any unknown actions, unless it is undefined, ' + 'in which case you must return the initial state, regardless of the ' + 'action type. The initial state may not be undefined.');
    }
  });

  var defaultState = _utilsMapValues2['default'](finalReducers, function () {
    return undefined;
  });
  var stateShapeVerified;

  return function combination(state, action) {
    if (state === undefined) state = defaultState;

    var finalState = _utilsMapValues2['default'](finalReducers, function (reducer, key) {
      var newState = reducer(state[key], action);
      if (typeof newState === 'undefined') {
        throw new Error(getErrorMessage(key, action));
      }
      return newState;
    });

    if (
    // Node-like CommonJS environments (Browserify, Webpack)
    typeof process !== 'undefined' && typeof process.env !== 'undefined' && process.env.NODE_ENV !== 'production' ||
    // React Native
    typeof __DEV__ !== 'undefined' && __DEV__ //eslint-disable-line no-undef
    ) {
      if (!stateShapeVerified) {
        verifyStateShape(state, finalState);
        stateShapeVerified = true;
      }
    }

    return finalState;
  };
}

module.exports = exports['default'];
},{"../createStore":6,"../utils/isPlainObject":12,"../utils/mapValues":13,"../utils/pick":14}],11:[function(_dereq_,module,exports){
/**
 * Composes functions from left to right.
 *
 * @param {...Function} funcs - The functions to compose. Each is expected to
 * accept a function as an argument and to return a function.
 * @returns {Function} A function obtained by composing functions from left to
 * right.
 */
"use strict";

exports.__esModule = true;
exports["default"] = compose;

function compose() {
  for (var _len = arguments.length, funcs = Array(_len), _key = 0; _key < _len; _key++) {
    funcs[_key] = arguments[_key];
  }

  return funcs.reduceRight(function (composed, f) {
    return f(composed);
  });
}

module.exports = exports["default"];
},{}],12:[function(_dereq_,module,exports){
'use strict';

exports.__esModule = true;
exports['default'] = isPlainObject;
var fnToString = function fnToString(fn) {
  return Function.prototype.toString.call(fn);
};

/**
 * @param {any} obj The object to inspect.
 * @returns {boolean} True if the argument appears to be a plain object.
 */

function isPlainObject(obj) {
  if (!obj || typeof obj !== 'object') {
    return false;
  }

  var proto = typeof obj.constructor === 'function' ? Object.getPrototypeOf(obj) : Object.prototype;

  if (proto === null) {
    return true;
  }

  var constructor = proto.constructor;

  return typeof constructor === 'function' && constructor instanceof constructor && fnToString(constructor) === fnToString(Object);
}

module.exports = exports['default'];
},{}],13:[function(_dereq_,module,exports){
/**
 * Applies a function to every key-value pair inside an object.
 *
 * @param {Object} obj The source object.
 * @param {Function} fn The mapper function taht receives the value and the key.
 * @returns {Object} A new object that contains the mapped values for the keys.
 */
"use strict";

exports.__esModule = true;
exports["default"] = mapValues;

function mapValues(obj, fn) {
  return Object.keys(obj).reduce(function (result, key) {
    result[key] = fn(obj[key], key);
    return result;
  }, {});
}

module.exports = exports["default"];
},{}],14:[function(_dereq_,module,exports){
/**
 * Picks key-value pairs from an object where values satisfy a predicate.
 *
 * @param {Object} obj The object to pick from.
 * @param {Function} fn The predicate the values must satisfy to be copied.
 * @returns {Object} The object with the values that satisfied the predicate.
 */
"use strict";

exports.__esModule = true;
exports["default"] = pick;

function pick(obj, fn) {
  return Object.keys(obj).reduce(function (result, key) {
    if (fn(obj[key])) {
      result[key] = obj[key];
    }
    return result;
  }, {});
}

module.exports = exports["default"];
},{}],15:[function(_dereq_,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.setRealViewPort = setRealViewPort;

function setRealViewPort(realViewPort) {
	return {
		type: "SET_REAL_VIEWPORT",
		realViewPort: realViewPort
	};
}

},{}],16:[function(_dereq_,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _qs = _dereq_("qs");

var _qs2 = _interopRequireDefault(_qs);

var IDX_WIDTH = 1;
var IDX_HEIGHT = 0;
var TILE_SIZE = 512;

var Api = (function () {
	function Api(service, config) {
		_classCallCheck(this, Api);

		this.service = service;
		this.config = config;
		this.params = {
			rft_id: this.config.identifier,
			url_ver: "Z39.88-2004",
			svc_val_fmt: "info:ofi/fmt:kev:mtx:jpeg2000",
			"svc.format": "image/jpeg"
		};
		this.levels = parseInt(this.config.dwtLevels);
		this.fullWidth = parseInt(this.config.width);
		this.fullHeight = parseInt(this.config.height);
		this.resolutions = [];
		this.initializeResolutions(this.levels - 1, this.fullWidth, this.fullHeight);
		this.tileMap = {};
	}

	_createClass(Api, [{
		key: "initializeResolutions",
		value: function initializeResolutions(level, w, h) {
			this.resolutions.unshift([h, w]);
			if (level > 0) {
				this.initializeResolutions(--level, parseInt(Math.floor(w / 2)), parseInt(Math.floor(h / 2)));
			}
		}
	}, {
		key: "findLevel",
		value: function findLevel(dim, idx) {
			var i = undefined;
			for (i = 0; i < this.resolutions.length; i++) {
				if (this.resolutions[i][idx] > dim) {
					return i + 1;
				}
			}
			return i;
		}
	}, {
		key: "makeTileUrl",
		value: function makeTileUrl(level, dims) {

			return this.service + "?" + _qs2["default"].stringify(Object.assign(this.params, {
				"svc.region": dims.join(","),
				"svc.level": level,
				"svc_id": "info:lanl-repo/svc/getRegion"
			}));
		}
	}, {
		key: "downScale",
		value: function downScale(val, times) {
			return times > 0 ? this.downScale(val / 2, --times) : val;
		}
	}, {
		key: "upScale",
		value: function upScale(val, times) {
			return times > 0 ? this.upScale(val * 2, --times) : val;
		}
	}, {
		key: "onTileLoad",
		value: function onTileLoad(tileIm, tile, onTile) {
			if (!tileIm.complete) {
				setTimeout(this.onTileLoad.bind(this, tileIm, tile, onTile), 15);
			} else {
				onTile(tileIm, tile);
			}
		}
	}, {
		key: "fetchTile",
		value: function fetchTile(tile, onTile) {
			var key = tile.realX + "-" + tile.realY + "-" + tile.level + "-" + tile.url;
			if (!this.tileMap[key]) {
				this.tileMap[key] = new Image();
				this.tileMap[key].onload = this.onTileLoad.bind(this, this.tileMap[key], tile, onTile);
				this.tileMap[key].src = tile.url;
			}
			onTile(this.tileMap[key], tile);
		}
	}, {
		key: "getStart",
		value: function getStart(dim) {
			var n = 0;
			while (dim + n < -TILE_SIZE) {
				n += TILE_SIZE;
			}
			return n;
		}
	}, {
		key: "makeTiles",
		value: function makeTiles(opts, level, scale, onTile) {
			var upscaleFactor = this.resolutions.length - level;
			var yStart = this.getStart(opts.position.y);
			var xStart = this.getStart(opts.position.x);

			for (var y = yStart; (y - yStart) * scale - TILE_SIZE * 2 + opts.position.y < opts.viewport.h && this.upScale(y, upscaleFactor) < this.fullHeight; y += TILE_SIZE) {

				for (var x = xStart; (x - xStart) * scale - TILE_SIZE * 2 + opts.position.x < opts.viewport.w && this.upScale(x, upscaleFactor) < this.fullWidth; x += TILE_SIZE) {

					var realTileW = this.upScale(x, upscaleFactor) + this.upScale(TILE_SIZE, upscaleFactor) > this.fullWidth ? parseInt(this.downScale(this.fullWidth - this.upScale(x, upscaleFactor), upscaleFactor)) : TILE_SIZE;

					var realTileH = this.upScale(y, upscaleFactor) + this.upScale(TILE_SIZE, upscaleFactor) > this.fullHeight ? parseInt(this.downScale(this.fullHeight - this.upScale(y, upscaleFactor), upscaleFactor)) : TILE_SIZE;

					this.fetchTile({
						realX: x,
						realY: y,
						timeStamp: opts.timeStamp,
						pos: {
							x: x,
							y: y
						},
						level: level,
						url: this.makeTileUrl(level, [this.upScale(y, upscaleFactor), this.upScale(x, upscaleFactor), TILE_SIZE, TILE_SIZE])
					}, opts.onTile, opts.onTileInit);
				}
			}
		}
	}, {
		key: "findLevelForScale",
		value: function findLevelForScale(s, level) {
			var current = arguments.length <= 2 || arguments[2] === undefined ? 1 : arguments[2];

			if (s > current / 2 || level === 1) {
				return level;
			}
			return this.findLevelForScale(s, --level, current / 2);
		}
	}, {
		key: "zoomBy",
		value: function zoomBy(factor, scale, level, onScale) {
			var upscaleFactor = this.resolutions.length - level;
			var viewportScale = this.downScale(scale, upscaleFactor) * factor;
			var newLevel = this.findLevelForScale(viewportScale, this.levels);
			var newScale = this.upScale(viewportScale, this.resolutions.length - newLevel);

			onScale(newScale, newLevel, parseInt(Math.ceil(this.fullWidth * viewportScale)), parseInt(Math.ceil(this.fullHeight * viewportScale)));
		}
	}, {
		key: "getRealScale",
		value: function getRealScale(scale, level) {
			return this.downScale(scale, this.resolutions.length - level);
		}
	}, {
		key: "getRealImagePos",
		value: function getRealImagePos(position, scale, level) {
			var upscaleFactor = this.resolutions.length - level;
			return {
				x: this.upScale(position.x, upscaleFactor) * this.getRealScale(scale, level),
				y: this.upScale(position.y, upscaleFactor) * this.getRealScale(scale, level)
			};
		}
	}, {
		key: "widthFill",
		value: function widthFill(opts) {
			var level = this.findLevel(opts.viewport.w, IDX_WIDTH);
			var scale = opts.viewport.w / this.resolutions[level - 1][IDX_WIDTH];
			var upscaleFactor = this.resolutions.length - level;
			var viewportScale = this.downScale(scale, upscaleFactor);

			if (opts.onScale) {
				opts.onScale(scale, level, parseInt(Math.ceil(this.fullWidth * viewportScale)), parseInt(Math.ceil(this.fullHeight * viewportScale)));
			}
			this.makeTiles(opts, level, scale);
		}
	}, {
		key: "fullZoom",
		value: function fullZoom(opts) {
			var level = this.levels;
			var scale = 1;

			if (opts.onScale) {
				opts.onScale(scale, level, parseInt(Math.ceil(this.fullWidth)), parseInt(Math.ceil(this.fullHeight)));
			}
			this.makeTiles(opts, level, scale);
		}
	}, {
		key: "heightFill",
		value: function heightFill(opts) {
			var level = this.findLevel(opts.viewport.h, IDX_HEIGHT);
			var scale = opts.viewport.h / this.resolutions[level - 1][IDX_HEIGHT];
			var upscaleFactor = this.resolutions.length - level;
			var viewportScale = this.downScale(scale, upscaleFactor);

			if (opts.onScale) {
				opts.onScale(scale, level, parseInt(Math.ceil(this.fullWidth * viewportScale)), parseInt(Math.ceil(this.fullHeight * viewportScale)));
			}

			this.makeTiles(opts, level, scale);
		}
	}, {
		key: "autoFill",
		value: function autoFill(opts) {
			if (opts.viewport.h < opts.viewport.w) {
				this.heightFill(opts);
			} else {
				this.widthFill(opts);
			}
		}
	}, {
		key: "loadImage",
		value: function loadImage(opts, onScale) {
			if (opts.scaleMode) {
				this[opts.scaleMode](opts);
			} else {
				this.makeTiles(opts, opts.level, opts.scale);
			}
		}
	}]);

	return Api;
})();

exports["default"] = Api;
module.exports = exports["default"];

},{"qs":2}],17:[function(_dereq_,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x2, _x3, _x4) { var _again = true; _function: while (_again) { var object = _x2, property = _x3, receiver = _x4; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x2 = parent; _x3 = property; _x4 = receiver; _again = true; continue _function; } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _react = _dereq_("react");

var _react2 = _interopRequireDefault(_react);

var _api = _dereq_("./api");

var _api2 = _interopRequireDefault(_api);

var _requestAnimationFrame = _dereq_('./request-animation-frame');

var _store = _dereq_("./store");

var _store2 = _interopRequireDefault(_store);

var MOUSE_UP = 0;
var MOUSE_DOWN = 1;

var TOUCH_END = 0;
var TOUCH_START = 1;

var RESIZE_DELAY = 5;

var SUPPORTED_SCALE_MODES = ["heightFill", "widthFill", "autoFill", "fullZoom"];

var DjakotaClient = (function (_React$Component) {
	_inherits(DjakotaClient, _React$Component);

	function DjakotaClient(props) {
		_classCallCheck(this, DjakotaClient);

		_get(Object.getPrototypeOf(DjakotaClient.prototype), "constructor", this).call(this, props);
		this.api = new _api2["default"](this.props.service, this.props.config);

		this.state = {
			width: null,
			height: null
		};

		this.movement = { x: 0, y: 0 };
		this.touchPos = { x: 0, y: 0 };
		this.mousePos = { x: 0, y: 0 };
		this.imagePos = { x: 0, y: 0 };
		this.mouseState = MOUSE_UP;
		this.imageCtx = null;
		this.resizeDelay = 0;
		this.scale = 1.0;
		this.level = null;
		this.width = null;
		this.height = null;

		this.resizeListener = this.onResize.bind(this);
		this.animationFrameListener = this.onAnimationFrame.bind(this);
		this.mousemoveListener = this.onMouseMove.bind(this);
		this.mouseupListener = this.onMouseUp.bind(this);
		this.frameBuffer = [];
		this.repaintDelay = -1;
		this.touchmap = { startPos: false, positions: [], tapStart: 0, lastTap: 0, pinchDelta: 0, pinchDistance: 0 };
	}

	_createClass(DjakotaClient, [{
		key: "componentDidMount",
		value: function componentDidMount() {
			var _this = this;

			this.commitResize();
			this.imageCtx = _react2["default"].findDOMNode(this).children[0].getContext('2d');
			window.addEventListener("resize", this.resizeListener);
			window.addEventListener("mousemove", this.mousemoveListener);
			window.addEventListener("mouseup", this.mouseupListener);

			this.unsubscribe = _store2["default"].subscribe(function () {
				return _this.setSharedState(_store2["default"].getState());
			});
			(0, _requestAnimationFrame.requestAnimationFrame)(this.animationFrameListener);
		}
	}, {
		key: "componentWillUnmount",
		value: function componentWillUnmount() {
			window.removeEventListener("resize", this.resizeListener);
			window.removeEventListener("mousemove", this.mousemoveListener);
			window.removeEventListener("mouseup", this.mouseupListener);
			this.unsubscribe();
			(0, _requestAnimationFrame.cancelAnimationFrame)(this.animationFrameListener);
		}
	}, {
		key: "setSharedState",
		value: function setSharedState(state) {
			console.log(state);
		}
	}, {
		key: "onAnimationFrame",
		value: function onAnimationFrame() {
			this.imageCtx.clearRect(0, 0, this.state.width, this.state.height);

			for (var i = 0; i < this.frameBuffer.length; i++) {
				var _imageCtx;

				(_imageCtx = this.imageCtx).drawImage.apply(_imageCtx, _toConsumableArray(this.frameBuffer[i]));
			}

			if (this.resizeDelay === 0 && this.resizing) {
				this.commitResize();
			} else if (this.resizeDelay > 0) {
				this.resizeDelay--;
			}
			(0, _requestAnimationFrame.requestAnimationFrame)(this.animationFrameListener);
		}
	}, {
		key: "onResize",
		value: function onResize() {
			this.resizeDelay = RESIZE_DELAY;
			this.resizing = true;
		}
	}, {
		key: "commitResize",
		value: function commitResize() {
			this.resizeDelay = RESIZE_DELAY;
			this.resizing = false;
			this.imagePos.x = 0;
			this.imagePos.y = 0;
			this.width = null;
			this.height = null;
			var node = _react2["default"].findDOMNode(this);
			this.setState({
				width: node.clientWidth,
				height: node.clientHeight
			}, this.afterResize.bind(this));
		}
	}, {
		key: "loadImage",
		value: function loadImage() {
			var opts = arguments.length <= 0 || arguments[0] === undefined ? { scaleMode: this.props.scaleMode } : arguments[0];

			this.frameBuffer = [];
			this.api.loadImage(_extends({
				viewport: { w: this.state.width, h: this.state.height },
				position: this.imagePos,
				onTile: this.renderTile.bind(this),
				onScale: this.onDimensions.bind(this)
			}, opts));
		}
	}, {
		key: "afterResize",
		value: function afterResize() {
			this.loadImage();
		}
	}, {
		key: "setScale",
		value: function setScale(s, l) {
			this.scale = s;
			this.level = l;
		}
	}, {
		key: "setDimensions",
		value: function setDimensions(w, h) {
			this.width = w;
			this.height = h;
		}
	}, {
		key: "renderTile",
		value: function renderTile(tileIm, tile) {
			this.frameBuffer.push([tileIm, parseInt(Math.floor((tile.pos.x + this.imagePos.x) * this.scale)), parseInt(Math.floor((tile.pos.y + this.imagePos.y) * this.scale)), parseInt(Math.ceil(tileIm.width * this.scale)), parseInt(Math.ceil(tileIm.height * this.scale))]);
		}
	}, {
		key: "onMouseDown",
		value: function onMouseDown(ev) {
			this.mousePos.x = ev.clientX;
			this.mousePos.y = ev.clientY;
			this.movement = { x: 0, y: 0 };
			this.mouseState = MOUSE_DOWN;
		}
	}, {
		key: "onTouchStart",
		value: function onTouchStart(ev) {
			this.touchPos.x = ev.touches[0].pageX;
			this.touchPos.y = ev.touches[0].pageY;
			this.movement = { x: 0, y: 0 };
			this.touchState = TOUCH_START;
		}
	}, {
		key: "onMouseMove",
		value: function onMouseMove(ev) {
			switch (this.mouseState) {
				case MOUSE_DOWN:
					this.movement.x = this.mousePos.x - ev.clientX;
					this.movement.y = this.mousePos.y - ev.clientY;
					this.imagePos.x -= this.movement.x / this.scale;
					this.imagePos.y -= this.movement.y / this.scale;
					this.mousePos.x = ev.clientX;
					this.mousePos.y = ev.clientY;

					this.loadImage({ scale: this.scale, level: this.level });

					break;
				case MOUSE_UP:
				default:
			}
		}
	}, {
		key: "onTouchMove",
		value: function onTouchMove(ev) {
			for (var i = 0; i < ev.touches.length; i++) {
				var cur = { x: ev.touches[i].pageX, y: ev.touches[i].pageY };
				this.touchmap.positions[i] = cur;
			}
			// TODO use TOUCH_STATE PINCH and TOUCH_STATE TOUCH
			if (ev.touches.length === 2) {
				var oldD = this.touchmap.pinchDistance;
				this.touchmap.pinchDistance = parseInt(Math.sqrt((this.touchmap.positions[0].x - this.touchmap.positions[1].x) * (this.touchmap.positions[0].x - this.touchmap.positions[1].x) + (this.touchmap.positions[0].y - this.touchmap.positions[1].y) * (this.touchmap.positions[0].y - this.touchmap.positions[1].y)), 10);
				this.touchmap.pinchDelta = oldD - this.touchmap.pinchDistance;
				if (this.touchmap.pinchDelta < 20 && this.touchmap.pinchDelta > -20) {
					var sHeur = 1.0 - this.touchmap.pinchDelta * 0.005;
					this.api.zoomBy(sHeur, this.scale, this.level, this.zoom.bind(this));
				}
			} else {
				this.movement.x = this.touchPos.x - ev.touches[0].pageX;
				this.movement.y = this.touchPos.y - ev.touches[0].pageY;
				this.imagePos.x -= this.movement.x / this.scale;
				this.imagePos.y -= this.movement.y / this.scale;
				this.touchPos.x = ev.touches[0].pageX;
				this.touchPos.y = ev.touches[0].pageY;
				this.loadImage({ scale: this.scale, level: this.level });
			}
			ev.preventDefault();
			ev.stopPropagation();
		}
	}, {
		key: "onTouchEnd",
		value: function onTouchEnd(ev) {
			this.touchState = TOUCH_END;
		}
	}, {
		key: "onMouseUp",
		value: function onMouseUp(ev) {
			this.mouseState = MOUSE_UP;
			this.loadImage({ scale: this.scale, level: this.level });
		}
	}, {
		key: "center",
		value: function center(w, h) {
			if (w > this.state.width) {
				this.imagePos.x = -parseInt((w - this.state.width) / 2) / this.scale;
			} else if (w < this.state.width) {
				this.imagePos.x = parseInt((this.state.width - w) / 2) / this.scale;
			}

			if (h > this.state.height) {
				this.imagePos.y = -parseInt((h - this.state.height) / 2) / this.scale;
			} else if (h < this.state.width) {
				this.imagePos.y = parseInt((this.state.height - h) / 2) / this.scale;
			}
		}
	}, {
		key: "onDimensions",
		value: function onDimensions(s, l, w, h) {
			this.setDimensions(w, h);
			this.setScale(s, l);
			this.center(w, h);
		}
	}, {
		key: "zoom",
		value: function zoom(s, l, w, h) {
			var origX = this.imagePos.x * this.scale;
			var origY = this.imagePos.y * this.scale;
			var origW = this.width;
			var origH = this.height;

			this.setDimensions(w, h);
			this.setScale(s, l);

			if (origW === null || origH === null) {
				this.center(w, h);
			} else {
				var diffX = Math.floor((origW - this.width) / 2);
				var diffY = Math.floor((origH - this.height) / 2);
				this.imagePos.x = (origX + diffX) / this.scale;
				this.imagePos.y = (origY + diffY) / this.scale;
			}
			this.loadImage({ scale: this.scale, level: this.level });
		}
	}, {
		key: "onWheel",
		value: function onWheel(ev) {
			if (ev.nativeEvent.deltaY < 0) {
				this.api.zoomBy(1.1, this.scale, this.level, this.zoom.bind(this));
			} else if (ev.nativeEvent.deltaY > 0) {
				this.api.zoomBy(0.9, this.scale, this.level, this.zoom.bind(this));
			}
		}
	}, {
		key: "render",
		value: function render() {

			return _react2["default"].createElement(
				"div",
				{ className: "hire-djakota-client" },
				_react2["default"].createElement("canvas", {
					className: "image",
					height: this.state.height,
					width: this.state.width
				}),
				_react2["default"].createElement("canvas", {
					className: "interaction",
					height: this.state.height,
					onMouseDown: this.onMouseDown.bind(this),
					onTouchEnd: this.onTouchEnd.bind(this),
					onTouchMove: this.onTouchMove.bind(this),
					onTouchStart: this.onTouchStart.bind(this),
					onWheel: this.onWheel.bind(this),
					width: this.state.width
				})
			);
		}
	}]);

	return DjakotaClient;
})(_react2["default"].Component);

DjakotaClient.propTypes = {
	config: _react2["default"].PropTypes.object.isRequired,
	scaleMode: function scaleMode(props, propName, componentName) {
		if (SUPPORTED_SCALE_MODES.indexOf(props[propName]) < 0) {
			var msg = "Scale mode '" + props[propName] + "' not supported. Modes: " + SUPPORTED_SCALE_MODES.join(", ");
			props[propName] = "heightFill";
			return new Error(msg);
		}
	},
	service: _react2["default"].PropTypes.string.isRequired
};

DjakotaClient.defaultProps = {
	scaleMode: "heightFill"
};

exports["default"] = DjakotaClient;
module.exports = exports["default"];

},{"./api":16,"./request-animation-frame":21,"./store":22,"react":"react"}],18:[function(_dereq_,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _insertCss = _dereq_("insert-css");

var _insertCss2 = _interopRequireDefault(_insertCss);

var _react = _dereq_("react");

var _react2 = _interopRequireDefault(_react);

var _djakotaClient = _dereq_("./djakota-client");

var _djakotaClient2 = _interopRequireDefault(_djakotaClient);

var _minimap = _dereq_("./minimap");

var _minimap2 = _interopRequireDefault(_minimap);



var css = Buffer("LmhpcmUtZGpha290YS1jbGllbnQsCi5oaXJlLWRqYWtvdGEtbWluaW1hcCB7Cgl3aWR0aDogMTAwJTsKCWhlaWdodDogMTAwJTsKfQoKLmhpcmUtZGpha290YS1jbGllbnQgPiAuaW50ZXJhY3Rpb24sCi5oaXJlLWRqYWtvdGEtY2xpZW50ID4gLmltYWdlLAouaGlyZS1kamFrb3RhLW1pbmltYXAgPiAuaW50ZXJhY3Rpb24sCi5oaXJlLWRqYWtvdGEtbWluaW1hcCA+IC5pbWFnZSB7Cglwb3NpdGlvbjogYWJzb2x1dGU7Cn0KCi5oaXJlLWRqYWtvdGEtY2xpZW50ID4gLmludGVyYWN0aW9uLAouaGlyZS1kamFrb3RhLW1pbmltYXAgPiAuaW50ZXJhY3Rpb24gewoJei1pbmRleDogMTsKfQ==","base64");
(0, _insertCss2["default"])(css, { prepend: true });

_react2["default"].initializeTouchEvents(true);
exports.DjakotaClient = _djakotaClient2["default"];
exports.Minimap = _minimap2["default"];
exports["default"] = _djakotaClient2["default"];

},{"./djakota-client":17,"./minimap":19,"insert-css":1,"react":"react"}],19:[function(_dereq_,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; continue _function; } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _react = _dereq_("react");

var _react2 = _interopRequireDefault(_react);

var _api = _dereq_("./api");

var _api2 = _interopRequireDefault(_api);

var _requestAnimationFrame = _dereq_('./request-animation-frame');

var _actions = _dereq_("./actions");

var _store = _dereq_("./store");

var _store2 = _interopRequireDefault(_store);

var RESIZE_DELAY = 5;

var Minimap = (function (_React$Component) {
	_inherits(Minimap, _React$Component);

	function Minimap(props) {
		_classCallCheck(this, Minimap);

		_get(Object.getPrototypeOf(Minimap.prototype), "constructor", this).call(this, props);
		this.api = new _api2["default"](this.props.service, this.props.config);

		this.state = {
			width: null,
			height: null
		};

		this.resizeListener = this.onResize.bind(this);
		this.animationFrameListener = this.onAnimationFrame.bind(this);

		this.imageCtx = null;
		this.resizeDelay = 0;
	}

	_createClass(Minimap, [{
		key: "componentDidMount",
		value: function componentDidMount() {
			var _this = this;

			this.onResize();
			this.imageCtx = _react2["default"].findDOMNode(this).children[0].getContext('2d');
			window.addEventListener("resize", this.resizeListener);
			(0, _requestAnimationFrame.requestAnimationFrame)(this.animationFrameListener);

			this.unsubscribe = _store2["default"].subscribe(function () {
				return _this.setSharedState(_store2["default"].getState());
			});
		}
	}, {
		key: "componentWillUnmount",
		value: function componentWillUnmount() {
			window.removeEventListener("resize", this.resizeListener);
			(0, _requestAnimationFrame.cancelAnimationFrame)(this.animationFrameListener);
			this.unsubscribe();
		}
	}, {
		key: "setSharedState",
		value: function setSharedState(state) {
			console.log(state);
		}
	}, {
		key: "onAnimationFrame",
		value: function onAnimationFrame() {
			if (this.resizeDelay === 0 && this.resizing) {
				this.commitResize();
			} else if (this.resizeDelay > 0) {
				this.resizeDelay--;
			}
			(0, _requestAnimationFrame.requestAnimationFrame)(this.animationFrameListener);
		}
	}, {
		key: "onResize",
		value: function onResize() {
			this.resizeDelay = RESIZE_DELAY;
			this.resizing = true;
		}
	}, {
		key: "commitResize",
		value: function commitResize() {
			this.resizing = false;
			this.resizeDelay = RESIZE_DELAY;
			var node = _react2["default"].findDOMNode(this);
			this.setState({
				width: node.clientWidth,
				height: node.clientHeight
			}, this.afterResize.bind(this));
		}
	}, {
		key: "afterResize",
		value: function afterResize() {
			this.api.loadImage({
				viewport: { w: this.state.width, h: this.state.height },
				onTile: this.renderTile.bind(this),
				onScale: this.setScale.bind(this),
				scaleMode: "autoFill",
				position: { x: 0, y: 0 }
			});
		}
	}, {
		key: "setScale",
		value: function setScale(s, l) {
			this.scale = s;
			this.level = l;
		}
	}, {
		key: "renderTile",
		value: function renderTile(tileIm, tile) {
			var _imageCtx;

			(_imageCtx = this.imageCtx).drawImage.apply(_imageCtx, [tileIm, parseInt(Math.floor(tile.pos.x * this.scale)), parseInt(Math.floor(tile.pos.y * this.scale)), parseInt(Math.ceil(tileIm.width * this.scale)), parseInt(Math.ceil(tileIm.height * this.scale))]);
		}
	}, {
		key: "onClick",
		value: function onClick(ev) {
			var me = _react2["default"].findDOMNode(this);
			console.log(me);
			console.log((ev.pageX - me.offsetLeft) / this.state.width, (ev.pageY - me.offsetTop) / this.state.height);
			_store2["default"].dispatch((0, _actions.setRealViewPort)({
				x: (ev.pageX - me.offsetLeft) / this.state.width,
				y: (ev.pageY - me.offsetTop) / this.state.height
			}));
		}
	}, {
		key: "render",
		value: function render() {
			return _react2["default"].createElement(
				"div",
				{ className: "hire-djakota-minimap" },
				_react2["default"].createElement("canvas", { className: "image", height: this.state.height, width: this.state.width }),
				_react2["default"].createElement("canvas", { className: "interaction", height: this.state.height, onClick: this.onClick.bind(this), width: this.state.width })
			);
		}
	}]);

	return Minimap;
})(_react2["default"].Component);

Minimap.propTypes = {
	config: _react2["default"].PropTypes.object.isRequired,
	service: _react2["default"].PropTypes.string.isRequired
};

exports["default"] = Minimap;
module.exports = exports["default"];

},{"./actions":15,"./api":16,"./request-animation-frame":21,"./store":22,"react":"react"}],20:[function(_dereq_,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var initialState = {
	realViewPort: {
		x: 0, y: 0, w: 0, h: 0
	}
};

exports["default"] = function (state, action) {
	if (state === undefined) state = initialState;

	switch (action.type) {
		case "SET_REAL_VIEWPORT":
			return _extends({}, state, { realViewPort: _extends({}, state.realViewPort, action.realViewPort) });
		default:
			return state;
	}
};

module.exports = exports["default"];

},{}],21:[function(_dereq_,module,exports){
/*
The MIT License (MIT)

Copyright (c) 2015 Eryk Napierała

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
https://github.com/erykpiast/request-animation-frame-shim/
*/

'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});
var requestAnimationFrame = 'function' === typeof global.requestAnimationFrame ? function (cb) {
    return global.requestAnimationFrame(cb);
} : 'function' === typeof global.webkitRequestAnimationFrame ? function (cb) {
    return global.webkitRequestAnimationFrame(cb);
} : 'function' === typeof global.mozRequestAnimationFrame ? function (cb) {
    return global.mozRequestAnimationFrame(cb);
} : undefined;

exports.requestAnimationFrame = requestAnimationFrame;
var cancelAnimationFrame = 'function' === typeof global.cancelAnimationFrame ? function (cb) {
    return global.cancelAnimationFrame(cb);
} : 'function' === typeof global.webkitCancelAnimationFrame ? function (cb) {
    return global.webkitCancelAnimationFrame(cb);
} : 'function' === typeof global.webkitCancelRequestAnimationFrame ? function (cb) {
    return global.webkitCancelRequestAnimationFrame(cb);
} : 'function' === typeof global.mozCancelAnimationFrame ? function (cb) {
    return global.mozCancelAnimationFrame(cb);
} : undefined;
exports.cancelAnimationFrame = cancelAnimationFrame;

},{}],22:[function(_dereq_,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _redux = _dereq_("redux");

var _reducers = _dereq_("./reducers");

var _reducers2 = _interopRequireDefault(_reducers);

var store = (0, _redux.createStore)(_reducers2["default"]);

exports["default"] = store;
module.exports = exports["default"];

},{"./reducers":20,"redux":7}]},{},[18])(18)
});