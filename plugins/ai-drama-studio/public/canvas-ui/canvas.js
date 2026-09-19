function M0(f) {
  return f && f.__esModule && Object.prototype.hasOwnProperty.call(f, "default") ? f.default : f;
}
var Nf = { exports: {} }, Fn = {};
var Yd;
function _0() {
  if (Yd) return Fn;
  Yd = 1;
  var f = /* @__PURE__ */ Symbol.for("react.transitional.element"), o = /* @__PURE__ */ Symbol.for("react.fragment");
  function b(s, T, H) {
    var L = null;
    if (H !== void 0 && (L = "" + H), T.key !== void 0 && (L = "" + T.key), "key" in T) {
      H = {};
      for (var Z in T)
        Z !== "key" && (H[Z] = T[Z]);
    } else H = T;
    return T = H.ref, {
      $$typeof: f,
      type: s,
      key: L,
      ref: T !== void 0 ? T : null,
      props: H
    };
  }
  return Fn.Fragment = o, Fn.jsx = b, Fn.jsxs = b, Fn;
}
var qd;
function A0() {
  return qd || (qd = 1, Nf.exports = _0()), Nf.exports;
}
var m = A0(), Cf = { exports: {} }, ut = {};
var wd;
function D0() {
  if (wd) return ut;
  wd = 1;
  var f = /* @__PURE__ */ Symbol.for("react.transitional.element"), o = /* @__PURE__ */ Symbol.for("react.portal"), b = /* @__PURE__ */ Symbol.for("react.fragment"), s = /* @__PURE__ */ Symbol.for("react.strict_mode"), T = /* @__PURE__ */ Symbol.for("react.profiler"), H = /* @__PURE__ */ Symbol.for("react.consumer"), L = /* @__PURE__ */ Symbol.for("react.context"), Z = /* @__PURE__ */ Symbol.for("react.forward_ref"), D = /* @__PURE__ */ Symbol.for("react.suspense"), S = /* @__PURE__ */ Symbol.for("react.memo"), R = /* @__PURE__ */ Symbol.for("react.lazy"), U = /* @__PURE__ */ Symbol.for("react.activity"), Y = Symbol.iterator;
  function V(r) {
    return r === null || typeof r != "object" ? null : (r = Y && r[Y] || r["@@iterator"], typeof r == "function" ? r : null);
  }
  var tt = {
    isMounted: function() {
      return !1;
    },
    enqueueForceUpdate: function() {
    },
    enqueueReplaceState: function() {
    },
    enqueueSetState: function() {
    }
  }, $ = Object.assign, st = {};
  function O(r, M, j) {
    this.props = r, this.context = M, this.refs = st, this.updater = j || tt;
  }
  O.prototype.isReactComponent = {}, O.prototype.setState = function(r, M) {
    if (typeof r != "object" && typeof r != "function" && r != null)
      throw Error(
        "takes an object of state variables to update or a function which returns an object of state variables."
      );
    this.updater.enqueueSetState(this, r, M, "setState");
  }, O.prototype.forceUpdate = function(r) {
    this.updater.enqueueForceUpdate(this, r, "forceUpdate");
  };
  function W() {
  }
  W.prototype = O.prototype;
  function et(r, M, j) {
    this.props = r, this.context = M, this.refs = st, this.updater = j || tt;
  }
  var X = et.prototype = new W();
  X.constructor = et, $(X, O.prototype), X.isPureReactComponent = !0;
  var nt = Array.isArray;
  function rt() {
  }
  var K = { H: null, A: null, T: null, S: null }, pt = Object.prototype.hasOwnProperty;
  function Mt(r, M, j) {
    var B = j.ref;
    return {
      $$typeof: f,
      type: r,
      key: M,
      ref: B !== void 0 ? B : null,
      props: j
    };
  }
  function qt(r, M) {
    return Mt(r.type, M, r.props);
  }
  function Ft(r) {
    return typeof r == "object" && r !== null && r.$$typeof === f;
  }
  function k(r) {
    var M = { "=": "=0", ":": "=2" };
    return "$" + r.replace(/[=:]/g, function(j) {
      return M[j];
    });
  }
  var bt = /\/+/g;
  function zt(r, M) {
    return typeof r == "object" && r !== null && r.key != null ? k("" + r.key) : M.toString(36);
  }
  function it(r) {
    switch (r.status) {
      case "fulfilled":
        return r.value;
      case "rejected":
        throw r.reason;
      default:
        switch (typeof r.status == "string" ? r.then(rt, rt) : (r.status = "pending", r.then(
          function(M) {
            r.status === "pending" && (r.status = "fulfilled", r.value = M);
          },
          function(M) {
            r.status === "pending" && (r.status = "rejected", r.reason = M);
          }
        )), r.status) {
          case "fulfilled":
            return r.value;
          case "rejected":
            throw r.reason;
        }
    }
    throw r;
  }
  function y(r, M, j, B, P) {
    var F = typeof r;
    (F === "undefined" || F === "boolean") && (r = null);
    var ft = !1;
    if (r === null) ft = !0;
    else
      switch (F) {
        case "bigint":
        case "string":
        case "number":
          ft = !0;
          break;
        case "object":
          switch (r.$$typeof) {
            case f:
            case o:
              ft = !0;
              break;
            case R:
              return ft = r._init, y(
                ft(r._payload),
                M,
                j,
                B,
                P
              );
          }
      }
    if (ft)
      return P = P(r), ft = B === "" ? "." + zt(r, 0) : B, nt(P) ? (j = "", ft != null && (j = ft.replace(bt, "$&/") + "/"), y(P, M, j, "", function(Bt) {
        return Bt;
      })) : P != null && (Ft(P) && (P = qt(
        P,
        j + (P.key == null || r && r.key === P.key ? "" : ("" + P.key).replace(
          bt,
          "$&/"
        ) + "/") + ft
      )), M.push(P)), 1;
    ft = 0;
    var Et = B === "" ? "." : B + ":";
    if (nt(r))
      for (var gt = 0; gt < r.length; gt++)
        B = r[gt], F = Et + zt(B, gt), ft += y(
          B,
          M,
          j,
          F,
          P
        );
    else if (gt = V(r), typeof gt == "function")
      for (r = gt.call(r), gt = 0; !(B = r.next()).done; )
        B = B.value, F = Et + zt(B, gt++), ft += y(
          B,
          M,
          j,
          F,
          P
        );
    else if (F === "object") {
      if (typeof r.then == "function")
        return y(
          it(r),
          M,
          j,
          B,
          P
        );
      throw M = String(r), Error(
        "Objects are not valid as a React child (found: " + (M === "[object Object]" ? "object with keys {" + Object.keys(r).join(", ") + "}" : M) + "). If you meant to render a collection of children, use an array instead."
      );
    }
    return ft;
  }
  function C(r, M, j) {
    if (r == null) return r;
    var B = [], P = 0;
    return y(r, B, "", "", function(F) {
      return M.call(j, F, P++);
    }), B;
  }
  function G(r) {
    if (r._status === -1) {
      var M = r._result;
      M = M(), M.then(
        function(j) {
          (r._status === 0 || r._status === -1) && (r._status = 1, r._result = j);
        },
        function(j) {
          (r._status === 0 || r._status === -1) && (r._status = 2, r._result = j);
        }
      ), r._status === -1 && (r._status = 0, r._result = M);
    }
    if (r._status === 1) return r._result.default;
    throw r._result;
  }
  var _ = typeof reportError == "function" ? reportError : function(r) {
    if (typeof window == "object" && typeof window.ErrorEvent == "function") {
      var M = new window.ErrorEvent("error", {
        bubbles: !0,
        cancelable: !0,
        message: typeof r == "object" && r !== null && typeof r.message == "string" ? String(r.message) : String(r),
        error: r
      });
      if (!window.dispatchEvent(M)) return;
    } else if (typeof process == "object" && typeof process.emit == "function") {
      process.emit("uncaughtException", r);
      return;
    }
    console.error(r);
  }, q = {
    map: C,
    forEach: function(r, M, j) {
      C(
        r,
        function() {
          M.apply(this, arguments);
        },
        j
      );
    },
    count: function(r) {
      var M = 0;
      return C(r, function() {
        M++;
      }), M;
    },
    toArray: function(r) {
      return C(r, function(M) {
        return M;
      }) || [];
    },
    only: function(r) {
      if (!Ft(r))
        throw Error(
          "React.Children.only expected to receive a single React element child."
        );
      return r;
    }
  };
  return ut.Activity = U, ut.Children = q, ut.Component = O, ut.Fragment = b, ut.Profiler = T, ut.PureComponent = et, ut.StrictMode = s, ut.Suspense = D, ut.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = K, ut.__COMPILER_RUNTIME = {
    __proto__: null,
    c: function(r) {
      return K.H.useMemoCache(r);
    }
  }, ut.cache = function(r) {
    return function() {
      return r.apply(null, arguments);
    };
  }, ut.cacheSignal = function() {
    return null;
  }, ut.cloneElement = function(r, M, j) {
    if (r == null)
      throw Error(
        "The argument must be a React element, but you passed " + r + "."
      );
    var B = $({}, r.props), P = r.key;
    if (M != null)
      for (F in M.key !== void 0 && (P = "" + M.key), M)
        !pt.call(M, F) || F === "key" || F === "__self" || F === "__source" || F === "ref" && M.ref === void 0 || (B[F] = M[F]);
    var F = arguments.length - 2;
    if (F === 1) B.children = j;
    else if (1 < F) {
      for (var ft = Array(F), Et = 0; Et < F; Et++)
        ft[Et] = arguments[Et + 2];
      B.children = ft;
    }
    return Mt(r.type, P, B);
  }, ut.createContext = function(r) {
    return r = {
      $$typeof: L,
      _currentValue: r,
      _currentValue2: r,
      _threadCount: 0,
      Provider: null,
      Consumer: null
    }, r.Provider = r, r.Consumer = {
      $$typeof: H,
      _context: r
    }, r;
  }, ut.createElement = function(r, M, j) {
    var B, P = {}, F = null;
    if (M != null)
      for (B in M.key !== void 0 && (F = "" + M.key), M)
        pt.call(M, B) && B !== "key" && B !== "__self" && B !== "__source" && (P[B] = M[B]);
    var ft = arguments.length - 2;
    if (ft === 1) P.children = j;
    else if (1 < ft) {
      for (var Et = Array(ft), gt = 0; gt < ft; gt++)
        Et[gt] = arguments[gt + 2];
      P.children = Et;
    }
    if (r && r.defaultProps)
      for (B in ft = r.defaultProps, ft)
        P[B] === void 0 && (P[B] = ft[B]);
    return Mt(r, F, P);
  }, ut.createRef = function() {
    return { current: null };
  }, ut.forwardRef = function(r) {
    return { $$typeof: Z, render: r };
  }, ut.isValidElement = Ft, ut.lazy = function(r) {
    return {
      $$typeof: R,
      _payload: { _status: -1, _result: r },
      _init: G
    };
  }, ut.memo = function(r, M) {
    return {
      $$typeof: S,
      type: r,
      compare: M === void 0 ? null : M
    };
  }, ut.startTransition = function(r) {
    var M = K.T, j = {};
    K.T = j;
    try {
      var B = r(), P = K.S;
      P !== null && P(j, B), typeof B == "object" && B !== null && typeof B.then == "function" && B.then(rt, _);
    } catch (F) {
      _(F);
    } finally {
      M !== null && j.types !== null && (M.types = j.types), K.T = M;
    }
  }, ut.unstable_useCacheRefresh = function() {
    return K.H.useCacheRefresh();
  }, ut.use = function(r) {
    return K.H.use(r);
  }, ut.useActionState = function(r, M, j) {
    return K.H.useActionState(r, M, j);
  }, ut.useCallback = function(r, M) {
    return K.H.useCallback(r, M);
  }, ut.useContext = function(r) {
    return K.H.useContext(r);
  }, ut.useDebugValue = function() {
  }, ut.useDeferredValue = function(r, M) {
    return K.H.useDeferredValue(r, M);
  }, ut.useEffect = function(r, M) {
    return K.H.useEffect(r, M);
  }, ut.useEffectEvent = function(r) {
    return K.H.useEffectEvent(r);
  }, ut.useId = function() {
    return K.H.useId();
  }, ut.useImperativeHandle = function(r, M, j) {
    return K.H.useImperativeHandle(r, M, j);
  }, ut.useInsertionEffect = function(r, M) {
    return K.H.useInsertionEffect(r, M);
  }, ut.useLayoutEffect = function(r, M) {
    return K.H.useLayoutEffect(r, M);
  }, ut.useMemo = function(r, M) {
    return K.H.useMemo(r, M);
  }, ut.useOptimistic = function(r, M) {
    return K.H.useOptimistic(r, M);
  }, ut.useReducer = function(r, M, j) {
    return K.H.useReducer(r, M, j);
  }, ut.useRef = function(r) {
    return K.H.useRef(r);
  }, ut.useState = function(r) {
    return K.H.useState(r);
  }, ut.useSyncExternalStore = function(r, M, j) {
    return K.H.useSyncExternalStore(
      r,
      M,
      j
    );
  }, ut.useTransition = function() {
    return K.H.useTransition();
  }, ut.version = "19.2.5", ut;
}
var Xd;
function wf() {
  return Xd || (Xd = 1, Cf.exports = D0()), Cf.exports;
}
var w = wf();
const Wd = /* @__PURE__ */ M0(w);
var jf = { exports: {} }, In = {}, Of = { exports: {} }, Uf = {};
var Gd;
function N0() {
  return Gd || (Gd = 1, (function(f) {
    function o(y, C) {
      var G = y.length;
      y.push(C);
      t: for (; 0 < G; ) {
        var _ = G - 1 >>> 1, q = y[_];
        if (0 < T(q, C))
          y[_] = C, y[G] = q, G = _;
        else break t;
      }
    }
    function b(y) {
      return y.length === 0 ? null : y[0];
    }
    function s(y) {
      if (y.length === 0) return null;
      var C = y[0], G = y.pop();
      if (G !== C) {
        y[0] = G;
        t: for (var _ = 0, q = y.length, r = q >>> 1; _ < r; ) {
          var M = 2 * (_ + 1) - 1, j = y[M], B = M + 1, P = y[B];
          if (0 > T(j, G))
            B < q && 0 > T(P, j) ? (y[_] = P, y[B] = G, _ = B) : (y[_] = j, y[M] = G, _ = M);
          else if (B < q && 0 > T(P, G))
            y[_] = P, y[B] = G, _ = B;
          else break t;
        }
      }
      return C;
    }
    function T(y, C) {
      var G = y.sortIndex - C.sortIndex;
      return G !== 0 ? G : y.id - C.id;
    }
    if (f.unstable_now = void 0, typeof performance == "object" && typeof performance.now == "function") {
      var H = performance;
      f.unstable_now = function() {
        return H.now();
      };
    } else {
      var L = Date, Z = L.now();
      f.unstable_now = function() {
        return L.now() - Z;
      };
    }
    var D = [], S = [], R = 1, U = null, Y = 3, V = !1, tt = !1, $ = !1, st = !1, O = typeof setTimeout == "function" ? setTimeout : null, W = typeof clearTimeout == "function" ? clearTimeout : null, et = typeof setImmediate < "u" ? setImmediate : null;
    function X(y) {
      for (var C = b(S); C !== null; ) {
        if (C.callback === null) s(S);
        else if (C.startTime <= y)
          s(S), C.sortIndex = C.expirationTime, o(D, C);
        else break;
        C = b(S);
      }
    }
    function nt(y) {
      if ($ = !1, X(y), !tt)
        if (b(D) !== null)
          tt = !0, rt || (rt = !0, k());
        else {
          var C = b(S);
          C !== null && it(nt, C.startTime - y);
        }
    }
    var rt = !1, K = -1, pt = 5, Mt = -1;
    function qt() {
      return st ? !0 : !(f.unstable_now() - Mt < pt);
    }
    function Ft() {
      if (st = !1, rt) {
        var y = f.unstable_now();
        Mt = y;
        var C = !0;
        try {
          t: {
            tt = !1, $ && ($ = !1, W(K), K = -1), V = !0;
            var G = Y;
            try {
              l: {
                for (X(y), U = b(D); U !== null && !(U.expirationTime > y && qt()); ) {
                  var _ = U.callback;
                  if (typeof _ == "function") {
                    U.callback = null, Y = U.priorityLevel;
                    var q = _(
                      U.expirationTime <= y
                    );
                    if (y = f.unstable_now(), typeof q == "function") {
                      U.callback = q, X(y), C = !0;
                      break l;
                    }
                    U === b(D) && s(D), X(y);
                  } else s(D);
                  U = b(D);
                }
                if (U !== null) C = !0;
                else {
                  var r = b(S);
                  r !== null && it(
                    nt,
                    r.startTime - y
                  ), C = !1;
                }
              }
              break t;
            } finally {
              U = null, Y = G, V = !1;
            }
            C = void 0;
          }
        } finally {
          C ? k() : rt = !1;
        }
      }
    }
    var k;
    if (typeof et == "function")
      k = function() {
        et(Ft);
      };
    else if (typeof MessageChannel < "u") {
      var bt = new MessageChannel(), zt = bt.port2;
      bt.port1.onmessage = Ft, k = function() {
        zt.postMessage(null);
      };
    } else
      k = function() {
        O(Ft, 0);
      };
    function it(y, C) {
      K = O(function() {
        y(f.unstable_now());
      }, C);
    }
    f.unstable_IdlePriority = 5, f.unstable_ImmediatePriority = 1, f.unstable_LowPriority = 4, f.unstable_NormalPriority = 3, f.unstable_Profiling = null, f.unstable_UserBlockingPriority = 2, f.unstable_cancelCallback = function(y) {
      y.callback = null;
    }, f.unstable_forceFrameRate = function(y) {
      0 > y || 125 < y ? console.error(
        "forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported"
      ) : pt = 0 < y ? Math.floor(1e3 / y) : 5;
    }, f.unstable_getCurrentPriorityLevel = function() {
      return Y;
    }, f.unstable_next = function(y) {
      switch (Y) {
        case 1:
        case 2:
        case 3:
          var C = 3;
          break;
        default:
          C = Y;
      }
      var G = Y;
      Y = C;
      try {
        return y();
      } finally {
        Y = G;
      }
    }, f.unstable_requestPaint = function() {
      st = !0;
    }, f.unstable_runWithPriority = function(y, C) {
      switch (y) {
        case 1:
        case 2:
        case 3:
        case 4:
        case 5:
          break;
        default:
          y = 3;
      }
      var G = Y;
      Y = y;
      try {
        return C();
      } finally {
        Y = G;
      }
    }, f.unstable_scheduleCallback = function(y, C, G) {
      var _ = f.unstable_now();
      switch (typeof G == "object" && G !== null ? (G = G.delay, G = typeof G == "number" && 0 < G ? _ + G : _) : G = _, y) {
        case 1:
          var q = -1;
          break;
        case 2:
          q = 250;
          break;
        case 5:
          q = 1073741823;
          break;
        case 4:
          q = 1e4;
          break;
        default:
          q = 5e3;
      }
      return q = G + q, y = {
        id: R++,
        callback: C,
        priorityLevel: y,
        startTime: G,
        expirationTime: q,
        sortIndex: -1
      }, G > _ ? (y.sortIndex = G, o(S, y), b(D) === null && y === b(S) && ($ ? (W(K), K = -1) : $ = !0, it(nt, G - _))) : (y.sortIndex = q, o(D, y), tt || V || (tt = !0, rt || (rt = !0, k()))), y;
    }, f.unstable_shouldYield = qt, f.unstable_wrapCallback = function(y) {
      var C = Y;
      return function() {
        var G = Y;
        Y = C;
        try {
          return y.apply(this, arguments);
        } finally {
          Y = G;
        }
      };
    };
  })(Uf)), Uf;
}
var Ld;
function C0() {
  return Ld || (Ld = 1, Of.exports = N0()), Of.exports;
}
var Rf = { exports: {} }, fl = {};
var Qd;
function j0() {
  if (Qd) return fl;
  Qd = 1;
  var f = wf();
  function o(D) {
    var S = "https://react.dev/errors/" + D;
    if (1 < arguments.length) {
      S += "?args[]=" + encodeURIComponent(arguments[1]);
      for (var R = 2; R < arguments.length; R++)
        S += "&args[]=" + encodeURIComponent(arguments[R]);
    }
    return "Minified React error #" + D + "; visit " + S + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
  }
  function b() {
  }
  var s = {
    d: {
      f: b,
      r: function() {
        throw Error(o(522));
      },
      D: b,
      C: b,
      L: b,
      m: b,
      X: b,
      S: b,
      M: b
    },
    p: 0,
    findDOMNode: null
  }, T = /* @__PURE__ */ Symbol.for("react.portal");
  function H(D, S, R) {
    var U = 3 < arguments.length && arguments[3] !== void 0 ? arguments[3] : null;
    return {
      $$typeof: T,
      key: U == null ? null : "" + U,
      children: D,
      containerInfo: S,
      implementation: R
    };
  }
  var L = f.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
  function Z(D, S) {
    if (D === "font") return "";
    if (typeof S == "string")
      return S === "use-credentials" ? S : "";
  }
  return fl.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = s, fl.createPortal = function(D, S) {
    var R = 2 < arguments.length && arguments[2] !== void 0 ? arguments[2] : null;
    if (!S || S.nodeType !== 1 && S.nodeType !== 9 && S.nodeType !== 11)
      throw Error(o(299));
    return H(D, S, null, R);
  }, fl.flushSync = function(D) {
    var S = L.T, R = s.p;
    try {
      if (L.T = null, s.p = 2, D) return D();
    } finally {
      L.T = S, s.p = R, s.d.f();
    }
  }, fl.preconnect = function(D, S) {
    typeof D == "string" && (S ? (S = S.crossOrigin, S = typeof S == "string" ? S === "use-credentials" ? S : "" : void 0) : S = null, s.d.C(D, S));
  }, fl.prefetchDNS = function(D) {
    typeof D == "string" && s.d.D(D);
  }, fl.preinit = function(D, S) {
    if (typeof D == "string" && S && typeof S.as == "string") {
      var R = S.as, U = Z(R, S.crossOrigin), Y = typeof S.integrity == "string" ? S.integrity : void 0, V = typeof S.fetchPriority == "string" ? S.fetchPriority : void 0;
      R === "style" ? s.d.S(
        D,
        typeof S.precedence == "string" ? S.precedence : void 0,
        {
          crossOrigin: U,
          integrity: Y,
          fetchPriority: V
        }
      ) : R === "script" && s.d.X(D, {
        crossOrigin: U,
        integrity: Y,
        fetchPriority: V,
        nonce: typeof S.nonce == "string" ? S.nonce : void 0
      });
    }
  }, fl.preinitModule = function(D, S) {
    if (typeof D == "string")
      if (typeof S == "object" && S !== null) {
        if (S.as == null || S.as === "script") {
          var R = Z(
            S.as,
            S.crossOrigin
          );
          s.d.M(D, {
            crossOrigin: R,
            integrity: typeof S.integrity == "string" ? S.integrity : void 0,
            nonce: typeof S.nonce == "string" ? S.nonce : void 0
          });
        }
      } else S == null && s.d.M(D);
  }, fl.preload = function(D, S) {
    if (typeof D == "string" && typeof S == "object" && S !== null && typeof S.as == "string") {
      var R = S.as, U = Z(R, S.crossOrigin);
      s.d.L(D, R, {
        crossOrigin: U,
        integrity: typeof S.integrity == "string" ? S.integrity : void 0,
        nonce: typeof S.nonce == "string" ? S.nonce : void 0,
        type: typeof S.type == "string" ? S.type : void 0,
        fetchPriority: typeof S.fetchPriority == "string" ? S.fetchPriority : void 0,
        referrerPolicy: typeof S.referrerPolicy == "string" ? S.referrerPolicy : void 0,
        imageSrcSet: typeof S.imageSrcSet == "string" ? S.imageSrcSet : void 0,
        imageSizes: typeof S.imageSizes == "string" ? S.imageSizes : void 0,
        media: typeof S.media == "string" ? S.media : void 0
      });
    }
  }, fl.preloadModule = function(D, S) {
    if (typeof D == "string")
      if (S) {
        var R = Z(S.as, S.crossOrigin);
        s.d.m(D, {
          as: typeof S.as == "string" && S.as !== "script" ? S.as : void 0,
          crossOrigin: R,
          integrity: typeof S.integrity == "string" ? S.integrity : void 0
        });
      } else s.d.m(D);
  }, fl.requestFormReset = function(D) {
    s.d.r(D);
  }, fl.unstable_batchedUpdates = function(D, S) {
    return D(S);
  }, fl.useFormState = function(D, S, R) {
    return L.H.useFormState(D, S, R);
  }, fl.useFormStatus = function() {
    return L.H.useHostTransitionStatus();
  }, fl.version = "19.2.5", fl;
}
var Zd;
function Fd() {
  if (Zd) return Rf.exports;
  Zd = 1;
  function f() {
    if (!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ > "u" || typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE != "function"))
      try {
        __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(f);
      } catch (o) {
        console.error(o);
      }
  }
  return f(), Rf.exports = j0(), Rf.exports;
}
var Vd;
function O0() {
  if (Vd) return In;
  Vd = 1;
  var f = C0(), o = wf(), b = Fd();
  function s(t) {
    var l = "https://react.dev/errors/" + t;
    if (1 < arguments.length) {
      l += "?args[]=" + encodeURIComponent(arguments[1]);
      for (var e = 2; e < arguments.length; e++)
        l += "&args[]=" + encodeURIComponent(arguments[e]);
    }
    return "Minified React error #" + t + "; visit " + l + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
  }
  function T(t) {
    return !(!t || t.nodeType !== 1 && t.nodeType !== 9 && t.nodeType !== 11);
  }
  function H(t) {
    var l = t, e = t;
    if (t.alternate) for (; l.return; ) l = l.return;
    else {
      t = l;
      do
        l = t, (l.flags & 4098) !== 0 && (e = l.return), t = l.return;
      while (t);
    }
    return l.tag === 3 ? e : null;
  }
  function L(t) {
    if (t.tag === 13) {
      var l = t.memoizedState;
      if (l === null && (t = t.alternate, t !== null && (l = t.memoizedState)), l !== null) return l.dehydrated;
    }
    return null;
  }
  function Z(t) {
    if (t.tag === 31) {
      var l = t.memoizedState;
      if (l === null && (t = t.alternate, t !== null && (l = t.memoizedState)), l !== null) return l.dehydrated;
    }
    return null;
  }
  function D(t) {
    if (H(t) !== t)
      throw Error(s(188));
  }
  function S(t) {
    var l = t.alternate;
    if (!l) {
      if (l = H(t), l === null) throw Error(s(188));
      return l !== t ? null : t;
    }
    for (var e = t, a = l; ; ) {
      var n = e.return;
      if (n === null) break;
      var u = n.alternate;
      if (u === null) {
        if (a = n.return, a !== null) {
          e = a;
          continue;
        }
        break;
      }
      if (n.child === u.child) {
        for (u = n.child; u; ) {
          if (u === e) return D(n), t;
          if (u === a) return D(n), l;
          u = u.sibling;
        }
        throw Error(s(188));
      }
      if (e.return !== a.return) e = n, a = u;
      else {
        for (var i = !1, c = n.child; c; ) {
          if (c === e) {
            i = !0, e = n, a = u;
            break;
          }
          if (c === a) {
            i = !0, a = n, e = u;
            break;
          }
          c = c.sibling;
        }
        if (!i) {
          for (c = u.child; c; ) {
            if (c === e) {
              i = !0, e = u, a = n;
              break;
            }
            if (c === a) {
              i = !0, a = u, e = n;
              break;
            }
            c = c.sibling;
          }
          if (!i) throw Error(s(189));
        }
      }
      if (e.alternate !== a) throw Error(s(190));
    }
    if (e.tag !== 3) throw Error(s(188));
    return e.stateNode.current === e ? t : l;
  }
  function R(t) {
    var l = t.tag;
    if (l === 5 || l === 26 || l === 27 || l === 6) return t;
    for (t = t.child; t !== null; ) {
      if (l = R(t), l !== null) return l;
      t = t.sibling;
    }
    return null;
  }
  var U = Object.assign, Y = /* @__PURE__ */ Symbol.for("react.element"), V = /* @__PURE__ */ Symbol.for("react.transitional.element"), tt = /* @__PURE__ */ Symbol.for("react.portal"), $ = /* @__PURE__ */ Symbol.for("react.fragment"), st = /* @__PURE__ */ Symbol.for("react.strict_mode"), O = /* @__PURE__ */ Symbol.for("react.profiler"), W = /* @__PURE__ */ Symbol.for("react.consumer"), et = /* @__PURE__ */ Symbol.for("react.context"), X = /* @__PURE__ */ Symbol.for("react.forward_ref"), nt = /* @__PURE__ */ Symbol.for("react.suspense"), rt = /* @__PURE__ */ Symbol.for("react.suspense_list"), K = /* @__PURE__ */ Symbol.for("react.memo"), pt = /* @__PURE__ */ Symbol.for("react.lazy"), Mt = /* @__PURE__ */ Symbol.for("react.activity"), qt = /* @__PURE__ */ Symbol.for("react.memo_cache_sentinel"), Ft = Symbol.iterator;
  function k(t) {
    return t === null || typeof t != "object" ? null : (t = Ft && t[Ft] || t["@@iterator"], typeof t == "function" ? t : null);
  }
  var bt = /* @__PURE__ */ Symbol.for("react.client.reference");
  function zt(t) {
    if (t == null) return null;
    if (typeof t == "function")
      return t.$$typeof === bt ? null : t.displayName || t.name || null;
    if (typeof t == "string") return t;
    switch (t) {
      case $:
        return "Fragment";
      case O:
        return "Profiler";
      case st:
        return "StrictMode";
      case nt:
        return "Suspense";
      case rt:
        return "SuspenseList";
      case Mt:
        return "Activity";
    }
    if (typeof t == "object")
      switch (t.$$typeof) {
        case tt:
          return "Portal";
        case et:
          return t.displayName || "Context";
        case W:
          return (t._context.displayName || "Context") + ".Consumer";
        case X:
          var l = t.render;
          return t = t.displayName, t || (t = l.displayName || l.name || "", t = t !== "" ? "ForwardRef(" + t + ")" : "ForwardRef"), t;
        case K:
          return l = t.displayName || null, l !== null ? l : zt(t.type) || "Memo";
        case pt:
          l = t._payload, t = t._init;
          try {
            return zt(t(l));
          } catch {
          }
      }
    return null;
  }
  var it = Array.isArray, y = o.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE, C = b.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE, G = {
    pending: !1,
    data: null,
    method: null,
    action: null
  }, _ = [], q = -1;
  function r(t) {
    return { current: t };
  }
  function M(t) {
    0 > q || (t.current = _[q], _[q] = null, q--);
  }
  function j(t, l) {
    q++, _[q] = t.current, t.current = l;
  }
  var B = r(null), P = r(null), F = r(null), ft = r(null);
  function Et(t, l) {
    switch (j(F, l), j(P, t), j(B, null), l.nodeType) {
      case 9:
      case 11:
        t = (t = l.documentElement) && (t = t.namespaceURI) ? id(t) : 0;
        break;
      default:
        if (t = l.tagName, l = l.namespaceURI)
          l = id(l), t = cd(l, t);
        else
          switch (t) {
            case "svg":
              t = 1;
              break;
            case "math":
              t = 2;
              break;
            default:
              t = 0;
          }
    }
    M(B), j(B, t);
  }
  function gt() {
    M(B), M(P), M(F);
  }
  function Bt(t) {
    t.memoizedState !== null && j(ft, t);
    var l = B.current, e = cd(l, t.type);
    l !== e && (j(P, t), j(B, e));
  }
  function Yt(t) {
    P.current === t && (M(B), M(P)), ft.current === t && (M(ft), kn._currentValue = G);
  }
  var we, Xe;
  function rl(t) {
    if (we === void 0)
      try {
        throw Error();
      } catch (e) {
        var l = e.stack.trim().match(/\n( *(at )?)/);
        we = l && l[1] || "", Xe = -1 < e.stack.indexOf(`
    at`) ? " (<anonymous>)" : -1 < e.stack.indexOf("@") ? "@unknown:0:0" : "";
      }
    return `
` + we + t + Xe;
  }
  var Ge = !1;
  function ln(t, l) {
    if (!t || Ge) return "";
    Ge = !0;
    var e = Error.prepareStackTrace;
    Error.prepareStackTrace = void 0;
    try {
      var a = {
        DetermineComponentFrameRoot: function() {
          try {
            if (l) {
              var N = function() {
                throw Error();
              };
              if (Object.defineProperty(N.prototype, "props", {
                set: function() {
                  throw Error();
                }
              }), typeof Reflect == "object" && Reflect.construct) {
                try {
                  Reflect.construct(N, []);
                } catch (z) {
                  var x = z;
                }
                Reflect.construct(t, [], N);
              } else {
                try {
                  N.call();
                } catch (z) {
                  x = z;
                }
                t.call(N.prototype);
              }
            } else {
              try {
                throw Error();
              } catch (z) {
                x = z;
              }
              (N = t()) && typeof N.catch == "function" && N.catch(function() {
              });
            }
          } catch (z) {
            if (z && x && typeof z.stack == "string")
              return [z.stack, x.stack];
          }
          return [null, null];
        }
      };
      a.DetermineComponentFrameRoot.displayName = "DetermineComponentFrameRoot";
      var n = Object.getOwnPropertyDescriptor(
        a.DetermineComponentFrameRoot,
        "name"
      );
      n && n.configurable && Object.defineProperty(
        a.DetermineComponentFrameRoot,
        "name",
        { value: "DetermineComponentFrameRoot" }
      );
      var u = a.DetermineComponentFrameRoot(), i = u[0], c = u[1];
      if (i && c) {
        var d = i.split(`
`), p = c.split(`
`);
        for (n = a = 0; a < d.length && !d[a].includes("DetermineComponentFrameRoot"); )
          a++;
        for (; n < p.length && !p[n].includes(
          "DetermineComponentFrameRoot"
        ); )
          n++;
        if (a === d.length || n === p.length)
          for (a = d.length - 1, n = p.length - 1; 1 <= a && 0 <= n && d[a] !== p[n]; )
            n--;
        for (; 1 <= a && 0 <= n; a--, n--)
          if (d[a] !== p[n]) {
            if (a !== 1 || n !== 1)
              do
                if (a--, n--, 0 > n || d[a] !== p[n]) {
                  var E = `
` + d[a].replace(" at new ", " at ");
                  return t.displayName && E.includes("<anonymous>") && (E = E.replace("<anonymous>", t.displayName)), E;
                }
              while (1 <= a && 0 <= n);
            break;
          }
      }
    } finally {
      Ge = !1, Error.prepareStackTrace = e;
    }
    return (e = t ? t.displayName || t.name : "") ? rl(e) : "";
  }
  function Ql(t, l) {
    switch (t.tag) {
      case 26:
      case 27:
      case 5:
        return rl(t.type);
      case 16:
        return rl("Lazy");
      case 13:
        return t.child !== l && l !== null ? rl("Suspense Fallback") : rl("Suspense");
      case 19:
        return rl("SuspenseList");
      case 0:
      case 15:
        return ln(t.type, !1);
      case 11:
        return ln(t.type.render, !1);
      case 1:
        return ln(t.type, !0);
      case 31:
        return rl("Activity");
      default:
        return "";
    }
  }
  function en(t) {
    try {
      var l = "", e = null;
      do
        l += Ql(t, e), e = t, t = t.return;
      while (t);
      return l;
    } catch (a) {
      return `
Error generating stack: ` + a.message + `
` + a.stack;
    }
  }
  var oa = Object.prototype.hasOwnProperty, sa = f.unstable_scheduleCallback, an = f.unstable_cancelCallback, di = f.unstable_shouldYield, nn = f.unstable_requestPaint, Pt = f.unstable_now, mi = f.unstable_getCurrentPriorityLevel, Le = f.unstable_ImmediatePriority, Qe = f.unstable_UserBlockingPriority, wt = f.unstable_NormalPriority, ra = f.unstable_LowPriority, he = f.unstable_IdlePriority, da = f.log, ma = f.unstable_setDisableYieldValue, Q = null, Ot = null;
  function Kt(t) {
    if (typeof da == "function" && ma(t), Ot && typeof Ot.setStrictMode == "function")
      try {
        Ot.setStrictMode(Q, t);
      } catch {
      }
  }
  var el = Math.clz32 ? Math.clz32 : yi, un = Math.log, hi = Math.LN2;
  function yi(t) {
    return t >>>= 0, t === 0 ? 32 : 31 - (un(t) / hi | 0) | 0;
  }
  var Ze = 256, Ve = 262144, ha = 4194304;
  function Jl(t) {
    var l = t & 42;
    if (l !== 0) return l;
    switch (t & -t) {
      case 1:
        return 1;
      case 2:
        return 2;
      case 4:
        return 4;
      case 8:
        return 8;
      case 16:
        return 16;
      case 32:
        return 32;
      case 64:
        return 64;
      case 128:
        return 128;
      case 256:
      case 512:
      case 1024:
      case 2048:
      case 4096:
      case 8192:
      case 16384:
      case 32768:
      case 65536:
      case 131072:
        return t & 261888;
      case 262144:
      case 524288:
      case 1048576:
      case 2097152:
        return t & 3932160;
      case 4194304:
      case 8388608:
      case 16777216:
      case 33554432:
        return t & 62914560;
      case 67108864:
        return 67108864;
      case 134217728:
        return 134217728;
      case 268435456:
        return 268435456;
      case 536870912:
        return 536870912;
      case 1073741824:
        return 0;
      default:
        return t;
    }
  }
  function zl(t, l, e) {
    var a = t.pendingLanes;
    if (a === 0) return 0;
    var n = 0, u = t.suspendedLanes, i = t.pingedLanes;
    t = t.warmLanes;
    var c = a & 134217727;
    return c !== 0 ? (a = c & ~u, a !== 0 ? n = Jl(a) : (i &= c, i !== 0 ? n = Jl(i) : e || (e = c & ~t, e !== 0 && (n = Jl(e))))) : (c = a & ~u, c !== 0 ? n = Jl(c) : i !== 0 ? n = Jl(i) : e || (e = a & ~t, e !== 0 && (n = Jl(e)))), n === 0 ? 0 : l !== 0 && l !== n && (l & u) === 0 && (u = n & -n, e = l & -l, u >= e || u === 32 && (e & 4194048) !== 0) ? l : n;
  }
  function dl(t, l) {
    return (t.pendingLanes & ~(t.suspendedLanes & ~t.pingedLanes) & l) === 0;
  }
  function ya(t, l) {
    switch (t) {
      case 1:
      case 2:
      case 4:
      case 8:
      case 64:
        return l + 250;
      case 16:
      case 32:
      case 128:
      case 256:
      case 512:
      case 1024:
      case 2048:
      case 4096:
      case 8192:
      case 16384:
      case 32768:
      case 65536:
      case 131072:
      case 262144:
      case 524288:
      case 1048576:
      case 2097152:
        return l + 5e3;
      case 4194304:
      case 8388608:
      case 16777216:
      case 33554432:
        return -1;
      case 67108864:
      case 134217728:
      case 268435456:
      case 536870912:
      case 1073741824:
        return -1;
      default:
        return -1;
    }
  }
  function Xf() {
    var t = ha;
    return ha <<= 1, (ha & 62914560) === 0 && (ha = 4194304), t;
  }
  function vi(t) {
    for (var l = [], e = 0; 31 > e; e++) l.push(t);
    return l;
  }
  function cn(t, l) {
    t.pendingLanes |= l, l !== 268435456 && (t.suspendedLanes = 0, t.pingedLanes = 0, t.warmLanes = 0);
  }
  function mm(t, l, e, a, n, u) {
    var i = t.pendingLanes;
    t.pendingLanes = e, t.suspendedLanes = 0, t.pingedLanes = 0, t.warmLanes = 0, t.expiredLanes &= e, t.entangledLanes &= e, t.errorRecoveryDisabledLanes &= e, t.shellSuspendCounter = 0;
    var c = t.entanglements, d = t.expirationTimes, p = t.hiddenUpdates;
    for (e = i & ~e; 0 < e; ) {
      var E = 31 - el(e), N = 1 << E;
      c[E] = 0, d[E] = -1;
      var x = p[E];
      if (x !== null)
        for (p[E] = null, E = 0; E < x.length; E++) {
          var z = x[E];
          z !== null && (z.lane &= -536870913);
        }
      e &= ~N;
    }
    a !== 0 && Gf(t, a, 0), u !== 0 && n === 0 && t.tag !== 0 && (t.suspendedLanes |= u & ~(i & ~l));
  }
  function Gf(t, l, e) {
    t.pendingLanes |= l, t.suspendedLanes &= ~l;
    var a = 31 - el(l);
    t.entangledLanes |= l, t.entanglements[a] = t.entanglements[a] | 1073741824 | e & 261930;
  }
  function Lf(t, l) {
    var e = t.entangledLanes |= l;
    for (t = t.entanglements; e; ) {
      var a = 31 - el(e), n = 1 << a;
      n & l | t[a] & l && (t[a] |= l), e &= ~n;
    }
  }
  function Qf(t, l) {
    var e = l & -l;
    return e = (e & 42) !== 0 ? 1 : gi(e), (e & (t.suspendedLanes | l)) !== 0 ? 0 : e;
  }
  function gi(t) {
    switch (t) {
      case 2:
        t = 1;
        break;
      case 8:
        t = 4;
        break;
      case 32:
        t = 16;
        break;
      case 256:
      case 512:
      case 1024:
      case 2048:
      case 4096:
      case 8192:
      case 16384:
      case 32768:
      case 65536:
      case 131072:
      case 262144:
      case 524288:
      case 1048576:
      case 2097152:
      case 4194304:
      case 8388608:
      case 16777216:
      case 33554432:
        t = 128;
        break;
      case 268435456:
        t = 134217728;
        break;
      default:
        t = 0;
    }
    return t;
  }
  function pi(t) {
    return t &= -t, 2 < t ? 8 < t ? (t & 134217727) !== 0 ? 32 : 268435456 : 8 : 2;
  }
  function Zf() {
    var t = C.p;
    return t !== 0 ? t : (t = window.event, t === void 0 ? 32 : Cd(t.type));
  }
  function Vf(t, l) {
    var e = C.p;
    try {
      return C.p = t, l();
    } finally {
      C.p = e;
    }
  }
  var ye = Math.random().toString(36).slice(2), al = "__reactFiber$" + ye, ml = "__reactProps$" + ye, va = "__reactContainer$" + ye, bi = "__reactEvents$" + ye, hm = "__reactListeners$" + ye, ym = "__reactHandles$" + ye, Kf = "__reactResources$" + ye, fn = "__reactMarker$" + ye;
  function xi(t) {
    delete t[al], delete t[ml], delete t[bi], delete t[hm], delete t[ym];
  }
  function ga(t) {
    var l = t[al];
    if (l) return l;
    for (var e = t.parentNode; e; ) {
      if (l = e[va] || e[al]) {
        if (e = l.alternate, l.child !== null || e !== null && e.child !== null)
          for (t = hd(t); t !== null; ) {
            if (e = t[al]) return e;
            t = hd(t);
          }
        return l;
      }
      t = e, e = t.parentNode;
    }
    return null;
  }
  function pa(t) {
    if (t = t[al] || t[va]) {
      var l = t.tag;
      if (l === 5 || l === 6 || l === 13 || l === 31 || l === 26 || l === 27 || l === 3)
        return t;
    }
    return null;
  }
  function on(t) {
    var l = t.tag;
    if (l === 5 || l === 26 || l === 27 || l === 6) return t.stateNode;
    throw Error(s(33));
  }
  function ba(t) {
    var l = t[Kf];
    return l || (l = t[Kf] = { hoistableStyles: /* @__PURE__ */ new Map(), hoistableScripts: /* @__PURE__ */ new Map() }), l;
  }
  function tl(t) {
    t[fn] = !0;
  }
  var kf = /* @__PURE__ */ new Set(), Jf = {};
  function Ke(t, l) {
    xa(t, l), xa(t + "Capture", l);
  }
  function xa(t, l) {
    for (Jf[t] = l, t = 0; t < l.length; t++)
      kf.add(l[t]);
  }
  var vm = RegExp(
    "^[:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD][:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD\\-.0-9\\u00B7\\u0300-\\u036F\\u203F-\\u2040]*$"
  ), $f = {}, Wf = {};
  function gm(t) {
    return oa.call(Wf, t) ? !0 : oa.call($f, t) ? !1 : vm.test(t) ? Wf[t] = !0 : ($f[t] = !0, !1);
  }
  function Pn(t, l, e) {
    if (gm(l))
      if (e === null) t.removeAttribute(l);
      else {
        switch (typeof e) {
          case "undefined":
          case "function":
          case "symbol":
            t.removeAttribute(l);
            return;
          case "boolean":
            var a = l.toLowerCase().slice(0, 5);
            if (a !== "data-" && a !== "aria-") {
              t.removeAttribute(l);
              return;
            }
        }
        t.setAttribute(l, "" + e);
      }
  }
  function tu(t, l, e) {
    if (e === null) t.removeAttribute(l);
    else {
      switch (typeof e) {
        case "undefined":
        case "function":
        case "symbol":
        case "boolean":
          t.removeAttribute(l);
          return;
      }
      t.setAttribute(l, "" + e);
    }
  }
  function $l(t, l, e, a) {
    if (a === null) t.removeAttribute(e);
    else {
      switch (typeof a) {
        case "undefined":
        case "function":
        case "symbol":
        case "boolean":
          t.removeAttribute(e);
          return;
      }
      t.setAttributeNS(l, e, "" + a);
    }
  }
  function Cl(t) {
    switch (typeof t) {
      case "bigint":
      case "boolean":
      case "number":
      case "string":
      case "undefined":
        return t;
      case "object":
        return t;
      default:
        return "";
    }
  }
  function Ff(t) {
    var l = t.type;
    return (t = t.nodeName) && t.toLowerCase() === "input" && (l === "checkbox" || l === "radio");
  }
  function pm(t, l, e) {
    var a = Object.getOwnPropertyDescriptor(
      t.constructor.prototype,
      l
    );
    if (!t.hasOwnProperty(l) && typeof a < "u" && typeof a.get == "function" && typeof a.set == "function") {
      var n = a.get, u = a.set;
      return Object.defineProperty(t, l, {
        configurable: !0,
        get: function() {
          return n.call(this);
        },
        set: function(i) {
          e = "" + i, u.call(this, i);
        }
      }), Object.defineProperty(t, l, {
        enumerable: a.enumerable
      }), {
        getValue: function() {
          return e;
        },
        setValue: function(i) {
          e = "" + i;
        },
        stopTracking: function() {
          t._valueTracker = null, delete t[l];
        }
      };
    }
  }
  function Si(t) {
    if (!t._valueTracker) {
      var l = Ff(t) ? "checked" : "value";
      t._valueTracker = pm(
        t,
        l,
        "" + t[l]
      );
    }
  }
  function If(t) {
    if (!t) return !1;
    var l = t._valueTracker;
    if (!l) return !0;
    var e = l.getValue(), a = "";
    return t && (a = Ff(t) ? t.checked ? "true" : "false" : t.value), t = a, t !== e ? (l.setValue(t), !0) : !1;
  }
  function lu(t) {
    if (t = t || (typeof document < "u" ? document : void 0), typeof t > "u") return null;
    try {
      return t.activeElement || t.body;
    } catch {
      return t.body;
    }
  }
  var bm = /[\n"\\]/g;
  function jl(t) {
    return t.replace(
      bm,
      function(l) {
        return "\\" + l.charCodeAt(0).toString(16) + " ";
      }
    );
  }
  function zi(t, l, e, a, n, u, i, c) {
    t.name = "", i != null && typeof i != "function" && typeof i != "symbol" && typeof i != "boolean" ? t.type = i : t.removeAttribute("type"), l != null ? i === "number" ? (l === 0 && t.value === "" || t.value != l) && (t.value = "" + Cl(l)) : t.value !== "" + Cl(l) && (t.value = "" + Cl(l)) : i !== "submit" && i !== "reset" || t.removeAttribute("value"), l != null ? Ei(t, i, Cl(l)) : e != null ? Ei(t, i, Cl(e)) : a != null && t.removeAttribute("value"), n == null && u != null && (t.defaultChecked = !!u), n != null && (t.checked = n && typeof n != "function" && typeof n != "symbol"), c != null && typeof c != "function" && typeof c != "symbol" && typeof c != "boolean" ? t.name = "" + Cl(c) : t.removeAttribute("name");
  }
  function Pf(t, l, e, a, n, u, i, c) {
    if (u != null && typeof u != "function" && typeof u != "symbol" && typeof u != "boolean" && (t.type = u), l != null || e != null) {
      if (!(u !== "submit" && u !== "reset" || l != null)) {
        Si(t);
        return;
      }
      e = e != null ? "" + Cl(e) : "", l = l != null ? "" + Cl(l) : e, c || l === t.value || (t.value = l), t.defaultValue = l;
    }
    a = a ?? n, a = typeof a != "function" && typeof a != "symbol" && !!a, t.checked = c ? t.checked : !!a, t.defaultChecked = !!a, i != null && typeof i != "function" && typeof i != "symbol" && typeof i != "boolean" && (t.name = i), Si(t);
  }
  function Ei(t, l, e) {
    l === "number" && lu(t.ownerDocument) === t || t.defaultValue === "" + e || (t.defaultValue = "" + e);
  }
  function Sa(t, l, e, a) {
    if (t = t.options, l) {
      l = {};
      for (var n = 0; n < e.length; n++)
        l["$" + e[n]] = !0;
      for (e = 0; e < t.length; e++)
        n = l.hasOwnProperty("$" + t[e].value), t[e].selected !== n && (t[e].selected = n), n && a && (t[e].defaultSelected = !0);
    } else {
      for (e = "" + Cl(e), l = null, n = 0; n < t.length; n++) {
        if (t[n].value === e) {
          t[n].selected = !0, a && (t[n].defaultSelected = !0);
          return;
        }
        l !== null || t[n].disabled || (l = t[n]);
      }
      l !== null && (l.selected = !0);
    }
  }
  function to(t, l, e) {
    if (l != null && (l = "" + Cl(l), l !== t.value && (t.value = l), e == null)) {
      t.defaultValue !== l && (t.defaultValue = l);
      return;
    }
    t.defaultValue = e != null ? "" + Cl(e) : "";
  }
  function lo(t, l, e, a) {
    if (l == null) {
      if (a != null) {
        if (e != null) throw Error(s(92));
        if (it(a)) {
          if (1 < a.length) throw Error(s(93));
          a = a[0];
        }
        e = a;
      }
      e == null && (e = ""), l = e;
    }
    e = Cl(l), t.defaultValue = e, a = t.textContent, a === e && a !== "" && a !== null && (t.value = a), Si(t);
  }
  function za(t, l) {
    if (l) {
      var e = t.firstChild;
      if (e && e === t.lastChild && e.nodeType === 3) {
        e.nodeValue = l;
        return;
      }
    }
    t.textContent = l;
  }
  var xm = new Set(
    "animationIterationCount aspectRatio borderImageOutset borderImageSlice borderImageWidth boxFlex boxFlexGroup boxOrdinalGroup columnCount columns flex flexGrow flexPositive flexShrink flexNegative flexOrder gridArea gridRow gridRowEnd gridRowSpan gridRowStart gridColumn gridColumnEnd gridColumnSpan gridColumnStart fontWeight lineClamp lineHeight opacity order orphans scale tabSize widows zIndex zoom fillOpacity floodOpacity stopOpacity strokeDasharray strokeDashoffset strokeMiterlimit strokeOpacity strokeWidth MozAnimationIterationCount MozBoxFlex MozBoxFlexGroup MozLineClamp msAnimationIterationCount msFlex msZoom msFlexGrow msFlexNegative msFlexOrder msFlexPositive msFlexShrink msGridColumn msGridColumnSpan msGridRow msGridRowSpan WebkitAnimationIterationCount WebkitBoxFlex WebKitBoxFlexGroup WebkitBoxOrdinalGroup WebkitColumnCount WebkitColumns WebkitFlex WebkitFlexGrow WebkitFlexPositive WebkitFlexShrink WebkitLineClamp".split(
      " "
    )
  );
  function eo(t, l, e) {
    var a = l.indexOf("--") === 0;
    e == null || typeof e == "boolean" || e === "" ? a ? t.setProperty(l, "") : l === "float" ? t.cssFloat = "" : t[l] = "" : a ? t.setProperty(l, e) : typeof e != "number" || e === 0 || xm.has(l) ? l === "float" ? t.cssFloat = e : t[l] = ("" + e).trim() : t[l] = e + "px";
  }
  function ao(t, l, e) {
    if (l != null && typeof l != "object")
      throw Error(s(62));
    if (t = t.style, e != null) {
      for (var a in e)
        !e.hasOwnProperty(a) || l != null && l.hasOwnProperty(a) || (a.indexOf("--") === 0 ? t.setProperty(a, "") : a === "float" ? t.cssFloat = "" : t[a] = "");
      for (var n in l)
        a = l[n], l.hasOwnProperty(n) && e[n] !== a && eo(t, n, a);
    } else
      for (var u in l)
        l.hasOwnProperty(u) && eo(t, u, l[u]);
  }
  function Ti(t) {
    if (t.indexOf("-") === -1) return !1;
    switch (t) {
      case "annotation-xml":
      case "color-profile":
      case "font-face":
      case "font-face-src":
      case "font-face-uri":
      case "font-face-format":
      case "font-face-name":
      case "missing-glyph":
        return !1;
      default:
        return !0;
    }
  }
  var Sm = /* @__PURE__ */ new Map([
    ["acceptCharset", "accept-charset"],
    ["htmlFor", "for"],
    ["httpEquiv", "http-equiv"],
    ["crossOrigin", "crossorigin"],
    ["accentHeight", "accent-height"],
    ["alignmentBaseline", "alignment-baseline"],
    ["arabicForm", "arabic-form"],
    ["baselineShift", "baseline-shift"],
    ["capHeight", "cap-height"],
    ["clipPath", "clip-path"],
    ["clipRule", "clip-rule"],
    ["colorInterpolation", "color-interpolation"],
    ["colorInterpolationFilters", "color-interpolation-filters"],
    ["colorProfile", "color-profile"],
    ["colorRendering", "color-rendering"],
    ["dominantBaseline", "dominant-baseline"],
    ["enableBackground", "enable-background"],
    ["fillOpacity", "fill-opacity"],
    ["fillRule", "fill-rule"],
    ["floodColor", "flood-color"],
    ["floodOpacity", "flood-opacity"],
    ["fontFamily", "font-family"],
    ["fontSize", "font-size"],
    ["fontSizeAdjust", "font-size-adjust"],
    ["fontStretch", "font-stretch"],
    ["fontStyle", "font-style"],
    ["fontVariant", "font-variant"],
    ["fontWeight", "font-weight"],
    ["glyphName", "glyph-name"],
    ["glyphOrientationHorizontal", "glyph-orientation-horizontal"],
    ["glyphOrientationVertical", "glyph-orientation-vertical"],
    ["horizAdvX", "horiz-adv-x"],
    ["horizOriginX", "horiz-origin-x"],
    ["imageRendering", "image-rendering"],
    ["letterSpacing", "letter-spacing"],
    ["lightingColor", "lighting-color"],
    ["markerEnd", "marker-end"],
    ["markerMid", "marker-mid"],
    ["markerStart", "marker-start"],
    ["overlinePosition", "overline-position"],
    ["overlineThickness", "overline-thickness"],
    ["paintOrder", "paint-order"],
    ["panose-1", "panose-1"],
    ["pointerEvents", "pointer-events"],
    ["renderingIntent", "rendering-intent"],
    ["shapeRendering", "shape-rendering"],
    ["stopColor", "stop-color"],
    ["stopOpacity", "stop-opacity"],
    ["strikethroughPosition", "strikethrough-position"],
    ["strikethroughThickness", "strikethrough-thickness"],
    ["strokeDasharray", "stroke-dasharray"],
    ["strokeDashoffset", "stroke-dashoffset"],
    ["strokeLinecap", "stroke-linecap"],
    ["strokeLinejoin", "stroke-linejoin"],
    ["strokeMiterlimit", "stroke-miterlimit"],
    ["strokeOpacity", "stroke-opacity"],
    ["strokeWidth", "stroke-width"],
    ["textAnchor", "text-anchor"],
    ["textDecoration", "text-decoration"],
    ["textRendering", "text-rendering"],
    ["transformOrigin", "transform-origin"],
    ["underlinePosition", "underline-position"],
    ["underlineThickness", "underline-thickness"],
    ["unicodeBidi", "unicode-bidi"],
    ["unicodeRange", "unicode-range"],
    ["unitsPerEm", "units-per-em"],
    ["vAlphabetic", "v-alphabetic"],
    ["vHanging", "v-hanging"],
    ["vIdeographic", "v-ideographic"],
    ["vMathematical", "v-mathematical"],
    ["vectorEffect", "vector-effect"],
    ["vertAdvY", "vert-adv-y"],
    ["vertOriginX", "vert-origin-x"],
    ["vertOriginY", "vert-origin-y"],
    ["wordSpacing", "word-spacing"],
    ["writingMode", "writing-mode"],
    ["xmlnsXlink", "xmlns:xlink"],
    ["xHeight", "x-height"]
  ]), zm = /^[\u0000-\u001F ]*j[\r\n\t]*a[\r\n\t]*v[\r\n\t]*a[\r\n\t]*s[\r\n\t]*c[\r\n\t]*r[\r\n\t]*i[\r\n\t]*p[\r\n\t]*t[\r\n\t]*:/i;
  function eu(t) {
    return zm.test("" + t) ? "javascript:throw new Error('React has blocked a javascript: URL as a security precaution.')" : t;
  }
  function Wl() {
  }
  var Mi = null;
  function _i(t) {
    return t = t.target || t.srcElement || window, t.correspondingUseElement && (t = t.correspondingUseElement), t.nodeType === 3 ? t.parentNode : t;
  }
  var Ea = null, Ta = null;
  function no(t) {
    var l = pa(t);
    if (l && (t = l.stateNode)) {
      var e = t[ml] || null;
      t: switch (t = l.stateNode, l.type) {
        case "input":
          if (zi(
            t,
            e.value,
            e.defaultValue,
            e.defaultValue,
            e.checked,
            e.defaultChecked,
            e.type,
            e.name
          ), l = e.name, e.type === "radio" && l != null) {
            for (e = t; e.parentNode; ) e = e.parentNode;
            for (e = e.querySelectorAll(
              'input[name="' + jl(
                "" + l
              ) + '"][type="radio"]'
            ), l = 0; l < e.length; l++) {
              var a = e[l];
              if (a !== t && a.form === t.form) {
                var n = a[ml] || null;
                if (!n) throw Error(s(90));
                zi(
                  a,
                  n.value,
                  n.defaultValue,
                  n.defaultValue,
                  n.checked,
                  n.defaultChecked,
                  n.type,
                  n.name
                );
              }
            }
            for (l = 0; l < e.length; l++)
              a = e[l], a.form === t.form && If(a);
          }
          break t;
        case "textarea":
          to(t, e.value, e.defaultValue);
          break t;
        case "select":
          l = e.value, l != null && Sa(t, !!e.multiple, l, !1);
      }
    }
  }
  var Ai = !1;
  function uo(t, l, e) {
    if (Ai) return t(l, e);
    Ai = !0;
    try {
      var a = t(l);
      return a;
    } finally {
      if (Ai = !1, (Ea !== null || Ta !== null) && (Qu(), Ea && (l = Ea, t = Ta, Ta = Ea = null, no(l), t)))
        for (l = 0; l < t.length; l++) no(t[l]);
    }
  }
  function sn(t, l) {
    var e = t.stateNode;
    if (e === null) return null;
    var a = e[ml] || null;
    if (a === null) return null;
    e = a[l];
    t: switch (l) {
      case "onClick":
      case "onClickCapture":
      case "onDoubleClick":
      case "onDoubleClickCapture":
      case "onMouseDown":
      case "onMouseDownCapture":
      case "onMouseMove":
      case "onMouseMoveCapture":
      case "onMouseUp":
      case "onMouseUpCapture":
      case "onMouseEnter":
        (a = !a.disabled) || (t = t.type, a = !(t === "button" || t === "input" || t === "select" || t === "textarea")), t = !a;
        break t;
      default:
        t = !1;
    }
    if (t) return null;
    if (e && typeof e != "function")
      throw Error(
        s(231, l, typeof e)
      );
    return e;
  }
  var Fl = !(typeof window > "u" || typeof window.document > "u" || typeof window.document.createElement > "u"), Di = !1;
  if (Fl)
    try {
      var rn = {};
      Object.defineProperty(rn, "passive", {
        get: function() {
          Di = !0;
        }
      }), window.addEventListener("test", rn, rn), window.removeEventListener("test", rn, rn);
    } catch {
      Di = !1;
    }
  var ve = null, Ni = null, au = null;
  function io() {
    if (au) return au;
    var t, l = Ni, e = l.length, a, n = "value" in ve ? ve.value : ve.textContent, u = n.length;
    for (t = 0; t < e && l[t] === n[t]; t++) ;
    var i = e - t;
    for (a = 1; a <= i && l[e - a] === n[u - a]; a++) ;
    return au = n.slice(t, 1 < a ? 1 - a : void 0);
  }
  function nu(t) {
    var l = t.keyCode;
    return "charCode" in t ? (t = t.charCode, t === 0 && l === 13 && (t = 13)) : t = l, t === 10 && (t = 13), 32 <= t || t === 13 ? t : 0;
  }
  function uu() {
    return !0;
  }
  function co() {
    return !1;
  }
  function hl(t) {
    function l(e, a, n, u, i) {
      this._reactName = e, this._targetInst = n, this.type = a, this.nativeEvent = u, this.target = i, this.currentTarget = null;
      for (var c in t)
        t.hasOwnProperty(c) && (e = t[c], this[c] = e ? e(u) : u[c]);
      return this.isDefaultPrevented = (u.defaultPrevented != null ? u.defaultPrevented : u.returnValue === !1) ? uu : co, this.isPropagationStopped = co, this;
    }
    return U(l.prototype, {
      preventDefault: function() {
        this.defaultPrevented = !0;
        var e = this.nativeEvent;
        e && (e.preventDefault ? e.preventDefault() : typeof e.returnValue != "unknown" && (e.returnValue = !1), this.isDefaultPrevented = uu);
      },
      stopPropagation: function() {
        var e = this.nativeEvent;
        e && (e.stopPropagation ? e.stopPropagation() : typeof e.cancelBubble != "unknown" && (e.cancelBubble = !0), this.isPropagationStopped = uu);
      },
      persist: function() {
      },
      isPersistent: uu
    }), l;
  }
  var ke = {
    eventPhase: 0,
    bubbles: 0,
    cancelable: 0,
    timeStamp: function(t) {
      return t.timeStamp || Date.now();
    },
    defaultPrevented: 0,
    isTrusted: 0
  }, iu = hl(ke), dn = U({}, ke, { view: 0, detail: 0 }), Em = hl(dn), Ci, ji, mn, cu = U({}, dn, {
    screenX: 0,
    screenY: 0,
    clientX: 0,
    clientY: 0,
    pageX: 0,
    pageY: 0,
    ctrlKey: 0,
    shiftKey: 0,
    altKey: 0,
    metaKey: 0,
    getModifierState: Ui,
    button: 0,
    buttons: 0,
    relatedTarget: function(t) {
      return t.relatedTarget === void 0 ? t.fromElement === t.srcElement ? t.toElement : t.fromElement : t.relatedTarget;
    },
    movementX: function(t) {
      return "movementX" in t ? t.movementX : (t !== mn && (mn && t.type === "mousemove" ? (Ci = t.screenX - mn.screenX, ji = t.screenY - mn.screenY) : ji = Ci = 0, mn = t), Ci);
    },
    movementY: function(t) {
      return "movementY" in t ? t.movementY : ji;
    }
  }), fo = hl(cu), Tm = U({}, cu, { dataTransfer: 0 }), Mm = hl(Tm), _m = U({}, dn, { relatedTarget: 0 }), Oi = hl(_m), Am = U({}, ke, {
    animationName: 0,
    elapsedTime: 0,
    pseudoElement: 0
  }), Dm = hl(Am), Nm = U({}, ke, {
    clipboardData: function(t) {
      return "clipboardData" in t ? t.clipboardData : window.clipboardData;
    }
  }), Cm = hl(Nm), jm = U({}, ke, { data: 0 }), oo = hl(jm), Om = {
    Esc: "Escape",
    Spacebar: " ",
    Left: "ArrowLeft",
    Up: "ArrowUp",
    Right: "ArrowRight",
    Down: "ArrowDown",
    Del: "Delete",
    Win: "OS",
    Menu: "ContextMenu",
    Apps: "ContextMenu",
    Scroll: "ScrollLock",
    MozPrintableKey: "Unidentified"
  }, Um = {
    8: "Backspace",
    9: "Tab",
    12: "Clear",
    13: "Enter",
    16: "Shift",
    17: "Control",
    18: "Alt",
    19: "Pause",
    20: "CapsLock",
    27: "Escape",
    32: " ",
    33: "PageUp",
    34: "PageDown",
    35: "End",
    36: "Home",
    37: "ArrowLeft",
    38: "ArrowUp",
    39: "ArrowRight",
    40: "ArrowDown",
    45: "Insert",
    46: "Delete",
    112: "F1",
    113: "F2",
    114: "F3",
    115: "F4",
    116: "F5",
    117: "F6",
    118: "F7",
    119: "F8",
    120: "F9",
    121: "F10",
    122: "F11",
    123: "F12",
    144: "NumLock",
    145: "ScrollLock",
    224: "Meta"
  }, Rm = {
    Alt: "altKey",
    Control: "ctrlKey",
    Meta: "metaKey",
    Shift: "shiftKey"
  };
  function Hm(t) {
    var l = this.nativeEvent;
    return l.getModifierState ? l.getModifierState(t) : (t = Rm[t]) ? !!l[t] : !1;
  }
  function Ui() {
    return Hm;
  }
  var Bm = U({}, dn, {
    key: function(t) {
      if (t.key) {
        var l = Om[t.key] || t.key;
        if (l !== "Unidentified") return l;
      }
      return t.type === "keypress" ? (t = nu(t), t === 13 ? "Enter" : String.fromCharCode(t)) : t.type === "keydown" || t.type === "keyup" ? Um[t.keyCode] || "Unidentified" : "";
    },
    code: 0,
    location: 0,
    ctrlKey: 0,
    shiftKey: 0,
    altKey: 0,
    metaKey: 0,
    repeat: 0,
    locale: 0,
    getModifierState: Ui,
    charCode: function(t) {
      return t.type === "keypress" ? nu(t) : 0;
    },
    keyCode: function(t) {
      return t.type === "keydown" || t.type === "keyup" ? t.keyCode : 0;
    },
    which: function(t) {
      return t.type === "keypress" ? nu(t) : t.type === "keydown" || t.type === "keyup" ? t.keyCode : 0;
    }
  }), Ym = hl(Bm), qm = U({}, cu, {
    pointerId: 0,
    width: 0,
    height: 0,
    pressure: 0,
    tangentialPressure: 0,
    tiltX: 0,
    tiltY: 0,
    twist: 0,
    pointerType: 0,
    isPrimary: 0
  }), so = hl(qm), wm = U({}, dn, {
    touches: 0,
    targetTouches: 0,
    changedTouches: 0,
    altKey: 0,
    metaKey: 0,
    ctrlKey: 0,
    shiftKey: 0,
    getModifierState: Ui
  }), Xm = hl(wm), Gm = U({}, ke, {
    propertyName: 0,
    elapsedTime: 0,
    pseudoElement: 0
  }), Lm = hl(Gm), Qm = U({}, cu, {
    deltaX: function(t) {
      return "deltaX" in t ? t.deltaX : "wheelDeltaX" in t ? -t.wheelDeltaX : 0;
    },
    deltaY: function(t) {
      return "deltaY" in t ? t.deltaY : "wheelDeltaY" in t ? -t.wheelDeltaY : "wheelDelta" in t ? -t.wheelDelta : 0;
    },
    deltaZ: 0,
    deltaMode: 0
  }), Zm = hl(Qm), Vm = U({}, ke, {
    newState: 0,
    oldState: 0
  }), Km = hl(Vm), km = [9, 13, 27, 32], Ri = Fl && "CompositionEvent" in window, hn = null;
  Fl && "documentMode" in document && (hn = document.documentMode);
  var Jm = Fl && "TextEvent" in window && !hn, ro = Fl && (!Ri || hn && 8 < hn && 11 >= hn), mo = " ", ho = !1;
  function yo(t, l) {
    switch (t) {
      case "keyup":
        return km.indexOf(l.keyCode) !== -1;
      case "keydown":
        return l.keyCode !== 229;
      case "keypress":
      case "mousedown":
      case "focusout":
        return !0;
      default:
        return !1;
    }
  }
  function vo(t) {
    return t = t.detail, typeof t == "object" && "data" in t ? t.data : null;
  }
  var Ma = !1;
  function $m(t, l) {
    switch (t) {
      case "compositionend":
        return vo(l);
      case "keypress":
        return l.which !== 32 ? null : (ho = !0, mo);
      case "textInput":
        return t = l.data, t === mo && ho ? null : t;
      default:
        return null;
    }
  }
  function Wm(t, l) {
    if (Ma)
      return t === "compositionend" || !Ri && yo(t, l) ? (t = io(), au = Ni = ve = null, Ma = !1, t) : null;
    switch (t) {
      case "paste":
        return null;
      case "keypress":
        if (!(l.ctrlKey || l.altKey || l.metaKey) || l.ctrlKey && l.altKey) {
          if (l.char && 1 < l.char.length)
            return l.char;
          if (l.which) return String.fromCharCode(l.which);
        }
        return null;
      case "compositionend":
        return ro && l.locale !== "ko" ? null : l.data;
      default:
        return null;
    }
  }
  var Fm = {
    color: !0,
    date: !0,
    datetime: !0,
    "datetime-local": !0,
    email: !0,
    month: !0,
    number: !0,
    password: !0,
    range: !0,
    search: !0,
    tel: !0,
    text: !0,
    time: !0,
    url: !0,
    week: !0
  };
  function go(t) {
    var l = t && t.nodeName && t.nodeName.toLowerCase();
    return l === "input" ? !!Fm[t.type] : l === "textarea";
  }
  function po(t, l, e, a) {
    Ea ? Ta ? Ta.push(a) : Ta = [a] : Ea = a, l = Wu(l, "onChange"), 0 < l.length && (e = new iu(
      "onChange",
      "change",
      null,
      e,
      a
    ), t.push({ event: e, listeners: l }));
  }
  var yn = null, vn = null;
  function Im(t) {
    td(t, 0);
  }
  function fu(t) {
    var l = on(t);
    if (If(l)) return t;
  }
  function bo(t, l) {
    if (t === "change") return l;
  }
  var xo = !1;
  if (Fl) {
    var Hi;
    if (Fl) {
      var Bi = "oninput" in document;
      if (!Bi) {
        var So = document.createElement("div");
        So.setAttribute("oninput", "return;"), Bi = typeof So.oninput == "function";
      }
      Hi = Bi;
    } else Hi = !1;
    xo = Hi && (!document.documentMode || 9 < document.documentMode);
  }
  function zo() {
    yn && (yn.detachEvent("onpropertychange", Eo), vn = yn = null);
  }
  function Eo(t) {
    if (t.propertyName === "value" && fu(vn)) {
      var l = [];
      po(
        l,
        vn,
        t,
        _i(t)
      ), uo(Im, l);
    }
  }
  function Pm(t, l, e) {
    t === "focusin" ? (zo(), yn = l, vn = e, yn.attachEvent("onpropertychange", Eo)) : t === "focusout" && zo();
  }
  function th(t) {
    if (t === "selectionchange" || t === "keyup" || t === "keydown")
      return fu(vn);
  }
  function lh(t, l) {
    if (t === "click") return fu(l);
  }
  function eh(t, l) {
    if (t === "input" || t === "change")
      return fu(l);
  }
  function ah(t, l) {
    return t === l && (t !== 0 || 1 / t === 1 / l) || t !== t && l !== l;
  }
  var El = typeof Object.is == "function" ? Object.is : ah;
  function gn(t, l) {
    if (El(t, l)) return !0;
    if (typeof t != "object" || t === null || typeof l != "object" || l === null)
      return !1;
    var e = Object.keys(t), a = Object.keys(l);
    if (e.length !== a.length) return !1;
    for (a = 0; a < e.length; a++) {
      var n = e[a];
      if (!oa.call(l, n) || !El(t[n], l[n]))
        return !1;
    }
    return !0;
  }
  function To(t) {
    for (; t && t.firstChild; ) t = t.firstChild;
    return t;
  }
  function Mo(t, l) {
    var e = To(t);
    t = 0;
    for (var a; e; ) {
      if (e.nodeType === 3) {
        if (a = t + e.textContent.length, t <= l && a >= l)
          return { node: e, offset: l - t };
        t = a;
      }
      t: {
        for (; e; ) {
          if (e.nextSibling) {
            e = e.nextSibling;
            break t;
          }
          e = e.parentNode;
        }
        e = void 0;
      }
      e = To(e);
    }
  }
  function _o(t, l) {
    return t && l ? t === l ? !0 : t && t.nodeType === 3 ? !1 : l && l.nodeType === 3 ? _o(t, l.parentNode) : "contains" in t ? t.contains(l) : t.compareDocumentPosition ? !!(t.compareDocumentPosition(l) & 16) : !1 : !1;
  }
  function Ao(t) {
    t = t != null && t.ownerDocument != null && t.ownerDocument.defaultView != null ? t.ownerDocument.defaultView : window;
    for (var l = lu(t.document); l instanceof t.HTMLIFrameElement; ) {
      try {
        var e = typeof l.contentWindow.location.href == "string";
      } catch {
        e = !1;
      }
      if (e) t = l.contentWindow;
      else break;
      l = lu(t.document);
    }
    return l;
  }
  function Yi(t) {
    var l = t && t.nodeName && t.nodeName.toLowerCase();
    return l && (l === "input" && (t.type === "text" || t.type === "search" || t.type === "tel" || t.type === "url" || t.type === "password") || l === "textarea" || t.contentEditable === "true");
  }
  var nh = Fl && "documentMode" in document && 11 >= document.documentMode, _a = null, qi = null, pn = null, wi = !1;
  function Do(t, l, e) {
    var a = e.window === e ? e.document : e.nodeType === 9 ? e : e.ownerDocument;
    wi || _a == null || _a !== lu(a) || (a = _a, "selectionStart" in a && Yi(a) ? a = { start: a.selectionStart, end: a.selectionEnd } : (a = (a.ownerDocument && a.ownerDocument.defaultView || window).getSelection(), a = {
      anchorNode: a.anchorNode,
      anchorOffset: a.anchorOffset,
      focusNode: a.focusNode,
      focusOffset: a.focusOffset
    }), pn && gn(pn, a) || (pn = a, a = Wu(qi, "onSelect"), 0 < a.length && (l = new iu(
      "onSelect",
      "select",
      null,
      l,
      e
    ), t.push({ event: l, listeners: a }), l.target = _a)));
  }
  function Je(t, l) {
    var e = {};
    return e[t.toLowerCase()] = l.toLowerCase(), e["Webkit" + t] = "webkit" + l, e["Moz" + t] = "moz" + l, e;
  }
  var Aa = {
    animationend: Je("Animation", "AnimationEnd"),
    animationiteration: Je("Animation", "AnimationIteration"),
    animationstart: Je("Animation", "AnimationStart"),
    transitionrun: Je("Transition", "TransitionRun"),
    transitionstart: Je("Transition", "TransitionStart"),
    transitioncancel: Je("Transition", "TransitionCancel"),
    transitionend: Je("Transition", "TransitionEnd")
  }, Xi = {}, No = {};
  Fl && (No = document.createElement("div").style, "AnimationEvent" in window || (delete Aa.animationend.animation, delete Aa.animationiteration.animation, delete Aa.animationstart.animation), "TransitionEvent" in window || delete Aa.transitionend.transition);
  function $e(t) {
    if (Xi[t]) return Xi[t];
    if (!Aa[t]) return t;
    var l = Aa[t], e;
    for (e in l)
      if (l.hasOwnProperty(e) && e in No)
        return Xi[t] = l[e];
    return t;
  }
  var Co = $e("animationend"), jo = $e("animationiteration"), Oo = $e("animationstart"), uh = $e("transitionrun"), ih = $e("transitionstart"), ch = $e("transitioncancel"), Uo = $e("transitionend"), Ro = /* @__PURE__ */ new Map(), Gi = "abort auxClick beforeToggle cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel".split(
    " "
  );
  Gi.push("scrollEnd");
  function Xl(t, l) {
    Ro.set(t, l), Ke(l, [t]);
  }
  var ou = typeof reportError == "function" ? reportError : function(t) {
    if (typeof window == "object" && typeof window.ErrorEvent == "function") {
      var l = new window.ErrorEvent("error", {
        bubbles: !0,
        cancelable: !0,
        message: typeof t == "object" && t !== null && typeof t.message == "string" ? String(t.message) : String(t),
        error: t
      });
      if (!window.dispatchEvent(l)) return;
    } else if (typeof process == "object" && typeof process.emit == "function") {
      process.emit("uncaughtException", t);
      return;
    }
    console.error(t);
  }, Ol = [], Da = 0, Li = 0;
  function su() {
    for (var t = Da, l = Li = Da = 0; l < t; ) {
      var e = Ol[l];
      Ol[l++] = null;
      var a = Ol[l];
      Ol[l++] = null;
      var n = Ol[l];
      Ol[l++] = null;
      var u = Ol[l];
      if (Ol[l++] = null, a !== null && n !== null) {
        var i = a.pending;
        i === null ? n.next = n : (n.next = i.next, i.next = n), a.pending = n;
      }
      u !== 0 && Ho(e, n, u);
    }
  }
  function ru(t, l, e, a) {
    Ol[Da++] = t, Ol[Da++] = l, Ol[Da++] = e, Ol[Da++] = a, Li |= a, t.lanes |= a, t = t.alternate, t !== null && (t.lanes |= a);
  }
  function Qi(t, l, e, a) {
    return ru(t, l, e, a), du(t);
  }
  function We(t, l) {
    return ru(t, null, null, l), du(t);
  }
  function Ho(t, l, e) {
    t.lanes |= e;
    var a = t.alternate;
    a !== null && (a.lanes |= e);
    for (var n = !1, u = t.return; u !== null; )
      u.childLanes |= e, a = u.alternate, a !== null && (a.childLanes |= e), u.tag === 22 && (t = u.stateNode, t === null || t._visibility & 1 || (n = !0)), t = u, u = u.return;
    return t.tag === 3 ? (u = t.stateNode, n && l !== null && (n = 31 - el(e), t = u.hiddenUpdates, a = t[n], a === null ? t[n] = [l] : a.push(l), l.lane = e | 536870912), u) : null;
  }
  function du(t) {
    if (50 < Xn)
      throw Xn = 0, Ic = null, Error(s(185));
    for (var l = t.return; l !== null; )
      t = l, l = t.return;
    return t.tag === 3 ? t.stateNode : null;
  }
  var Na = {};
  function fh(t, l, e, a) {
    this.tag = t, this.key = e, this.sibling = this.child = this.return = this.stateNode = this.type = this.elementType = null, this.index = 0, this.refCleanup = this.ref = null, this.pendingProps = l, this.dependencies = this.memoizedState = this.updateQueue = this.memoizedProps = null, this.mode = a, this.subtreeFlags = this.flags = 0, this.deletions = null, this.childLanes = this.lanes = 0, this.alternate = null;
  }
  function Tl(t, l, e, a) {
    return new fh(t, l, e, a);
  }
  function Zi(t) {
    return t = t.prototype, !(!t || !t.isReactComponent);
  }
  function Il(t, l) {
    var e = t.alternate;
    return e === null ? (e = Tl(
      t.tag,
      l,
      t.key,
      t.mode
    ), e.elementType = t.elementType, e.type = t.type, e.stateNode = t.stateNode, e.alternate = t, t.alternate = e) : (e.pendingProps = l, e.type = t.type, e.flags = 0, e.subtreeFlags = 0, e.deletions = null), e.flags = t.flags & 65011712, e.childLanes = t.childLanes, e.lanes = t.lanes, e.child = t.child, e.memoizedProps = t.memoizedProps, e.memoizedState = t.memoizedState, e.updateQueue = t.updateQueue, l = t.dependencies, e.dependencies = l === null ? null : { lanes: l.lanes, firstContext: l.firstContext }, e.sibling = t.sibling, e.index = t.index, e.ref = t.ref, e.refCleanup = t.refCleanup, e;
  }
  function Bo(t, l) {
    t.flags &= 65011714;
    var e = t.alternate;
    return e === null ? (t.childLanes = 0, t.lanes = l, t.child = null, t.subtreeFlags = 0, t.memoizedProps = null, t.memoizedState = null, t.updateQueue = null, t.dependencies = null, t.stateNode = null) : (t.childLanes = e.childLanes, t.lanes = e.lanes, t.child = e.child, t.subtreeFlags = 0, t.deletions = null, t.memoizedProps = e.memoizedProps, t.memoizedState = e.memoizedState, t.updateQueue = e.updateQueue, t.type = e.type, l = e.dependencies, t.dependencies = l === null ? null : {
      lanes: l.lanes,
      firstContext: l.firstContext
    }), t;
  }
  function mu(t, l, e, a, n, u) {
    var i = 0;
    if (a = t, typeof t == "function") Zi(t) && (i = 1);
    else if (typeof t == "string")
      i = m0(
        t,
        e,
        B.current
      ) ? 26 : t === "html" || t === "head" || t === "body" ? 27 : 5;
    else
      t: switch (t) {
        case Mt:
          return t = Tl(31, e, l, n), t.elementType = Mt, t.lanes = u, t;
        case $:
          return Fe(e.children, n, u, l);
        case st:
          i = 8, n |= 24;
          break;
        case O:
          return t = Tl(12, e, l, n | 2), t.elementType = O, t.lanes = u, t;
        case nt:
          return t = Tl(13, e, l, n), t.elementType = nt, t.lanes = u, t;
        case rt:
          return t = Tl(19, e, l, n), t.elementType = rt, t.lanes = u, t;
        default:
          if (typeof t == "object" && t !== null)
            switch (t.$$typeof) {
              case et:
                i = 10;
                break t;
              case W:
                i = 9;
                break t;
              case X:
                i = 11;
                break t;
              case K:
                i = 14;
                break t;
              case pt:
                i = 16, a = null;
                break t;
            }
          i = 29, e = Error(
            s(130, t === null ? "null" : typeof t, "")
          ), a = null;
      }
    return l = Tl(i, e, l, n), l.elementType = t, l.type = a, l.lanes = u, l;
  }
  function Fe(t, l, e, a) {
    return t = Tl(7, t, a, l), t.lanes = e, t;
  }
  function Vi(t, l, e) {
    return t = Tl(6, t, null, l), t.lanes = e, t;
  }
  function Yo(t) {
    var l = Tl(18, null, null, 0);
    return l.stateNode = t, l;
  }
  function Ki(t, l, e) {
    return l = Tl(
      4,
      t.children !== null ? t.children : [],
      t.key,
      l
    ), l.lanes = e, l.stateNode = {
      containerInfo: t.containerInfo,
      pendingChildren: null,
      implementation: t.implementation
    }, l;
  }
  var qo = /* @__PURE__ */ new WeakMap();
  function Ul(t, l) {
    if (typeof t == "object" && t !== null) {
      var e = qo.get(t);
      return e !== void 0 ? e : (l = {
        value: t,
        source: l,
        stack: en(l)
      }, qo.set(t, l), l);
    }
    return {
      value: t,
      source: l,
      stack: en(l)
    };
  }
  var Ca = [], ja = 0, hu = null, bn = 0, Rl = [], Hl = 0, ge = null, Zl = 1, Vl = "";
  function Pl(t, l) {
    Ca[ja++] = bn, Ca[ja++] = hu, hu = t, bn = l;
  }
  function wo(t, l, e) {
    Rl[Hl++] = Zl, Rl[Hl++] = Vl, Rl[Hl++] = ge, ge = t;
    var a = Zl;
    t = Vl;
    var n = 32 - el(a) - 1;
    a &= ~(1 << n), e += 1;
    var u = 32 - el(l) + n;
    if (30 < u) {
      var i = n - n % 5;
      u = (a & (1 << i) - 1).toString(32), a >>= i, n -= i, Zl = 1 << 32 - el(l) + n | e << n | a, Vl = u + t;
    } else
      Zl = 1 << u | e << n | a, Vl = t;
  }
  function ki(t) {
    t.return !== null && (Pl(t, 1), wo(t, 1, 0));
  }
  function Ji(t) {
    for (; t === hu; )
      hu = Ca[--ja], Ca[ja] = null, bn = Ca[--ja], Ca[ja] = null;
    for (; t === ge; )
      ge = Rl[--Hl], Rl[Hl] = null, Vl = Rl[--Hl], Rl[Hl] = null, Zl = Rl[--Hl], Rl[Hl] = null;
  }
  function Xo(t, l) {
    Rl[Hl++] = Zl, Rl[Hl++] = Vl, Rl[Hl++] = ge, Zl = l.id, Vl = l.overflow, ge = t;
  }
  var nl = null, Ut = null, vt = !1, pe = null, Bl = !1, $i = Error(s(519));
  function be(t) {
    var l = Error(
      s(
        418,
        1 < arguments.length && arguments[1] !== void 0 && arguments[1] ? "text" : "HTML",
        ""
      )
    );
    throw xn(Ul(l, t)), $i;
  }
  function Go(t) {
    var l = t.stateNode, e = t.type, a = t.memoizedProps;
    switch (l[al] = t, l[ml] = a, e) {
      case "dialog":
        mt("cancel", l), mt("close", l);
        break;
      case "iframe":
      case "object":
      case "embed":
        mt("load", l);
        break;
      case "video":
      case "audio":
        for (e = 0; e < Ln.length; e++)
          mt(Ln[e], l);
        break;
      case "source":
        mt("error", l);
        break;
      case "img":
      case "image":
      case "link":
        mt("error", l), mt("load", l);
        break;
      case "details":
        mt("toggle", l);
        break;
      case "input":
        mt("invalid", l), Pf(
          l,
          a.value,
          a.defaultValue,
          a.checked,
          a.defaultChecked,
          a.type,
          a.name,
          !0
        );
        break;
      case "select":
        mt("invalid", l);
        break;
      case "textarea":
        mt("invalid", l), lo(l, a.value, a.defaultValue, a.children);
    }
    e = a.children, typeof e != "string" && typeof e != "number" && typeof e != "bigint" || l.textContent === "" + e || a.suppressHydrationWarning === !0 || nd(l.textContent, e) ? (a.popover != null && (mt("beforetoggle", l), mt("toggle", l)), a.onScroll != null && mt("scroll", l), a.onScrollEnd != null && mt("scrollend", l), a.onClick != null && (l.onclick = Wl), l = !0) : l = !1, l || be(t, !0);
  }
  function Lo(t) {
    for (nl = t.return; nl; )
      switch (nl.tag) {
        case 5:
        case 31:
        case 13:
          Bl = !1;
          return;
        case 27:
        case 3:
          Bl = !0;
          return;
        default:
          nl = nl.return;
      }
  }
  function Oa(t) {
    if (t !== nl) return !1;
    if (!vt) return Lo(t), vt = !0, !1;
    var l = t.tag, e;
    if ((e = l !== 3 && l !== 27) && ((e = l === 5) && (e = t.type, e = !(e !== "form" && e !== "button") || hf(t.type, t.memoizedProps)), e = !e), e && Ut && be(t), Lo(t), l === 13) {
      if (t = t.memoizedState, t = t !== null ? t.dehydrated : null, !t) throw Error(s(317));
      Ut = md(t);
    } else if (l === 31) {
      if (t = t.memoizedState, t = t !== null ? t.dehydrated : null, !t) throw Error(s(317));
      Ut = md(t);
    } else
      l === 27 ? (l = Ut, Ue(t.type) ? (t = bf, bf = null, Ut = t) : Ut = l) : Ut = nl ? ql(t.stateNode.nextSibling) : null;
    return !0;
  }
  function Ie() {
    Ut = nl = null, vt = !1;
  }
  function Wi() {
    var t = pe;
    return t !== null && (pl === null ? pl = t : pl.push.apply(
      pl,
      t
    ), pe = null), t;
  }
  function xn(t) {
    pe === null ? pe = [t] : pe.push(t);
  }
  var Fi = r(null), Pe = null, te = null;
  function xe(t, l, e) {
    j(Fi, l._currentValue), l._currentValue = e;
  }
  function le(t) {
    t._currentValue = Fi.current, M(Fi);
  }
  function Ii(t, l, e) {
    for (; t !== null; ) {
      var a = t.alternate;
      if ((t.childLanes & l) !== l ? (t.childLanes |= l, a !== null && (a.childLanes |= l)) : a !== null && (a.childLanes & l) !== l && (a.childLanes |= l), t === e) break;
      t = t.return;
    }
  }
  function Pi(t, l, e, a) {
    var n = t.child;
    for (n !== null && (n.return = t); n !== null; ) {
      var u = n.dependencies;
      if (u !== null) {
        var i = n.child;
        u = u.firstContext;
        t: for (; u !== null; ) {
          var c = u;
          u = n;
          for (var d = 0; d < l.length; d++)
            if (c.context === l[d]) {
              u.lanes |= e, c = u.alternate, c !== null && (c.lanes |= e), Ii(
                u.return,
                e,
                t
              ), a || (i = null);
              break t;
            }
          u = c.next;
        }
      } else if (n.tag === 18) {
        if (i = n.return, i === null) throw Error(s(341));
        i.lanes |= e, u = i.alternate, u !== null && (u.lanes |= e), Ii(i, e, t), i = null;
      } else i = n.child;
      if (i !== null) i.return = n;
      else
        for (i = n; i !== null; ) {
          if (i === t) {
            i = null;
            break;
          }
          if (n = i.sibling, n !== null) {
            n.return = i.return, i = n;
            break;
          }
          i = i.return;
        }
      n = i;
    }
  }
  function Ua(t, l, e, a) {
    t = null;
    for (var n = l, u = !1; n !== null; ) {
      if (!u) {
        if ((n.flags & 524288) !== 0) u = !0;
        else if ((n.flags & 262144) !== 0) break;
      }
      if (n.tag === 10) {
        var i = n.alternate;
        if (i === null) throw Error(s(387));
        if (i = i.memoizedProps, i !== null) {
          var c = n.type;
          El(n.pendingProps.value, i.value) || (t !== null ? t.push(c) : t = [c]);
        }
      } else if (n === ft.current) {
        if (i = n.alternate, i === null) throw Error(s(387));
        i.memoizedState.memoizedState !== n.memoizedState.memoizedState && (t !== null ? t.push(kn) : t = [kn]);
      }
      n = n.return;
    }
    t !== null && Pi(
      l,
      t,
      e,
      a
    ), l.flags |= 262144;
  }
  function yu(t) {
    for (t = t.firstContext; t !== null; ) {
      if (!El(
        t.context._currentValue,
        t.memoizedValue
      ))
        return !0;
      t = t.next;
    }
    return !1;
  }
  function ta(t) {
    Pe = t, te = null, t = t.dependencies, t !== null && (t.firstContext = null);
  }
  function ul(t) {
    return Qo(Pe, t);
  }
  function vu(t, l) {
    return Pe === null && ta(t), Qo(t, l);
  }
  function Qo(t, l) {
    var e = l._currentValue;
    if (l = { context: l, memoizedValue: e, next: null }, te === null) {
      if (t === null) throw Error(s(308));
      te = l, t.dependencies = { lanes: 0, firstContext: l }, t.flags |= 524288;
    } else te = te.next = l;
    return e;
  }
  var oh = typeof AbortController < "u" ? AbortController : function() {
    var t = [], l = this.signal = {
      aborted: !1,
      addEventListener: function(e, a) {
        t.push(a);
      }
    };
    this.abort = function() {
      l.aborted = !0, t.forEach(function(e) {
        return e();
      });
    };
  }, sh = f.unstable_scheduleCallback, rh = f.unstable_NormalPriority, kt = {
    $$typeof: et,
    Consumer: null,
    Provider: null,
    _currentValue: null,
    _currentValue2: null,
    _threadCount: 0
  };
  function tc() {
    return {
      controller: new oh(),
      data: /* @__PURE__ */ new Map(),
      refCount: 0
    };
  }
  function Sn(t) {
    t.refCount--, t.refCount === 0 && sh(rh, function() {
      t.controller.abort();
    });
  }
  var zn = null, lc = 0, Ra = 0, Ha = null;
  function dh(t, l) {
    if (zn === null) {
      var e = zn = [];
      lc = 0, Ra = nf(), Ha = {
        status: "pending",
        value: void 0,
        then: function(a) {
          e.push(a);
        }
      };
    }
    return lc++, l.then(Zo, Zo), l;
  }
  function Zo() {
    if (--lc === 0 && zn !== null) {
      Ha !== null && (Ha.status = "fulfilled");
      var t = zn;
      zn = null, Ra = 0, Ha = null;
      for (var l = 0; l < t.length; l++) (0, t[l])();
    }
  }
  function mh(t, l) {
    var e = [], a = {
      status: "pending",
      value: null,
      reason: null,
      then: function(n) {
        e.push(n);
      }
    };
    return t.then(
      function() {
        a.status = "fulfilled", a.value = l;
        for (var n = 0; n < e.length; n++) (0, e[n])(l);
      },
      function(n) {
        for (a.status = "rejected", a.reason = n, n = 0; n < e.length; n++)
          (0, e[n])(void 0);
      }
    ), a;
  }
  var Vo = y.S;
  y.S = function(t, l) {
    Dr = Pt(), typeof l == "object" && l !== null && typeof l.then == "function" && dh(t, l), Vo !== null && Vo(t, l);
  };
  var la = r(null);
  function ec() {
    var t = la.current;
    return t !== null ? t : jt.pooledCache;
  }
  function gu(t, l) {
    l === null ? j(la, la.current) : j(la, l.pool);
  }
  function Ko() {
    var t = ec();
    return t === null ? null : { parent: kt._currentValue, pool: t };
  }
  var Ba = Error(s(460)), ac = Error(s(474)), pu = Error(s(542)), bu = { then: function() {
  } };
  function ko(t) {
    return t = t.status, t === "fulfilled" || t === "rejected";
  }
  function Jo(t, l, e) {
    switch (e = t[e], e === void 0 ? t.push(l) : e !== l && (l.then(Wl, Wl), l = e), l.status) {
      case "fulfilled":
        return l.value;
      case "rejected":
        throw t = l.reason, Wo(t), t;
      default:
        if (typeof l.status == "string") l.then(Wl, Wl);
        else {
          if (t = jt, t !== null && 100 < t.shellSuspendCounter)
            throw Error(s(482));
          t = l, t.status = "pending", t.then(
            function(a) {
              if (l.status === "pending") {
                var n = l;
                n.status = "fulfilled", n.value = a;
              }
            },
            function(a) {
              if (l.status === "pending") {
                var n = l;
                n.status = "rejected", n.reason = a;
              }
            }
          );
        }
        switch (l.status) {
          case "fulfilled":
            return l.value;
          case "rejected":
            throw t = l.reason, Wo(t), t;
        }
        throw aa = l, Ba;
    }
  }
  function ea(t) {
    try {
      var l = t._init;
      return l(t._payload);
    } catch (e) {
      throw e !== null && typeof e == "object" && typeof e.then == "function" ? (aa = e, Ba) : e;
    }
  }
  var aa = null;
  function $o() {
    if (aa === null) throw Error(s(459));
    var t = aa;
    return aa = null, t;
  }
  function Wo(t) {
    if (t === Ba || t === pu)
      throw Error(s(483));
  }
  var Ya = null, En = 0;
  function xu(t) {
    var l = En;
    return En += 1, Ya === null && (Ya = []), Jo(Ya, t, l);
  }
  function Tn(t, l) {
    l = l.props.ref, t.ref = l !== void 0 ? l : null;
  }
  function Su(t, l) {
    throw l.$$typeof === Y ? Error(s(525)) : (t = Object.prototype.toString.call(l), Error(
      s(
        31,
        t === "[object Object]" ? "object with keys {" + Object.keys(l).join(", ") + "}" : t
      )
    ));
  }
  function Fo(t) {
    function l(v, h) {
      if (t) {
        var g = v.deletions;
        g === null ? (v.deletions = [h], v.flags |= 16) : g.push(h);
      }
    }
    function e(v, h) {
      if (!t) return null;
      for (; h !== null; )
        l(v, h), h = h.sibling;
      return null;
    }
    function a(v) {
      for (var h = /* @__PURE__ */ new Map(); v !== null; )
        v.key !== null ? h.set(v.key, v) : h.set(v.index, v), v = v.sibling;
      return h;
    }
    function n(v, h) {
      return v = Il(v, h), v.index = 0, v.sibling = null, v;
    }
    function u(v, h, g) {
      return v.index = g, t ? (g = v.alternate, g !== null ? (g = g.index, g < h ? (v.flags |= 67108866, h) : g) : (v.flags |= 67108866, h)) : (v.flags |= 1048576, h);
    }
    function i(v) {
      return t && v.alternate === null && (v.flags |= 67108866), v;
    }
    function c(v, h, g, A) {
      return h === null || h.tag !== 6 ? (h = Vi(g, v.mode, A), h.return = v, h) : (h = n(h, g), h.return = v, h);
    }
    function d(v, h, g, A) {
      var lt = g.type;
      return lt === $ ? E(
        v,
        h,
        g.props.children,
        A,
        g.key
      ) : h !== null && (h.elementType === lt || typeof lt == "object" && lt !== null && lt.$$typeof === pt && ea(lt) === h.type) ? (h = n(h, g.props), Tn(h, g), h.return = v, h) : (h = mu(
        g.type,
        g.key,
        g.props,
        null,
        v.mode,
        A
      ), Tn(h, g), h.return = v, h);
    }
    function p(v, h, g, A) {
      return h === null || h.tag !== 4 || h.stateNode.containerInfo !== g.containerInfo || h.stateNode.implementation !== g.implementation ? (h = Ki(g, v.mode, A), h.return = v, h) : (h = n(h, g.children || []), h.return = v, h);
    }
    function E(v, h, g, A, lt) {
      return h === null || h.tag !== 7 ? (h = Fe(
        g,
        v.mode,
        A,
        lt
      ), h.return = v, h) : (h = n(h, g), h.return = v, h);
    }
    function N(v, h, g) {
      if (typeof h == "string" && h !== "" || typeof h == "number" || typeof h == "bigint")
        return h = Vi(
          "" + h,
          v.mode,
          g
        ), h.return = v, h;
      if (typeof h == "object" && h !== null) {
        switch (h.$$typeof) {
          case V:
            return g = mu(
              h.type,
              h.key,
              h.props,
              null,
              v.mode,
              g
            ), Tn(g, h), g.return = v, g;
          case tt:
            return h = Ki(
              h,
              v.mode,
              g
            ), h.return = v, h;
          case pt:
            return h = ea(h), N(v, h, g);
        }
        if (it(h) || k(h))
          return h = Fe(
            h,
            v.mode,
            g,
            null
          ), h.return = v, h;
        if (typeof h.then == "function")
          return N(v, xu(h), g);
        if (h.$$typeof === et)
          return N(
            v,
            vu(v, h),
            g
          );
        Su(v, h);
      }
      return null;
    }
    function x(v, h, g, A) {
      var lt = h !== null ? h.key : null;
      if (typeof g == "string" && g !== "" || typeof g == "number" || typeof g == "bigint")
        return lt !== null ? null : c(v, h, "" + g, A);
      if (typeof g == "object" && g !== null) {
        switch (g.$$typeof) {
          case V:
            return g.key === lt ? d(v, h, g, A) : null;
          case tt:
            return g.key === lt ? p(v, h, g, A) : null;
          case pt:
            return g = ea(g), x(v, h, g, A);
        }
        if (it(g) || k(g))
          return lt !== null ? null : E(v, h, g, A, null);
        if (typeof g.then == "function")
          return x(
            v,
            h,
            xu(g),
            A
          );
        if (g.$$typeof === et)
          return x(
            v,
            h,
            vu(v, g),
            A
          );
        Su(v, g);
      }
      return null;
    }
    function z(v, h, g, A, lt) {
      if (typeof A == "string" && A !== "" || typeof A == "number" || typeof A == "bigint")
        return v = v.get(g) || null, c(h, v, "" + A, lt);
      if (typeof A == "object" && A !== null) {
        switch (A.$$typeof) {
          case V:
            return v = v.get(
              A.key === null ? g : A.key
            ) || null, d(h, v, A, lt);
          case tt:
            return v = v.get(
              A.key === null ? g : A.key
            ) || null, p(h, v, A, lt);
          case pt:
            return A = ea(A), z(
              v,
              h,
              g,
              A,
              lt
            );
        }
        if (it(A) || k(A))
          return v = v.get(g) || null, E(h, v, A, lt, null);
        if (typeof A.then == "function")
          return z(
            v,
            h,
            g,
            xu(A),
            lt
          );
        if (A.$$typeof === et)
          return z(
            v,
            h,
            g,
            vu(h, A),
            lt
          );
        Su(h, A);
      }
      return null;
    }
    function J(v, h, g, A) {
      for (var lt = null, xt = null, I = h, ot = h = 0, yt = null; I !== null && ot < g.length; ot++) {
        I.index > ot ? (yt = I, I = null) : yt = I.sibling;
        var St = x(
          v,
          I,
          g[ot],
          A
        );
        if (St === null) {
          I === null && (I = yt);
          break;
        }
        t && I && St.alternate === null && l(v, I), h = u(St, h, ot), xt === null ? lt = St : xt.sibling = St, xt = St, I = yt;
      }
      if (ot === g.length)
        return e(v, I), vt && Pl(v, ot), lt;
      if (I === null) {
        for (; ot < g.length; ot++)
          I = N(v, g[ot], A), I !== null && (h = u(
            I,
            h,
            ot
          ), xt === null ? lt = I : xt.sibling = I, xt = I);
        return vt && Pl(v, ot), lt;
      }
      for (I = a(I); ot < g.length; ot++)
        yt = z(
          I,
          v,
          ot,
          g[ot],
          A
        ), yt !== null && (t && yt.alternate !== null && I.delete(
          yt.key === null ? ot : yt.key
        ), h = u(
          yt,
          h,
          ot
        ), xt === null ? lt = yt : xt.sibling = yt, xt = yt);
      return t && I.forEach(function(qe) {
        return l(v, qe);
      }), vt && Pl(v, ot), lt;
    }
    function at(v, h, g, A) {
      if (g == null) throw Error(s(151));
      for (var lt = null, xt = null, I = h, ot = h = 0, yt = null, St = g.next(); I !== null && !St.done; ot++, St = g.next()) {
        I.index > ot ? (yt = I, I = null) : yt = I.sibling;
        var qe = x(v, I, St.value, A);
        if (qe === null) {
          I === null && (I = yt);
          break;
        }
        t && I && qe.alternate === null && l(v, I), h = u(qe, h, ot), xt === null ? lt = qe : xt.sibling = qe, xt = qe, I = yt;
      }
      if (St.done)
        return e(v, I), vt && Pl(v, ot), lt;
      if (I === null) {
        for (; !St.done; ot++, St = g.next())
          St = N(v, St.value, A), St !== null && (h = u(St, h, ot), xt === null ? lt = St : xt.sibling = St, xt = St);
        return vt && Pl(v, ot), lt;
      }
      for (I = a(I); !St.done; ot++, St = g.next())
        St = z(I, v, ot, St.value, A), St !== null && (t && St.alternate !== null && I.delete(St.key === null ? ot : St.key), h = u(St, h, ot), xt === null ? lt = St : xt.sibling = St, xt = St);
      return t && I.forEach(function(T0) {
        return l(v, T0);
      }), vt && Pl(v, ot), lt;
    }
    function Ct(v, h, g, A) {
      if (typeof g == "object" && g !== null && g.type === $ && g.key === null && (g = g.props.children), typeof g == "object" && g !== null) {
        switch (g.$$typeof) {
          case V:
            t: {
              for (var lt = g.key; h !== null; ) {
                if (h.key === lt) {
                  if (lt = g.type, lt === $) {
                    if (h.tag === 7) {
                      e(
                        v,
                        h.sibling
                      ), A = n(
                        h,
                        g.props.children
                      ), A.return = v, v = A;
                      break t;
                    }
                  } else if (h.elementType === lt || typeof lt == "object" && lt !== null && lt.$$typeof === pt && ea(lt) === h.type) {
                    e(
                      v,
                      h.sibling
                    ), A = n(h, g.props), Tn(A, g), A.return = v, v = A;
                    break t;
                  }
                  e(v, h);
                  break;
                } else l(v, h);
                h = h.sibling;
              }
              g.type === $ ? (A = Fe(
                g.props.children,
                v.mode,
                A,
                g.key
              ), A.return = v, v = A) : (A = mu(
                g.type,
                g.key,
                g.props,
                null,
                v.mode,
                A
              ), Tn(A, g), A.return = v, v = A);
            }
            return i(v);
          case tt:
            t: {
              for (lt = g.key; h !== null; ) {
                if (h.key === lt)
                  if (h.tag === 4 && h.stateNode.containerInfo === g.containerInfo && h.stateNode.implementation === g.implementation) {
                    e(
                      v,
                      h.sibling
                    ), A = n(h, g.children || []), A.return = v, v = A;
                    break t;
                  } else {
                    e(v, h);
                    break;
                  }
                else l(v, h);
                h = h.sibling;
              }
              A = Ki(g, v.mode, A), A.return = v, v = A;
            }
            return i(v);
          case pt:
            return g = ea(g), Ct(
              v,
              h,
              g,
              A
            );
        }
        if (it(g))
          return J(
            v,
            h,
            g,
            A
          );
        if (k(g)) {
          if (lt = k(g), typeof lt != "function") throw Error(s(150));
          return g = lt.call(g), at(
            v,
            h,
            g,
            A
          );
        }
        if (typeof g.then == "function")
          return Ct(
            v,
            h,
            xu(g),
            A
          );
        if (g.$$typeof === et)
          return Ct(
            v,
            h,
            vu(v, g),
            A
          );
        Su(v, g);
      }
      return typeof g == "string" && g !== "" || typeof g == "number" || typeof g == "bigint" ? (g = "" + g, h !== null && h.tag === 6 ? (e(v, h.sibling), A = n(h, g), A.return = v, v = A) : (e(v, h), A = Vi(g, v.mode, A), A.return = v, v = A), i(v)) : e(v, h);
    }
    return function(v, h, g, A) {
      try {
        En = 0;
        var lt = Ct(
          v,
          h,
          g,
          A
        );
        return Ya = null, lt;
      } catch (I) {
        if (I === Ba || I === pu) throw I;
        var xt = Tl(29, I, null, v.mode);
        return xt.lanes = A, xt.return = v, xt;
      }
    };
  }
  var na = Fo(!0), Io = Fo(!1), Se = !1;
  function nc(t) {
    t.updateQueue = {
      baseState: t.memoizedState,
      firstBaseUpdate: null,
      lastBaseUpdate: null,
      shared: { pending: null, lanes: 0, hiddenCallbacks: null },
      callbacks: null
    };
  }
  function uc(t, l) {
    t = t.updateQueue, l.updateQueue === t && (l.updateQueue = {
      baseState: t.baseState,
      firstBaseUpdate: t.firstBaseUpdate,
      lastBaseUpdate: t.lastBaseUpdate,
      shared: t.shared,
      callbacks: null
    });
  }
  function ze(t) {
    return { lane: t, tag: 0, payload: null, callback: null, next: null };
  }
  function Ee(t, l, e) {
    var a = t.updateQueue;
    if (a === null) return null;
    if (a = a.shared, (Tt & 2) !== 0) {
      var n = a.pending;
      return n === null ? l.next = l : (l.next = n.next, n.next = l), a.pending = l, l = du(t), Ho(t, null, e), l;
    }
    return ru(t, a, l, e), du(t);
  }
  function Mn(t, l, e) {
    if (l = l.updateQueue, l !== null && (l = l.shared, (e & 4194048) !== 0)) {
      var a = l.lanes;
      a &= t.pendingLanes, e |= a, l.lanes = e, Lf(t, e);
    }
  }
  function ic(t, l) {
    var e = t.updateQueue, a = t.alternate;
    if (a !== null && (a = a.updateQueue, e === a)) {
      var n = null, u = null;
      if (e = e.firstBaseUpdate, e !== null) {
        do {
          var i = {
            lane: e.lane,
            tag: e.tag,
            payload: e.payload,
            callback: null,
            next: null
          };
          u === null ? n = u = i : u = u.next = i, e = e.next;
        } while (e !== null);
        u === null ? n = u = l : u = u.next = l;
      } else n = u = l;
      e = {
        baseState: a.baseState,
        firstBaseUpdate: n,
        lastBaseUpdate: u,
        shared: a.shared,
        callbacks: a.callbacks
      }, t.updateQueue = e;
      return;
    }
    t = e.lastBaseUpdate, t === null ? e.firstBaseUpdate = l : t.next = l, e.lastBaseUpdate = l;
  }
  var cc = !1;
  function _n() {
    if (cc) {
      var t = Ha;
      if (t !== null) throw t;
    }
  }
  function An(t, l, e, a) {
    cc = !1;
    var n = t.updateQueue;
    Se = !1;
    var u = n.firstBaseUpdate, i = n.lastBaseUpdate, c = n.shared.pending;
    if (c !== null) {
      n.shared.pending = null;
      var d = c, p = d.next;
      d.next = null, i === null ? u = p : i.next = p, i = d;
      var E = t.alternate;
      E !== null && (E = E.updateQueue, c = E.lastBaseUpdate, c !== i && (c === null ? E.firstBaseUpdate = p : c.next = p, E.lastBaseUpdate = d));
    }
    if (u !== null) {
      var N = n.baseState;
      i = 0, E = p = d = null, c = u;
      do {
        var x = c.lane & -536870913, z = x !== c.lane;
        if (z ? (ht & x) === x : (a & x) === x) {
          x !== 0 && x === Ra && (cc = !0), E !== null && (E = E.next = {
            lane: 0,
            tag: c.tag,
            payload: c.payload,
            callback: null,
            next: null
          });
          t: {
            var J = t, at = c;
            x = l;
            var Ct = e;
            switch (at.tag) {
              case 1:
                if (J = at.payload, typeof J == "function") {
                  N = J.call(Ct, N, x);
                  break t;
                }
                N = J;
                break t;
              case 3:
                J.flags = J.flags & -65537 | 128;
              case 0:
                if (J = at.payload, x = typeof J == "function" ? J.call(Ct, N, x) : J, x == null) break t;
                N = U({}, N, x);
                break t;
              case 2:
                Se = !0;
            }
          }
          x = c.callback, x !== null && (t.flags |= 64, z && (t.flags |= 8192), z = n.callbacks, z === null ? n.callbacks = [x] : z.push(x));
        } else
          z = {
            lane: x,
            tag: c.tag,
            payload: c.payload,
            callback: c.callback,
            next: null
          }, E === null ? (p = E = z, d = N) : E = E.next = z, i |= x;
        if (c = c.next, c === null) {
          if (c = n.shared.pending, c === null)
            break;
          z = c, c = z.next, z.next = null, n.lastBaseUpdate = z, n.shared.pending = null;
        }
      } while (!0);
      E === null && (d = N), n.baseState = d, n.firstBaseUpdate = p, n.lastBaseUpdate = E, u === null && (n.shared.lanes = 0), De |= i, t.lanes = i, t.memoizedState = N;
    }
  }
  function Po(t, l) {
    if (typeof t != "function")
      throw Error(s(191, t));
    t.call(l);
  }
  function ts(t, l) {
    var e = t.callbacks;
    if (e !== null)
      for (t.callbacks = null, t = 0; t < e.length; t++)
        Po(e[t], l);
  }
  var qa = r(null), zu = r(0);
  function ls(t, l) {
    t = se, j(zu, t), j(qa, l), se = t | l.baseLanes;
  }
  function fc() {
    j(zu, se), j(qa, qa.current);
  }
  function oc() {
    se = zu.current, M(qa), M(zu);
  }
  var Ml = r(null), Yl = null;
  function Te(t) {
    var l = t.alternate;
    j(Qt, Qt.current & 1), j(Ml, t), Yl === null && (l === null || qa.current !== null || l.memoizedState !== null) && (Yl = t);
  }
  function sc(t) {
    j(Qt, Qt.current), j(Ml, t), Yl === null && (Yl = t);
  }
  function es(t) {
    t.tag === 22 ? (j(Qt, Qt.current), j(Ml, t), Yl === null && (Yl = t)) : Me();
  }
  function Me() {
    j(Qt, Qt.current), j(Ml, Ml.current);
  }
  function _l(t) {
    M(Ml), Yl === t && (Yl = null), M(Qt);
  }
  var Qt = r(0);
  function Eu(t) {
    for (var l = t; l !== null; ) {
      if (l.tag === 13) {
        var e = l.memoizedState;
        if (e !== null && (e = e.dehydrated, e === null || gf(e) || pf(e)))
          return l;
      } else if (l.tag === 19 && (l.memoizedProps.revealOrder === "forwards" || l.memoizedProps.revealOrder === "backwards" || l.memoizedProps.revealOrder === "unstable_legacy-backwards" || l.memoizedProps.revealOrder === "together")) {
        if ((l.flags & 128) !== 0) return l;
      } else if (l.child !== null) {
        l.child.return = l, l = l.child;
        continue;
      }
      if (l === t) break;
      for (; l.sibling === null; ) {
        if (l.return === null || l.return === t) return null;
        l = l.return;
      }
      l.sibling.return = l.return, l = l.sibling;
    }
    return null;
  }
  var ee = 0, ct = null, Dt = null, Jt = null, Tu = !1, wa = !1, ua = !1, Mu = 0, Dn = 0, Xa = null, hh = 0;
  function Xt() {
    throw Error(s(321));
  }
  function rc(t, l) {
    if (l === null) return !1;
    for (var e = 0; e < l.length && e < t.length; e++)
      if (!El(t[e], l[e])) return !1;
    return !0;
  }
  function dc(t, l, e, a, n, u) {
    return ee = u, ct = l, l.memoizedState = null, l.updateQueue = null, l.lanes = 0, y.H = t === null || t.memoizedState === null ? ws : Ac, ua = !1, u = e(a, n), ua = !1, wa && (u = ns(
      l,
      e,
      a,
      n
    )), as(t), u;
  }
  function as(t) {
    y.H = jn;
    var l = Dt !== null && Dt.next !== null;
    if (ee = 0, Jt = Dt = ct = null, Tu = !1, Dn = 0, Xa = null, l) throw Error(s(300));
    t === null || $t || (t = t.dependencies, t !== null && yu(t) && ($t = !0));
  }
  function ns(t, l, e, a) {
    ct = t;
    var n = 0;
    do {
      if (wa && (Xa = null), Dn = 0, wa = !1, 25 <= n) throw Error(s(301));
      if (n += 1, Jt = Dt = null, t.updateQueue != null) {
        var u = t.updateQueue;
        u.lastEffect = null, u.events = null, u.stores = null, u.memoCache != null && (u.memoCache.index = 0);
      }
      y.H = Xs, u = l(e, a);
    } while (wa);
    return u;
  }
  function yh() {
    var t = y.H, l = t.useState()[0];
    return l = typeof l.then == "function" ? Nn(l) : l, t = t.useState()[0], (Dt !== null ? Dt.memoizedState : null) !== t && (ct.flags |= 1024), l;
  }
  function mc() {
    var t = Mu !== 0;
    return Mu = 0, t;
  }
  function hc(t, l, e) {
    l.updateQueue = t.updateQueue, l.flags &= -2053, t.lanes &= ~e;
  }
  function yc(t) {
    if (Tu) {
      for (t = t.memoizedState; t !== null; ) {
        var l = t.queue;
        l !== null && (l.pending = null), t = t.next;
      }
      Tu = !1;
    }
    ee = 0, Jt = Dt = ct = null, wa = !1, Dn = Mu = 0, Xa = null;
  }
  function ol() {
    var t = {
      memoizedState: null,
      baseState: null,
      baseQueue: null,
      queue: null,
      next: null
    };
    return Jt === null ? ct.memoizedState = Jt = t : Jt = Jt.next = t, Jt;
  }
  function Zt() {
    if (Dt === null) {
      var t = ct.alternate;
      t = t !== null ? t.memoizedState : null;
    } else t = Dt.next;
    var l = Jt === null ? ct.memoizedState : Jt.next;
    if (l !== null)
      Jt = l, Dt = t;
    else {
      if (t === null)
        throw ct.alternate === null ? Error(s(467)) : Error(s(310));
      Dt = t, t = {
        memoizedState: Dt.memoizedState,
        baseState: Dt.baseState,
        baseQueue: Dt.baseQueue,
        queue: Dt.queue,
        next: null
      }, Jt === null ? ct.memoizedState = Jt = t : Jt = Jt.next = t;
    }
    return Jt;
  }
  function _u() {
    return { lastEffect: null, events: null, stores: null, memoCache: null };
  }
  function Nn(t) {
    var l = Dn;
    return Dn += 1, Xa === null && (Xa = []), t = Jo(Xa, t, l), l = ct, (Jt === null ? l.memoizedState : Jt.next) === null && (l = l.alternate, y.H = l === null || l.memoizedState === null ? ws : Ac), t;
  }
  function Au(t) {
    if (t !== null && typeof t == "object") {
      if (typeof t.then == "function") return Nn(t);
      if (t.$$typeof === et) return ul(t);
    }
    throw Error(s(438, String(t)));
  }
  function vc(t) {
    var l = null, e = ct.updateQueue;
    if (e !== null && (l = e.memoCache), l == null) {
      var a = ct.alternate;
      a !== null && (a = a.updateQueue, a !== null && (a = a.memoCache, a != null && (l = {
        data: a.data.map(function(n) {
          return n.slice();
        }),
        index: 0
      })));
    }
    if (l == null && (l = { data: [], index: 0 }), e === null && (e = _u(), ct.updateQueue = e), e.memoCache = l, e = l.data[l.index], e === void 0)
      for (e = l.data[l.index] = Array(t), a = 0; a < t; a++)
        e[a] = qt;
    return l.index++, e;
  }
  function ae(t, l) {
    return typeof l == "function" ? l(t) : l;
  }
  function Du(t) {
    var l = Zt();
    return gc(l, Dt, t);
  }
  function gc(t, l, e) {
    var a = t.queue;
    if (a === null) throw Error(s(311));
    a.lastRenderedReducer = e;
    var n = t.baseQueue, u = a.pending;
    if (u !== null) {
      if (n !== null) {
        var i = n.next;
        n.next = u.next, u.next = i;
      }
      l.baseQueue = n = u, a.pending = null;
    }
    if (u = t.baseState, n === null) t.memoizedState = u;
    else {
      l = n.next;
      var c = i = null, d = null, p = l, E = !1;
      do {
        var N = p.lane & -536870913;
        if (N !== p.lane ? (ht & N) === N : (ee & N) === N) {
          var x = p.revertLane;
          if (x === 0)
            d !== null && (d = d.next = {
              lane: 0,
              revertLane: 0,
              gesture: null,
              action: p.action,
              hasEagerState: p.hasEagerState,
              eagerState: p.eagerState,
              next: null
            }), N === Ra && (E = !0);
          else if ((ee & x) === x) {
            p = p.next, x === Ra && (E = !0);
            continue;
          } else
            N = {
              lane: 0,
              revertLane: p.revertLane,
              gesture: null,
              action: p.action,
              hasEagerState: p.hasEagerState,
              eagerState: p.eagerState,
              next: null
            }, d === null ? (c = d = N, i = u) : d = d.next = N, ct.lanes |= x, De |= x;
          N = p.action, ua && e(u, N), u = p.hasEagerState ? p.eagerState : e(u, N);
        } else
          x = {
            lane: N,
            revertLane: p.revertLane,
            gesture: p.gesture,
            action: p.action,
            hasEagerState: p.hasEagerState,
            eagerState: p.eagerState,
            next: null
          }, d === null ? (c = d = x, i = u) : d = d.next = x, ct.lanes |= N, De |= N;
        p = p.next;
      } while (p !== null && p !== l);
      if (d === null ? i = u : d.next = c, !El(u, t.memoizedState) && ($t = !0, E && (e = Ha, e !== null)))
        throw e;
      t.memoizedState = u, t.baseState = i, t.baseQueue = d, a.lastRenderedState = u;
    }
    return n === null && (a.lanes = 0), [t.memoizedState, a.dispatch];
  }
  function pc(t) {
    var l = Zt(), e = l.queue;
    if (e === null) throw Error(s(311));
    e.lastRenderedReducer = t;
    var a = e.dispatch, n = e.pending, u = l.memoizedState;
    if (n !== null) {
      e.pending = null;
      var i = n = n.next;
      do
        u = t(u, i.action), i = i.next;
      while (i !== n);
      El(u, l.memoizedState) || ($t = !0), l.memoizedState = u, l.baseQueue === null && (l.baseState = u), e.lastRenderedState = u;
    }
    return [u, a];
  }
  function us(t, l, e) {
    var a = ct, n = Zt(), u = vt;
    if (u) {
      if (e === void 0) throw Error(s(407));
      e = e();
    } else e = l();
    var i = !El(
      (Dt || n).memoizedState,
      e
    );
    if (i && (n.memoizedState = e, $t = !0), n = n.queue, Sc(fs.bind(null, a, n, t), [
      t
    ]), n.getSnapshot !== l || i || Jt !== null && Jt.memoizedState.tag & 1) {
      if (a.flags |= 2048, Ga(
        9,
        { destroy: void 0 },
        cs.bind(
          null,
          a,
          n,
          e,
          l
        ),
        null
      ), jt === null) throw Error(s(349));
      u || (ee & 127) !== 0 || is(a, l, e);
    }
    return e;
  }
  function is(t, l, e) {
    t.flags |= 16384, t = { getSnapshot: l, value: e }, l = ct.updateQueue, l === null ? (l = _u(), ct.updateQueue = l, l.stores = [t]) : (e = l.stores, e === null ? l.stores = [t] : e.push(t));
  }
  function cs(t, l, e, a) {
    l.value = e, l.getSnapshot = a, os(l) && ss(t);
  }
  function fs(t, l, e) {
    return e(function() {
      os(l) && ss(t);
    });
  }
  function os(t) {
    var l = t.getSnapshot;
    t = t.value;
    try {
      var e = l();
      return !El(t, e);
    } catch {
      return !0;
    }
  }
  function ss(t) {
    var l = We(t, 2);
    l !== null && bl(l, t, 2);
  }
  function bc(t) {
    var l = ol();
    if (typeof t == "function") {
      var e = t;
      if (t = e(), ua) {
        Kt(!0);
        try {
          e();
        } finally {
          Kt(!1);
        }
      }
    }
    return l.memoizedState = l.baseState = t, l.queue = {
      pending: null,
      lanes: 0,
      dispatch: null,
      lastRenderedReducer: ae,
      lastRenderedState: t
    }, l;
  }
  function rs(t, l, e, a) {
    return t.baseState = e, gc(
      t,
      Dt,
      typeof a == "function" ? a : ae
    );
  }
  function vh(t, l, e, a, n) {
    if (ju(t)) throw Error(s(485));
    if (t = l.action, t !== null) {
      var u = {
        payload: n,
        action: t,
        next: null,
        isTransition: !0,
        status: "pending",
        value: null,
        reason: null,
        listeners: [],
        then: function(i) {
          u.listeners.push(i);
        }
      };
      y.T !== null ? e(!0) : u.isTransition = !1, a(u), e = l.pending, e === null ? (u.next = l.pending = u, ds(l, u)) : (u.next = e.next, l.pending = e.next = u);
    }
  }
  function ds(t, l) {
    var e = l.action, a = l.payload, n = t.state;
    if (l.isTransition) {
      var u = y.T, i = {};
      y.T = i;
      try {
        var c = e(n, a), d = y.S;
        d !== null && d(i, c), ms(t, l, c);
      } catch (p) {
        xc(t, l, p);
      } finally {
        u !== null && i.types !== null && (u.types = i.types), y.T = u;
      }
    } else
      try {
        u = e(n, a), ms(t, l, u);
      } catch (p) {
        xc(t, l, p);
      }
  }
  function ms(t, l, e) {
    e !== null && typeof e == "object" && typeof e.then == "function" ? e.then(
      function(a) {
        hs(t, l, a);
      },
      function(a) {
        return xc(t, l, a);
      }
    ) : hs(t, l, e);
  }
  function hs(t, l, e) {
    l.status = "fulfilled", l.value = e, ys(l), t.state = e, l = t.pending, l !== null && (e = l.next, e === l ? t.pending = null : (e = e.next, l.next = e, ds(t, e)));
  }
  function xc(t, l, e) {
    var a = t.pending;
    if (t.pending = null, a !== null) {
      a = a.next;
      do
        l.status = "rejected", l.reason = e, ys(l), l = l.next;
      while (l !== a);
    }
    t.action = null;
  }
  function ys(t) {
    t = t.listeners;
    for (var l = 0; l < t.length; l++) (0, t[l])();
  }
  function vs(t, l) {
    return l;
  }
  function gs(t, l) {
    if (vt) {
      var e = jt.formState;
      if (e !== null) {
        t: {
          var a = ct;
          if (vt) {
            if (Ut) {
              l: {
                for (var n = Ut, u = Bl; n.nodeType !== 8; ) {
                  if (!u) {
                    n = null;
                    break l;
                  }
                  if (n = ql(
                    n.nextSibling
                  ), n === null) {
                    n = null;
                    break l;
                  }
                }
                u = n.data, n = u === "F!" || u === "F" ? n : null;
              }
              if (n) {
                Ut = ql(
                  n.nextSibling
                ), a = n.data === "F!";
                break t;
              }
            }
            be(a);
          }
          a = !1;
        }
        a && (l = e[0]);
      }
    }
    return e = ol(), e.memoizedState = e.baseState = l, a = {
      pending: null,
      lanes: 0,
      dispatch: null,
      lastRenderedReducer: vs,
      lastRenderedState: l
    }, e.queue = a, e = Bs.bind(
      null,
      ct,
      a
    ), a.dispatch = e, a = bc(!1), u = _c.bind(
      null,
      ct,
      !1,
      a.queue
    ), a = ol(), n = {
      state: l,
      dispatch: null,
      action: t,
      pending: null
    }, a.queue = n, e = vh.bind(
      null,
      ct,
      n,
      u,
      e
    ), n.dispatch = e, a.memoizedState = t, [l, e, !1];
  }
  function ps(t) {
    var l = Zt();
    return bs(l, Dt, t);
  }
  function bs(t, l, e) {
    if (l = gc(
      t,
      l,
      vs
    )[0], t = Du(ae)[0], typeof l == "object" && l !== null && typeof l.then == "function")
      try {
        var a = Nn(l);
      } catch (i) {
        throw i === Ba ? pu : i;
      }
    else a = l;
    l = Zt();
    var n = l.queue, u = n.dispatch;
    return e !== l.memoizedState && (ct.flags |= 2048, Ga(
      9,
      { destroy: void 0 },
      gh.bind(null, n, e),
      null
    )), [a, u, t];
  }
  function gh(t, l) {
    t.action = l;
  }
  function xs(t) {
    var l = Zt(), e = Dt;
    if (e !== null)
      return bs(l, e, t);
    Zt(), l = l.memoizedState, e = Zt();
    var a = e.queue.dispatch;
    return e.memoizedState = t, [l, a, !1];
  }
  function Ga(t, l, e, a) {
    return t = { tag: t, create: e, deps: a, inst: l, next: null }, l = ct.updateQueue, l === null && (l = _u(), ct.updateQueue = l), e = l.lastEffect, e === null ? l.lastEffect = t.next = t : (a = e.next, e.next = t, t.next = a, l.lastEffect = t), t;
  }
  function Ss() {
    return Zt().memoizedState;
  }
  function Nu(t, l, e, a) {
    var n = ol();
    ct.flags |= t, n.memoizedState = Ga(
      1 | l,
      { destroy: void 0 },
      e,
      a === void 0 ? null : a
    );
  }
  function Cu(t, l, e, a) {
    var n = Zt();
    a = a === void 0 ? null : a;
    var u = n.memoizedState.inst;
    Dt !== null && a !== null && rc(a, Dt.memoizedState.deps) ? n.memoizedState = Ga(l, u, e, a) : (ct.flags |= t, n.memoizedState = Ga(
      1 | l,
      u,
      e,
      a
    ));
  }
  function zs(t, l) {
    Nu(8390656, 8, t, l);
  }
  function Sc(t, l) {
    Cu(2048, 8, t, l);
  }
  function ph(t) {
    ct.flags |= 4;
    var l = ct.updateQueue;
    if (l === null)
      l = _u(), ct.updateQueue = l, l.events = [t];
    else {
      var e = l.events;
      e === null ? l.events = [t] : e.push(t);
    }
  }
  function Es(t) {
    var l = Zt().memoizedState;
    return ph({ ref: l, nextImpl: t }), function() {
      if ((Tt & 2) !== 0) throw Error(s(440));
      return l.impl.apply(void 0, arguments);
    };
  }
  function Ts(t, l) {
    return Cu(4, 2, t, l);
  }
  function Ms(t, l) {
    return Cu(4, 4, t, l);
  }
  function _s(t, l) {
    if (typeof l == "function") {
      t = t();
      var e = l(t);
      return function() {
        typeof e == "function" ? e() : l(null);
      };
    }
    if (l != null)
      return t = t(), l.current = t, function() {
        l.current = null;
      };
  }
  function As(t, l, e) {
    e = e != null ? e.concat([t]) : null, Cu(4, 4, _s.bind(null, l, t), e);
  }
  function zc() {
  }
  function Ds(t, l) {
    var e = Zt();
    l = l === void 0 ? null : l;
    var a = e.memoizedState;
    return l !== null && rc(l, a[1]) ? a[0] : (e.memoizedState = [t, l], t);
  }
  function Ns(t, l) {
    var e = Zt();
    l = l === void 0 ? null : l;
    var a = e.memoizedState;
    if (l !== null && rc(l, a[1]))
      return a[0];
    if (a = t(), ua) {
      Kt(!0);
      try {
        t();
      } finally {
        Kt(!1);
      }
    }
    return e.memoizedState = [a, l], a;
  }
  function Ec(t, l, e) {
    return e === void 0 || (ee & 1073741824) !== 0 && (ht & 261930) === 0 ? t.memoizedState = l : (t.memoizedState = e, t = Cr(), ct.lanes |= t, De |= t, e);
  }
  function Cs(t, l, e, a) {
    return El(e, l) ? e : qa.current !== null ? (t = Ec(t, e, a), El(t, l) || ($t = !0), t) : (ee & 42) === 0 || (ee & 1073741824) !== 0 && (ht & 261930) === 0 ? ($t = !0, t.memoizedState = e) : (t = Cr(), ct.lanes |= t, De |= t, l);
  }
  function js(t, l, e, a, n) {
    var u = C.p;
    C.p = u !== 0 && 8 > u ? u : 8;
    var i = y.T, c = {};
    y.T = c, _c(t, !1, l, e);
    try {
      var d = n(), p = y.S;
      if (p !== null && p(c, d), d !== null && typeof d == "object" && typeof d.then == "function") {
        var E = mh(
          d,
          a
        );
        Cn(
          t,
          l,
          E,
          Nl(t)
        );
      } else
        Cn(
          t,
          l,
          a,
          Nl(t)
        );
    } catch (N) {
      Cn(
        t,
        l,
        { then: function() {
        }, status: "rejected", reason: N },
        Nl()
      );
    } finally {
      C.p = u, i !== null && c.types !== null && (i.types = c.types), y.T = i;
    }
  }
  function bh() {
  }
  function Tc(t, l, e, a) {
    if (t.tag !== 5) throw Error(s(476));
    var n = Os(t).queue;
    js(
      t,
      n,
      l,
      G,
      e === null ? bh : function() {
        return Us(t), e(a);
      }
    );
  }
  function Os(t) {
    var l = t.memoizedState;
    if (l !== null) return l;
    l = {
      memoizedState: G,
      baseState: G,
      baseQueue: null,
      queue: {
        pending: null,
        lanes: 0,
        dispatch: null,
        lastRenderedReducer: ae,
        lastRenderedState: G
      },
      next: null
    };
    var e = {};
    return l.next = {
      memoizedState: e,
      baseState: e,
      baseQueue: null,
      queue: {
        pending: null,
        lanes: 0,
        dispatch: null,
        lastRenderedReducer: ae,
        lastRenderedState: e
      },
      next: null
    }, t.memoizedState = l, t = t.alternate, t !== null && (t.memoizedState = l), l;
  }
  function Us(t) {
    var l = Os(t);
    l.next === null && (l = t.alternate.memoizedState), Cn(
      t,
      l.next.queue,
      {},
      Nl()
    );
  }
  function Mc() {
    return ul(kn);
  }
  function Rs() {
    return Zt().memoizedState;
  }
  function Hs() {
    return Zt().memoizedState;
  }
  function xh(t) {
    for (var l = t.return; l !== null; ) {
      switch (l.tag) {
        case 24:
        case 3:
          var e = Nl();
          t = ze(e);
          var a = Ee(l, t, e);
          a !== null && (bl(a, l, e), Mn(a, l, e)), l = { cache: tc() }, t.payload = l;
          return;
      }
      l = l.return;
    }
  }
  function Sh(t, l, e) {
    var a = Nl();
    e = {
      lane: a,
      revertLane: 0,
      gesture: null,
      action: e,
      hasEagerState: !1,
      eagerState: null,
      next: null
    }, ju(t) ? Ys(l, e) : (e = Qi(t, l, e, a), e !== null && (bl(e, t, a), qs(e, l, a)));
  }
  function Bs(t, l, e) {
    var a = Nl();
    Cn(t, l, e, a);
  }
  function Cn(t, l, e, a) {
    var n = {
      lane: a,
      revertLane: 0,
      gesture: null,
      action: e,
      hasEagerState: !1,
      eagerState: null,
      next: null
    };
    if (ju(t)) Ys(l, n);
    else {
      var u = t.alternate;
      if (t.lanes === 0 && (u === null || u.lanes === 0) && (u = l.lastRenderedReducer, u !== null))
        try {
          var i = l.lastRenderedState, c = u(i, e);
          if (n.hasEagerState = !0, n.eagerState = c, El(c, i))
            return ru(t, l, n, 0), jt === null && su(), !1;
        } catch {
        }
      if (e = Qi(t, l, n, a), e !== null)
        return bl(e, t, a), qs(e, l, a), !0;
    }
    return !1;
  }
  function _c(t, l, e, a) {
    if (a = {
      lane: 2,
      revertLane: nf(),
      gesture: null,
      action: a,
      hasEagerState: !1,
      eagerState: null,
      next: null
    }, ju(t)) {
      if (l) throw Error(s(479));
    } else
      l = Qi(
        t,
        e,
        a,
        2
      ), l !== null && bl(l, t, 2);
  }
  function ju(t) {
    var l = t.alternate;
    return t === ct || l !== null && l === ct;
  }
  function Ys(t, l) {
    wa = Tu = !0;
    var e = t.pending;
    e === null ? l.next = l : (l.next = e.next, e.next = l), t.pending = l;
  }
  function qs(t, l, e) {
    if ((e & 4194048) !== 0) {
      var a = l.lanes;
      a &= t.pendingLanes, e |= a, l.lanes = e, Lf(t, e);
    }
  }
  var jn = {
    readContext: ul,
    use: Au,
    useCallback: Xt,
    useContext: Xt,
    useEffect: Xt,
    useImperativeHandle: Xt,
    useLayoutEffect: Xt,
    useInsertionEffect: Xt,
    useMemo: Xt,
    useReducer: Xt,
    useRef: Xt,
    useState: Xt,
    useDebugValue: Xt,
    useDeferredValue: Xt,
    useTransition: Xt,
    useSyncExternalStore: Xt,
    useId: Xt,
    useHostTransitionStatus: Xt,
    useFormState: Xt,
    useActionState: Xt,
    useOptimistic: Xt,
    useMemoCache: Xt,
    useCacheRefresh: Xt
  };
  jn.useEffectEvent = Xt;
  var ws = {
    readContext: ul,
    use: Au,
    useCallback: function(t, l) {
      return ol().memoizedState = [
        t,
        l === void 0 ? null : l
      ], t;
    },
    useContext: ul,
    useEffect: zs,
    useImperativeHandle: function(t, l, e) {
      e = e != null ? e.concat([t]) : null, Nu(
        4194308,
        4,
        _s.bind(null, l, t),
        e
      );
    },
    useLayoutEffect: function(t, l) {
      return Nu(4194308, 4, t, l);
    },
    useInsertionEffect: function(t, l) {
      Nu(4, 2, t, l);
    },
    useMemo: function(t, l) {
      var e = ol();
      l = l === void 0 ? null : l;
      var a = t();
      if (ua) {
        Kt(!0);
        try {
          t();
        } finally {
          Kt(!1);
        }
      }
      return e.memoizedState = [a, l], a;
    },
    useReducer: function(t, l, e) {
      var a = ol();
      if (e !== void 0) {
        var n = e(l);
        if (ua) {
          Kt(!0);
          try {
            e(l);
          } finally {
            Kt(!1);
          }
        }
      } else n = l;
      return a.memoizedState = a.baseState = n, t = {
        pending: null,
        lanes: 0,
        dispatch: null,
        lastRenderedReducer: t,
        lastRenderedState: n
      }, a.queue = t, t = t.dispatch = Sh.bind(
        null,
        ct,
        t
      ), [a.memoizedState, t];
    },
    useRef: function(t) {
      var l = ol();
      return t = { current: t }, l.memoizedState = t;
    },
    useState: function(t) {
      t = bc(t);
      var l = t.queue, e = Bs.bind(null, ct, l);
      return l.dispatch = e, [t.memoizedState, e];
    },
    useDebugValue: zc,
    useDeferredValue: function(t, l) {
      var e = ol();
      return Ec(e, t, l);
    },
    useTransition: function() {
      var t = bc(!1);
      return t = js.bind(
        null,
        ct,
        t.queue,
        !0,
        !1
      ), ol().memoizedState = t, [!1, t];
    },
    useSyncExternalStore: function(t, l, e) {
      var a = ct, n = ol();
      if (vt) {
        if (e === void 0)
          throw Error(s(407));
        e = e();
      } else {
        if (e = l(), jt === null)
          throw Error(s(349));
        (ht & 127) !== 0 || is(a, l, e);
      }
      n.memoizedState = e;
      var u = { value: e, getSnapshot: l };
      return n.queue = u, zs(fs.bind(null, a, u, t), [
        t
      ]), a.flags |= 2048, Ga(
        9,
        { destroy: void 0 },
        cs.bind(
          null,
          a,
          u,
          e,
          l
        ),
        null
      ), e;
    },
    useId: function() {
      var t = ol(), l = jt.identifierPrefix;
      if (vt) {
        var e = Vl, a = Zl;
        e = (a & ~(1 << 32 - el(a) - 1)).toString(32) + e, l = "_" + l + "R_" + e, e = Mu++, 0 < e && (l += "H" + e.toString(32)), l += "_";
      } else
        e = hh++, l = "_" + l + "r_" + e.toString(32) + "_";
      return t.memoizedState = l;
    },
    useHostTransitionStatus: Mc,
    useFormState: gs,
    useActionState: gs,
    useOptimistic: function(t) {
      var l = ol();
      l.memoizedState = l.baseState = t;
      var e = {
        pending: null,
        lanes: 0,
        dispatch: null,
        lastRenderedReducer: null,
        lastRenderedState: null
      };
      return l.queue = e, l = _c.bind(
        null,
        ct,
        !0,
        e
      ), e.dispatch = l, [t, l];
    },
    useMemoCache: vc,
    useCacheRefresh: function() {
      return ol().memoizedState = xh.bind(
        null,
        ct
      );
    },
    useEffectEvent: function(t) {
      var l = ol(), e = { impl: t };
      return l.memoizedState = e, function() {
        if ((Tt & 2) !== 0)
          throw Error(s(440));
        return e.impl.apply(void 0, arguments);
      };
    }
  }, Ac = {
    readContext: ul,
    use: Au,
    useCallback: Ds,
    useContext: ul,
    useEffect: Sc,
    useImperativeHandle: As,
    useInsertionEffect: Ts,
    useLayoutEffect: Ms,
    useMemo: Ns,
    useReducer: Du,
    useRef: Ss,
    useState: function() {
      return Du(ae);
    },
    useDebugValue: zc,
    useDeferredValue: function(t, l) {
      var e = Zt();
      return Cs(
        e,
        Dt.memoizedState,
        t,
        l
      );
    },
    useTransition: function() {
      var t = Du(ae)[0], l = Zt().memoizedState;
      return [
        typeof t == "boolean" ? t : Nn(t),
        l
      ];
    },
    useSyncExternalStore: us,
    useId: Rs,
    useHostTransitionStatus: Mc,
    useFormState: ps,
    useActionState: ps,
    useOptimistic: function(t, l) {
      var e = Zt();
      return rs(e, Dt, t, l);
    },
    useMemoCache: vc,
    useCacheRefresh: Hs
  };
  Ac.useEffectEvent = Es;
  var Xs = {
    readContext: ul,
    use: Au,
    useCallback: Ds,
    useContext: ul,
    useEffect: Sc,
    useImperativeHandle: As,
    useInsertionEffect: Ts,
    useLayoutEffect: Ms,
    useMemo: Ns,
    useReducer: pc,
    useRef: Ss,
    useState: function() {
      return pc(ae);
    },
    useDebugValue: zc,
    useDeferredValue: function(t, l) {
      var e = Zt();
      return Dt === null ? Ec(e, t, l) : Cs(
        e,
        Dt.memoizedState,
        t,
        l
      );
    },
    useTransition: function() {
      var t = pc(ae)[0], l = Zt().memoizedState;
      return [
        typeof t == "boolean" ? t : Nn(t),
        l
      ];
    },
    useSyncExternalStore: us,
    useId: Rs,
    useHostTransitionStatus: Mc,
    useFormState: xs,
    useActionState: xs,
    useOptimistic: function(t, l) {
      var e = Zt();
      return Dt !== null ? rs(e, Dt, t, l) : (e.baseState = t, [t, e.queue.dispatch]);
    },
    useMemoCache: vc,
    useCacheRefresh: Hs
  };
  Xs.useEffectEvent = Es;
  function Dc(t, l, e, a) {
    l = t.memoizedState, e = e(a, l), e = e == null ? l : U({}, l, e), t.memoizedState = e, t.lanes === 0 && (t.updateQueue.baseState = e);
  }
  var Nc = {
    enqueueSetState: function(t, l, e) {
      t = t._reactInternals;
      var a = Nl(), n = ze(a);
      n.payload = l, e != null && (n.callback = e), l = Ee(t, n, a), l !== null && (bl(l, t, a), Mn(l, t, a));
    },
    enqueueReplaceState: function(t, l, e) {
      t = t._reactInternals;
      var a = Nl(), n = ze(a);
      n.tag = 1, n.payload = l, e != null && (n.callback = e), l = Ee(t, n, a), l !== null && (bl(l, t, a), Mn(l, t, a));
    },
    enqueueForceUpdate: function(t, l) {
      t = t._reactInternals;
      var e = Nl(), a = ze(e);
      a.tag = 2, l != null && (a.callback = l), l = Ee(t, a, e), l !== null && (bl(l, t, e), Mn(l, t, e));
    }
  };
  function Gs(t, l, e, a, n, u, i) {
    return t = t.stateNode, typeof t.shouldComponentUpdate == "function" ? t.shouldComponentUpdate(a, u, i) : l.prototype && l.prototype.isPureReactComponent ? !gn(e, a) || !gn(n, u) : !0;
  }
  function Ls(t, l, e, a) {
    t = l.state, typeof l.componentWillReceiveProps == "function" && l.componentWillReceiveProps(e, a), typeof l.UNSAFE_componentWillReceiveProps == "function" && l.UNSAFE_componentWillReceiveProps(e, a), l.state !== t && Nc.enqueueReplaceState(l, l.state, null);
  }
  function ia(t, l) {
    var e = l;
    if ("ref" in l) {
      e = {};
      for (var a in l)
        a !== "ref" && (e[a] = l[a]);
    }
    if (t = t.defaultProps) {
      e === l && (e = U({}, e));
      for (var n in t)
        e[n] === void 0 && (e[n] = t[n]);
    }
    return e;
  }
  function Qs(t) {
    ou(t);
  }
  function Zs(t) {
    console.error(t);
  }
  function Vs(t) {
    ou(t);
  }
  function Ou(t, l) {
    try {
      var e = t.onUncaughtError;
      e(l.value, { componentStack: l.stack });
    } catch (a) {
      setTimeout(function() {
        throw a;
      });
    }
  }
  function Ks(t, l, e) {
    try {
      var a = t.onCaughtError;
      a(e.value, {
        componentStack: e.stack,
        errorBoundary: l.tag === 1 ? l.stateNode : null
      });
    } catch (n) {
      setTimeout(function() {
        throw n;
      });
    }
  }
  function Cc(t, l, e) {
    return e = ze(e), e.tag = 3, e.payload = { element: null }, e.callback = function() {
      Ou(t, l);
    }, e;
  }
  function ks(t) {
    return t = ze(t), t.tag = 3, t;
  }
  function Js(t, l, e, a) {
    var n = e.type.getDerivedStateFromError;
    if (typeof n == "function") {
      var u = a.value;
      t.payload = function() {
        return n(u);
      }, t.callback = function() {
        Ks(l, e, a);
      };
    }
    var i = e.stateNode;
    i !== null && typeof i.componentDidCatch == "function" && (t.callback = function() {
      Ks(l, e, a), typeof n != "function" && (Ne === null ? Ne = /* @__PURE__ */ new Set([this]) : Ne.add(this));
      var c = a.stack;
      this.componentDidCatch(a.value, {
        componentStack: c !== null ? c : ""
      });
    });
  }
  function zh(t, l, e, a, n) {
    if (e.flags |= 32768, a !== null && typeof a == "object" && typeof a.then == "function") {
      if (l = e.alternate, l !== null && Ua(
        l,
        e,
        n,
        !0
      ), e = Ml.current, e !== null) {
        switch (e.tag) {
          case 31:
          case 13:
            return Yl === null ? Zu() : e.alternate === null && Gt === 0 && (Gt = 3), e.flags &= -257, e.flags |= 65536, e.lanes = n, a === bu ? e.flags |= 16384 : (l = e.updateQueue, l === null ? e.updateQueue = /* @__PURE__ */ new Set([a]) : l.add(a), lf(t, a, n)), !1;
          case 22:
            return e.flags |= 65536, a === bu ? e.flags |= 16384 : (l = e.updateQueue, l === null ? (l = {
              transitions: null,
              markerInstances: null,
              retryQueue: /* @__PURE__ */ new Set([a])
            }, e.updateQueue = l) : (e = l.retryQueue, e === null ? l.retryQueue = /* @__PURE__ */ new Set([a]) : e.add(a)), lf(t, a, n)), !1;
        }
        throw Error(s(435, e.tag));
      }
      return lf(t, a, n), Zu(), !1;
    }
    if (vt)
      return l = Ml.current, l !== null ? ((l.flags & 65536) === 0 && (l.flags |= 256), l.flags |= 65536, l.lanes = n, a !== $i && (t = Error(s(422), { cause: a }), xn(Ul(t, e)))) : (a !== $i && (l = Error(s(423), {
        cause: a
      }), xn(
        Ul(l, e)
      )), t = t.current.alternate, t.flags |= 65536, n &= -n, t.lanes |= n, a = Ul(a, e), n = Cc(
        t.stateNode,
        a,
        n
      ), ic(t, n), Gt !== 4 && (Gt = 2)), !1;
    var u = Error(s(520), { cause: a });
    if (u = Ul(u, e), wn === null ? wn = [u] : wn.push(u), Gt !== 4 && (Gt = 2), l === null) return !0;
    a = Ul(a, e), e = l;
    do {
      switch (e.tag) {
        case 3:
          return e.flags |= 65536, t = n & -n, e.lanes |= t, t = Cc(e.stateNode, a, t), ic(e, t), !1;
        case 1:
          if (l = e.type, u = e.stateNode, (e.flags & 128) === 0 && (typeof l.getDerivedStateFromError == "function" || u !== null && typeof u.componentDidCatch == "function" && (Ne === null || !Ne.has(u))))
            return e.flags |= 65536, n &= -n, e.lanes |= n, n = ks(n), Js(
              n,
              t,
              e,
              a
            ), ic(e, n), !1;
      }
      e = e.return;
    } while (e !== null);
    return !1;
  }
  var jc = Error(s(461)), $t = !1;
  function il(t, l, e, a) {
    l.child = t === null ? Io(l, null, e, a) : na(
      l,
      t.child,
      e,
      a
    );
  }
  function $s(t, l, e, a, n) {
    e = e.render;
    var u = l.ref;
    if ("ref" in a) {
      var i = {};
      for (var c in a)
        c !== "ref" && (i[c] = a[c]);
    } else i = a;
    return ta(l), a = dc(
      t,
      l,
      e,
      i,
      u,
      n
    ), c = mc(), t !== null && !$t ? (hc(t, l, n), ne(t, l, n)) : (vt && c && ki(l), l.flags |= 1, il(t, l, a, n), l.child);
  }
  function Ws(t, l, e, a, n) {
    if (t === null) {
      var u = e.type;
      return typeof u == "function" && !Zi(u) && u.defaultProps === void 0 && e.compare === null ? (l.tag = 15, l.type = u, Fs(
        t,
        l,
        u,
        a,
        n
      )) : (t = mu(
        e.type,
        null,
        a,
        l,
        l.mode,
        n
      ), t.ref = l.ref, t.return = l, l.child = t);
    }
    if (u = t.child, !wc(t, n)) {
      var i = u.memoizedProps;
      if (e = e.compare, e = e !== null ? e : gn, e(i, a) && t.ref === l.ref)
        return ne(t, l, n);
    }
    return l.flags |= 1, t = Il(u, a), t.ref = l.ref, t.return = l, l.child = t;
  }
  function Fs(t, l, e, a, n) {
    if (t !== null) {
      var u = t.memoizedProps;
      if (gn(u, a) && t.ref === l.ref)
        if ($t = !1, l.pendingProps = a = u, wc(t, n))
          (t.flags & 131072) !== 0 && ($t = !0);
        else
          return l.lanes = t.lanes, ne(t, l, n);
    }
    return Oc(
      t,
      l,
      e,
      a,
      n
    );
  }
  function Is(t, l, e, a) {
    var n = a.children, u = t !== null ? t.memoizedState : null;
    if (t === null && l.stateNode === null && (l.stateNode = {
      _visibility: 1,
      _pendingMarkers: null,
      _retryCache: null,
      _transitions: null
    }), a.mode === "hidden") {
      if ((l.flags & 128) !== 0) {
        if (u = u !== null ? u.baseLanes | e : e, t !== null) {
          for (a = l.child = t.child, n = 0; a !== null; )
            n = n | a.lanes | a.childLanes, a = a.sibling;
          a = n & ~u;
        } else a = 0, l.child = null;
        return Ps(
          t,
          l,
          u,
          e,
          a
        );
      }
      if ((e & 536870912) !== 0)
        l.memoizedState = { baseLanes: 0, cachePool: null }, t !== null && gu(
          l,
          u !== null ? u.cachePool : null
        ), u !== null ? ls(l, u) : fc(), es(l);
      else
        return a = l.lanes = 536870912, Ps(
          t,
          l,
          u !== null ? u.baseLanes | e : e,
          e,
          a
        );
    } else
      u !== null ? (gu(l, u.cachePool), ls(l, u), Me(), l.memoizedState = null) : (t !== null && gu(l, null), fc(), Me());
    return il(t, l, n, e), l.child;
  }
  function On(t, l) {
    return t !== null && t.tag === 22 || l.stateNode !== null || (l.stateNode = {
      _visibility: 1,
      _pendingMarkers: null,
      _retryCache: null,
      _transitions: null
    }), l.sibling;
  }
  function Ps(t, l, e, a, n) {
    var u = ec();
    return u = u === null ? null : { parent: kt._currentValue, pool: u }, l.memoizedState = {
      baseLanes: e,
      cachePool: u
    }, t !== null && gu(l, null), fc(), es(l), t !== null && Ua(t, l, a, !0), l.childLanes = n, null;
  }
  function Uu(t, l) {
    return l = Hu(
      { mode: l.mode, children: l.children },
      t.mode
    ), l.ref = t.ref, t.child = l, l.return = t, l;
  }
  function tr(t, l, e) {
    return na(l, t.child, null, e), t = Uu(l, l.pendingProps), t.flags |= 2, _l(l), l.memoizedState = null, t;
  }
  function Eh(t, l, e) {
    var a = l.pendingProps, n = (l.flags & 128) !== 0;
    if (l.flags &= -129, t === null) {
      if (vt) {
        if (a.mode === "hidden")
          return t = Uu(l, a), l.lanes = 536870912, On(null, t);
        if (sc(l), (t = Ut) ? (t = dd(
          t,
          Bl
        ), t = t !== null && t.data === "&" ? t : null, t !== null && (l.memoizedState = {
          dehydrated: t,
          treeContext: ge !== null ? { id: Zl, overflow: Vl } : null,
          retryLane: 536870912,
          hydrationErrors: null
        }, e = Yo(t), e.return = l, l.child = e, nl = l, Ut = null)) : t = null, t === null) throw be(l);
        return l.lanes = 536870912, null;
      }
      return Uu(l, a);
    }
    var u = t.memoizedState;
    if (u !== null) {
      var i = u.dehydrated;
      if (sc(l), n)
        if (l.flags & 256)
          l.flags &= -257, l = tr(
            t,
            l,
            e
          );
        else if (l.memoizedState !== null)
          l.child = t.child, l.flags |= 128, l = null;
        else throw Error(s(558));
      else if ($t || Ua(t, l, e, !1), n = (e & t.childLanes) !== 0, $t || n) {
        if (a = jt, a !== null && (i = Qf(a, e), i !== 0 && i !== u.retryLane))
          throw u.retryLane = i, We(t, i), bl(a, t, i), jc;
        Zu(), l = tr(
          t,
          l,
          e
        );
      } else
        t = u.treeContext, Ut = ql(i.nextSibling), nl = l, vt = !0, pe = null, Bl = !1, t !== null && Xo(l, t), l = Uu(l, a), l.flags |= 4096;
      return l;
    }
    return t = Il(t.child, {
      mode: a.mode,
      children: a.children
    }), t.ref = l.ref, l.child = t, t.return = l, t;
  }
  function Ru(t, l) {
    var e = l.ref;
    if (e === null)
      t !== null && t.ref !== null && (l.flags |= 4194816);
    else {
      if (typeof e != "function" && typeof e != "object")
        throw Error(s(284));
      (t === null || t.ref !== e) && (l.flags |= 4194816);
    }
  }
  function Oc(t, l, e, a, n) {
    return ta(l), e = dc(
      t,
      l,
      e,
      a,
      void 0,
      n
    ), a = mc(), t !== null && !$t ? (hc(t, l, n), ne(t, l, n)) : (vt && a && ki(l), l.flags |= 1, il(t, l, e, n), l.child);
  }
  function lr(t, l, e, a, n, u) {
    return ta(l), l.updateQueue = null, e = ns(
      l,
      a,
      e,
      n
    ), as(t), a = mc(), t !== null && !$t ? (hc(t, l, u), ne(t, l, u)) : (vt && a && ki(l), l.flags |= 1, il(t, l, e, u), l.child);
  }
  function er(t, l, e, a, n) {
    if (ta(l), l.stateNode === null) {
      var u = Na, i = e.contextType;
      typeof i == "object" && i !== null && (u = ul(i)), u = new e(a, u), l.memoizedState = u.state !== null && u.state !== void 0 ? u.state : null, u.updater = Nc, l.stateNode = u, u._reactInternals = l, u = l.stateNode, u.props = a, u.state = l.memoizedState, u.refs = {}, nc(l), i = e.contextType, u.context = typeof i == "object" && i !== null ? ul(i) : Na, u.state = l.memoizedState, i = e.getDerivedStateFromProps, typeof i == "function" && (Dc(
        l,
        e,
        i,
        a
      ), u.state = l.memoizedState), typeof e.getDerivedStateFromProps == "function" || typeof u.getSnapshotBeforeUpdate == "function" || typeof u.UNSAFE_componentWillMount != "function" && typeof u.componentWillMount != "function" || (i = u.state, typeof u.componentWillMount == "function" && u.componentWillMount(), typeof u.UNSAFE_componentWillMount == "function" && u.UNSAFE_componentWillMount(), i !== u.state && Nc.enqueueReplaceState(u, u.state, null), An(l, a, u, n), _n(), u.state = l.memoizedState), typeof u.componentDidMount == "function" && (l.flags |= 4194308), a = !0;
    } else if (t === null) {
      u = l.stateNode;
      var c = l.memoizedProps, d = ia(e, c);
      u.props = d;
      var p = u.context, E = e.contextType;
      i = Na, typeof E == "object" && E !== null && (i = ul(E));
      var N = e.getDerivedStateFromProps;
      E = typeof N == "function" || typeof u.getSnapshotBeforeUpdate == "function", c = l.pendingProps !== c, E || typeof u.UNSAFE_componentWillReceiveProps != "function" && typeof u.componentWillReceiveProps != "function" || (c || p !== i) && Ls(
        l,
        u,
        a,
        i
      ), Se = !1;
      var x = l.memoizedState;
      u.state = x, An(l, a, u, n), _n(), p = l.memoizedState, c || x !== p || Se ? (typeof N == "function" && (Dc(
        l,
        e,
        N,
        a
      ), p = l.memoizedState), (d = Se || Gs(
        l,
        e,
        d,
        a,
        x,
        p,
        i
      )) ? (E || typeof u.UNSAFE_componentWillMount != "function" && typeof u.componentWillMount != "function" || (typeof u.componentWillMount == "function" && u.componentWillMount(), typeof u.UNSAFE_componentWillMount == "function" && u.UNSAFE_componentWillMount()), typeof u.componentDidMount == "function" && (l.flags |= 4194308)) : (typeof u.componentDidMount == "function" && (l.flags |= 4194308), l.memoizedProps = a, l.memoizedState = p), u.props = a, u.state = p, u.context = i, a = d) : (typeof u.componentDidMount == "function" && (l.flags |= 4194308), a = !1);
    } else {
      u = l.stateNode, uc(t, l), i = l.memoizedProps, E = ia(e, i), u.props = E, N = l.pendingProps, x = u.context, p = e.contextType, d = Na, typeof p == "object" && p !== null && (d = ul(p)), c = e.getDerivedStateFromProps, (p = typeof c == "function" || typeof u.getSnapshotBeforeUpdate == "function") || typeof u.UNSAFE_componentWillReceiveProps != "function" && typeof u.componentWillReceiveProps != "function" || (i !== N || x !== d) && Ls(
        l,
        u,
        a,
        d
      ), Se = !1, x = l.memoizedState, u.state = x, An(l, a, u, n), _n();
      var z = l.memoizedState;
      i !== N || x !== z || Se || t !== null && t.dependencies !== null && yu(t.dependencies) ? (typeof c == "function" && (Dc(
        l,
        e,
        c,
        a
      ), z = l.memoizedState), (E = Se || Gs(
        l,
        e,
        E,
        a,
        x,
        z,
        d
      ) || t !== null && t.dependencies !== null && yu(t.dependencies)) ? (p || typeof u.UNSAFE_componentWillUpdate != "function" && typeof u.componentWillUpdate != "function" || (typeof u.componentWillUpdate == "function" && u.componentWillUpdate(a, z, d), typeof u.UNSAFE_componentWillUpdate == "function" && u.UNSAFE_componentWillUpdate(
        a,
        z,
        d
      )), typeof u.componentDidUpdate == "function" && (l.flags |= 4), typeof u.getSnapshotBeforeUpdate == "function" && (l.flags |= 1024)) : (typeof u.componentDidUpdate != "function" || i === t.memoizedProps && x === t.memoizedState || (l.flags |= 4), typeof u.getSnapshotBeforeUpdate != "function" || i === t.memoizedProps && x === t.memoizedState || (l.flags |= 1024), l.memoizedProps = a, l.memoizedState = z), u.props = a, u.state = z, u.context = d, a = E) : (typeof u.componentDidUpdate != "function" || i === t.memoizedProps && x === t.memoizedState || (l.flags |= 4), typeof u.getSnapshotBeforeUpdate != "function" || i === t.memoizedProps && x === t.memoizedState || (l.flags |= 1024), a = !1);
    }
    return u = a, Ru(t, l), a = (l.flags & 128) !== 0, u || a ? (u = l.stateNode, e = a && typeof e.getDerivedStateFromError != "function" ? null : u.render(), l.flags |= 1, t !== null && a ? (l.child = na(
      l,
      t.child,
      null,
      n
    ), l.child = na(
      l,
      null,
      e,
      n
    )) : il(t, l, e, n), l.memoizedState = u.state, t = l.child) : t = ne(
      t,
      l,
      n
    ), t;
  }
  function ar(t, l, e, a) {
    return Ie(), l.flags |= 256, il(t, l, e, a), l.child;
  }
  var Uc = {
    dehydrated: null,
    treeContext: null,
    retryLane: 0,
    hydrationErrors: null
  };
  function Rc(t) {
    return { baseLanes: t, cachePool: Ko() };
  }
  function Hc(t, l, e) {
    return t = t !== null ? t.childLanes & ~e : 0, l && (t |= Dl), t;
  }
  function nr(t, l, e) {
    var a = l.pendingProps, n = !1, u = (l.flags & 128) !== 0, i;
    if ((i = u) || (i = t !== null && t.memoizedState === null ? !1 : (Qt.current & 2) !== 0), i && (n = !0, l.flags &= -129), i = (l.flags & 32) !== 0, l.flags &= -33, t === null) {
      if (vt) {
        if (n ? Te(l) : Me(), (t = Ut) ? (t = dd(
          t,
          Bl
        ), t = t !== null && t.data !== "&" ? t : null, t !== null && (l.memoizedState = {
          dehydrated: t,
          treeContext: ge !== null ? { id: Zl, overflow: Vl } : null,
          retryLane: 536870912,
          hydrationErrors: null
        }, e = Yo(t), e.return = l, l.child = e, nl = l, Ut = null)) : t = null, t === null) throw be(l);
        return pf(t) ? l.lanes = 32 : l.lanes = 536870912, null;
      }
      var c = a.children;
      return a = a.fallback, n ? (Me(), n = l.mode, c = Hu(
        { mode: "hidden", children: c },
        n
      ), a = Fe(
        a,
        n,
        e,
        null
      ), c.return = l, a.return = l, c.sibling = a, l.child = c, a = l.child, a.memoizedState = Rc(e), a.childLanes = Hc(
        t,
        i,
        e
      ), l.memoizedState = Uc, On(null, a)) : (Te(l), Bc(l, c));
    }
    var d = t.memoizedState;
    if (d !== null && (c = d.dehydrated, c !== null)) {
      if (u)
        l.flags & 256 ? (Te(l), l.flags &= -257, l = Yc(
          t,
          l,
          e
        )) : l.memoizedState !== null ? (Me(), l.child = t.child, l.flags |= 128, l = null) : (Me(), c = a.fallback, n = l.mode, a = Hu(
          { mode: "visible", children: a.children },
          n
        ), c = Fe(
          c,
          n,
          e,
          null
        ), c.flags |= 2, a.return = l, c.return = l, a.sibling = c, l.child = a, na(
          l,
          t.child,
          null,
          e
        ), a = l.child, a.memoizedState = Rc(e), a.childLanes = Hc(
          t,
          i,
          e
        ), l.memoizedState = Uc, l = On(null, a));
      else if (Te(l), pf(c)) {
        if (i = c.nextSibling && c.nextSibling.dataset, i) var p = i.dgst;
        i = p, a = Error(s(419)), a.stack = "", a.digest = i, xn({ value: a, source: null, stack: null }), l = Yc(
          t,
          l,
          e
        );
      } else if ($t || Ua(t, l, e, !1), i = (e & t.childLanes) !== 0, $t || i) {
        if (i = jt, i !== null && (a = Qf(i, e), a !== 0 && a !== d.retryLane))
          throw d.retryLane = a, We(t, a), bl(i, t, a), jc;
        gf(c) || Zu(), l = Yc(
          t,
          l,
          e
        );
      } else
        gf(c) ? (l.flags |= 192, l.child = t.child, l = null) : (t = d.treeContext, Ut = ql(
          c.nextSibling
        ), nl = l, vt = !0, pe = null, Bl = !1, t !== null && Xo(l, t), l = Bc(
          l,
          a.children
        ), l.flags |= 4096);
      return l;
    }
    return n ? (Me(), c = a.fallback, n = l.mode, d = t.child, p = d.sibling, a = Il(d, {
      mode: "hidden",
      children: a.children
    }), a.subtreeFlags = d.subtreeFlags & 65011712, p !== null ? c = Il(
      p,
      c
    ) : (c = Fe(
      c,
      n,
      e,
      null
    ), c.flags |= 2), c.return = l, a.return = l, a.sibling = c, l.child = a, On(null, a), a = l.child, c = t.child.memoizedState, c === null ? c = Rc(e) : (n = c.cachePool, n !== null ? (d = kt._currentValue, n = n.parent !== d ? { parent: d, pool: d } : n) : n = Ko(), c = {
      baseLanes: c.baseLanes | e,
      cachePool: n
    }), a.memoizedState = c, a.childLanes = Hc(
      t,
      i,
      e
    ), l.memoizedState = Uc, On(t.child, a)) : (Te(l), e = t.child, t = e.sibling, e = Il(e, {
      mode: "visible",
      children: a.children
    }), e.return = l, e.sibling = null, t !== null && (i = l.deletions, i === null ? (l.deletions = [t], l.flags |= 16) : i.push(t)), l.child = e, l.memoizedState = null, e);
  }
  function Bc(t, l) {
    return l = Hu(
      { mode: "visible", children: l },
      t.mode
    ), l.return = t, t.child = l;
  }
  function Hu(t, l) {
    return t = Tl(22, t, null, l), t.lanes = 0, t;
  }
  function Yc(t, l, e) {
    return na(l, t.child, null, e), t = Bc(
      l,
      l.pendingProps.children
    ), t.flags |= 2, l.memoizedState = null, t;
  }
  function ur(t, l, e) {
    t.lanes |= l;
    var a = t.alternate;
    a !== null && (a.lanes |= l), Ii(t.return, l, e);
  }
  function qc(t, l, e, a, n, u) {
    var i = t.memoizedState;
    i === null ? t.memoizedState = {
      isBackwards: l,
      rendering: null,
      renderingStartTime: 0,
      last: a,
      tail: e,
      tailMode: n,
      treeForkCount: u
    } : (i.isBackwards = l, i.rendering = null, i.renderingStartTime = 0, i.last = a, i.tail = e, i.tailMode = n, i.treeForkCount = u);
  }
  function ir(t, l, e) {
    var a = l.pendingProps, n = a.revealOrder, u = a.tail;
    a = a.children;
    var i = Qt.current, c = (i & 2) !== 0;
    if (c ? (i = i & 1 | 2, l.flags |= 128) : i &= 1, j(Qt, i), il(t, l, a, e), a = vt ? bn : 0, !c && t !== null && (t.flags & 128) !== 0)
      t: for (t = l.child; t !== null; ) {
        if (t.tag === 13)
          t.memoizedState !== null && ur(t, e, l);
        else if (t.tag === 19)
          ur(t, e, l);
        else if (t.child !== null) {
          t.child.return = t, t = t.child;
          continue;
        }
        if (t === l) break t;
        for (; t.sibling === null; ) {
          if (t.return === null || t.return === l)
            break t;
          t = t.return;
        }
        t.sibling.return = t.return, t = t.sibling;
      }
    switch (n) {
      case "forwards":
        for (e = l.child, n = null; e !== null; )
          t = e.alternate, t !== null && Eu(t) === null && (n = e), e = e.sibling;
        e = n, e === null ? (n = l.child, l.child = null) : (n = e.sibling, e.sibling = null), qc(
          l,
          !1,
          n,
          e,
          u,
          a
        );
        break;
      case "backwards":
      case "unstable_legacy-backwards":
        for (e = null, n = l.child, l.child = null; n !== null; ) {
          if (t = n.alternate, t !== null && Eu(t) === null) {
            l.child = n;
            break;
          }
          t = n.sibling, n.sibling = e, e = n, n = t;
        }
        qc(
          l,
          !0,
          e,
          null,
          u,
          a
        );
        break;
      case "together":
        qc(
          l,
          !1,
          null,
          null,
          void 0,
          a
        );
        break;
      default:
        l.memoizedState = null;
    }
    return l.child;
  }
  function ne(t, l, e) {
    if (t !== null && (l.dependencies = t.dependencies), De |= l.lanes, (e & l.childLanes) === 0)
      if (t !== null) {
        if (Ua(
          t,
          l,
          e,
          !1
        ), (e & l.childLanes) === 0)
          return null;
      } else return null;
    if (t !== null && l.child !== t.child)
      throw Error(s(153));
    if (l.child !== null) {
      for (t = l.child, e = Il(t, t.pendingProps), l.child = e, e.return = l; t.sibling !== null; )
        t = t.sibling, e = e.sibling = Il(t, t.pendingProps), e.return = l;
      e.sibling = null;
    }
    return l.child;
  }
  function wc(t, l) {
    return (t.lanes & l) !== 0 ? !0 : (t = t.dependencies, !!(t !== null && yu(t)));
  }
  function Th(t, l, e) {
    switch (l.tag) {
      case 3:
        Et(l, l.stateNode.containerInfo), xe(l, kt, t.memoizedState.cache), Ie();
        break;
      case 27:
      case 5:
        Bt(l);
        break;
      case 4:
        Et(l, l.stateNode.containerInfo);
        break;
      case 10:
        xe(
          l,
          l.type,
          l.memoizedProps.value
        );
        break;
      case 31:
        if (l.memoizedState !== null)
          return l.flags |= 128, sc(l), null;
        break;
      case 13:
        var a = l.memoizedState;
        if (a !== null)
          return a.dehydrated !== null ? (Te(l), l.flags |= 128, null) : (e & l.child.childLanes) !== 0 ? nr(t, l, e) : (Te(l), t = ne(
            t,
            l,
            e
          ), t !== null ? t.sibling : null);
        Te(l);
        break;
      case 19:
        var n = (t.flags & 128) !== 0;
        if (a = (e & l.childLanes) !== 0, a || (Ua(
          t,
          l,
          e,
          !1
        ), a = (e & l.childLanes) !== 0), n) {
          if (a)
            return ir(
              t,
              l,
              e
            );
          l.flags |= 128;
        }
        if (n = l.memoizedState, n !== null && (n.rendering = null, n.tail = null, n.lastEffect = null), j(Qt, Qt.current), a) break;
        return null;
      case 22:
        return l.lanes = 0, Is(
          t,
          l,
          e,
          l.pendingProps
        );
      case 24:
        xe(l, kt, t.memoizedState.cache);
    }
    return ne(t, l, e);
  }
  function cr(t, l, e) {
    if (t !== null)
      if (t.memoizedProps !== l.pendingProps)
        $t = !0;
      else {
        if (!wc(t, e) && (l.flags & 128) === 0)
          return $t = !1, Th(
            t,
            l,
            e
          );
        $t = (t.flags & 131072) !== 0;
      }
    else
      $t = !1, vt && (l.flags & 1048576) !== 0 && wo(l, bn, l.index);
    switch (l.lanes = 0, l.tag) {
      case 16:
        t: {
          var a = l.pendingProps;
          if (t = ea(l.elementType), l.type = t, typeof t == "function")
            Zi(t) ? (a = ia(t, a), l.tag = 1, l = er(
              null,
              l,
              t,
              a,
              e
            )) : (l.tag = 0, l = Oc(
              null,
              l,
              t,
              a,
              e
            ));
          else {
            if (t != null) {
              var n = t.$$typeof;
              if (n === X) {
                l.tag = 11, l = $s(
                  null,
                  l,
                  t,
                  a,
                  e
                );
                break t;
              } else if (n === K) {
                l.tag = 14, l = Ws(
                  null,
                  l,
                  t,
                  a,
                  e
                );
                break t;
              }
            }
            throw l = zt(t) || t, Error(s(306, l, ""));
          }
        }
        return l;
      case 0:
        return Oc(
          t,
          l,
          l.type,
          l.pendingProps,
          e
        );
      case 1:
        return a = l.type, n = ia(
          a,
          l.pendingProps
        ), er(
          t,
          l,
          a,
          n,
          e
        );
      case 3:
        t: {
          if (Et(
            l,
            l.stateNode.containerInfo
          ), t === null) throw Error(s(387));
          a = l.pendingProps;
          var u = l.memoizedState;
          n = u.element, uc(t, l), An(l, a, null, e);
          var i = l.memoizedState;
          if (a = i.cache, xe(l, kt, a), a !== u.cache && Pi(
            l,
            [kt],
            e,
            !0
          ), _n(), a = i.element, u.isDehydrated)
            if (u = {
              element: a,
              isDehydrated: !1,
              cache: i.cache
            }, l.updateQueue.baseState = u, l.memoizedState = u, l.flags & 256) {
              l = ar(
                t,
                l,
                a,
                e
              );
              break t;
            } else if (a !== n) {
              n = Ul(
                Error(s(424)),
                l
              ), xn(n), l = ar(
                t,
                l,
                a,
                e
              );
              break t;
            } else
              for (t = l.stateNode.containerInfo, t.nodeType === 9 ? t = t.body : t = t.nodeName === "HTML" ? t.ownerDocument.body : t, Ut = ql(t.firstChild), nl = l, vt = !0, pe = null, Bl = !0, e = Io(
                l,
                null,
                a,
                e
              ), l.child = e; e; )
                e.flags = e.flags & -3 | 4096, e = e.sibling;
          else {
            if (Ie(), a === n) {
              l = ne(
                t,
                l,
                e
              );
              break t;
            }
            il(t, l, a, e);
          }
          l = l.child;
        }
        return l;
      case 26:
        return Ru(t, l), t === null ? (e = pd(
          l.type,
          null,
          l.pendingProps,
          null
        )) ? l.memoizedState = e : vt || (e = l.type, t = l.pendingProps, a = Fu(
          F.current
        ).createElement(e), a[al] = l, a[ml] = t, cl(a, e, t), tl(a), l.stateNode = a) : l.memoizedState = pd(
          l.type,
          t.memoizedProps,
          l.pendingProps,
          t.memoizedState
        ), null;
      case 27:
        return Bt(l), t === null && vt && (a = l.stateNode = yd(
          l.type,
          l.pendingProps,
          F.current
        ), nl = l, Bl = !0, n = Ut, Ue(l.type) ? (bf = n, Ut = ql(a.firstChild)) : Ut = n), il(
          t,
          l,
          l.pendingProps.children,
          e
        ), Ru(t, l), t === null && (l.flags |= 4194304), l.child;
      case 5:
        return t === null && vt && ((n = a = Ut) && (a = t0(
          a,
          l.type,
          l.pendingProps,
          Bl
        ), a !== null ? (l.stateNode = a, nl = l, Ut = ql(a.firstChild), Bl = !1, n = !0) : n = !1), n || be(l)), Bt(l), n = l.type, u = l.pendingProps, i = t !== null ? t.memoizedProps : null, a = u.children, hf(n, u) ? a = null : i !== null && hf(n, i) && (l.flags |= 32), l.memoizedState !== null && (n = dc(
          t,
          l,
          yh,
          null,
          null,
          e
        ), kn._currentValue = n), Ru(t, l), il(t, l, a, e), l.child;
      case 6:
        return t === null && vt && ((t = e = Ut) && (e = l0(
          e,
          l.pendingProps,
          Bl
        ), e !== null ? (l.stateNode = e, nl = l, Ut = null, t = !0) : t = !1), t || be(l)), null;
      case 13:
        return nr(t, l, e);
      case 4:
        return Et(
          l,
          l.stateNode.containerInfo
        ), a = l.pendingProps, t === null ? l.child = na(
          l,
          null,
          a,
          e
        ) : il(t, l, a, e), l.child;
      case 11:
        return $s(
          t,
          l,
          l.type,
          l.pendingProps,
          e
        );
      case 7:
        return il(
          t,
          l,
          l.pendingProps,
          e
        ), l.child;
      case 8:
        return il(
          t,
          l,
          l.pendingProps.children,
          e
        ), l.child;
      case 12:
        return il(
          t,
          l,
          l.pendingProps.children,
          e
        ), l.child;
      case 10:
        return a = l.pendingProps, xe(l, l.type, a.value), il(t, l, a.children, e), l.child;
      case 9:
        return n = l.type._context, a = l.pendingProps.children, ta(l), n = ul(n), a = a(n), l.flags |= 1, il(t, l, a, e), l.child;
      case 14:
        return Ws(
          t,
          l,
          l.type,
          l.pendingProps,
          e
        );
      case 15:
        return Fs(
          t,
          l,
          l.type,
          l.pendingProps,
          e
        );
      case 19:
        return ir(t, l, e);
      case 31:
        return Eh(t, l, e);
      case 22:
        return Is(
          t,
          l,
          e,
          l.pendingProps
        );
      case 24:
        return ta(l), a = ul(kt), t === null ? (n = ec(), n === null && (n = jt, u = tc(), n.pooledCache = u, u.refCount++, u !== null && (n.pooledCacheLanes |= e), n = u), l.memoizedState = { parent: a, cache: n }, nc(l), xe(l, kt, n)) : ((t.lanes & e) !== 0 && (uc(t, l), An(l, null, null, e), _n()), n = t.memoizedState, u = l.memoizedState, n.parent !== a ? (n = { parent: a, cache: a }, l.memoizedState = n, l.lanes === 0 && (l.memoizedState = l.updateQueue.baseState = n), xe(l, kt, a)) : (a = u.cache, xe(l, kt, a), a !== n.cache && Pi(
          l,
          [kt],
          e,
          !0
        ))), il(
          t,
          l,
          l.pendingProps.children,
          e
        ), l.child;
      case 29:
        throw l.pendingProps;
    }
    throw Error(s(156, l.tag));
  }
  function ue(t) {
    t.flags |= 4;
  }
  function Xc(t, l, e, a, n) {
    if ((l = (t.mode & 32) !== 0) && (l = !1), l) {
      if (t.flags |= 16777216, (n & 335544128) === n)
        if (t.stateNode.complete) t.flags |= 8192;
        else if (Rr()) t.flags |= 8192;
        else
          throw aa = bu, ac;
    } else t.flags &= -16777217;
  }
  function fr(t, l) {
    if (l.type !== "stylesheet" || (l.state.loading & 4) !== 0)
      t.flags &= -16777217;
    else if (t.flags |= 16777216, !Ed(l))
      if (Rr()) t.flags |= 8192;
      else
        throw aa = bu, ac;
  }
  function Bu(t, l) {
    l !== null && (t.flags |= 4), t.flags & 16384 && (l = t.tag !== 22 ? Xf() : 536870912, t.lanes |= l, Va |= l);
  }
  function Un(t, l) {
    if (!vt)
      switch (t.tailMode) {
        case "hidden":
          l = t.tail;
          for (var e = null; l !== null; )
            l.alternate !== null && (e = l), l = l.sibling;
          e === null ? t.tail = null : e.sibling = null;
          break;
        case "collapsed":
          e = t.tail;
          for (var a = null; e !== null; )
            e.alternate !== null && (a = e), e = e.sibling;
          a === null ? l || t.tail === null ? t.tail = null : t.tail.sibling = null : a.sibling = null;
      }
  }
  function Rt(t) {
    var l = t.alternate !== null && t.alternate.child === t.child, e = 0, a = 0;
    if (l)
      for (var n = t.child; n !== null; )
        e |= n.lanes | n.childLanes, a |= n.subtreeFlags & 65011712, a |= n.flags & 65011712, n.return = t, n = n.sibling;
    else
      for (n = t.child; n !== null; )
        e |= n.lanes | n.childLanes, a |= n.subtreeFlags, a |= n.flags, n.return = t, n = n.sibling;
    return t.subtreeFlags |= a, t.childLanes = e, l;
  }
  function Mh(t, l, e) {
    var a = l.pendingProps;
    switch (Ji(l), l.tag) {
      case 16:
      case 15:
      case 0:
      case 11:
      case 7:
      case 8:
      case 12:
      case 9:
      case 14:
        return Rt(l), null;
      case 1:
        return Rt(l), null;
      case 3:
        return e = l.stateNode, a = null, t !== null && (a = t.memoizedState.cache), l.memoizedState.cache !== a && (l.flags |= 2048), le(kt), gt(), e.pendingContext && (e.context = e.pendingContext, e.pendingContext = null), (t === null || t.child === null) && (Oa(l) ? ue(l) : t === null || t.memoizedState.isDehydrated && (l.flags & 256) === 0 || (l.flags |= 1024, Wi())), Rt(l), null;
      case 26:
        var n = l.type, u = l.memoizedState;
        return t === null ? (ue(l), u !== null ? (Rt(l), fr(l, u)) : (Rt(l), Xc(
          l,
          n,
          null,
          a,
          e
        ))) : u ? u !== t.memoizedState ? (ue(l), Rt(l), fr(l, u)) : (Rt(l), l.flags &= -16777217) : (t = t.memoizedProps, t !== a && ue(l), Rt(l), Xc(
          l,
          n,
          t,
          a,
          e
        )), null;
      case 27:
        if (Yt(l), e = F.current, n = l.type, t !== null && l.stateNode != null)
          t.memoizedProps !== a && ue(l);
        else {
          if (!a) {
            if (l.stateNode === null)
              throw Error(s(166));
            return Rt(l), null;
          }
          t = B.current, Oa(l) ? Go(l) : (t = yd(n, a, e), l.stateNode = t, ue(l));
        }
        return Rt(l), null;
      case 5:
        if (Yt(l), n = l.type, t !== null && l.stateNode != null)
          t.memoizedProps !== a && ue(l);
        else {
          if (!a) {
            if (l.stateNode === null)
              throw Error(s(166));
            return Rt(l), null;
          }
          if (u = B.current, Oa(l))
            Go(l);
          else {
            var i = Fu(
              F.current
            );
            switch (u) {
              case 1:
                u = i.createElementNS(
                  "http://www.w3.org/2000/svg",
                  n
                );
                break;
              case 2:
                u = i.createElementNS(
                  "http://www.w3.org/1998/Math/MathML",
                  n
                );
                break;
              default:
                switch (n) {
                  case "svg":
                    u = i.createElementNS(
                      "http://www.w3.org/2000/svg",
                      n
                    );
                    break;
                  case "math":
                    u = i.createElementNS(
                      "http://www.w3.org/1998/Math/MathML",
                      n
                    );
                    break;
                  case "script":
                    u = i.createElement("div"), u.innerHTML = "<script><\/script>", u = u.removeChild(
                      u.firstChild
                    );
                    break;
                  case "select":
                    u = typeof a.is == "string" ? i.createElement("select", {
                      is: a.is
                    }) : i.createElement("select"), a.multiple ? u.multiple = !0 : a.size && (u.size = a.size);
                    break;
                  default:
                    u = typeof a.is == "string" ? i.createElement(n, { is: a.is }) : i.createElement(n);
                }
            }
            u[al] = l, u[ml] = a;
            t: for (i = l.child; i !== null; ) {
              if (i.tag === 5 || i.tag === 6)
                u.appendChild(i.stateNode);
              else if (i.tag !== 4 && i.tag !== 27 && i.child !== null) {
                i.child.return = i, i = i.child;
                continue;
              }
              if (i === l) break t;
              for (; i.sibling === null; ) {
                if (i.return === null || i.return === l)
                  break t;
                i = i.return;
              }
              i.sibling.return = i.return, i = i.sibling;
            }
            l.stateNode = u;
            t: switch (cl(u, n, a), n) {
              case "button":
              case "input":
              case "select":
              case "textarea":
                a = !!a.autoFocus;
                break t;
              case "img":
                a = !0;
                break t;
              default:
                a = !1;
            }
            a && ue(l);
          }
        }
        return Rt(l), Xc(
          l,
          l.type,
          t === null ? null : t.memoizedProps,
          l.pendingProps,
          e
        ), null;
      case 6:
        if (t && l.stateNode != null)
          t.memoizedProps !== a && ue(l);
        else {
          if (typeof a != "string" && l.stateNode === null)
            throw Error(s(166));
          if (t = F.current, Oa(l)) {
            if (t = l.stateNode, e = l.memoizedProps, a = null, n = nl, n !== null)
              switch (n.tag) {
                case 27:
                case 5:
                  a = n.memoizedProps;
              }
            t[al] = l, t = !!(t.nodeValue === e || a !== null && a.suppressHydrationWarning === !0 || nd(t.nodeValue, e)), t || be(l, !0);
          } else
            t = Fu(t).createTextNode(
              a
            ), t[al] = l, l.stateNode = t;
        }
        return Rt(l), null;
      case 31:
        if (e = l.memoizedState, t === null || t.memoizedState !== null) {
          if (a = Oa(l), e !== null) {
            if (t === null) {
              if (!a) throw Error(s(318));
              if (t = l.memoizedState, t = t !== null ? t.dehydrated : null, !t) throw Error(s(557));
              t[al] = l;
            } else
              Ie(), (l.flags & 128) === 0 && (l.memoizedState = null), l.flags |= 4;
            Rt(l), t = !1;
          } else
            e = Wi(), t !== null && t.memoizedState !== null && (t.memoizedState.hydrationErrors = e), t = !0;
          if (!t)
            return l.flags & 256 ? (_l(l), l) : (_l(l), null);
          if ((l.flags & 128) !== 0)
            throw Error(s(558));
        }
        return Rt(l), null;
      case 13:
        if (a = l.memoizedState, t === null || t.memoizedState !== null && t.memoizedState.dehydrated !== null) {
          if (n = Oa(l), a !== null && a.dehydrated !== null) {
            if (t === null) {
              if (!n) throw Error(s(318));
              if (n = l.memoizedState, n = n !== null ? n.dehydrated : null, !n) throw Error(s(317));
              n[al] = l;
            } else
              Ie(), (l.flags & 128) === 0 && (l.memoizedState = null), l.flags |= 4;
            Rt(l), n = !1;
          } else
            n = Wi(), t !== null && t.memoizedState !== null && (t.memoizedState.hydrationErrors = n), n = !0;
          if (!n)
            return l.flags & 256 ? (_l(l), l) : (_l(l), null);
        }
        return _l(l), (l.flags & 128) !== 0 ? (l.lanes = e, l) : (e = a !== null, t = t !== null && t.memoizedState !== null, e && (a = l.child, n = null, a.alternate !== null && a.alternate.memoizedState !== null && a.alternate.memoizedState.cachePool !== null && (n = a.alternate.memoizedState.cachePool.pool), u = null, a.memoizedState !== null && a.memoizedState.cachePool !== null && (u = a.memoizedState.cachePool.pool), u !== n && (a.flags |= 2048)), e !== t && e && (l.child.flags |= 8192), Bu(l, l.updateQueue), Rt(l), null);
      case 4:
        return gt(), t === null && of(l.stateNode.containerInfo), Rt(l), null;
      case 10:
        return le(l.type), Rt(l), null;
      case 19:
        if (M(Qt), a = l.memoizedState, a === null) return Rt(l), null;
        if (n = (l.flags & 128) !== 0, u = a.rendering, u === null)
          if (n) Un(a, !1);
          else {
            if (Gt !== 0 || t !== null && (t.flags & 128) !== 0)
              for (t = l.child; t !== null; ) {
                if (u = Eu(t), u !== null) {
                  for (l.flags |= 128, Un(a, !1), t = u.updateQueue, l.updateQueue = t, Bu(l, t), l.subtreeFlags = 0, t = e, e = l.child; e !== null; )
                    Bo(e, t), e = e.sibling;
                  return j(
                    Qt,
                    Qt.current & 1 | 2
                  ), vt && Pl(l, a.treeForkCount), l.child;
                }
                t = t.sibling;
              }
            a.tail !== null && Pt() > Gu && (l.flags |= 128, n = !0, Un(a, !1), l.lanes = 4194304);
          }
        else {
          if (!n)
            if (t = Eu(u), t !== null) {
              if (l.flags |= 128, n = !0, t = t.updateQueue, l.updateQueue = t, Bu(l, t), Un(a, !0), a.tail === null && a.tailMode === "hidden" && !u.alternate && !vt)
                return Rt(l), null;
            } else
              2 * Pt() - a.renderingStartTime > Gu && e !== 536870912 && (l.flags |= 128, n = !0, Un(a, !1), l.lanes = 4194304);
          a.isBackwards ? (u.sibling = l.child, l.child = u) : (t = a.last, t !== null ? t.sibling = u : l.child = u, a.last = u);
        }
        return a.tail !== null ? (t = a.tail, a.rendering = t, a.tail = t.sibling, a.renderingStartTime = Pt(), t.sibling = null, e = Qt.current, j(
          Qt,
          n ? e & 1 | 2 : e & 1
        ), vt && Pl(l, a.treeForkCount), t) : (Rt(l), null);
      case 22:
      case 23:
        return _l(l), oc(), a = l.memoizedState !== null, t !== null ? t.memoizedState !== null !== a && (l.flags |= 8192) : a && (l.flags |= 8192), a ? (e & 536870912) !== 0 && (l.flags & 128) === 0 && (Rt(l), l.subtreeFlags & 6 && (l.flags |= 8192)) : Rt(l), e = l.updateQueue, e !== null && Bu(l, e.retryQueue), e = null, t !== null && t.memoizedState !== null && t.memoizedState.cachePool !== null && (e = t.memoizedState.cachePool.pool), a = null, l.memoizedState !== null && l.memoizedState.cachePool !== null && (a = l.memoizedState.cachePool.pool), a !== e && (l.flags |= 2048), t !== null && M(la), null;
      case 24:
        return e = null, t !== null && (e = t.memoizedState.cache), l.memoizedState.cache !== e && (l.flags |= 2048), le(kt), Rt(l), null;
      case 25:
        return null;
      case 30:
        return null;
    }
    throw Error(s(156, l.tag));
  }
  function _h(t, l) {
    switch (Ji(l), l.tag) {
      case 1:
        return t = l.flags, t & 65536 ? (l.flags = t & -65537 | 128, l) : null;
      case 3:
        return le(kt), gt(), t = l.flags, (t & 65536) !== 0 && (t & 128) === 0 ? (l.flags = t & -65537 | 128, l) : null;
      case 26:
      case 27:
      case 5:
        return Yt(l), null;
      case 31:
        if (l.memoizedState !== null) {
          if (_l(l), l.alternate === null)
            throw Error(s(340));
          Ie();
        }
        return t = l.flags, t & 65536 ? (l.flags = t & -65537 | 128, l) : null;
      case 13:
        if (_l(l), t = l.memoizedState, t !== null && t.dehydrated !== null) {
          if (l.alternate === null)
            throw Error(s(340));
          Ie();
        }
        return t = l.flags, t & 65536 ? (l.flags = t & -65537 | 128, l) : null;
      case 19:
        return M(Qt), null;
      case 4:
        return gt(), null;
      case 10:
        return le(l.type), null;
      case 22:
      case 23:
        return _l(l), oc(), t !== null && M(la), t = l.flags, t & 65536 ? (l.flags = t & -65537 | 128, l) : null;
      case 24:
        return le(kt), null;
      case 25:
        return null;
      default:
        return null;
    }
  }
  function or(t, l) {
    switch (Ji(l), l.tag) {
      case 3:
        le(kt), gt();
        break;
      case 26:
      case 27:
      case 5:
        Yt(l);
        break;
      case 4:
        gt();
        break;
      case 31:
        l.memoizedState !== null && _l(l);
        break;
      case 13:
        _l(l);
        break;
      case 19:
        M(Qt);
        break;
      case 10:
        le(l.type);
        break;
      case 22:
      case 23:
        _l(l), oc(), t !== null && M(la);
        break;
      case 24:
        le(kt);
    }
  }
  function Rn(t, l) {
    try {
      var e = l.updateQueue, a = e !== null ? e.lastEffect : null;
      if (a !== null) {
        var n = a.next;
        e = n;
        do {
          if ((e.tag & t) === t) {
            a = void 0;
            var u = e.create, i = e.inst;
            a = u(), i.destroy = a;
          }
          e = e.next;
        } while (e !== n);
      }
    } catch (c) {
      At(l, l.return, c);
    }
  }
  function _e(t, l, e) {
    try {
      var a = l.updateQueue, n = a !== null ? a.lastEffect : null;
      if (n !== null) {
        var u = n.next;
        a = u;
        do {
          if ((a.tag & t) === t) {
            var i = a.inst, c = i.destroy;
            if (c !== void 0) {
              i.destroy = void 0, n = l;
              var d = e, p = c;
              try {
                p();
              } catch (E) {
                At(
                  n,
                  d,
                  E
                );
              }
            }
          }
          a = a.next;
        } while (a !== u);
      }
    } catch (E) {
      At(l, l.return, E);
    }
  }
  function sr(t) {
    var l = t.updateQueue;
    if (l !== null) {
      var e = t.stateNode;
      try {
        ts(l, e);
      } catch (a) {
        At(t, t.return, a);
      }
    }
  }
  function rr(t, l, e) {
    e.props = ia(
      t.type,
      t.memoizedProps
    ), e.state = t.memoizedState;
    try {
      e.componentWillUnmount();
    } catch (a) {
      At(t, l, a);
    }
  }
  function Hn(t, l) {
    try {
      var e = t.ref;
      if (e !== null) {
        switch (t.tag) {
          case 26:
          case 27:
          case 5:
            var a = t.stateNode;
            break;
          case 30:
            a = t.stateNode;
            break;
          default:
            a = t.stateNode;
        }
        typeof e == "function" ? t.refCleanup = e(a) : e.current = a;
      }
    } catch (n) {
      At(t, l, n);
    }
  }
  function Kl(t, l) {
    var e = t.ref, a = t.refCleanup;
    if (e !== null)
      if (typeof a == "function")
        try {
          a();
        } catch (n) {
          At(t, l, n);
        } finally {
          t.refCleanup = null, t = t.alternate, t != null && (t.refCleanup = null);
        }
      else if (typeof e == "function")
        try {
          e(null);
        } catch (n) {
          At(t, l, n);
        }
      else e.current = null;
  }
  function dr(t) {
    var l = t.type, e = t.memoizedProps, a = t.stateNode;
    try {
      t: switch (l) {
        case "button":
        case "input":
        case "select":
        case "textarea":
          e.autoFocus && a.focus();
          break t;
        case "img":
          e.src ? a.src = e.src : e.srcSet && (a.srcset = e.srcSet);
      }
    } catch (n) {
      At(t, t.return, n);
    }
  }
  function Gc(t, l, e) {
    try {
      var a = t.stateNode;
      Jh(a, t.type, e, l), a[ml] = l;
    } catch (n) {
      At(t, t.return, n);
    }
  }
  function mr(t) {
    return t.tag === 5 || t.tag === 3 || t.tag === 26 || t.tag === 27 && Ue(t.type) || t.tag === 4;
  }
  function Lc(t) {
    t: for (; ; ) {
      for (; t.sibling === null; ) {
        if (t.return === null || mr(t.return)) return null;
        t = t.return;
      }
      for (t.sibling.return = t.return, t = t.sibling; t.tag !== 5 && t.tag !== 6 && t.tag !== 18; ) {
        if (t.tag === 27 && Ue(t.type) || t.flags & 2 || t.child === null || t.tag === 4) continue t;
        t.child.return = t, t = t.child;
      }
      if (!(t.flags & 2)) return t.stateNode;
    }
  }
  function Qc(t, l, e) {
    var a = t.tag;
    if (a === 5 || a === 6)
      t = t.stateNode, l ? (e.nodeType === 9 ? e.body : e.nodeName === "HTML" ? e.ownerDocument.body : e).insertBefore(t, l) : (l = e.nodeType === 9 ? e.body : e.nodeName === "HTML" ? e.ownerDocument.body : e, l.appendChild(t), e = e._reactRootContainer, e != null || l.onclick !== null || (l.onclick = Wl));
    else if (a !== 4 && (a === 27 && Ue(t.type) && (e = t.stateNode, l = null), t = t.child, t !== null))
      for (Qc(t, l, e), t = t.sibling; t !== null; )
        Qc(t, l, e), t = t.sibling;
  }
  function Yu(t, l, e) {
    var a = t.tag;
    if (a === 5 || a === 6)
      t = t.stateNode, l ? e.insertBefore(t, l) : e.appendChild(t);
    else if (a !== 4 && (a === 27 && Ue(t.type) && (e = t.stateNode), t = t.child, t !== null))
      for (Yu(t, l, e), t = t.sibling; t !== null; )
        Yu(t, l, e), t = t.sibling;
  }
  function hr(t) {
    var l = t.stateNode, e = t.memoizedProps;
    try {
      for (var a = t.type, n = l.attributes; n.length; )
        l.removeAttributeNode(n[0]);
      cl(l, a, e), l[al] = t, l[ml] = e;
    } catch (u) {
      At(t, t.return, u);
    }
  }
  var ie = !1, Wt = !1, Zc = !1, yr = typeof WeakSet == "function" ? WeakSet : Set, ll = null;
  function Ah(t, l) {
    if (t = t.containerInfo, df = ni, t = Ao(t), Yi(t)) {
      if ("selectionStart" in t)
        var e = {
          start: t.selectionStart,
          end: t.selectionEnd
        };
      else
        t: {
          e = (e = t.ownerDocument) && e.defaultView || window;
          var a = e.getSelection && e.getSelection();
          if (a && a.rangeCount !== 0) {
            e = a.anchorNode;
            var n = a.anchorOffset, u = a.focusNode;
            a = a.focusOffset;
            try {
              e.nodeType, u.nodeType;
            } catch {
              e = null;
              break t;
            }
            var i = 0, c = -1, d = -1, p = 0, E = 0, N = t, x = null;
            l: for (; ; ) {
              for (var z; N !== e || n !== 0 && N.nodeType !== 3 || (c = i + n), N !== u || a !== 0 && N.nodeType !== 3 || (d = i + a), N.nodeType === 3 && (i += N.nodeValue.length), (z = N.firstChild) !== null; )
                x = N, N = z;
              for (; ; ) {
                if (N === t) break l;
                if (x === e && ++p === n && (c = i), x === u && ++E === a && (d = i), (z = N.nextSibling) !== null) break;
                N = x, x = N.parentNode;
              }
              N = z;
            }
            e = c === -1 || d === -1 ? null : { start: c, end: d };
          } else e = null;
        }
      e = e || { start: 0, end: 0 };
    } else e = null;
    for (mf = { focusedElem: t, selectionRange: e }, ni = !1, ll = l; ll !== null; )
      if (l = ll, t = l.child, (l.subtreeFlags & 1028) !== 0 && t !== null)
        t.return = l, ll = t;
      else
        for (; ll !== null; ) {
          switch (l = ll, u = l.alternate, t = l.flags, l.tag) {
            case 0:
              if ((t & 4) !== 0 && (t = l.updateQueue, t = t !== null ? t.events : null, t !== null))
                for (e = 0; e < t.length; e++)
                  n = t[e], n.ref.impl = n.nextImpl;
              break;
            case 11:
            case 15:
              break;
            case 1:
              if ((t & 1024) !== 0 && u !== null) {
                t = void 0, e = l, n = u.memoizedProps, u = u.memoizedState, a = e.stateNode;
                try {
                  var J = ia(
                    e.type,
                    n
                  );
                  t = a.getSnapshotBeforeUpdate(
                    J,
                    u
                  ), a.__reactInternalSnapshotBeforeUpdate = t;
                } catch (at) {
                  At(
                    e,
                    e.return,
                    at
                  );
                }
              }
              break;
            case 3:
              if ((t & 1024) !== 0) {
                if (t = l.stateNode.containerInfo, e = t.nodeType, e === 9)
                  vf(t);
                else if (e === 1)
                  switch (t.nodeName) {
                    case "HEAD":
                    case "HTML":
                    case "BODY":
                      vf(t);
                      break;
                    default:
                      t.textContent = "";
                  }
              }
              break;
            case 5:
            case 26:
            case 27:
            case 6:
            case 4:
            case 17:
              break;
            default:
              if ((t & 1024) !== 0) throw Error(s(163));
          }
          if (t = l.sibling, t !== null) {
            t.return = l.return, ll = t;
            break;
          }
          ll = l.return;
        }
  }
  function vr(t, l, e) {
    var a = e.flags;
    switch (e.tag) {
      case 0:
      case 11:
      case 15:
        fe(t, e), a & 4 && Rn(5, e);
        break;
      case 1:
        if (fe(t, e), a & 4)
          if (t = e.stateNode, l === null)
            try {
              t.componentDidMount();
            } catch (i) {
              At(e, e.return, i);
            }
          else {
            var n = ia(
              e.type,
              l.memoizedProps
            );
            l = l.memoizedState;
            try {
              t.componentDidUpdate(
                n,
                l,
                t.__reactInternalSnapshotBeforeUpdate
              );
            } catch (i) {
              At(
                e,
                e.return,
                i
              );
            }
          }
        a & 64 && sr(e), a & 512 && Hn(e, e.return);
        break;
      case 3:
        if (fe(t, e), a & 64 && (t = e.updateQueue, t !== null)) {
          if (l = null, e.child !== null)
            switch (e.child.tag) {
              case 27:
              case 5:
                l = e.child.stateNode;
                break;
              case 1:
                l = e.child.stateNode;
            }
          try {
            ts(t, l);
          } catch (i) {
            At(e, e.return, i);
          }
        }
        break;
      case 27:
        l === null && a & 4 && hr(e);
      case 26:
      case 5:
        fe(t, e), l === null && a & 4 && dr(e), a & 512 && Hn(e, e.return);
        break;
      case 12:
        fe(t, e);
        break;
      case 31:
        fe(t, e), a & 4 && br(t, e);
        break;
      case 13:
        fe(t, e), a & 4 && xr(t, e), a & 64 && (t = e.memoizedState, t !== null && (t = t.dehydrated, t !== null && (e = Bh.bind(
          null,
          e
        ), e0(t, e))));
        break;
      case 22:
        if (a = e.memoizedState !== null || ie, !a) {
          l = l !== null && l.memoizedState !== null || Wt, n = ie;
          var u = Wt;
          ie = a, (Wt = l) && !u ? oe(
            t,
            e,
            (e.subtreeFlags & 8772) !== 0
          ) : fe(t, e), ie = n, Wt = u;
        }
        break;
      case 30:
        break;
      default:
        fe(t, e);
    }
  }
  function gr(t) {
    var l = t.alternate;
    l !== null && (t.alternate = null, gr(l)), t.child = null, t.deletions = null, t.sibling = null, t.tag === 5 && (l = t.stateNode, l !== null && xi(l)), t.stateNode = null, t.return = null, t.dependencies = null, t.memoizedProps = null, t.memoizedState = null, t.pendingProps = null, t.stateNode = null, t.updateQueue = null;
  }
  var Ht = null, yl = !1;
  function ce(t, l, e) {
    for (e = e.child; e !== null; )
      pr(t, l, e), e = e.sibling;
  }
  function pr(t, l, e) {
    if (Ot && typeof Ot.onCommitFiberUnmount == "function")
      try {
        Ot.onCommitFiberUnmount(Q, e);
      } catch {
      }
    switch (e.tag) {
      case 26:
        Wt || Kl(e, l), ce(
          t,
          l,
          e
        ), e.memoizedState ? e.memoizedState.count-- : e.stateNode && (e = e.stateNode, e.parentNode.removeChild(e));
        break;
      case 27:
        Wt || Kl(e, l);
        var a = Ht, n = yl;
        Ue(e.type) && (Ht = e.stateNode, yl = !1), ce(
          t,
          l,
          e
        ), Zn(e.stateNode), Ht = a, yl = n;
        break;
      case 5:
        Wt || Kl(e, l);
      case 6:
        if (a = Ht, n = yl, Ht = null, ce(
          t,
          l,
          e
        ), Ht = a, yl = n, Ht !== null)
          if (yl)
            try {
              (Ht.nodeType === 9 ? Ht.body : Ht.nodeName === "HTML" ? Ht.ownerDocument.body : Ht).removeChild(e.stateNode);
            } catch (u) {
              At(
                e,
                l,
                u
              );
            }
          else
            try {
              Ht.removeChild(e.stateNode);
            } catch (u) {
              At(
                e,
                l,
                u
              );
            }
        break;
      case 18:
        Ht !== null && (yl ? (t = Ht, sd(
          t.nodeType === 9 ? t.body : t.nodeName === "HTML" ? t.ownerDocument.body : t,
          e.stateNode
        ), Pa(t)) : sd(Ht, e.stateNode));
        break;
      case 4:
        a = Ht, n = yl, Ht = e.stateNode.containerInfo, yl = !0, ce(
          t,
          l,
          e
        ), Ht = a, yl = n;
        break;
      case 0:
      case 11:
      case 14:
      case 15:
        _e(2, e, l), Wt || _e(4, e, l), ce(
          t,
          l,
          e
        );
        break;
      case 1:
        Wt || (Kl(e, l), a = e.stateNode, typeof a.componentWillUnmount == "function" && rr(
          e,
          l,
          a
        )), ce(
          t,
          l,
          e
        );
        break;
      case 21:
        ce(
          t,
          l,
          e
        );
        break;
      case 22:
        Wt = (a = Wt) || e.memoizedState !== null, ce(
          t,
          l,
          e
        ), Wt = a;
        break;
      default:
        ce(
          t,
          l,
          e
        );
    }
  }
  function br(t, l) {
    if (l.memoizedState === null && (t = l.alternate, t !== null && (t = t.memoizedState, t !== null))) {
      t = t.dehydrated;
      try {
        Pa(t);
      } catch (e) {
        At(l, l.return, e);
      }
    }
  }
  function xr(t, l) {
    if (l.memoizedState === null && (t = l.alternate, t !== null && (t = t.memoizedState, t !== null && (t = t.dehydrated, t !== null))))
      try {
        Pa(t);
      } catch (e) {
        At(l, l.return, e);
      }
  }
  function Dh(t) {
    switch (t.tag) {
      case 31:
      case 13:
      case 19:
        var l = t.stateNode;
        return l === null && (l = t.stateNode = new yr()), l;
      case 22:
        return t = t.stateNode, l = t._retryCache, l === null && (l = t._retryCache = new yr()), l;
      default:
        throw Error(s(435, t.tag));
    }
  }
  function qu(t, l) {
    var e = Dh(t);
    l.forEach(function(a) {
      if (!e.has(a)) {
        e.add(a);
        var n = Yh.bind(null, t, a);
        a.then(n, n);
      }
    });
  }
  function vl(t, l) {
    var e = l.deletions;
    if (e !== null)
      for (var a = 0; a < e.length; a++) {
        var n = e[a], u = t, i = l, c = i;
        t: for (; c !== null; ) {
          switch (c.tag) {
            case 27:
              if (Ue(c.type)) {
                Ht = c.stateNode, yl = !1;
                break t;
              }
              break;
            case 5:
              Ht = c.stateNode, yl = !1;
              break t;
            case 3:
            case 4:
              Ht = c.stateNode.containerInfo, yl = !0;
              break t;
          }
          c = c.return;
        }
        if (Ht === null) throw Error(s(160));
        pr(u, i, n), Ht = null, yl = !1, u = n.alternate, u !== null && (u.return = null), n.return = null;
      }
    if (l.subtreeFlags & 13886)
      for (l = l.child; l !== null; )
        Sr(l, t), l = l.sibling;
  }
  var Gl = null;
  function Sr(t, l) {
    var e = t.alternate, a = t.flags;
    switch (t.tag) {
      case 0:
      case 11:
      case 14:
      case 15:
        vl(l, t), gl(t), a & 4 && (_e(3, t, t.return), Rn(3, t), _e(5, t, t.return));
        break;
      case 1:
        vl(l, t), gl(t), a & 512 && (Wt || e === null || Kl(e, e.return)), a & 64 && ie && (t = t.updateQueue, t !== null && (a = t.callbacks, a !== null && (e = t.shared.hiddenCallbacks, t.shared.hiddenCallbacks = e === null ? a : e.concat(a))));
        break;
      case 26:
        var n = Gl;
        if (vl(l, t), gl(t), a & 512 && (Wt || e === null || Kl(e, e.return)), a & 4) {
          var u = e !== null ? e.memoizedState : null;
          if (a = t.memoizedState, e === null)
            if (a === null)
              if (t.stateNode === null) {
                t: {
                  a = t.type, e = t.memoizedProps, n = n.ownerDocument || n;
                  l: switch (a) {
                    case "title":
                      u = n.getElementsByTagName("title")[0], (!u || u[fn] || u[al] || u.namespaceURI === "http://www.w3.org/2000/svg" || u.hasAttribute("itemprop")) && (u = n.createElement(a), n.head.insertBefore(
                        u,
                        n.querySelector("head > title")
                      )), cl(u, a, e), u[al] = t, tl(u), a = u;
                      break t;
                    case "link":
                      var i = Sd(
                        "link",
                        "href",
                        n
                      ).get(a + (e.href || ""));
                      if (i) {
                        for (var c = 0; c < i.length; c++)
                          if (u = i[c], u.getAttribute("href") === (e.href == null || e.href === "" ? null : e.href) && u.getAttribute("rel") === (e.rel == null ? null : e.rel) && u.getAttribute("title") === (e.title == null ? null : e.title) && u.getAttribute("crossorigin") === (e.crossOrigin == null ? null : e.crossOrigin)) {
                            i.splice(c, 1);
                            break l;
                          }
                      }
                      u = n.createElement(a), cl(u, a, e), n.head.appendChild(u);
                      break;
                    case "meta":
                      if (i = Sd(
                        "meta",
                        "content",
                        n
                      ).get(a + (e.content || ""))) {
                        for (c = 0; c < i.length; c++)
                          if (u = i[c], u.getAttribute("content") === (e.content == null ? null : "" + e.content) && u.getAttribute("name") === (e.name == null ? null : e.name) && u.getAttribute("property") === (e.property == null ? null : e.property) && u.getAttribute("http-equiv") === (e.httpEquiv == null ? null : e.httpEquiv) && u.getAttribute("charset") === (e.charSet == null ? null : e.charSet)) {
                            i.splice(c, 1);
                            break l;
                          }
                      }
                      u = n.createElement(a), cl(u, a, e), n.head.appendChild(u);
                      break;
                    default:
                      throw Error(s(468, a));
                  }
                  u[al] = t, tl(u), a = u;
                }
                t.stateNode = a;
              } else
                zd(
                  n,
                  t.type,
                  t.stateNode
                );
            else
              t.stateNode = xd(
                n,
                a,
                t.memoizedProps
              );
          else
            u !== a ? (u === null ? e.stateNode !== null && (e = e.stateNode, e.parentNode.removeChild(e)) : u.count--, a === null ? zd(
              n,
              t.type,
              t.stateNode
            ) : xd(
              n,
              a,
              t.memoizedProps
            )) : a === null && t.stateNode !== null && Gc(
              t,
              t.memoizedProps,
              e.memoizedProps
            );
        }
        break;
      case 27:
        vl(l, t), gl(t), a & 512 && (Wt || e === null || Kl(e, e.return)), e !== null && a & 4 && Gc(
          t,
          t.memoizedProps,
          e.memoizedProps
        );
        break;
      case 5:
        if (vl(l, t), gl(t), a & 512 && (Wt || e === null || Kl(e, e.return)), t.flags & 32) {
          n = t.stateNode;
          try {
            za(n, "");
          } catch (J) {
            At(t, t.return, J);
          }
        }
        a & 4 && t.stateNode != null && (n = t.memoizedProps, Gc(
          t,
          n,
          e !== null ? e.memoizedProps : n
        )), a & 1024 && (Zc = !0);
        break;
      case 6:
        if (vl(l, t), gl(t), a & 4) {
          if (t.stateNode === null)
            throw Error(s(162));
          a = t.memoizedProps, e = t.stateNode;
          try {
            e.nodeValue = a;
          } catch (J) {
            At(t, t.return, J);
          }
        }
        break;
      case 3:
        if (ti = null, n = Gl, Gl = Iu(l.containerInfo), vl(l, t), Gl = n, gl(t), a & 4 && e !== null && e.memoizedState.isDehydrated)
          try {
            Pa(l.containerInfo);
          } catch (J) {
            At(t, t.return, J);
          }
        Zc && (Zc = !1, zr(t));
        break;
      case 4:
        a = Gl, Gl = Iu(
          t.stateNode.containerInfo
        ), vl(l, t), gl(t), Gl = a;
        break;
      case 12:
        vl(l, t), gl(t);
        break;
      case 31:
        vl(l, t), gl(t), a & 4 && (a = t.updateQueue, a !== null && (t.updateQueue = null, qu(t, a)));
        break;
      case 13:
        vl(l, t), gl(t), t.child.flags & 8192 && t.memoizedState !== null != (e !== null && e.memoizedState !== null) && (Xu = Pt()), a & 4 && (a = t.updateQueue, a !== null && (t.updateQueue = null, qu(t, a)));
        break;
      case 22:
        n = t.memoizedState !== null;
        var d = e !== null && e.memoizedState !== null, p = ie, E = Wt;
        if (ie = p || n, Wt = E || d, vl(l, t), Wt = E, ie = p, gl(t), a & 8192)
          t: for (l = t.stateNode, l._visibility = n ? l._visibility & -2 : l._visibility | 1, n && (e === null || d || ie || Wt || ca(t)), e = null, l = t; ; ) {
            if (l.tag === 5 || l.tag === 26) {
              if (e === null) {
                d = e = l;
                try {
                  if (u = d.stateNode, n)
                    i = u.style, typeof i.setProperty == "function" ? i.setProperty("display", "none", "important") : i.display = "none";
                  else {
                    c = d.stateNode;
                    var N = d.memoizedProps.style, x = N != null && N.hasOwnProperty("display") ? N.display : null;
                    c.style.display = x == null || typeof x == "boolean" ? "" : ("" + x).trim();
                  }
                } catch (J) {
                  At(d, d.return, J);
                }
              }
            } else if (l.tag === 6) {
              if (e === null) {
                d = l;
                try {
                  d.stateNode.nodeValue = n ? "" : d.memoizedProps;
                } catch (J) {
                  At(d, d.return, J);
                }
              }
            } else if (l.tag === 18) {
              if (e === null) {
                d = l;
                try {
                  var z = d.stateNode;
                  n ? rd(z, !0) : rd(d.stateNode, !1);
                } catch (J) {
                  At(d, d.return, J);
                }
              }
            } else if ((l.tag !== 22 && l.tag !== 23 || l.memoizedState === null || l === t) && l.child !== null) {
              l.child.return = l, l = l.child;
              continue;
            }
            if (l === t) break t;
            for (; l.sibling === null; ) {
              if (l.return === null || l.return === t) break t;
              e === l && (e = null), l = l.return;
            }
            e === l && (e = null), l.sibling.return = l.return, l = l.sibling;
          }
        a & 4 && (a = t.updateQueue, a !== null && (e = a.retryQueue, e !== null && (a.retryQueue = null, qu(t, e))));
        break;
      case 19:
        vl(l, t), gl(t), a & 4 && (a = t.updateQueue, a !== null && (t.updateQueue = null, qu(t, a)));
        break;
      case 30:
        break;
      case 21:
        break;
      default:
        vl(l, t), gl(t);
    }
  }
  function gl(t) {
    var l = t.flags;
    if (l & 2) {
      try {
        for (var e, a = t.return; a !== null; ) {
          if (mr(a)) {
            e = a;
            break;
          }
          a = a.return;
        }
        if (e == null) throw Error(s(160));
        switch (e.tag) {
          case 27:
            var n = e.stateNode, u = Lc(t);
            Yu(t, u, n);
            break;
          case 5:
            var i = e.stateNode;
            e.flags & 32 && (za(i, ""), e.flags &= -33);
            var c = Lc(t);
            Yu(t, c, i);
            break;
          case 3:
          case 4:
            var d = e.stateNode.containerInfo, p = Lc(t);
            Qc(
              t,
              p,
              d
            );
            break;
          default:
            throw Error(s(161));
        }
      } catch (E) {
        At(t, t.return, E);
      }
      t.flags &= -3;
    }
    l & 4096 && (t.flags &= -4097);
  }
  function zr(t) {
    if (t.subtreeFlags & 1024)
      for (t = t.child; t !== null; ) {
        var l = t;
        zr(l), l.tag === 5 && l.flags & 1024 && l.stateNode.reset(), t = t.sibling;
      }
  }
  function fe(t, l) {
    if (l.subtreeFlags & 8772)
      for (l = l.child; l !== null; )
        vr(t, l.alternate, l), l = l.sibling;
  }
  function ca(t) {
    for (t = t.child; t !== null; ) {
      var l = t;
      switch (l.tag) {
        case 0:
        case 11:
        case 14:
        case 15:
          _e(4, l, l.return), ca(l);
          break;
        case 1:
          Kl(l, l.return);
          var e = l.stateNode;
          typeof e.componentWillUnmount == "function" && rr(
            l,
            l.return,
            e
          ), ca(l);
          break;
        case 27:
          Zn(l.stateNode);
        case 26:
        case 5:
          Kl(l, l.return), ca(l);
          break;
        case 22:
          l.memoizedState === null && ca(l);
          break;
        case 30:
          ca(l);
          break;
        default:
          ca(l);
      }
      t = t.sibling;
    }
  }
  function oe(t, l, e) {
    for (e = e && (l.subtreeFlags & 8772) !== 0, l = l.child; l !== null; ) {
      var a = l.alternate, n = t, u = l, i = u.flags;
      switch (u.tag) {
        case 0:
        case 11:
        case 15:
          oe(
            n,
            u,
            e
          ), Rn(4, u);
          break;
        case 1:
          if (oe(
            n,
            u,
            e
          ), a = u, n = a.stateNode, typeof n.componentDidMount == "function")
            try {
              n.componentDidMount();
            } catch (p) {
              At(a, a.return, p);
            }
          if (a = u, n = a.updateQueue, n !== null) {
            var c = a.stateNode;
            try {
              var d = n.shared.hiddenCallbacks;
              if (d !== null)
                for (n.shared.hiddenCallbacks = null, n = 0; n < d.length; n++)
                  Po(d[n], c);
            } catch (p) {
              At(a, a.return, p);
            }
          }
          e && i & 64 && sr(u), Hn(u, u.return);
          break;
        case 27:
          hr(u);
        case 26:
        case 5:
          oe(
            n,
            u,
            e
          ), e && a === null && i & 4 && dr(u), Hn(u, u.return);
          break;
        case 12:
          oe(
            n,
            u,
            e
          );
          break;
        case 31:
          oe(
            n,
            u,
            e
          ), e && i & 4 && br(n, u);
          break;
        case 13:
          oe(
            n,
            u,
            e
          ), e && i & 4 && xr(n, u);
          break;
        case 22:
          u.memoizedState === null && oe(
            n,
            u,
            e
          ), Hn(u, u.return);
          break;
        case 30:
          break;
        default:
          oe(
            n,
            u,
            e
          );
      }
      l = l.sibling;
    }
  }
  function Vc(t, l) {
    var e = null;
    t !== null && t.memoizedState !== null && t.memoizedState.cachePool !== null && (e = t.memoizedState.cachePool.pool), t = null, l.memoizedState !== null && l.memoizedState.cachePool !== null && (t = l.memoizedState.cachePool.pool), t !== e && (t != null && t.refCount++, e != null && Sn(e));
  }
  function Kc(t, l) {
    t = null, l.alternate !== null && (t = l.alternate.memoizedState.cache), l = l.memoizedState.cache, l !== t && (l.refCount++, t != null && Sn(t));
  }
  function Ll(t, l, e, a) {
    if (l.subtreeFlags & 10256)
      for (l = l.child; l !== null; )
        Er(
          t,
          l,
          e,
          a
        ), l = l.sibling;
  }
  function Er(t, l, e, a) {
    var n = l.flags;
    switch (l.tag) {
      case 0:
      case 11:
      case 15:
        Ll(
          t,
          l,
          e,
          a
        ), n & 2048 && Rn(9, l);
        break;
      case 1:
        Ll(
          t,
          l,
          e,
          a
        );
        break;
      case 3:
        Ll(
          t,
          l,
          e,
          a
        ), n & 2048 && (t = null, l.alternate !== null && (t = l.alternate.memoizedState.cache), l = l.memoizedState.cache, l !== t && (l.refCount++, t != null && Sn(t)));
        break;
      case 12:
        if (n & 2048) {
          Ll(
            t,
            l,
            e,
            a
          ), t = l.stateNode;
          try {
            var u = l.memoizedProps, i = u.id, c = u.onPostCommit;
            typeof c == "function" && c(
              i,
              l.alternate === null ? "mount" : "update",
              t.passiveEffectDuration,
              -0
            );
          } catch (d) {
            At(l, l.return, d);
          }
        } else
          Ll(
            t,
            l,
            e,
            a
          );
        break;
      case 31:
        Ll(
          t,
          l,
          e,
          a
        );
        break;
      case 13:
        Ll(
          t,
          l,
          e,
          a
        );
        break;
      case 23:
        break;
      case 22:
        u = l.stateNode, i = l.alternate, l.memoizedState !== null ? u._visibility & 2 ? Ll(
          t,
          l,
          e,
          a
        ) : Bn(t, l) : u._visibility & 2 ? Ll(
          t,
          l,
          e,
          a
        ) : (u._visibility |= 2, La(
          t,
          l,
          e,
          a,
          (l.subtreeFlags & 10256) !== 0 || !1
        )), n & 2048 && Vc(i, l);
        break;
      case 24:
        Ll(
          t,
          l,
          e,
          a
        ), n & 2048 && Kc(l.alternate, l);
        break;
      default:
        Ll(
          t,
          l,
          e,
          a
        );
    }
  }
  function La(t, l, e, a, n) {
    for (n = n && ((l.subtreeFlags & 10256) !== 0 || !1), l = l.child; l !== null; ) {
      var u = t, i = l, c = e, d = a, p = i.flags;
      switch (i.tag) {
        case 0:
        case 11:
        case 15:
          La(
            u,
            i,
            c,
            d,
            n
          ), Rn(8, i);
          break;
        case 23:
          break;
        case 22:
          var E = i.stateNode;
          i.memoizedState !== null ? E._visibility & 2 ? La(
            u,
            i,
            c,
            d,
            n
          ) : Bn(
            u,
            i
          ) : (E._visibility |= 2, La(
            u,
            i,
            c,
            d,
            n
          )), n && p & 2048 && Vc(
            i.alternate,
            i
          );
          break;
        case 24:
          La(
            u,
            i,
            c,
            d,
            n
          ), n && p & 2048 && Kc(i.alternate, i);
          break;
        default:
          La(
            u,
            i,
            c,
            d,
            n
          );
      }
      l = l.sibling;
    }
  }
  function Bn(t, l) {
    if (l.subtreeFlags & 10256)
      for (l = l.child; l !== null; ) {
        var e = t, a = l, n = a.flags;
        switch (a.tag) {
          case 22:
            Bn(e, a), n & 2048 && Vc(
              a.alternate,
              a
            );
            break;
          case 24:
            Bn(e, a), n & 2048 && Kc(a.alternate, a);
            break;
          default:
            Bn(e, a);
        }
        l = l.sibling;
      }
  }
  var Yn = 8192;
  function Qa(t, l, e) {
    if (t.subtreeFlags & Yn)
      for (t = t.child; t !== null; )
        Tr(
          t,
          l,
          e
        ), t = t.sibling;
  }
  function Tr(t, l, e) {
    switch (t.tag) {
      case 26:
        Qa(
          t,
          l,
          e
        ), t.flags & Yn && t.memoizedState !== null && h0(
          e,
          Gl,
          t.memoizedState,
          t.memoizedProps
        );
        break;
      case 5:
        Qa(
          t,
          l,
          e
        );
        break;
      case 3:
      case 4:
        var a = Gl;
        Gl = Iu(t.stateNode.containerInfo), Qa(
          t,
          l,
          e
        ), Gl = a;
        break;
      case 22:
        t.memoizedState === null && (a = t.alternate, a !== null && a.memoizedState !== null ? (a = Yn, Yn = 16777216, Qa(
          t,
          l,
          e
        ), Yn = a) : Qa(
          t,
          l,
          e
        ));
        break;
      default:
        Qa(
          t,
          l,
          e
        );
    }
  }
  function Mr(t) {
    var l = t.alternate;
    if (l !== null && (t = l.child, t !== null)) {
      l.child = null;
      do
        l = t.sibling, t.sibling = null, t = l;
      while (t !== null);
    }
  }
  function qn(t) {
    var l = t.deletions;
    if ((t.flags & 16) !== 0) {
      if (l !== null)
        for (var e = 0; e < l.length; e++) {
          var a = l[e];
          ll = a, Ar(
            a,
            t
          );
        }
      Mr(t);
    }
    if (t.subtreeFlags & 10256)
      for (t = t.child; t !== null; )
        _r(t), t = t.sibling;
  }
  function _r(t) {
    switch (t.tag) {
      case 0:
      case 11:
      case 15:
        qn(t), t.flags & 2048 && _e(9, t, t.return);
        break;
      case 3:
        qn(t);
        break;
      case 12:
        qn(t);
        break;
      case 22:
        var l = t.stateNode;
        t.memoizedState !== null && l._visibility & 2 && (t.return === null || t.return.tag !== 13) ? (l._visibility &= -3, wu(t)) : qn(t);
        break;
      default:
        qn(t);
    }
  }
  function wu(t) {
    var l = t.deletions;
    if ((t.flags & 16) !== 0) {
      if (l !== null)
        for (var e = 0; e < l.length; e++) {
          var a = l[e];
          ll = a, Ar(
            a,
            t
          );
        }
      Mr(t);
    }
    for (t = t.child; t !== null; ) {
      switch (l = t, l.tag) {
        case 0:
        case 11:
        case 15:
          _e(8, l, l.return), wu(l);
          break;
        case 22:
          e = l.stateNode, e._visibility & 2 && (e._visibility &= -3, wu(l));
          break;
        default:
          wu(l);
      }
      t = t.sibling;
    }
  }
  function Ar(t, l) {
    for (; ll !== null; ) {
      var e = ll;
      switch (e.tag) {
        case 0:
        case 11:
        case 15:
          _e(8, e, l);
          break;
        case 23:
        case 22:
          if (e.memoizedState !== null && e.memoizedState.cachePool !== null) {
            var a = e.memoizedState.cachePool.pool;
            a != null && a.refCount++;
          }
          break;
        case 24:
          Sn(e.memoizedState.cache);
      }
      if (a = e.child, a !== null) a.return = e, ll = a;
      else
        t: for (e = t; ll !== null; ) {
          a = ll;
          var n = a.sibling, u = a.return;
          if (gr(a), a === e) {
            ll = null;
            break t;
          }
          if (n !== null) {
            n.return = u, ll = n;
            break t;
          }
          ll = u;
        }
    }
  }
  var Nh = {
    getCacheForType: function(t) {
      var l = ul(kt), e = l.data.get(t);
      return e === void 0 && (e = t(), l.data.set(t, e)), e;
    },
    cacheSignal: function() {
      return ul(kt).controller.signal;
    }
  }, Ch = typeof WeakMap == "function" ? WeakMap : Map, Tt = 0, jt = null, dt = null, ht = 0, _t = 0, Al = null, Ae = !1, Za = !1, kc = !1, se = 0, Gt = 0, De = 0, fa = 0, Jc = 0, Dl = 0, Va = 0, wn = null, pl = null, $c = !1, Xu = 0, Dr = 0, Gu = 1 / 0, Lu = null, Ne = null, It = 0, Ce = null, Ka = null, re = 0, Wc = 0, Fc = null, Nr = null, Xn = 0, Ic = null;
  function Nl() {
    return (Tt & 2) !== 0 && ht !== 0 ? ht & -ht : y.T !== null ? nf() : Zf();
  }
  function Cr() {
    if (Dl === 0)
      if ((ht & 536870912) === 0 || vt) {
        var t = Ve;
        Ve <<= 1, (Ve & 3932160) === 0 && (Ve = 262144), Dl = t;
      } else Dl = 536870912;
    return t = Ml.current, t !== null && (t.flags |= 32), Dl;
  }
  function bl(t, l, e) {
    (t === jt && (_t === 2 || _t === 9) || t.cancelPendingCommit !== null) && (ka(t, 0), je(
      t,
      ht,
      Dl,
      !1
    )), cn(t, e), ((Tt & 2) === 0 || t !== jt) && (t === jt && ((Tt & 2) === 0 && (fa |= e), Gt === 4 && je(
      t,
      ht,
      Dl,
      !1
    )), kl(t));
  }
  function jr(t, l, e) {
    if ((Tt & 6) !== 0) throw Error(s(327));
    var a = !e && (l & 127) === 0 && (l & t.expiredLanes) === 0 || dl(t, l), n = a ? Uh(t, l) : tf(t, l, !0), u = a;
    do {
      if (n === 0) {
        Za && !a && je(t, l, 0, !1);
        break;
      } else {
        if (e = t.current.alternate, u && !jh(e)) {
          n = tf(t, l, !1), u = !1;
          continue;
        }
        if (n === 2) {
          if (u = l, t.errorRecoveryDisabledLanes & u)
            var i = 0;
          else
            i = t.pendingLanes & -536870913, i = i !== 0 ? i : i & 536870912 ? 536870912 : 0;
          if (i !== 0) {
            l = i;
            t: {
              var c = t;
              n = wn;
              var d = c.current.memoizedState.isDehydrated;
              if (d && (ka(c, i).flags |= 256), i = tf(
                c,
                i,
                !1
              ), i !== 2) {
                if (kc && !d) {
                  c.errorRecoveryDisabledLanes |= u, fa |= u, n = 4;
                  break t;
                }
                u = pl, pl = n, u !== null && (pl === null ? pl = u : pl.push.apply(
                  pl,
                  u
                ));
              }
              n = i;
            }
            if (u = !1, n !== 2) continue;
          }
        }
        if (n === 1) {
          ka(t, 0), je(t, l, 0, !0);
          break;
        }
        t: {
          switch (a = t, u = n, u) {
            case 0:
            case 1:
              throw Error(s(345));
            case 4:
              if ((l & 4194048) !== l) break;
            case 6:
              je(
                a,
                l,
                Dl,
                !Ae
              );
              break t;
            case 2:
              pl = null;
              break;
            case 3:
            case 5:
              break;
            default:
              throw Error(s(329));
          }
          if ((l & 62914560) === l && (n = Xu + 300 - Pt(), 10 < n)) {
            if (je(
              a,
              l,
              Dl,
              !Ae
            ), zl(a, 0, !0) !== 0) break t;
            re = l, a.timeoutHandle = fd(
              Or.bind(
                null,
                a,
                e,
                pl,
                Lu,
                $c,
                l,
                Dl,
                fa,
                Va,
                Ae,
                u,
                "Throttled",
                -0,
                0
              ),
              n
            );
            break t;
          }
          Or(
            a,
            e,
            pl,
            Lu,
            $c,
            l,
            Dl,
            fa,
            Va,
            Ae,
            u,
            null,
            -0,
            0
          );
        }
      }
      break;
    } while (!0);
    kl(t);
  }
  function Or(t, l, e, a, n, u, i, c, d, p, E, N, x, z) {
    if (t.timeoutHandle = -1, N = l.subtreeFlags, N & 8192 || (N & 16785408) === 16785408) {
      N = {
        stylesheets: null,
        count: 0,
        imgCount: 0,
        imgBytes: 0,
        suspenseyImages: [],
        waitingForImages: !0,
        waitingForViewTransition: !1,
        unsuspend: Wl
      }, Tr(
        l,
        u,
        N
      );
      var J = (u & 62914560) === u ? Xu - Pt() : (u & 4194048) === u ? Dr - Pt() : 0;
      if (J = y0(
        N,
        J
      ), J !== null) {
        re = u, t.cancelPendingCommit = J(
          Xr.bind(
            null,
            t,
            l,
            u,
            e,
            a,
            n,
            i,
            c,
            d,
            E,
            N,
            null,
            x,
            z
          )
        ), je(t, u, i, !p);
        return;
      }
    }
    Xr(
      t,
      l,
      u,
      e,
      a,
      n,
      i,
      c,
      d
    );
  }
  function jh(t) {
    for (var l = t; ; ) {
      var e = l.tag;
      if ((e === 0 || e === 11 || e === 15) && l.flags & 16384 && (e = l.updateQueue, e !== null && (e = e.stores, e !== null)))
        for (var a = 0; a < e.length; a++) {
          var n = e[a], u = n.getSnapshot;
          n = n.value;
          try {
            if (!El(u(), n)) return !1;
          } catch {
            return !1;
          }
        }
      if (e = l.child, l.subtreeFlags & 16384 && e !== null)
        e.return = l, l = e;
      else {
        if (l === t) break;
        for (; l.sibling === null; ) {
          if (l.return === null || l.return === t) return !0;
          l = l.return;
        }
        l.sibling.return = l.return, l = l.sibling;
      }
    }
    return !0;
  }
  function je(t, l, e, a) {
    l &= ~Jc, l &= ~fa, t.suspendedLanes |= l, t.pingedLanes &= ~l, a && (t.warmLanes |= l), a = t.expirationTimes;
    for (var n = l; 0 < n; ) {
      var u = 31 - el(n), i = 1 << u;
      a[u] = -1, n &= ~i;
    }
    e !== 0 && Gf(t, e, l);
  }
  function Qu() {
    return (Tt & 6) === 0 ? (Gn(0), !1) : !0;
  }
  function Pc() {
    if (dt !== null) {
      if (_t === 0)
        var t = dt.return;
      else
        t = dt, te = Pe = null, yc(t), Ya = null, En = 0, t = dt;
      for (; t !== null; )
        or(t.alternate, t), t = t.return;
      dt = null;
    }
  }
  function ka(t, l) {
    var e = t.timeoutHandle;
    e !== -1 && (t.timeoutHandle = -1, Fh(e)), e = t.cancelPendingCommit, e !== null && (t.cancelPendingCommit = null, e()), re = 0, Pc(), jt = t, dt = e = Il(t.current, null), ht = l, _t = 0, Al = null, Ae = !1, Za = dl(t, l), kc = !1, Va = Dl = Jc = fa = De = Gt = 0, pl = wn = null, $c = !1, (l & 8) !== 0 && (l |= l & 32);
    var a = t.entangledLanes;
    if (a !== 0)
      for (t = t.entanglements, a &= l; 0 < a; ) {
        var n = 31 - el(a), u = 1 << n;
        l |= t[n], a &= ~u;
      }
    return se = l, su(), e;
  }
  function Ur(t, l) {
    ct = null, y.H = jn, l === Ba || l === pu ? (l = $o(), _t = 3) : l === ac ? (l = $o(), _t = 4) : _t = l === jc ? 8 : l !== null && typeof l == "object" && typeof l.then == "function" ? 6 : 1, Al = l, dt === null && (Gt = 1, Ou(
      t,
      Ul(l, t.current)
    ));
  }
  function Rr() {
    var t = Ml.current;
    return t === null ? !0 : (ht & 4194048) === ht ? Yl === null : (ht & 62914560) === ht || (ht & 536870912) !== 0 ? t === Yl : !1;
  }
  function Hr() {
    var t = y.H;
    return y.H = jn, t === null ? jn : t;
  }
  function Br() {
    var t = y.A;
    return y.A = Nh, t;
  }
  function Zu() {
    Gt = 4, Ae || (ht & 4194048) !== ht && Ml.current !== null || (Za = !0), (De & 134217727) === 0 && (fa & 134217727) === 0 || jt === null || je(
      jt,
      ht,
      Dl,
      !1
    );
  }
  function tf(t, l, e) {
    var a = Tt;
    Tt |= 2;
    var n = Hr(), u = Br();
    (jt !== t || ht !== l) && (Lu = null, ka(t, l)), l = !1;
    var i = Gt;
    t: do
      try {
        if (_t !== 0 && dt !== null) {
          var c = dt, d = Al;
          switch (_t) {
            case 8:
              Pc(), i = 6;
              break t;
            case 3:
            case 2:
            case 9:
            case 6:
              Ml.current === null && (l = !0);
              var p = _t;
              if (_t = 0, Al = null, Ja(t, c, d, p), e && Za) {
                i = 0;
                break t;
              }
              break;
            default:
              p = _t, _t = 0, Al = null, Ja(t, c, d, p);
          }
        }
        Oh(), i = Gt;
        break;
      } catch (E) {
        Ur(t, E);
      }
    while (!0);
    return l && t.shellSuspendCounter++, te = Pe = null, Tt = a, y.H = n, y.A = u, dt === null && (jt = null, ht = 0, su()), i;
  }
  function Oh() {
    for (; dt !== null; ) Yr(dt);
  }
  function Uh(t, l) {
    var e = Tt;
    Tt |= 2;
    var a = Hr(), n = Br();
    jt !== t || ht !== l ? (Lu = null, Gu = Pt() + 500, ka(t, l)) : Za = dl(
      t,
      l
    );
    t: do
      try {
        if (_t !== 0 && dt !== null) {
          l = dt;
          var u = Al;
          l: switch (_t) {
            case 1:
              _t = 0, Al = null, Ja(t, l, u, 1);
              break;
            case 2:
            case 9:
              if (ko(u)) {
                _t = 0, Al = null, qr(l);
                break;
              }
              l = function() {
                _t !== 2 && _t !== 9 || jt !== t || (_t = 7), kl(t);
              }, u.then(l, l);
              break t;
            case 3:
              _t = 7;
              break t;
            case 4:
              _t = 5;
              break t;
            case 7:
              ko(u) ? (_t = 0, Al = null, qr(l)) : (_t = 0, Al = null, Ja(t, l, u, 7));
              break;
            case 5:
              var i = null;
              switch (dt.tag) {
                case 26:
                  i = dt.memoizedState;
                case 5:
                case 27:
                  var c = dt;
                  if (i ? Ed(i) : c.stateNode.complete) {
                    _t = 0, Al = null;
                    var d = c.sibling;
                    if (d !== null) dt = d;
                    else {
                      var p = c.return;
                      p !== null ? (dt = p, Vu(p)) : dt = null;
                    }
                    break l;
                  }
              }
              _t = 0, Al = null, Ja(t, l, u, 5);
              break;
            case 6:
              _t = 0, Al = null, Ja(t, l, u, 6);
              break;
            case 8:
              Pc(), Gt = 6;
              break t;
            default:
              throw Error(s(462));
          }
        }
        Rh();
        break;
      } catch (E) {
        Ur(t, E);
      }
    while (!0);
    return te = Pe = null, y.H = a, y.A = n, Tt = e, dt !== null ? 0 : (jt = null, ht = 0, su(), Gt);
  }
  function Rh() {
    for (; dt !== null && !di(); )
      Yr(dt);
  }
  function Yr(t) {
    var l = cr(t.alternate, t, se);
    t.memoizedProps = t.pendingProps, l === null ? Vu(t) : dt = l;
  }
  function qr(t) {
    var l = t, e = l.alternate;
    switch (l.tag) {
      case 15:
      case 0:
        l = lr(
          e,
          l,
          l.pendingProps,
          l.type,
          void 0,
          ht
        );
        break;
      case 11:
        l = lr(
          e,
          l,
          l.pendingProps,
          l.type.render,
          l.ref,
          ht
        );
        break;
      case 5:
        yc(l);
      default:
        or(e, l), l = dt = Bo(l, se), l = cr(e, l, se);
    }
    t.memoizedProps = t.pendingProps, l === null ? Vu(t) : dt = l;
  }
  function Ja(t, l, e, a) {
    te = Pe = null, yc(l), Ya = null, En = 0;
    var n = l.return;
    try {
      if (zh(
        t,
        n,
        l,
        e,
        ht
      )) {
        Gt = 1, Ou(
          t,
          Ul(e, t.current)
        ), dt = null;
        return;
      }
    } catch (u) {
      if (n !== null) throw dt = n, u;
      Gt = 1, Ou(
        t,
        Ul(e, t.current)
      ), dt = null;
      return;
    }
    l.flags & 32768 ? (vt || a === 1 ? t = !0 : Za || (ht & 536870912) !== 0 ? t = !1 : (Ae = t = !0, (a === 2 || a === 9 || a === 3 || a === 6) && (a = Ml.current, a !== null && a.tag === 13 && (a.flags |= 16384))), wr(l, t)) : Vu(l);
  }
  function Vu(t) {
    var l = t;
    do {
      if ((l.flags & 32768) !== 0) {
        wr(
          l,
          Ae
        );
        return;
      }
      t = l.return;
      var e = Mh(
        l.alternate,
        l,
        se
      );
      if (e !== null) {
        dt = e;
        return;
      }
      if (l = l.sibling, l !== null) {
        dt = l;
        return;
      }
      dt = l = t;
    } while (l !== null);
    Gt === 0 && (Gt = 5);
  }
  function wr(t, l) {
    do {
      var e = _h(t.alternate, t);
      if (e !== null) {
        e.flags &= 32767, dt = e;
        return;
      }
      if (e = t.return, e !== null && (e.flags |= 32768, e.subtreeFlags = 0, e.deletions = null), !l && (t = t.sibling, t !== null)) {
        dt = t;
        return;
      }
      dt = t = e;
    } while (t !== null);
    Gt = 6, dt = null;
  }
  function Xr(t, l, e, a, n, u, i, c, d) {
    t.cancelPendingCommit = null;
    do
      Ku();
    while (It !== 0);
    if ((Tt & 6) !== 0) throw Error(s(327));
    if (l !== null) {
      if (l === t.current) throw Error(s(177));
      if (u = l.lanes | l.childLanes, u |= Li, mm(
        t,
        e,
        u,
        i,
        c,
        d
      ), t === jt && (dt = jt = null, ht = 0), Ka = l, Ce = t, re = e, Wc = u, Fc = n, Nr = a, (l.subtreeFlags & 10256) !== 0 || (l.flags & 10256) !== 0 ? (t.callbackNode = null, t.callbackPriority = 0, qh(wt, function() {
        return Vr(), null;
      })) : (t.callbackNode = null, t.callbackPriority = 0), a = (l.flags & 13878) !== 0, (l.subtreeFlags & 13878) !== 0 || a) {
        a = y.T, y.T = null, n = C.p, C.p = 2, i = Tt, Tt |= 4;
        try {
          Ah(t, l, e);
        } finally {
          Tt = i, C.p = n, y.T = a;
        }
      }
      It = 1, Gr(), Lr(), Qr();
    }
  }
  function Gr() {
    if (It === 1) {
      It = 0;
      var t = Ce, l = Ka, e = (l.flags & 13878) !== 0;
      if ((l.subtreeFlags & 13878) !== 0 || e) {
        e = y.T, y.T = null;
        var a = C.p;
        C.p = 2;
        var n = Tt;
        Tt |= 4;
        try {
          Sr(l, t);
          var u = mf, i = Ao(t.containerInfo), c = u.focusedElem, d = u.selectionRange;
          if (i !== c && c && c.ownerDocument && _o(
            c.ownerDocument.documentElement,
            c
          )) {
            if (d !== null && Yi(c)) {
              var p = d.start, E = d.end;
              if (E === void 0 && (E = p), "selectionStart" in c)
                c.selectionStart = p, c.selectionEnd = Math.min(
                  E,
                  c.value.length
                );
              else {
                var N = c.ownerDocument || document, x = N && N.defaultView || window;
                if (x.getSelection) {
                  var z = x.getSelection(), J = c.textContent.length, at = Math.min(d.start, J), Ct = d.end === void 0 ? at : Math.min(d.end, J);
                  !z.extend && at > Ct && (i = Ct, Ct = at, at = i);
                  var v = Mo(
                    c,
                    at
                  ), h = Mo(
                    c,
                    Ct
                  );
                  if (v && h && (z.rangeCount !== 1 || z.anchorNode !== v.node || z.anchorOffset !== v.offset || z.focusNode !== h.node || z.focusOffset !== h.offset)) {
                    var g = N.createRange();
                    g.setStart(v.node, v.offset), z.removeAllRanges(), at > Ct ? (z.addRange(g), z.extend(h.node, h.offset)) : (g.setEnd(h.node, h.offset), z.addRange(g));
                  }
                }
              }
            }
            for (N = [], z = c; z = z.parentNode; )
              z.nodeType === 1 && N.push({
                element: z,
                left: z.scrollLeft,
                top: z.scrollTop
              });
            for (typeof c.focus == "function" && c.focus(), c = 0; c < N.length; c++) {
              var A = N[c];
              A.element.scrollLeft = A.left, A.element.scrollTop = A.top;
            }
          }
          ni = !!df, mf = df = null;
        } finally {
          Tt = n, C.p = a, y.T = e;
        }
      }
      t.current = l, It = 2;
    }
  }
  function Lr() {
    if (It === 2) {
      It = 0;
      var t = Ce, l = Ka, e = (l.flags & 8772) !== 0;
      if ((l.subtreeFlags & 8772) !== 0 || e) {
        e = y.T, y.T = null;
        var a = C.p;
        C.p = 2;
        var n = Tt;
        Tt |= 4;
        try {
          vr(t, l.alternate, l);
        } finally {
          Tt = n, C.p = a, y.T = e;
        }
      }
      It = 3;
    }
  }
  function Qr() {
    if (It === 4 || It === 3) {
      It = 0, nn();
      var t = Ce, l = Ka, e = re, a = Nr;
      (l.subtreeFlags & 10256) !== 0 || (l.flags & 10256) !== 0 ? It = 5 : (It = 0, Ka = Ce = null, Zr(t, t.pendingLanes));
      var n = t.pendingLanes;
      if (n === 0 && (Ne = null), pi(e), l = l.stateNode, Ot && typeof Ot.onCommitFiberRoot == "function")
        try {
          Ot.onCommitFiberRoot(
            Q,
            l,
            void 0,
            (l.current.flags & 128) === 128
          );
        } catch {
        }
      if (a !== null) {
        l = y.T, n = C.p, C.p = 2, y.T = null;
        try {
          for (var u = t.onRecoverableError, i = 0; i < a.length; i++) {
            var c = a[i];
            u(c.value, {
              componentStack: c.stack
            });
          }
        } finally {
          y.T = l, C.p = n;
        }
      }
      (re & 3) !== 0 && Ku(), kl(t), n = t.pendingLanes, (e & 261930) !== 0 && (n & 42) !== 0 ? t === Ic ? Xn++ : (Xn = 0, Ic = t) : Xn = 0, Gn(0);
    }
  }
  function Zr(t, l) {
    (t.pooledCacheLanes &= l) === 0 && (l = t.pooledCache, l != null && (t.pooledCache = null, Sn(l)));
  }
  function Ku() {
    return Gr(), Lr(), Qr(), Vr();
  }
  function Vr() {
    if (It !== 5) return !1;
    var t = Ce, l = Wc;
    Wc = 0;
    var e = pi(re), a = y.T, n = C.p;
    try {
      C.p = 32 > e ? 32 : e, y.T = null, e = Fc, Fc = null;
      var u = Ce, i = re;
      if (It = 0, Ka = Ce = null, re = 0, (Tt & 6) !== 0) throw Error(s(331));
      var c = Tt;
      if (Tt |= 4, _r(u.current), Er(
        u,
        u.current,
        i,
        e
      ), Tt = c, Gn(0, !1), Ot && typeof Ot.onPostCommitFiberRoot == "function")
        try {
          Ot.onPostCommitFiberRoot(Q, u);
        } catch {
        }
      return !0;
    } finally {
      C.p = n, y.T = a, Zr(t, l);
    }
  }
  function Kr(t, l, e) {
    l = Ul(e, l), l = Cc(t.stateNode, l, 2), t = Ee(t, l, 2), t !== null && (cn(t, 2), kl(t));
  }
  function At(t, l, e) {
    if (t.tag === 3)
      Kr(t, t, e);
    else
      for (; l !== null; ) {
        if (l.tag === 3) {
          Kr(
            l,
            t,
            e
          );
          break;
        } else if (l.tag === 1) {
          var a = l.stateNode;
          if (typeof l.type.getDerivedStateFromError == "function" || typeof a.componentDidCatch == "function" && (Ne === null || !Ne.has(a))) {
            t = Ul(e, t), e = ks(2), a = Ee(l, e, 2), a !== null && (Js(
              e,
              a,
              l,
              t
            ), cn(a, 2), kl(a));
            break;
          }
        }
        l = l.return;
      }
  }
  function lf(t, l, e) {
    var a = t.pingCache;
    if (a === null) {
      a = t.pingCache = new Ch();
      var n = /* @__PURE__ */ new Set();
      a.set(l, n);
    } else
      n = a.get(l), n === void 0 && (n = /* @__PURE__ */ new Set(), a.set(l, n));
    n.has(e) || (kc = !0, n.add(e), t = Hh.bind(null, t, l, e), l.then(t, t));
  }
  function Hh(t, l, e) {
    var a = t.pingCache;
    a !== null && a.delete(l), t.pingedLanes |= t.suspendedLanes & e, t.warmLanes &= ~e, jt === t && (ht & e) === e && (Gt === 4 || Gt === 3 && (ht & 62914560) === ht && 300 > Pt() - Xu ? (Tt & 2) === 0 && ka(t, 0) : Jc |= e, Va === ht && (Va = 0)), kl(t);
  }
  function kr(t, l) {
    l === 0 && (l = Xf()), t = We(t, l), t !== null && (cn(t, l), kl(t));
  }
  function Bh(t) {
    var l = t.memoizedState, e = 0;
    l !== null && (e = l.retryLane), kr(t, e);
  }
  function Yh(t, l) {
    var e = 0;
    switch (t.tag) {
      case 31:
      case 13:
        var a = t.stateNode, n = t.memoizedState;
        n !== null && (e = n.retryLane);
        break;
      case 19:
        a = t.stateNode;
        break;
      case 22:
        a = t.stateNode._retryCache;
        break;
      default:
        throw Error(s(314));
    }
    a !== null && a.delete(l), kr(t, e);
  }
  function qh(t, l) {
    return sa(t, l);
  }
  var ku = null, $a = null, ef = !1, Ju = !1, af = !1, Oe = 0;
  function kl(t) {
    t !== $a && t.next === null && ($a === null ? ku = $a = t : $a = $a.next = t), Ju = !0, ef || (ef = !0, Xh());
  }
  function Gn(t, l) {
    if (!af && Ju) {
      af = !0;
      do
        for (var e = !1, a = ku; a !== null; ) {
          if (t !== 0) {
            var n = a.pendingLanes;
            if (n === 0) var u = 0;
            else {
              var i = a.suspendedLanes, c = a.pingedLanes;
              u = (1 << 31 - el(42 | t) + 1) - 1, u &= n & ~(i & ~c), u = u & 201326741 ? u & 201326741 | 1 : u ? u | 2 : 0;
            }
            u !== 0 && (e = !0, Fr(a, u));
          } else
            u = ht, u = zl(
              a,
              a === jt ? u : 0,
              a.cancelPendingCommit !== null || a.timeoutHandle !== -1
            ), (u & 3) === 0 || dl(a, u) || (e = !0, Fr(a, u));
          a = a.next;
        }
      while (e);
      af = !1;
    }
  }
  function wh() {
    Jr();
  }
  function Jr() {
    Ju = ef = !1;
    var t = 0;
    Oe !== 0 && Wh() && (t = Oe);
    for (var l = Pt(), e = null, a = ku; a !== null; ) {
      var n = a.next, u = $r(a, l);
      u === 0 ? (a.next = null, e === null ? ku = n : e.next = n, n === null && ($a = e)) : (e = a, (t !== 0 || (u & 3) !== 0) && (Ju = !0)), a = n;
    }
    It !== 0 && It !== 5 || Gn(t), Oe !== 0 && (Oe = 0);
  }
  function $r(t, l) {
    for (var e = t.suspendedLanes, a = t.pingedLanes, n = t.expirationTimes, u = t.pendingLanes & -62914561; 0 < u; ) {
      var i = 31 - el(u), c = 1 << i, d = n[i];
      d === -1 ? ((c & e) === 0 || (c & a) !== 0) && (n[i] = ya(c, l)) : d <= l && (t.expiredLanes |= c), u &= ~c;
    }
    if (l = jt, e = ht, e = zl(
      t,
      t === l ? e : 0,
      t.cancelPendingCommit !== null || t.timeoutHandle !== -1
    ), a = t.callbackNode, e === 0 || t === l && (_t === 2 || _t === 9) || t.cancelPendingCommit !== null)
      return a !== null && a !== null && an(a), t.callbackNode = null, t.callbackPriority = 0;
    if ((e & 3) === 0 || dl(t, e)) {
      if (l = e & -e, l === t.callbackPriority) return l;
      switch (a !== null && an(a), pi(e)) {
        case 2:
        case 8:
          e = Qe;
          break;
        case 32:
          e = wt;
          break;
        case 268435456:
          e = he;
          break;
        default:
          e = wt;
      }
      return a = Wr.bind(null, t), e = sa(e, a), t.callbackPriority = l, t.callbackNode = e, l;
    }
    return a !== null && a !== null && an(a), t.callbackPriority = 2, t.callbackNode = null, 2;
  }
  function Wr(t, l) {
    if (It !== 0 && It !== 5)
      return t.callbackNode = null, t.callbackPriority = 0, null;
    var e = t.callbackNode;
    if (Ku() && t.callbackNode !== e)
      return null;
    var a = ht;
    return a = zl(
      t,
      t === jt ? a : 0,
      t.cancelPendingCommit !== null || t.timeoutHandle !== -1
    ), a === 0 ? null : (jr(t, a, l), $r(t, Pt()), t.callbackNode != null && t.callbackNode === e ? Wr.bind(null, t) : null);
  }
  function Fr(t, l) {
    if (Ku()) return null;
    jr(t, l, !0);
  }
  function Xh() {
    Ih(function() {
      (Tt & 6) !== 0 ? sa(
        Le,
        wh
      ) : Jr();
    });
  }
  function nf() {
    if (Oe === 0) {
      var t = Ra;
      t === 0 && (t = Ze, Ze <<= 1, (Ze & 261888) === 0 && (Ze = 256)), Oe = t;
    }
    return Oe;
  }
  function Ir(t) {
    return t == null || typeof t == "symbol" || typeof t == "boolean" ? null : typeof t == "function" ? t : eu("" + t);
  }
  function Pr(t, l) {
    var e = l.ownerDocument.createElement("input");
    return e.name = l.name, e.value = l.value, t.id && e.setAttribute("form", t.id), l.parentNode.insertBefore(e, l), t = new FormData(t), e.parentNode.removeChild(e), t;
  }
  function Gh(t, l, e, a, n) {
    if (l === "submit" && e && e.stateNode === n) {
      var u = Ir(
        (n[ml] || null).action
      ), i = a.submitter;
      i && (l = (l = i[ml] || null) ? Ir(l.formAction) : i.getAttribute("formAction"), l !== null && (u = l, i = null));
      var c = new iu(
        "action",
        "action",
        null,
        a,
        n
      );
      t.push({
        event: c,
        listeners: [
          {
            instance: null,
            listener: function() {
              if (a.defaultPrevented) {
                if (Oe !== 0) {
                  var d = i ? Pr(n, i) : new FormData(n);
                  Tc(
                    e,
                    {
                      pending: !0,
                      data: d,
                      method: n.method,
                      action: u
                    },
                    null,
                    d
                  );
                }
              } else
                typeof u == "function" && (c.preventDefault(), d = i ? Pr(n, i) : new FormData(n), Tc(
                  e,
                  {
                    pending: !0,
                    data: d,
                    method: n.method,
                    action: u
                  },
                  u,
                  d
                ));
            },
            currentTarget: n
          }
        ]
      });
    }
  }
  for (var uf = 0; uf < Gi.length; uf++) {
    var cf = Gi[uf], Lh = cf.toLowerCase(), Qh = cf[0].toUpperCase() + cf.slice(1);
    Xl(
      Lh,
      "on" + Qh
    );
  }
  Xl(Co, "onAnimationEnd"), Xl(jo, "onAnimationIteration"), Xl(Oo, "onAnimationStart"), Xl("dblclick", "onDoubleClick"), Xl("focusin", "onFocus"), Xl("focusout", "onBlur"), Xl(uh, "onTransitionRun"), Xl(ih, "onTransitionStart"), Xl(ch, "onTransitionCancel"), Xl(Uo, "onTransitionEnd"), xa("onMouseEnter", ["mouseout", "mouseover"]), xa("onMouseLeave", ["mouseout", "mouseover"]), xa("onPointerEnter", ["pointerout", "pointerover"]), xa("onPointerLeave", ["pointerout", "pointerover"]), Ke(
    "onChange",
    "change click focusin focusout input keydown keyup selectionchange".split(" ")
  ), Ke(
    "onSelect",
    "focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange".split(
      " "
    )
  ), Ke("onBeforeInput", [
    "compositionend",
    "keypress",
    "textInput",
    "paste"
  ]), Ke(
    "onCompositionEnd",
    "compositionend focusout keydown keypress keyup mousedown".split(" ")
  ), Ke(
    "onCompositionStart",
    "compositionstart focusout keydown keypress keyup mousedown".split(" ")
  ), Ke(
    "onCompositionUpdate",
    "compositionupdate focusout keydown keypress keyup mousedown".split(" ")
  );
  var Ln = "abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting".split(
    " "
  ), Zh = new Set(
    "beforetoggle cancel close invalid load scroll scrollend toggle".split(" ").concat(Ln)
  );
  function td(t, l) {
    l = (l & 4) !== 0;
    for (var e = 0; e < t.length; e++) {
      var a = t[e], n = a.event;
      a = a.listeners;
      t: {
        var u = void 0;
        if (l)
          for (var i = a.length - 1; 0 <= i; i--) {
            var c = a[i], d = c.instance, p = c.currentTarget;
            if (c = c.listener, d !== u && n.isPropagationStopped())
              break t;
            u = c, n.currentTarget = p;
            try {
              u(n);
            } catch (E) {
              ou(E);
            }
            n.currentTarget = null, u = d;
          }
        else
          for (i = 0; i < a.length; i++) {
            if (c = a[i], d = c.instance, p = c.currentTarget, c = c.listener, d !== u && n.isPropagationStopped())
              break t;
            u = c, n.currentTarget = p;
            try {
              u(n);
            } catch (E) {
              ou(E);
            }
            n.currentTarget = null, u = d;
          }
      }
    }
  }
  function mt(t, l) {
    var e = l[bi];
    e === void 0 && (e = l[bi] = /* @__PURE__ */ new Set());
    var a = t + "__bubble";
    e.has(a) || (ld(l, t, 2, !1), e.add(a));
  }
  function ff(t, l, e) {
    var a = 0;
    l && (a |= 4), ld(
      e,
      t,
      a,
      l
    );
  }
  var $u = "_reactListening" + Math.random().toString(36).slice(2);
  function of(t) {
    if (!t[$u]) {
      t[$u] = !0, kf.forEach(function(e) {
        e !== "selectionchange" && (Zh.has(e) || ff(e, !1, t), ff(e, !0, t));
      });
      var l = t.nodeType === 9 ? t : t.ownerDocument;
      l === null || l[$u] || (l[$u] = !0, ff("selectionchange", !1, l));
    }
  }
  function ld(t, l, e, a) {
    switch (Cd(l)) {
      case 2:
        var n = p0;
        break;
      case 8:
        n = b0;
        break;
      default:
        n = Tf;
    }
    e = n.bind(
      null,
      l,
      e,
      t
    ), n = void 0, !Di || l !== "touchstart" && l !== "touchmove" && l !== "wheel" || (n = !0), a ? n !== void 0 ? t.addEventListener(l, e, {
      capture: !0,
      passive: n
    }) : t.addEventListener(l, e, !0) : n !== void 0 ? t.addEventListener(l, e, {
      passive: n
    }) : t.addEventListener(l, e, !1);
  }
  function sf(t, l, e, a, n) {
    var u = a;
    if ((l & 1) === 0 && (l & 2) === 0 && a !== null)
      t: for (; ; ) {
        if (a === null) return;
        var i = a.tag;
        if (i === 3 || i === 4) {
          var c = a.stateNode.containerInfo;
          if (c === n) break;
          if (i === 4)
            for (i = a.return; i !== null; ) {
              var d = i.tag;
              if ((d === 3 || d === 4) && i.stateNode.containerInfo === n)
                return;
              i = i.return;
            }
          for (; c !== null; ) {
            if (i = ga(c), i === null) return;
            if (d = i.tag, d === 5 || d === 6 || d === 26 || d === 27) {
              a = u = i;
              continue t;
            }
            c = c.parentNode;
          }
        }
        a = a.return;
      }
    uo(function() {
      var p = u, E = _i(e), N = [];
      t: {
        var x = Ro.get(t);
        if (x !== void 0) {
          var z = iu, J = t;
          switch (t) {
            case "keypress":
              if (nu(e) === 0) break t;
            case "keydown":
            case "keyup":
              z = Ym;
              break;
            case "focusin":
              J = "focus", z = Oi;
              break;
            case "focusout":
              J = "blur", z = Oi;
              break;
            case "beforeblur":
            case "afterblur":
              z = Oi;
              break;
            case "click":
              if (e.button === 2) break t;
            case "auxclick":
            case "dblclick":
            case "mousedown":
            case "mousemove":
            case "mouseup":
            case "mouseout":
            case "mouseover":
            case "contextmenu":
              z = fo;
              break;
            case "drag":
            case "dragend":
            case "dragenter":
            case "dragexit":
            case "dragleave":
            case "dragover":
            case "dragstart":
            case "drop":
              z = Mm;
              break;
            case "touchcancel":
            case "touchend":
            case "touchmove":
            case "touchstart":
              z = Xm;
              break;
            case Co:
            case jo:
            case Oo:
              z = Dm;
              break;
            case Uo:
              z = Lm;
              break;
            case "scroll":
            case "scrollend":
              z = Em;
              break;
            case "wheel":
              z = Zm;
              break;
            case "copy":
            case "cut":
            case "paste":
              z = Cm;
              break;
            case "gotpointercapture":
            case "lostpointercapture":
            case "pointercancel":
            case "pointerdown":
            case "pointermove":
            case "pointerout":
            case "pointerover":
            case "pointerup":
              z = so;
              break;
            case "toggle":
            case "beforetoggle":
              z = Km;
          }
          var at = (l & 4) !== 0, Ct = !at && (t === "scroll" || t === "scrollend"), v = at ? x !== null ? x + "Capture" : null : x;
          at = [];
          for (var h = p, g; h !== null; ) {
            var A = h;
            if (g = A.stateNode, A = A.tag, A !== 5 && A !== 26 && A !== 27 || g === null || v === null || (A = sn(h, v), A != null && at.push(
              Qn(h, A, g)
            )), Ct) break;
            h = h.return;
          }
          0 < at.length && (x = new z(
            x,
            J,
            null,
            e,
            E
          ), N.push({ event: x, listeners: at }));
        }
      }
      if ((l & 7) === 0) {
        t: {
          if (x = t === "mouseover" || t === "pointerover", z = t === "mouseout" || t === "pointerout", x && e !== Mi && (J = e.relatedTarget || e.fromElement) && (ga(J) || J[va]))
            break t;
          if ((z || x) && (x = E.window === E ? E : (x = E.ownerDocument) ? x.defaultView || x.parentWindow : window, z ? (J = e.relatedTarget || e.toElement, z = p, J = J ? ga(J) : null, J !== null && (Ct = H(J), at = J.tag, J !== Ct || at !== 5 && at !== 27 && at !== 6) && (J = null)) : (z = null, J = p), z !== J)) {
            if (at = fo, A = "onMouseLeave", v = "onMouseEnter", h = "mouse", (t === "pointerout" || t === "pointerover") && (at = so, A = "onPointerLeave", v = "onPointerEnter", h = "pointer"), Ct = z == null ? x : on(z), g = J == null ? x : on(J), x = new at(
              A,
              h + "leave",
              z,
              e,
              E
            ), x.target = Ct, x.relatedTarget = g, A = null, ga(E) === p && (at = new at(
              v,
              h + "enter",
              J,
              e,
              E
            ), at.target = g, at.relatedTarget = Ct, A = at), Ct = A, z && J)
              l: {
                for (at = Vh, v = z, h = J, g = 0, A = v; A; A = at(A))
                  g++;
                A = 0;
                for (var lt = h; lt; lt = at(lt))
                  A++;
                for (; 0 < g - A; )
                  v = at(v), g--;
                for (; 0 < A - g; )
                  h = at(h), A--;
                for (; g--; ) {
                  if (v === h || h !== null && v === h.alternate) {
                    at = v;
                    break l;
                  }
                  v = at(v), h = at(h);
                }
                at = null;
              }
            else at = null;
            z !== null && ed(
              N,
              x,
              z,
              at,
              !1
            ), J !== null && Ct !== null && ed(
              N,
              Ct,
              J,
              at,
              !0
            );
          }
        }
        t: {
          if (x = p ? on(p) : window, z = x.nodeName && x.nodeName.toLowerCase(), z === "select" || z === "input" && x.type === "file")
            var xt = bo;
          else if (go(x))
            if (xo)
              xt = eh;
            else {
              xt = th;
              var I = Pm;
            }
          else
            z = x.nodeName, !z || z.toLowerCase() !== "input" || x.type !== "checkbox" && x.type !== "radio" ? p && Ti(p.elementType) && (xt = bo) : xt = lh;
          if (xt && (xt = xt(t, p))) {
            po(
              N,
              xt,
              e,
              E
            );
            break t;
          }
          I && I(t, x, p), t === "focusout" && p && x.type === "number" && p.memoizedProps.value != null && Ei(x, "number", x.value);
        }
        switch (I = p ? on(p) : window, t) {
          case "focusin":
            (go(I) || I.contentEditable === "true") && (_a = I, qi = p, pn = null);
            break;
          case "focusout":
            pn = qi = _a = null;
            break;
          case "mousedown":
            wi = !0;
            break;
          case "contextmenu":
          case "mouseup":
          case "dragend":
            wi = !1, Do(N, e, E);
            break;
          case "selectionchange":
            if (nh) break;
          case "keydown":
          case "keyup":
            Do(N, e, E);
        }
        var ot;
        if (Ri)
          t: {
            switch (t) {
              case "compositionstart":
                var yt = "onCompositionStart";
                break t;
              case "compositionend":
                yt = "onCompositionEnd";
                break t;
              case "compositionupdate":
                yt = "onCompositionUpdate";
                break t;
            }
            yt = void 0;
          }
        else
          Ma ? yo(t, e) && (yt = "onCompositionEnd") : t === "keydown" && e.keyCode === 229 && (yt = "onCompositionStart");
        yt && (ro && e.locale !== "ko" && (Ma || yt !== "onCompositionStart" ? yt === "onCompositionEnd" && Ma && (ot = io()) : (ve = E, Ni = "value" in ve ? ve.value : ve.textContent, Ma = !0)), I = Wu(p, yt), 0 < I.length && (yt = new oo(
          yt,
          t,
          null,
          e,
          E
        ), N.push({ event: yt, listeners: I }), ot ? yt.data = ot : (ot = vo(e), ot !== null && (yt.data = ot)))), (ot = Jm ? $m(t, e) : Wm(t, e)) && (yt = Wu(p, "onBeforeInput"), 0 < yt.length && (I = new oo(
          "onBeforeInput",
          "beforeinput",
          null,
          e,
          E
        ), N.push({
          event: I,
          listeners: yt
        }), I.data = ot)), Gh(
          N,
          t,
          p,
          e,
          E
        );
      }
      td(N, l);
    });
  }
  function Qn(t, l, e) {
    return {
      instance: t,
      listener: l,
      currentTarget: e
    };
  }
  function Wu(t, l) {
    for (var e = l + "Capture", a = []; t !== null; ) {
      var n = t, u = n.stateNode;
      if (n = n.tag, n !== 5 && n !== 26 && n !== 27 || u === null || (n = sn(t, e), n != null && a.unshift(
        Qn(t, n, u)
      ), n = sn(t, l), n != null && a.push(
        Qn(t, n, u)
      )), t.tag === 3) return a;
      t = t.return;
    }
    return [];
  }
  function Vh(t) {
    if (t === null) return null;
    do
      t = t.return;
    while (t && t.tag !== 5 && t.tag !== 27);
    return t || null;
  }
  function ed(t, l, e, a, n) {
    for (var u = l._reactName, i = []; e !== null && e !== a; ) {
      var c = e, d = c.alternate, p = c.stateNode;
      if (c = c.tag, d !== null && d === a) break;
      c !== 5 && c !== 26 && c !== 27 || p === null || (d = p, n ? (p = sn(e, u), p != null && i.unshift(
        Qn(e, p, d)
      )) : n || (p = sn(e, u), p != null && i.push(
        Qn(e, p, d)
      ))), e = e.return;
    }
    i.length !== 0 && t.push({ event: l, listeners: i });
  }
  var Kh = /\r\n?/g, kh = /\u0000|\uFFFD/g;
  function ad(t) {
    return (typeof t == "string" ? t : "" + t).replace(Kh, `
`).replace(kh, "");
  }
  function nd(t, l) {
    return l = ad(l), ad(t) === l;
  }
  function Nt(t, l, e, a, n, u) {
    switch (e) {
      case "children":
        typeof a == "string" ? l === "body" || l === "textarea" && a === "" || za(t, a) : (typeof a == "number" || typeof a == "bigint") && l !== "body" && za(t, "" + a);
        break;
      case "className":
        tu(t, "class", a);
        break;
      case "tabIndex":
        tu(t, "tabindex", a);
        break;
      case "dir":
      case "role":
      case "viewBox":
      case "width":
      case "height":
        tu(t, e, a);
        break;
      case "style":
        ao(t, a, u);
        break;
      case "data":
        if (l !== "object") {
          tu(t, "data", a);
          break;
        }
      case "src":
      case "href":
        if (a === "" && (l !== "a" || e !== "href")) {
          t.removeAttribute(e);
          break;
        }
        if (a == null || typeof a == "function" || typeof a == "symbol" || typeof a == "boolean") {
          t.removeAttribute(e);
          break;
        }
        a = eu("" + a), t.setAttribute(e, a);
        break;
      case "action":
      case "formAction":
        if (typeof a == "function") {
          t.setAttribute(
            e,
            "javascript:throw new Error('A React form was unexpectedly submitted. If you called form.submit() manually, consider using form.requestSubmit() instead. If you\\'re trying to use event.stopPropagation() in a submit event handler, consider also calling event.preventDefault().')"
          );
          break;
        } else
          typeof u == "function" && (e === "formAction" ? (l !== "input" && Nt(t, l, "name", n.name, n, null), Nt(
            t,
            l,
            "formEncType",
            n.formEncType,
            n,
            null
          ), Nt(
            t,
            l,
            "formMethod",
            n.formMethod,
            n,
            null
          ), Nt(
            t,
            l,
            "formTarget",
            n.formTarget,
            n,
            null
          )) : (Nt(t, l, "encType", n.encType, n, null), Nt(t, l, "method", n.method, n, null), Nt(t, l, "target", n.target, n, null)));
        if (a == null || typeof a == "symbol" || typeof a == "boolean") {
          t.removeAttribute(e);
          break;
        }
        a = eu("" + a), t.setAttribute(e, a);
        break;
      case "onClick":
        a != null && (t.onclick = Wl);
        break;
      case "onScroll":
        a != null && mt("scroll", t);
        break;
      case "onScrollEnd":
        a != null && mt("scrollend", t);
        break;
      case "dangerouslySetInnerHTML":
        if (a != null) {
          if (typeof a != "object" || !("__html" in a))
            throw Error(s(61));
          if (e = a.__html, e != null) {
            if (n.children != null) throw Error(s(60));
            t.innerHTML = e;
          }
        }
        break;
      case "multiple":
        t.multiple = a && typeof a != "function" && typeof a != "symbol";
        break;
      case "muted":
        t.muted = a && typeof a != "function" && typeof a != "symbol";
        break;
      case "suppressContentEditableWarning":
      case "suppressHydrationWarning":
      case "defaultValue":
      case "defaultChecked":
      case "innerHTML":
      case "ref":
        break;
      case "autoFocus":
        break;
      case "xlinkHref":
        if (a == null || typeof a == "function" || typeof a == "boolean" || typeof a == "symbol") {
          t.removeAttribute("xlink:href");
          break;
        }
        e = eu("" + a), t.setAttributeNS(
          "http://www.w3.org/1999/xlink",
          "xlink:href",
          e
        );
        break;
      case "contentEditable":
      case "spellCheck":
      case "draggable":
      case "value":
      case "autoReverse":
      case "externalResourcesRequired":
      case "focusable":
      case "preserveAlpha":
        a != null && typeof a != "function" && typeof a != "symbol" ? t.setAttribute(e, "" + a) : t.removeAttribute(e);
        break;
      case "inert":
      case "allowFullScreen":
      case "async":
      case "autoPlay":
      case "controls":
      case "default":
      case "defer":
      case "disabled":
      case "disablePictureInPicture":
      case "disableRemotePlayback":
      case "formNoValidate":
      case "hidden":
      case "loop":
      case "noModule":
      case "noValidate":
      case "open":
      case "playsInline":
      case "readOnly":
      case "required":
      case "reversed":
      case "scoped":
      case "seamless":
      case "itemScope":
        a && typeof a != "function" && typeof a != "symbol" ? t.setAttribute(e, "") : t.removeAttribute(e);
        break;
      case "capture":
      case "download":
        a === !0 ? t.setAttribute(e, "") : a !== !1 && a != null && typeof a != "function" && typeof a != "symbol" ? t.setAttribute(e, a) : t.removeAttribute(e);
        break;
      case "cols":
      case "rows":
      case "size":
      case "span":
        a != null && typeof a != "function" && typeof a != "symbol" && !isNaN(a) && 1 <= a ? t.setAttribute(e, a) : t.removeAttribute(e);
        break;
      case "rowSpan":
      case "start":
        a == null || typeof a == "function" || typeof a == "symbol" || isNaN(a) ? t.removeAttribute(e) : t.setAttribute(e, a);
        break;
      case "popover":
        mt("beforetoggle", t), mt("toggle", t), Pn(t, "popover", a);
        break;
      case "xlinkActuate":
        $l(
          t,
          "http://www.w3.org/1999/xlink",
          "xlink:actuate",
          a
        );
        break;
      case "xlinkArcrole":
        $l(
          t,
          "http://www.w3.org/1999/xlink",
          "xlink:arcrole",
          a
        );
        break;
      case "xlinkRole":
        $l(
          t,
          "http://www.w3.org/1999/xlink",
          "xlink:role",
          a
        );
        break;
      case "xlinkShow":
        $l(
          t,
          "http://www.w3.org/1999/xlink",
          "xlink:show",
          a
        );
        break;
      case "xlinkTitle":
        $l(
          t,
          "http://www.w3.org/1999/xlink",
          "xlink:title",
          a
        );
        break;
      case "xlinkType":
        $l(
          t,
          "http://www.w3.org/1999/xlink",
          "xlink:type",
          a
        );
        break;
      case "xmlBase":
        $l(
          t,
          "http://www.w3.org/XML/1998/namespace",
          "xml:base",
          a
        );
        break;
      case "xmlLang":
        $l(
          t,
          "http://www.w3.org/XML/1998/namespace",
          "xml:lang",
          a
        );
        break;
      case "xmlSpace":
        $l(
          t,
          "http://www.w3.org/XML/1998/namespace",
          "xml:space",
          a
        );
        break;
      case "is":
        Pn(t, "is", a);
        break;
      case "innerText":
      case "textContent":
        break;
      default:
        (!(2 < e.length) || e[0] !== "o" && e[0] !== "O" || e[1] !== "n" && e[1] !== "N") && (e = Sm.get(e) || e, Pn(t, e, a));
    }
  }
  function rf(t, l, e, a, n, u) {
    switch (e) {
      case "style":
        ao(t, a, u);
        break;
      case "dangerouslySetInnerHTML":
        if (a != null) {
          if (typeof a != "object" || !("__html" in a))
            throw Error(s(61));
          if (e = a.__html, e != null) {
            if (n.children != null) throw Error(s(60));
            t.innerHTML = e;
          }
        }
        break;
      case "children":
        typeof a == "string" ? za(t, a) : (typeof a == "number" || typeof a == "bigint") && za(t, "" + a);
        break;
      case "onScroll":
        a != null && mt("scroll", t);
        break;
      case "onScrollEnd":
        a != null && mt("scrollend", t);
        break;
      case "onClick":
        a != null && (t.onclick = Wl);
        break;
      case "suppressContentEditableWarning":
      case "suppressHydrationWarning":
      case "innerHTML":
      case "ref":
        break;
      case "innerText":
      case "textContent":
        break;
      default:
        if (!Jf.hasOwnProperty(e))
          t: {
            if (e[0] === "o" && e[1] === "n" && (n = e.endsWith("Capture"), l = e.slice(2, n ? e.length - 7 : void 0), u = t[ml] || null, u = u != null ? u[e] : null, typeof u == "function" && t.removeEventListener(l, u, n), typeof a == "function")) {
              typeof u != "function" && u !== null && (e in t ? t[e] = null : t.hasAttribute(e) && t.removeAttribute(e)), t.addEventListener(l, a, n);
              break t;
            }
            e in t ? t[e] = a : a === !0 ? t.setAttribute(e, "") : Pn(t, e, a);
          }
    }
  }
  function cl(t, l, e) {
    switch (l) {
      case "div":
      case "span":
      case "svg":
      case "path":
      case "a":
      case "g":
      case "p":
      case "li":
        break;
      case "img":
        mt("error", t), mt("load", t);
        var a = !1, n = !1, u;
        for (u in e)
          if (e.hasOwnProperty(u)) {
            var i = e[u];
            if (i != null)
              switch (u) {
                case "src":
                  a = !0;
                  break;
                case "srcSet":
                  n = !0;
                  break;
                case "children":
                case "dangerouslySetInnerHTML":
                  throw Error(s(137, l));
                default:
                  Nt(t, l, u, i, e, null);
              }
          }
        n && Nt(t, l, "srcSet", e.srcSet, e, null), a && Nt(t, l, "src", e.src, e, null);
        return;
      case "input":
        mt("invalid", t);
        var c = u = i = n = null, d = null, p = null;
        for (a in e)
          if (e.hasOwnProperty(a)) {
            var E = e[a];
            if (E != null)
              switch (a) {
                case "name":
                  n = E;
                  break;
                case "type":
                  i = E;
                  break;
                case "checked":
                  d = E;
                  break;
                case "defaultChecked":
                  p = E;
                  break;
                case "value":
                  u = E;
                  break;
                case "defaultValue":
                  c = E;
                  break;
                case "children":
                case "dangerouslySetInnerHTML":
                  if (E != null)
                    throw Error(s(137, l));
                  break;
                default:
                  Nt(t, l, a, E, e, null);
              }
          }
        Pf(
          t,
          u,
          c,
          d,
          p,
          i,
          n,
          !1
        );
        return;
      case "select":
        mt("invalid", t), a = i = u = null;
        for (n in e)
          if (e.hasOwnProperty(n) && (c = e[n], c != null))
            switch (n) {
              case "value":
                u = c;
                break;
              case "defaultValue":
                i = c;
                break;
              case "multiple":
                a = c;
              default:
                Nt(t, l, n, c, e, null);
            }
        l = u, e = i, t.multiple = !!a, l != null ? Sa(t, !!a, l, !1) : e != null && Sa(t, !!a, e, !0);
        return;
      case "textarea":
        mt("invalid", t), u = n = a = null;
        for (i in e)
          if (e.hasOwnProperty(i) && (c = e[i], c != null))
            switch (i) {
              case "value":
                a = c;
                break;
              case "defaultValue":
                n = c;
                break;
              case "children":
                u = c;
                break;
              case "dangerouslySetInnerHTML":
                if (c != null) throw Error(s(91));
                break;
              default:
                Nt(t, l, i, c, e, null);
            }
        lo(t, a, n, u);
        return;
      case "option":
        for (d in e)
          e.hasOwnProperty(d) && (a = e[d], a != null) && (d === "selected" ? t.selected = a && typeof a != "function" && typeof a != "symbol" : Nt(t, l, d, a, e, null));
        return;
      case "dialog":
        mt("beforetoggle", t), mt("toggle", t), mt("cancel", t), mt("close", t);
        break;
      case "iframe":
      case "object":
        mt("load", t);
        break;
      case "video":
      case "audio":
        for (a = 0; a < Ln.length; a++)
          mt(Ln[a], t);
        break;
      case "image":
        mt("error", t), mt("load", t);
        break;
      case "details":
        mt("toggle", t);
        break;
      case "embed":
      case "source":
      case "link":
        mt("error", t), mt("load", t);
      case "area":
      case "base":
      case "br":
      case "col":
      case "hr":
      case "keygen":
      case "meta":
      case "param":
      case "track":
      case "wbr":
      case "menuitem":
        for (p in e)
          if (e.hasOwnProperty(p) && (a = e[p], a != null))
            switch (p) {
              case "children":
              case "dangerouslySetInnerHTML":
                throw Error(s(137, l));
              default:
                Nt(t, l, p, a, e, null);
            }
        return;
      default:
        if (Ti(l)) {
          for (E in e)
            e.hasOwnProperty(E) && (a = e[E], a !== void 0 && rf(
              t,
              l,
              E,
              a,
              e,
              void 0
            ));
          return;
        }
    }
    for (c in e)
      e.hasOwnProperty(c) && (a = e[c], a != null && Nt(t, l, c, a, e, null));
  }
  function Jh(t, l, e, a) {
    switch (l) {
      case "div":
      case "span":
      case "svg":
      case "path":
      case "a":
      case "g":
      case "p":
      case "li":
        break;
      case "input":
        var n = null, u = null, i = null, c = null, d = null, p = null, E = null;
        for (z in e) {
          var N = e[z];
          if (e.hasOwnProperty(z) && N != null)
            switch (z) {
              case "checked":
                break;
              case "value":
                break;
              case "defaultValue":
                d = N;
              default:
                a.hasOwnProperty(z) || Nt(t, l, z, null, a, N);
            }
        }
        for (var x in a) {
          var z = a[x];
          if (N = e[x], a.hasOwnProperty(x) && (z != null || N != null))
            switch (x) {
              case "type":
                u = z;
                break;
              case "name":
                n = z;
                break;
              case "checked":
                p = z;
                break;
              case "defaultChecked":
                E = z;
                break;
              case "value":
                i = z;
                break;
              case "defaultValue":
                c = z;
                break;
              case "children":
              case "dangerouslySetInnerHTML":
                if (z != null)
                  throw Error(s(137, l));
                break;
              default:
                z !== N && Nt(
                  t,
                  l,
                  x,
                  z,
                  a,
                  N
                );
            }
        }
        zi(
          t,
          i,
          c,
          d,
          p,
          E,
          u,
          n
        );
        return;
      case "select":
        z = i = c = x = null;
        for (u in e)
          if (d = e[u], e.hasOwnProperty(u) && d != null)
            switch (u) {
              case "value":
                break;
              case "multiple":
                z = d;
              default:
                a.hasOwnProperty(u) || Nt(
                  t,
                  l,
                  u,
                  null,
                  a,
                  d
                );
            }
        for (n in a)
          if (u = a[n], d = e[n], a.hasOwnProperty(n) && (u != null || d != null))
            switch (n) {
              case "value":
                x = u;
                break;
              case "defaultValue":
                c = u;
                break;
              case "multiple":
                i = u;
              default:
                u !== d && Nt(
                  t,
                  l,
                  n,
                  u,
                  a,
                  d
                );
            }
        l = c, e = i, a = z, x != null ? Sa(t, !!e, x, !1) : !!a != !!e && (l != null ? Sa(t, !!e, l, !0) : Sa(t, !!e, e ? [] : "", !1));
        return;
      case "textarea":
        z = x = null;
        for (c in e)
          if (n = e[c], e.hasOwnProperty(c) && n != null && !a.hasOwnProperty(c))
            switch (c) {
              case "value":
                break;
              case "children":
                break;
              default:
                Nt(t, l, c, null, a, n);
            }
        for (i in a)
          if (n = a[i], u = e[i], a.hasOwnProperty(i) && (n != null || u != null))
            switch (i) {
              case "value":
                x = n;
                break;
              case "defaultValue":
                z = n;
                break;
              case "children":
                break;
              case "dangerouslySetInnerHTML":
                if (n != null) throw Error(s(91));
                break;
              default:
                n !== u && Nt(t, l, i, n, a, u);
            }
        to(t, x, z);
        return;
      case "option":
        for (var J in e)
          x = e[J], e.hasOwnProperty(J) && x != null && !a.hasOwnProperty(J) && (J === "selected" ? t.selected = !1 : Nt(
            t,
            l,
            J,
            null,
            a,
            x
          ));
        for (d in a)
          x = a[d], z = e[d], a.hasOwnProperty(d) && x !== z && (x != null || z != null) && (d === "selected" ? t.selected = x && typeof x != "function" && typeof x != "symbol" : Nt(
            t,
            l,
            d,
            x,
            a,
            z
          ));
        return;
      case "img":
      case "link":
      case "area":
      case "base":
      case "br":
      case "col":
      case "embed":
      case "hr":
      case "keygen":
      case "meta":
      case "param":
      case "source":
      case "track":
      case "wbr":
      case "menuitem":
        for (var at in e)
          x = e[at], e.hasOwnProperty(at) && x != null && !a.hasOwnProperty(at) && Nt(t, l, at, null, a, x);
        for (p in a)
          if (x = a[p], z = e[p], a.hasOwnProperty(p) && x !== z && (x != null || z != null))
            switch (p) {
              case "children":
              case "dangerouslySetInnerHTML":
                if (x != null)
                  throw Error(s(137, l));
                break;
              default:
                Nt(
                  t,
                  l,
                  p,
                  x,
                  a,
                  z
                );
            }
        return;
      default:
        if (Ti(l)) {
          for (var Ct in e)
            x = e[Ct], e.hasOwnProperty(Ct) && x !== void 0 && !a.hasOwnProperty(Ct) && rf(
              t,
              l,
              Ct,
              void 0,
              a,
              x
            );
          for (E in a)
            x = a[E], z = e[E], !a.hasOwnProperty(E) || x === z || x === void 0 && z === void 0 || rf(
              t,
              l,
              E,
              x,
              a,
              z
            );
          return;
        }
    }
    for (var v in e)
      x = e[v], e.hasOwnProperty(v) && x != null && !a.hasOwnProperty(v) && Nt(t, l, v, null, a, x);
    for (N in a)
      x = a[N], z = e[N], !a.hasOwnProperty(N) || x === z || x == null && z == null || Nt(t, l, N, x, a, z);
  }
  function ud(t) {
    switch (t) {
      case "css":
      case "script":
      case "font":
      case "img":
      case "image":
      case "input":
      case "link":
        return !0;
      default:
        return !1;
    }
  }
  function $h() {
    if (typeof performance.getEntriesByType == "function") {
      for (var t = 0, l = 0, e = performance.getEntriesByType("resource"), a = 0; a < e.length; a++) {
        var n = e[a], u = n.transferSize, i = n.initiatorType, c = n.duration;
        if (u && c && ud(i)) {
          for (i = 0, c = n.responseEnd, a += 1; a < e.length; a++) {
            var d = e[a], p = d.startTime;
            if (p > c) break;
            var E = d.transferSize, N = d.initiatorType;
            E && ud(N) && (d = d.responseEnd, i += E * (d < c ? 1 : (c - p) / (d - p)));
          }
          if (--a, l += 8 * (u + i) / (n.duration / 1e3), t++, 10 < t) break;
        }
      }
      if (0 < t) return l / t / 1e6;
    }
    return navigator.connection && (t = navigator.connection.downlink, typeof t == "number") ? t : 5;
  }
  var df = null, mf = null;
  function Fu(t) {
    return t.nodeType === 9 ? t : t.ownerDocument;
  }
  function id(t) {
    switch (t) {
      case "http://www.w3.org/2000/svg":
        return 1;
      case "http://www.w3.org/1998/Math/MathML":
        return 2;
      default:
        return 0;
    }
  }
  function cd(t, l) {
    if (t === 0)
      switch (l) {
        case "svg":
          return 1;
        case "math":
          return 2;
        default:
          return 0;
      }
    return t === 1 && l === "foreignObject" ? 0 : t;
  }
  function hf(t, l) {
    return t === "textarea" || t === "noscript" || typeof l.children == "string" || typeof l.children == "number" || typeof l.children == "bigint" || typeof l.dangerouslySetInnerHTML == "object" && l.dangerouslySetInnerHTML !== null && l.dangerouslySetInnerHTML.__html != null;
  }
  var yf = null;
  function Wh() {
    var t = window.event;
    return t && t.type === "popstate" ? t === yf ? !1 : (yf = t, !0) : (yf = null, !1);
  }
  var fd = typeof setTimeout == "function" ? setTimeout : void 0, Fh = typeof clearTimeout == "function" ? clearTimeout : void 0, od = typeof Promise == "function" ? Promise : void 0, Ih = typeof queueMicrotask == "function" ? queueMicrotask : typeof od < "u" ? function(t) {
    return od.resolve(null).then(t).catch(Ph);
  } : fd;
  function Ph(t) {
    setTimeout(function() {
      throw t;
    });
  }
  function Ue(t) {
    return t === "head";
  }
  function sd(t, l) {
    var e = l, a = 0;
    do {
      var n = e.nextSibling;
      if (t.removeChild(e), n && n.nodeType === 8)
        if (e = n.data, e === "/$" || e === "/&") {
          if (a === 0) {
            t.removeChild(n), Pa(l);
            return;
          }
          a--;
        } else if (e === "$" || e === "$?" || e === "$~" || e === "$!" || e === "&")
          a++;
        else if (e === "html")
          Zn(t.ownerDocument.documentElement);
        else if (e === "head") {
          e = t.ownerDocument.head, Zn(e);
          for (var u = e.firstChild; u; ) {
            var i = u.nextSibling, c = u.nodeName;
            u[fn] || c === "SCRIPT" || c === "STYLE" || c === "LINK" && u.rel.toLowerCase() === "stylesheet" || e.removeChild(u), u = i;
          }
        } else
          e === "body" && Zn(t.ownerDocument.body);
      e = n;
    } while (e);
    Pa(l);
  }
  function rd(t, l) {
    var e = t;
    t = 0;
    do {
      var a = e.nextSibling;
      if (e.nodeType === 1 ? l ? (e._stashedDisplay = e.style.display, e.style.display = "none") : (e.style.display = e._stashedDisplay || "", e.getAttribute("style") === "" && e.removeAttribute("style")) : e.nodeType === 3 && (l ? (e._stashedText = e.nodeValue, e.nodeValue = "") : e.nodeValue = e._stashedText || ""), a && a.nodeType === 8)
        if (e = a.data, e === "/$") {
          if (t === 0) break;
          t--;
        } else
          e !== "$" && e !== "$?" && e !== "$~" && e !== "$!" || t++;
      e = a;
    } while (e);
  }
  function vf(t) {
    var l = t.firstChild;
    for (l && l.nodeType === 10 && (l = l.nextSibling); l; ) {
      var e = l;
      switch (l = l.nextSibling, e.nodeName) {
        case "HTML":
        case "HEAD":
        case "BODY":
          vf(e), xi(e);
          continue;
        case "SCRIPT":
        case "STYLE":
          continue;
        case "LINK":
          if (e.rel.toLowerCase() === "stylesheet") continue;
      }
      t.removeChild(e);
    }
  }
  function t0(t, l, e, a) {
    for (; t.nodeType === 1; ) {
      var n = e;
      if (t.nodeName.toLowerCase() !== l.toLowerCase()) {
        if (!a && (t.nodeName !== "INPUT" || t.type !== "hidden"))
          break;
      } else if (a) {
        if (!t[fn])
          switch (l) {
            case "meta":
              if (!t.hasAttribute("itemprop")) break;
              return t;
            case "link":
              if (u = t.getAttribute("rel"), u === "stylesheet" && t.hasAttribute("data-precedence"))
                break;
              if (u !== n.rel || t.getAttribute("href") !== (n.href == null || n.href === "" ? null : n.href) || t.getAttribute("crossorigin") !== (n.crossOrigin == null ? null : n.crossOrigin) || t.getAttribute("title") !== (n.title == null ? null : n.title))
                break;
              return t;
            case "style":
              if (t.hasAttribute("data-precedence")) break;
              return t;
            case "script":
              if (u = t.getAttribute("src"), (u !== (n.src == null ? null : n.src) || t.getAttribute("type") !== (n.type == null ? null : n.type) || t.getAttribute("crossorigin") !== (n.crossOrigin == null ? null : n.crossOrigin)) && u && t.hasAttribute("async") && !t.hasAttribute("itemprop"))
                break;
              return t;
            default:
              return t;
          }
      } else if (l === "input" && t.type === "hidden") {
        var u = n.name == null ? null : "" + n.name;
        if (n.type === "hidden" && t.getAttribute("name") === u)
          return t;
      } else return t;
      if (t = ql(t.nextSibling), t === null) break;
    }
    return null;
  }
  function l0(t, l, e) {
    if (l === "") return null;
    for (; t.nodeType !== 3; )
      if ((t.nodeType !== 1 || t.nodeName !== "INPUT" || t.type !== "hidden") && !e || (t = ql(t.nextSibling), t === null)) return null;
    return t;
  }
  function dd(t, l) {
    for (; t.nodeType !== 8; )
      if ((t.nodeType !== 1 || t.nodeName !== "INPUT" || t.type !== "hidden") && !l || (t = ql(t.nextSibling), t === null)) return null;
    return t;
  }
  function gf(t) {
    return t.data === "$?" || t.data === "$~";
  }
  function pf(t) {
    return t.data === "$!" || t.data === "$?" && t.ownerDocument.readyState !== "loading";
  }
  function e0(t, l) {
    var e = t.ownerDocument;
    if (t.data === "$~") t._reactRetry = l;
    else if (t.data !== "$?" || e.readyState !== "loading")
      l();
    else {
      var a = function() {
        l(), e.removeEventListener("DOMContentLoaded", a);
      };
      e.addEventListener("DOMContentLoaded", a), t._reactRetry = a;
    }
  }
  function ql(t) {
    for (; t != null; t = t.nextSibling) {
      var l = t.nodeType;
      if (l === 1 || l === 3) break;
      if (l === 8) {
        if (l = t.data, l === "$" || l === "$!" || l === "$?" || l === "$~" || l === "&" || l === "F!" || l === "F")
          break;
        if (l === "/$" || l === "/&") return null;
      }
    }
    return t;
  }
  var bf = null;
  function md(t) {
    t = t.nextSibling;
    for (var l = 0; t; ) {
      if (t.nodeType === 8) {
        var e = t.data;
        if (e === "/$" || e === "/&") {
          if (l === 0)
            return ql(t.nextSibling);
          l--;
        } else
          e !== "$" && e !== "$!" && e !== "$?" && e !== "$~" && e !== "&" || l++;
      }
      t = t.nextSibling;
    }
    return null;
  }
  function hd(t) {
    t = t.previousSibling;
    for (var l = 0; t; ) {
      if (t.nodeType === 8) {
        var e = t.data;
        if (e === "$" || e === "$!" || e === "$?" || e === "$~" || e === "&") {
          if (l === 0) return t;
          l--;
        } else e !== "/$" && e !== "/&" || l++;
      }
      t = t.previousSibling;
    }
    return null;
  }
  function yd(t, l, e) {
    switch (l = Fu(e), t) {
      case "html":
        if (t = l.documentElement, !t) throw Error(s(452));
        return t;
      case "head":
        if (t = l.head, !t) throw Error(s(453));
        return t;
      case "body":
        if (t = l.body, !t) throw Error(s(454));
        return t;
      default:
        throw Error(s(451));
    }
  }
  function Zn(t) {
    for (var l = t.attributes; l.length; )
      t.removeAttributeNode(l[0]);
    xi(t);
  }
  var wl = /* @__PURE__ */ new Map(), vd = /* @__PURE__ */ new Set();
  function Iu(t) {
    return typeof t.getRootNode == "function" ? t.getRootNode() : t.nodeType === 9 ? t : t.ownerDocument;
  }
  var de = C.d;
  C.d = {
    f: a0,
    r: n0,
    D: u0,
    C: i0,
    L: c0,
    m: f0,
    X: s0,
    S: o0,
    M: r0
  };
  function a0() {
    var t = de.f(), l = Qu();
    return t || l;
  }
  function n0(t) {
    var l = pa(t);
    l !== null && l.tag === 5 && l.type === "form" ? Us(l) : de.r(t);
  }
  var Wa = typeof document > "u" ? null : document;
  function gd(t, l, e) {
    var a = Wa;
    if (a && typeof l == "string" && l) {
      var n = jl(l);
      n = 'link[rel="' + t + '"][href="' + n + '"]', typeof e == "string" && (n += '[crossorigin="' + e + '"]'), vd.has(n) || (vd.add(n), t = { rel: t, crossOrigin: e, href: l }, a.querySelector(n) === null && (l = a.createElement("link"), cl(l, "link", t), tl(l), a.head.appendChild(l)));
    }
  }
  function u0(t) {
    de.D(t), gd("dns-prefetch", t, null);
  }
  function i0(t, l) {
    de.C(t, l), gd("preconnect", t, l);
  }
  function c0(t, l, e) {
    de.L(t, l, e);
    var a = Wa;
    if (a && t && l) {
      var n = 'link[rel="preload"][as="' + jl(l) + '"]';
      l === "image" && e && e.imageSrcSet ? (n += '[imagesrcset="' + jl(
        e.imageSrcSet
      ) + '"]', typeof e.imageSizes == "string" && (n += '[imagesizes="' + jl(
        e.imageSizes
      ) + '"]')) : n += '[href="' + jl(t) + '"]';
      var u = n;
      switch (l) {
        case "style":
          u = Fa(t);
          break;
        case "script":
          u = Ia(t);
      }
      wl.has(u) || (t = U(
        {
          rel: "preload",
          href: l === "image" && e && e.imageSrcSet ? void 0 : t,
          as: l
        },
        e
      ), wl.set(u, t), a.querySelector(n) !== null || l === "style" && a.querySelector(Vn(u)) || l === "script" && a.querySelector(Kn(u)) || (l = a.createElement("link"), cl(l, "link", t), tl(l), a.head.appendChild(l)));
    }
  }
  function f0(t, l) {
    de.m(t, l);
    var e = Wa;
    if (e && t) {
      var a = l && typeof l.as == "string" ? l.as : "script", n = 'link[rel="modulepreload"][as="' + jl(a) + '"][href="' + jl(t) + '"]', u = n;
      switch (a) {
        case "audioworklet":
        case "paintworklet":
        case "serviceworker":
        case "sharedworker":
        case "worker":
        case "script":
          u = Ia(t);
      }
      if (!wl.has(u) && (t = U({ rel: "modulepreload", href: t }, l), wl.set(u, t), e.querySelector(n) === null)) {
        switch (a) {
          case "audioworklet":
          case "paintworklet":
          case "serviceworker":
          case "sharedworker":
          case "worker":
          case "script":
            if (e.querySelector(Kn(u)))
              return;
        }
        a = e.createElement("link"), cl(a, "link", t), tl(a), e.head.appendChild(a);
      }
    }
  }
  function o0(t, l, e) {
    de.S(t, l, e);
    var a = Wa;
    if (a && t) {
      var n = ba(a).hoistableStyles, u = Fa(t);
      l = l || "default";
      var i = n.get(u);
      if (!i) {
        var c = { loading: 0, preload: null };
        if (i = a.querySelector(
          Vn(u)
        ))
          c.loading = 5;
        else {
          t = U(
            { rel: "stylesheet", href: t, "data-precedence": l },
            e
          ), (e = wl.get(u)) && xf(t, e);
          var d = i = a.createElement("link");
          tl(d), cl(d, "link", t), d._p = new Promise(function(p, E) {
            d.onload = p, d.onerror = E;
          }), d.addEventListener("load", function() {
            c.loading |= 1;
          }), d.addEventListener("error", function() {
            c.loading |= 2;
          }), c.loading |= 4, Pu(i, l, a);
        }
        i = {
          type: "stylesheet",
          instance: i,
          count: 1,
          state: c
        }, n.set(u, i);
      }
    }
  }
  function s0(t, l) {
    de.X(t, l);
    var e = Wa;
    if (e && t) {
      var a = ba(e).hoistableScripts, n = Ia(t), u = a.get(n);
      u || (u = e.querySelector(Kn(n)), u || (t = U({ src: t, async: !0 }, l), (l = wl.get(n)) && Sf(t, l), u = e.createElement("script"), tl(u), cl(u, "link", t), e.head.appendChild(u)), u = {
        type: "script",
        instance: u,
        count: 1,
        state: null
      }, a.set(n, u));
    }
  }
  function r0(t, l) {
    de.M(t, l);
    var e = Wa;
    if (e && t) {
      var a = ba(e).hoistableScripts, n = Ia(t), u = a.get(n);
      u || (u = e.querySelector(Kn(n)), u || (t = U({ src: t, async: !0, type: "module" }, l), (l = wl.get(n)) && Sf(t, l), u = e.createElement("script"), tl(u), cl(u, "link", t), e.head.appendChild(u)), u = {
        type: "script",
        instance: u,
        count: 1,
        state: null
      }, a.set(n, u));
    }
  }
  function pd(t, l, e, a) {
    var n = (n = F.current) ? Iu(n) : null;
    if (!n) throw Error(s(446));
    switch (t) {
      case "meta":
      case "title":
        return null;
      case "style":
        return typeof e.precedence == "string" && typeof e.href == "string" ? (l = Fa(e.href), e = ba(
          n
        ).hoistableStyles, a = e.get(l), a || (a = {
          type: "style",
          instance: null,
          count: 0,
          state: null
        }, e.set(l, a)), a) : { type: "void", instance: null, count: 0, state: null };
      case "link":
        if (e.rel === "stylesheet" && typeof e.href == "string" && typeof e.precedence == "string") {
          t = Fa(e.href);
          var u = ba(
            n
          ).hoistableStyles, i = u.get(t);
          if (i || (n = n.ownerDocument || n, i = {
            type: "stylesheet",
            instance: null,
            count: 0,
            state: { loading: 0, preload: null }
          }, u.set(t, i), (u = n.querySelector(
            Vn(t)
          )) && !u._p && (i.instance = u, i.state.loading = 5), wl.has(t) || (e = {
            rel: "preload",
            as: "style",
            href: e.href,
            crossOrigin: e.crossOrigin,
            integrity: e.integrity,
            media: e.media,
            hrefLang: e.hrefLang,
            referrerPolicy: e.referrerPolicy
          }, wl.set(t, e), u || d0(
            n,
            t,
            e,
            i.state
          ))), l && a === null)
            throw Error(s(528, ""));
          return i;
        }
        if (l && a !== null)
          throw Error(s(529, ""));
        return null;
      case "script":
        return l = e.async, e = e.src, typeof e == "string" && l && typeof l != "function" && typeof l != "symbol" ? (l = Ia(e), e = ba(
          n
        ).hoistableScripts, a = e.get(l), a || (a = {
          type: "script",
          instance: null,
          count: 0,
          state: null
        }, e.set(l, a)), a) : { type: "void", instance: null, count: 0, state: null };
      default:
        throw Error(s(444, t));
    }
  }
  function Fa(t) {
    return 'href="' + jl(t) + '"';
  }
  function Vn(t) {
    return 'link[rel="stylesheet"][' + t + "]";
  }
  function bd(t) {
    return U({}, t, {
      "data-precedence": t.precedence,
      precedence: null
    });
  }
  function d0(t, l, e, a) {
    t.querySelector('link[rel="preload"][as="style"][' + l + "]") ? a.loading = 1 : (l = t.createElement("link"), a.preload = l, l.addEventListener("load", function() {
      return a.loading |= 1;
    }), l.addEventListener("error", function() {
      return a.loading |= 2;
    }), cl(l, "link", e), tl(l), t.head.appendChild(l));
  }
  function Ia(t) {
    return '[src="' + jl(t) + '"]';
  }
  function Kn(t) {
    return "script[async]" + t;
  }
  function xd(t, l, e) {
    if (l.count++, l.instance === null)
      switch (l.type) {
        case "style":
          var a = t.querySelector(
            'style[data-href~="' + jl(e.href) + '"]'
          );
          if (a)
            return l.instance = a, tl(a), a;
          var n = U({}, e, {
            "data-href": e.href,
            "data-precedence": e.precedence,
            href: null,
            precedence: null
          });
          return a = (t.ownerDocument || t).createElement(
            "style"
          ), tl(a), cl(a, "style", n), Pu(a, e.precedence, t), l.instance = a;
        case "stylesheet":
          n = Fa(e.href);
          var u = t.querySelector(
            Vn(n)
          );
          if (u)
            return l.state.loading |= 4, l.instance = u, tl(u), u;
          a = bd(e), (n = wl.get(n)) && xf(a, n), u = (t.ownerDocument || t).createElement("link"), tl(u);
          var i = u;
          return i._p = new Promise(function(c, d) {
            i.onload = c, i.onerror = d;
          }), cl(u, "link", a), l.state.loading |= 4, Pu(u, e.precedence, t), l.instance = u;
        case "script":
          return u = Ia(e.src), (n = t.querySelector(
            Kn(u)
          )) ? (l.instance = n, tl(n), n) : (a = e, (n = wl.get(u)) && (a = U({}, e), Sf(a, n)), t = t.ownerDocument || t, n = t.createElement("script"), tl(n), cl(n, "link", a), t.head.appendChild(n), l.instance = n);
        case "void":
          return null;
        default:
          throw Error(s(443, l.type));
      }
    else
      l.type === "stylesheet" && (l.state.loading & 4) === 0 && (a = l.instance, l.state.loading |= 4, Pu(a, e.precedence, t));
    return l.instance;
  }
  function Pu(t, l, e) {
    for (var a = e.querySelectorAll(
      'link[rel="stylesheet"][data-precedence],style[data-precedence]'
    ), n = a.length ? a[a.length - 1] : null, u = n, i = 0; i < a.length; i++) {
      var c = a[i];
      if (c.dataset.precedence === l) u = c;
      else if (u !== n) break;
    }
    u ? u.parentNode.insertBefore(t, u.nextSibling) : (l = e.nodeType === 9 ? e.head : e, l.insertBefore(t, l.firstChild));
  }
  function xf(t, l) {
    t.crossOrigin == null && (t.crossOrigin = l.crossOrigin), t.referrerPolicy == null && (t.referrerPolicy = l.referrerPolicy), t.title == null && (t.title = l.title);
  }
  function Sf(t, l) {
    t.crossOrigin == null && (t.crossOrigin = l.crossOrigin), t.referrerPolicy == null && (t.referrerPolicy = l.referrerPolicy), t.integrity == null && (t.integrity = l.integrity);
  }
  var ti = null;
  function Sd(t, l, e) {
    if (ti === null) {
      var a = /* @__PURE__ */ new Map(), n = ti = /* @__PURE__ */ new Map();
      n.set(e, a);
    } else
      n = ti, a = n.get(e), a || (a = /* @__PURE__ */ new Map(), n.set(e, a));
    if (a.has(t)) return a;
    for (a.set(t, null), e = e.getElementsByTagName(t), n = 0; n < e.length; n++) {
      var u = e[n];
      if (!(u[fn] || u[al] || t === "link" && u.getAttribute("rel") === "stylesheet") && u.namespaceURI !== "http://www.w3.org/2000/svg") {
        var i = u.getAttribute(l) || "";
        i = t + i;
        var c = a.get(i);
        c ? c.push(u) : a.set(i, [u]);
      }
    }
    return a;
  }
  function zd(t, l, e) {
    t = t.ownerDocument || t, t.head.insertBefore(
      e,
      l === "title" ? t.querySelector("head > title") : null
    );
  }
  function m0(t, l, e) {
    if (e === 1 || l.itemProp != null) return !1;
    switch (t) {
      case "meta":
      case "title":
        return !0;
      case "style":
        if (typeof l.precedence != "string" || typeof l.href != "string" || l.href === "")
          break;
        return !0;
      case "link":
        if (typeof l.rel != "string" || typeof l.href != "string" || l.href === "" || l.onLoad || l.onError)
          break;
        return l.rel === "stylesheet" ? (t = l.disabled, typeof l.precedence == "string" && t == null) : !0;
      case "script":
        if (l.async && typeof l.async != "function" && typeof l.async != "symbol" && !l.onLoad && !l.onError && l.src && typeof l.src == "string")
          return !0;
    }
    return !1;
  }
  function Ed(t) {
    return !(t.type === "stylesheet" && (t.state.loading & 3) === 0);
  }
  function h0(t, l, e, a) {
    if (e.type === "stylesheet" && (typeof a.media != "string" || matchMedia(a.media).matches !== !1) && (e.state.loading & 4) === 0) {
      if (e.instance === null) {
        var n = Fa(a.href), u = l.querySelector(
          Vn(n)
        );
        if (u) {
          l = u._p, l !== null && typeof l == "object" && typeof l.then == "function" && (t.count++, t = li.bind(t), l.then(t, t)), e.state.loading |= 4, e.instance = u, tl(u);
          return;
        }
        u = l.ownerDocument || l, a = bd(a), (n = wl.get(n)) && xf(a, n), u = u.createElement("link"), tl(u);
        var i = u;
        i._p = new Promise(function(c, d) {
          i.onload = c, i.onerror = d;
        }), cl(u, "link", a), e.instance = u;
      }
      t.stylesheets === null && (t.stylesheets = /* @__PURE__ */ new Map()), t.stylesheets.set(e, l), (l = e.state.preload) && (e.state.loading & 3) === 0 && (t.count++, e = li.bind(t), l.addEventListener("load", e), l.addEventListener("error", e));
    }
  }
  var zf = 0;
  function y0(t, l) {
    return t.stylesheets && t.count === 0 && ai(t, t.stylesheets), 0 < t.count || 0 < t.imgCount ? function(e) {
      var a = setTimeout(function() {
        if (t.stylesheets && ai(t, t.stylesheets), t.unsuspend) {
          var u = t.unsuspend;
          t.unsuspend = null, u();
        }
      }, 6e4 + l);
      0 < t.imgBytes && zf === 0 && (zf = 62500 * $h());
      var n = setTimeout(
        function() {
          if (t.waitingForImages = !1, t.count === 0 && (t.stylesheets && ai(t, t.stylesheets), t.unsuspend)) {
            var u = t.unsuspend;
            t.unsuspend = null, u();
          }
        },
        (t.imgBytes > zf ? 50 : 800) + l
      );
      return t.unsuspend = e, function() {
        t.unsuspend = null, clearTimeout(a), clearTimeout(n);
      };
    } : null;
  }
  function li() {
    if (this.count--, this.count === 0 && (this.imgCount === 0 || !this.waitingForImages)) {
      if (this.stylesheets) ai(this, this.stylesheets);
      else if (this.unsuspend) {
        var t = this.unsuspend;
        this.unsuspend = null, t();
      }
    }
  }
  var ei = null;
  function ai(t, l) {
    t.stylesheets = null, t.unsuspend !== null && (t.count++, ei = /* @__PURE__ */ new Map(), l.forEach(v0, t), ei = null, li.call(t));
  }
  function v0(t, l) {
    if (!(l.state.loading & 4)) {
      var e = ei.get(t);
      if (e) var a = e.get(null);
      else {
        e = /* @__PURE__ */ new Map(), ei.set(t, e);
        for (var n = t.querySelectorAll(
          "link[data-precedence],style[data-precedence]"
        ), u = 0; u < n.length; u++) {
          var i = n[u];
          (i.nodeName === "LINK" || i.getAttribute("media") !== "not all") && (e.set(i.dataset.precedence, i), a = i);
        }
        a && e.set(null, a);
      }
      n = l.instance, i = n.getAttribute("data-precedence"), u = e.get(i) || a, u === a && e.set(null, n), e.set(i, n), this.count++, a = li.bind(this), n.addEventListener("load", a), n.addEventListener("error", a), u ? u.parentNode.insertBefore(n, u.nextSibling) : (t = t.nodeType === 9 ? t.head : t, t.insertBefore(n, t.firstChild)), l.state.loading |= 4;
    }
  }
  var kn = {
    $$typeof: et,
    Provider: null,
    Consumer: null,
    _currentValue: G,
    _currentValue2: G,
    _threadCount: 0
  };
  function g0(t, l, e, a, n, u, i, c, d) {
    this.tag = 1, this.containerInfo = t, this.pingCache = this.current = this.pendingChildren = null, this.timeoutHandle = -1, this.callbackNode = this.next = this.pendingContext = this.context = this.cancelPendingCommit = null, this.callbackPriority = 0, this.expirationTimes = vi(-1), this.entangledLanes = this.shellSuspendCounter = this.errorRecoveryDisabledLanes = this.expiredLanes = this.warmLanes = this.pingedLanes = this.suspendedLanes = this.pendingLanes = 0, this.entanglements = vi(0), this.hiddenUpdates = vi(null), this.identifierPrefix = a, this.onUncaughtError = n, this.onCaughtError = u, this.onRecoverableError = i, this.pooledCache = null, this.pooledCacheLanes = 0, this.formState = d, this.incompleteTransitions = /* @__PURE__ */ new Map();
  }
  function Td(t, l, e, a, n, u, i, c, d, p, E, N) {
    return t = new g0(
      t,
      l,
      e,
      i,
      d,
      p,
      E,
      N,
      c
    ), l = 1, u === !0 && (l |= 24), u = Tl(3, null, null, l), t.current = u, u.stateNode = t, l = tc(), l.refCount++, t.pooledCache = l, l.refCount++, u.memoizedState = {
      element: a,
      isDehydrated: e,
      cache: l
    }, nc(u), t;
  }
  function Md(t) {
    return t ? (t = Na, t) : Na;
  }
  function _d(t, l, e, a, n, u) {
    n = Md(n), a.context === null ? a.context = n : a.pendingContext = n, a = ze(l), a.payload = { element: e }, u = u === void 0 ? null : u, u !== null && (a.callback = u), e = Ee(t, a, l), e !== null && (bl(e, t, l), Mn(e, t, l));
  }
  function Ad(t, l) {
    if (t = t.memoizedState, t !== null && t.dehydrated !== null) {
      var e = t.retryLane;
      t.retryLane = e !== 0 && e < l ? e : l;
    }
  }
  function Ef(t, l) {
    Ad(t, l), (t = t.alternate) && Ad(t, l);
  }
  function Dd(t) {
    if (t.tag === 13 || t.tag === 31) {
      var l = We(t, 67108864);
      l !== null && bl(l, t, 67108864), Ef(t, 67108864);
    }
  }
  function Nd(t) {
    if (t.tag === 13 || t.tag === 31) {
      var l = Nl();
      l = gi(l);
      var e = We(t, l);
      e !== null && bl(e, t, l), Ef(t, l);
    }
  }
  var ni = !0;
  function p0(t, l, e, a) {
    var n = y.T;
    y.T = null;
    var u = C.p;
    try {
      C.p = 2, Tf(t, l, e, a);
    } finally {
      C.p = u, y.T = n;
    }
  }
  function b0(t, l, e, a) {
    var n = y.T;
    y.T = null;
    var u = C.p;
    try {
      C.p = 8, Tf(t, l, e, a);
    } finally {
      C.p = u, y.T = n;
    }
  }
  function Tf(t, l, e, a) {
    if (ni) {
      var n = Mf(a);
      if (n === null)
        sf(
          t,
          l,
          a,
          ui,
          e
        ), jd(t, a);
      else if (S0(
        n,
        t,
        l,
        e,
        a
      ))
        a.stopPropagation();
      else if (jd(t, a), l & 4 && -1 < x0.indexOf(t)) {
        for (; n !== null; ) {
          var u = pa(n);
          if (u !== null)
            switch (u.tag) {
              case 3:
                if (u = u.stateNode, u.current.memoizedState.isDehydrated) {
                  var i = Jl(u.pendingLanes);
                  if (i !== 0) {
                    var c = u;
                    for (c.pendingLanes |= 2, c.entangledLanes |= 2; i; ) {
                      var d = 1 << 31 - el(i);
                      c.entanglements[1] |= d, i &= ~d;
                    }
                    kl(u), (Tt & 6) === 0 && (Gu = Pt() + 500, Gn(0));
                  }
                }
                break;
              case 31:
              case 13:
                c = We(u, 2), c !== null && bl(c, u, 2), Qu(), Ef(u, 2);
            }
          if (u = Mf(a), u === null && sf(
            t,
            l,
            a,
            ui,
            e
          ), u === n) break;
          n = u;
        }
        n !== null && a.stopPropagation();
      } else
        sf(
          t,
          l,
          a,
          null,
          e
        );
    }
  }
  function Mf(t) {
    return t = _i(t), _f(t);
  }
  var ui = null;
  function _f(t) {
    if (ui = null, t = ga(t), t !== null) {
      var l = H(t);
      if (l === null) t = null;
      else {
        var e = l.tag;
        if (e === 13) {
          if (t = L(l), t !== null) return t;
          t = null;
        } else if (e === 31) {
          if (t = Z(l), t !== null) return t;
          t = null;
        } else if (e === 3) {
          if (l.stateNode.current.memoizedState.isDehydrated)
            return l.tag === 3 ? l.stateNode.containerInfo : null;
          t = null;
        } else l !== t && (t = null);
      }
    }
    return ui = t, null;
  }
  function Cd(t) {
    switch (t) {
      case "beforetoggle":
      case "cancel":
      case "click":
      case "close":
      case "contextmenu":
      case "copy":
      case "cut":
      case "auxclick":
      case "dblclick":
      case "dragend":
      case "dragstart":
      case "drop":
      case "focusin":
      case "focusout":
      case "input":
      case "invalid":
      case "keydown":
      case "keypress":
      case "keyup":
      case "mousedown":
      case "mouseup":
      case "paste":
      case "pause":
      case "play":
      case "pointercancel":
      case "pointerdown":
      case "pointerup":
      case "ratechange":
      case "reset":
      case "resize":
      case "seeked":
      case "submit":
      case "toggle":
      case "touchcancel":
      case "touchend":
      case "touchstart":
      case "volumechange":
      case "change":
      case "selectionchange":
      case "textInput":
      case "compositionstart":
      case "compositionend":
      case "compositionupdate":
      case "beforeblur":
      case "afterblur":
      case "beforeinput":
      case "blur":
      case "fullscreenchange":
      case "focus":
      case "hashchange":
      case "popstate":
      case "select":
      case "selectstart":
        return 2;
      case "drag":
      case "dragenter":
      case "dragexit":
      case "dragleave":
      case "dragover":
      case "mousemove":
      case "mouseout":
      case "mouseover":
      case "pointermove":
      case "pointerout":
      case "pointerover":
      case "scroll":
      case "touchmove":
      case "wheel":
      case "mouseenter":
      case "mouseleave":
      case "pointerenter":
      case "pointerleave":
        return 8;
      case "message":
        switch (mi()) {
          case Le:
            return 2;
          case Qe:
            return 8;
          case wt:
          case ra:
            return 32;
          case he:
            return 268435456;
          default:
            return 32;
        }
      default:
        return 32;
    }
  }
  var Af = !1, Re = null, He = null, Be = null, Jn = /* @__PURE__ */ new Map(), $n = /* @__PURE__ */ new Map(), Ye = [], x0 = "mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset".split(
    " "
  );
  function jd(t, l) {
    switch (t) {
      case "focusin":
      case "focusout":
        Re = null;
        break;
      case "dragenter":
      case "dragleave":
        He = null;
        break;
      case "mouseover":
      case "mouseout":
        Be = null;
        break;
      case "pointerover":
      case "pointerout":
        Jn.delete(l.pointerId);
        break;
      case "gotpointercapture":
      case "lostpointercapture":
        $n.delete(l.pointerId);
    }
  }
  function Wn(t, l, e, a, n, u) {
    return t === null || t.nativeEvent !== u ? (t = {
      blockedOn: l,
      domEventName: e,
      eventSystemFlags: a,
      nativeEvent: u,
      targetContainers: [n]
    }, l !== null && (l = pa(l), l !== null && Dd(l)), t) : (t.eventSystemFlags |= a, l = t.targetContainers, n !== null && l.indexOf(n) === -1 && l.push(n), t);
  }
  function S0(t, l, e, a, n) {
    switch (l) {
      case "focusin":
        return Re = Wn(
          Re,
          t,
          l,
          e,
          a,
          n
        ), !0;
      case "dragenter":
        return He = Wn(
          He,
          t,
          l,
          e,
          a,
          n
        ), !0;
      case "mouseover":
        return Be = Wn(
          Be,
          t,
          l,
          e,
          a,
          n
        ), !0;
      case "pointerover":
        var u = n.pointerId;
        return Jn.set(
          u,
          Wn(
            Jn.get(u) || null,
            t,
            l,
            e,
            a,
            n
          )
        ), !0;
      case "gotpointercapture":
        return u = n.pointerId, $n.set(
          u,
          Wn(
            $n.get(u) || null,
            t,
            l,
            e,
            a,
            n
          )
        ), !0;
    }
    return !1;
  }
  function Od(t) {
    var l = ga(t.target);
    if (l !== null) {
      var e = H(l);
      if (e !== null) {
        if (l = e.tag, l === 13) {
          if (l = L(e), l !== null) {
            t.blockedOn = l, Vf(t.priority, function() {
              Nd(e);
            });
            return;
          }
        } else if (l === 31) {
          if (l = Z(e), l !== null) {
            t.blockedOn = l, Vf(t.priority, function() {
              Nd(e);
            });
            return;
          }
        } else if (l === 3 && e.stateNode.current.memoizedState.isDehydrated) {
          t.blockedOn = e.tag === 3 ? e.stateNode.containerInfo : null;
          return;
        }
      }
    }
    t.blockedOn = null;
  }
  function ii(t) {
    if (t.blockedOn !== null) return !1;
    for (var l = t.targetContainers; 0 < l.length; ) {
      var e = Mf(t.nativeEvent);
      if (e === null) {
        e = t.nativeEvent;
        var a = new e.constructor(
          e.type,
          e
        );
        Mi = a, e.target.dispatchEvent(a), Mi = null;
      } else
        return l = pa(e), l !== null && Dd(l), t.blockedOn = e, !1;
      l.shift();
    }
    return !0;
  }
  function Ud(t, l, e) {
    ii(t) && e.delete(l);
  }
  function z0() {
    Af = !1, Re !== null && ii(Re) && (Re = null), He !== null && ii(He) && (He = null), Be !== null && ii(Be) && (Be = null), Jn.forEach(Ud), $n.forEach(Ud);
  }
  function ci(t, l) {
    t.blockedOn === l && (t.blockedOn = null, Af || (Af = !0, f.unstable_scheduleCallback(
      f.unstable_NormalPriority,
      z0
    )));
  }
  var fi = null;
  function Rd(t) {
    fi !== t && (fi = t, f.unstable_scheduleCallback(
      f.unstable_NormalPriority,
      function() {
        fi === t && (fi = null);
        for (var l = 0; l < t.length; l += 3) {
          var e = t[l], a = t[l + 1], n = t[l + 2];
          if (typeof a != "function") {
            if (_f(a || e) === null)
              continue;
            break;
          }
          var u = pa(e);
          u !== null && (t.splice(l, 3), l -= 3, Tc(
            u,
            {
              pending: !0,
              data: n,
              method: e.method,
              action: a
            },
            a,
            n
          ));
        }
      }
    ));
  }
  function Pa(t) {
    function l(d) {
      return ci(d, t);
    }
    Re !== null && ci(Re, t), He !== null && ci(He, t), Be !== null && ci(Be, t), Jn.forEach(l), $n.forEach(l);
    for (var e = 0; e < Ye.length; e++) {
      var a = Ye[e];
      a.blockedOn === t && (a.blockedOn = null);
    }
    for (; 0 < Ye.length && (e = Ye[0], e.blockedOn === null); )
      Od(e), e.blockedOn === null && Ye.shift();
    if (e = (t.ownerDocument || t).$$reactFormReplay, e != null)
      for (a = 0; a < e.length; a += 3) {
        var n = e[a], u = e[a + 1], i = n[ml] || null;
        if (typeof u == "function")
          i || Rd(e);
        else if (i) {
          var c = null;
          if (u && u.hasAttribute("formAction")) {
            if (n = u, i = u[ml] || null)
              c = i.formAction;
            else if (_f(n) !== null) continue;
          } else c = i.action;
          typeof c == "function" ? e[a + 1] = c : (e.splice(a, 3), a -= 3), Rd(e);
        }
      }
  }
  function Hd() {
    function t(u) {
      u.canIntercept && u.info === "react-transition" && u.intercept({
        handler: function() {
          return new Promise(function(i) {
            return n = i;
          });
        },
        focusReset: "manual",
        scroll: "manual"
      });
    }
    function l() {
      n !== null && (n(), n = null), a || setTimeout(e, 20);
    }
    function e() {
      if (!a && !navigation.transition) {
        var u = navigation.currentEntry;
        u && u.url != null && navigation.navigate(u.url, {
          state: u.getState(),
          info: "react-transition",
          history: "replace"
        });
      }
    }
    if (typeof navigation == "object") {
      var a = !1, n = null;
      return navigation.addEventListener("navigate", t), navigation.addEventListener("navigatesuccess", l), navigation.addEventListener("navigateerror", l), setTimeout(e, 100), function() {
        a = !0, navigation.removeEventListener("navigate", t), navigation.removeEventListener("navigatesuccess", l), navigation.removeEventListener("navigateerror", l), n !== null && (n(), n = null);
      };
    }
  }
  function Df(t) {
    this._internalRoot = t;
  }
  oi.prototype.render = Df.prototype.render = function(t) {
    var l = this._internalRoot;
    if (l === null) throw Error(s(409));
    var e = l.current, a = Nl();
    _d(e, a, t, l, null, null);
  }, oi.prototype.unmount = Df.prototype.unmount = function() {
    var t = this._internalRoot;
    if (t !== null) {
      this._internalRoot = null;
      var l = t.containerInfo;
      _d(t.current, 2, null, t, null, null), Qu(), l[va] = null;
    }
  };
  function oi(t) {
    this._internalRoot = t;
  }
  oi.prototype.unstable_scheduleHydration = function(t) {
    if (t) {
      var l = Zf();
      t = { blockedOn: null, target: t, priority: l };
      for (var e = 0; e < Ye.length && l !== 0 && l < Ye[e].priority; e++) ;
      Ye.splice(e, 0, t), e === 0 && Od(t);
    }
  };
  var Bd = o.version;
  if (Bd !== "19.2.5")
    throw Error(
      s(
        527,
        Bd,
        "19.2.5"
      )
    );
  C.findDOMNode = function(t) {
    var l = t._reactInternals;
    if (l === void 0)
      throw typeof t.render == "function" ? Error(s(188)) : (t = Object.keys(t).join(","), Error(s(268, t)));
    return t = S(l), t = t !== null ? R(t) : null, t = t === null ? null : t.stateNode, t;
  };
  var E0 = {
    bundleType: 0,
    version: "19.2.5",
    rendererPackageName: "react-dom",
    currentDispatcherRef: y,
    reconcilerVersion: "19.2.5"
  };
  if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ < "u") {
    var si = __REACT_DEVTOOLS_GLOBAL_HOOK__;
    if (!si.isDisabled && si.supportsFiber)
      try {
        Q = si.inject(
          E0
        ), Ot = si;
      } catch {
      }
  }
  return In.createRoot = function(t, l) {
    if (!T(t)) throw Error(s(299));
    var e = !1, a = "", n = Qs, u = Zs, i = Vs;
    return l != null && (l.unstable_strictMode === !0 && (e = !0), l.identifierPrefix !== void 0 && (a = l.identifierPrefix), l.onUncaughtError !== void 0 && (n = l.onUncaughtError), l.onCaughtError !== void 0 && (u = l.onCaughtError), l.onRecoverableError !== void 0 && (i = l.onRecoverableError)), l = Td(
      t,
      1,
      !1,
      null,
      null,
      e,
      a,
      null,
      n,
      u,
      i,
      Hd
    ), t[va] = l.current, of(t), new Df(l);
  }, In.hydrateRoot = function(t, l, e) {
    if (!T(t)) throw Error(s(299));
    var a = !1, n = "", u = Qs, i = Zs, c = Vs, d = null;
    return e != null && (e.unstable_strictMode === !0 && (a = !0), e.identifierPrefix !== void 0 && (n = e.identifierPrefix), e.onUncaughtError !== void 0 && (u = e.onUncaughtError), e.onCaughtError !== void 0 && (i = e.onCaughtError), e.onRecoverableError !== void 0 && (c = e.onRecoverableError), e.formState !== void 0 && (d = e.formState)), l = Td(
      t,
      1,
      !0,
      l,
      e ?? null,
      a,
      n,
      d,
      u,
      i,
      c,
      Hd
    ), l.context = Md(null), e = l.current, a = Nl(), a = gi(a), n = ze(a), n.callback = null, Ee(e, n, a), e = a, l.current.lanes = e, cn(l, e), kl(l), t[va] = l.current, of(t), new oi(l);
  }, In.version = "19.2.5", In;
}
var Kd;
function U0() {
  if (Kd) return jf.exports;
  Kd = 1;
  function f() {
    if (!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ > "u" || typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE != "function"))
      try {
        __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(f);
      } catch (o) {
        console.error(o);
      }
  }
  return f(), jf.exports = O0(), jf.exports;
}
var R0 = U0();
const Id = (...f) => f.filter((o, b, s) => !!o && o.trim() !== "" && s.indexOf(o) === b).join(" ").trim();
const H0 = (f) => f.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
const B0 = (f) => f.replace(
  /^([A-Z])|[\s-_]+(\w)/g,
  (o, b, s) => s ? s.toUpperCase() : b.toLowerCase()
);
const kd = (f) => {
  const o = B0(f);
  return o.charAt(0).toUpperCase() + o.slice(1);
};
var Hf = {
  xmlns: "http://www.w3.org/2000/svg",
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round"
};
const Y0 = (f) => {
  for (const o in f)
    if (o.startsWith("aria-") || o === "role" || o === "title")
      return !0;
  return !1;
}, q0 = w.createContext({}), w0 = () => w.useContext(q0), X0 = w.forwardRef(
  ({ color: f, size: o, strokeWidth: b, absoluteStrokeWidth: s, className: T = "", children: H, iconNode: L, ...Z }, D) => {
    const {
      size: S = 24,
      strokeWidth: R = 2,
      absoluteStrokeWidth: U = !1,
      color: Y = "currentColor",
      className: V = ""
    } = w0() ?? {}, tt = s ?? U ? Number(b ?? R) * 24 / Number(o ?? S) : b ?? R;
    return w.createElement(
      "svg",
      {
        ref: D,
        ...Hf,
        width: o ?? S ?? Hf.width,
        height: o ?? S ?? Hf.height,
        stroke: f ?? Y,
        strokeWidth: tt,
        className: Id("lucide", V, T),
        ...!H && !Y0(Z) && { "aria-hidden": "true" },
        ...Z
      },
      [
        ...L.map(([$, st]) => w.createElement($, st)),
        ...Array.isArray(H) ? H : [H]
      ]
    );
  }
);
const Vt = (f, o) => {
  const b = w.forwardRef(
    ({ className: s, ...T }, H) => w.createElement(X0, {
      ref: H,
      iconNode: o,
      className: Id(
        `lucide-${H0(kd(f))}`,
        `lucide-${f}`,
        s
      ),
      ...T
    })
  );
  return b.displayName = kd(f), b;
};
const G0 = [["path", { d: "m9 18 6-6-6-6", key: "mthhwq" }]], Pd = Vt("chevron-right", G0);
const L0 = [
  ["circle", { cx: "12", cy: "12", r: "10", key: "1mglay" }],
  [
    "path",
    {
      d: "m16.24 7.76-1.804 5.411a2 2 0 0 1-1.265 1.265L7.76 16.24l1.804-5.411a2 2 0 0 1 1.265-1.265z",
      key: "9ktpf1"
    }
  ]
], Q0 = Vt("compass", L0);
const Z0 = [
  ["rect", { width: "14", height: "14", x: "8", y: "8", rx: "2", ry: "2", key: "17jyea" }],
  ["path", { d: "M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2", key: "zix9uf" }]
], V0 = Vt("copy", Z0);
const K0 = [
  ["path", { d: "M12 15V3", key: "m9g1x1" }],
  ["path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4", key: "ih7n3h" }],
  ["path", { d: "m7 10 5 5 5-5", key: "brsn70" }]
], tm = Vt("download", K0);
const k0 = [
  [
    "path",
    {
      d: "M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z",
      key: "1oefj6"
    }
  ],
  ["path", { d: "M14 2v5a1 1 0 0 0 1 1h5", key: "wfsgrz" }],
  ["path", { d: "M10 9H8", key: "b1mrlr" }],
  ["path", { d: "M16 13H8", key: "t4e002" }],
  ["path", { d: "M16 17H8", key: "z1uh3a" }]
], J0 = Vt("file-text", k0);
const $0 = [
  ["circle", { cx: "12", cy: "12", r: "3", key: "1v7zrd" }],
  ["path", { d: "M3 7V5a2 2 0 0 1 2-2h2", key: "aa7l1z" }],
  ["path", { d: "M17 3h2a2 2 0 0 1 2 2v2", key: "4qcy5o" }],
  ["path", { d: "M21 17v2a2 2 0 0 1-2 2h-2", key: "6vwrx8" }],
  ["path", { d: "M7 21H5a2 2 0 0 1-2-2v-2", key: "ioqczr" }]
], W0 = Vt("focus", $0);
const F0 = [
  ["path", { d: "M3 7V5c0-1.1.9-2 2-2h2", key: "adw53z" }],
  ["path", { d: "M17 3h2c1.1 0 2 .9 2 2v2", key: "an4l38" }],
  ["path", { d: "M21 17v2c0 1.1-.9 2-2 2h-2", key: "144t0e" }],
  ["path", { d: "M7 21H5c-1.1 0-2-.9-2-2v-2", key: "rtnfgi" }],
  ["rect", { width: "7", height: "5", x: "7", y: "7", rx: "1", key: "1eyiv7" }],
  ["rect", { width: "7", height: "5", x: "10", y: "12", rx: "1", key: "1qlmkx" }]
], I0 = Vt("group", F0);
const P0 = [
  ["path", { d: "M18 11V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2", key: "1fvzgz" }],
  ["path", { d: "M14 10V4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v2", key: "1kc0my" }],
  ["path", { d: "M10 10.5V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2v8", key: "10h0bg" }],
  [
    "path",
    {
      d: "M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15",
      key: "1s1gnw"
    }
  ]
], t1 = Vt("hand", P0);
const l1 = [
  ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2", ry: "2", key: "1m3agn" }],
  ["circle", { cx: "9", cy: "9", r: "2", key: "af1f0g" }],
  ["path", { d: "m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21", key: "1xmnt7" }]
], lm = Vt("image", l1);
const e1 = [
  ["path", { d: "M15 3h6v6", key: "1q9fwt" }],
  ["path", { d: "m21 3-7 7", key: "1l2asr" }],
  ["path", { d: "m3 21 7-7", key: "tjx5ai" }],
  ["path", { d: "M9 21H3v-6", key: "wtvkvv" }]
], a1 = Vt("maximize-2", e1);
const n1 = [["path", { d: "M5 12h14", key: "1ays0h" }]], u1 = Vt("minus", n1);
const i1 = [
  [
    "path",
    {
      d: "M4.037 4.688a.495.495 0 0 1 .651-.651l16 6.5a.5.5 0 0 1-.063.947l-6.124 1.58a2 2 0 0 0-1.438 1.435l-1.579 6.126a.5.5 0 0 1-.947.063z",
      key: "edeuup"
    }
  ]
], c1 = Vt("mouse-pointer-2", i1);
const f1 = [
  ["circle", { cx: "8", cy: "18", r: "4", key: "1fc0mg" }],
  ["path", { d: "M12 18V2l7 4", key: "g04rme" }]
], Bf = Vt("music-2", f1);
const o1 = [
  [
    "path",
    {
      d: "M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z",
      key: "10ikf1"
    }
  ]
], s1 = Vt("play", o1);
const r1 = [
  ["path", { d: "M5 12h14", key: "1ays0h" }],
  ["path", { d: "M12 5v14", key: "s699le" }]
], d1 = Vt("plus", r1);
const m1 = [
  [
    "path",
    {
      d: "M15.39 4.39a1 1 0 0 0 1.68-.474 2.5 2.5 0 1 1 3.014 3.015 1 1 0 0 0-.474 1.68l1.683 1.682a2.414 2.414 0 0 1 0 3.414L19.61 15.39a1 1 0 0 1-1.68-.474 2.5 2.5 0 1 0-3.014 3.015 1 1 0 0 1 .474 1.68l-1.683 1.682a2.414 2.414 0 0 1-3.414 0L8.61 19.61a1 1 0 0 0-1.68.474 2.5 2.5 0 1 1-3.014-3.015 1 1 0 0 0 .474-1.68l-1.683-1.682a2.414 2.414 0 0 1 0-3.414L4.39 8.61a1 1 0 0 1 1.68.474 2.5 2.5 0 1 0 3.014-3.015 1 1 0 0 1-.474-1.68l1.683-1.682a2.414 2.414 0 0 1 3.414 0z",
      key: "w46dr5"
    }
  ]
], h1 = Vt("puzzle", m1);
const y1 = [
  ["path", { d: "M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8", key: "v9h5vc" }],
  ["path", { d: "M21 3v5h-5", key: "1q7to0" }],
  ["path", { d: "M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16", key: "3uifl3" }],
  ["path", { d: "M8 16H3v5", key: "1cv678" }]
], em = Vt("refresh-cw", y1);
const v1 = [
  [
    "path",
    {
      d: "M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z",
      key: "r04s7s"
    }
  ]
], am = Vt("star", v1);
const g1 = [
  ["path", { d: "M10 11v6", key: "nco0om" }],
  ["path", { d: "M14 11v6", key: "outv1u" }],
  ["path", { d: "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6", key: "miytrc" }],
  ["path", { d: "M3 6h18", key: "d0wm0j" }],
  ["path", { d: "M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2", key: "e791ji" }]
], p1 = Vt("trash-2", g1);
const b1 = [
  [
    "path",
    {
      d: "m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5",
      key: "ftymec"
    }
  ],
  ["rect", { x: "2", y: "6", width: "14", height: "12", rx: "2", key: "158x01" }]
], Yf = Vt("video", b1);
const x1 = [
  ["path", { d: "M18 6 6 18", key: "1bl5f8" }],
  ["path", { d: "m6 6 12 12", key: "d8bk6v" }]
], S1 = Vt("x", x1), xl = {
  light: {
    canvas: {
      background: "#f4f2ed",
      dot: "rgba(68,64,60,.28)",
      line: "rgba(68,64,60,.12)",
      selectionStroke: "#1c1917",
      selectionFill: "rgba(28,25,23,.06)"
    },
    node: {
      label: "#57534e",
      fill: "#e7e5df",
      panel: "#fbfaf7",
      stroke: "#d6d3ca",
      activeStroke: "#1c1917",
      placeholder: "#8a8479",
      text: "#292524",
      muted: "#78716c",
      faint: "#a8a29e"
    },
    toolbar: {
      panel: "rgba(251,250,247,.96)",
      border: "#d6d3ca",
      item: "#57534e",
      itemHover: "#e7e5df",
      activeBg: "#e7e5df",
      activeText: "#292524"
    }
  },
  dark: {
    canvas: {
      background: "#181715",
      dot: "rgba(245,245,244,.24)",
      line: "rgba(245,245,244,.10)",
      selectionStroke: "#fafaf9",
      selectionFill: "rgba(250,250,249,.10)"
    },
    node: {
      label: "#d6d3d1",
      fill: "#292524",
      panel: "#1f1d1a",
      stroke: "#44403c",
      activeStroke: "#fafaf9",
      placeholder: "#a8a29e",
      text: "#f5f5f4",
      muted: "#d6d3d1",
      faint: "#78716c"
    },
    toolbar: {
      panel: "rgba(31,29,26,.96)",
      border: "#44403c",
      item: "#d6d3d1",
      itemHover: "#292524",
      activeBg: "#3a3631",
      activeText: "#f5f5f4"
    }
  }
};
function Sl(f) {
  return f({ theme: "light" });
}
function z1({ containerRef: f, viewport: o, tool: b, backgroundMode: s = "lines", onViewportChange: T, onCanvasMouseDown: H, onCanvasDeselect: L, onCanvasDoubleClick: Z, onContextMenu: D, onDrop: S, children: R }) {
  const U = xl[Sl((k) => k.theme)], Y = w.useRef({
    isPanning: !1,
    startX: 0,
    startY: 0,
    initialX: 0,
    initialY: 0,
    hasMoved: !1,
    startedOnBackground: !1
  }), V = w.useRef(o.k), tt = w.useRef(null), $ = w.useRef(null), [st, O] = w.useState(!1), [W, et] = w.useState(!1), [X, nt] = w.useState(!1);
  w.useEffect(() => {
    V.current = o.k;
  }, [o.k]), w.useEffect(
    () => () => {
      tt.current && cancelAnimationFrame(tt.current);
    },
    []
  ), w.useEffect(() => {
    const k = (it) => {
      if (it.key === "Control" && et(!0), it.code !== "Space") return;
      const y = it.target instanceof Element ? it.target : null;
      it.target instanceof HTMLInputElement || it.target instanceof HTMLTextAreaElement || it.target instanceof HTMLSelectElement || y?.closest("[contenteditable='true']") || (it.preventDefault(), O(!0));
    }, bt = (it) => {
      if (it.code === "Space") {
        const y = it.target instanceof Element ? it.target : null;
        it.target instanceof HTMLInputElement || it.target instanceof HTMLTextAreaElement || it.target instanceof HTMLSelectElement || y?.closest("[contenteditable='true']") || it.preventDefault(), O(!1);
      }
      it.key === "Control" && et(!1);
    }, zt = () => {
      O(!1), et(!1), Y.current.isPanning = !1, nt(!1), document.body.style.cursor = "";
    };
    return window.addEventListener("keydown", k), window.addEventListener("keyup", bt), window.addEventListener("blur", zt), () => {
      window.removeEventListener("keydown", k), window.removeEventListener("keyup", bt), window.removeEventListener("blur", zt);
    };
  }, []);
  const rt = (k) => {
    if ((k.target instanceof Element ? k.target : null)?.closest("[data-canvas-no-zoom],.ant-modal,.ant-popover,.ant-dropdown,.ant-select-dropdown,.ant-picker-dropdown")) return;
    const zt = -k.deltaY, it = Math.pow(1.1, zt / 100), y = Math.min(Math.max(o.k * it, 0.05), 5), C = f.current?.getBoundingClientRect();
    if (!C) return;
    const G = k.clientX - C.left, _ = k.clientY - C.top, q = (G - o.x) / o.k, r = (_ - o.y) / o.k;
    T({
      x: G - q * y,
      y: _ - r * y,
      k: y
    });
  }, K = (k) => {
    const bt = k.target instanceof Element ? k.target : null;
    if (bt?.closest("[data-canvas-no-zoom]") || bt?.closest("[data-connection-create-menu]")) return;
    const zt = !bt?.closest("[data-node-id],[data-connection-id]"), y = k.ctrlKey || st ? b === "select" ? "pan" : "select" : b;
    if (k.button === 1 || k.button === 0 && y === "pan" && zt) {
      k.preventDefault(), k.currentTarget.setPointerCapture(k.pointerId), Y.current = {
        isPanning: !0,
        startX: k.clientX,
        startY: k.clientY,
        initialX: o.x,
        initialY: o.y,
        hasMoved: !1,
        startedOnBackground: zt
      }, nt(!0), document.body.style.cursor = "grabbing";
      return;
    }
    k.button === 0 && zt && (k.preventDefault(), k.currentTarget.setPointerCapture(k.pointerId), H?.(k));
  }, pt = (k) => {
    (k.target instanceof Element ? k.target : null)?.closest("[data-canvas-no-zoom],[data-node-id],[data-connection-id]") || Z?.(k);
  };
  w.useEffect(() => {
    const k = (zt) => {
      if (!Y.current.isPanning) return;
      const it = zt.clientX - Y.current.startX, y = zt.clientY - Y.current.startY;
      (Math.abs(it) > 3 || Math.abs(y) > 3) && (Y.current.hasMoved = !0), $.current = {
        x: Y.current.initialX + it,
        y: Y.current.initialY + y,
        k: V.current
      }, !tt.current && (tt.current = requestAnimationFrame(() => {
        tt.current = null, $.current && T($.current);
      }));
    }, bt = () => {
      Y.current.isPanning && (!Y.current.hasMoved && Y.current.startedOnBackground && L?.(), Y.current.isPanning = !1, nt(!1), document.body.style.cursor = "");
    };
    return window.addEventListener("pointermove", k), window.addEventListener("pointerup", bt), window.addEventListener("pointercancel", bt), () => {
      window.removeEventListener("pointermove", k), window.removeEventListener("pointerup", bt), window.removeEventListener("pointercancel", bt), document.body.style.cursor = "";
    };
  }, [L, T]), w.useEffect(() => {
    const k = f.current;
    if (!k) return;
    const bt = (zt) => {
      (zt.target instanceof Element ? zt.target : null)?.closest("[data-canvas-no-zoom],.ant-modal,.ant-popover,.ant-dropdown,.ant-select-dropdown,.ant-picker-dropdown") || zt.preventDefault();
    };
    return k.addEventListener("wheel", bt, { passive: !1 }), () => k.removeEventListener("wheel", bt);
  }, [f]);
  const Ft = X ? "grabbing" : (W || st ? b === "select" ? "pan" : "select" : b) === "pan" ? "grab" : void 0;
  return /* @__PURE__ */ m.jsxs(
    "div",
    {
      ref: f,
      className: "relative h-full w-full select-none overflow-clip",
      style: { background: U.canvas.background, cursor: Ft },
      onPointerDown: K,
      onDoubleClick: pt,
      onWheel: rt,
      onContextMenu: D,
      onDragOver: (k) => k.preventDefault(),
      onDrop: S,
      children: [
        /* @__PURE__ */ m.jsx(E1, { viewport: o, mode: s }),
        /* @__PURE__ */ m.jsx(
          "div",
          {
            className: "absolute origin-top-left",
            style: {
              transform: `translate(${o.x}px, ${o.y}px) scale(${o.k})`
            },
            children: R
          }
        )
      ]
    }
  );
}
function E1({ viewport: f, mode: o }) {
  const b = xl[Sl((D) => D.theme)];
  if (o === "blank") return null;
  const s = 48 * f.k, T = f.x % s, H = f.y % s, L = f.k < 0.12 ? 0.8 : 1.15, Z = o === "dots" ? `radial-gradient(circle, ${b.canvas.dot} ${L}px, transparent ${L + 0.2}px)` : `linear-gradient(${b.canvas.line} 1px, transparent 1px), linear-gradient(90deg, ${b.canvas.line} 1px, transparent 1px)`;
  return /* @__PURE__ */ m.jsx(
    "div",
    {
      className: "pointer-events-none absolute inset-0 opacity-40",
      style: {
        backgroundImage: Z,
        backgroundSize: `${s}px ${s}px`,
        backgroundPosition: `${T}px ${H}px`
      }
    }
  );
}
function T1(f) {
  return f > 0 ? `${(f / 1024).toFixed(1)} KB` : "";
}
const M1 = { image: "#10b981", video: "#f97316", audio: "#a855f7", text: "#78716c" };
function nm(f) {
  return {
    minimapColor: M1[f],
    interactionToggle: !1,
    transparentBackground: !1,
    hasSourceHandle: !1,
    forceInteractive: (o) => !0,
    keepAspectRatio: (o) => o.type === "image" || o.type === "video"
  };
}
var _1 = Fd();
function um(f) {
  const o = f.nativeEvent;
  return !!(f.isComposing || o?.isComposing || f.keyCode === 229 || f.which === 229 || o?.keyCode === 229 || o?.which === 229);
}
function A1(f) {
  return f.key === "Enter" && !f.shiftKey && !f.ctrlKey && !f.metaKey && !um(f);
}
const D1 = w.forwardRef(function({ value: o, references: b, onChange: s, onSubmit: T, onKeyDown: H, className: L, containerClassName: Z, style: D, highlightLabels: S = !0, ...R }, U) {
  const Y = xl[Sl((y) => y.theme)], V = w.useRef(null), tt = w.useRef(null), [$, st] = w.useState(null), [O, W] = w.useState(0), [et, X] = w.useState(!1), nt = w.useMemo(() => {
    if (!$) return [];
    const y = $.query.trim().toLowerCase(), C = b.filter((G) => G.active);
    return y ? C.filter((G) => `${G.label} ${G.title} ${G.kind} ${G.text || ""}`.toLowerCase().includes(y)) : C;
  }, [$, b]), rt = w.useMemo(() => S ? Array.from(new Set(b.filter((y) => y.active).map((y) => y.label))).sort((y, C) => C.length - y.length) : [], [S, b]), K = (y, C) => {
    s(y), typeof C == "number" && requestAnimationFrame(() => {
      V.current?.focus(), V.current?.setSelectionRange(C, C);
    });
  }, pt = () => {
    st(null), W(0);
  }, Mt = (y, C) => {
    const G = y.slice(0, C), _ = /(^|\s)@([^\s@]*)$/.exec(G);
    if (!_ || !b.some((q) => q.active)) {
      pt();
      return;
    }
    st({ start: C - _[2].length - 1, query: _[2] }), W(0);
  }, qt = (y) => {
    if (!$) return;
    const G = V.current?.selectionStart ?? o.length, _ = `${y.label} `, q = `${o.slice(0, $.start)}${_}${o.slice(G)}`;
    pt(), K(q, $.start + _.length);
  }, Ft = () => {
    !tt.current || !V.current || (tt.current.scrollTop = V.current.scrollTop, tt.current.scrollLeft = V.current.scrollLeft);
  }, k = () => {
    const y = V.current;
    X(!!(y && y.selectionStart !== y.selectionEnd));
  }, bt = !!(rt.length && !et), zt = {
    ...D || {},
    color: bt ? "transparent" : D?.color,
    caretColor: D?.color || Y.node.text,
    cursor: "text",
    // The highlight layer covers the textarea when showOverlay is active, so keep the textarea above it to preserve the native caret.
    ...bt ? { position: "relative", zIndex: 1, background: "transparent", backgroundColor: "transparent" } : {}
  }, it = $ && nt.length && V.current ? /* @__PURE__ */ m.jsx(C1, { textarea: V.current, caretIndex: $.start, references: nt, activeIndex: Math.min(O, nt.length - 1), theme: Y, onSelect: qt }) : null;
  return /* @__PURE__ */ m.jsxs("div", { className: `relative h-full w-full ${Z || ""}`, children: [
    bt ? /* @__PURE__ */ m.jsx("div", { ref: tt, className: `${L || ""} pointer-events-none absolute inset-0 overflow-hidden whitespace-pre-wrap break-words`, style: { ...D, color: Y.node.text }, children: /* @__PURE__ */ m.jsx(N1, { value: o || R.placeholder?.toString() || "", labels: rt, placeholder: !o }) }) : null,
    /* @__PURE__ */ m.jsx(
      "textarea",
      {
        ...R,
        ref: (y) => {
          V.current = y, typeof U == "function" ? U(y) : U && (U.current = y);
        },
        value: o,
        className: L,
        style: zt,
        onChange: (y) => {
          const C = y.target.value;
          s(C), Mt(C, y.target.selectionStart), requestAnimationFrame(() => {
            Ft(), k();
          });
        },
        onSelect: (y) => {
          k(), R.onSelect?.(y);
        },
        onKeyUp: (y) => {
          k(), R.onKeyUp?.(y);
        },
        onPointerUp: (y) => {
          k(), R.onPointerUp?.(y);
        },
        onKeyDown: (y) => {
          if (um(y)) {
            H?.(y);
            return;
          }
          if ((y.key === "Backspace" || y.key === "Delete") && !$) {
            const C = V.current;
            if (C && C.selectionStart === C.selectionEnd) {
              const G = R1(o, C.selectionStart, y.key === "Backspace" ? "backward" : "forward", rt);
              if (G) {
                y.preventDefault(), K(G.value, G.caret), requestAnimationFrame(k);
                return;
              }
            }
          }
          if ($ && nt.length) {
            if (y.key === "ArrowDown") {
              y.preventDefault(), W((C) => (C + 1) % nt.length);
              return;
            }
            if (y.key === "ArrowUp") {
              y.preventDefault(), W((C) => (C - 1 + nt.length) % nt.length);
              return;
            }
            if (y.key === "Enter") {
              y.preventDefault(), qt(nt[Math.min(O, nt.length - 1)]);
              return;
            }
            if (y.key === "Escape") {
              y.preventDefault(), pt();
              return;
            }
          }
          if (A1(y) && T) {
            y.preventDefault(), T();
            return;
          }
          H?.(y);
        },
        onScroll: (y) => {
          Ft(), R.onScroll?.(y);
        },
        onBlur: (y) => {
          X(!1), window.setTimeout(pt, 120), R.onBlur?.(y);
        }
      }
    ),
    it
  ] });
});
function N1({ value: f, labels: o, placeholder: b }) {
  if (b) return /* @__PURE__ */ m.jsx("span", { className: "opacity-45", children: f });
  if (!o.length) return /* @__PURE__ */ m.jsx(m.Fragment, { children: f });
  const s = new RegExp(`(${o.map(qf).join("|")})`, "g");
  return /* @__PURE__ */ m.jsx(m.Fragment, { children: f.split(s).map(
    (T, H) => o.includes(T) ? /* @__PURE__ */ m.jsx("span", { className: "rounded-md bg-[#2f80ff]/16 px-1 py-0.5 font-medium text-[#2f80ff] ring-1 ring-[#2f80ff]/24", children: T }, `${T}-${H}`) : /* @__PURE__ */ m.jsx("span", { children: T }, `${T}-${H}`)
  ) });
}
function C1({ textarea: f, caretIndex: o, references: b, activeIndex: s, theme: T, onSelect: H }) {
  const L = w.useRef(!1), Z = f.getBoundingClientRect(), D = f.closest(".ant-modal-content")?.getBoundingClientRect() || { left: 8, top: 8, right: window.innerWidth - 8, bottom: window.innerHeight - 8 }, S = 256, R = 224, U = 6, Y = f.offsetWidth ? Z.width / f.offsetWidth : 1, V = window.getComputedStyle(f), tt = (parseFloat(V.lineHeight) || parseFloat(V.fontSize) * 1.4 || 20) * Y, $ = U1(f, o), st = Z.left + ($.left - f.scrollLeft) * Y, O = Z.top + ($.top - f.scrollTop) * Y, W = Jd(st, D.left + 8, D.right - S - 8), et = O + tt + U + R > D.bottom && O - U - R >= D.top, X = Jd(et ? O - U - R : O + tt + U, D.top + 8, D.bottom - R - 8), nt = (K) => {
    K.stopPropagation();
  }, rt = (K) => {
    L.current || (L.current = !0, H(K));
  };
  return _1.createPortal(
    /* @__PURE__ */ m.jsx(
      "div",
      {
        "data-canvas-resource-mention-menu": "true",
        className: "fixed z-[120] max-h-56 w-64 overflow-y-auto rounded-xl border p-1 shadow-2xl backdrop-blur-md",
        style: { left: W, top: X, background: T.toolbar.panel, borderColor: T.toolbar.border, color: T.node.text },
        onPointerDown: nt,
        onMouseDown: nt,
        onClick: (K) => K.stopPropagation(),
        children: b.map((K, pt) => /* @__PURE__ */ m.jsxs(
          "button",
          {
            type: "button",
            className: "flex w-full min-w-0 items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition",
            style: { background: pt === s ? T.toolbar.activeBg : "transparent", color: pt === s ? T.toolbar.activeText : T.node.text },
            onPointerDown: (Mt) => {
              Mt.preventDefault(), Mt.stopPropagation(), rt(K);
            },
            onClick: (Mt) => {
              Mt.preventDefault(), Mt.stopPropagation(), rt(K);
            },
            children: [
              /* @__PURE__ */ m.jsx(j1, { reference: K }),
              /* @__PURE__ */ m.jsxs("span", { className: "min-w-0 flex-1", children: [
                /* @__PURE__ */ m.jsx("span", { className: "block font-medium", children: K.label }),
                /* @__PURE__ */ m.jsx("span", { className: "block truncate opacity-65", children: K.text || K.title })
              ] })
            ]
          },
          K.id
        ))
      }
    ),
    document.body
  );
}
function j1({ reference: f }) {
  if (f.kind === "image" && f.previewUrl) return /* @__PURE__ */ m.jsx("img", { src: f.previewUrl, alt: "", className: "size-9 rounded-md object-cover" });
  if (f.kind === "video" && f.previewUrl) return /* @__PURE__ */ m.jsx("video", { src: f.previewUrl, className: "size-9 rounded-md bg-black object-cover", muted: !0, preload: "metadata" });
  const o = f.kind === "audio" ? Bf : f.kind === "video" ? Yf : f.kind === "image" ? lm : J0;
  return /* @__PURE__ */ m.jsx("span", { className: "grid size-9 shrink-0 place-items-center rounded-md bg-black/10", children: /* @__PURE__ */ m.jsx(o, { className: "size-4" }) });
}
function Jd(f, o, b) {
  return b < o ? o : Math.min(Math.max(f, o), b);
}
const O1 = ["boxSizing", "width", "paddingTop", "paddingRight", "paddingBottom", "paddingLeft", "borderTopWidth", "borderRightWidth", "borderBottomWidth", "borderLeftWidth", "fontStyle", "fontVariant", "fontWeight", "fontStretch", "fontSize", "lineHeight", "fontFamily", "textAlign", "textIndent", "letterSpacing", "wordSpacing", "tabSize", "textTransform"];
function U1(f, o) {
  const b = window.getComputedStyle(f), s = document.createElement("div"), T = s.style;
  T.position = "absolute", T.top = "0", T.left = "-9999px", T.visibility = "hidden", T.whiteSpace = "pre-wrap", T.overflowWrap = "break-word";
  for (const Z of O1) T[Z] = b[Z];
  s.textContent = f.value.slice(0, o);
  const H = document.createElement("span");
  H.textContent = f.value.slice(o) || ".", s.appendChild(H), document.body.appendChild(s);
  const L = { left: H.offsetLeft, top: H.offsetTop };
  return document.body.removeChild(s), L;
}
function qf(f) {
  return f.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function R1(f, o, b, s) {
  if (b === "backward") {
    const T = f.slice(0, o);
    for (const H of s) {
      if (!H) continue;
      const L = new RegExp(`(^|\\s)(${qf(H)})\\s*$`).exec(T);
      if (L) {
        const Z = L.index + L[1].length;
        return { value: f.slice(0, Z) + f.slice(o), caret: Z };
      }
    }
  } else {
    if (o > 0 && !/\s/.test(f[o - 1])) return null;
    const T = f.slice(o);
    for (const H of s) {
      if (!H) continue;
      const L = new RegExp(`^(\\s*)(${qf(H)})(?=\\s|$)`).exec(T);
      if (L)
        return { value: f.slice(0, o) + f.slice(o + L[0].length), caret: o };
    }
  }
  return null;
}
var Lt = /* @__PURE__ */ ((f) => (f.Image = "image", f.Text = "text", f.Config = "config", f.Video = "video", f.Audio = "audio", f.Group = "group", f))(Lt || {});
const H1 = {
  "canvas.node.untitled": "未命名素材",
  "canvas.node.renameHint": "项目素材名称",
  "canvas.node.emptyImage": "暂无图片",
  "canvas.node.emptyVideo": "暂无视频",
  "canvas.node.emptyAudio": "暂无音频",
  "canvas.node.audio": "音频",
  "canvas.node.editText": "暂无文本内容",
  "canvas.node.generating": "生成中",
  "canvas.node.failed": "生成失败",
  "canvas.node.retry": "重试",
  "canvas.node.missingPlugin": "未支持的节点",
  "common.download": "下载",
  "common.delete": "删除"
};
function sl() {
  return { t: (f, o) => H1[f] || f };
}
const me = "#2f80ff", B1 = Wd.memo(function({
  data: o,
  scale: b,
  isSelected: s,
  isRelated: T,
  isFocusRelated: H,
  isConnectionTarget: L,
  isConnecting: Z,
  referenceSelectionState: D,
  showPanel: S,
  showImageInfo: R,
  mentionReferences: U = [],
  readOnly: Y = !0,
  showConnectionHandles: V = !1,
  renderPanel: tt,
  renderNodeContent: $,
  groupChildCount: st = 0,
  isGroupDropTarget: O = !1,
  batchExpanded: W = !1,
  onMouseDown: et,
  onSelectCapture: X,
  onHoverStart: nt,
  onHoverEnd: rt,
  onConnectStart: K,
  onResizeStart: pt,
  onResize: Mt,
  onResizeEnd: qt,
  onContentChange: Ft,
  onTitleChange: k,
  onToggleBatch: bt,
  onSetBatchPrimary: zt,
  onDuplicateBatchImage: it,
  onDownloadBatchImage: y,
  onRetryBatchImage: C,
  onDeleteBatchImage: G,
  onRetry: _,
  onViewImage: q,
  onSelectReference: r,
  onContextMenu: M
}) {
  const j = xl[Sl((Q) => Q.theme)], { t: B } = sl(), [P, F] = w.useState(!1), ft = nm(o.type), [Et, gt] = w.useState(!1), [Bt, Yt] = w.useState(!1), [we, Xe] = w.useState(o.title || ""), rl = o.type === Lt.Image && !!o.metadata?.content, Ge = o.type === Lt.Video && !!o.metadata?.content, ln = o.type === Lt.Audio && !!o.metadata?.content, Ql = o.type === Lt.Group, en = o.type === Lt.Image ? o.metadata?.images?.length || 0 : o.type === Lt.Text && o.metadata?.texts?.length || 0, oa = en > 1, sa = !!ft?.interactionToggle, an = sa ? !!ft?.forceInteractive?.(o) : !1, di = !sa || an || !o.metadata?.content ? !0 : !!o.metadata?.interactive, nn = !!ft?.transparentBackground, Pt = L || s || H, mi = Pt ? me : T ? j.node.muted : "transparent", Le = w.useRef(null), Qe = w.useRef(null), wt = w.useRef({
    isResizing: !1,
    corner: "bottom-right",
    startX: 0,
    startY: 0,
    startLeft: 0,
    startTop: 0,
    startWidth: 0,
    startHeight: 0,
    keepRatio: !1,
    ratio: 1
  });
  w.useEffect(() => {
    Xe(o.title || "");
  }, [o.title]), w.useEffect(() => {
    Bt && (Qe.current?.focus(), Qe.current?.select());
  }, [Bt]);
  const ra = w.useCallback(() => {
    const Q = we.trim() || o.title || B("canvas.node.untitled");
    Xe(Q), Yt(!1), Q !== o.title && k(o.id, Q);
  }, [o.id, o.title, k, B, we]);
  w.useEffect(() => {
    if (!Bt) return;
    const Q = (Ot) => {
      const Kt = Ot.target;
      Kt instanceof Node && Qe.current?.contains(Kt) || ra();
    };
    return window.addEventListener("pointerdown", Q, !0), () => window.removeEventListener("pointerdown", Q, !0);
  }, [ra, Bt]), w.useEffect(() => {
    const Q = Le.current;
    if (!Q) return;
    const Ot = (Kt) => Kt.stopPropagation();
    return Q.addEventListener("wheel", Ot, { passive: !1 }), () => Q.removeEventListener("wheel", Ot);
  }, [o.type, Et]), w.useEffect(() => {
    if (!Et) return;
    const Q = Le.current;
    Q?.focus(), Q?.setSelectionRange(Q.value.length, Q.value.length);
  }, [Et]), w.useEffect(() => {
    if (!Et) return;
    const Q = (Ot) => {
      const Kt = Ot.target;
      Kt instanceof Node && (Et && Le.current?.contains(Kt) || gt(!1));
    };
    return window.addEventListener("pointerdown", Q, !0), () => window.removeEventListener("pointerdown", Q, !0);
  }, [Et]);
  const he = w.useCallback(
    (Q) => {
      if (!wt.current.isResizing) return;
      const Ot = (Q.clientX - wt.current.startX) / b, Kt = (Q.clientY - wt.current.startY) / b, el = 220, un = 160, hi = wt.current.startLeft + wt.current.startWidth, yi = wt.current.startTop + wt.current.startHeight, Ze = wt.current.corner.includes("left"), Ve = wt.current.corner.includes("top"), ha = Math.max(el, wt.current.startWidth + (Ze ? -Ot : Ot)), Jl = Math.max(un, wt.current.startHeight + (Ve ? -Kt : Kt));
      let zl = ha, dl = Jl;
      if (wt.current.keepRatio) {
        const ya = wt.current.ratio;
        Math.abs(Ot) >= Math.abs(Kt) ? dl = zl / ya : zl = dl * ya, dl < un && (dl = un, zl = dl * ya), zl < el && (zl = el, dl = zl / ya);
      }
      Mt(o.id, zl, dl, {
        x: Ze ? hi - zl : wt.current.startLeft,
        y: Ve ? yi - dl : wt.current.startTop
      });
    },
    [o.id, Mt, b]
  ), da = w.useCallback(() => {
    wt.current.isResizing = !1, window.removeEventListener("mousemove", he), window.removeEventListener("mouseup", da), qt(o.id);
  }, [o.id, he, qt]), ma = (Q, Ot) => {
    Q.stopPropagation(), Q.preventDefault(), pt(o.id), wt.current = {
      isResizing: !0,
      corner: Ot,
      startX: Q.clientX,
      startY: Q.clientY,
      startLeft: o.position.x,
      startTop: o.position.y,
      startWidth: o.width,
      startHeight: o.height,
      keepRatio: o.type === Lt.Image && !o.metadata?.freeResize || o.type === Lt.Video || !!ft?.keepAspectRatio?.(o),
      ratio: (o.metadata?.naturalWidth || o.width) / (o.metadata?.naturalHeight || o.height || 1)
    }, window.addEventListener("mousemove", he), window.addEventListener("mouseup", da);
  };
  return w.useEffect(() => () => {
    window.removeEventListener("mousemove", he), window.removeEventListener("mouseup", da);
  }, [he, da]), /* @__PURE__ */ m.jsxs(
    "div",
    {
      "data-node-id": o.id,
      className: `node-element absolute flex select-none flex-col transition-shadow duration-200 ${Ql ? "z-[5]" : s ? "z-50" : "z-10"} ${D === "available" ? "cursor-pointer" : D ? "cursor-not-allowed" : ""}`,
      style: {
        transform: `translate(${o.position.x}px, ${o.position.y}px)`,
        width: o.width,
        height: o.height,
        transition: "box-shadow 200ms ease",
        contain: "layout style"
      },
      onMouseEnter: () => {
        F(!0), nt(o.id);
      },
      onMouseLeave: () => {
        F(!1), rt(o.id);
      },
      onMouseDownCapture: (Q) => {
        D || X?.(Q, o.id);
      },
      onContextMenu: (Q) => {
        D ? Q.preventDefault() : M(Q, o.id);
      },
      children: [
        !D && (s || P || Bt) && /* @__PURE__ */ m.jsx("div", { className: "absolute left-3 top-[-28px] z-[65] max-w-[calc(100%-24px)]", onMouseDown: (Q) => Q.stopPropagation(), onPointerDown: (Q) => Q.stopPropagation(), children: Bt ? /* @__PURE__ */ m.jsx(
          "input",
          {
            ref: Qe,
            value: we,
            maxLength: 64,
            className: "h-6 max-w-full border-0 border-b border-dashed bg-transparent px-0 text-left text-xs font-medium outline-none",
            style: { borderColor: j.node.muted, color: j.node.text },
            onChange: (Q) => Xe(Q.target.value),
            onBlur: ra,
            onKeyDown: (Q) => {
              Q.key === "Enter" && ra(), Q.key === "Escape" && (Xe(o.title || ""), Yt(!1));
            }
          }
        ) : /* @__PURE__ */ m.jsx(
          "button",
          {
            type: "button",
            className: "block max-w-full truncate border-b border-dashed border-transparent px-0 py-0.5 text-left text-xs font-medium opacity-75 transition hover:border-current hover:opacity-100",
            style: { color: j.node.text },
            title: B("canvas.node.renameHint"),
            onDoubleClick: (Q) => {
              Q.stopPropagation(), Y || Yt(!0);
            },
            children: o.title || B("canvas.node.untitled")
          }
        ) }),
        /* @__PURE__ */ m.jsxs(
          "div",
          {
            className: "relative h-full w-full overflow-visible rounded-3xl border-2",
            style: {
              background: Ql || rl || Ge || nn ? "transparent" : j.node.fill,
              borderColor: Ql ? O || Pt ? me : j.node.stroke : rl ? mi : Pt ? me : T ? j.node.muted : nn ? "transparent" : j.node.stroke,
              borderStyle: Ql ? "dashed" : "solid",
              boxShadow: O ? `0 0 0 2px ${me}66, inset 0 0 0 999px ${me}10` : Pt ? `0 0 0 1px ${me}55` : T ? `0 0 0 1px ${j.node.muted}55, 0 18px 48px rgba(0,0,0,.14)` : void 0
            },
            onMouseDown: (Q) => {
              D ? Q.button === 0 && D === "available" && (Q.stopPropagation(), r?.(o.id)) : et(Q, o.id);
            },
            onDoubleClick: (Q) => {
              if (D) {
                Q.stopPropagation();
                return;
              }
              if (Y) {
                Q.stopPropagation(), q?.(o);
                return;
              }
              if (o.type === Lt.Image && rl) {
                Q.stopPropagation(), q?.(o);
                return;
              }
              o.type === Lt.Text && (Q.stopPropagation(), gt(!0));
            },
            children: [
              /* @__PURE__ */ m.jsx(
                "div",
                {
                  className: `relative flex h-full w-full items-center justify-center rounded-[inherit] ${oa ? "overflow-visible" : "overflow-hidden"}`,
                  style: {
                    background: Ql || rl || Ge || nn ? "transparent" : j.node.fill,
                    pointerEvents: di ? void 0 : "none"
                  },
                  children: /* @__PURE__ */ m.jsx(
                    Y1,
                    {
                      node: o,
                      theme: j,
                      isEditingContent: Et,
                      textareaRef: Le,
                      isBatchRoot: oa,
                      batchCount: en,
                      batchExpanded: W,
                      renderNodeContent: $,
                      mentionReferences: U,
                      onContentChange: Ft,
                      onStopEditing: () => gt(!1),
                      onRetry: _,
                      onToggleBatch: () => bt?.(o.id),
                      onSetBatchPrimary: (Q) => zt?.(o.id, Q),
                      onDuplicateBatchImage: (Q) => it?.(o, Q),
                      onDownloadBatchImage: (Q) => y?.(o, Q),
                      onRetryBatchImage: (Q) => C?.(o, Q),
                      onDeleteBatchImage: (Q) => G?.(o.id, Q),
                      onViewBatchImage: (Q) => q?.(o, Q),
                      groupChildCount: st
                    }
                  )
                }
              ),
              R && rl ? /* @__PURE__ */ m.jsx(J1, { node: o }) : null,
              !Ql && !rl && !Ge && !ln ? /* @__PURE__ */ m.jsx("div", { className: "pointer-events-none absolute inset-x-0 bottom-0 h-12", style: { background: `linear-gradient(to top, ${j.canvas.background}66, transparent)` } }) : null,
              D && (D !== "available" || P) ? /* @__PURE__ */ m.jsx("div", { className: "pointer-events-none absolute inset-0 z-[60] grid place-items-center rounded-[inherit]", style: { background: `color-mix(in srgb, ${j.canvas.background} ${D === "target" ? 78 : D === "disabled" ? 60 : 34}%, transparent)`, boxShadow: D === "available" ? `inset 0 0 0 2px ${me}` : void 0 }, children: D !== "disabled" ? /* @__PURE__ */ m.jsx("span", { className: "rounded-lg px-3 py-2 text-sm font-medium shadow-sm", style: { background: j.toolbar.panel, color: j.node.text }, children: B(D === "target" ? "canvas.references.selecting" : "canvas.references.choose") }) : null }) : null,
              D ? null : /* @__PURE__ */ m.jsx(ri, { corner: "top-left", onMouseDown: ma }),
              D ? null : /* @__PURE__ */ m.jsx(ri, { corner: "top-right", onMouseDown: ma }),
              D ? null : /* @__PURE__ */ m.jsx(ri, { corner: "bottom-left", onMouseDown: ma }),
              D ? null : /* @__PURE__ */ m.jsx(ri, { corner: "bottom-right", onMouseDown: ma })
            ]
          }
        ),
        V && !D && !Ql ? /* @__PURE__ */ m.jsx($1, { side: "left", visible: P || s || Z, onMouseDown: (Q) => K(Q, o.id, "target") }) : null,
        null,
        S && !Ql && tt ? /* @__PURE__ */ m.jsx("div", { className: "absolute left-1/2 top-full z-[70] w-[600px] -translate-x-1/2 pt-4", children: tt(o) }) : null
      ]
    }
  );
});
function Y1(f) {
  if (f.node.type === Lt.Config && f.renderNodeContent) return f.renderNodeContent(f.node);
  if (f.isBatchRoot && f.node.type === Lt.Image) return /* @__PURE__ */ m.jsx(fm, { ...f });
  if (f.node.type === Lt.Text && f.node.metadata?.texts?.length && (f.node.metadata.status !== "error" || f.node.metadata.texts.some((b) => b.content))) return /* @__PURE__ */ m.jsx(im, { ...f });
  if (f.node.metadata?.status === "loading") return /* @__PURE__ */ m.jsx(X1, { theme: f.theme });
  if (f.node.metadata?.status === "error") return /* @__PURE__ */ m.jsx(G1, { node: f.node, theme: f.theme, onRetry: f.onRetry });
  const o = q1[f.node.type];
  return o ? /* @__PURE__ */ m.jsx(o, { ...f }) : /* @__PURE__ */ m.jsx(L1, { theme: f.theme, type: f.node.type });
}
const q1 = {
  [Lt.Text]: im,
  [Lt.Image]: fm,
  [Lt.Config]: om,
  [Lt.Video]: Z1,
  [Lt.Audio]: V1,
  [Lt.Group]: w1
};
function w1({ node: f, theme: o, groupChildCount: b }) {
  const { t: s } = sl();
  return /* @__PURE__ */ m.jsx("div", { className: "pointer-events-none flex h-full w-full p-3", children: /* @__PURE__ */ m.jsxs("div", { className: "flex h-7 max-w-full items-center gap-2 px-1 text-xs font-medium", style: { color: o.node.text }, children: [
    /* @__PURE__ */ m.jsx(I0, { className: "size-3.5 shrink-0", style: { color: o.node.muted } }),
    /* @__PURE__ */ m.jsx("span", { className: "truncate", children: f.title || s("canvas.node.group") }),
    /* @__PURE__ */ m.jsx("span", { className: "shrink-0 text-[11px] font-normal", style: { color: o.node.muted }, children: s("canvas.node.nodeCount", { count: b }) })
  ] }) });
}
function X1({ theme: f }) {
  const { t: o } = sl();
  return /* @__PURE__ */ m.jsxs("div", { className: "flex h-full w-full flex-col items-center justify-center gap-3", style: { color: f.node.activeStroke }, children: [
    /* @__PURE__ */ m.jsx("div", { className: "size-10 animate-spin rounded-full border-2", style: { borderColor: f.node.stroke, borderTopColor: f.node.activeStroke } }),
    /* @__PURE__ */ m.jsx("span", { className: "text-[10px] tracking-[0.2em]", children: o("canvas.node.generating") })
  ] });
}
function G1({ node: f, theme: o, onRetry: b }) {
  const { t: s } = sl();
  return /* @__PURE__ */ m.jsxs("div", { className: "flex max-w-[260px] flex-col items-center gap-3 px-5 text-center", children: [
    /* @__PURE__ */ m.jsx("div", { className: "text-xs leading-5 text-red-300", children: f.metadata?.errorDetails || s("canvas.node.failed") }),
    /* @__PURE__ */ m.jsxs(
      "button",
      {
        type: "button",
        className: "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition hover:scale-[1.02]",
        style: { background: o.toolbar.panel, borderColor: o.toolbar.border, color: o.node.text },
        onClick: (T) => {
          T.stopPropagation(), b?.(f);
        },
        onMouseDown: (T) => T.stopPropagation(),
        children: [
          /* @__PURE__ */ m.jsx(em, { className: "size-3.5" }),
          s("canvas.node.retry")
        ]
      }
    )
  ] });
}
function L1({ theme: f, type: o }) {
  const { t: b } = sl();
  return /* @__PURE__ */ m.jsxs("div", { className: "flex h-full w-full flex-col items-center justify-center gap-2 px-4 text-center", style: { color: f.node.placeholder }, children: [
    /* @__PURE__ */ m.jsx(h1, { className: "size-7 opacity-40" }),
    /* @__PURE__ */ m.jsx("span", { className: "text-sm", children: b("canvas.node.missingPlugin") }),
    /* @__PURE__ */ m.jsx("span", { className: "text-[11px] opacity-70", children: b("canvas.node.missingPluginDescription", { type: o }) })
  ] });
}
function im({ node: f, theme: o, isEditingContent: b, textareaRef: s, mentionReferences: T, batchExpanded: H, onContentChange: L, onStopEditing: Z, onToggleBatch: D, onSetBatchPrimary: S }) {
  const { t: R } = sl(), U = f.metadata?.fontSize || 14, Y = { fontSize: `${U}px`, lineHeight: `${Math.round(U * 1.65)}px`, color: o.node.text, boxSizing: "border-box" }, V = f.metadata?.texts || [], tt = V.length, $ = tt > 1, st = f.metadata?.primaryTextId || V[0]?.id, O = V.find((X) => X.id === st), W = O?.content || f.metadata?.content || "", et = $ ? "px-4 pb-4 pt-14" : "p-4";
  return /* @__PURE__ */ m.jsxs(dm, { batchCount: tt, batchExpanded: H, children: [
    H ? V.filter((X) => X.id !== st).map((X, nt) => /* @__PURE__ */ m.jsx(Q1, { node: f, text: X, index: nt, onSetPrimary: () => S?.(X.id) }, X.id)) : null,
    /* @__PURE__ */ m.jsx("div", { className: "flex h-full w-full flex-col overflow-hidden rounded-3xl", children: b ? /* @__PURE__ */ m.jsx(
      D1,
      {
        ref: s,
        className: `thin-scrollbar block h-full w-full resize-none overflow-y-auto whitespace-pre-wrap break-words border-none bg-transparent m-0 font-mono outline-none select-text appearance-none ${et}`,
        style: Y,
        value: W,
        references: T,
        highlightLabels: !1,
        onChange: (X) => L(f.id, X),
        onBlur: Z,
        onKeyDown: (X) => {
          X.key === "Escape" && Z();
        },
        onMouseDown: (X) => X.stopPropagation(),
        onPointerDown: (X) => X.stopPropagation(),
        onWheel: (X) => X.stopPropagation()
      }
    ) : W ? /* @__PURE__ */ m.jsx("div", { className: `thin-scrollbar block h-full w-full overflow-y-auto whitespace-pre-wrap break-words bg-transparent font-mono ${et}`, style: Y, onWheel: (X) => X.stopPropagation(), children: W }) : O ? /* @__PURE__ */ m.jsx(cm, { text: O }) : /* @__PURE__ */ m.jsx("div", { className: "p-4 font-mono", style: { color: o.node.placeholder }, children: R("canvas.node.editText") }) }),
    $ ? /* @__PURE__ */ m.jsxs(
      "button",
      {
        type: "button",
        className: "absolute right-2.5 top-2.5 z-30 flex h-8 items-center justify-center gap-1.5 rounded-full border px-3 text-xs font-semibold shadow-[0_6px_18px_rgba(28,25,23,.12)] backdrop-blur-md transition hover:scale-[1.02]",
        style: { background: o.toolbar.panel, borderColor: o.toolbar.border, color: o.toolbar.activeText },
        "aria-label": R(H ? "canvas.node.textBatchExpanded" : "canvas.node.textBatchCollapsed"),
        onClick: (X) => {
          X.stopPropagation(), D?.();
        },
        onMouseDown: (X) => X.stopPropagation(),
        onPointerDown: (X) => X.stopPropagation(),
        children: [
          /* @__PURE__ */ m.jsx("span", { className: "leading-none", children: R("canvas.controls.texts", { count: tt }) }),
          /* @__PURE__ */ m.jsx(Pd, { className: `size-3.5 opacity-80 transition-transform ${H ? "rotate-90" : ""}` })
        ]
      }
    ) : null
  ] });
}
function Q1({ node: f, text: o, index: b, onSetPrimary: s }) {
  const T = xl[Sl((V) => V.theme)], { t: H } = sl(), L = f.metadata?.texts?.length || 0, Z = Math.min(L, 4), D = Math.ceil(L / Z), S = (D - 1) * Z, R = b >= S ? b + 1 : b, U = R % Z * (f.width + 18), Y = (Math.floor(R / Z) - D + 1) * (f.height + 18);
  return /* @__PURE__ */ m.jsx(
    "div",
    {
      className: "absolute z-20 overflow-hidden rounded-3xl border shadow-[0_18px_50px_rgba(28,25,23,.14)]",
      style: {
        left: U,
        top: Y,
        width: f.width,
        height: f.height,
        background: T.node.panel,
        borderColor: T.node.stroke,
        "--batch-from-x": `${-U}px`,
        "--batch-from-y": `${-Y}px`,
        "--batch-from-rotate": `${4 + b * 2}deg`,
        animation: `canvas-batch-child-in 320ms ${b * 35}ms cubic-bezier(.2,.85,.18,1) both`
      },
      onMouseDown: (V) => V.stopPropagation(),
      onPointerDown: (V) => V.stopPropagation(),
      children: o.content ? /* @__PURE__ */ m.jsxs(m.Fragment, { children: [
        /* @__PURE__ */ m.jsx("div", { className: "thin-scrollbar h-full overflow-y-auto whitespace-pre-wrap break-words px-4 pb-4 pt-14 font-mono text-sm leading-6", style: { color: T.node.text }, onWheel: (V) => V.stopPropagation(), children: o.content }),
        /* @__PURE__ */ m.jsxs("button", { type: "button", className: "absolute right-2.5 top-2.5 flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium transition hover:bg-black/5 dark:hover:bg-white/10", style: { color: T.node.text }, onClick: (V) => (V.stopPropagation(), s()), children: [
          /* @__PURE__ */ m.jsx(am, { className: "size-3.5", style: { color: me } }),
          H("canvas.node.setPrimaryText")
        ] })
      ] }) : /* @__PURE__ */ m.jsx(cm, { text: o })
    }
  );
}
function cm({ text: f }) {
  const o = xl[Sl((H) => H.theme)], { t: b } = sl(), s = f.status === "error", T = f.status === "loading";
  return /* @__PURE__ */ m.jsxs("div", { className: "flex h-full w-full flex-col items-center justify-center gap-3 px-6 text-center", style: { background: o.node.fill, color: s ? o.node.text : o.node.activeStroke }, children: [
    s ? /* @__PURE__ */ m.jsx("span", { className: "text-xs leading-5", children: f.errorDetails || b("canvas.node.failed") }) : T ? /* @__PURE__ */ m.jsx("div", { className: "size-10 animate-spin rounded-full border-2", style: { borderColor: o.node.stroke, borderTopColor: o.node.activeStroke } }) : /* @__PURE__ */ m.jsx("span", { className: "text-xs", children: b("apiErrors.noContent") }),
    T ? /* @__PURE__ */ m.jsx("span", { className: "text-[10px] tracking-[0.2em]", children: b("canvas.node.generating") }) : null
  ] });
}
function fm(f) {
  return !f.node.metadata?.content && !f.isBatchRoot ? /* @__PURE__ */ m.jsx(om, { ...f }) : /* @__PURE__ */ m.jsx(
    K1,
    {
      node: f.node,
      batchExpanded: f.batchExpanded,
      onToggleBatch: f.onToggleBatch,
      onSetBatchPrimary: f.onSetBatchPrimary,
      onDuplicateBatchImage: f.onDuplicateBatchImage,
      onDownloadBatchImage: f.onDownloadBatchImage,
      onRetryBatchImage: f.onRetryBatchImage,
      onDeleteBatchImage: f.onDeleteBatchImage,
      onViewBatchImage: f.onViewBatchImage
    }
  );
}
function om({ theme: f }) {
  const { t: o } = sl();
  return /* @__PURE__ */ m.jsxs("div", { className: "flex h-full w-full flex-col items-center justify-center gap-3", style: { color: f.node.placeholder }, children: [
    /* @__PURE__ */ m.jsx("div", { className: "flex size-14 items-center justify-center rounded-2xl", style: { background: f.toolbar.activeBg }, children: /* @__PURE__ */ m.jsx(lm, { className: "size-6 opacity-30" }) }),
    /* @__PURE__ */ m.jsx("span", { className: "text-[10px] tracking-[0.18em] opacity-50", children: o("canvas.node.emptyImage") })
  ] });
}
function Z1({ node: f, theme: o }) {
  const { t: b } = sl(), [s, T] = w.useState(!1), [H, L] = w.useState(!1);
  return w.useEffect(() => {
    T(!1), L(!1);
  }, [f.metadata?.content]), f.metadata?.content ? s ? /* @__PURE__ */ m.jsx("div", { className: "p-4 text-center text-sm", children: "视频无法播放，请通过素材名称打开原文件检查。" }) : H ? /* @__PURE__ */ m.jsx("video", { src: f.metadata.content, poster: f.metadata.posterUrl, controls: !0, autoPlay: !0, preload: "metadata", playsInline: !0, onError: () => T(!0), onDoubleClick: (Z) => Z.stopPropagation(), className: "h-full w-full rounded-[18px] bg-black object-contain", "data-canvas-video": f.id, "data-canvas-no-zoom": !0 }) : /* @__PURE__ */ m.jsxs("button", { type: "button", className: "relative flex h-full w-full flex-col items-center justify-center gap-3 rounded-[18px] bg-stone-900 text-white", "aria-label": `播放视频：${f.title}`, onMouseDown: (Z) => Z.stopPropagation(), onPointerDown: (Z) => Z.stopPropagation(), onDoubleClick: (Z) => Z.stopPropagation(), onClick: () => L(!0), children: [
    f.metadata.posterUrl ? /* @__PURE__ */ m.jsx("img", { src: f.metadata.posterUrl, alt: "镜头参考图", className: "absolute inset-0 h-full w-full object-contain opacity-70" }) : /* @__PURE__ */ m.jsx(Yf, { className: "size-8 opacity-30" }),
    /* @__PURE__ */ m.jsx("span", { className: "relative flex size-12 items-center justify-center rounded-full border border-white/30 bg-white/10", children: /* @__PURE__ */ m.jsx(s1, { className: "size-5" }) }),
    /* @__PURE__ */ m.jsx("span", { className: "relative text-xs opacity-60", children: "点击播放" })
  ] }) : /* @__PURE__ */ m.jsxs("div", { className: "flex h-full w-full flex-col items-center justify-center gap-3", style: { color: o.node.placeholder }, children: [
    /* @__PURE__ */ m.jsx(Yf, { className: "size-7 opacity-35" }),
    /* @__PURE__ */ m.jsx("span", { className: "text-sm", children: b("canvas.node.emptyVideo") })
  ] });
}
function V1({ node: f, theme: o }) {
  const { t: b } = sl();
  return f.metadata?.content ? /* @__PURE__ */ m.jsxs("div", { className: "flex h-full w-full flex-col justify-center gap-3 px-4", style: { background: o.node.fill, color: o.node.text }, children: [
    /* @__PURE__ */ m.jsxs("div", { className: "flex min-w-0 items-center gap-2 text-sm opacity-70", children: [
      /* @__PURE__ */ m.jsx(Bf, { className: "size-4 shrink-0" }),
      /* @__PURE__ */ m.jsx("span", { className: "truncate", children: b("canvas.node.audio") })
    ] }),
    /* @__PURE__ */ m.jsx("audio", { src: f.metadata.content, controls: !0, preload: "metadata", className: "w-full", "data-canvas-no-zoom": !0 })
  ] }) : /* @__PURE__ */ m.jsxs("div", { className: "flex h-full w-full flex-col items-center justify-center gap-2", style: { color: o.node.placeholder }, children: [
    /* @__PURE__ */ m.jsx(Bf, { className: "size-7 opacity-35" }),
    /* @__PURE__ */ m.jsx("span", { className: "text-sm", children: b("canvas.node.emptyAudio") })
  ] });
}
function K1({
  node: f,
  batchExpanded: o,
  onToggleBatch: b,
  onSetBatchPrimary: s,
  onDuplicateBatchImage: T,
  onDownloadBatchImage: H,
  onRetryBatchImage: L,
  onDeleteBatchImage: Z,
  onViewBatchImage: D
}) {
  const S = xl[Sl((O) => O.theme)], { t: R } = sl(), U = f.metadata?.images || [], Y = U.length, V = Y > 1, tt = f.metadata?.primaryImageId || U[0]?.id, $ = U.find((O) => O.id === tt), st = $?.content || f.metadata?.content;
  return /* @__PURE__ */ m.jsxs(dm, { batchCount: Y, batchExpanded: o, children: [
    o ? U.filter((O) => O.id !== tt).map((O, W) => /* @__PURE__ */ m.jsx(k1, { node: f, image: O, index: W, onView: () => D?.(O.id), onSetPrimary: () => s?.(O.id), onDuplicate: () => T?.(O.id), onDownload: () => H?.(O.id), onRetry: () => L?.(O.id), onDelete: () => Z?.(O.id) }, O.id)) : null,
    /* @__PURE__ */ m.jsx("div", { className: "h-full w-full overflow-hidden rounded-3xl", children: st ? /* @__PURE__ */ m.jsx(
      "img",
      {
        src: st,
        alt: f.title,
        draggable: !1,
        onDragStart: (O) => O.preventDefault(),
        className: `pointer-events-none block h-full w-full select-none ${f.metadata?.freeResize ? "object-fill" : "object-contain"}`
      }
    ) : /* @__PURE__ */ m.jsx(rm, { image: $ }) }),
    $?.status === "error" ? /* @__PURE__ */ m.jsx(sm, { placement: "left", onRetry: () => L?.($.id), onDelete: () => Z?.($.id) }) : null,
    $?.content ? /* @__PURE__ */ m.jsxs("button", { type: "button", className: "absolute left-2.5 top-2.5 z-30 flex h-8 items-center gap-1 rounded-lg border px-2 text-[10px] font-medium shadow-[0_6px_18px_rgba(15,23,42,.16)] backdrop-blur-md transition hover:scale-[1.02]", style: { background: S.toolbar.panel, borderColor: S.toolbar.border, color: S.toolbar.activeText }, title: R("common.download"), onClick: (O) => (O.stopPropagation(), H?.($.id)), children: [
      /* @__PURE__ */ m.jsx(tm, { className: "size-3" }),
      R("common.download")
    ] }) : null,
    V ? /* @__PURE__ */ m.jsxs(
      "button",
      {
        type: "button",
        className: "absolute right-2.5 top-2.5 z-30 flex h-8 items-center justify-center gap-1.5 rounded-full border px-3 text-xs font-semibold shadow-[0_6px_18px_rgba(28,25,23,.16)] backdrop-blur-md transition hover:scale-[1.02]",
        style: { background: S.toolbar.panel, borderColor: S.toolbar.border, color: S.toolbar.activeText },
        "aria-label": R(o ? "canvas.node.batchExpanded" : "canvas.node.batchCollapsed"),
        onClick: (O) => {
          O.stopPropagation(), b?.();
        },
        onMouseDown: (O) => O.stopPropagation(),
        onPointerDown: (O) => O.stopPropagation(),
        children: [
          /* @__PURE__ */ m.jsx("span", { className: "leading-none", children: R("canvas.controls.images", { count: Y }) }),
          /* @__PURE__ */ m.jsx(Pd, { className: `size-3.5 opacity-80 transition-transform ${o ? "rotate-90" : ""}` })
        ]
      }
    ) : null
  ] });
}
function k1({ node: f, image: o, index: b, onView: s, onSetPrimary: T, onDuplicate: H, onDownload: L, onRetry: Z, onDelete: D }) {
  const S = xl[Sl((X) => X.theme)], { t: R } = sl(), U = f.metadata?.images?.length || 0, Y = Math.min(U, 4), V = Math.ceil(U / Y), tt = (V - 1) * Y, $ = b >= tt ? b + 1 : b, st = $ % Y, O = Math.floor($ / Y), W = st * (f.width + 18), et = (O - V + 1) * (f.height + 18);
  return /* @__PURE__ */ m.jsxs(
    "div",
    {
      className: `absolute z-20 overflow-hidden rounded-3xl ${o.content ? "" : "border shadow-[0_18px_50px_rgba(28,25,23,.18)]"}`,
      style: {
        left: W,
        top: et,
        width: f.width,
        height: f.height,
        background: "transparent",
        borderColor: S.node.stroke,
        "--batch-from-x": `${-W}px`,
        "--batch-from-y": `${-et}px`,
        "--batch-from-rotate": `${4 + b * 2}deg`,
        animation: `canvas-batch-child-in 320ms ${b * 35}ms cubic-bezier(.2,.85,.18,1) both`
      },
      onMouseDown: (X) => X.stopPropagation(),
      onPointerDown: (X) => X.stopPropagation(),
      onDoubleClick: (X) => {
        !o.content || X.target instanceof Element && X.target.closest("button") || (X.stopPropagation(), s());
      },
      children: [
        o.content ? /* @__PURE__ */ m.jsx("img", { src: o.content, alt: f.title, draggable: !1, className: "pointer-events-none h-full w-full select-none object-contain" }) : /* @__PURE__ */ m.jsx(rm, { image: o }),
        o.content ? /* @__PURE__ */ m.jsxs("div", { className: "absolute inset-x-2 top-2 flex items-center gap-1", children: [
          /* @__PURE__ */ m.jsxs("button", { type: "button", className: "flex h-8 min-w-0 flex-1 items-center justify-center gap-1 rounded-lg border px-1.5 text-[10px] font-medium shadow-[0_6px_18px_rgba(15,23,42,.16)] backdrop-blur-md transition hover:scale-[1.02]", style: { background: S.toolbar.panel, borderColor: S.toolbar.border, color: S.toolbar.activeText }, title: R("common.download"), onClick: (X) => (X.stopPropagation(), L()), children: [
            /* @__PURE__ */ m.jsx(tm, { className: "size-3 shrink-0" }),
            /* @__PURE__ */ m.jsx("span", { className: "truncate", children: R("common.download") })
          ] }),
          /* @__PURE__ */ m.jsxs("button", { type: "button", className: "flex h-8 min-w-0 flex-1 items-center justify-center gap-1 rounded-lg border px-1.5 text-[10px] font-medium shadow-[0_6px_18px_rgba(15,23,42,.16)] backdrop-blur-md transition hover:scale-[1.02]", style: { background: S.toolbar.panel, borderColor: S.toolbar.border, color: S.toolbar.activeText }, title: R("canvas.node.createCopy"), onClick: (X) => (X.stopPropagation(), H()), children: [
            /* @__PURE__ */ m.jsx(V0, { className: "size-3 shrink-0" }),
            /* @__PURE__ */ m.jsx("span", { className: "truncate", children: R("canvas.node.createCopy") })
          ] }),
          /* @__PURE__ */ m.jsxs("button", { type: "button", className: "flex h-8 min-w-0 flex-1 items-center justify-center gap-1 rounded-lg border px-1.5 text-[10px] font-medium shadow-[0_6px_18px_rgba(15,23,42,.16)] backdrop-blur-md transition hover:scale-[1.02]", style: { background: S.toolbar.panel, borderColor: S.toolbar.border, color: S.toolbar.activeText }, title: R("canvas.node.setPrimary"), onClick: (X) => (X.stopPropagation(), T()), children: [
            /* @__PURE__ */ m.jsx(am, { className: "size-3 shrink-0", style: { color: me } }),
            /* @__PURE__ */ m.jsx("span", { className: "truncate", children: R("canvas.node.setPrimary") })
          ] })
        ] }) : null,
        o.status === "error" ? /* @__PURE__ */ m.jsx(sm, { placement: "right", onRetry: Z, onDelete: D }) : null
      ]
    }
  );
}
function sm({ placement: f, onRetry: o, onDelete: b }) {
  const s = xl[Sl((H) => H.theme)], { t: T } = sl();
  return /* @__PURE__ */ m.jsxs("div", { className: `absolute top-3 z-30 flex items-center gap-1.5 ${f === "left" ? "left-3" : "right-3"}`, children: [
    /* @__PURE__ */ m.jsxs("button", { type: "button", className: "flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium shadow-sm transition hover:scale-[1.02]", style: { background: s.toolbar.panel, borderColor: s.toolbar.border, color: s.node.text }, onClick: (H) => (H.stopPropagation(), o()), children: [
      /* @__PURE__ */ m.jsx(em, { className: "size-3.5" }),
      T("canvas.node.retry")
    ] }),
    /* @__PURE__ */ m.jsx("button", { type: "button", className: "grid size-8 place-items-center rounded-lg border shadow-sm transition hover:scale-[1.02]", style: { background: s.toolbar.panel, borderColor: s.toolbar.border, color: s.node.text }, onClick: (H) => (H.stopPropagation(), b()), "aria-label": T("common.delete"), title: T("common.delete"), children: /* @__PURE__ */ m.jsx(p1, { className: "size-3.5" }) })
  ] });
}
function rm({ image: f }) {
  const o = xl[Sl((T) => T.theme)], { t: b } = sl(), s = f?.status === "error";
  return /* @__PURE__ */ m.jsxs("div", { className: "flex h-full w-full flex-col items-center justify-center gap-3 px-6 text-center", style: { background: o.node.fill, color: s ? o.node.text : o.node.activeStroke }, children: [
    s ? /* @__PURE__ */ m.jsx("span", { className: "text-xs leading-5", children: f.errorDetails || b("canvas.node.failed") }) : /* @__PURE__ */ m.jsx("div", { className: "size-10 animate-spin rounded-full border-2", style: { borderColor: o.node.stroke, borderTopColor: o.node.activeStroke } }),
    s ? null : /* @__PURE__ */ m.jsx("span", { className: "text-[10px] tracking-[0.2em]", children: b("canvas.node.generating") })
  ] });
}
function J1({ node: f }) {
  const o = Math.round(f.metadata?.naturalWidth || f.width), b = Math.round(f.metadata?.naturalHeight || f.height), s = T1(f.metadata?.bytes || 0);
  return /* @__PURE__ */ m.jsx("div", { className: "pointer-events-none absolute bottom-3 right-3 z-40 max-w-[calc(100%-24px)]", children: /* @__PURE__ */ m.jsxs("span", { className: "max-w-full truncate rounded-md bg-black/55 px-2 py-1 text-[11px] font-medium leading-none text-white backdrop-blur-sm", children: [
    o,
    " x ",
    b,
    s ? ` · ${s}` : ""
  ] }) });
}
function dm({ batchCount: f, batchExpanded: o, children: b }) {
  const s = xl[Sl((H) => H.theme)], T = f > 1;
  return /* @__PURE__ */ m.jsxs("div", { className: "group/batch relative h-full w-full overflow-visible", children: [
    T ? /* @__PURE__ */ m.jsx("div", { className: "pointer-events-none absolute inset-0 overflow-visible", children: Array.from({ length: Math.min(f - 1, 3) }).map((H, L) => /* @__PURE__ */ m.jsx(
      "div",
      {
        className: "absolute rounded-[inherit] border shadow-[0_10px_24px_rgba(68,64,60,.12)] transition-all duration-300 group-hover/batch:translate-x-1",
        style: {
          inset: 0,
          background: `linear-gradient(135deg, ${s.node.panel}, ${s.node.fill})`,
          borderColor: s.node.stroke,
          opacity: o ? 0 : 1,
          transform: `translate(${10 + L * 6}px, ${4 + L * 3}px) rotate(${1.5 + L}deg)`,
          zIndex: -L - 1
        }
      },
      L
    )) }) : null,
    b
  ] });
}
function ri({ corner: f, onMouseDown: o }) {
  const b = {
    "top-left": "-left-[14px] -top-[14px] cursor-nwse-resize",
    "top-right": "-right-[14px] -top-[14px] cursor-nesw-resize",
    "bottom-left": "-bottom-[14px] -left-[14px] cursor-nesw-resize",
    "bottom-right": "-bottom-[14px] -right-[14px] cursor-nwse-resize"
  }[f];
  return /* @__PURE__ */ m.jsx("div", { className: `absolute z-50 size-7 ${b}`, onMouseDown: (s) => o(s, f) });
}
function $1({ side: f, visible: o, onMouseDown: b }) {
  const s = xl[Sl((T) => T.theme)];
  return /* @__PURE__ */ m.jsx(
    "div",
    {
      className: `absolute top-1/2 z-30 flex size-12 -translate-y-1/2 cursor-crosshair items-center justify-center transition-opacity duration-150 ${f === "left" ? "-left-6" : "-right-6"} ${o ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"}`,
      onMouseDown: b,
      children: /* @__PURE__ */ m.jsx("div", { className: "size-3 rounded-full border-2 transition-all hover:scale-125", style: { background: s.node.panel, borderColor: s.node.muted } })
    }
  );
}
function W1({ nodes: f, viewport: o, viewportSize: b, onViewportChange: s }) {
  const T = xl[Sl((O) => O.theme)], H = w.useRef(null), [L, Z] = w.useState(!1), D = 240, S = 160, { worldBounds: R, scale: U, offset: Y } = w.useMemo(() => {
    if (!f.length)
      return { worldBounds: { x: -500, y: -500, w: 1e3, h: 1e3 }, scale: 0.16, offset: { x: 40, y: 0 } };
    let O = 1 / 0, W = 1 / 0, et = -1 / 0, X = -1 / 0;
    f.forEach((qt) => {
      O = Math.min(O, qt.position.x), W = Math.min(W, qt.position.y), et = Math.max(et, qt.position.x + qt.width), X = Math.max(X, qt.position.y + qt.height);
    }), O -= 500, W -= 500, et += 500, X += 500;
    const nt = et - O, rt = X - W, K = Math.min(D / nt, S / rt), pt = nt * K, Mt = rt * K;
    return {
      worldBounds: { x: O, y: W, w: nt, h: rt },
      scale: K,
      offset: { x: (D - pt) / 2, y: (S - Mt) / 2 }
    };
  }, [f]), V = w.useCallback(
    (O, W) => ({
      x: (O - R.x) * U + Y.x,
      y: (W - R.y) * U + Y.y
    }),
    [Y.x, Y.y, U, R.x, R.y]
  ), tt = w.useCallback(
    (O, W) => ({
      x: (O - Y.x) / U + R.x,
      y: (W - Y.y) / U + R.y
    }),
    [Y.x, Y.y, U, R.x, R.y]
  ), $ = w.useMemo(() => {
    const O = -o.x / o.k, W = -o.y / o.k, et = b.width / o.k, X = b.height / o.k, nt = V(O, W), rt = V(O + et, W + X);
    return {
      x: nt.x,
      y: nt.y,
      w: Math.max(rt.x - nt.x, 4),
      h: Math.max(rt.y - nt.y, 4)
    };
  }, [V, o.k, o.x, o.y, b.height, b.width]), st = (O) => {
    const W = H.current?.getBoundingClientRect();
    if (!W) return;
    const et = tt(O.clientX - W.left, O.clientY - W.top);
    s({
      x: b.width / 2 - et.x * o.k,
      y: b.height / 2 - et.y * o.k,
      k: o.k
    });
  };
  return /* @__PURE__ */ m.jsx("div", { className: "absolute bottom-24 left-6 z-50 overflow-hidden rounded-lg border shadow-2xl backdrop-blur-sm", style: { width: D, height: S, background: T.toolbar.panel, borderColor: T.toolbar.border }, children: /* @__PURE__ */ m.jsxs(
    "div",
    {
      ref: H,
      className: "relative h-full w-full cursor-crosshair",
      onPointerDown: (O) => {
        O.preventDefault(), O.currentTarget.setPointerCapture(O.pointerId), Z(!0), st(O);
      },
      onPointerMove: (O) => {
        L && st(O);
      },
      onPointerUp: () => Z(!1),
      onPointerLeave: () => Z(!1),
      children: [
        f.map((O) => {
          const W = V(O.position.x, O.position.y), et = nm(O.type)?.minimapColor || T.node.muted;
          return /* @__PURE__ */ m.jsx(
            "div",
            {
              className: "absolute rounded-[1px]",
              style: {
                left: W.x,
                top: W.y,
                width: Math.max(O.width * U, 2),
                height: Math.max(O.height * U, 2),
                backgroundColor: et,
                opacity: 0.8
              }
            },
            O.id
          );
        }),
        /* @__PURE__ */ m.jsx("div", { className: "pointer-events-none absolute border", style: { left: $.x, top: $.y, width: $.w, height: $.h, borderColor: T.node.activeStroke, background: `${T.node.activeStroke}18` } })
      ]
    }
  ) });
}
function F1({
  connection: f,
  from: o,
  to: b,
  active: s,
  onSelect: T,
  onContextMenu: H
}) {
  const L = xl[Sl((tt) => tt.theme)], Z = o.position.x + o.width, D = o.position.y + o.height / 2, S = b.position.x, R = b.position.y + b.height / 2, U = Math.abs(S - Z), Y = Math.max(U * 0.5, 50), V = `M ${Z} ${D} C ${Z + Y} ${D}, ${S - Y} ${R}, ${S} ${R}`;
  return /* @__PURE__ */ m.jsxs("g", { children: [
    /* @__PURE__ */ m.jsx(
      "path",
      {
        "data-connection-id": f.id,
        d: V,
        stroke: "transparent",
        strokeWidth: "16",
        fill: "none",
        style: { cursor: "pointer", pointerEvents: "stroke" },
        onClick: (tt) => {
          tt.stopPropagation(), T();
        },
        onContextMenu: (tt) => {
          tt.preventDefault(), tt.stopPropagation(), H?.(tt);
        }
      }
    ),
    /* @__PURE__ */ m.jsx(
      "path",
      {
        d: V,
        stroke: s ? L.node.activeStroke : L.node.muted,
        strokeWidth: s ? 3 : 2,
        strokeOpacity: s ? 1 : 0.82,
        fill: "none",
        style: { filter: s ? `drop-shadow(0 0 8px ${L.node.activeStroke}66)` : void 0, pointerEvents: "none" }
      }
    )
  ] });
}
function $d(f, o) {
  return f.nodes.map((b) => {
    const s = o.positions?.[b.id], T = b.mediaUrl && ["image", "video", "audio"].includes(b.mediaKind || "") ? b.mediaKind : Lt.Text;
    return {
      id: b.id,
      type: T,
      title: b.title,
      position: { x: s?.x ?? b.x, y: s?.y ?? b.y },
      width: s?.width || b.width,
      height: s?.height || b.height,
      metadata: { content: T === Lt.Text ? `${b.kind}
${b.title}

${b.body || ""}` : b.mediaUrl, posterUrl: b.posterUrl, interactive: !0 }
    };
  });
}
function I1(f, o, b) {
  const s = { ...b.positions };
  for (const T of f) s[T.id] = { x: Math.round(T.position.x), y: Math.round(T.position.y), width: Math.round(T.width), height: Math.round(T.height) };
  return { viewport: { x: Math.round(o.x), y: Math.round(o.y), zoom: o.k }, positions: s };
}
const tn = () => {
};
function P1({ host: f }) {
  const o = w.useRef(null), [b, s] = w.useState(() => $d(f.graph, f.layout)), [T, H] = w.useState(() => ({ x: f.layout.viewport?.x ?? 120, y: f.layout.viewport?.y ?? 90, k: f.layout.viewport?.zoom ?? 0.78 })), [L, Z] = w.useState({ width: 0, height: 0 }), [D, S] = w.useState([]), [R, U] = w.useState("pan"), [Y, V] = w.useState(!1), [tt, $] = w.useState(null), [st, O] = w.useState(null), W = w.useRef({ nodes: b, viewport: T, selected: D, host: f });
  W.current = { nodes: b, viewport: T, selected: D, host: f };
  const et = w.useRef(tn), X = w.useRef(!1), nt = w.useCallback(() => {
    const _ = W.current;
    _.host.save(I1(_.nodes, _.viewport, _.host.layout));
  }, []), rt = w.useCallback((_) => {
    W.current.viewport = _, H(_), nt();
  }, [nt]), K = w.useCallback(() => {
    S([]), $(null);
  }, []), pt = w.useCallback(() => {
    const { nodes: _ } = W.current, q = o.current?.getBoundingClientRect();
    if (!q?.width || !_.length) return;
    const r = Math.min(..._.map((F) => F.position.x)), M = Math.min(..._.map((F) => F.position.y)), j = Math.max(..._.map((F) => F.position.x + F.width)) - r, B = Math.max(..._.map((F) => F.position.y + F.height)) - M, P = Math.max(0.05, Math.min(1, (q.width - 120) / j, (q.height - 170) / B));
    rt({ k: P, x: (q.width - j * P) / 2 - r * P, y: (q.height - B * P) / 2 - M * P - 20 });
  }, [rt]);
  w.useEffect(() => {
    X.current || s($d(f.graph, f.layout));
  }, [f.graph, f.layout]), w.useEffect(() => {
    const _ = o.current;
    let q = Object.keys(f.layout.positions || {}).length > 0;
    const r = new ResizeObserver(() => {
      Z({ width: _.clientWidth, height: _.clientHeight }), !q && _.clientWidth && _.clientHeight && W.current.nodes.length && (q = !0, pt());
    });
    return r.observe(_), () => {
      r.disconnect(), et.current();
    };
  }, [pt]);
  const Mt = w.useCallback((_) => {
    const q = W.current.host.graph.nodes.find((r) => r.id === _.id);
    q && W.current.host.preview(q), $(null);
  }, []), qt = w.useCallback((_, q) => {
    if (_.button !== 0 || _.target.closest("button,input,textarea,video,audio")) return;
    _.stopPropagation(), _.preventDefault(), $(null);
    const r = W.current, j = _.shiftKey || _.metaKey ? [.../* @__PURE__ */ new Set([...r.selected, q])] : r.selected.includes(q) ? r.selected : [q];
    S(j);
    const B = _.clientX, P = _.clientY;
    let F = !1;
    X.current = !0, et.current();
    const ft = (gt) => {
      if (!F && Math.hypot(gt.clientX - B, gt.clientY - P) < 5) return;
      F = !0;
      const Bt = r.nodes.map((Yt) => j.includes(Yt.id) ? { ...Yt, position: { x: Yt.position.x + (gt.clientX - B) / r.viewport.k, y: Yt.position.y + (gt.clientY - P) / r.viewport.k } } : Yt);
      W.current.nodes = Bt, s(Bt);
    }, Et = () => {
      et.current(), X.current = !1, F && nt();
    };
    window.addEventListener("mousemove", ft), window.addEventListener("mouseup", Et), window.addEventListener("blur", Et), et.current = () => {
      window.removeEventListener("mousemove", ft), window.removeEventListener("mouseup", Et), window.removeEventListener("blur", Et);
    };
  }, [nt]), Ft = w.useCallback((_, q, r, M) => {
    const j = W.current.nodes.map((B) => B.id === _ ? { ...B, width: q, height: r, position: M || B.position } : B);
    W.current.nodes = j, s(j);
  }, []), k = w.useCallback((_) => {
    X.current = !0, S([_]);
  }, []), bt = w.useCallback(() => {
    X.current = !1, nt();
  }, [nt]), zt = w.useCallback((_) => {
    const q = W.current, r = o.current.getBoundingClientRect(), M = (_.clientX - r.left - q.viewport.x) / q.viewport.k, j = (_.clientY - r.top - q.viewport.y) / q.viewport.k, B = _.shiftKey ? q.selected : [];
    $(null), S(B), et.current(), X.current = !0;
    const P = (ft) => {
      const Et = (ft.clientX - r.left - q.viewport.x) / q.viewport.k, gt = (ft.clientY - r.top - q.viewport.y) / q.viewport.k, Bt = { x: Math.min(M, Et), y: Math.min(j, gt), width: Math.abs(Et - M), height: Math.abs(gt - j) };
      O(Bt), S([.../* @__PURE__ */ new Set([...B, ...q.nodes.filter((Yt) => Yt.position.x < Bt.x + Bt.width && Yt.position.x + Yt.width > Bt.x && Yt.position.y < Bt.y + Bt.height && Yt.position.y + Yt.height > Bt.y).map((Yt) => Yt.id)])]);
    }, F = () => {
      et.current(), X.current = !1, O(null);
    };
    window.addEventListener("pointermove", P), window.addEventListener("pointerup", F), window.addEventListener("pointercancel", F), window.addEventListener("blur", F), et.current = () => {
      window.removeEventListener("pointermove", P), window.removeEventListener("pointerup", F), window.removeEventListener("pointercancel", F), window.removeEventListener("blur", F);
    };
  }, []), it = w.useCallback((_, q) => {
    _.preventDefault(), _.stopPropagation(), S([q]);
    const r = o.current.getBoundingClientRect();
    $({ id: q, x: Math.max(8, Math.min(_.clientX - r.left, r.width - 200)), y: Math.max(8, Math.min(_.clientY - r.top, r.height - 140)) });
  }, []), y = (_) => {
    const q = Math.max(0.05, Math.min(5, _)), r = W.current.viewport;
    rt({ k: q, x: L.width / 2 - (L.width / 2 - r.x) * q / r.k, y: L.height / 2 - (L.height / 2 - r.y) * q / r.k });
  }, C = new Map(b.map((_) => [_.id, _])), G = D.length === 1 ? C.get(D[0]) : null;
  return /* @__PURE__ */ m.jsxs("div", { className: "odf-canvas", onAuxClick: (_) => {
    _.button === 1 && _.preventDefault();
  }, onKeyDown: (_) => {
    _.key === "Escape" && (K(), O(null));
  }, children: [
    /* @__PURE__ */ m.jsxs(z1, { containerRef: o, viewport: T, tool: R, backgroundMode: "dots", onViewportChange: rt, onCanvasDeselect: K, onCanvasMouseDown: zt, onDrop: (_) => {
      _.preventDefault(), f.upload([..._.dataTransfer.files]);
    }, children: [
      /* @__PURE__ */ m.jsx("svg", { className: "odf-connections", "aria-hidden": "true", children: f.graph.edges.map((_) => {
        const q = C.get(_.source), r = C.get(_.target);
        return q && r ? /* @__PURE__ */ m.jsx(F1, { connection: { id: _.id, fromNodeId: _.source, toNodeId: _.target }, from: q, to: r, active: D.includes(q.id) || D.includes(r.id), onSelect: () => S([q.id, r.id]) }, _.id) : null;
      }) }),
      b.map((_) => /* @__PURE__ */ m.jsxs(Wd.Fragment, { children: [
        /* @__PURE__ */ m.jsx(B1, { data: _, scale: T.k, isSelected: D.includes(_.id), isRelated: !1, isFocusRelated: !1, isConnectionTarget: !1, isConnecting: !1, showPanel: !1, showImageInfo: !1, onMouseDown: qt, onHoverStart: tn, onHoverEnd: tn, onConnectStart: tn, onResizeStart: k, onResize: Ft, onResizeEnd: bt, onContentChange: tn, onTitleChange: tn, onViewImage: Mt, onContextMenu: it }),
        /* @__PURE__ */ m.jsx("button", { className: "odf-node-label", style: { left: _.position.x, top: _.position.y + _.height + 8, width: _.width }, title: _.title, onClick: () => Mt(_), onPointerDown: (q) => q.stopPropagation(), children: _.title })
      ] }, _.id)),
      st && /* @__PURE__ */ m.jsx("div", { className: "odf-selection", style: { left: st.x, top: st.y, width: st.width, height: st.height } }),
      G && /* @__PURE__ */ m.jsxs("div", { className: "odf-node-actions", style: { left: G.position.x + G.width / 2, top: G.position.y - 66 }, onPointerDown: (_) => _.stopPropagation(), children: [
        /* @__PURE__ */ m.jsxs("button", { onClick: () => Mt(G), title: "打开完整素材", children: [
          /* @__PURE__ */ m.jsx(a1, { size: 16 }),
          "打开"
        ] }),
        /* @__PURE__ */ m.jsx("button", { onClick: K, title: "取消选择", children: /* @__PURE__ */ m.jsx(S1, { size: 15 }) })
      ] })
    ] }),
    !b.length && /* @__PURE__ */ m.jsxs("div", { className: "odf-empty", children: [
      /* @__PURE__ */ m.jsx("img", { src: "/assets/studio-pixel-icon.png", alt: "" }),
      /* @__PURE__ */ m.jsx("h2", { children: "从一条创作指令开始" }),
      /* @__PURE__ */ m.jsx("p", { children: "在 Codex 中描述目标，已入库素材会同步到这里。" })
    ] }),
    Y && /* @__PURE__ */ m.jsx(W1, { nodes: b, viewport: T, viewportSize: L, onViewportChange: rt }),
    /* @__PURE__ */ m.jsxs("div", { className: "odf-dock", "aria-label": "画布操作", children: [
      /* @__PURE__ */ m.jsx("button", { "aria-label": "平移画布", "aria-pressed": R === "pan", onClick: () => U("pan"), children: /* @__PURE__ */ m.jsx(t1, { size: 18 }) }),
      /* @__PURE__ */ m.jsx("button", { "aria-label": "框选节点", "aria-pressed": R === "select", onClick: () => U("select"), children: /* @__PURE__ */ m.jsx(c1, { size: 18 }) }),
      /* @__PURE__ */ m.jsx("i", {}),
      /* @__PURE__ */ m.jsx("button", { "aria-label": "小地图", "aria-pressed": Y, onClick: () => V(!Y), children: /* @__PURE__ */ m.jsx(Q0, { size: 18 }) }),
      /* @__PURE__ */ m.jsx("button", { "aria-label": "适应内容", onClick: pt, children: /* @__PURE__ */ m.jsx(W0, { size: 18 }) }),
      /* @__PURE__ */ m.jsx("i", {}),
      /* @__PURE__ */ m.jsx("button", { "aria-label": "缩小", onClick: () => y(T.k / 1.15), children: /* @__PURE__ */ m.jsx(u1, { size: 16 }) }),
      /* @__PURE__ */ m.jsxs("output", { children: [
        Math.round(T.k * 100),
        "%"
      ] }),
      /* @__PURE__ */ m.jsx("button", { "aria-label": "放大", onClick: () => y(T.k * 1.15), children: /* @__PURE__ */ m.jsx(d1, { size: 16 }) })
    ] }),
    D.length > 1 && /* @__PURE__ */ m.jsxs("div", { className: "odf-selection-count", children: [
      "已选择 ",
      D.length,
      " 个节点 · 拖动可整体移动"
    ] }),
    tt && /* @__PURE__ */ m.jsxs("div", { className: "odf-context-menu", style: { left: tt.x, top: tt.y }, role: "menu", children: [
      /* @__PURE__ */ m.jsx("button", { role: "menuitem", onClick: () => {
        const _ = C.get(tt.id);
        _ && Mt(_);
      }, children: "打开完整素材" }),
      /* @__PURE__ */ m.jsx("button", { role: "menuitem", onClick: K, children: "取消选择" })
    ] }),
    /* @__PURE__ */ m.jsxs("footer", { className: "odf-status", children: [
      /* @__PURE__ */ m.jsxs("span", { children: [
        b.length,
        " 个节点 · ",
        f.graph.edges.length,
        " 条关联"
      ] }),
      /* @__PURE__ */ m.jsx("span", { children: "滚轮缩放 · 中键平移 · 双击预览" }),
      /* @__PURE__ */ m.jsx("a", { href: "https://github.com/basketikun/infinite-canvas", target: "_blank", rel: "noreferrer", children: "infinite-canvas ↗" })
    ] })
  ] });
}
function ty(f) {
  const o = f.shadowRoot || f.attachShadow({ mode: "open" });
  o.replaceChildren();
  const b = document.createElement("link");
  b.rel = "stylesheet", b.href = new URL(
    /* @vite-ignore */
    "./canvas.css",
    import.meta.url
  ).href;
  const s = document.createElement("div");
  s.id = "react-canvas", o.append(b, s);
  const T = R0.createRoot(s);
  return { render(H) {
    T.render(/* @__PURE__ */ m.jsx(P1, { host: H }, H.key));
  }, unmount() {
    T.unmount();
  } };
}
export {
  $d as adaptNodes,
  I1 as captureLayout,
  ty as mountCanvas
};
