// assets/js/miniTools/fits-header-viewer.js
/* terser:disable */
document.addEventListener("DOMContentLoaded", () => {
  // -------------------- 安全追加与工具函数 --------------------
  function safeAppend(parent, child) {
    if (!parent) return;
    if (child == null) return;
    if (child instanceof Node) {
      parent.appendChild(child);
      return;
    }
    if (typeof child === "string") {
      parent.appendChild(document.createTextNode(child));
      return;
    }
    if (Array.isArray(child)) {
      const frag = document.createDocumentFragment();
      for (const c of child) safeAppend(frag, c);
      parent.appendChild(frag);
      return;
    }
    parent.appendChild(document.createTextNode(String(child)));
  }

  function safeReplace(parent, child) {
    if (!parent) return;
    parent.innerHTML = "";
    safeAppend(parent, child);
  }

  const createEl = (tag, attrs = {}, children = []) => {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (v == null) continue;
      if (k === "class") el.className = String(v);
      else if (k === "text") el.textContent = String(v);
      else el.setAttribute(k, String(v));
    }
    const list = Array.isArray(children) ? children : [children];
    for (const c of list) safeAppend(el, c);
    return el;
  };

  const toTable = (columns, rows, opts = {}) => {
    const root = createEl("div");
    const table = createEl("table");
    const thead = createEl("thead");
    const trh = createEl("tr");

    (columns || []).forEach((c, idx) => {
      const th = createEl("th", { "data-idx": String(idx), title: "点击排序" }, c ?? "");
      trh.appendChild(th);
    });
    thead.appendChild(trh);

    const tbody = createEl("tbody");

    const renderRows = (list) => {
      tbody.innerHTML = "";
      for (const r of list || []) {
        const tr = document.createElement("tr");
        for (let i = 0; i < (columns || []).length; i++) {
          const td = document.createElement("td");
          td.textContent = r && r[i] != null ? String(r[i]) : "";
          tr.appendChild(td);
        }
        tbody.appendChild(tr);
      }
    };
    renderRows(rows || []);

    let sortState = { idx: -1, dir: 1 };
    thead.addEventListener("click", (e) => {
      const th = e.target.closest("th");
      if (!th) return;
      const idx = +th.dataset.idx;
      if (sortState.idx === idx) sortState.dir *= -1;
      else {
        sortState.idx = idx;
        sortState.dir = 1;
      }
      const sorted = [...(rows || [])].sort((a, b) => {
        const av = a?.[idx];
        const bv = b?.[idx];
        const na = Number(av);
        const nb = Number(bv);
        const bothNum = Number.isFinite(na) && Number.isFinite(nb);
        const res = bothNum ? na - nb : String(av ?? "").localeCompare(String(bv ?? ""));
        return res * sortState.dir;
      });
      renderRows(sorted);
    });

    table.appendChild(thead);
    table.appendChild(tbody);

    const wrap = createEl("div", { class: "table-wrap" }, table);

    if (opts.filterable) {
      const toolbar = createEl("div", { class: "toolbar" }, [
        createEl("span", {}, "筛选："),
        createEl("input", { type: "text", placeholder: "输入关键字（对所有列生效）" }),
      ]);
      const input = toolbar.querySelector("input");
      const all = (rows || []).slice();
      input.addEventListener("input", () => {
        const q = input.value.trim().toLowerCase();
        if (!q) {
          renderRows(all);
          return;
        }
        const filtered = all.filter((r) => (r || []).some((cell) => String(cell).toLowerCase().includes(q)));
        renderRows(filtered);
      });
      safeAppend(root, toolbar);
    }

    safeAppend(root, wrap);
    return root;
  };

  // -------------------- 元素引用 --------------------
  const uploader = document.getElementById("uploader");
  const fileInput = document.getElementById("fhv-file-input");
  const fileInfo = document.getElementById("fhv-file-info");
  const controls = document.getElementById("fhv-controls");
  const hduSelect = document.getElementById("fhv-hdu-select");
  const hduCount = document.getElementById("fhv-hdu-count");
  const summary = document.getElementById("fhv-summary");
  const headerDiv = document.getElementById("fhv-header");

  if (!uploader || !fileInput) return;

  // -------------------- FITS 解析（精简 Header 版） --------------------
  function readText(dataview, offset, length) {
    const bytes = new Uint8Array(dataview.buffer, offset, length);
    let s = "";
    for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
    return s;
  }
  function align2880(x) {
    const b = 2880;
    return Math.ceil(x / b) * b;
  }
  function parseHeaderCards(view, start) {
    const cards = [];
    let pos = start;
    const block = 2880,
      cardLen = 80;
    let ended = false;
    while (!ended) {
      if (pos + block > view.byteLength) break;
      const chunk = readText(view, pos, block);
      for (let i = 0; i < block; i += cardLen) {
        const card = chunk.slice(i, i + cardLen);
        const key = card.slice(0, 8).trim();
        const raw = card.slice(8, 80);
        if (key === "END") {
          cards.push({ keyword: "END", value: "", comment: "" });
          ended = true;
          break;
        }
        if (card.trim().length === 0) continue;
        if (key === "COMMENT" || key === "HISTORY") {
          cards.push({ keyword: key, value: "", comment: card.slice(8).trim() });
          continue;
        }
        let value = "",
          comment = "";
        if (raw.startsWith("=")) {
          let v = raw.slice(1).trimStart();
          let val = v,
            com = "";
          if (v.includes("/")) {
            let inStr = false,
              idxSlash = -1;
            for (let j = 0; j < v.length; j++) {
              const ch = v[j];
              if (ch === "'") inStr = !inStr;
              if (ch === "/" && !inStr) {
                idxSlash = j;
                break;
              }
            }
            if (idxSlash >= 0) {
              val = v.slice(0, idxSlash).trimEnd();
              com = v.slice(idxSlash + 1).trim();
            }
          }
          val = val.trim();
          if (val.startsWith("'")) {
            value = val.endsWith("'") ? val.slice(1, -1).replace(/''/g, "'") : val;
          } else {
            value = val;
          }
          comment = com;
        } else {
          value = raw.trim();
        }
        cards.push({ keyword: key, value, comment });
      }
      pos += block;
    }
    return { cards, nextOffset: align2880(pos) };
  }
  function valueToInt(v, def = 0) {
    const n = parseInt(String(v ?? "").trim(), 10);
    return Number.isFinite(n) ? n : def;
  }
  function inferDataSize(bitpix, naxis, naxisn) {
    if (naxis <= 0) return 0;
    const elems = naxisn.reduce((a, b) => a * (b || 0), 1);
    const bytesPerElem = Math.abs(bitpix) / 8;
    const size = elems * bytesPerElem;
    if (!Number.isFinite(size) || size <= 0) return 0;
    return align2880(size);
  }
  function extractHeaderMap(cards) {
    const map = {};
    for (const c of cards || []) {
      if (!c.keyword || c.keyword === "END" || c.keyword === "COMMENT" || c.keyword === "HISTORY") continue;
      if (!(c.keyword in map)) map[c.keyword] = c.value;
    }
    return map;
  }
  function getHduType(hdr) {
    const xt = String(hdr["XTENSION"] || "").toUpperCase();
    if (!xt) return hdr["SIMPLE"] !== undefined ? "PrimaryHDU" : "UnknownHDU";
    if (xt.includes("IMAGE")) return "ImageHDU";
    if (xt.includes("BINTABLE")) return "BinTableHDU";
    if (xt.includes("TABLE")) return "TableHDU";
    return xt || "ExtensionHDU";
  }
  function parseFits(arrayBuffer) {
    const view = new DataView(arrayBuffer);
    const hdus = [];
    let offset = 0,
      index = 0;
    while (offset < view.byteLength) {
      const { cards, nextOffset } = parseHeaderCards(view, offset);
      if (!cards || cards.length === 0) break;
      const hdr = extractHeaderMap(cards);
      const bitpix = valueToInt(hdr["BITPIX"], 0);
      const naxis = valueToInt(hdr["NAXIS"], 0);
      const naxisn = [];
      for (let i = 1; i <= naxis; i++) naxisn.push(valueToInt(hdr["NAXIS" + i], 0));
      let dataSize = inferDataSize(bitpix, naxis, naxisn);
      if (naxis === 0 && (!Number.isFinite(dataSize) || dataSize === 0)) dataSize = 0;

      const dataStart = nextOffset;
      const dataEnd = align2880(dataStart + dataSize);

      const type = getHduType(hdr);
      const name = String(hdr["EXTNAME"] || hdr["HDUNAME"] || "").trim();
      const ver = hdr["EXTVER"] ? valueToInt(hdr["EXTVER"], null) : null;
      const shape = naxisn.length ? "(" + naxisn.join(", ") + ")" : "None";
      const rows = (cards || []).map((c) => [c.keyword, String(c.value ?? ""), String(c.comment ?? "")]);

      hdus.push({ index, name, type, ver, data_shape: shape, bitpix: bitpix || null, naxis: naxis || null, headerRows: rows });
      index += 1;
      offset = dataEnd;
      if (offset <= 0 || offset >= view.byteLength) break;
    }
    return hdus;
  }

  // -------------------- 应用状态与渲染 --------------------
  const ALLOWED_EXTS = [".fits", ".fit", ".fts"];

  let state = { filename: null, hdus: [], selected: 0 };

  function setError(msg) {
    safeReplace(fileInfo, createEl("div", { class: "error" }, String(msg)));
    if (controls) controls.style.display = "none";
    if (summary) summary.innerHTML = "";
    if (headerDiv) headerDiv.innerHTML = "";
  }
  function setInfo(msg) {
    if (!fileInfo) return;
    fileInfo.textContent = String(msg);
  }

  function renderControls() {
    if (!controls || !hduSelect || !hduCount) return;
    if (!state.hdus.length) {
      controls.style.display = "none";
      return;
    }
    controls.style.display = "block";
    hduSelect.innerHTML = "";
    state.hdus.forEach((hdu) => {
      const label = `[${hdu.index}] ${hdu.type}  name='${hdu.name}'  shape=${hdu.data_shape}`;
      const opt = createEl("option", { value: String(hdu.index), text: label });
      hduSelect.appendChild(opt);
    });
    hduSelect.value = String(state.selected ?? 0);
    hduCount.textContent = `HDU 数量：${state.hdus.length}`;
  }

  function renderSummary() {
    if (!summary) return;
    if (!state.hdus.length) {
      summary.innerHTML = "";
      return;
    }
    const cols = ["index", "name", "type", "ver", "data_shape", "bitpix", "naxis"];
    const rows = state.hdus.map((h) => [h.index, h.name, h.type, h.ver, h.data_shape, h.bitpix, h.naxis]);
    summary.innerHTML = "";
    safeAppend(summary, createEl("h4", {}, "HDU 概览"));
    safeAppend(summary, toTable(cols, rows, { filterable: false }));
  }

  function renderHeader() {
    if (!headerDiv) return;
    if (!state.hdus.length) {
      headerDiv.textContent = "尚未选择 HDU。";
      return;
    }
    const idx = state.selected ?? 0;
    const hdu = state.hdus.find((h) => h.index === Number(idx));
    if (!hdu) {
      headerDiv.textContent = "HDU 索引超出范围。";
      return;
    }
    headerDiv.innerHTML = "";
    safeAppend(headerDiv, createEl("h4", {}, `HDU ${hdu.index} Header`));
    safeAppend(headerDiv, toTable(["KEYWORD", "VALUE", "COMMENT"], hdu.headerRows, { filterable: true }));
  }

  function humanSize(bytes) {
    if (!bytes || bytes <= 0) return "0 B";
    const units = ["B", "KB", "MB", "GB", "TB"];
    let i = 0,
      n = bytes;
    while (n >= 1024 && i < units.length - 1) {
      n /= 1024;
      i++;
    }
    return n.toFixed(n >= 100 ? 0 : n >= 10 ? 1 : 2) + " " + units[i];
  }
  function isAllowedFilename(name) {
    const lower = String(name || "").toLowerCase();
    return ALLOWED_EXTS.some((ext) => lower.endsWith(ext));
  }

  // -------------------- 文件处理 --------------------
  function handleFile(file) {
    if (!file) return;
    if (!isAllowedFilename(file.name)) {
      setError(`文件格式不支持：${file.name}。仅支持 .fits/.fit/.fts`);
      return;
    }
    uploader.classList.remove("dragover");
    setInfo(`加载中：${file.name} ...`);
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const buf = reader.result;
        const hdus = parseFits(buf);
        state.filename = file.name;
        state.hdus = hdus;
        state.selected = 0;
        setInfo(`已加载文件：${file.name} | 大小：${humanSize(file.size)} | HDU 数量：${hdus.length}`);
        renderControls();
        renderSummary();
        renderHeader();
      } catch (e) {
        console.error(e);
        setError(`解析失败：${e?.message || e}`);
      }
    };
    reader.onerror = () => setError("读取文件失败。");
    reader.readAsArrayBuffer(file);
  }

  // -------------------- 事件绑定（与 spectrum-viewer 的交互风格一致） --------------------
  uploader.addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", (e) => handleFile(e.target.files && e.target.files[0]));
  uploader.addEventListener("dragover", (e) => {
    e.preventDefault();
    uploader.classList.add("dragover");
  });
  uploader.addEventListener("dragleave", (e) => {
    e.preventDefault();
    uploader.classList.remove("dragover");
  });
  uploader.addEventListener("drop", (e) => {
    e.preventDefault();
    uploader.classList.remove("dragover");
    const file = e.dataTransfer.files && e.dataTransfer.files[0];
    handleFile(file);
  });
  if (hduSelect) {
    hduSelect.addEventListener("change", (e) => {
      state.selected = Number(e.target.value);
      renderHeader();
    });
  }
});
/* terser:enable */
