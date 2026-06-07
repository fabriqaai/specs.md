(() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __decorateClass = (decorators, target, key, kind) => {
    var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc(target, key) : target;
    for (var i6 = decorators.length - 1, decorator; i6 >= 0; i6--)
      if (decorator = decorators[i6])
        result = (kind ? decorator(target, key, result) : decorator(result)) || result;
    if (kind && result) __defProp(target, key, result);
    return result;
  };

  // node_modules/@lit/reactive-element/css-tag.js
  var t = globalThis;
  var e = t.ShadowRoot && (void 0 === t.ShadyCSS || t.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype;
  var s = /* @__PURE__ */ Symbol();
  var o = /* @__PURE__ */ new WeakMap();
  var n = class {
    constructor(t5, e7, o7) {
      if (this._$cssResult$ = true, o7 !== s) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
      this.cssText = t5, this.t = e7;
    }
    get styleSheet() {
      let t5 = this.o;
      const s4 = this.t;
      if (e && void 0 === t5) {
        const e7 = void 0 !== s4 && 1 === s4.length;
        e7 && (t5 = o.get(s4)), void 0 === t5 && ((this.o = t5 = new CSSStyleSheet()).replaceSync(this.cssText), e7 && o.set(s4, t5));
      }
      return t5;
    }
    toString() {
      return this.cssText;
    }
  };
  var r = (t5) => new n("string" == typeof t5 ? t5 : t5 + "", void 0, s);
  var i = (t5, ...e7) => {
    const o7 = 1 === t5.length ? t5[0] : e7.reduce((e8, s4, o8) => e8 + ((t6) => {
      if (true === t6._$cssResult$) return t6.cssText;
      if ("number" == typeof t6) return t6;
      throw Error("Value passed to 'css' function must be a 'css' function result: " + t6 + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
    })(s4) + t5[o8 + 1], t5[0]);
    return new n(o7, t5, s);
  };
  var S = (s4, o7) => {
    if (e) s4.adoptedStyleSheets = o7.map((t5) => t5 instanceof CSSStyleSheet ? t5 : t5.styleSheet);
    else for (const e7 of o7) {
      const o8 = document.createElement("style"), n5 = t.litNonce;
      void 0 !== n5 && o8.setAttribute("nonce", n5), o8.textContent = e7.cssText, s4.appendChild(o8);
    }
  };
  var c = e ? (t5) => t5 : (t5) => t5 instanceof CSSStyleSheet ? ((t6) => {
    let e7 = "";
    for (const s4 of t6.cssRules) e7 += s4.cssText;
    return r(e7);
  })(t5) : t5;

  // node_modules/@lit/reactive-element/reactive-element.js
  var { is: i2, defineProperty: e2, getOwnPropertyDescriptor: h, getOwnPropertyNames: r2, getOwnPropertySymbols: o2, getPrototypeOf: n2 } = Object;
  var a = globalThis;
  var c2 = a.trustedTypes;
  var l = c2 ? c2.emptyScript : "";
  var p = a.reactiveElementPolyfillSupport;
  var d = (t5, s4) => t5;
  var u = { toAttribute(t5, s4) {
    switch (s4) {
      case Boolean:
        t5 = t5 ? l : null;
        break;
      case Object:
      case Array:
        t5 = null == t5 ? t5 : JSON.stringify(t5);
    }
    return t5;
  }, fromAttribute(t5, s4) {
    let i6 = t5;
    switch (s4) {
      case Boolean:
        i6 = null !== t5;
        break;
      case Number:
        i6 = null === t5 ? null : Number(t5);
        break;
      case Object:
      case Array:
        try {
          i6 = JSON.parse(t5);
        } catch (t6) {
          i6 = null;
        }
    }
    return i6;
  } };
  var f = (t5, s4) => !i2(t5, s4);
  var b = { attribute: true, type: String, converter: u, reflect: false, useDefault: false, hasChanged: f };
  Symbol.metadata ?? (Symbol.metadata = /* @__PURE__ */ Symbol("metadata")), a.litPropertyMetadata ?? (a.litPropertyMetadata = /* @__PURE__ */ new WeakMap());
  var y = class extends HTMLElement {
    static addInitializer(t5) {
      this._$Ei(), (this.l ?? (this.l = [])).push(t5);
    }
    static get observedAttributes() {
      return this.finalize(), this._$Eh && [...this._$Eh.keys()];
    }
    static createProperty(t5, s4 = b) {
      if (s4.state && (s4.attribute = false), this._$Ei(), this.prototype.hasOwnProperty(t5) && ((s4 = Object.create(s4)).wrapped = true), this.elementProperties.set(t5, s4), !s4.noAccessor) {
        const i6 = /* @__PURE__ */ Symbol(), h3 = this.getPropertyDescriptor(t5, i6, s4);
        void 0 !== h3 && e2(this.prototype, t5, h3);
      }
    }
    static getPropertyDescriptor(t5, s4, i6) {
      const { get: e7, set: r6 } = h(this.prototype, t5) ?? { get() {
        return this[s4];
      }, set(t6) {
        this[s4] = t6;
      } };
      return { get: e7, set(s5) {
        const h3 = e7?.call(this);
        r6?.call(this, s5), this.requestUpdate(t5, h3, i6);
      }, configurable: true, enumerable: true };
    }
    static getPropertyOptions(t5) {
      return this.elementProperties.get(t5) ?? b;
    }
    static _$Ei() {
      if (this.hasOwnProperty(d("elementProperties"))) return;
      const t5 = n2(this);
      t5.finalize(), void 0 !== t5.l && (this.l = [...t5.l]), this.elementProperties = new Map(t5.elementProperties);
    }
    static finalize() {
      if (this.hasOwnProperty(d("finalized"))) return;
      if (this.finalized = true, this._$Ei(), this.hasOwnProperty(d("properties"))) {
        const t6 = this.properties, s4 = [...r2(t6), ...o2(t6)];
        for (const i6 of s4) this.createProperty(i6, t6[i6]);
      }
      const t5 = this[Symbol.metadata];
      if (null !== t5) {
        const s4 = litPropertyMetadata.get(t5);
        if (void 0 !== s4) for (const [t6, i6] of s4) this.elementProperties.set(t6, i6);
      }
      this._$Eh = /* @__PURE__ */ new Map();
      for (const [t6, s4] of this.elementProperties) {
        const i6 = this._$Eu(t6, s4);
        void 0 !== i6 && this._$Eh.set(i6, t6);
      }
      this.elementStyles = this.finalizeStyles(this.styles);
    }
    static finalizeStyles(s4) {
      const i6 = [];
      if (Array.isArray(s4)) {
        const e7 = new Set(s4.flat(1 / 0).reverse());
        for (const s5 of e7) i6.unshift(c(s5));
      } else void 0 !== s4 && i6.push(c(s4));
      return i6;
    }
    static _$Eu(t5, s4) {
      const i6 = s4.attribute;
      return false === i6 ? void 0 : "string" == typeof i6 ? i6 : "string" == typeof t5 ? t5.toLowerCase() : void 0;
    }
    constructor() {
      super(), this._$Ep = void 0, this.isUpdatePending = false, this.hasUpdated = false, this._$Em = null, this._$Ev();
    }
    _$Ev() {
      this._$ES = new Promise((t5) => this.enableUpdating = t5), this._$AL = /* @__PURE__ */ new Map(), this._$E_(), this.requestUpdate(), this.constructor.l?.forEach((t5) => t5(this));
    }
    addController(t5) {
      (this._$EO ?? (this._$EO = /* @__PURE__ */ new Set())).add(t5), void 0 !== this.renderRoot && this.isConnected && t5.hostConnected?.();
    }
    removeController(t5) {
      this._$EO?.delete(t5);
    }
    _$E_() {
      const t5 = /* @__PURE__ */ new Map(), s4 = this.constructor.elementProperties;
      for (const i6 of s4.keys()) this.hasOwnProperty(i6) && (t5.set(i6, this[i6]), delete this[i6]);
      t5.size > 0 && (this._$Ep = t5);
    }
    createRenderRoot() {
      const t5 = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions);
      return S(t5, this.constructor.elementStyles), t5;
    }
    connectedCallback() {
      this.renderRoot ?? (this.renderRoot = this.createRenderRoot()), this.enableUpdating(true), this._$EO?.forEach((t5) => t5.hostConnected?.());
    }
    enableUpdating(t5) {
    }
    disconnectedCallback() {
      this._$EO?.forEach((t5) => t5.hostDisconnected?.());
    }
    attributeChangedCallback(t5, s4, i6) {
      this._$AK(t5, i6);
    }
    _$ET(t5, s4) {
      const i6 = this.constructor.elementProperties.get(t5), e7 = this.constructor._$Eu(t5, i6);
      if (void 0 !== e7 && true === i6.reflect) {
        const h3 = (void 0 !== i6.converter?.toAttribute ? i6.converter : u).toAttribute(s4, i6.type);
        this._$Em = t5, null == h3 ? this.removeAttribute(e7) : this.setAttribute(e7, h3), this._$Em = null;
      }
    }
    _$AK(t5, s4) {
      const i6 = this.constructor, e7 = i6._$Eh.get(t5);
      if (void 0 !== e7 && this._$Em !== e7) {
        const t6 = i6.getPropertyOptions(e7), h3 = "function" == typeof t6.converter ? { fromAttribute: t6.converter } : void 0 !== t6.converter?.fromAttribute ? t6.converter : u;
        this._$Em = e7;
        const r6 = h3.fromAttribute(s4, t6.type);
        this[e7] = r6 ?? this._$Ej?.get(e7) ?? r6, this._$Em = null;
      }
    }
    requestUpdate(t5, s4, i6, e7 = false, h3) {
      if (void 0 !== t5) {
        const r6 = this.constructor;
        if (false === e7 && (h3 = this[t5]), i6 ?? (i6 = r6.getPropertyOptions(t5)), !((i6.hasChanged ?? f)(h3, s4) || i6.useDefault && i6.reflect && h3 === this._$Ej?.get(t5) && !this.hasAttribute(r6._$Eu(t5, i6)))) return;
        this.C(t5, s4, i6);
      }
      false === this.isUpdatePending && (this._$ES = this._$EP());
    }
    C(t5, s4, { useDefault: i6, reflect: e7, wrapped: h3 }, r6) {
      i6 && !(this._$Ej ?? (this._$Ej = /* @__PURE__ */ new Map())).has(t5) && (this._$Ej.set(t5, r6 ?? s4 ?? this[t5]), true !== h3 || void 0 !== r6) || (this._$AL.has(t5) || (this.hasUpdated || i6 || (s4 = void 0), this._$AL.set(t5, s4)), true === e7 && this._$Em !== t5 && (this._$Eq ?? (this._$Eq = /* @__PURE__ */ new Set())).add(t5));
    }
    async _$EP() {
      this.isUpdatePending = true;
      try {
        await this._$ES;
      } catch (t6) {
        Promise.reject(t6);
      }
      const t5 = this.scheduleUpdate();
      return null != t5 && await t5, !this.isUpdatePending;
    }
    scheduleUpdate() {
      return this.performUpdate();
    }
    performUpdate() {
      if (!this.isUpdatePending) return;
      if (!this.hasUpdated) {
        if (this.renderRoot ?? (this.renderRoot = this.createRenderRoot()), this._$Ep) {
          for (const [t7, s5] of this._$Ep) this[t7] = s5;
          this._$Ep = void 0;
        }
        const t6 = this.constructor.elementProperties;
        if (t6.size > 0) for (const [s5, i6] of t6) {
          const { wrapped: t7 } = i6, e7 = this[s5];
          true !== t7 || this._$AL.has(s5) || void 0 === e7 || this.C(s5, void 0, i6, e7);
        }
      }
      let t5 = false;
      const s4 = this._$AL;
      try {
        t5 = this.shouldUpdate(s4), t5 ? (this.willUpdate(s4), this._$EO?.forEach((t6) => t6.hostUpdate?.()), this.update(s4)) : this._$EM();
      } catch (s5) {
        throw t5 = false, this._$EM(), s5;
      }
      t5 && this._$AE(s4);
    }
    willUpdate(t5) {
    }
    _$AE(t5) {
      this._$EO?.forEach((t6) => t6.hostUpdated?.()), this.hasUpdated || (this.hasUpdated = true, this.firstUpdated(t5)), this.updated(t5);
    }
    _$EM() {
      this._$AL = /* @__PURE__ */ new Map(), this.isUpdatePending = false;
    }
    get updateComplete() {
      return this.getUpdateComplete();
    }
    getUpdateComplete() {
      return this._$ES;
    }
    shouldUpdate(t5) {
      return true;
    }
    update(t5) {
      this._$Eq && (this._$Eq = this._$Eq.forEach((t6) => this._$ET(t6, this[t6]))), this._$EM();
    }
    updated(t5) {
    }
    firstUpdated(t5) {
    }
  };
  y.elementStyles = [], y.shadowRootOptions = { mode: "open" }, y[d("elementProperties")] = /* @__PURE__ */ new Map(), y[d("finalized")] = /* @__PURE__ */ new Map(), p?.({ ReactiveElement: y }), (a.reactiveElementVersions ?? (a.reactiveElementVersions = [])).push("2.1.2");

  // node_modules/lit-html/lit-html.js
  var t2 = globalThis;
  var i3 = (t5) => t5;
  var s2 = t2.trustedTypes;
  var e3 = s2 ? s2.createPolicy("lit-html", { createHTML: (t5) => t5 }) : void 0;
  var h2 = "$lit$";
  var o3 = `lit$${Math.random().toFixed(9).slice(2)}$`;
  var n3 = "?" + o3;
  var r3 = `<${n3}>`;
  var l2 = document;
  var c3 = () => l2.createComment("");
  var a2 = (t5) => null === t5 || "object" != typeof t5 && "function" != typeof t5;
  var u2 = Array.isArray;
  var d2 = (t5) => u2(t5) || "function" == typeof t5?.[Symbol.iterator];
  var f2 = "[ 	\n\f\r]";
  var v = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g;
  var _ = /-->/g;
  var m = />/g;
  var p2 = RegExp(`>|${f2}(?:([^\\s"'>=/]+)(${f2}*=${f2}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g");
  var g = /'/g;
  var $ = /"/g;
  var y2 = /^(?:script|style|textarea|title)$/i;
  var x = (t5) => (i6, ...s4) => ({ _$litType$: t5, strings: i6, values: s4 });
  var b2 = x(1);
  var w = x(2);
  var T = x(3);
  var E = /* @__PURE__ */ Symbol.for("lit-noChange");
  var A = /* @__PURE__ */ Symbol.for("lit-nothing");
  var C = /* @__PURE__ */ new WeakMap();
  var P = l2.createTreeWalker(l2, 129);
  function V(t5, i6) {
    if (!u2(t5) || !t5.hasOwnProperty("raw")) throw Error("invalid template strings array");
    return void 0 !== e3 ? e3.createHTML(i6) : i6;
  }
  var N = (t5, i6) => {
    const s4 = t5.length - 1, e7 = [];
    let n5, l3 = 2 === i6 ? "<svg>" : 3 === i6 ? "<math>" : "", c4 = v;
    for (let i7 = 0; i7 < s4; i7++) {
      const s5 = t5[i7];
      let a3, u3, d3 = -1, f3 = 0;
      for (; f3 < s5.length && (c4.lastIndex = f3, u3 = c4.exec(s5), null !== u3); ) f3 = c4.lastIndex, c4 === v ? "!--" === u3[1] ? c4 = _ : void 0 !== u3[1] ? c4 = m : void 0 !== u3[2] ? (y2.test(u3[2]) && (n5 = RegExp("</" + u3[2], "g")), c4 = p2) : void 0 !== u3[3] && (c4 = p2) : c4 === p2 ? ">" === u3[0] ? (c4 = n5 ?? v, d3 = -1) : void 0 === u3[1] ? d3 = -2 : (d3 = c4.lastIndex - u3[2].length, a3 = u3[1], c4 = void 0 === u3[3] ? p2 : '"' === u3[3] ? $ : g) : c4 === $ || c4 === g ? c4 = p2 : c4 === _ || c4 === m ? c4 = v : (c4 = p2, n5 = void 0);
      const x2 = c4 === p2 && t5[i7 + 1].startsWith("/>") ? " " : "";
      l3 += c4 === v ? s5 + r3 : d3 >= 0 ? (e7.push(a3), s5.slice(0, d3) + h2 + s5.slice(d3) + o3 + x2) : s5 + o3 + (-2 === d3 ? i7 : x2);
    }
    return [V(t5, l3 + (t5[s4] || "<?>") + (2 === i6 ? "</svg>" : 3 === i6 ? "</math>" : "")), e7];
  };
  var S2 = class _S {
    constructor({ strings: t5, _$litType$: i6 }, e7) {
      let r6;
      this.parts = [];
      let l3 = 0, a3 = 0;
      const u3 = t5.length - 1, d3 = this.parts, [f3, v2] = N(t5, i6);
      if (this.el = _S.createElement(f3, e7), P.currentNode = this.el.content, 2 === i6 || 3 === i6) {
        const t6 = this.el.content.firstChild;
        t6.replaceWith(...t6.childNodes);
      }
      for (; null !== (r6 = P.nextNode()) && d3.length < u3; ) {
        if (1 === r6.nodeType) {
          if (r6.hasAttributes()) for (const t6 of r6.getAttributeNames()) if (t6.endsWith(h2)) {
            const i7 = v2[a3++], s4 = r6.getAttribute(t6).split(o3), e8 = /([.?@])?(.*)/.exec(i7);
            d3.push({ type: 1, index: l3, name: e8[2], strings: s4, ctor: "." === e8[1] ? I : "?" === e8[1] ? L : "@" === e8[1] ? z : H }), r6.removeAttribute(t6);
          } else t6.startsWith(o3) && (d3.push({ type: 6, index: l3 }), r6.removeAttribute(t6));
          if (y2.test(r6.tagName)) {
            const t6 = r6.textContent.split(o3), i7 = t6.length - 1;
            if (i7 > 0) {
              r6.textContent = s2 ? s2.emptyScript : "";
              for (let s4 = 0; s4 < i7; s4++) r6.append(t6[s4], c3()), P.nextNode(), d3.push({ type: 2, index: ++l3 });
              r6.append(t6[i7], c3());
            }
          }
        } else if (8 === r6.nodeType) if (r6.data === n3) d3.push({ type: 2, index: l3 });
        else {
          let t6 = -1;
          for (; -1 !== (t6 = r6.data.indexOf(o3, t6 + 1)); ) d3.push({ type: 7, index: l3 }), t6 += o3.length - 1;
        }
        l3++;
      }
    }
    static createElement(t5, i6) {
      const s4 = l2.createElement("template");
      return s4.innerHTML = t5, s4;
    }
  };
  function M(t5, i6, s4 = t5, e7) {
    if (i6 === E) return i6;
    let h3 = void 0 !== e7 ? s4._$Co?.[e7] : s4._$Cl;
    const o7 = a2(i6) ? void 0 : i6._$litDirective$;
    return h3?.constructor !== o7 && (h3?._$AO?.(false), void 0 === o7 ? h3 = void 0 : (h3 = new o7(t5), h3._$AT(t5, s4, e7)), void 0 !== e7 ? (s4._$Co ?? (s4._$Co = []))[e7] = h3 : s4._$Cl = h3), void 0 !== h3 && (i6 = M(t5, h3._$AS(t5, i6.values), h3, e7)), i6;
  }
  var R = class {
    constructor(t5, i6) {
      this._$AV = [], this._$AN = void 0, this._$AD = t5, this._$AM = i6;
    }
    get parentNode() {
      return this._$AM.parentNode;
    }
    get _$AU() {
      return this._$AM._$AU;
    }
    u(t5) {
      const { el: { content: i6 }, parts: s4 } = this._$AD, e7 = (t5?.creationScope ?? l2).importNode(i6, true);
      P.currentNode = e7;
      let h3 = P.nextNode(), o7 = 0, n5 = 0, r6 = s4[0];
      for (; void 0 !== r6; ) {
        if (o7 === r6.index) {
          let i7;
          2 === r6.type ? i7 = new k(h3, h3.nextSibling, this, t5) : 1 === r6.type ? i7 = new r6.ctor(h3, r6.name, r6.strings, this, t5) : 6 === r6.type && (i7 = new Z(h3, this, t5)), this._$AV.push(i7), r6 = s4[++n5];
        }
        o7 !== r6?.index && (h3 = P.nextNode(), o7++);
      }
      return P.currentNode = l2, e7;
    }
    p(t5) {
      let i6 = 0;
      for (const s4 of this._$AV) void 0 !== s4 && (void 0 !== s4.strings ? (s4._$AI(t5, s4, i6), i6 += s4.strings.length - 2) : s4._$AI(t5[i6])), i6++;
    }
  };
  var k = class _k {
    get _$AU() {
      return this._$AM?._$AU ?? this._$Cv;
    }
    constructor(t5, i6, s4, e7) {
      this.type = 2, this._$AH = A, this._$AN = void 0, this._$AA = t5, this._$AB = i6, this._$AM = s4, this.options = e7, this._$Cv = e7?.isConnected ?? true;
    }
    get parentNode() {
      let t5 = this._$AA.parentNode;
      const i6 = this._$AM;
      return void 0 !== i6 && 11 === t5?.nodeType && (t5 = i6.parentNode), t5;
    }
    get startNode() {
      return this._$AA;
    }
    get endNode() {
      return this._$AB;
    }
    _$AI(t5, i6 = this) {
      t5 = M(this, t5, i6), a2(t5) ? t5 === A || null == t5 || "" === t5 ? (this._$AH !== A && this._$AR(), this._$AH = A) : t5 !== this._$AH && t5 !== E && this._(t5) : void 0 !== t5._$litType$ ? this.$(t5) : void 0 !== t5.nodeType ? this.T(t5) : d2(t5) ? this.k(t5) : this._(t5);
    }
    O(t5) {
      return this._$AA.parentNode.insertBefore(t5, this._$AB);
    }
    T(t5) {
      this._$AH !== t5 && (this._$AR(), this._$AH = this.O(t5));
    }
    _(t5) {
      this._$AH !== A && a2(this._$AH) ? this._$AA.nextSibling.data = t5 : this.T(l2.createTextNode(t5)), this._$AH = t5;
    }
    $(t5) {
      const { values: i6, _$litType$: s4 } = t5, e7 = "number" == typeof s4 ? this._$AC(t5) : (void 0 === s4.el && (s4.el = S2.createElement(V(s4.h, s4.h[0]), this.options)), s4);
      if (this._$AH?._$AD === e7) this._$AH.p(i6);
      else {
        const t6 = new R(e7, this), s5 = t6.u(this.options);
        t6.p(i6), this.T(s5), this._$AH = t6;
      }
    }
    _$AC(t5) {
      let i6 = C.get(t5.strings);
      return void 0 === i6 && C.set(t5.strings, i6 = new S2(t5)), i6;
    }
    k(t5) {
      u2(this._$AH) || (this._$AH = [], this._$AR());
      const i6 = this._$AH;
      let s4, e7 = 0;
      for (const h3 of t5) e7 === i6.length ? i6.push(s4 = new _k(this.O(c3()), this.O(c3()), this, this.options)) : s4 = i6[e7], s4._$AI(h3), e7++;
      e7 < i6.length && (this._$AR(s4 && s4._$AB.nextSibling, e7), i6.length = e7);
    }
    _$AR(t5 = this._$AA.nextSibling, s4) {
      for (this._$AP?.(false, true, s4); t5 !== this._$AB; ) {
        const s5 = i3(t5).nextSibling;
        i3(t5).remove(), t5 = s5;
      }
    }
    setConnected(t5) {
      void 0 === this._$AM && (this._$Cv = t5, this._$AP?.(t5));
    }
  };
  var H = class {
    get tagName() {
      return this.element.tagName;
    }
    get _$AU() {
      return this._$AM._$AU;
    }
    constructor(t5, i6, s4, e7, h3) {
      this.type = 1, this._$AH = A, this._$AN = void 0, this.element = t5, this.name = i6, this._$AM = e7, this.options = h3, s4.length > 2 || "" !== s4[0] || "" !== s4[1] ? (this._$AH = Array(s4.length - 1).fill(new String()), this.strings = s4) : this._$AH = A;
    }
    _$AI(t5, i6 = this, s4, e7) {
      const h3 = this.strings;
      let o7 = false;
      if (void 0 === h3) t5 = M(this, t5, i6, 0), o7 = !a2(t5) || t5 !== this._$AH && t5 !== E, o7 && (this._$AH = t5);
      else {
        const e8 = t5;
        let n5, r6;
        for (t5 = h3[0], n5 = 0; n5 < h3.length - 1; n5++) r6 = M(this, e8[s4 + n5], i6, n5), r6 === E && (r6 = this._$AH[n5]), o7 || (o7 = !a2(r6) || r6 !== this._$AH[n5]), r6 === A ? t5 = A : t5 !== A && (t5 += (r6 ?? "") + h3[n5 + 1]), this._$AH[n5] = r6;
      }
      o7 && !e7 && this.j(t5);
    }
    j(t5) {
      t5 === A ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, t5 ?? "");
    }
  };
  var I = class extends H {
    constructor() {
      super(...arguments), this.type = 3;
    }
    j(t5) {
      this.element[this.name] = t5 === A ? void 0 : t5;
    }
  };
  var L = class extends H {
    constructor() {
      super(...arguments), this.type = 4;
    }
    j(t5) {
      this.element.toggleAttribute(this.name, !!t5 && t5 !== A);
    }
  };
  var z = class extends H {
    constructor(t5, i6, s4, e7, h3) {
      super(t5, i6, s4, e7, h3), this.type = 5;
    }
    _$AI(t5, i6 = this) {
      if ((t5 = M(this, t5, i6, 0) ?? A) === E) return;
      const s4 = this._$AH, e7 = t5 === A && s4 !== A || t5.capture !== s4.capture || t5.once !== s4.once || t5.passive !== s4.passive, h3 = t5 !== A && (s4 === A || e7);
      e7 && this.element.removeEventListener(this.name, this, s4), h3 && this.element.addEventListener(this.name, this, t5), this._$AH = t5;
    }
    handleEvent(t5) {
      "function" == typeof this._$AH ? this._$AH.call(this.options?.host ?? this.element, t5) : this._$AH.handleEvent(t5);
    }
  };
  var Z = class {
    constructor(t5, i6, s4) {
      this.element = t5, this.type = 6, this._$AN = void 0, this._$AM = i6, this.options = s4;
    }
    get _$AU() {
      return this._$AM._$AU;
    }
    _$AI(t5) {
      M(this, t5);
    }
  };
  var B = t2.litHtmlPolyfillSupport;
  B?.(S2, k), (t2.litHtmlVersions ?? (t2.litHtmlVersions = [])).push("3.3.2");
  var D = (t5, i6, s4) => {
    const e7 = s4?.renderBefore ?? i6;
    let h3 = e7._$litPart$;
    if (void 0 === h3) {
      const t6 = s4?.renderBefore ?? null;
      e7._$litPart$ = h3 = new k(i6.insertBefore(c3(), t6), t6, void 0, s4 ?? {});
    }
    return h3._$AI(t5), h3;
  };

  // node_modules/lit-element/lit-element.js
  var s3 = globalThis;
  var i4 = class extends y {
    constructor() {
      super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
    }
    createRenderRoot() {
      var _a;
      const t5 = super.createRenderRoot();
      return (_a = this.renderOptions).renderBefore ?? (_a.renderBefore = t5.firstChild), t5;
    }
    update(t5) {
      const r6 = this.render();
      this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(t5), this._$Do = D(r6, this.renderRoot, this.renderOptions);
    }
    connectedCallback() {
      super.connectedCallback(), this._$Do?.setConnected(true);
    }
    disconnectedCallback() {
      super.disconnectedCallback(), this._$Do?.setConnected(false);
    }
    render() {
      return E;
    }
  };
  i4._$litElement$ = true, i4["finalized"] = true, s3.litElementHydrateSupport?.({ LitElement: i4 });
  var o4 = s3.litElementPolyfillSupport;
  o4?.({ LitElement: i4 });
  (s3.litElementVersions ?? (s3.litElementVersions = [])).push("4.2.2");

  // node_modules/@lit/reactive-element/decorators/custom-element.js
  var t3 = (t5) => (e7, o7) => {
    void 0 !== o7 ? o7.addInitializer(() => {
      customElements.define(t5, e7);
    }) : customElements.define(t5, e7);
  };

  // node_modules/@lit/reactive-element/decorators/property.js
  var o5 = { attribute: true, type: String, converter: u, reflect: false, hasChanged: f };
  var r4 = (t5 = o5, e7, r6) => {
    const { kind: n5, metadata: i6 } = r6;
    let s4 = globalThis.litPropertyMetadata.get(i6);
    if (void 0 === s4 && globalThis.litPropertyMetadata.set(i6, s4 = /* @__PURE__ */ new Map()), "setter" === n5 && ((t5 = Object.create(t5)).wrapped = true), s4.set(r6.name, t5), "accessor" === n5) {
      const { name: o7 } = r6;
      return { set(r7) {
        const n6 = e7.get.call(this);
        e7.set.call(this, r7), this.requestUpdate(o7, n6, t5, true, r7);
      }, init(e8) {
        return void 0 !== e8 && this.C(o7, void 0, t5, e8), e8;
      } };
    }
    if ("setter" === n5) {
      const { name: o7 } = r6;
      return function(r7) {
        const n6 = this[o7];
        e7.call(this, r7), this.requestUpdate(o7, n6, t5, true, r7);
      };
    }
    throw Error("Unsupported decorator location: " + n5);
  };
  function n4(t5) {
    return (e7, o7) => "object" == typeof o7 ? r4(t5, e7, o7) : ((t6, e8, o8) => {
      const r6 = e8.hasOwnProperty(o8);
      return e8.constructor.createProperty(o8, t6), r6 ? Object.getOwnPropertyDescriptor(e8, o8) : void 0;
    })(t5, e7, o7);
  }

  // node_modules/@lit/reactive-element/decorators/state.js
  function r5(r6) {
    return n4({ ...r6, state: true, attribute: false });
  }

  // src/webview/styles/theme.ts
  var THEME_STORAGE_KEY = "specsmd:webview-theme";
  var THEME_PALETTES = {
    dark: {
      "--vscode-foreground": "#cccccc",
      "--vscode-descriptionForeground": "#8b8b8b",
      "--vscode-sideBar-background": "#252526",
      "--vscode-editor-background": "#1e1e1e",
      "--vscode-sideBarSectionHeader-background": "#2d2d30",
      "--vscode-sideBarSectionHeader-border": "#454545",
      "--vscode-input-background": "#3c3c3c",
      "--vscode-input-border": "#3f3f46",
      "--vscode-list-hoverBackground": "#2a2d2e",
      "--vscode-list-activeSelectionBackground": "#094771",
      "--vscode-badge-background": "#4d4d4d",
      "--vscode-badge-foreground": "#ffffff",
      "--vscode-button-background": "#0e639c",
      "--vscode-button-foreground": "#ffffff",
      "--vscode-scrollbarSlider-background": "#686868",
      "--vscode-font-family": "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      "--vscode-font-size": "13px",
      "--specsmd-color-scheme": "dark",
      "--specsmd-surface-glow": "rgba(249, 115, 22, 0.05)"
    },
    light: {
      "--vscode-foreground": "#1f2328",
      "--vscode-descriptionForeground": "#57606a",
      "--vscode-sideBar-background": "#f6f8fa",
      "--vscode-editor-background": "#ffffff",
      "--vscode-sideBarSectionHeader-background": "#eef2f7",
      "--vscode-sideBarSectionHeader-border": "#d0d7de",
      "--vscode-input-background": "#ffffff",
      "--vscode-input-border": "#d0d7de",
      "--vscode-list-hoverBackground": "#eef2f7",
      "--vscode-list-activeSelectionBackground": "#dbeafe",
      "--vscode-badge-background": "#d0d7de",
      "--vscode-badge-foreground": "#24292f",
      "--vscode-button-background": "#0e639c",
      "--vscode-button-foreground": "#ffffff",
      "--vscode-scrollbarSlider-background": "#b6c2cf",
      "--vscode-font-family": "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      "--vscode-font-size": "13px",
      "--specsmd-color-scheme": "light",
      "--specsmd-surface-glow": "rgba(14, 99, 156, 0.06)"
    }
  };
  function isThemeMode(value) {
    return value === "dark" || value === "light";
  }
  function getThemeRoot(target) {
    if (typeof document === "undefined") {
      return null;
    }
    if (!target) {
      return document.documentElement;
    }
    if (target instanceof Document) {
      return target.documentElement;
    }
    return target;
  }
  function readStoredTheme() {
    if (typeof window === "undefined" || typeof localStorage === "undefined") {
      return null;
    }
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      return isThemeMode(stored) ? stored : null;
    } catch {
      return null;
    }
  }
  function getSystemTheme() {
    if (typeof window !== "undefined" && typeof window.matchMedia === "function") {
      return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
    }
    return "dark";
  }
  function getInitialTheme(state2) {
    if (isThemeMode(state2)) {
      return state2;
    }
    const stored = readStoredTheme();
    if (stored) {
      return stored;
    }
    return getSystemTheme();
  }
  function persistTheme(theme) {
    if (typeof window === "undefined" || typeof localStorage === "undefined") {
      return;
    }
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
    }
  }
  function applyTheme(theme, target) {
    const root = getThemeRoot(target);
    if (!root) {
      return;
    }
    const palette = THEME_PALETTES[theme];
    for (const [name, value] of Object.entries(palette)) {
      root.style.setProperty(name, value);
    }
    root.dataset.theme = theme;
    root.style.setProperty("color-scheme", palette["--specsmd-color-scheme"]);
  }
  var themeStyles = i`
    :host {
        /* VS Code font */
        --font-family: var(--vscode-font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif);
        --font-size: var(--vscode-font-size, 13px);

        /* VS Code colors */
        --foreground: var(--vscode-foreground, #cccccc);
        --background: var(--vscode-sideBar-background, #252526);
        --editor-background: var(--vscode-editor-background, #1e1e1e);
        --border-color: var(--vscode-sideBarSectionHeader-border, #454545);
        --description-foreground: var(--vscode-descriptionForeground, #8b8b8b);

        /* SpecsMD accent colors */
        --accent-primary: #f97316;
        --status-complete: #22c55e;
        --status-active: #f97316;
        --status-pending: #6b7280;
        --status-blocked: #ef4444;

        color-scheme: var(--specsmd-color-scheme, dark);
    }
`;
  var resetStyles = i`
    * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
    }

    button {
        font-family: inherit;
        font-size: inherit;
        border: none;
        background: none;
        cursor: pointer;
    }
`;

  // src/webview/components/shared/base-element.ts
  var BaseElement = class extends i4 {
  };
  /**
   * Shared base styles included in all components.
   */
  BaseElement.baseStyles = [
    themeStyles,
    resetStyles,
    i`
            :host {
                display: block;
                font-family: var(--font-family);
                font-size: var(--font-size);
                color: var(--foreground);
            }
        `
  ];

  // src/webview/components/shared/empty-state.ts
  var EmptyState = class extends BaseElement {
    constructor() {
      super(...arguments);
      this.icon = "\u{1F4ED}";
      this.message = "No items found";
      this.hint = "";
    }
    render() {
      return b2`
            <div class="icon">${this.icon}</div>
            <div class="message">${this.message}</div>
            ${this.hint ? b2`<div class="hint">${this.hint}</div>` : ""}
        `;
    }
  };
  EmptyState.styles = [
    ...BaseElement.baseStyles,
    i`
            :host {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 32px 16px;
                text-align: center;
            }

            .icon {
                font-size: 32px;
                margin-bottom: 12px;
                opacity: 0.7;
            }

            .message {
                font-size: 13px;
                font-weight: 500;
                color: var(--foreground);
                margin-bottom: 4px;
            }

            .hint {
                font-size: 11px;
                color: var(--description-foreground);
            }
        `
  ];
  __decorateClass([
    n4({ type: String })
  ], EmptyState.prototype, "icon", 2);
  __decorateClass([
    n4({ type: String })
  ], EmptyState.prototype, "message", 2);
  __decorateClass([
    n4({ type: String })
  ], EmptyState.prototype, "hint", 2);
  EmptyState = __decorateClass([
    t3("empty-state")
  ], EmptyState);

  // src/webview/components/shared/progress-bar.ts
  var ProgressBar = class extends BaseElement {
    constructor() {
      super(...arguments);
      this.percent = 0;
      this.label = "";
      this.showPercent = true;
      this.height = 8;
    }
    render() {
      const clampedPercent = Math.max(0, Math.min(100, this.percent));
      const isComplete = clampedPercent === 100;
      return b2`
            <div class="container">
                ${this.label || this.showPercent ? b2`
                    <div class="header">
                        ${this.label ? b2`<span class="label">${this.label}</span>` : ""}
                        ${this.showPercent ? b2`<span class="percent">${clampedPercent}%</span>` : ""}
                    </div>
                ` : ""}
                <div class="track" style="height: ${this.height}px;">
                    <div
                        class="fill ${isComplete ? "complete" : ""}"
                        style="width: ${clampedPercent}%;">
                    </div>
                </div>
            </div>
        `;
    }
  };
  ProgressBar.styles = [
    ...BaseElement.baseStyles,
    i`
            :host {
                display: block;
            }

            .container {
                display: flex;
                flex-direction: column;
                gap: 6px;
            }

            .header {
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .label {
                font-size: 11px;
                color: var(--description-foreground);
            }

            .percent {
                font-size: 12px;
                font-weight: 600;
                color: var(--foreground);
            }

            .track {
                width: 100%;
                background: var(--border-color);
                border-radius: 4px;
                overflow: hidden;
            }

            .fill {
                height: 100%;
                background: var(--accent-primary);
                border-radius: 4px;
                transition: width 0.3s ease;
            }

            .fill.complete {
                background: var(--status-complete);
            }
        `
  ];
  __decorateClass([
    n4({ type: Number })
  ], ProgressBar.prototype, "percent", 2);
  __decorateClass([
    n4({ type: String })
  ], ProgressBar.prototype, "label", 2);
  __decorateClass([
    n4({ type: Boolean })
  ], ProgressBar.prototype, "showPercent", 2);
  __decorateClass([
    n4({ type: Number })
  ], ProgressBar.prototype, "height", 2);
  ProgressBar = __decorateClass([
    t3("progress-bar")
  ], ProgressBar);

  // node_modules/lit-html/directive.js
  var t4 = { ATTRIBUTE: 1, CHILD: 2, PROPERTY: 3, BOOLEAN_ATTRIBUTE: 4, EVENT: 5, ELEMENT: 6 };
  var e5 = (t5) => (...e7) => ({ _$litDirective$: t5, values: e7 });
  var i5 = class {
    constructor(t5) {
    }
    get _$AU() {
      return this._$AM._$AU;
    }
    _$AT(t5, e7, i6) {
      this._$Ct = t5, this._$AM = e7, this._$Ci = i6;
    }
    _$AS(t5, e7) {
      return this.update(t5, e7);
    }
    update(t5, e7) {
      return this.render(...e7);
    }
  };

  // node_modules/lit-html/directives/unsafe-html.js
  var e6 = class extends i5 {
    constructor(i6) {
      if (super(i6), this.it = A, i6.type !== t4.CHILD) throw Error(this.constructor.directiveName + "() can only be used in child bindings");
    }
    render(r6) {
      if (r6 === A || null == r6) return this._t = void 0, this.it = r6;
      if (r6 === E) return r6;
      if ("string" != typeof r6) throw Error(this.constructor.directiveName + "() called with a non-string value");
      if (r6 === this.it) return this._t;
      this.it = r6;
      const s4 = [r6];
      return s4.raw = s4, this._t = { _$litType$: this.constructor.resultType, strings: s4, values: [] };
    }
  };
  e6.directiveName = "unsafeHTML", e6.resultType = 1;
  var o6 = e5(e6);

  // src/webview/components/tabs/view-tabs.ts
  var TABS = [
    { id: "bolts", icon: "\u26A1", label: "Bolts" },
    // Lightning bolt
    { id: "specs", icon: "\u{1F4CB}", label: "Specs" },
    // Clipboard
    { id: "overview", icon: "\u{1F4CA}", label: "Overview" }
    // Chart
  ];
  var ViewTabs = class extends BaseElement {
    constructor() {
      super(...arguments);
      this.activeTab = "bolts";
    }
    render() {
      return b2`
            ${TABS.map((tab) => b2`
                <button
                    class=${this.activeTab === tab.id ? "active" : ""}
                    @click=${() => this._selectTab(tab.id)}
                    aria-selected=${this.activeTab === tab.id}
                    role="tab"
                >
                    <span class="tab-icon">${tab.icon}</span>${tab.label}
                </button>
            `)}
        `;
    }
    /**
     * Handle tab selection.
     */
    _selectTab(tab) {
      if (tab === this.activeTab) {
        return;
      }
      this.dispatchEvent(new CustomEvent("tab-change", {
        detail: { tab },
        bubbles: true,
        composed: true
      }));
    }
  };
  ViewTabs.styles = [
    ...BaseElement.baseStyles,
    i`
            :host {
                display: flex;
                background: var(--editor-background);
                border-bottom: 1px solid var(--border-color);
            }

            button {
                flex: 1;
                padding: 10px 8px;
                font-size: 11px;
                font-weight: 600;
                text-align: center;
                color: var(--description-foreground);
                border-bottom: 2px solid transparent;
                transition: color 0.15s, border-color 0.15s;
            }

            button:hover {
                color: var(--foreground);
            }

            button.active {
                color: var(--accent-primary);
                border-bottom-color: var(--accent-primary);
            }

            .tab-icon {
                margin-right: 4px;
            }
        `
  ];
  __decorateClass([
    n4({ type: String })
  ], ViewTabs.prototype, "activeTab", 2);
  ViewTabs = __decorateClass([
    t3("view-tabs")
  ], ViewTabs);

  // src/webview/components/bolts/current-bolts.ts
  var CurrentIntent = class extends BaseElement {
    constructor() {
      super(...arguments);
      this.intent = null;
      this.context = "none";
      this.stats = { active: 0, queued: 0, done: 0, blocked: 0 };
    }
    render() {
      const label = this.context === "queued" ? "Next Intent" : "Current Intent";
      if (!this.intent) {
        return b2`
                <div class="label">${label}</div>
                <div class="title" style="opacity: 0.6;">No active work</div>
            `;
      }
      const total = this.stats.active + this.stats.queued + this.stats.done + this.stats.blocked;
      const percent = total > 0 ? Math.round(this.stats.done / total * 100) : 0;
      return b2`
            <div class="label">${label}</div>
            <div class="title">${this.intent.number}-${this.intent.name}</div>
            <div class="progress-container">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${percent}%"></div>
                </div>
                <div class="progress-text">
                    <span class="percent">${percent}%</span> complete
                    <span>(${this.stats.done} of ${total} bolts)</span>
                </div>
            </div>
            <div class="breakdown">
                ${this.stats.active > 0 ? b2`
                    <span class="breakdown-item active">${this.stats.active} in progress</span>
                ` : ""}
                ${this.stats.queued > 0 ? b2`
                    <span class="breakdown-item">${this.stats.queued} queued</span>
                ` : ""}
                ${this.stats.blocked > 0 ? b2`
                    <span class="breakdown-item blocked">${this.stats.blocked} blocked</span>
                ` : ""}
            </div>
        `;
    }
  };
  CurrentIntent.styles = [
    ...BaseElement.baseStyles,
    i`
            :host {
                display: block;
                padding: 16px 16px 20px 16px;
                background: linear-gradient(135deg, var(--vscode-sideBar-background, #252526) 0%, rgba(249, 115, 22, 0.05) 100%);
                border-top: 3px solid #f97316;
            }

            .label {
                font-size: 11px;
                font-weight: 600;
                color: #f97316;
                text-transform: uppercase;
                letter-spacing: 0.8px;
                margin-bottom: 6px;
            }

            .title {
                font-size: 17px;
                font-weight: 700;
                color: var(--foreground, #cccccc);
                margin-bottom: 16px;
                line-height: 1.2;
            }

            .progress-container {
                margin-bottom: 14px;
            }

            .progress-bar {
                height: 8px;
                background: var(--vscode-input-background, #3c3c3c);
                border-radius: 4px;
                overflow: hidden;
                margin-bottom: 8px;
            }

            .progress-fill {
                height: 100%;
                background: linear-gradient(90deg, #22c55e 0%, #4ade80 100%);
                border-radius: 4px;
                transition: width 0.3s ease;
            }

            .progress-text {
                font-size: 13px;
                color: var(--foreground, #cccccc);
            }

            .progress-text strong {
                font-weight: 600;
            }

            .progress-text .percent {
                color: #22c55e;
                font-weight: 700;
            }

            .breakdown {
                font-size: 12px;
                color: var(--description-foreground, #858585);
                display: flex;
                flex-wrap: wrap;
                gap: 6px;
            }

            .breakdown-item {
                display: inline-flex;
                align-items: center;
                gap: 4px;
            }

            .breakdown-item::before {
                content: '·';
                color: var(--description-foreground, #858585);
            }

            .breakdown-item:first-child::before {
                content: '';
            }

            .breakdown-item.active {
                color: #f97316;
            }

            .breakdown-item.blocked {
                color: #ef4444;
            }
        `
  ];
  __decorateClass([
    n4({ type: Object })
  ], CurrentIntent.prototype, "intent", 2);
  __decorateClass([
    n4({ type: String })
  ], CurrentIntent.prototype, "context", 2);
  __decorateClass([
    n4({ type: Object })
  ], CurrentIntent.prototype, "stats", 2);
  CurrentIntent = __decorateClass([
    t3("current-intent")
  ], CurrentIntent);

  // src/webview/components/shared/progress-ring.ts
  var ProgressRing = class extends BaseElement {
    constructor() {
      super(...arguments);
      this.percent = 0;
      this.size = 64;
    }
    render() {
      const radius = 25;
      const circumference = 2 * Math.PI * radius;
      const dashOffset = circumference - circumference * this.percent / 100;
      return b2`
            <div class="ring-container" style="width: ${this.size}px; height: ${this.size}px;">
                <svg width="${this.size}" height="${this.size}" viewBox="0 0 64 64">
                    <circle class="ring-bg" cx="32" cy="32" r="${radius}"></circle>
                    <circle
                        class="ring-fill"
                        cx="32"
                        cy="32"
                        r="${radius}"
                        style="stroke-dasharray: ${circumference}; stroke-dashoffset: ${dashOffset}">
                    </circle>
                </svg>
                <span class="ring-text">${this.percent}%</span>
            </div>
        `;
    }
  };
  ProgressRing.styles = [
    ...BaseElement.baseStyles,
    i`
            :host {
                display: inline-block;
            }

            .ring-container {
                position: relative;
                display: inline-flex;
                align-items: center;
                justify-content: center;
            }

            svg {
                transform: rotate(-90deg);
            }

            .ring-bg {
                fill: none;
                stroke: var(--border-color);
                stroke-width: 4;
            }

            .ring-fill {
                fill: none;
                stroke: var(--accent-primary);
                stroke-width: 4;
                stroke-linecap: round;
                stroke-dasharray: 157;
                transition: stroke-dashoffset 0.3s ease;
            }

            .ring-text {
                position: absolute;
                font-size: 14px;
                font-weight: 600;
                color: var(--foreground);
            }
        `
  ];
  __decorateClass([
    n4({ type: Number })
  ], ProgressRing.prototype, "percent", 2);
  __decorateClass([
    n4({ type: Number })
  ], ProgressRing.prototype, "size", 2);
  ProgressRing = __decorateClass([
    t3("progress-ring")
  ], ProgressRing);

  // src/webview/components/shared/stage-pipeline.ts
  var StagePipeline = class extends BaseElement {
    constructor() {
      super(...arguments);
      this.stages = [];
    }
    render() {
      return b2`
            ${this.stages.map((stage, idx) => b2`
                <div class="stage">
                    <div class="node ${stage.status}">
                        ${stage.status === "complete" ? b2`&#10003;` : this._getInitial(stage.name)}
                    </div>
                    <span class="label">${this._formatName(stage.name)}</span>
                </div>
                ${idx < this.stages.length - 1 ? b2`
                    <div class="connector ${stage.status === "complete" ? "complete" : ""}"></div>
                ` : ""}
            `)}
        `;
    }
    /**
     * Capitalize the first letter of the stage name.
     */
    _formatName(name) {
      return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
    }
    /**
     * Get first letter of stage name for node display.
     */
    _getInitial(name) {
      return name.charAt(0).toUpperCase();
    }
  };
  StagePipeline.styles = [
    ...BaseElement.baseStyles,
    i`
            :host {
                display: flex;
                align-items: center;
                gap: 4px;
                padding: 8px 0;
            }

            .stage {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 4px;
            }

            .node {
                width: 24px;
                height: 24px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 10px;
                font-weight: 600;
                border: 2px solid var(--border-color);
                background: var(--editor-background);
                color: var(--description-foreground);
            }

            .node.complete {
                background: var(--status-complete);
                border-color: var(--status-complete);
                color: white;
            }

            .node.active {
                background: var(--status-active);
                border-color: var(--status-active);
                color: white;
            }

            .label {
                font-size: 9px;
                color: var(--description-foreground);
                text-align: center;
            }

            .connector {
                width: 16px;
                height: 2px;
                background: var(--border-color);
                margin-bottom: 16px;
            }

            .connector.complete {
                background: var(--status-complete);
            }
        `
  ];
  __decorateClass([
    n4({ type: Array })
  ], StagePipeline.prototype, "stages", 2);
  StagePipeline = __decorateClass([
    t3("stage-pipeline")
  ], StagePipeline);

  // src/webview/components/bolts/stories-list.ts
  var StoriesList = class extends BaseElement {
    constructor() {
      super(...arguments);
      this.stories = [];
      this.storiesComplete = 0;
    }
    render() {
      if (this.stories.length === 0) {
        return b2``;
      }
      return b2`
            <div class="header">
                <span>Stories</span>
                <span class="count">${this.storiesComplete}/${this.stories.length}</span>
            </div>
            <div class="list">
                ${this.stories.map((story) => b2`
                    <div class="story ${story.status}">
                        <div class="status-icon ${story.status}">
                            ${story.status === "complete" ? "\u2713" : story.status === "active" ? "\u25CF" : ""}
                        </div>
                        <span class="name">${story.id}</span>
                        ${story.path ? b2`
                            <button
                                class="open-btn"
                                @click=${(e7) => this._handleStoryClick(e7, story.path)}
                                title="Open story file"
                            >🔍</button>
                        ` : ""}
                    </div>
                `)}
            </div>
        `;
    }
    /**
     * Handle story click - dispatch open-file event.
     */
    _handleStoryClick(e7, path) {
      e7.stopPropagation();
      this.dispatchEvent(new CustomEvent("open-file", {
        detail: { path },
        bubbles: true,
        composed: true
      }));
    }
  };
  StoriesList.styles = [
    ...BaseElement.baseStyles,
    i`
            :host {
                display: block;
            }

            .header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 8px;
                font-size: 11px;
                font-weight: 600;
                color: var(--foreground);
            }

            .count {
                font-weight: normal;
                color: var(--description-foreground);
            }

            .list {
                display: flex;
                flex-direction: column;
                gap: 4px;
            }

            .story {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 4px 0;
            }

            .story.complete {
                opacity: 0.7;
            }

            .status-icon {
                width: 16px;
                height: 16px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 10px;
                flex-shrink: 0;
            }

            .status-icon.complete {
                background: var(--status-complete);
                color: white;
            }

            .status-icon.active {
                background: var(--status-active);
                color: white;
            }

            .status-icon.pending {
                background: var(--editor-background);
                border: 2px dashed var(--border-color);
                color: var(--description-foreground);
            }

            .name {
                font-size: 11px;
                color: var(--foreground);
            }

            .story.complete .name {
                text-decoration: line-through;
                color: var(--description-foreground);
            }

            .story.active .name {
                color: var(--status-active);
                font-weight: 500;
            }

            /* Magnifier button - appears on hover */
            .name {
                flex: 1;
            }

            .open-btn {
                background: none;
                border: none;
                color: var(--description-foreground);
                cursor: pointer;
                padding: 2px 4px;
                font-size: 11px;
                border-radius: 3px;
                opacity: 0;
                transition: all 0.15s;
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
            }

            .story:hover .open-btn {
                opacity: 0.7;
            }

            .open-btn:hover {
                opacity: 1 !important;
                background: var(--vscode-list-hoverBackground);
                color: var(--foreground);
            }
        `
  ];
  __decorateClass([
    n4({ type: Array })
  ], StoriesList.prototype, "stories", 2);
  __decorateClass([
    n4({ type: Number })
  ], StoriesList.prototype, "storiesComplete", 2);
  StoriesList = __decorateClass([
    t3("stories-list")
  ], StoriesList);

  // src/webview/components/bolts/focus-card.ts
  function formatStageName(name) {
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  }
  var FocusCard = class extends BaseElement {
    constructor() {
      super(...arguments);
      this.expanded = false;
    }
    render() {
      if (!this.bolt) {
        return b2``;
      }
      const progressPercent = this.bolt.stagesTotal > 0 ? Math.round(this.bolt.stagesComplete / this.bolt.stagesTotal * 100) : 0;
      const currentStage = this.bolt.stages.find((s4) => s4.status === "active");
      const currentStageName = currentStage ? formatStageName(currentStage.name) : this.bolt.stages[0]?.name ? formatStageName(this.bolt.stages[0].name) : "Not started";
      const stageLabel = this.bolt.currentStage ? formatStageName(this.bolt.currentStage) : "Not started";
      return b2`
            <div class="card ${this.expanded ? "expanded" : ""}" data-bolt-id="${this.bolt.id}">
                <div class="header" @click=${this._toggleExpand}>
                    <div class="header-content">
                        <div class="title">${this.bolt.name}</div>
                        <div class="subtitle">${this.bolt.type} Bolt | ${stageLabel} Stage</div>
                    </div>
                    <button class="open-btn" @click=${this._handleOpenBolt} title="Open bolt.md">🔍</button>
                    <div class="badge">In Progress</div>
                </div>
                <div class="body">
                    <div class="progress-section">
                        <progress-ring .percent=${progressPercent}></progress-ring>
                        <div class="progress-details">
                            <div class="progress-stage">Stage: <strong>${currentStageName}</strong></div>
                            <div class="progress-info">${this.bolt.stagesComplete} of ${this.bolt.stagesTotal} stages complete</div>
                            <div class="progress-info">${this.bolt.storiesComplete}/${this.bolt.storiesTotal} stories done</div>
                        </div>
                    </div>

                    <div class="pipeline-section">
                        <stage-pipeline .stages=${this.bolt.stages}></stage-pipeline>
                    </div>

                    ${this.bolt.stories.length > 0 ? b2`
                        <stories-list
                            .stories=${this.bolt.stories}
                            .storiesComplete=${this.bolt.storiesComplete}>
                        </stories-list>
                    ` : ""}

                    ${this._renderArtifacts()}

                    <div class="actions">
                        <button class="action-btn action-btn-primary" @click=${this._handleContinue}>Continue</button>
                        <button class="action-btn action-btn-secondary" @click=${this._handleViewFiles}>See Bolt</button>
                    </div>
                </div>
            </div>
        `;
    }
    _toggleExpand() {
      this.dispatchEvent(new CustomEvent("toggle-expand", {
        detail: { expanded: !this.expanded },
        bubbles: true,
        composed: true
      }));
    }
    _handleContinue(e7) {
      e7.stopPropagation();
      this.dispatchEvent(new CustomEvent("continue-bolt", {
        detail: { boltId: this.bolt.id, boltName: this.bolt.name },
        bubbles: true,
        composed: true
      }));
    }
    _handleViewFiles(e7) {
      e7.stopPropagation();
      this.dispatchEvent(new CustomEvent("view-files", {
        detail: { boltId: this.bolt.id },
        bubbles: true,
        composed: true
      }));
    }
    _handleOpenBolt(e7) {
      e7.stopPropagation();
      this.dispatchEvent(new CustomEvent("open-bolt", {
        detail: { boltId: this.bolt.id },
        bubbles: true,
        composed: true
      }));
    }
    _renderArtifacts() {
      const hasFiles = this.bolt.files && this.bolt.files.length > 0;
      if (!hasFiles) {
        return b2``;
      }
      return b2`
            <div class="artifacts-section">
                <div class="artifacts-header">Artifacts</div>
                ${this.bolt.files.map((file) => b2`
                    <div class="artifact-item" @click=${(e7) => this._handleFileClick(e7, file.path)}>
                        <span class="artifact-icon">${this._getFileIcon(file.type)}</span>
                        <span class="artifact-name">${file.name}</span>
                        <span class="artifact-type">${file.type}</span>
                    </div>
                `)}
            </div>
        `;
    }
    _getFileIcon(type) {
      switch (type) {
        case "walkthrough":
          return "\u{1F4D6}";
        case "test-report":
          return "\u{1F4CB}";
        case "plan":
          return "\u{1F4C4}";
        case "design":
          return "\u{1F527}";
        default:
          return "\u{1F4C4}";
      }
    }
    _handleFileClick(e7, path) {
      e7.stopPropagation();
      this.dispatchEvent(new CustomEvent("open-file", {
        detail: { path },
        bubbles: true,
        composed: true
      }));
    }
  };
  FocusCard.styles = [
    ...BaseElement.baseStyles,
    i`
            :host {
                display: block;
            }

            .card {
                background: linear-gradient(135deg, var(--card-active-gradient-start, rgba(249, 115, 22, 0.08)) 0%, var(--card-active-gradient-end, rgba(249, 115, 22, 0.02)) 100%);
                border-left: 4px solid var(--card-active-border, #f97316);
                border-radius: 8px;
                overflow: hidden;
            }

            .header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 14px 16px;
                cursor: pointer;
                transition: background 0.15s;
            }

            .header:hover {
                background: rgba(255, 255, 255, 0.02);
            }

            .header-content {
                flex: 1;
                min-width: 0;
            }

            .title {
                font-size: 15px;
                font-weight: 600;
                color: var(--foreground, #cccccc);
                margin-bottom: 4px;
            }

            .subtitle {
                font-size: 12px;
                color: var(--description-foreground, #858585);
            }

            .badge {
                font-size: 11px;
                font-weight: 600;
                padding: 6px 14px;
                border-radius: 16px;
                background: var(--card-active-border, #f97316);
                color: white;
                flex-shrink: 0;
                margin-left: 12px;
            }

            .open-btn {
                background: none;
                border: none;
                color: var(--description-foreground);
                cursor: pointer;
                padding: 4px 8px;
                font-size: 14px;
                border-radius: 4px;
                opacity: 0;
                transition: all 0.15s;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-left: 8px;
            }

            .header:hover .open-btn {
                opacity: 0.7;
            }

            .open-btn:hover {
                opacity: 1 !important;
                background: var(--vscode-list-hoverBackground);
                color: var(--foreground);
            }

            .body {
                padding: 0 16px 16px;
                display: none;
            }

            .card.expanded .body {
                display: block;
            }

            .progress-section {
                display: flex;
                gap: 16px;
                margin-bottom: 16px;
                padding-top: 4px;
            }

            .progress-details {
                flex: 1;
            }

            .progress-stage {
                font-size: 13px;
                color: var(--foreground);
                margin-bottom: 6px;
            }

            .progress-info {
                font-size: 12px;
                color: var(--description-foreground);
                margin-bottom: 4px;
            }

            .pipeline-section {
                margin-bottom: 16px;
                padding: 12px 0;
                border-top: 1px solid var(--border-color);
                border-bottom: 1px solid var(--border-color);
            }

            .actions {
                display: flex;
                gap: 10px;
                margin-top: 16px;
            }

            .action-btn {
                flex: 1;
                padding: 10px;
                font-size: 12px;
                font-weight: 600;
                border-radius: 6px;
            }

            .action-btn-primary {
                background: var(--accent-primary);
                color: white;
            }

            .action-btn-primary:hover {
                opacity: 0.9;
            }

            .action-btn-secondary {
                background: var(--border-color);
                color: var(--foreground);
            }

            .action-btn-secondary:hover {
                background: rgba(255, 255, 255, 0.15);
            }

            .artifacts-section {
                margin-top: 16px;
                padding-top: 12px;
                border-top: 1px solid var(--border-color);
            }

            .artifacts-header {
                font-size: 10px;
                font-weight: 600;
                color: var(--description-foreground, #858585);
                text-transform: uppercase;
                letter-spacing: 0.5px;
                margin-bottom: 8px;
            }

            .artifact-item {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 6px 8px;
                margin: 2px 0;
                border-radius: 4px;
                font-size: 13px;
                color: var(--foreground, #cccccc);
                cursor: pointer;
                transition: background 0.1s;
            }

            .artifact-item:hover {
                background: var(--vscode-input-background, #3c3c3c);
            }

            .artifact-icon {
                font-size: 14px;
                flex-shrink: 0;
            }

            .artifact-name {
                flex: 1;
                min-width: 0;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }

            .artifact-type {
                font-size: 10px;
                padding: 2px 6px;
                border-radius: 4px;
                background: var(--vscode-input-background, #3c3c3c);
                color: var(--description-foreground, #858585);
                text-transform: uppercase;
            }

            .no-artifacts {
                font-size: 12px;
                color: var(--description-foreground, #858585);
                font-style: italic;
                padding: 8px 0;
            }
        `
  ];
  __decorateClass([
    n4({ type: Object })
  ], FocusCard.prototype, "bolt", 2);
  __decorateClass([
    n4({ type: Boolean })
  ], FocusCard.prototype, "expanded", 2);
  FocusCard = __decorateClass([
    t3("focus-card")
  ], FocusCard);

  // src/webview/components/bolts/focus-section.ts
  var FocusSection = class extends BaseElement {
    constructor() {
      super(...arguments);
      this.bolts = [];
      this._expandedBolts = /* @__PURE__ */ new Set();
    }
    render() {
      return b2`
            <div class="label">
                <span class="label-icon">🎯</span>
                Current Focus
            </div>
            ${this.bolts.length > 0 ? b2`
                    <div class="bolts-list">
                        ${this.bolts.map((bolt) => b2`
                            <focus-card
                                .bolt=${bolt}
                                .expanded=${this._expandedBolts.has(bolt.id)}
                                @toggle-expand=${(e7) => this._handleToggleExpand(bolt.id, e7)}>
                            </focus-card>
                        `)}
                    </div>
                ` : b2`
                    <div class="empty-state">
                        <span class="empty-state-icon">🚀</span>
                        <div class="empty-state-text">No active bolt</div>
                        <div class="empty-state-hint">
                            run <code @click=${this._copyCommand}>/specsmd-construction-agent</code> to start
                        </div>
                    </div>
                `}
        `;
    }
    _handleToggleExpand(boltId, e7) {
      e7.stopPropagation();
      const newExpanded = new Set(this._expandedBolts);
      if (newExpanded.has(boltId)) {
        newExpanded.delete(boltId);
      } else {
        newExpanded.add(boltId);
      }
      this._expandedBolts = newExpanded;
      this.dispatchEvent(new CustomEvent("toggle-focus", {
        detail: { boltId, expanded: newExpanded.has(boltId) },
        bubbles: true,
        composed: true
      }));
    }
    _copyCommand() {
      const command = "/specsmd-construction-agent";
      navigator.clipboard.writeText(command).then(() => {
        this.dispatchEvent(new CustomEvent("copy-command", {
          detail: { command },
          bubbles: true,
          composed: true
        }));
      });
    }
  };
  FocusSection.styles = [
    ...BaseElement.baseStyles,
    i`
            :host {
                display: block;
                padding: 16px;
                background: var(--vscode-sideBar-background, #252526);
            }

            .label {
                display: flex;
                align-items: center;
                gap: 6px;
                font-size: 11px;
                font-weight: 600;
                color: var(--description-foreground, #858585);
                text-transform: uppercase;
                letter-spacing: 0.8px;
                margin-bottom: 12px;
            }

            .label-icon {
                font-size: 14px;
            }

            .empty-state {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                gap: 10px;
                padding: 32px 16px;
                text-align: center;
                color: var(--description-foreground, #858585);
            }

            .empty-state-icon {
                font-size: 32px;
                margin-bottom: 4px;
            }

            .empty-state-text {
                font-size: 13px;
                line-height: 1.5;
            }

            .empty-state code {
                background: var(--vscode-input-background, #3c3c3c);
                padding: 4px 10px;
                border-radius: 4px;
                font-family: var(--vscode-editor-font-family, monospace);
                font-size: 11px;
                cursor: pointer;
                transition: background 0.15s;
            }

            .empty-state code:hover {
                background: var(--vscode-button-background, #0e639c);
                color: var(--vscode-button-foreground, #ffffff);
            }

            .empty-state-hint {
                font-size: 12px;
                color: var(--description-foreground, #858585);
            }

            .bolts-list {
                display: flex;
                flex-direction: column;
                gap: 12px;
            }
        `
  ];
  __decorateClass([
    n4({ type: Array })
  ], FocusSection.prototype, "bolts", 2);
  __decorateClass([
    r5()
  ], FocusSection.prototype, "_expandedBolts", 2);
  FocusSection = __decorateClass([
    t3("focus-section")
  ], FocusSection);

  // src/webview/components/bolts/queue-item.ts
  var QueueItem = class extends BaseElement {
    constructor() {
      super(...arguments);
      this.priority = 1;
      this._expanded = false;
    }
    render() {
      if (!this.bolt) {
        return b2``;
      }
      const hasStories = this.bolt.stories && this.bolt.stories.length > 0;
      return b2`
            <div class="header" @click=${this._toggleExpand}>
                ${this.bolt.isBlocked ? b2`<div class="lock">🔒</div>` : b2`<div class="priority">${this.priority}</div>`}
                <div class="info">
                    <div class="name">
                        ${this.bolt.name}
                        ${hasStories ? b2`
                            <span class="expand-icon ${this._expanded ? "expanded" : ""}">▶</span>
                        ` : ""}
                    </div>
                    <div class="meta">
                        ${this.bolt.type} | ${this.bolt.storiesCount} ${this.bolt.storiesCount === 1 ? "story" : "stories"}${this.bolt.unblocksCount > 0 ? ` | Enables ${this.bolt.unblocksCount}` : ""}
                    </div>
                    ${this.bolt.isBlocked ? b2`
                        <div class="blocked-info">Waiting: ${this.bolt.blockedBy.join(", ")}</div>
                    ` : ""}
                </div>
                <button class="bolt-open-btn" @click=${this._handleOpenBolt} title="Open bolt.md">🔍</button>
                <div class="actions">
                    ${this.bolt.isBlocked ? b2`<button class="start-btn" disabled>Blocked</button>` : b2`<button class="start-btn" @click=${this._handleStart}>Start ▶</button>`}
                </div>
            </div>
            ${hasStories ? b2`
                <div class="stories-section ${this._expanded ? "expanded" : ""}">
                    <div class="stories-header">Stories</div>
                    ${this.bolt.stories.map((story) => b2`
                        <div class="story-item">
                            <div class="story-status ${story.status}"></div>
                            <span class="story-name">${story.name}</span>
                            ${story.path ? b2`
                                <button
                                    class="open-btn"
                                    @click=${(e7) => this._handleOpenFile(e7, story.path)}
                                    title="Open story file"
                                >🔍</button>
                            ` : ""}
                        </div>
                    `)}
                </div>
            ` : ""}
        `;
    }
    _toggleExpand() {
      if (this.bolt.stories && this.bolt.stories.length > 0) {
        this._expanded = !this._expanded;
      }
    }
    _handleStart(e7) {
      e7.stopPropagation();
      this.dispatchEvent(new CustomEvent("start-bolt", {
        detail: { boltId: this.bolt.id },
        bubbles: true,
        composed: true
      }));
    }
    _handleOpenFile(e7, path) {
      e7.stopPropagation();
      this.dispatchEvent(new CustomEvent("open-file", {
        detail: { path },
        bubbles: true,
        composed: true
      }));
    }
    _handleOpenBolt(e7) {
      e7.stopPropagation();
      this.dispatchEvent(new CustomEvent("open-bolt", {
        detail: { boltId: this.bolt.id },
        bubbles: true,
        composed: true
      }));
    }
  };
  QueueItem.styles = [
    ...BaseElement.baseStyles,
    i`
            :host {
                display: block;
                border-radius: 8px;
                background: var(--vscode-editor-background, #1e1e1e);
                border-left: 4px solid #f97316;
                overflow: hidden;
            }

            :host(:hover) {
                background: var(--vscode-list-hoverBackground, #2a2d2e);
            }

            .header {
                display: flex;
                align-items: flex-start;
                gap: 12px;
                padding: 14px 16px;
                cursor: pointer;
            }

            .priority {
                width: 24px;
                height: 24px;
                border-radius: 4px;
                background: var(--vscode-input-background, #3c3c3c);
                color: var(--foreground, #cccccc);
                font-size: 12px;
                font-weight: 600;
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
            }

            .lock {
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 16px;
                flex-shrink: 0;
            }

            .info {
                flex: 1;
                min-width: 0;
            }

            .name {
                font-size: 14px;
                font-weight: 600;
                color: var(--foreground, #cccccc);
                margin-bottom: 4px;
                line-height: 1.3;
            }

            .expand-icon {
                font-size: 10px;
                color: var(--description-foreground, #858585);
                margin-left: 6px;
                transition: transform 0.15s;
                display: inline-block;
            }

            .expand-icon.expanded {
                transform: rotate(90deg);
            }

            .meta {
                font-size: 12px;
                color: var(--description-foreground, #858585);
                line-height: 1.4;
            }

            .blocked-info {
                font-size: 12px;
                color: #f97316;
                margin-top: 6px;
                line-height: 1.4;
            }

            .actions {
                flex-shrink: 0;
                padding-top: 2px;
            }

            .start-btn {
                padding: 8px 16px;
                font-size: 12px;
                font-weight: 600;
                border-radius: 6px;
                background: transparent;
                color: var(--foreground, #cccccc);
                border: 1px solid var(--vscode-input-border, #454545);
                cursor: pointer;
                transition: all 0.15s;
            }

            .start-btn:hover:not(:disabled) {
                background: var(--vscode-input-background, #3c3c3c);
                border-color: #f97316;
                color: #f97316;
            }

            .start-btn:disabled {
                background: transparent;
                color: var(--description-foreground, #666666);
                border-color: transparent;
                cursor: default;
                font-style: italic;
            }

            .stories-section {
                display: none;
                padding: 0 16px 14px 52px;
                border-top: 1px solid var(--vscode-input-border, #3c3c3c);
            }

            .stories-section.expanded {
                display: block;
            }

            .stories-header {
                font-size: 10px;
                font-weight: 600;
                color: var(--description-foreground, #858585);
                text-transform: uppercase;
                letter-spacing: 0.5px;
                margin: 12px 0 10px 0;
            }

            .story-item {
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 8px 0;
                font-size: 13px;
                color: var(--foreground, #cccccc);
            }

            .story-status {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                flex-shrink: 0;
            }

            .story-status.complete {
                background: var(--status-complete, #22c55e);
            }

            .story-status.active {
                background: var(--status-active, #f97316);
            }

            .story-status.pending {
                background: var(--border-color, #3c3c3c);
            }

            .story-name {
                flex: 1;
                min-width: 0;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }

            .open-btn {
                background: none;
                border: none;
                color: var(--description-foreground);
                cursor: pointer;
                padding: 2px 4px;
                font-size: 11px;
                border-radius: 3px;
                opacity: 0;
                transition: all 0.15s;
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
            }

            .story-item:hover .open-btn {
                opacity: 0.7;
            }

            .open-btn:hover {
                opacity: 1 !important;
                background: var(--vscode-list-hoverBackground);
                color: var(--foreground);
            }

            .bolt-open-btn {
                background: none;
                border: none;
                color: var(--description-foreground);
                cursor: pointer;
                padding: 4px 8px;
                font-size: 14px;
                border-radius: 4px;
                opacity: 0;
                transition: all 0.15s;
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
            }

            .header:hover .bolt-open-btn {
                opacity: 0.7;
            }

            .bolt-open-btn:hover {
                opacity: 1 !important;
                background: var(--vscode-list-hoverBackground);
                color: var(--foreground);
            }
        `
  ];
  __decorateClass([
    n4({ type: Object })
  ], QueueItem.prototype, "bolt", 2);
  __decorateClass([
    n4({ type: Number })
  ], QueueItem.prototype, "priority", 2);
  __decorateClass([
    r5()
  ], QueueItem.prototype, "_expanded", 2);
  QueueItem = __decorateClass([
    t3("queue-item")
  ], QueueItem);

  // src/webview/components/bolts/queue-section.ts
  var DEFAULT_VISIBLE_COUNT = 5;
  var QueueSection = class extends BaseElement {
    constructor() {
      super(...arguments);
      this.bolts = [];
      this._expanded = false;
    }
    /**
     * Gets the bolts to display based on expanded state.
     */
    get _visibleBolts() {
      if (this._expanded) {
        return this.bolts;
      }
      return this.bolts.slice(0, DEFAULT_VISIBLE_COUNT);
    }
    /**
     * Whether to show the toggle button.
     */
    get _showToggle() {
      return this.bolts.length > DEFAULT_VISIBLE_COUNT;
    }
    /**
     * Number of hidden bolts when collapsed.
     */
    get _hiddenCount() {
      return this.bolts.length - DEFAULT_VISIBLE_COUNT;
    }
    /**
     * Toggles expanded state.
     */
    _handleToggle() {
      this._expanded = !this._expanded;
    }
    render() {
      return b2`
            <div class="header">
                <span class="title">Up Next</span>
                <span class="count">${this.bolts.length} bolts</span>
            </div>
            <div class="list">
                ${this.bolts.length > 0 ? this._visibleBolts.map((bolt, idx) => b2`
                        <queue-item
                            .bolt=${bolt}
                            .priority=${idx + 1}
                            class=${bolt.isBlocked ? "blocked" : ""}>
                        </queue-item>
                    `) : b2`<div class="empty-state">Queue empty</div>`}
            </div>
            ${this._showToggle ? b2`
                <button
                    type="button"
                    class="toggle-btn ${this._expanded ? "expanded" : ""}"
                    @click=${this._handleToggle}>
                    <span class="toggle-icon"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 10.5L3 5.5h10L8 10.5z"/></svg></span>
                    ${this._expanded ? "Show Less" : `Show ${this._hiddenCount} More`}
                </button>
            ` : ""}
        `;
    }
  };
  QueueSection.styles = [
    ...BaseElement.baseStyles,
    i`
            :host {
                display: block;
                padding: 20px 16px;
                border-top: 1px solid var(--vscode-input-border, #3c3c3c);
            }

            .header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 16px;
            }

            .title {
                font-size: 11px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.8px;
                color: var(--description-foreground, #858585);
            }

            .count {
                font-size: 11px;
                font-weight: 500;
                padding: 4px 12px;
                border-radius: 12px;
                background: var(--vscode-input-background, #3c3c3c);
                color: var(--foreground, #cccccc);
            }

            .list {
                display: flex;
                flex-direction: column;
                gap: 12px;
            }

            .empty-state {
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 24px;
                color: var(--description-foreground, #858585);
                font-size: 12px;
            }

            .toggle-btn {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 6px;
                width: 100%;
                padding: 8px 12px;
                margin-top: 12px;
                background: transparent;
                border: 1px dashed var(--vscode-input-border, #3c3c3c);
                border-radius: 6px;
                color: var(--description-foreground, #858585);
                font-size: 11px;
                cursor: pointer;
                transition: all 0.15s ease;
            }

            .toggle-btn:hover {
                background: var(--vscode-input-background, #3c3c3c);
                border-color: var(--foreground, #cccccc);
                color: var(--foreground, #cccccc);
            }

            .toggle-icon {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 12px;
                height: 12px;
                transition: transform 0.15s ease;
            }

            .toggle-icon svg {
                width: 10px;
                height: 10px;
                fill: currentColor;
            }

            .toggle-btn.expanded .toggle-icon {
                transform: rotate(180deg);
            }
        `
  ];
  __decorateClass([
    n4({ type: Array })
  ], QueueSection.prototype, "bolts", 2);
  __decorateClass([
    r5()
  ], QueueSection.prototype, "_expanded", 2);
  QueueSection = __decorateClass([
    t3("queue-section")
  ], QueueSection);

  // src/webview/components/bolts/completion-item.ts
  var CompletionItem = class extends BaseElement {
    constructor() {
      super(...arguments);
      this._expanded = false;
    }
    render() {
      if (!this.bolt) {
        return b2``;
      }
      const hasFiles = this.bolt.files && this.bolt.files.length > 0;
      const hasConstructionLog = !!this.bolt.constructionLogPath;
      const hasExpandableContent = hasFiles || hasConstructionLog;
      return b2`
            <div class="header" @click=${this._toggleExpand}>
                <div class="check">&#10003;</div>
                <div class="info">
                    <div class="name">
                        ${this.bolt.name}
                        ${hasExpandableContent ? b2`
                            <span class="expand-icon ${this._expanded ? "expanded" : ""}">&#9654;</span>
                        ` : ""}
                    </div>
                    <div class="meta">
                        ${this.bolt.type} | <span class="time">${this.bolt.relativeTime}</span>
                    </div>
                </div>
                <button class="open-btn" @click=${this._handleOpenBolt} title="Open bolt.md">🔍</button>
            </div>
            ${hasExpandableContent ? b2`
                <div class="files-section ${this._expanded ? "expanded" : ""}">
                    ${hasFiles ? b2`
                        <div class="files-header">Artifacts</div>
                        ${this.bolt.files.map((file) => b2`
                            <div class="file-item" @click=${(e7) => this._handleFileClick(e7, file.path)}>
                                <span class="file-icon">${this._getFileIcon(file.type)}</span>
                                <span class="file-name">${file.name}</span>
                                <span class="file-type">${file.type}</span>
                            </div>
                        `)}
                    ` : ""}
                    ${hasConstructionLog ? b2`
                        <div class="files-header">Unit Artifacts</div>
                        <div class="file-item" @click=${(e7) => this._handleFileClick(e7, this.bolt.constructionLogPath)}>
                            <span class="file-icon">📋</span>
                            <span class="file-name">construction-log.md</span>
                            <span class="file-type">construction-log</span>
                        </div>
                    ` : ""}
                </div>
            ` : b2`
                <div class="files-section ${this._expanded ? "expanded" : ""}">
                    <div class="no-files">No artifact files found</div>
                </div>
            `}
        `;
    }
    _getFileIcon(type) {
      switch (type) {
        case "walkthrough":
          return "\u{1F4D6}";
        // open book
        case "test-report":
          return "\u{1F4CB}";
        // clipboard
        case "plan":
          return "\u{1F4C4}";
        // page
        case "design":
          return "\u{1F527}";
        // wrench
        default:
          return "\u{1F4C4}";
      }
    }
    _toggleExpand() {
      this._expanded = !this._expanded;
    }
    _handleFileClick(e7, path) {
      e7.stopPropagation();
      this.dispatchEvent(new CustomEvent("open-file", {
        detail: { path },
        bubbles: true,
        composed: true
      }));
    }
    _handleOpenBolt(e7) {
      e7.stopPropagation();
      this.dispatchEvent(new CustomEvent("open-bolt", {
        detail: { boltId: this.bolt.id },
        bubbles: true,
        composed: true
      }));
    }
  };
  CompletionItem.styles = [
    ...BaseElement.baseStyles,
    i`
            :host {
                display: block;
                border-radius: 8px;
                background: var(--vscode-editor-background, #1e1e1e);
                border-left: 4px solid var(--status-complete, #22c55e);
                overflow: hidden;
            }

            :host(:hover) {
                background: var(--vscode-list-hoverBackground, #2a2d2e);
            }

            .header {
                display: flex;
                align-items: flex-start;
                gap: 12px;
                padding: 12px 16px;
                cursor: pointer;
            }

            .check {
                width: 24px;
                height: 24px;
                border-radius: 50%;
                background: var(--status-complete, #22c55e);
                color: white;
                font-size: 14px;
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
            }

            .info {
                flex: 1;
                min-width: 0;
            }

            .name {
                font-size: 14px;
                font-weight: 600;
                color: var(--foreground, #cccccc);
                margin-bottom: 4px;
                line-height: 1.3;
            }

            .expand-icon {
                font-size: 10px;
                color: var(--description-foreground, #858585);
                margin-left: 6px;
                transition: transform 0.15s;
                display: inline-block;
            }

            .expand-icon.expanded {
                transform: rotate(90deg);
            }

            .meta {
                font-size: 12px;
                color: var(--description-foreground, #858585);
                line-height: 1.4;
            }

            .time {
                color: var(--status-complete, #22c55e);
            }

            .open-btn {
                background: none;
                border: none;
                color: var(--description-foreground);
                cursor: pointer;
                padding: 4px 8px;
                font-size: 14px;
                border-radius: 4px;
                opacity: 0;
                transition: all 0.15s;
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
            }

            .header:hover .open-btn {
                opacity: 0.7;
            }

            .open-btn:hover {
                opacity: 1 !important;
                background: var(--vscode-list-hoverBackground);
                color: var(--foreground);
            }

            .files-section {
                display: none;
                padding: 0 16px 12px 52px;
                border-top: 1px solid var(--vscode-input-border, #3c3c3c);
            }

            .files-section.expanded {
                display: block;
            }

            .files-header {
                font-size: 10px;
                font-weight: 600;
                color: var(--description-foreground, #858585);
                text-transform: uppercase;
                letter-spacing: 0.5px;
                margin: 10px 0 8px 0;
            }

            .file-item {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 6px 8px;
                margin: 2px 0;
                border-radius: 4px;
                font-size: 13px;
                color: var(--foreground, #cccccc);
                cursor: pointer;
                transition: background 0.1s;
            }

            .file-item:hover {
                background: var(--vscode-input-background, #3c3c3c);
            }

            .file-icon {
                font-size: 14px;
                flex-shrink: 0;
            }

            .file-name {
                flex: 1;
                min-width: 0;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }

            .file-type {
                font-size: 10px;
                padding: 2px 6px;
                border-radius: 4px;
                background: var(--vscode-input-background, #3c3c3c);
                color: var(--description-foreground, #858585);
                text-transform: uppercase;
            }

            .no-files {
                font-size: 12px;
                color: var(--description-foreground, #858585);
                font-style: italic;
                padding: 8px 0;
            }
        `
  ];
  __decorateClass([
    n4({ type: Object })
  ], CompletionItem.prototype, "bolt", 2);
  __decorateClass([
    r5()
  ], CompletionItem.prototype, "_expanded", 2);
  CompletionItem = __decorateClass([
    t3("completion-item")
  ], CompletionItem);

  // src/webview/components/bolts/completions-section.ts
  var DEFAULT_VISIBLE_COUNT2 = 3;
  var CompletionsSection = class extends BaseElement {
    constructor() {
      super(...arguments);
      this.bolts = [];
      this._expanded = false;
    }
    /**
     * Gets the completions to display based on expanded state.
     */
    get _visibleBolts() {
      if (this._expanded) {
        return this.bolts;
      }
      return this.bolts.slice(0, DEFAULT_VISIBLE_COUNT2);
    }
    /**
     * Whether to show the toggle button.
     */
    get _showToggle() {
      return this.bolts.length > DEFAULT_VISIBLE_COUNT2;
    }
    /**
     * Number of hidden completions when collapsed.
     */
    get _hiddenCount() {
      return this.bolts.length - DEFAULT_VISIBLE_COUNT2;
    }
    /**
     * Toggles expanded state.
     */
    _handleToggle() {
      this._expanded = !this._expanded;
    }
    render() {
      if (!this.bolts || this.bolts.length === 0) {
        return b2``;
      }
      return b2`
            <div class="header">
                <span class="title">Recent Completions</span>
                <span class="count">${this.bolts.length} done</span>
            </div>
            <div class="list">
                ${this._visibleBolts.map((bolt) => b2`
                    <completion-item .bolt=${bolt}></completion-item>
                `)}
            </div>
            ${this._showToggle ? b2`
                <button
                    type="button"
                    class="toggle-btn ${this._expanded ? "expanded" : ""}"
                    @click=${this._handleToggle}>
                    <span class="toggle-icon"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 10.5L3 5.5h10L8 10.5z"/></svg></span>
                    ${this._expanded ? "Show Less" : `Show ${this._hiddenCount} More`}
                </button>
            ` : ""}
        `;
    }
  };
  CompletionsSection.styles = [
    ...BaseElement.baseStyles,
    i`
            :host {
                display: block;
                padding: 20px 16px;
                border-top: 1px solid var(--vscode-input-border, #3c3c3c);
            }

            .header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 16px;
            }

            .title {
                font-size: 11px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.8px;
                color: var(--description-foreground, #858585);
            }

            .count {
                font-size: 11px;
                font-weight: 500;
                padding: 4px 12px;
                border-radius: 12px;
                background: var(--status-complete, #22c55e);
                color: white;
            }

            .list {
                display: flex;
                flex-direction: column;
                gap: 12px;
            }

            .empty-state {
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 24px;
                color: var(--description-foreground, #858585);
                font-size: 12px;
            }

            .toggle-btn {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 6px;
                width: 100%;
                padding: 8px 12px;
                margin-top: 12px;
                background: transparent;
                border: 1px dashed var(--vscode-input-border, #3c3c3c);
                border-radius: 6px;
                color: var(--description-foreground, #858585);
                font-size: 11px;
                cursor: pointer;
                transition: all 0.15s ease;
            }

            .toggle-btn:hover {
                background: var(--vscode-input-background, #3c3c3c);
                border-color: var(--foreground, #cccccc);
                color: var(--foreground, #cccccc);
            }

            .toggle-icon {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 12px;
                height: 12px;
                transition: transform 0.15s ease;
            }

            .toggle-icon svg {
                width: 10px;
                height: 10px;
                fill: currentColor;
            }

            .toggle-btn.expanded .toggle-icon {
                transform: rotate(180deg);
            }
        `
  ];
  __decorateClass([
    n4({ type: Array })
  ], CompletionsSection.prototype, "bolts", 2);
  __decorateClass([
    r5()
  ], CompletionsSection.prototype, "_expanded", 2);
  CompletionsSection = __decorateClass([
    t3("completions-section")
  ], CompletionsSection);

  // src/webview/components/bolts/activity-item.ts
  var ActivityItem = class extends BaseElement {
    render() {
      if (!this.event) {
        return b2``;
      }
      return b2`
            <div class="icon ${this.event.type}">${this._getIcon()}</div>
            <div class="content">
                <div class="text">${o6(this.event.text)}</div>
                <div class="meta">
                    <span class="target">${this.event.target}</span>
                    <span class="tag">${this.event.tag}</span>
                </div>
            </div>
            <span class="time" title="${this.event.exactTime}">${this.event.relativeTime}</span>
            ${this.event.path ? b2`
                <button
                    class="open-btn"
                    @click=${this._handleOpenFile}
                    title="Open file">
                    🔍
                </button>
            ` : ""}
        `;
    }
    _getIcon() {
      switch (this.event.type) {
        case "bolt-created":
          return "+";
        case "bolt-start":
          return "\u25B6";
        case "stage-complete":
          return "\u2713";
        case "bolt-complete":
          return "\u2714";
        default:
          return "\u2022";
      }
    }
    _handleOpenFile(e7) {
      e7.stopPropagation();
      if (this.event.path) {
        this.dispatchEvent(new CustomEvent("open-file", {
          detail: { path: this.event.path },
          bubbles: true,
          composed: true
        }));
      }
    }
  };
  ActivityItem.styles = [
    ...BaseElement.baseStyles,
    i`
            :host {
                display: flex;
                align-items: flex-start;
                gap: 12px;
                padding: 12px 16px;
                cursor: pointer;
            }

            :host(:hover) {
                background: var(--vscode-list-hoverBackground, #2a2d2e);
            }

            .icon {
                width: 26px;
                height: 26px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 14px;
                font-weight: 600;
                flex-shrink: 0;
                background: rgba(34, 197, 94, 0.15);
                color: #22c55e;
            }

            .icon.bolt-created {
                background: rgba(34, 197, 94, 0.15);
                color: #22c55e;
            }

            .icon.bolt-start {
                background: rgba(249, 115, 22, 0.15);
                color: #f97316;
            }

            .icon.stage-complete,
            .icon.bolt-complete {
                background: rgba(34, 197, 94, 0.15);
                color: #22c55e;
            }

            .content {
                flex: 1;
                min-width: 0;
            }

            .text {
                font-size: 13px;
                color: var(--foreground, #cccccc);
                line-height: 1.5;
                margin-bottom: 4px;
            }

            .text strong {
                color: #f97316;
                font-weight: 600;
            }

            .meta {
                display: flex;
                align-items: center;
                gap: 10px;
                font-size: 11px;
                color: var(--description-foreground, #858585);
            }

            .target {
                font-weight: 500;
            }

            .tag {
                text-transform: uppercase;
                font-size: 10px;
                font-weight: 600;
                padding: 2px 6px;
                background: var(--vscode-input-background, #3c3c3c);
                border-radius: 3px;
            }

            .time {
                font-size: 12px;
                color: var(--description-foreground, #858585);
                white-space: nowrap;
                flex-shrink: 0;
            }

            .open-btn {
                opacity: 0.4;
                padding: 8px;
                border-radius: 6px;
                font-size: 16px;
                transition: opacity 0.15s;
                flex-shrink: 0;
                background: transparent;
                border: none;
                cursor: pointer;
                color: var(--foreground, #cccccc);
            }

            :host(:hover) .open-btn {
                opacity: 0.8;
            }

            .open-btn:hover {
                opacity: 1;
                background: var(--vscode-input-background, #3c3c3c);
            }
        `
  ];
  __decorateClass([
    n4({ type: Object })
  ], ActivityItem.prototype, "event", 2);
  ActivityItem = __decorateClass([
    t3("activity-item")
  ], ActivityItem);

  // src/webview/components/bolts/activity-feed.ts
  var ActivityFeed = class extends BaseElement {
    constructor() {
      super(...arguments);
      this.events = [];
      this.filter = "all";
      this.height = 200;
    }
    render() {
      const filtered = this._filterEvents();
      const listHeight = this.height - 52;
      return b2`
            <div class="resize-handle" @mousedown=${this._startResize}></div>
            <div class="header">
                <div class="title">
                    <span class="title-icon">🕐</span>
                    Recent Activity
                </div>
                <div class="filters">
                    ${["all", "stages", "bolts"].map((f3) => b2`
                        <button
                            class="filter-btn ${this.filter === f3 ? "active" : ""}"
                            @click=${() => this._setFilter(f3)}>
                            ${f3.charAt(0).toUpperCase() + f3.slice(1)}
                        </button>
                    `)}
                </div>
            </div>
            <div class="list" style="height: ${listHeight}px;">
                ${filtered.length > 0 ? filtered.slice(0, 10).map((event) => b2`
                        <activity-item .event=${event}></activity-item>
                    `) : b2`<div class="empty-state">No recent activity</div>`}
            </div>
        `;
    }
    _filterEvents() {
      if (this.filter === "all") {
        return this.events;
      }
      return this.events.filter((e7) => {
        if (this.filter === "stages") {
          return e7.tag === "stage";
        }
        return e7.tag === "bolt";
      });
    }
    _setFilter(filter) {
      this.dispatchEvent(new CustomEvent("filter-change", {
        detail: { filter },
        bubbles: true,
        composed: true
      }));
    }
    _startResize(e7) {
      e7.preventDefault();
      const startY = e7.clientY;
      const startHeight = this.height;
      const onMouseMove = (moveEvent) => {
        const delta = startY - moveEvent.clientY;
        const newHeight = Math.max(120, Math.min(500, startHeight + delta));
        this.dispatchEvent(new CustomEvent("resize", {
          detail: { height: newHeight },
          bubbles: true,
          composed: true
        }));
      };
      const onMouseUp = () => {
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
      };
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    }
  };
  ActivityFeed.styles = [
    ...BaseElement.baseStyles,
    i`
            :host {
                display: block;
                border-top: 1px solid var(--vscode-input-border, #3c3c3c);
                position: relative;
            }

            .resize-handle {
                position: absolute;
                top: 0;
                left: 50%;
                transform: translateX(-50%);
                width: 48px;
                height: 6px;
                cursor: ns-resize;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-top: -3px;
            }

            .resize-handle::after {
                content: '';
                width: 32px;
                height: 4px;
                background: var(--vscode-input-border, #3c3c3c);
                border-radius: 2px;
            }

            .resize-handle:hover::after {
                background: #f97316;
            }

            .header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 14px 16px;
            }

            .title {
                display: flex;
                align-items: center;
                gap: 6px;
                font-size: 11px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.8px;
                color: var(--description-foreground, #858585);
            }

            .title-icon {
                font-size: 14px;
            }

            .filters {
                display: flex;
                gap: 6px;
            }

            .filter-btn {
                padding: 5px 12px;
                font-size: 11px;
                font-weight: 500;
                border-radius: 14px;
                color: var(--description-foreground, #858585);
                background: transparent;
                border: 1px solid var(--vscode-input-border, #3c3c3c);
                cursor: pointer;
                transition: all 0.15s;
            }

            .filter-btn:hover {
                color: var(--foreground, #cccccc);
                border-color: var(--foreground, #cccccc);
            }

            .filter-btn.active {
                background: #f97316;
                color: white;
                border-color: #f97316;
            }

            .list {
                overflow-y: auto;
            }

            .empty-state {
                display: flex;
                align-items: center;
                justify-content: center;
                height: 80px;
                color: var(--description-foreground, #858585);
                font-size: 12px;
            }
        `
  ];
  __decorateClass([
    n4({ type: Array })
  ], ActivityFeed.prototype, "events", 2);
  __decorateClass([
    n4({ type: String })
  ], ActivityFeed.prototype, "filter", 2);
  __decorateClass([
    n4({ type: Number })
  ], ActivityFeed.prototype, "height", 2);
  ActivityFeed = __decorateClass([
    t3("activity-feed")
  ], ActivityFeed);

  // src/webview/components/bolts/bolts-view.ts
  var BoltsView = class extends BaseElement {
    render() {
      if (!this.data) {
        return b2`<div>Loading...</div>`;
      }
      return b2`
            <current-intent
                .intent=${this.data.currentIntent}
                .context=${this.data.currentIntentContext}
                .stats=${this.data.stats}>
            </current-intent>

            <div class="content">
                <focus-section
                    .bolts=${this.data.activeBolts}
                    @toggle-focus=${this._handleToggleFocus}
                    @continue-bolt=${this._handleContinueBolt}
                    @view-files=${this._handleViewFiles}
                    @open-bolt=${this._handleOpenBolt}
                    @open-file=${this._handleOpenFile}>
                </focus-section>

                <queue-section
                    .bolts=${this.data.upNextQueue}
                    @start-bolt=${this._handleStartBolt}
                    @open-file=${this._handleOpenFile}
                    @open-bolt=${this._handleOpenBolt}>
                </queue-section>

                <completions-section
                    .bolts=${this.data.completedBolts}
                    @open-file=${this._handleOpenFile}
                    @open-bolt=${this._handleOpenBolt}>
                </completions-section>
            </div>

            <activity-feed
                .events=${this.data.activityEvents}
                .filter=${this.data.activityFilter}
                .height=${this.data.activityHeight}
                @filter-change=${this._handleFilterChange}
                @resize=${this._handleResize}
                @open-file=${this._handleOpenFile}>
            </activity-feed>
        `;
    }
    _handleToggleFocus(e7) {
      e7.stopPropagation();
      this.dispatchEvent(new CustomEvent("toggle-focus", {
        detail: e7.detail,
        bubbles: true,
        composed: true
      }));
    }
    _handleFilterChange(e7) {
      e7.stopPropagation();
      this.dispatchEvent(new CustomEvent("filter-change", {
        detail: e7.detail,
        bubbles: true,
        composed: true
      }));
    }
    _handleResize(e7) {
      e7.stopPropagation();
      this.dispatchEvent(new CustomEvent("resize", {
        detail: e7.detail,
        bubbles: true,
        composed: true
      }));
    }
    _handleStartBolt(e7) {
      e7.stopPropagation();
      this.dispatchEvent(new CustomEvent("start-bolt", {
        detail: e7.detail,
        bubbles: true,
        composed: true
      }));
    }
    _handleOpenFile(e7) {
      e7.stopPropagation();
      this.dispatchEvent(new CustomEvent("open-file", {
        detail: e7.detail,
        bubbles: true,
        composed: true
      }));
    }
    _handleContinueBolt(e7) {
      e7.stopPropagation();
      this.dispatchEvent(new CustomEvent("continue-bolt", {
        detail: e7.detail,
        bubbles: true,
        composed: true
      }));
    }
    _handleViewFiles(e7) {
      e7.stopPropagation();
      this.dispatchEvent(new CustomEvent("view-files", {
        detail: e7.detail,
        bubbles: true,
        composed: true
      }));
    }
    _handleOpenBolt(e7) {
      e7.stopPropagation();
      this.dispatchEvent(new CustomEvent("open-bolt", {
        detail: e7.detail,
        bubbles: true,
        composed: true
      }));
    }
  };
  BoltsView.styles = [
    ...BaseElement.baseStyles,
    i`
            :host {
                display: flex;
                flex-direction: column;
                height: 100%;
                overflow: hidden;
            }

            .content {
                flex: 1;
                overflow-y: auto;
            }

            activity-feed {
                flex-shrink: 0;
            }
        `
  ];
  __decorateClass([
    n4({ type: Object })
  ], BoltsView.prototype, "data", 2);
  BoltsView = __decorateClass([
    t3("bolts-view")
  ], BoltsView);

  // src/webview/components/shared/flow-switcher.ts
  var FlowSwitcher = class extends i4 {
    constructor() {
      super(...arguments);
      this.activeFlow = null;
      this.availableFlows = [];
      /**
       * Handle click - dispatch event to trigger VS Code quick pick.
       */
      this._handleClick = () => {
        this.dispatchEvent(new CustomEvent("flow-switch", {
          detail: {},
          bubbles: true,
          composed: true
        }));
      };
    }
    render() {
      const activeFlow = this.activeFlow || this.availableFlows[0];
      const flowCount = this.availableFlows.length;
      const hasMultipleFlows = flowCount > 1;
      return b2`
            <div class="switcher-container">
                <button
                    class="switcher-button"
                    @click=${this._handleClick}
                    title="${hasMultipleFlows ? "Click to switch flow (Ctrl+Cmd+F)" : "Current flow"}"
                    ?disabled=${!hasMultipleFlows}
                >
                    <span class="flow-icon">${activeFlow?.icon || "\u{1F525}"}</span>
                    <span class="flow-info">
                        <span class="flow-name">${activeFlow?.displayName || "FIRE"}</span>
                        <span class="flow-hint">${flowCount > 0 ? `${flowCount} flow${flowCount > 1 ? "s" : ""} available` : "No flow detected"}</span>
                    </span>
                    ${hasMultipleFlows ? b2`<span class="switch-indicator">Switch</span>` : ""}
                </button>
            </div>
        `;
    }
  };
  FlowSwitcher.styles = i`
        :host {
            display: block;
            --switcher-bg: var(--vscode-sideBarSectionHeader-background, #252526);
            --switcher-border: var(--vscode-sideBarSectionHeader-border, #3c3c3c);
            --switcher-hover: var(--vscode-list-hoverBackground, #2a2d2e);
            --switcher-text: var(--vscode-foreground, #cccccc);
            --switcher-muted: var(--vscode-descriptionForeground, #8b8b8b);
        }

        .switcher-container {
            border-top: 1px solid var(--switcher-border);
            background: var(--switcher-bg);
        }

        .switcher-button {
            display: flex;
            align-items: center;
            gap: 8px;
            width: 100%;
            padding: 10px 12px;
            border: none;
            background: transparent;
            color: var(--switcher-text);
            cursor: pointer;
            font-family: var(--vscode-font-family);
            font-size: 11px;
            text-align: left;
            transition: background 0.15s ease;
        }

        .switcher-button:hover {
            background: var(--switcher-hover);
        }

        .switcher-button:focus {
            outline: none;
            background: var(--switcher-hover);
        }

        .switcher-button:active {
            background: var(--vscode-list-activeSelectionBackground, #094771);
        }

        .switcher-button:disabled {
            cursor: default;
        }

        .switcher-button:disabled:hover {
            background: transparent;
        }

        .flow-icon {
            font-size: 14px;
            flex-shrink: 0;
        }

        .flow-info {
            flex: 1;
            min-width: 0;
            display: flex;
            flex-direction: column;
        }

        .flow-name {
            font-weight: 500;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .flow-hint {
            font-size: 9px;
            color: var(--switcher-muted);
            margin-top: 2px;
        }

        .switch-indicator {
            font-size: 8px;
            color: var(--switcher-muted);
            padding: 2px 6px;
            background: var(--vscode-badge-background, #4d4d4d);
            border-radius: 3px;
        }

        /* Hide when only one flow */
        :host([hidden]) {
            display: none;
        }
    `;
  __decorateClass([
    n4({ type: Object })
  ], FlowSwitcher.prototype, "activeFlow", 2);
  __decorateClass([
    n4({ type: Array })
  ], FlowSwitcher.prototype, "availableFlows", 2);
  FlowSwitcher = __decorateClass([
    t3("flow-switcher")
  ], FlowSwitcher);

  // src/webview/components/fire/fire-view-tabs.ts
  var FIRE_TABS = [
    { id: "runs", label: "Runs", icon: "\u{1F525}" },
    { id: "intents", label: "Intents", icon: "\u{1F3AF}" },
    { id: "overview", label: "Overview", icon: "\u{1F4CA}" }
  ];
  var FireViewTabs = class extends BaseElement {
    constructor() {
      super(...arguments);
      this.activeTab = "runs";
    }
    render() {
      return b2`
            <div class="tabs">
                ${FIRE_TABS.map((tab) => b2`
                    <div
                        class="tab ${this.activeTab === tab.id ? "active" : ""}"
                        @click=${() => this._handleTabClick(tab.id)}
                    >
                        <span class="tab-icon">${tab.icon}</span>
                        <span>${tab.label}</span>
                    </div>
                `)}
            </div>
        `;
    }
    _handleTabClick(tabId) {
      if (tabId !== this.activeTab) {
        this.dispatchEvent(new CustomEvent("tab-change", {
          detail: { tab: tabId },
          bubbles: true,
          composed: true
        }));
      }
    }
  };
  FireViewTabs.styles = [
    ...BaseElement.baseStyles,
    i`
            :host {
                display: block;
                background: var(--editor-background);
                border-bottom: 1px solid var(--border-color);
            }

            .tabs {
                display: flex;
                align-items: center;
                padding: 0 8px;
            }

            .tab {
                display: flex;
                align-items: center;
                gap: 6px;
                padding: 10px 12px;
                font-size: 11px;
                font-weight: 500;
                color: var(--description-foreground);
                cursor: pointer;
                border-bottom: 2px solid transparent;
                transition: all 0.15s ease;
            }

            .tab:hover {
                color: var(--foreground);
                background: rgba(255, 255, 255, 0.03);
            }

            .tab.active {
                color: var(--status-active);
                border-bottom-color: var(--status-active);
            }

            .tab-icon {
                font-size: 12px;
            }
        `
  ];
  __decorateClass([
    n4({ type: String })
  ], FireViewTabs.prototype, "activeTab", 2);
  FireViewTabs = __decorateClass([
    t3("fire-view-tabs")
  ], FireViewTabs);

  // src/webview/components/fire/shared/fire-mode-badge.ts
  var FireModeBadge = class extends BaseElement {
    constructor() {
      super(...arguments);
      this.mode = "confirm";
    }
    render() {
      const icon = this._getIcon();
      const label = this._getLabel();
      return b2`
            <span class="badge ${this.mode}">
                <span class="icon">${icon}</span>
                <span>${label}</span>
            </span>
        `;
    }
    _getIcon() {
      switch (this.mode) {
        case "autopilot":
          return "\u{1F680}";
        case "confirm":
          return "\u270B";
        case "validate":
          return "\u{1F50D}";
        default:
          return "\u2022";
      }
    }
    _getLabel() {
      switch (this.mode) {
        case "autopilot":
          return "Auto";
        case "confirm":
          return "Confirm";
        case "validate":
          return "Validate";
        default:
          return this.mode;
      }
    }
  };
  FireModeBadge.styles = [
    ...BaseElement.baseStyles,
    i`
            :host {
                display: inline-flex;
            }

            .badge {
                display: inline-flex;
                align-items: center;
                gap: 4px;
                padding: 2px 6px;
                border-radius: 3px;
                font-size: 10px;
                font-weight: 500;
                text-transform: uppercase;
                letter-spacing: 0.3px;
            }

            .badge.autopilot {
                background: rgba(34, 197, 94, 0.15);
                color: #22c55e;
                border: 1px solid rgba(34, 197, 94, 0.3);
            }

            .badge.confirm {
                background: rgba(249, 115, 22, 0.15);
                color: #f97316;
                border: 1px solid rgba(249, 115, 22, 0.3);
            }

            .badge.validate {
                background: rgba(139, 92, 246, 0.15);
                color: #8b5cf6;
                border: 1px solid rgba(139, 92, 246, 0.3);
            }

            .icon {
                font-size: 10px;
            }
        `
  ];
  __decorateClass([
    n4({ type: String })
  ], FireModeBadge.prototype, "mode", 2);
  FireModeBadge = __decorateClass([
    t3("fire-mode-badge")
  ], FireModeBadge);

  // src/webview/components/fire/runs/fire-work-item.ts
  var FireWorkItem = class extends BaseElement {
    constructor() {
      super(...arguments);
      this.isCurrent = false;
    }
    render() {
      if (!this.item) return A;
      const statusIcon = this._getStatusIcon();
      const phases = this._computePhases();
      return b2`
            <div
                class="item ${this.isCurrent ? "current" : ""}"
                @click=${this._handleClick}
                title="${this.item.title || this.item.id}"
            >
                <div class="item-header">
                    <span class="status-icon ${this.item.status}">${statusIcon}</span>
                    <span class="name">${this.item.title || this.item.id}</span>
                    <fire-mode-badge mode=${this.item.mode}></fire-mode-badge>
                    ${this.isCurrent ? b2`<span class="current-indicator">current</span>` : A}
                    ${this.item.intentFilePath ? b2`
                        <span class="open-intent-btn" @click=${this._handleOpenIntent} title="Open intent file">🔍</span>
                    ` : A}
                </div>
                ${this._renderPhasesRow(phases)}
            </div>
        `;
    }
    _computePhases() {
      if (this.item.phases && this.item.phases.length > 0) {
        return this.item.phases;
      }
      const phaseOrder = ["plan", "execute", "test", "review"];
      const currentPhase = this.item.currentPhase;
      const currentIdx = currentPhase ? phaseOrder.indexOf(currentPhase) : -1;
      if (this.item.status === "completed") {
        return phaseOrder.map((phase) => ({
          phase,
          status: "complete"
        }));
      }
      if (this.item.status === "pending") {
        return phaseOrder.map((phase) => ({
          phase,
          status: "pending"
        }));
      }
      const effectiveIdx = currentIdx >= 0 ? currentIdx : 0;
      return phaseOrder.map((phase, idx) => ({
        phase,
        status: idx < effectiveIdx ? "complete" : idx === effectiveIdx ? "active" : "pending"
      }));
    }
    _renderPhasesRow(phases) {
      if (this.item.status === "pending") {
        return A;
      }
      return b2`
            <div class="phases-row">
                ${phases.map((phase, idx) => b2`
                    <div class="phase-node ${phase.status}" title="${phase.phase}">
                        ${phase.status === "complete" ? "\u2713" : this._getPhaseIcon(phase.phase)}
                    </div>
                    ${idx < phases.length - 1 ? b2`
                        <div class="phase-connector ${phase.status === "complete" ? "complete" : ""}"></div>
                    ` : A}
                `)}
            </div>
        `;
    }
    _getPhaseIcon(phase) {
      switch (phase) {
        case "plan":
          return "P";
        case "execute":
          return "E";
        case "test":
          return "T";
        case "review":
          return "R";
        default:
          return "?";
      }
    }
    _getStatusIcon() {
      switch (this.item.status) {
        case "pending":
          return "\u25CB";
        case "in_progress":
          return "\u25CF";
        case "completed":
          return "\u2713";
        case "failed":
          return "\u2717";
        default:
          return "\u25CB";
      }
    }
    _handleClick() {
      this.dispatchEvent(new CustomEvent("open-file", {
        detail: {
          id: this.item.id,
          intentId: this.item.intentId,
          path: this.item.filePath
        },
        bubbles: true,
        composed: true
      }));
    }
    _handleOpenIntent(e7) {
      e7.stopPropagation();
      if (this.item.intentFilePath) {
        this.dispatchEvent(new CustomEvent("open-file", {
          detail: { path: this.item.intentFilePath },
          bubbles: true,
          composed: true
        }));
      }
    }
  };
  FireWorkItem.styles = [
    ...BaseElement.baseStyles,
    i`
            :host {
                display: block;
            }

            .item {
                display: flex;
                flex-direction: column;
                gap: 6px;
                padding: 8px 10px;
                border-radius: 4px;
                cursor: pointer;
                transition: background 0.15s ease;
            }

            .item:hover {
                background: var(--editor-background);
            }

            .item.current {
                background: rgba(249, 115, 22, 0.1);
                border-left: 2px solid var(--status-active);
            }

            .item-header {
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .status-icon {
                width: 16px;
                height: 16px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 12px;
                flex-shrink: 0;
            }

            .status-icon.pending { color: var(--status-pending); }
            .status-icon.in_progress { color: var(--status-active); }
            .status-icon.completed { color: var(--status-complete); }
            .status-icon.failed { color: var(--status-blocked); }

            .name {
                flex: 1;
                font-size: 12px;
                color: var(--foreground);
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }

            .current-indicator {
                font-size: 9px;
                color: var(--status-active);
                padding: 1px 4px;
                background: rgba(249, 115, 22, 0.15);
                border-radius: 2px;
            }

            .open-intent-btn {
                font-size: 12px;
                cursor: pointer;
                opacity: 0.6;
                transition: opacity 0.15s ease;
                padding: 2px;
                border-radius: 2px;
            }

            .open-intent-btn:hover {
                opacity: 1;
                background: rgba(255, 255, 255, 0.1);
            }

            /* Inline phase pipeline */
            .phases-row {
                display: flex;
                align-items: center;
                gap: 4px;
                padding-left: 24px;
            }

            .phase-node {
                width: 18px;
                height: 18px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 9px;
                font-weight: 600;
                border: 1.5px solid var(--border-color);
                background: var(--editor-background);
                color: var(--description-foreground);
                transition: all 0.2s ease;
            }

            .phase-node.complete {
                background: var(--status-complete);
                border-color: var(--status-complete);
                color: white;
            }

            .phase-node.active {
                background: var(--status-active);
                border-color: var(--status-active);
                color: white;
                box-shadow: 0 0 4px rgba(249, 115, 22, 0.4);
                width: 22px;
                height: 22px;
                font-size: 10px;
            }

            .phase-node.skipped {
                opacity: 0.5;
                border-style: dashed;
            }

            .phase-connector {
                width: 8px;
                height: 1.5px;
                background: var(--border-color);
                flex-shrink: 0;
            }

            .phase-connector.complete {
                background: var(--status-complete);
            }
        `
  ];
  __decorateClass([
    n4({ type: Object })
  ], FireWorkItem.prototype, "item", 2);
  __decorateClass([
    n4({ type: Boolean })
  ], FireWorkItem.prototype, "isCurrent", 2);
  FireWorkItem = __decorateClass([
    t3("fire-work-item")
  ], FireWorkItem);

  // src/webview/components/fire/shared/fire-scope-badge.ts
  var FireScopeBadge = class extends BaseElement {
    constructor() {
      super(...arguments);
      this.scope = "single";
    }
    render() {
      const icon = this._getIcon();
      const label = this._getLabel();
      return b2`
            <span class="badge">
                <span class="icon">${icon}</span>
                <span>${label}</span>
            </span>
        `;
    }
    _getIcon() {
      switch (this.scope) {
        case "single":
          return "1\uFE0F\u20E3";
        case "batch":
          return "\u{1F4E6}";
        case "wide":
          return "\u{1F310}";
        default:
          return "\u2022";
      }
    }
    _getLabel() {
      switch (this.scope) {
        case "single":
          return "Single";
        case "batch":
          return "Batch";
        case "wide":
          return "Wide";
        default:
          return this.scope;
      }
    }
  };
  FireScopeBadge.styles = [
    ...BaseElement.baseStyles,
    i`
            :host {
                display: inline-flex;
            }

            .badge {
                display: inline-flex;
                align-items: center;
                gap: 4px;
                padding: 2px 6px;
                border-radius: 3px;
                font-size: 10px;
                font-weight: 500;
                background: var(--editor-background);
                border: 1px solid var(--border-color);
                color: var(--description-foreground);
            }

            .icon {
                font-size: 10px;
            }
        `
  ];
  __decorateClass([
    n4({ type: String })
  ], FireScopeBadge.prototype, "scope", 2);
  FireScopeBadge = __decorateClass([
    t3("fire-scope-badge")
  ], FireScopeBadge);

  // src/webview/components/fire/runs/fire-run-card.ts
  var FireRunCard = class extends BaseElement {
    constructor() {
      super(...arguments);
      this.isActive = false;
      this._expanded = true;
    }
    render() {
      if (!this.run) return A;
      const completedCount = this.run.workItems.filter((w2) => w2.status === "completed").length;
      return b2`
            <div class="card ${this.isActive ? "active" : ""}">
                <div class="header">
                    <div class="header-left">
                        <span class="run-id">${this.run.id}</span>
                        <fire-scope-badge scope=${this.run.scope}></fire-scope-badge>
                    </div>
                    <span class="item-count">${completedCount}/${this.run.workItems.length} items</span>
                </div>

                <div class="work-items-section">
                    <div class="section-header" @click=${this._toggleExpanded}>
                        <span class="section-title">Work Items</span>
                        <span class="toggle-icon ${this._expanded ? "" : "collapsed"}">▼</span>
                    </div>
                    ${this._expanded ? b2`
                        <div class="work-items-list">
                            ${this.run.workItems.map((item) => b2`
                                <fire-work-item
                                    .item=${item}
                                    ?isCurrent=${item.id === this.run.currentItem}
                                    @open-file=${this._forwardOpenFile}
                                ></fire-work-item>
                            `)}
                        </div>
                    ` : A}
                </div>

                ${this._renderFilesSection()}
            </div>
        `;
    }
    _toggleExpanded() {
      this._expanded = !this._expanded;
    }
    _renderFilesSection() {
      const files = this.run.files || [];
      if (files.length === 0) {
        return A;
      }
      return b2`
            <div class="files-section">
                <div class="files-header">
                    <span class="files-title">Run Files</span>
                </div>
                <div class="files-list">
                    ${files.map((file) => b2`
                        <div class="file-item" @click=${() => this._handleFileClick(file)}>
                            <span class="file-icon">${this._getFileIcon(file.name)}</span>
                            <span class="file-name">${file.name}</span>
                        </div>
                    `)}
                </div>
            </div>
        `;
    }
    _getFileIcon(fileName) {
      if (fileName.includes("plan")) return "\u{1F4CB}";
      if (fileName.includes("test")) return "\u{1F9EA}";
      if (fileName.includes("walkthrough")) return "\u{1F4DD}";
      if (fileName.includes("run")) return "\u{1F525}";
      return "\u{1F4C4}";
    }
    _handleFileClick(file) {
      this.dispatchEvent(new CustomEvent("open-file", {
        detail: { path: file.path },
        bubbles: true,
        composed: true
      }));
    }
    _forwardOpenFile(e7) {
      e7.stopPropagation();
      this.dispatchEvent(new CustomEvent("open-file", {
        detail: e7.detail,
        bubbles: true,
        composed: true
      }));
    }
    _handleViewArtifact(artifact) {
      this.dispatchEvent(new CustomEvent("view-artifact", {
        detail: { runId: this.run.id, artifact },
        bubbles: true,
        composed: true
      }));
    }
  };
  FireRunCard.styles = [
    ...BaseElement.baseStyles,
    i`
            :host {
                display: block;
            }

            .card {
                background: var(--editor-background);
                border: 1px solid var(--border-color);
                border-radius: 6px;
                overflow: hidden;
            }

            .card.active {
                border-color: var(--status-active);
                box-shadow: 0 0 0 1px rgba(249, 115, 22, 0.2);
            }

            .header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 12px;
                border-bottom: 1px solid var(--border-color);
            }

            .header-left {
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .run-id {
                font-size: 13px;
                font-weight: 600;
                color: var(--foreground);
            }

            .item-count {
                font-size: 11px;
                color: var(--description-foreground);
            }

            .work-items-section {
                padding: 8px;
            }

            .section-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 4px 8px;
                cursor: pointer;
            }

            .section-title {
                font-size: 10px;
                font-weight: 500;
                text-transform: uppercase;
                color: var(--description-foreground);
                letter-spacing: 0.5px;
            }

            .toggle-icon {
                font-size: 10px;
                color: var(--description-foreground);
                transition: transform 0.15s ease;
            }

            .toggle-icon.collapsed {
                transform: rotate(-90deg);
            }

            .work-items-list {
                margin-top: 4px;
            }

            .files-section {
                padding: 8px 12px;
                border-top: 1px solid var(--border-color);
            }

            .files-header {
                display: flex;
                align-items: center;
                gap: 6px;
                margin-bottom: 8px;
            }

            .files-title {
                font-size: 10px;
                font-weight: 500;
                text-transform: uppercase;
                color: var(--description-foreground);
                letter-spacing: 0.5px;
            }

            .files-list {
                display: flex;
                flex-direction: column;
                gap: 2px;
            }

            .file-item {
                display: flex;
                align-items: center;
                gap: 6px;
                padding: 4px 8px;
                cursor: pointer;
                border-radius: 3px;
                transition: background 0.15s ease;
            }

            .file-item:hover {
                background: var(--background);
            }

            .file-icon {
                font-size: 12px;
                color: var(--description-foreground);
            }

            .file-name {
                font-size: 11px;
                color: var(--foreground);
            }

            .no-files {
                font-size: 11px;
                color: var(--description-foreground);
                font-style: italic;
            }
        `
  ];
  __decorateClass([
    n4({ type: Object })
  ], FireRunCard.prototype, "run", 2);
  __decorateClass([
    n4({ type: Boolean })
  ], FireRunCard.prototype, "isActive", 2);
  __decorateClass([
    r5()
  ], FireRunCard.prototype, "_expanded", 2);
  FireRunCard = __decorateClass([
    t3("fire-run-card")
  ], FireRunCard);

  // src/webview/components/fire/runs/fire-current-run.ts
  var FireCurrentRun = class extends BaseElement {
    constructor() {
      super(...arguments);
      this.runs = [];
    }
    render() {
      const hasRuns = this.runs && this.runs.length > 0;
      const runCount = this.runs?.length || 0;
      const sectionTitle = runCount > 1 ? `Active Runs (${runCount})` : "Current Run";
      return b2`
            <div class="section">
                <div class="section-header">
                    <span class="fire-icon">🔥</span>
                    <span class="section-title">${sectionTitle}</span>
                </div>

                ${hasRuns ? b2`
                    ${this.runs.map((run) => b2`
                        <fire-run-card
                            .run=${run}
                            ?isActive=${true}
                            @open-file=${this._forwardOpenFile}
                        ></fire-run-card>
                    `)}
                ` : b2`
                    <div class="empty-state">
                        <div class="empty-icon">💤</div>
                        <div class="empty-text">No active run</div>
                        <div class="empty-hint">Start a run from pending work items below</div>
                    </div>
                `}
            </div>
        `;
    }
    _forwardOpenFile(e7) {
      e7.stopPropagation();
      this.dispatchEvent(new CustomEvent("open-file", {
        detail: e7.detail,
        bubbles: true,
        composed: true
      }));
    }
  };
  FireCurrentRun.styles = [
    ...BaseElement.baseStyles,
    i`
            :host {
                display: block;
            }

            .section {
                padding: 12px;
            }

            .section-header {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 12px;
            }

            .fire-icon {
                font-size: 16px;
            }

            .section-title {
                font-size: 11px;
                font-weight: 600;
                text-transform: uppercase;
                color: var(--status-active);
                letter-spacing: 0.5px;
            }

            .empty-state {
                text-align: center;
                padding: 24px;
                color: var(--description-foreground);
            }

            .empty-icon {
                font-size: 24px;
                margin-bottom: 8px;
            }

            .empty-text {
                font-size: 12px;
            }

            .empty-hint {
                font-size: 11px;
                margin-top: 4px;
                opacity: 0.7;
            }
        `
  ];
  __decorateClass([
    n4({ type: Array })
  ], FireCurrentRun.prototype, "runs", 2);
  FireCurrentRun = __decorateClass([
    t3("fire-current-run")
  ], FireCurrentRun);

  // src/webview/components/fire/shared/fire-status-badge.ts
  var FireStatusBadge = class extends BaseElement {
    constructor() {
      super(...arguments);
      this.status = "pending";
      this.size = "normal";
    }
    render() {
      const label = this._getLabel();
      return b2`
            <span class="badge ${this.status} ${this.size}">
                <span class="dot ${this.status}"></span>
                <span>${label}</span>
            </span>
        `;
    }
    _getLabel() {
      switch (this.status) {
        case "pending":
          return "Pending";
        case "in_progress":
          return "In Progress";
        case "completed":
          return "Completed";
        case "blocked":
          return "Blocked";
        default:
          return this.status;
      }
    }
  };
  FireStatusBadge.styles = [
    ...BaseElement.baseStyles,
    i`
            :host {
                display: inline-flex;
            }

            .badge {
                display: inline-flex;
                align-items: center;
                gap: 4px;
                padding: 2px 6px;
                border-radius: 3px;
                font-size: 10px;
                font-weight: 500;
            }

            .badge.small {
                padding: 1px 4px;
                font-size: 9px;
            }

            .badge.pending {
                background: rgba(107, 114, 128, 0.15);
                color: var(--status-pending);
            }

            .badge.in_progress {
                background: rgba(249, 115, 22, 0.15);
                color: var(--status-active);
            }

            .badge.completed {
                background: rgba(34, 197, 94, 0.15);
                color: var(--status-complete);
            }

            .badge.blocked {
                background: rgba(239, 68, 68, 0.15);
                color: var(--status-blocked);
            }

            .dot {
                width: 6px;
                height: 6px;
                border-radius: 50%;
            }

            .dot.pending { background: var(--status-pending); }
            .dot.in_progress { background: var(--status-active); }
            .dot.completed { background: var(--status-complete); }
            .dot.blocked { background: var(--status-blocked); }
        `
  ];
  __decorateClass([
    n4({ type: String })
  ], FireStatusBadge.prototype, "status", 2);
  __decorateClass([
    n4({ type: String })
  ], FireStatusBadge.prototype, "size", 2);
  FireStatusBadge = __decorateClass([
    t3("fire-status-badge")
  ], FireStatusBadge);

  // src/webview/components/fire/runs/fire-pending-items.ts
  var FirePendingItems = class extends BaseElement {
    constructor() {
      super(...arguments);
      this.items = [];
      this.hasActiveRun = false;
      this._selectedIds = /* @__PURE__ */ new Set();
      this._expanded = true;
    }
    render() {
      return b2`
            <div class="section">
                <div class="section-header" @click=${this._toggleExpanded}>
                    <div class="header-left">
                        <span class="section-icon">📋</span>
                        <span class="section-title">Pending Work Items</span>
                        <span class="count-badge">${this.items.length}</span>
                    </div>
                    <span class="toggle-icon ${this._expanded ? "" : "collapsed"}">▼</span>
                </div>

                ${this._expanded ? b2`
                    ${this.items.length > 0 ? b2`
                        <div class="items-list">
                            ${this._renderGroupedItems()}
                        </div>

                        <div class="actions">
                            <button
                                class="start-btn"
                                ?disabled=${this.hasActiveRun || this._selectedIds.size === 0}
                                @click=${this._handleStartRun}
                            >
                                ${this._selectedIds.size > 1 ? `Start Batch Run (${this._selectedIds.size})` : "Start Run"}
                            </button>
                            ${this._selectedIds.size === 0 ? b2`
                                <span class="selection-hint">Select items to start a run</span>
                            ` : A}
                        </div>
                    ` : b2`
                        <div class="empty-state">
                            No pending work items
                        </div>
                    `}
                ` : A}
            </div>
        `;
    }
    _renderGroupedItems() {
      const groups = /* @__PURE__ */ new Map();
      for (const item of this.items) {
        const key = item.intentId;
        if (!groups.has(key)) {
          groups.set(key, []);
        }
        groups.get(key).push(item);
      }
      return Array.from(groups.entries()).map(([intentId, items]) => {
        const intentTitle = items[0]?.intentTitle || intentId;
        const intentFilePath = items[0]?.intentFilePath;
        return b2`
                <div class="intent-group">
                    <div class="intent-group-header">
                        <span class="intent-group-icon">🎯</span>
                        <span>${intentTitle}</span>
                        <span style="color: var(--description-foreground); font-weight: normal;">(${items.length})</span>
                        ${intentFilePath ? b2`
                            <span class="open-btn" @click=${(e7) => this._handleOpenIntent(e7, intentFilePath)} title="Open intent file">🔍</span>
                        ` : A}
                    </div>
                    <div class="intent-group-items">
                        ${items.map((item) => this._renderItem(item))}
                    </div>
                </div>
            `;
      });
    }
    _renderItem(item) {
      const isSelected = this._selectedIds.has(item.id);
      const statusIcon = this._getStatusIcon(item.status);
      const hasDeps = item.dependencies && item.dependencies.length > 0;
      return b2`
            <div class="item" @click=${() => this._handleItemClick(item)}>
                <input
                    type="checkbox"
                    class="item-checkbox"
                    .checked=${isSelected}
                    @click=${(e7) => e7.stopPropagation()}
                    @change=${(e7) => this._handleCheckboxChange(e7, item.id)}
                />
                <span class="item-status ${item.status}">${statusIcon}</span>
                <div class="item-content">
                    <div class="item-title">${item.title || item.id}</div>
                    ${hasDeps ? b2`
                        <div class="item-deps">depends on: ${item.dependencies.join(", ")}</div>
                    ` : A}
                </div>
                <div class="item-badges">
                    <fire-mode-badge mode=${item.mode}></fire-mode-badge>
                    <span class="complexity ${item.complexity}">${item.complexity}</span>
                </div>
            </div>
        `;
    }
    _getStatusIcon(status) {
      switch (status) {
        case "pending":
          return "\u25CB";
        case "in_progress":
          return "\u25CF";
        case "completed":
          return "\u2713";
        case "blocked":
          return "\u26A0";
        default:
          return "\u25CB";
      }
    }
    _toggleExpanded() {
      this._expanded = !this._expanded;
    }
    _handleItemClick(item) {
      this.dispatchEvent(new CustomEvent("open-file", {
        detail: { path: item.filePath },
        bubbles: true,
        composed: true
      }));
    }
    _handleOpenIntent(e7, intentFilePath) {
      e7.stopPropagation();
      this.dispatchEvent(new CustomEvent("open-file", {
        detail: { path: intentFilePath },
        bubbles: true,
        composed: true
      }));
    }
    _handleCheckboxChange(e7, itemId) {
      const checkbox = e7.target;
      if (checkbox.checked) {
        this._selectedIds.add(itemId);
        this._selectDependencies(itemId);
      } else {
        this._selectedIds.delete(itemId);
      }
      this._selectedIds = new Set(this._selectedIds);
    }
    _selectDependencies(itemId) {
      const item = this.items.find((i6) => i6.id === itemId);
      if (!item?.dependencies) return;
      for (const depId of item.dependencies) {
        const depItem = this.items.find((i6) => i6.id === depId);
        if (depItem && !this._selectedIds.has(depId)) {
          this._selectedIds.add(depId);
          this._selectDependencies(depId);
        }
      }
    }
    _handleStartRun() {
      if (this._selectedIds.size === 0) return;
      this.dispatchEvent(new CustomEvent("start-run", {
        detail: { workItemIds: Array.from(this._selectedIds) },
        bubbles: true,
        composed: true
      }));
    }
  };
  FirePendingItems.styles = [
    ...BaseElement.baseStyles,
    i`
            :host {
                display: block;
            }

            .section {
                padding: 12px;
                border-top: 1px solid var(--border-color);
            }

            .section-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 12px;
                cursor: pointer;
            }

            .header-left {
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .section-icon {
                font-size: 14px;
            }

            .section-title {
                font-size: 11px;
                font-weight: 600;
                text-transform: uppercase;
                color: var(--foreground);
                letter-spacing: 0.5px;
            }

            .count-badge {
                font-size: 10px;
                padding: 2px 6px;
                background: var(--editor-background);
                border-radius: 10px;
                color: var(--description-foreground);
            }

            .toggle-icon {
                font-size: 10px;
                color: var(--description-foreground);
                transition: transform 0.15s ease;
            }

            .toggle-icon.collapsed {
                transform: rotate(-90deg);
            }

            .items-list {
                display: flex;
                flex-direction: column;
                gap: 4px;
            }

            .item {
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 8px 10px;
                cursor: pointer;
                transition: background 0.15s ease;
                border-bottom: 1px solid var(--border-color);
            }

            .item:last-child {
                border-bottom: none;
            }

            .item:hover {
                background: rgba(255, 255, 255, 0.03);
            }

            .item-checkbox {
                width: 14px;
                height: 14px;
                cursor: pointer;
                accent-color: var(--status-active);
                flex-shrink: 0;
            }

            .item-status {
                width: 18px;
                height: 18px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 14px;
                flex-shrink: 0;
            }

            .item-status.pending { color: var(--description-foreground); }
            .item-status.in_progress { color: var(--status-active); }
            .item-status.completed { color: var(--status-complete); }
            .item-status.blocked { color: var(--status-blocked); }

            .item-content {
                flex: 1;
                min-width: 0;
            }

            .item-title {
                font-size: 12px;
                color: var(--foreground);
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }

            .item-deps {
                font-size: 10px;
                color: var(--description-foreground);
                margin-top: 2px;
            }

            .item-badges {
                display: flex;
                align-items: center;
                gap: 6px;
                flex-shrink: 0;
            }

            .complexity {
                font-size: 9px;
                padding: 2px 6px;
                border-radius: 3px;
                text-transform: uppercase;
                font-weight: 500;
            }

            .complexity.low {
                background: rgba(34, 197, 94, 0.15);
                color: #22c55e;
            }

            .complexity.medium {
                background: rgba(249, 115, 22, 0.15);
                color: #f97316;
            }

            .complexity.high {
                background: rgba(239, 68, 68, 0.15);
                color: #ef4444;
            }

            .actions {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-top: 12px;
                padding-top: 12px;
                border-top: 1px solid var(--border-color);
            }

            .start-btn {
                display: inline-flex;
                align-items: center;
                gap: 4px;
                padding: 6px 12px;
                font-size: 11px;
                font-weight: 500;
                background: var(--status-active);
                color: white;
                border-radius: 4px;
                cursor: pointer;
                transition: all 0.15s ease;
            }

            .start-btn:hover:not(:disabled) {
                background: #ea580c;
            }

            .start-btn:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }

            .selection-hint {
                font-size: 10px;
                color: var(--description-foreground);
            }

            .empty-state {
                text-align: center;
                padding: 16px;
                color: var(--description-foreground);
                font-size: 12px;
            }

            .intent-group {
                margin-bottom: 8px;
            }

            .intent-group-header {
                display: flex;
                align-items: center;
                gap: 6px;
                padding: 6px 8px;
                font-size: 11px;
                font-weight: 500;
                color: var(--foreground);
                background: var(--editor-background);
                border-radius: 4px 4px 0 0;
                border-bottom: 1px solid var(--border-color);
            }

            .intent-group-header .open-btn {
                margin-left: auto;
                font-size: 12px;
                padding: 2px 4px;
                cursor: pointer;
                opacity: 0.6;
                transition: opacity 0.15s ease;
                border-radius: 3px;
            }

            .intent-group-header .open-btn:hover {
                opacity: 1;
                background: var(--background);
            }

            .intent-group-icon {
                font-size: 12px;
            }

            .intent-group-items {
                background: var(--editor-background);
                border-radius: 0 0 4px 4px;
                padding: 4px;
            }
        `
  ];
  __decorateClass([
    n4({ type: Array })
  ], FirePendingItems.prototype, "items", 2);
  __decorateClass([
    n4({ type: Boolean })
  ], FirePendingItems.prototype, "hasActiveRun", 2);
  __decorateClass([
    r5()
  ], FirePendingItems.prototype, "_selectedIds", 2);
  __decorateClass([
    r5()
  ], FirePendingItems.prototype, "_expanded", 2);
  FirePendingItems = __decorateClass([
    t3("fire-pending-items")
  ], FirePendingItems);

  // src/webview/components/fire/runs/fire-completed-runs.ts
  var FireCompletedRuns = class extends BaseElement {
    constructor() {
      super(...arguments);
      this.runs = [];
      /**
       * Display limit for completed runs. Configurable via settings.
       * Clamped to 1-100 range.
       */
      this._displayLimit = 5;
      this._expanded = true;
      this._expandedRunIds = /* @__PURE__ */ new Set();
      this.showAll = false;
      this._sortedRuns = [];
    }
    get displayLimit() {
      return this._displayLimit;
    }
    set displayLimit(value) {
      const oldValue = this._displayLimit;
      this._displayLimit = Math.max(1, Math.min(100, value || 5));
      this.requestUpdate("displayLimit", oldValue);
    }
    /**
     * Memoize sorting when runs change.
     */
    willUpdate(changedProperties) {
      if (changedProperties.has("runs")) {
        this._sortedRuns = [...this.runs].sort((a3, b3) => {
          const dateA = new Date(a3.completedAt).getTime();
          const dateB = new Date(b3.completedAt).getTime();
          return dateB - dateA;
        });
      }
    }
    render() {
      const sortedRuns = this._sortedRuns;
      const limit = this.displayLimit;
      const hasMore = sortedRuns.length > limit;
      const displayedRuns = this.showAll ? sortedRuns : sortedRuns.slice(0, limit);
      const hiddenCount = sortedRuns.length - limit;
      return b2`
            <div class="section">
                <div class="section-header" @click=${this._toggleExpanded}>
                    <div class="header-left">
                        <span class="section-icon">✅</span>
                        <span class="section-title">Completed Runs</span>
                        <span class="count-badge">${this.runs.length}</span>
                    </div>
                    <span class="toggle-icon ${this._expanded ? "" : "collapsed"}">▼</span>
                </div>

                ${this._expanded ? b2`
                    ${sortedRuns.length > 0 ? b2`
                        <div class="runs-list">
                            ${displayedRuns.map((run) => this._renderRunContainer(run))}
                        </div>
                        ${hasMore ? b2`
                            <div class="show-more" @click=${this._toggleShowAll}>
                                ${this.showAll ? "Show Less" : `Show ${hiddenCount} More`}
                            </div>
                        ` : A}
                    ` : b2`
                        <div class="empty-state">
                            No completed runs yet
                        </div>
                    `}
                ` : A}
            </div>
        `;
    }
    _renderRunContainer(run) {
      const isExpanded = this._expandedRunIds.has(run.id);
      const hasFiles = run.files && run.files.length > 0;
      return b2`
            <div class="run-container">
                ${this._renderRun(run, isExpanded, hasFiles)}
                ${isExpanded && hasFiles ? b2`
                    <div class="run-files">
                        ${run.files.map((file) => this._renderFile(file))}
                    </div>
                ` : A}
            </div>
        `;
    }
    _renderRun(run, isExpanded, hasFiles) {
      const relativeTime = this._formatRelativeTime(run.completedAt);
      return b2`
            <div class="run-item" @click=${() => this._handleRunHeaderClick(run)}>
                ${hasFiles ? b2`
                    <span class="run-expand-icon ${isExpanded ? "expanded" : ""}">▶</span>
                ` : b2`
                    <span class="check-icon">✓</span>
                `}
                <div class="run-info">
                    <span class="run-id">${run.id}</span>
                    <div class="run-meta">
                        <span class="item-count">${run.itemCount} item${run.itemCount !== 1 ? "s" : ""}</span>
                        <span class="completed-time">· ${relativeTime}</span>
                    </div>
                </div>
                <fire-scope-badge scope=${run.scope}></fire-scope-badge>
            </div>
        `;
    }
    _renderFile(file) {
      return b2`
            <div class="run-file" @click=${(e7) => this._handleFileClick(e7, file)}>
                <span class="file-icon">${this._getFileIcon(file.name)}</span>
                <span class="file-name">${file.name}</span>
            </div>
        `;
    }
    _getFileIcon(fileName) {
      const lowerName = fileName.toLowerCase();
      if (lowerName.includes("test")) {
        return "\u{1F9EA}";
      }
      if (lowerName.includes("walkthrough")) {
        return "\u{1F4DD}";
      }
      if (lowerName.includes("review")) {
        return "\u{1F441}\uFE0F";
      }
      if (lowerName.includes("plan")) {
        return "\u{1F4CB}";
      }
      if (lowerName.includes("run")) {
        return "\u{1F525}";
      }
      return "\u{1F4C4}";
    }
    _toggleExpanded() {
      this._expanded = !this._expanded;
    }
    _toggleShowAll() {
      this.showAll = !this.showAll;
      this.dispatchEvent(new CustomEvent("show-all-change", {
        detail: { showAll: this.showAll },
        bubbles: true,
        composed: true
      }));
    }
    _handleRunHeaderClick(run) {
      if (this._expandedRunIds.has(run.id)) {
        this._expandedRunIds.delete(run.id);
      } else {
        this._expandedRunIds.add(run.id);
      }
      this._expandedRunIds = new Set(this._expandedRunIds);
    }
    _handleFileClick(e7, file) {
      e7.stopPropagation();
      this.dispatchEvent(new CustomEvent("open-file", {
        detail: { path: file.path },
        bubbles: true,
        composed: true
      }));
    }
    _formatRelativeTime(dateStr) {
      try {
        const date = new Date(dateStr);
        const now = /* @__PURE__ */ new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 6e4);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);
        if (diffMins < 1) return "just now";
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays === 1) return "yesterday";
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
      } catch {
        return dateStr;
      }
    }
  };
  FireCompletedRuns.styles = [
    ...BaseElement.baseStyles,
    i`
            :host {
                display: block;
            }

            .section {
                padding: 12px;
                border-top: 1px solid var(--border-color);
            }

            .section-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                cursor: pointer;
            }

            .header-left {
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .section-icon {
                font-size: 14px;
            }

            .section-title {
                font-size: 11px;
                font-weight: 600;
                text-transform: uppercase;
                color: var(--foreground);
                letter-spacing: 0.5px;
            }

            .count-badge {
                font-size: 10px;
                padding: 2px 6px;
                background: rgba(34, 197, 94, 0.15);
                color: var(--status-complete);
                border-radius: 10px;
            }

            .toggle-icon {
                font-size: 10px;
                color: var(--description-foreground);
                transition: transform 0.15s ease;
            }

            .toggle-icon.collapsed {
                transform: rotate(-90deg);
            }

            .runs-list {
                display: flex;
                flex-direction: column;
                gap: 4px;
                margin-top: 12px;
            }

            .run-item {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 8px;
                background: var(--editor-background);
                border-radius: 4px;
                cursor: pointer;
                transition: background 0.15s ease;
            }

            .run-item:hover {
                background: var(--background);
            }

            .check-icon {
                width: 16px;
                height: 16px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 10px;
                color: var(--status-complete);
                background: rgba(34, 197, 94, 0.15);
                border-radius: 50%;
            }

            .run-info {
                flex: 1;
                min-width: 0;
            }

            .run-id {
                font-size: 12px;
                color: var(--foreground);
            }

            .run-meta {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-top: 2px;
            }

            .item-count {
                font-size: 10px;
                color: var(--description-foreground);
            }

            .completed-time {
                font-size: 10px;
                color: var(--description-foreground);
            }

            .empty-state {
                text-align: center;
                padding: 16px;
                color: var(--description-foreground);
                font-size: 12px;
            }

            .run-container {
                margin-bottom: 4px;
            }

            .run-expand-icon {
                font-size: 10px;
                color: var(--description-foreground);
                transition: transform 0.15s ease;
                width: 12px;
            }

            .run-expand-icon.expanded {
                transform: rotate(90deg);
            }

            .run-files {
                margin-left: 24px;
                padding: 4px 0;
                display: flex;
                flex-direction: column;
                gap: 2px;
            }

            .run-file {
                display: flex;
                align-items: center;
                gap: 6px;
                padding: 4px 8px;
                cursor: pointer;
                border-radius: 3px;
                transition: background 0.15s ease;
            }

            .run-file:hover {
                background: var(--editor-background);
            }

            .file-icon {
                font-size: 12px;
                color: var(--description-foreground);
            }

            .file-name {
                font-size: 11px;
                color: var(--foreground);
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }

            .show-more {
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 8px;
                margin-top: 4px;
                cursor: pointer;
                color: var(--description-foreground);
                font-size: 11px;
                border-radius: 4px;
                transition: background 0.15s ease, color 0.15s ease;
            }

            .show-more:hover {
                background: var(--editor-background);
                color: var(--foreground);
            }
        `
  ];
  __decorateClass([
    n4({ type: Array })
  ], FireCompletedRuns.prototype, "runs", 2);
  __decorateClass([
    n4({ type: Number })
  ], FireCompletedRuns.prototype, "displayLimit", 1);
  __decorateClass([
    r5()
  ], FireCompletedRuns.prototype, "_expanded", 2);
  __decorateClass([
    r5()
  ], FireCompletedRuns.prototype, "_expandedRunIds", 2);
  __decorateClass([
    n4({ type: Boolean })
  ], FireCompletedRuns.prototype, "showAll", 2);
  __decorateClass([
    r5()
  ], FireCompletedRuns.prototype, "_sortedRuns", 2);
  FireCompletedRuns = __decorateClass([
    t3("fire-completed-runs")
  ], FireCompletedRuns);

  // src/webview/components/fire/runs/fire-runs-view.ts
  var FireRunsView = class extends BaseElement {
    render() {
      if (!this.data) {
        return b2`<div>Loading...</div>`;
      }
      const { activeRuns, pendingItems, completedRuns, stats } = this.data;
      const progressPercent = stats.totalWorkItems > 0 ? Math.round(stats.completedWorkItems / stats.totalWorkItems * 100) : 0;
      return b2`
            <div class="stats-bar">
                <div class="stat">
                    <span class="stat-icon">📊</span>
                    <span class="stat-value">${stats.completedWorkItems}</span>
                    <span class="stat-label">/ ${stats.totalWorkItems} items</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progressPercent}%"></div>
                </div>
                <div class="stat">
                    <span class="stat-value">${progressPercent}%</span>
                </div>
            </div>

            <div class="content">
                <fire-current-run
                    .runs=${activeRuns}
                    @continue-run=${this._handleContinueRun}
                    @view-artifact=${this._handleViewArtifact}
                    @open-file=${this._handleOpenFile}
                ></fire-current-run>

                <fire-completed-runs
                    .runs=${completedRuns}
                    .displayLimit=${this.data.completedRunsDisplayLimit}
                    @view-run=${this._handleViewRun}
                    @open-file=${this._handleOpenFile}
                ></fire-completed-runs>

                <fire-pending-items
                    .items=${pendingItems}
                    ?hasActiveRun=${stats.activeRunsCount > 0}
                    @start-run=${this._handleStartRun}
                    @open-file=${this._handleOpenFile}
                ></fire-pending-items>
            </div>
        `;
    }
    _handleContinueRun(e7) {
      e7.stopPropagation();
      this.dispatchEvent(new CustomEvent("continue-run", {
        detail: e7.detail,
        bubbles: true,
        composed: true
      }));
    }
    _handleStartRun(e7) {
      e7.stopPropagation();
      this.dispatchEvent(new CustomEvent("start-run", {
        detail: e7.detail,
        bubbles: true,
        composed: true
      }));
    }
    _handleViewArtifact(e7) {
      e7.stopPropagation();
      this.dispatchEvent(new CustomEvent("view-artifact", {
        detail: e7.detail,
        bubbles: true,
        composed: true
      }));
    }
    _handleViewRun(e7) {
      e7.stopPropagation();
      this.dispatchEvent(new CustomEvent("view-run", {
        detail: e7.detail,
        bubbles: true,
        composed: true
      }));
    }
    _handleOpenFile(e7) {
      e7.stopPropagation();
      this.dispatchEvent(new CustomEvent("open-file", {
        detail: e7.detail,
        bubbles: true,
        composed: true
      }));
    }
  };
  FireRunsView.styles = [
    ...BaseElement.baseStyles,
    i`
            :host {
                display: flex;
                flex-direction: column;
                height: 100%;
                overflow: hidden;
            }

            .stats-bar {
                display: flex;
                align-items: center;
                gap: 16px;
                padding: 8px 12px;
                background: var(--editor-background);
                border-bottom: 1px solid var(--border-color);
            }

            .stat {
                display: flex;
                align-items: center;
                gap: 4px;
                font-size: 11px;
            }

            .stat-value {
                font-weight: 600;
                color: var(--foreground);
            }

            .stat-label {
                color: var(--description-foreground);
            }

            .stat-icon {
                font-size: 12px;
            }

            .progress-bar {
                flex: 1;
                height: 4px;
                background: var(--border-color);
                border-radius: 2px;
                overflow: hidden;
            }

            .progress-fill {
                height: 100%;
                background: var(--status-complete);
                transition: width 0.3s ease;
            }

            .content {
                flex: 1;
                overflow-y: auto;
            }
        `
  ];
  __decorateClass([
    n4({ type: Object })
  ], FireRunsView.prototype, "data", 2);
  FireRunsView = __decorateClass([
    t3("fire-runs-view")
  ], FireRunsView);

  // src/webview/components/fire/intents/fire-intent-card.ts
  var FireIntentCard = class extends BaseElement {
    constructor() {
      super(...arguments);
      this.expanded = false;
      this._localExpanded = false;
    }
    /**
     * Sync local state with property when it changes.
     */
    willUpdate(changedProperties) {
      if (changedProperties.has("expanded")) {
        this._localExpanded = this.expanded;
      }
    }
    render() {
      if (!this.intent) return A;
      const completed = this.intent.workItems.filter((w2) => w2.status === "completed").length;
      const total = this.intent.workItems.length;
      const progressPercent = total > 0 ? Math.round(completed / total * 100) : 0;
      return b2`
            <div class="card">
                <div class="header" @click=${this._handleHeaderClick}>
                    <span class="toggle-icon ${this._localExpanded ? "expanded" : ""}">▶</span>
                    <span class="intent-icon">🎯</span>
                    <div class="intent-info">
                        <div class="intent-title">${this.intent.title}</div>
                        <div class="intent-meta">
                            <span class="item-count">${total} work item${total !== 1 ? "s" : ""}</span>
                            <div class="progress">
                                <div class="progress-bar">
                                    <div class="progress-fill" style="width: ${progressPercent}%"></div>
                                </div>
                                <span class="progress-text">${completed}/${total}</span>
                            </div>
                        </div>
                    </div>
                    <fire-status-badge status=${this.intent.status} size="small"></fire-status-badge>
                    <button class="open-intent-btn" @click=${this._handleOpenIntent} title="Open intent brief">
                        🔍
                    </button>
                </div>

                ${this._localExpanded && this.intent.workItems.length > 0 ? b2`
                    <div class="work-items">
                        ${this.intent.workItems.map((item) => this._renderWorkItem(item))}
                    </div>
                ` : A}
            </div>
        `;
    }
    _renderWorkItem(item) {
      const icon = this._getStatusIcon(item.status);
      return b2`
            <div class="work-item" @click=${() => this._handleWorkItemClick(item)}>
                <span class="work-item-icon ${item.status}">${icon}</span>
                <div class="work-item-info">
                    <div class="work-item-title">${item.title || item.id}</div>
                </div>
                <div class="work-item-badges">
                    <fire-mode-badge mode=${item.mode}></fire-mode-badge>
                    <span class="complexity ${item.complexity}">${item.complexity}</span>
                </div>
            </div>
        `;
    }
    _getStatusIcon(status) {
      switch (status) {
        case "pending":
          return "\u25CB";
        case "in_progress":
          return "\u25CF";
        case "completed":
          return "\u2713";
        case "blocked":
          return "\u26A0";
        default:
          return "\u25CB";
      }
    }
    _handleHeaderClick() {
      this._localExpanded = !this._localExpanded;
      this.dispatchEvent(new CustomEvent("toggle-expand", {
        detail: { intentId: this.intent.id, expanded: this._localExpanded },
        bubbles: true,
        composed: true
      }));
    }
    _handleOpenIntent(e7) {
      e7.stopPropagation();
      this.dispatchEvent(new CustomEvent("open-file", {
        detail: { path: this.intent.filePath },
        bubbles: true,
        composed: true
      }));
    }
    _handleWorkItemClick(item) {
      this.dispatchEvent(new CustomEvent("open-file", {
        detail: { path: item.filePath },
        bubbles: true,
        composed: true
      }));
    }
  };
  FireIntentCard.styles = [
    ...BaseElement.baseStyles,
    i`
            :host {
                display: block;
            }

            .card {
                background: var(--editor-background);
                border: 1px solid var(--border-color);
                border-radius: 6px;
                overflow: hidden;
            }

            .header {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 10px 12px;
                cursor: pointer;
                transition: background 0.15s ease;
            }

            .header:hover {
                background: var(--background);
            }

            .toggle-icon {
                font-size: 10px;
                color: var(--description-foreground);
                transition: transform 0.15s ease;
                width: 12px;
            }

            .toggle-icon.expanded {
                transform: rotate(90deg);
            }

            .intent-icon {
                font-size: 14px;
            }

            .intent-info {
                flex: 1;
                min-width: 0;
            }

            .intent-title {
                font-size: 12px;
                font-weight: 500;
                color: var(--foreground);
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }

            .intent-meta {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-top: 2px;
            }

            .item-count {
                font-size: 10px;
                color: var(--description-foreground);
            }

            .progress {
                display: flex;
                align-items: center;
                gap: 4px;
            }

            .progress-bar {
                width: 40px;
                height: 3px;
                background: var(--border-color);
                border-radius: 2px;
                overflow: hidden;
            }

            .progress-fill {
                height: 100%;
                background: var(--status-complete);
            }

            .progress-text {
                font-size: 9px;
                color: var(--description-foreground);
            }

            .work-items {
                border-top: 1px solid var(--border-color);
                padding: 4px;
            }

            .work-item {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 6px 8px;
                border-radius: 4px;
                cursor: pointer;
                transition: background 0.15s ease;
            }

            .work-item:hover {
                background: var(--background);
            }

            .work-item-icon {
                width: 14px;
                height: 14px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 10px;
            }

            .work-item-icon.pending { color: var(--status-pending); }
            .work-item-icon.in_progress { color: var(--status-active); }
            .work-item-icon.completed { color: var(--status-complete); }
            .work-item-icon.blocked { color: var(--status-blocked); }

            .work-item-info {
                flex: 1;
                min-width: 0;
            }

            .work-item-title {
                font-size: 11px;
                color: var(--foreground);
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }

            .work-item-badges {
                display: flex;
                align-items: center;
                gap: 4px;
            }

            .complexity {
                font-size: 8px;
                padding: 1px 3px;
                border-radius: 2px;
                text-transform: uppercase;
            }

            .complexity.low {
                background: rgba(34, 197, 94, 0.15);
                color: #22c55e;
            }

            .complexity.medium {
                background: rgba(249, 115, 22, 0.15);
                color: #f97316;
            }

            .complexity.high {
                background: rgba(239, 68, 68, 0.15);
                color: #ef4444;
            }

            .open-intent-btn {
                font-size: 10px;
                padding: 2px 6px;
                color: var(--description-foreground);
                border: 1px solid var(--border-color);
                border-radius: 3px;
                cursor: pointer;
                transition: all 0.15s ease;
            }

            .open-intent-btn:hover {
                background: var(--background);
                color: var(--foreground);
            }
        `
  ];
  __decorateClass([
    n4({ type: Object })
  ], FireIntentCard.prototype, "intent", 2);
  __decorateClass([
    n4({ type: Boolean })
  ], FireIntentCard.prototype, "expanded", 2);
  __decorateClass([
    r5()
  ], FireIntentCard.prototype, "_localExpanded", 2);
  FireIntentCard = __decorateClass([
    t3("fire-intent-card")
  ], FireIntentCard);

  // src/webview/components/fire/intents/fire-intents-view.ts
  var FireIntentsView = class extends BaseElement {
    render() {
      if (!this.data) {
        return b2`<div>Loading...</div>`;
      }
      const { intents, expandedIntents, filter } = this.data;
      const filteredIntents = this._filterIntents(intents, filter);
      const stats = this._computeStats(intents);
      return b2`
            <div class="header-bar">
                <div class="title">
                    <span class="title-icon">🎯</span>
                    <span class="title-text">Intents</span>
                    <span class="count-badge">${filteredIntents.length}</span>
                </div>
                <select class="filter-select" @change=${this._handleFilterChange}>
                    <option value="all" ?selected=${filter === "all"}>All</option>
                    <option value="pending" ?selected=${filter === "pending"}>Pending</option>
                    <option value="in_progress" ?selected=${filter === "in_progress"}>In Progress</option>
                    <option value="completed" ?selected=${filter === "completed"}>Completed</option>
                    <option value="blocked" ?selected=${filter === "blocked"}>Blocked</option>
                </select>
            </div>

            <div class="stats-row">
                <div class="stat">
                    <span class="stat-dot completed"></span>
                    <span class="stat-value">${stats.completed}</span>
                    <span class="stat-label">completed</span>
                </div>
                <div class="stat">
                    <span class="stat-dot in_progress"></span>
                    <span class="stat-value">${stats.inProgress}</span>
                    <span class="stat-label">in progress</span>
                </div>
                <div class="stat">
                    <span class="stat-dot pending"></span>
                    <span class="stat-value">${stats.pending}</span>
                    <span class="stat-label">pending</span>
                </div>
            </div>

            <div class="content">
                ${filteredIntents.length > 0 ? b2`
                    <div class="intents-list">
                        ${filteredIntents.map((intent) => b2`
                            <fire-intent-card
                                .intent=${intent}
                                ?expanded=${expandedIntents.includes(intent.id)}
                                @toggle-expand=${this._handleToggleExpand}
                                @open-file=${this._handleOpenFile}
                            ></fire-intent-card>
                        `)}
                    </div>
                ` : b2`
                    <div class="empty-state">
                        <div class="empty-icon">📭</div>
                        <div class="empty-text">No intents found</div>
                        <div class="empty-hint">
                            ${filter === "all" ? "Create an intent to get started" : `No ${filter.replace("_", " ")} intents`}
                        </div>
                    </div>
                `}
            </div>
        `;
    }
    _filterIntents(intents, filter) {
      if (filter === "all") return intents;
      return intents.filter((i6) => i6.status === filter);
    }
    _computeStats(intents) {
      return {
        completed: intents.filter((i6) => i6.status === "completed").length,
        inProgress: intents.filter((i6) => i6.status === "in_progress").length,
        pending: intents.filter((i6) => i6.status === "pending").length,
        blocked: intents.filter((i6) => i6.status === "blocked").length
      };
    }
    _handleFilterChange(e7) {
      const select = e7.target;
      this.dispatchEvent(new CustomEvent("filter-change", {
        detail: { filter: select.value },
        bubbles: true,
        composed: true
      }));
    }
    _handleToggleExpand(e7) {
      e7.stopPropagation();
      this.dispatchEvent(new CustomEvent("toggle-expand", {
        detail: e7.detail,
        bubbles: true,
        composed: true
      }));
    }
    _handleOpenFile(e7) {
      e7.stopPropagation();
      this.dispatchEvent(new CustomEvent("open-file", {
        detail: e7.detail,
        bubbles: true,
        composed: true
      }));
    }
  };
  FireIntentsView.styles = [
    ...BaseElement.baseStyles,
    i`
            :host {
                display: flex;
                flex-direction: column;
                height: 100%;
                overflow: hidden;
            }

            .header-bar {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 8px 12px;
                background: var(--editor-background);
                border-bottom: 1px solid var(--border-color);
            }

            .title {
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .title-icon {
                font-size: 14px;
            }

            .title-text {
                font-size: 11px;
                font-weight: 600;
                text-transform: uppercase;
                color: var(--foreground);
                letter-spacing: 0.5px;
            }

            .count-badge {
                font-size: 10px;
                padding: 2px 6px;
                background: var(--background);
                border-radius: 10px;
                color: var(--description-foreground);
            }

            .filter-select {
                font-size: 11px;
                padding: 4px 8px;
                background: var(--editor-background);
                border: 1px solid var(--border-color);
                border-radius: 4px;
                color: var(--foreground);
                cursor: pointer;
            }

            .filter-select:focus {
                outline: none;
                border-color: var(--status-active);
            }

            .content {
                flex: 1;
                overflow-y: auto;
                padding: 12px;
            }

            .intents-list {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }

            .empty-state {
                text-align: center;
                padding: 32px 16px;
                color: var(--description-foreground);
            }

            .empty-icon {
                font-size: 32px;
                margin-bottom: 12px;
            }

            .empty-text {
                font-size: 13px;
                margin-bottom: 4px;
            }

            .empty-hint {
                font-size: 11px;
                opacity: 0.7;
            }

            .stats-row {
                display: flex;
                align-items: center;
                gap: 16px;
                padding: 8px 12px;
                background: var(--editor-background);
                border-bottom: 1px solid var(--border-color);
            }

            .stat {
                display: flex;
                align-items: center;
                gap: 4px;
                font-size: 10px;
            }

            .stat-dot {
                width: 6px;
                height: 6px;
                border-radius: 50%;
            }

            .stat-dot.completed { background: var(--status-complete); }
            .stat-dot.in_progress { background: var(--status-active); }
            .stat-dot.pending { background: var(--status-pending); }
            .stat-dot.blocked { background: var(--status-blocked); }

            .stat-value {
                font-weight: 500;
                color: var(--foreground);
            }

            .stat-label {
                color: var(--description-foreground);
            }
        `
  ];
  __decorateClass([
    n4({ type: Object })
  ], FireIntentsView.prototype, "data", 2);
  FireIntentsView = __decorateClass([
    t3("fire-intents-view")
  ], FireIntentsView);

  // src/webview/components/fire/overview/fire-overview-view.ts
  var FireOverviewView = class extends BaseElement {
    render() {
      if (!this.data) {
        return b2`<div>Loading...</div>`;
      }
      const { project, workspace, standards, stats } = this.data;
      return b2`
            <div class="content">
                <!-- Project Info -->
                ${project ? b2`
                    <div class="section">
                        <div class="section-header">
                            <span class="section-icon">🔥</span>
                            <span class="section-title">Project</span>
                        </div>
                        <div class="card">
                            <div class="project-name">${project.name}</div>
                            ${project.description ? b2`
                                <div class="project-description">${project.description}</div>
                            ` : A}
                            <div class="project-meta">
                                <span class="fire-badge">🔥 FIRE v${project.fireVersion}</span>
                                <span class="meta-item">
                                    📅 Created ${this._formatDate(project.created)}
                                </span>
                            </div>
                        </div>
                    </div>
                ` : A}

                <!-- Stats -->
                <div class="section">
                    <div class="section-header">
                        <span class="section-icon">📊</span>
                        <span class="section-title">Progress</span>
                    </div>
                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-value">${stats.completedIntents}</div>
                            <div class="stat-label">Intents Done</div>
                            <div class="stat-sub">of ${stats.totalIntents}</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">${stats.completedWorkItems}</div>
                            <div class="stat-label">Work Items Done</div>
                            <div class="stat-sub">of ${stats.totalWorkItems}</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">${stats.totalRuns}</div>
                            <div class="stat-label">Total Runs</div>
                            <div class="stat-sub">${stats.completedRuns} completed</div>
                        </div>
                    </div>
                </div>

                <!-- Workspace Settings -->
                ${workspace ? b2`
                    <div class="section">
                        <div class="section-header">
                            <span class="section-icon">⚙️</span>
                            <span class="section-title">Workspace Settings</span>
                        </div>
                        <div class="card">
                            <div class="settings-grid">
                                <div class="setting-item">
                                    <span class="setting-label">Type</span>
                                    <span class="setting-value">${workspace.type}</span>
                                </div>
                                <div class="setting-item">
                                    <span class="setting-label">Structure</span>
                                    <span class="setting-value">${workspace.structure}</span>
                                </div>
                                <div class="setting-item">
                                    <span class="setting-label">Autonomy Bias</span>
                                    <span class="setting-value">${workspace.autonomyBias}</span>
                                </div>
                                <div class="setting-item">
                                    <span class="setting-label">Run Scope</span>
                                    <span class="setting-value">${workspace.runScopePreference}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ` : A}

                <!-- Standards -->
                <div class="section">
                    <div class="section-header">
                        <span class="section-icon">📚</span>
                        <span class="section-title">Standards</span>
                    </div>
                    ${standards.length > 0 ? b2`
                        <div class="standards-list">
                            ${standards.map((std) => b2`
                                <div class="standard-item" @click=${() => this._handleStandardClick(std)}>
                                    <span class="standard-icon">${this._getStandardIcon(std.type)}</span>
                                    <span class="standard-name">${std.type.replace(/-/g, " ")}</span>
                                    <span class="standard-arrow">→</span>
                                </div>
                            `)}
                        </div>
                    ` : b2`
                        <div class="empty-standards">
                            No standards defined yet
                        </div>
                    `}
                </div>

                <!-- Resources Footer -->
                <div class="resources-footer">
                    <div class="fabriqa-card">
                        <div class="fabriqa-brand">
                            <div class="fabriqa-mark">FA</div>
                            <div>
                                <div class="fabriqa-title">specs.md by Fabriqa.AI</div>
                                <div class="fabriqa-subtitle">Spec-native agentic development environment</div>
                            </div>
                        </div>
                        <div class="fabriqa-copy">
                            Use Fabriqa.AI with your existing AI subscription to design and reuse agentic workflows around your specs. Free to try.
                        </div>
                        <div class="fabriqa-actions">
                            <div class="fabriqa-link" @click=${() => this._openExternal("https://fabriqa.ai")}>Explore Fabriqa.AI</div>
                            <div class="fabriqa-link secondary" @click=${() => this._openExternal("https://specs.md")}>Open specs.md</div>
                        </div>
                        <div class="dashboard-tip">
                            <div class="dashboard-tip-title">Did you know?</div>
                            <div class="dashboard-tip-copy">
                                Use the dashboard outside VS Code with <code>npx specsmd@latest dashboard</code>.
                                <span class="feedback-link" @click=${() => this._openExternal("https://specs.md/getting-started/cli-dashboard")}>Docs</span>
                            </div>
                        </div>
                        <div class="footer-row">
                            <div class="resources-links">
                                <div class="resource-link" @click=${() => this._openExternal("https://specs.md")} title="Website">
                                    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                                    </svg>
                                </div>
                                <div class="resource-link" @click=${() => this._openExternal("https://discord.specs.md")} title="Discord">
                                    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                                    </svg>
                                </div>
                                <div class="resource-link" @click=${() => this._openExternal("https://x.com/specsmd")} title="X (Twitter)">
                                    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                                    </svg>
                                </div>
                            </div>
                            <div class="footer-feedback">
                                <span class="feedback-message">Help improve specs.md</span>
                                <span class="feedback-link" @click=${() => this._openExternal("https://specs.md/feedback")}>Feedback</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    _formatDate(dateStr) {
      try {
        return new Date(dateStr).toLocaleDateString();
      } catch {
        return dateStr;
      }
    }
    _getStandardIcon(type) {
      switch (type) {
        case "constitution":
          return "\u{1F4DC}";
        case "tech-stack":
          return "\u{1F6E0}\uFE0F";
        case "coding-standards":
          return "\u{1F4DD}";
        case "testing-standards":
          return "\u{1F9EA}";
        case "system-architecture":
          return "\u{1F3D7}\uFE0F";
        default:
          return "\u{1F4C4}";
      }
    }
    _handleStandardClick(standard) {
      this.dispatchEvent(new CustomEvent("open-file", {
        detail: { path: standard.filePath },
        bubbles: true,
        composed: true
      }));
    }
    _openExternal(url) {
      this.dispatchEvent(new CustomEvent("open-external", {
        detail: { url },
        bubbles: true,
        composed: true
      }));
    }
  };
  FireOverviewView.styles = [
    ...BaseElement.baseStyles,
    i`
            :host {
                display: flex;
                flex-direction: column;
                height: 100%;
                overflow: hidden;
            }

            .content {
                flex: 1;
                overflow-y: auto;
                padding: 12px;
            }

            .section {
                margin-bottom: 16px;
            }

            .section-header {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 8px;
            }

            .section-icon {
                font-size: 14px;
            }

            .section-title {
                font-size: 11px;
                font-weight: 600;
                text-transform: uppercase;
                color: var(--foreground);
                letter-spacing: 0.5px;
            }

            .card {
                background: var(--editor-background);
                border: 1px solid var(--border-color);
                border-radius: 6px;
                padding: 12px;
            }

            /* Project Info */
            .project-name {
                font-size: 16px;
                font-weight: 600;
                color: var(--foreground);
                margin-bottom: 4px;
            }

            .project-description {
                font-size: 12px;
                color: var(--description-foreground);
                margin-bottom: 8px;
            }

            .project-meta {
                display: flex;
                align-items: center;
                gap: 16px;
                font-size: 10px;
                color: var(--description-foreground);
            }

            .meta-item {
                display: flex;
                align-items: center;
                gap: 4px;
            }

            /* Stats Grid */
            .stats-grid {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 8px;
            }

            .stat-card {
                background: var(--background);
                border-radius: 4px;
                padding: 12px;
                text-align: center;
            }

            .stat-value {
                font-size: 20px;
                font-weight: 700;
                color: var(--status-active);
            }

            .stat-label {
                font-size: 9px;
                text-transform: uppercase;
                color: var(--description-foreground);
                margin-top: 2px;
            }

            .stat-sub {
                font-size: 10px;
                color: var(--description-foreground);
                margin-top: 4px;
            }

            /* Workspace Settings */
            .settings-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 8px;
            }

            .setting-item {
                display: flex;
                flex-direction: column;
                gap: 2px;
                padding: 8px;
                background: var(--background);
                border-radius: 4px;
            }

            .setting-label {
                font-size: 9px;
                text-transform: uppercase;
                color: var(--description-foreground);
            }

            .setting-value {
                font-size: 12px;
                font-weight: 500;
                color: var(--foreground);
                text-transform: capitalize;
            }

            /* Standards List */
            .standards-list {
                display: flex;
                flex-direction: column;
                gap: 4px;
            }

            .standard-item {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 8px;
                background: var(--background);
                border-radius: 4px;
                cursor: pointer;
                transition: background 0.15s ease;
            }

            .standard-item:hover {
                background: var(--editor-background);
                border: 1px solid var(--border-color);
                margin: -1px;
            }

            .standard-icon {
                font-size: 14px;
            }

            .standard-name {
                flex: 1;
                font-size: 12px;
                color: var(--foreground);
                text-transform: capitalize;
            }

            .standard-arrow {
                font-size: 10px;
                color: var(--description-foreground);
            }

            .empty-standards {
                padding: 16px;
                text-align: center;
                color: var(--description-foreground);
                font-size: 12px;
            }

            /* Fire Badge */
            .fire-badge {
                display: inline-flex;
                align-items: center;
                gap: 4px;
                padding: 2px 8px;
                background: rgba(249, 115, 22, 0.15);
                color: var(--status-active);
                border-radius: 4px;
                font-size: 10px;
                font-weight: 500;
            }

            /* Resources Footer */
            .resources-footer {
                margin-top: 14px;
            }

            .resources-links {
                display: inline-flex;
                flex-wrap: wrap;
                gap: 6px;
            }

            .resource-link {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: 28px;
                height: 28px;
                border-radius: 6px;
                background: var(--editor-background);
                border: 1px solid var(--border-color);
                cursor: pointer;
                transition: all 0.15s ease;
                color: var(--description-foreground);
            }

            .resource-link:hover {
                background: var(--vscode-list-hoverBackground);
                border-color: var(--status-active);
                color: var(--status-active);
            }

            .resource-link svg {
                width: 14px;
                height: 14px;
                fill: currentColor;
            }

            .feedback-message {
                display: inline;
                font-size: 11px;
                color: var(--description-foreground);
            }

            .feedback-link {
                color: var(--status-active);
                cursor: pointer;
                text-decoration: underline;
            }

            .feedback-link:hover {
                opacity: 0.8;
            }

            .fabriqa-card {
                padding: 10px;
                border: 1px solid rgba(249, 115, 22, 0.35);
                border-radius: 6px;
                background: linear-gradient(135deg, rgba(249, 115, 22, 0.08), rgba(34, 197, 94, 0.05));
            }

            .fabriqa-brand {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 6px;
            }

            .fabriqa-mark {
                display: flex;
                align-items: center;
                justify-content: center;
                flex: 0 0 26px;
                height: 26px;
                border-radius: 6px;
                background: var(--status-active);
                color: #ffffff;
                font-size: 10px;
                font-weight: 700;
            }

            .fabriqa-title {
                font-size: 13px;
                font-weight: 700;
                color: var(--foreground);
            }

            .fabriqa-subtitle,
            .fabriqa-copy,
            .dashboard-tip-copy {
                font-size: 11px;
                line-height: 1.45;
                color: var(--description-foreground);
            }

            .fabriqa-copy {
                margin-bottom: 8px;
            }

            .fabriqa-actions {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
            }

            .fabriqa-link {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                min-height: 26px;
                padding: 0 8px;
                border-radius: 5px;
                background: var(--status-active);
                color: #ffffff;
                font-size: 11px;
                font-weight: 600;
                cursor: pointer;
            }

            .fabriqa-link.secondary {
                border: 1px solid var(--border-color);
                background: var(--editor-background);
                color: var(--foreground);
            }

            .fabriqa-link:hover {
                opacity: 0.86;
            }

            .dashboard-tip {
                padding-top: 8px;
                margin-top: 8px;
                border-top: 1px solid var(--border-color);
            }

            .dashboard-tip-title {
                margin-bottom: 4px;
                color: var(--foreground);
                font-size: 11px;
                font-weight: 700;
            }

            .dashboard-tip code {
                padding: 1px 4px;
                border-radius: 4px;
                background: var(--background);
                color: var(--foreground);
                font-family: var(--font-family);
            }

            .footer-row {
                display: flex;
                flex-wrap: wrap;
                align-items: center;
                justify-content: space-between;
                gap: 8px;
                padding-top: 8px;
                margin-top: 8px;
                border-top: 1px solid var(--border-color);
            }

            .footer-feedback {
                display: flex;
                flex-wrap: wrap;
                align-items: center;
                gap: 6px;
            }
        `
  ];
  __decorateClass([
    n4({ type: Object })
  ], FireOverviewView.prototype, "data", 2);
  FireOverviewView = __decorateClass([
    t3("fire-overview-view")
  ], FireOverviewView);

  // src/webview/components/fire/fire-view.ts
  var FireView = class extends BaseElement {
    render() {
      if (!this.data) {
        return b2`<div class="loading">Loading FIRE view...</div>`;
      }
      return b2`
            <fire-view-tabs
                activeTab=${this.data.activeTab}
                @tab-change=${this._handleTabChange}
            ></fire-view-tabs>

            <div class="view-content">
                ${this._renderActiveView()}
            </div>
        `;
    }
    _renderActiveView() {
      switch (this.data.activeTab) {
        case "runs":
          return b2`
                    <fire-runs-view
                        .data=${this.data.runsData}
                        @continue-run=${this._forwardEvent}
                        @start-run=${this._forwardEvent}
                        @view-artifact=${this._forwardEvent}
                        @view-run=${this._forwardEvent}
                        @open-file=${this._forwardEvent}
                    ></fire-runs-view>
                `;
        case "intents":
          return b2`
                    <fire-intents-view
                        .data=${this.data.intentsData}
                        @filter-change=${this._forwardEvent}
                        @toggle-expand=${this._forwardEvent}
                        @open-file=${this._forwardEvent}
                    ></fire-intents-view>
                `;
        case "overview":
          return b2`
                    <fire-overview-view
                        .data=${this.data.overviewData}
                        @open-file=${this._forwardEvent}
                        @open-external=${this._forwardEvent}
                    ></fire-overview-view>
                `;
        default:
          return A;
      }
    }
    _handleTabChange(e7) {
      e7.stopPropagation();
      this.dispatchEvent(new CustomEvent("tab-change", {
        detail: e7.detail,
        bubbles: true,
        composed: true
      }));
    }
    _forwardEvent(e7) {
      e7.stopPropagation();
      this.dispatchEvent(new CustomEvent(e7.type, {
        detail: e7.detail,
        bubbles: true,
        composed: true
      }));
    }
  };
  FireView.styles = [
    ...BaseElement.baseStyles,
    i`
            :host {
                display: flex;
                flex-direction: column;
                height: 100%;
                overflow: hidden;
            }

            .view-content {
                flex: 1;
                overflow: hidden;
            }

            .loading {
                display: flex;
                align-items: center;
                justify-content: center;
                height: 100%;
                color: var(--description-foreground);
            }
        `
  ];
  __decorateClass([
    n4({ type: Object })
  ], FireView.prototype, "data", 2);
  FireView = __decorateClass([
    t3("fire-view")
  ], FireView);

  // src/webview/vscode-api.ts
  function createStandaloneApi() {
    const stateKey = "specsmd:webview-state";
    let state2 = null;
    let eventsConnected = false;
    try {
      const stored = typeof localStorage !== "undefined" ? localStorage.getItem(stateKey) : null;
      if (stored !== null) {
        state2 = JSON.parse(stored);
      }
    } catch {
      state2 = null;
    }
    const connectEvents = () => {
      if (eventsConnected || typeof EventSource !== "function") {
        return;
      }
      eventsConnected = true;
      const events = new EventSource("/events");
      events.addEventListener("message", (event) => {
        try {
          window.dispatchEvent(new MessageEvent("message", {
            data: JSON.parse(event.data)
          }));
        } catch {
        }
      });
      events.addEventListener("snapshot", (event) => {
        try {
          window.dispatchEvent(new MessageEvent("message", {
            data: JSON.parse(event.data)
          }));
        } catch {
        }
      });
    };
    connectEvents();
    return {
      postMessage(message) {
        if (isStandaloneStartRunMessage(message)) {
          window.dispatchEvent(new CustomEvent("specsmd-dashboard-command", {
            detail: {
              command: buildFireStartRunCommand(message.workItemIds),
              workItemIds: message.workItemIds
            }
          }));
          return;
        }
        fetch("/api/message", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(message)
        }).catch(() => {
        });
      },
      getState() {
        return state2;
      },
      setState(nextState) {
        state2 = nextState;
        try {
          if (typeof localStorage !== "undefined") {
            localStorage.setItem(stateKey, JSON.stringify(nextState));
          }
        } catch {
        }
      }
    };
  }
  function isStandaloneStartRunMessage(message) {
    return typeof message === "object" && message !== null && message.type === "startRun" && Array.isArray(message.workItemIds);
  }
  function buildFireStartRunCommand(workItemIds) {
    const ids = workItemIds.map((id) => String(id).trim()).filter(Boolean);
    return ["/specsmd-fire-builder", ...ids].join(" ");
  }
  var vscode = typeof acquireVsCodeApi === "function" ? acquireVsCodeApi() : createStandaloneApi();

  // src/webview/components/app.ts
  var SpecsmdApp = class extends BaseElement {
    constructor() {
      super(...arguments);
      this._activeTab = "bolts";
      this._boltsData = null;
      this._specsHtml = "";
      this._overviewHtml = "";
      this._loaded = false;
      this._activeFlow = null;
      this._availableFlows = [];
      this._fireData = null;
      this._fireActiveTab = "runs";
      this._theme = "dark";
      /**
       * Version counter for specs HTML to track when handlers need reattachment.
       * Incremented each time _specsHtml changes.
       */
      this._specsVersion = 0;
      /**
       * Last attached specs version to prevent duplicate handler attachment.
       */
      this._lastAttachedSpecsVersion = -1;
      /**
       * Handle messages from the extension.
       */
      this._handleMessage = (event) => {
        const message = event.data;
        switch (message.type) {
          case "setData":
            if (message.activeTab) {
              this._activeTab = message.activeTab;
            }
            if (message.boltsData !== void 0) {
              this._boltsData = message.boltsData;
            }
            if (message.specsHtml !== void 0) {
              this._specsHtml = message.specsHtml;
              this._specsVersion++;
            }
            if (message.overviewHtml !== void 0) {
              this._overviewHtml = message.overviewHtml;
            }
            if (message.fireData !== void 0) {
              this._fireData = message.fireData;
              this._fireActiveTab = message.fireData.activeTab;
            }
            if (message.availableFlows !== void 0) {
              this._availableFlows = message.availableFlows;
            }
            if (message.activeFlowId !== void 0 && this._availableFlows.length > 0) {
              this._activeFlow = this._availableFlows.find((f3) => f3.id === message.activeFlowId) || null;
            }
            if (!this._activeFlow && this._availableFlows.length > 0) {
              this._activeFlow = this._availableFlows.find((f3) => f3.id === "fire") || this._availableFlows.find((f3) => f3.id === "aidlc") || this._availableFlows[0];
            }
            this._loaded = true;
            break;
          case "setBoltsData":
            if (message.boltsData !== void 0) {
              this._boltsData = message.boltsData;
            }
            break;
          case "setTab":
            if (message.activeTab) {
              this._activeTab = message.activeTab;
            }
            break;
          case "switchFlow":
            if (message.availableFlows !== void 0) {
              this._availableFlows = message.availableFlows;
            }
            if (message.activeFlowId !== void 0) {
              this._activeFlow = this._availableFlows.find((f3) => f3.id === message.activeFlowId) || null;
            }
            if (!this._activeFlow && this._availableFlows.length > 0) {
              this._activeFlow = this._availableFlows.find((f3) => f3.id === "fire") || this._availableFlows.find((f3) => f3.id === "aidlc") || this._availableFlows[0];
            }
            if (message.boltsData !== void 0) {
              this._boltsData = message.boltsData;
            }
            if (message.specsHtml !== void 0) {
              this._specsHtml = message.specsHtml;
              this._specsVersion++;
            }
            if (message.overviewHtml !== void 0) {
              this._overviewHtml = message.overviewHtml;
            }
            if (message.fireData !== void 0) {
              this._fireData = message.fireData;
              this._fireActiveTab = message.fireData.activeTab;
            }
            break;
          case "updateFlows":
            if (message.availableFlows !== void 0) {
              this._availableFlows = message.availableFlows;
            }
            if (message.activeFlowId !== void 0) {
              this._activeFlow = this._availableFlows.find((f3) => f3.id === message.activeFlowId) || null;
            }
            if (!this._activeFlow && this._availableFlows.length > 0) {
              this._activeFlow = this._availableFlows.find((f3) => f3.id === "fire") || this._availableFlows.find((f3) => f3.id === "aidlc") || this._availableFlows[0];
            }
            break;
        }
      };
    }
    connectedCallback() {
      super.connectedCallback();
      this._theme = getInitialTheme(vscode.getState());
      this._applyTheme(this._theme);
      vscode.setState(this._theme);
      window.addEventListener("message", this._handleMessage);
      vscode.postMessage({ type: "ready" });
    }
    disconnectedCallback() {
      super.disconnectedCallback();
      window.removeEventListener("message", this._handleMessage);
    }
    /**
     * Called after render. Attach event handlers to server-rendered HTML.
     */
    updated(changedProperties) {
      super.updated(changedProperties);
      if (changedProperties.has("_specsHtml") || changedProperties.has("_activeTab")) {
        requestAnimationFrame(() => this._attachSpecsViewHandlers());
      }
      if (changedProperties.has("_overviewHtml") || changedProperties.has("_activeTab")) {
        requestAnimationFrame(() => this._attachOverviewViewHandlers());
      }
    }
    /**
     * Attach event handlers to specs view server-rendered HTML.
     * Uses version counter to prevent duplicate listener attachment.
     */
    _attachSpecsViewHandlers() {
      const specsView = this.shadowRoot?.querySelector("#specs-view");
      if (!specsView) return;
      if (this._lastAttachedSpecsVersion === this._specsVersion) return;
      this._lastAttachedSpecsVersion = this._specsVersion;
      specsView.querySelectorAll(".intent-header").forEach((header) => {
        header.addEventListener("click", (e7) => {
          if (e7.target.closest(".spec-open-btn")) {
            return;
          }
          header.parentElement?.classList.toggle("collapsed");
        });
      });
      specsView.querySelectorAll(".intent-open-btn").forEach((btn) => {
        const htmlBtn = btn;
        btn.addEventListener("click", (e7) => {
          e7.stopPropagation();
          const path = htmlBtn.dataset.path;
          if (path) {
            vscode.postMessage({ type: "openArtifact", kind: "intent", path });
          }
        });
      });
      specsView.querySelectorAll(".unit-header").forEach((header) => {
        header.addEventListener("click", (e7) => {
          if (e7.target.closest(".spec-open-btn")) {
            return;
          }
          e7.stopPropagation();
          header.parentElement?.classList.toggle("collapsed");
        });
      });
      specsView.querySelectorAll(".unit-open-btn").forEach((btn) => {
        const htmlBtn = btn;
        btn.addEventListener("click", (e7) => {
          e7.stopPropagation();
          const path = htmlBtn.dataset.path;
          if (path) {
            vscode.postMessage({ type: "openArtifact", kind: "unit", path });
          }
        });
      });
      specsView.querySelectorAll(".spec-story-item").forEach((item) => {
        const htmlItem = item;
        item.addEventListener("click", (e7) => {
          e7.stopPropagation();
          const path = htmlItem.dataset.path;
          if (path) {
            vscode.postMessage({ type: "openArtifact", kind: "story", path });
          }
        });
      });
      const specsFilter = specsView.querySelector("#specsFilter");
      if (specsFilter) {
        specsFilter.addEventListener("change", () => {
          vscode.postMessage({ type: "specsFilter", filter: specsFilter.value });
        });
      }
    }
    /**
     * Attach event handlers to overview view server-rendered HTML.
     * Uses data attribute to prevent duplicate listener attachment.
     */
    _attachOverviewViewHandlers() {
      const overviewView = this.shadowRoot?.querySelector("#overview-view");
      if (!overviewView) return;
      const currentHtmlHash = this._overviewHtml.length.toString();
      if (overviewView.dataset.handlersAttached === currentHtmlHash) return;
      overviewView.dataset.handlersAttached = currentHtmlHash;
      overviewView.querySelectorAll(".overview-list-item").forEach((item) => {
        const htmlItem = item;
        item.addEventListener("click", () => {
          const path = htmlItem.dataset.path;
          const intent = htmlItem.dataset.intent;
          const actionType = htmlItem.dataset.actionType;
          if (path) {
            vscode.postMessage({ type: "openArtifact", kind: "standard", path });
          } else if (intent) {
            this._activeTab = "specs";
            vscode.postMessage({ type: "tabChange", tab: "specs" });
          } else if (actionType) {
            const targetId = htmlItem.dataset.targetId;
            this._handleSuggestedAction(actionType, targetId);
          }
        });
      });
      overviewView.querySelectorAll(".overview-resource-link, .overview-fabriqa-link").forEach((link) => {
        const htmlLink = link;
        link.addEventListener("click", () => {
          const url = htmlLink.dataset.url;
          if (url) {
            vscode.postMessage({ type: "openExternal", url });
          }
        });
      });
      const feedbackLink = overviewView.querySelector(".overview-feedback-link");
      if (feedbackLink) {
        feedbackLink.addEventListener("click", () => {
          const url = feedbackLink.dataset.url;
          if (url) {
            vscode.postMessage({ type: "openExternal", url });
          }
        });
      }
    }
    /**
     * Handle suggested action clicks.
     */
    _handleSuggestedAction(actionType, targetId) {
      switch (actionType) {
        case "continue-bolt":
        case "start-bolt":
        case "unblock-bolt":
          if (targetId) {
            vscode.postMessage({ type: "startBolt", boltId: targetId });
          }
          break;
        case "complete-stage":
          if (targetId) {
            vscode.postMessage({ type: "continueBolt", boltId: targetId, boltName: targetId });
          }
          break;
      }
    }
    render() {
      if (!this._loaded) {
        return b2`
                <div class="shell">
                    <div class="shell-chrome">
                        <div class="shell-brand">
                            <span class="shell-mark">⚡</span>
                            <div class="shell-brand-copy">
                                <div class="shell-title">SpecsMD</div>
                                <div class="shell-subtitle">Loading dashboard</div>
                            </div>
                        </div>
                        <div class="shell-actions">
                            ${this._renderThemeToggle()}
                        </div>
                    </div>
                    <div class="loading">Loading...</div>
                </div>
            `;
      }
      const isFireFlow = this._activeFlow?.id === "fire";
      return b2`
            <div class="shell">
                <div class="shell-chrome">
                    <div class="shell-brand">
                        <span class="shell-mark">⚡</span>
                        <div class="shell-brand-copy">
                            <div class="shell-title">SpecsMD</div>
                            <div class="shell-subtitle">${isFireFlow ? "FIRE dashboard" : "AI-DLC dashboard"}</div>
                        </div>
                    </div>
                    <div class="shell-actions">
                        ${this._renderThemeToggle()}
                    </div>
                </div>

                <div class="app-body">
                    ${isFireFlow ? this._renderFireApp() : this._renderAidlcApp()}
                </div>
            </div>
        `;
    }
    /**
     * Render the AI-DLC flow app (existing implementation).
     */
    _renderAidlcApp() {
      return b2`
            <flow-switcher
                .activeFlow=${this._activeFlow}
                .availableFlows=${this._availableFlows}
                @flow-switch=${this._handleFlowSwitch}
            ></flow-switcher>

            <view-tabs
                .activeTab=${this._activeTab}
                @tab-change=${this._handleTabChange}
            ></view-tabs>

            <div class="view-container ${this._activeTab === "bolts" ? "active" : ""}" id="bolts-view">
                ${this._boltsData ? b2`
                        <bolts-view
                            .data=${this._boltsData}
                            @toggle-focus=${this._handleToggleFocus}
                            @filter-change=${this._handleFilterChange}
                            @resize=${this._handleResize}
                            @start-bolt=${this._handleStartBolt}
                            @continue-bolt=${this._handleContinueBolt}
                            @view-files=${this._handleViewFiles}
                            @open-file=${this._handleOpenFile}
                            @open-bolt=${this._handleOpenBolt}>
                        </bolts-view>
                    ` : b2`<div class="loading">Loading...</div>`}
            </div>

            <div class="view-container ${this._activeTab === "specs" ? "active" : ""}" id="specs-view">
                ${o6(this._specsHtml)}
            </div>

            <div class="view-container ${this._activeTab === "overview" ? "active" : ""}" id="overview-view">
                ${o6(this._overviewHtml)}
            </div>
        `;
    }
    /**
     * Render the FIRE flow app with proper visualization.
     */
    _renderFireApp() {
      if (!this._fireData) {
        return b2`
                <flow-switcher
                    .activeFlow=${this._activeFlow}
                    .availableFlows=${this._availableFlows}
                    @flow-switch=${this._handleFlowSwitch}
                ></flow-switcher>

                <div class="fire-app" style="flex: 1; display: flex; flex-direction: column; overflow: hidden;">
                    <div class="fire-placeholder" style="flex: 1; display: flex; align-items: center; justify-content: center;">
                        <div style="text-align: center; padding: 24px;">
                            <div style="font-size: 64px; margin-bottom: 16px;">🔥</div>
                            <h2 style="margin: 0 0 8px 0; color: var(--vscode-foreground); font-size: 18px;">FIRE Flow</h2>
                            <p style="color: var(--vscode-descriptionForeground); margin: 0; font-size: 13px;">
                                Loading...
                            </p>
                        </div>
                    </div>
                </div>
            `;
      }
      return b2`
            <flow-switcher
                .activeFlow=${this._activeFlow}
                .availableFlows=${this._availableFlows}
                @flow-switch=${this._handleFlowSwitch}
            ></flow-switcher>

            <fire-view
                .data=${this._fireData}
                @tab-change=${this._handleFireTabChange}
                @continue-run=${this._handleContinueRun}
                @start-run=${this._handleStartRun}
                @view-artifact=${this._handleViewArtifact}
                @view-run=${this._handleViewRun}
                @open-file=${this._handleFireOpenFile}
                @filter-change=${this._handleFireFilterChange}
                @toggle-expand=${this._handleFireToggleExpand}
                @open-external=${this._handleOpenExternal}
            ></fire-view>
        `;
    }
    /**
     * Render the theme toggle control.
     */
    _renderThemeToggle() {
      const isDark = this._theme === "dark";
      const nextTheme = isDark ? "light" : "dark";
      const label = isDark ? "Light" : "Dark";
      const title = `Switch to ${nextTheme} mode`;
      const icon = isDark ? w`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 8.25A3.75 3.75 0 1 0 12 15.75 3.75 3.75 0 0 0 12 8.25Zm0-6a1 1 0 0 1 1 1.06l-.05 1.94a1 1 0 1 1-2 0l-.05-1.94A1 1 0 0 1 12 2.25Zm0 16.5a1 1 0 0 1 1 1.06l-.05 1.94a1 1 0 1 1-2 0l-.05-1.94a1 1 0 0 1 1.05-1.06Zm10.5-6a1 1 0 0 1-1.06 1l-1.94-.05a1 1 0 1 1 0-2l1.94-.05a1 1 0 0 1 1.06 1.1ZM4.5 12a1 1 0 0 1-1.06 1l-1.94-.05a1 1 0 1 1 0-2l1.94-.05A1 1 0 0 1 4.5 12Zm14.45-7.95a1 1 0 0 1 .04 1.41l-1.37 1.37a1 1 0 1 1-1.41-1.41l1.37-1.37a1 1 0 0 1 1.37 0Zm-11.14 11.1a1 1 0 0 1 .04 1.41l-1.37 1.37a1 1 0 1 1-1.41-1.41l1.37-1.37a1 1 0 0 1 1.37 0Zm11.14 2.78a1 1 0 0 1-1.41.04l-1.37-1.37a1 1 0 1 1 1.41-1.41l1.37 1.37a1 1 0 0 1 0 1.37ZM7.81 7.81a1 1 0 0 1-1.41.04L5.03 6.48a1 1 0 1 1 1.41-1.41l1.37 1.37a1 1 0 0 1 0 1.37Z"/></svg>` : w`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21.75 14.2A9.7 9.7 0 0 1 9.8 2.25a1 1 0 0 0-1.16 1.16 8.5 8.5 0 1 0 12.95 11.95 1 1 0 0 0 .16-1.16Z"/></svg>`;
      return b2`
            <button
                class="theme-toggle"
                type="button"
                title=${title}
                aria-label=${title}
                @click=${this._toggleTheme}
            >
                <span class="theme-toggle-icon">${icon}</span>
                <span class="theme-toggle-text">${label}</span>
            </button>
        `;
    }
    // ==================== FIRE Event Handlers ====================
    _handleFireTabChange(e7) {
      this._fireActiveTab = e7.detail.tab;
      if (this._fireData) {
        this._fireData = { ...this._fireData, activeTab: e7.detail.tab };
      }
      vscode.postMessage({ type: "fireTabChange", tab: e7.detail.tab });
    }
    _handleContinueRun(e7) {
      vscode.postMessage({ type: "continueRun", runId: e7.detail.runId });
    }
    _handleStartRun(e7) {
      vscode.postMessage({ type: "startRun", workItemIds: e7.detail.workItemIds });
    }
    _handleViewArtifact(e7) {
      vscode.postMessage({ type: "viewArtifact", runId: e7.detail.runId, artifact: e7.detail.artifact });
    }
    _handleViewRun(e7) {
      vscode.postMessage({ type: "viewRun", runId: e7.detail.runId, folderPath: e7.detail.folderPath });
    }
    _handleFireOpenFile(e7) {
      if (e7.detail.path) {
        vscode.postMessage({ type: "openArtifact", kind: "file", path: e7.detail.path });
      } else if (e7.detail.id && e7.detail.intentId) {
        vscode.postMessage({ type: "openWorkItem", id: e7.detail.id, intentId: e7.detail.intentId });
      }
    }
    _handleFireFilterChange(e7) {
      if (this._fireData) {
        this._fireData = {
          ...this._fireData,
          intentsData: {
            ...this._fireData.intentsData,
            filter: e7.detail.filter
          }
        };
      }
      vscode.postMessage({ type: "fireIntentsFilter", filter: e7.detail.filter });
    }
    _handleFireToggleExpand(e7) {
      vscode.postMessage({ type: "fireToggleExpand", intentId: e7.detail.intentId, expanded: e7.detail.expanded });
    }
    _handleOpenExternal(e7) {
      vscode.postMessage({ type: "openExternal", url: e7.detail.url });
    }
    _handleFlowSwitch(e7) {
      vscode.postMessage({ type: "switchFlow" });
    }
    /**
     * Toggle the dashboard theme and persist it locally.
     */
    _toggleTheme() {
      this._theme = this._theme === "dark" ? "light" : "dark";
      this._applyTheme(this._theme);
      vscode.setState(this._theme);
      persistTheme(this._theme);
    }
    /**
     * Apply the selected theme to the document root.
     */
    _applyTheme(theme) {
      applyTheme(theme, document.documentElement);
    }
    /**
     * Handle tab change from the tabs component.
     */
    _handleTabChange(e7) {
      this._activeTab = e7.detail.tab;
      vscode.postMessage({ type: "tabChange", tab: e7.detail.tab });
    }
    /**
     * Handle focus card toggle.
     */
    _handleToggleFocus(e7) {
      vscode.postMessage({ type: "toggleFocus", expanded: e7.detail.expanded });
      if (this._boltsData) {
        this._boltsData = { ...this._boltsData, focusCardExpanded: e7.detail.expanded };
      }
    }
    /**
     * Handle activity filter change.
     */
    _handleFilterChange(e7) {
      vscode.postMessage({ type: "activityFilter", filter: e7.detail.filter });
      if (this._boltsData) {
        this._boltsData = { ...this._boltsData, activityFilter: e7.detail.filter };
      }
    }
    /**
     * Handle activity section resize.
     */
    _handleResize(e7) {
      vscode.postMessage({ type: "activityResize", height: e7.detail.height });
      if (this._boltsData) {
        this._boltsData = { ...this._boltsData, activityHeight: e7.detail.height };
      }
    }
    /**
     * Handle start bolt button.
     */
    _handleStartBolt(e7) {
      vscode.postMessage({ type: "startBolt", boltId: e7.detail.boltId });
    }
    /**
     * Handle open file from activity.
     */
    _handleOpenFile(e7) {
      vscode.postMessage({ type: "openArtifact", kind: "file", path: e7.detail.path });
    }
    /**
     * Handle continue bolt button - shows agent prompt.
     */
    _handleContinueBolt(e7) {
      vscode.postMessage({ type: "continueBolt", boltId: e7.detail.boltId, boltName: e7.detail.boltName });
    }
    /**
     * Handle view files button - opens bolt files.
     */
    _handleViewFiles(e7) {
      vscode.postMessage({ type: "viewBoltFiles", boltId: e7.detail.boltId });
    }
    /**
     * Handle open bolt button - opens bolt.md file.
     */
    _handleOpenBolt(e7) {
      vscode.postMessage({ type: "openBoltMd", boltId: e7.detail.boltId });
    }
  };
  SpecsmdApp.styles = [
    ...BaseElement.baseStyles,
    i`
            :host {
                display: block;
                height: 100vh;
                overflow: hidden;
                position: relative;
                background: var(--background);
            }

            .shell {
                display: flex;
                flex-direction: column;
                position: absolute;
                inset: 0;
                width: 100%;
                height: 100%;
                min-height: 0;
                overflow: hidden;
            }

            .shell-chrome {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 12px;
                padding: 10px 12px;
                background: linear-gradient(180deg, var(--editor-background) 0%, var(--vscode-sideBarSectionHeader-background) 100%);
                border-bottom: 1px solid var(--border-color);
            }

            .shell-brand {
                display: flex;
                align-items: center;
                gap: 10px;
                min-width: 0;
            }

            .shell-mark {
                width: 24px;
                height: 24px;
                border-radius: 6px;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                background: var(--accent-primary);
                color: #ffffff;
                font-size: 13px;
                flex-shrink: 0;
            }

            .shell-brand-copy {
                min-width: 0;
            }

            .shell-title {
                font-size: 12px;
                font-weight: 600;
                line-height: 1.2;
            }

            .shell-subtitle {
                font-size: 10px;
                color: var(--description-foreground);
                line-height: 1.2;
            }

            .shell-actions {
                display: flex;
                align-items: center;
                gap: 8px;
                flex-shrink: 0;
            }

            .theme-toggle {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                padding: 6px 10px;
                border-radius: 6px;
                border: 1px solid var(--border-color);
                background: var(--vscode-input-background);
                color: var(--foreground);
                font-size: 11px;
                font-weight: 500;
                transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
            }

            .theme-toggle:hover {
                background: var(--vscode-list-hoverBackground);
                border-color: var(--accent-primary);
            }

            .theme-toggle-icon {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: 14px;
                height: 14px;
                flex-shrink: 0;
            }

            .theme-toggle-icon svg {
                width: 14px;
                height: 14px;
                fill: currentColor;
            }

            .theme-toggle-text {
                min-width: 0;
            }

            .app-body {
                display: flex;
                flex-direction: column;
                flex: 1;
                min-height: 0;
                overflow: hidden;
            }

            .view-container {
                flex: 1;
                min-height: 0;
                overflow-y: auto;
                display: none;
            }

            .view-container.active {
                display: flex;
                flex-direction: column;
                min-height: 0;
            }

            bolts-view {
                flex: 1;
                min-height: 0;
            }

            .loading {
                display: flex;
                align-items: center;
                justify-content: center;
                height: 100%;
                color: var(--description-foreground);
            }

            /* ==================== SPECS VIEW ==================== */
            .specs-toolbar {
                padding: 8px 12px;
                background: var(--vscode-sideBarSectionHeader-background);
                border-bottom: 1px solid var(--border-color);
                display: flex;
                gap: 8px;
                align-items: center;
            }

            .specs-toolbar-label {
                font-size: 9px;
                color: var(--description-foreground);
                text-transform: uppercase;
            }

            .specs-toolbar-select {
                flex: 1;
                padding: 5px 8px;
                font-size: 10px;
                background: var(--vscode-input-background);
                border: 1px solid var(--border-color);
                color: var(--foreground);
                border-radius: 4px;
                cursor: pointer;
            }

            .specs-content {
                flex: 1;
                overflow-y: auto;
            }

            .intent-item {
                border-bottom: 1px solid var(--border-color);
            }

            .intent-header {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 10px 12px;
                cursor: pointer;
                transition: background 0.15s;
            }

            .intent-header:hover {
                background: var(--editor-background);
            }

            .intent-expand {
                font-size: 10px;
                color: var(--description-foreground);
                transition: transform 0.2s;
            }

            .intent-item.collapsed .intent-expand {
                transform: rotate(-90deg);
            }

            .intent-icon {
                font-size: 14px;
            }

            .intent-info {
                flex: 1;
            }

            .intent-name {
                font-size: 12px;
                font-weight: 500;
            }

            .intent-meta {
                font-size: 10px;
                color: var(--description-foreground);
                margin-top: 2px;
            }

            .intent-progress-ring {
                width: 28px;
                height: 28px;
                position: relative;
            }

            .intent-progress-ring svg {
                transform: rotate(-90deg);
            }

            .intent-progress-ring .ring-bg {
                fill: none;
                stroke: var(--vscode-input-background);
                stroke-width: 3;
            }

            .intent-progress-ring .ring-fill {
                fill: none;
                stroke: var(--status-complete);
                stroke-width: 3;
                stroke-linecap: round;
                stroke-dasharray: 69.115;
            }

            .intent-progress-text {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                font-size: 8px;
                font-weight: 600;
            }

            .intent-content {
                max-height: 2000px;
                overflow: hidden;
                transition: max-height 0.3s ease;
                background: var(--editor-background);
            }

            .intent-item.collapsed .intent-content {
                max-height: 0;
            }

            .unit-item {
                border-bottom: 1px solid var(--border-color);
            }

            .unit-header {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 8px 12px 8px 28px;
                cursor: pointer;
                transition: background 0.15s;
            }

            .unit-header:hover {
                background: var(--vscode-list-hoverBackground);
            }

            .unit-expand {
                font-size: 10px;
                color: var(--description-foreground);
                transition: transform 0.2s;
            }

            .unit-item.collapsed .unit-expand {
                transform: rotate(-90deg);
            }

            .unit-icon {
                font-size: 12px;
            }

            .unit-status {
                width: 16px;
                height: 16px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 9px;
                color: white;
            }

            .unit-status.complete { background: var(--status-complete); }
            .unit-status.active { background: var(--status-active); }
            .unit-status.pending {
                background: var(--vscode-input-background);
                border: 1px dashed var(--border-color);
                color: var(--description-foreground);
            }

            .unit-name {
                flex: 1;
                font-size: 11px;
            }

            /* Spec open buttons (magnifier icons) */
            .spec-open-btn {
                background: none;
                border: none;
                color: var(--description-foreground);
                cursor: pointer;
                padding: 4px;
                font-size: 12px;
                border-radius: 4px;
                opacity: 0;
                transition: all 0.15s;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .intent-header:hover .spec-open-btn,
            .unit-header:hover .spec-open-btn {
                opacity: 0.7;
            }

            .spec-open-btn:hover {
                opacity: 1 !important;
                background: var(--vscode-list-hoverBackground);
                color: var(--foreground);
            }

            .unit-progress {
                font-size: 9px;
                color: var(--description-foreground);
            }

            .unit-content {
                max-height: 1000px;
                overflow: hidden;
                transition: max-height 0.3s ease;
            }

            .unit-item.collapsed .unit-content {
                max-height: 0;
            }

            .spec-story-item {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 6px 12px 6px 52px;
                cursor: pointer;
                transition: background 0.15s;
            }

            .spec-story-item:hover {
                background: var(--vscode-list-hoverBackground);
            }

            .spec-story-icon {
                font-size: 11px;
                opacity: 0.7;
            }

            .spec-story-status {
                width: 12px;
                height: 12px;
                border-radius: 50%;
                border: 2px solid var(--border-color);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 8px;
            }

            .spec-story-status.complete {
                background: var(--status-complete);
                border-color: var(--status-complete);
                color: white;
            }

            .spec-story-status.active {
                background: var(--status-active);
                border-color: var(--status-active);
                color: white;
            }

            .spec-story-name {
                flex: 1;
                font-size: 11px;
            }

            .spec-story-name.complete {
                color: var(--description-foreground);
            }

            .spec-no-stories {
                padding: 8px 12px 8px 52px;
                font-size: 11px;
                font-style: italic;
                color: var(--description-foreground);
            }

            /* ==================== OVERVIEW VIEW ==================== */
            .overview-content {
                padding: 16px;
            }

            .overview-section {
                margin-bottom: 20px;
            }

            .overview-section-title {
                font-size: 10px;
                font-weight: 600;
                text-transform: uppercase;
                color: var(--description-foreground);
                margin-bottom: 10px;
            }

            .overview-metrics {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 10px;
            }

            .overview-metric-card {
                background: var(--editor-background);
                border-radius: 8px;
                padding: 16px;
                text-align: center;
            }

            .overview-metric-value {
                font-size: 28px;
                font-weight: 700;
                margin-bottom: 4px;
            }

            .overview-metric-value.highlight { color: var(--status-active); }
            .overview-metric-value.success { color: var(--status-complete); }

            .overview-metric-label {
                font-size: 10px;
                color: var(--description-foreground);
            }

            .overview-progress-bar {
                height: 8px;
                background: var(--vscode-input-background);
                border-radius: 4px;
                overflow: hidden;
                margin-bottom: 20px;
            }

            .overview-progress-fill {
                height: 100%;
                background: linear-gradient(90deg, var(--status-complete), var(--status-active));
                border-radius: 4px;
                transition: width 0.5s ease;
            }

            .overview-list {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }

            .overview-list-item {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 10px 12px;
                background: var(--editor-background);
                border-radius: 6px;
                cursor: pointer;
                transition: all 0.15s;
            }

            .overview-list-item:hover {
                background: var(--vscode-list-hoverBackground);
            }

            .overview-list-icon {
                width: 32px;
                height: 32px;
                border-radius: 6px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 14px;
            }

            .overview-list-icon.intent {
                background: rgba(139, 92, 246, 0.2);
                color: #8b5cf6;
            }

            .overview-list-icon.action {
                background: rgba(249, 115, 22, 0.2);
                color: var(--status-active);
            }

            .overview-list-icon.bolt {
                background: rgba(249, 115, 22, 0.2);
                color: var(--status-active);
            }

            .overview-list-info {
                flex: 1;
            }

            .overview-list-name {
                font-size: 12px;
                font-weight: 500;
            }

            .overview-list-meta {
                font-size: 10px;
                color: var(--description-foreground);
                margin-top: 2px;
            }

            .overview-list-progress {
                font-size: 11px;
                font-weight: 600;
                color: var(--status-complete);
            }

            /* ==================== OVERVIEW RESOURCES FOOTER ==================== */
            .overview-resources-footer {
                margin-top: 14px;
            }

            .overview-fabriqa-card {
                padding: 10px;
                border: 1px solid var(--border-color);
                border-radius: 6px;
                background: var(--editor-background);
            }

            .overview-fabriqa-brand {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 6px;
            }

            .overview-fabriqa-mark {
                width: 26px;
                height: 26px;
                border-radius: 6px;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                background: var(--accent-primary);
                color: #ffffff;
                font-size: 10px;
                font-weight: 700;
                flex-shrink: 0;
            }

            .overview-fabriqa-title {
                font-size: 13px;
                font-weight: 700;
                color: var(--foreground);
                line-height: 1.25;
            }

            .overview-fabriqa-subtitle,
            .overview-fabriqa-copy,
            .overview-dashboard-copy {
                color: var(--description-foreground);
                font-size: 11px;
                line-height: 1.45;
            }

            .overview-fabriqa-copy {
                margin-bottom: 8px;
            }

            .overview-fabriqa-actions {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
            }

            .overview-fabriqa-link {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                min-height: 26px;
                padding: 0 8px;
                border-radius: 5px;
                background: var(--accent-primary);
                color: #ffffff;
                font-size: 11px;
                font-weight: 700;
                cursor: pointer;
            }

            .overview-fabriqa-link.secondary {
                background: var(--vscode-input-background);
                color: var(--foreground);
                border: 1px solid var(--border-color);
            }

            .overview-fabriqa-link:hover {
                opacity: 0.88;
            }

            .overview-dashboard-tip {
                padding-top: 8px;
                margin-top: 8px;
                border-top: 1px solid var(--border-color);
            }

            .overview-dashboard-title {
                margin-bottom: 4px;
                color: var(--foreground);
                font-size: 12px;
                font-weight: 700;
            }

            .overview-dashboard-tip code {
                padding: 1px 4px;
                border-radius: 4px;
                background: var(--editor-background);
                color: var(--foreground);
            }

            .overview-resources-links {
                display: inline-flex;
                flex-wrap: wrap;
                gap: 6px;
            }

            .overview-resource-link {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: 28px;
                height: 28px;
                border-radius: 6px;
                background: var(--editor-background);
                border: 1px solid var(--border-color);
                cursor: pointer;
                transition: all 0.15s ease;
                color: var(--description-foreground);
            }

            .overview-resource-link:hover {
                background: var(--vscode-list-hoverBackground);
                border-color: var(--status-active);
                color: var(--status-active);
            }

            .overview-resource-link svg {
                width: 14px;
                height: 14px;
            }

            .overview-feedback-message {
                display: inline;
                font-size: 11px;
                color: var(--description-foreground);
            }

            .overview-feedback-link {
                color: var(--status-active);
                cursor: pointer;
                text-decoration: underline;
            }

            .overview-feedback-link:hover {
                opacity: 0.8;
            }

            .overview-footer-row {
                display: flex;
                flex-wrap: wrap;
                align-items: center;
                justify-content: space-between;
                gap: 8px;
                padding-top: 8px;
                margin-top: 8px;
                border-top: 1px solid var(--border-color);
            }

            .overview-footer-feedback {
                display: flex;
                flex-wrap: wrap;
                align-items: center;
                gap: 6px;
            }

            /* ==================== EMPTY STATE ==================== */
            .empty-state {
                padding: 20px;
                text-align: center;
                color: var(--description-foreground);
            }

            .empty-state-icon {
                font-size: 24px;
                margin-bottom: 8px;
            }

            .empty-state-text {
                font-size: 11px;
            }
        `
  ];
  __decorateClass([
    r5()
  ], SpecsmdApp.prototype, "_activeTab", 2);
  __decorateClass([
    r5()
  ], SpecsmdApp.prototype, "_boltsData", 2);
  __decorateClass([
    r5()
  ], SpecsmdApp.prototype, "_specsHtml", 2);
  __decorateClass([
    r5()
  ], SpecsmdApp.prototype, "_overviewHtml", 2);
  __decorateClass([
    r5()
  ], SpecsmdApp.prototype, "_loaded", 2);
  __decorateClass([
    r5()
  ], SpecsmdApp.prototype, "_activeFlow", 2);
  __decorateClass([
    r5()
  ], SpecsmdApp.prototype, "_availableFlows", 2);
  __decorateClass([
    r5()
  ], SpecsmdApp.prototype, "_fireData", 2);
  __decorateClass([
    r5()
  ], SpecsmdApp.prototype, "_fireActiveTab", 2);
  __decorateClass([
    r5()
  ], SpecsmdApp.prototype, "_theme", 2);
  SpecsmdApp = __decorateClass([
    t3("specsmd-app")
  ], SpecsmdApp);
})();
/*! Bundled license information:

@lit/reactive-element/css-tag.js:
  (**
   * @license
   * Copyright 2019 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

@lit/reactive-element/reactive-element.js:
lit-html/lit-html.js:
lit-element/lit-element.js:
@lit/reactive-element/decorators/custom-element.js:
@lit/reactive-element/decorators/property.js:
@lit/reactive-element/decorators/state.js:
@lit/reactive-element/decorators/event-options.js:
@lit/reactive-element/decorators/base.js:
@lit/reactive-element/decorators/query.js:
@lit/reactive-element/decorators/query-all.js:
@lit/reactive-element/decorators/query-async.js:
@lit/reactive-element/decorators/query-assigned-nodes.js:
lit-html/directive.js:
lit-html/directives/unsafe-html.js:
  (**
   * @license
   * Copyright 2017 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

lit-html/is-server.js:
  (**
   * @license
   * Copyright 2022 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)

@lit/reactive-element/decorators/query-assigned-elements.js:
  (**
   * @license
   * Copyright 2021 Google LLC
   * SPDX-License-Identifier: BSD-3-Clause
   *)
*/
//# sourceMappingURL=bundle.js.map
