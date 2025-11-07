/* eslint-disable no-undef */
(function () {
  const $ = (id) => document.getElementById(id);
  const setText = (id, v) => {
    const el = $(id);
    if (el) el.textContent = v;
  };

  // reverse Y axis?
  function isInvertY() {
    const el = $("invertY");
    return !!(el && el.checked);
  }

  // separator detection and parsing
  function detectSep(line) {
    if (line.includes(",")) return ",";
    if (/\t/.test(line)) return "\t";
    if (line.includes(";")) return ";";
    if (line.trim().split(/\s+/).length > 1) return "space";
    return " ";
  }

  function parseText(text, { sep = "auto", hasHeader = false, colMap = "t,y,s" }) {
    const lines = text.split(/\r?\n/).filter((s) => s && !s.trim().startsWith("#"));
    if (lines.length === 0) return { t: [], y: [], s: [] };
    let useSep = sep === "auto" ? detectSep(lines[0]) : sep;
    if (useSep === "tab") useSep = "\t";
    if (useSep === "space") useSep = "space";
    const map = colMap.split(",");
    const t = [],
      y = [],
      s = [];
    let start = hasHeader ? 1 : 0;
    for (let i = start; i < lines.length; i++) {
      const ln = lines[i].trim();
      if (!ln || ln.startsWith("#")) continue;
      const parts = useSep === "space" ? ln.split(/\s+/) : ln.split(useSep);
      if (parts.length < 2) continue;
      const vals = parts.map((v) => Number(v));
      if (vals.some((v) => Number.isNaN(v))) continue;
      let tt, yy, ss;
      if (map.join(",") === "y,t") {
        yy = vals[0];
        tt = vals[1];
        ss = vals[2];
      } else {
        tt = vals[0];
        yy = vals[1];
        ss = vals[2];
      }
      t.push(tt);
      y.push(yy);
      if (ss !== undefined) s.push(ss);
    }
    return { t, y, s };
  }

  function basicStats(t) {
    if (t.length === 0) return { T: 0, tmin: NaN, tmax: NaN, dtmin: NaN };
    let tmin = Infinity,
      tmax = -Infinity;
    for (const v of t) {
      if (v < tmin) tmin = v;
      if (v > tmax) tmax = v;
    }
    let dtmin = Infinity;
    for (let i = 1; i < t.length; i++) {
      const dt = t[i] - t[i - 1];
      if (dt > 0 && dt < dtmin) dtmin = dt;
    }
    const T = tmax - tmin;
    return { T, tmin, tmax, dtmin: isFinite(dtmin) ? dtmin : T > 0 ? T / t.length : NaN };
  }
  function mean(arr) {
    let s = 0;
    for (const v of arr) s += v;
    return s / arr.length;
  }
  function linDetrend(t, y) {
    const n = t.length;
    let Sx = 0,
      Sy = 0,
      Sxx = 0,
      Sxy = 0;
    for (let i = 0; i < n; i++) {
      const ti = t[i],
        yi = y[i];
      Sx += ti;
      Sy += yi;
      Sxx += ti * ti;
      Sxy += ti * yi;
    }
    const denom = n * Sxx - Sx * Sx;
    let a = 0,
      b = 0;
    if (Math.abs(denom) > 1e-24) {
      b = (n * Sxy - Sx * Sy) / denom;
      a = (Sy - b * Sx) / n;
    } else {
      a = Sy / n;
      b = 0;
    }
    const y0 = new Float64Array(n);
    for (let i = 0; i < n; i++) y0[i] = y[i] - (a + b * t[i]);
    return y0;
  }

  function computeFreqGrid(t, fminInput, fmaxInput, ofac) {
    const { T, dtmin } = basicStats(t);
    const fmin = fminInput > 0 ? fminInput : Math.max(1 / (T || 1), 1e-6);
    const fmax = fmaxInput > 0 ? fmaxInput : Math.max(0.5 / Math.max(dtmin, 1e-12), fmin * 2);
    const M = Math.max(16, Math.floor(Math.max(1, ofac) * T * (fmax - fmin)));
    const freqs = new Float64Array(M);
    const step = (fmax - fmin) / (M - 1);
    for (let i = 0; i < M; i++) freqs[i] = fmin + step * i;
    return { freqs, fmin, fmax };
  }

  function lombScargleChunk(t, y0, w, freqs, start, end, norm = "scargle") {
    const n = t.length;
    let yy;
    if (w) {
      let num = 0;
      for (let i = 0; i < n; i++) {
        const wi = w[i];
        const d = y0[i];
        num += wi * d * d;
      }
      yy = num;
    } else {
      yy = 0;
      for (let i = 0; i < n; i++) yy += y0[i] * y0[i];
    }
    const P = new Float64Array(end - start);
    for (let k = start; k < end; k++) {
      const wfreq = 2 * Math.PI * freqs[k];
      let s2 = 0,
        c2 = 0;
      for (let i = 0; i < n; i++) {
        const wt = wfreq * t[i];
        const wi = w ? w[i] : 1;
        s2 += Math.sin(2 * wt) * wi;
        c2 += Math.cos(2 * wt) * wi;
      }
      const tau = (0.5 * Math.atan2(s2, c2)) / Math.max(wfreq, 1e-30);
      let C = 0,
        S = 0,
        YC = 0,
        YS = 0;
      for (let i = 0; i < n; i++) {
        const wi = w ? w[i] : 1;
        const wt = wfreq * (t[i] - tau);
        const c = Math.cos(wt),
          s = Math.sin(wt);
        C += wi * c * c;
        S += wi * s * s;
        YC += wi * y0[i] * c;
        YS += wi * y0[i] * s;
      }
      let Pk = (0.5 * ((YC * YC) / Math.max(C, 1e-24) + (YS * YS) / Math.max(S, 1e-24))) / Math.max(yy / 2, 1e-24);
      if (norm === "psd") Pk = ((YC * YC) / Math.max(C, 1e-24) + (YS * YS) / Math.max(S, 1e-24)) / Math.max(n, 1e-24);
      P[k - start] = Pk;
    }
    return P;
  }

  // worker blob
  const workerCode = `
    self.onmessage = (e) => {
      const {t, y0, w, freqs, start, end, norm} = e.data;
      function chunk(t, y0, w, freqs, start, end, norm){
        const n = t.length;
        let yy;
        if (w) { let num=0; for (let i=0;i<n;i++){ const wi=w[i]; const d=y0[i]; num += wi*d*d; } yy = num; }
        else { yy = 0; for (let i=0;i<n;i++) yy += y0[i]*y0[i]; }
        const P = new Float64Array(end - start);
        for (let k=start; k<end; k++){
          const wfreq = 2*Math.PI*freqs[k];
          let s2=0, c2=0;
          for (let i=0;i<n;i++){
            const wt = wfreq*t[i];
            const wi = w ? w[i] : 1;
            s2 += Math.sin(2*wt) * wi;
            c2 += Math.cos(2*wt) * wi;
          }
          const tau = 0.5*Math.atan2(s2, c2)/Math.max(wfreq,1e-30);
          let C=0,S=0,YC=0,YS=0;
          for (let i=0;i<n;i++){
            const wi = w ? w[i] : 1;
            const wt = wfreq*(t[i]-tau);
            const c = Math.cos(wt), s = Math.sin(wt);
            C += wi*c*c; S += wi*s*s; YC += wi*y0[i]*c; YS += wi*y0[i]*s;
          }
          let Pk = 0.5 * ((YC*YC)/Math.max(C,1e-24) + (YS*YS)/Math.max(S,1e-24)) / Math.max(yy/2,1e-24);
          if (norm === 'psd') Pk = ((YC*YC)/Math.max(C,1e-24) + (YS*YS)/Math.max(S,1e-24)) / Math.max(n,1e-24);
          P[k - start] = Pk;
        }
        return P;
      }
      const P = chunk(t, y0, w, freqs, start, end, norm);
      self.postMessage({start, end, P}, [P.buffer]);
    };
  `;
  const workerBlob = new Blob([workerCode], { type: "application/javascript" });
  const workerUrl = URL.createObjectURL(workerBlob);

  // state
  let data = { t: [], y: [], s: [] };
  let lastLS = { freqs: new Float64Array(0), P: new Float64Array(0), peakIndex: -1 };
  let weights = null;

  // plots
  function plotTimeSeries() {
    const invert = isInvertY();
    if (data.t.length === 0) {
      Plotly.newPlot(
        "timePlot",
        [{ x: [0], y: [0], mode: "markers", visible: "legendonly" }],
        {
          paper_bgcolor: "#ffffff",
          plot_bgcolor: "#ffffff",
          margin: { l: 50, r: 10, t: 10, b: 40 },
          xaxis: { title: "t", gridcolor: "#e6ebf2", zerolinecolor: "#e6ebf2" },
          yaxis: {
            title: "y",
            gridcolor: "#e6ebf2",
            zerolinecolor: "#e6ebf2",
            autorange: invert ? "reversed" : true,
          },
        },
        { responsive: true }
      );
      return;
    }
    const trace = { x: data.t, y: data.y, mode: "markers", marker: { color: "#3aa0ff", size: 6, opacity: 0.8 }, name: "y(t)" };
    const layout = {
      paper_bgcolor: "#ffffff",
      plot_bgcolor: "#ffffff",
      margin: { l: 50, r: 10, t: 10, b: 40 },
      xaxis: { title: "t", gridcolor: "#e6ebf2", zerolinecolor: "#e6ebf2" },
      yaxis: {
        title: "y",
        gridcolor: "#e6ebf2",
        zerolinecolor: "#e6ebf2",
        autorange: invert ? "reversed" : true,
      },
    };
    Plotly.newPlot("timePlot", [trace], layout, { responsive: true });
  }

  function plotLS(freqs, P, peakIdx) {
    const trace = { x: Array.from(freqs), y: Array.from(P), mode: "lines", line: { color: "#18a999" }, name: "L-S Power" };
    const shapes = [];
    const annotations = [];
    if (peakIdx >= 0 && freqs.length && P.length) {
      const fx = freqs[peakIdx],
        py = P[peakIdx];
      shapes.push({ type: "line", x0: fx, x1: fx, y0: 0, y1: py, line: { color: "#ff6b6b", width: 2, dash: "dot" } });
      annotations.push({
        x: fx,
        y: py,
        text: `peak f=${fx.toPrecision(5)} (P=${(1 / fx).toPrecision(5)})`,
        yanchor: "bottom",
        showarrow: true,
        arrowhead: 3,
        ax: 20,
        ay: -20,
        font: { color: "#a33" },
      });
    }
    const layout = {
      paper_bgcolor: "#ffffff",
      plot_bgcolor: "#ffffff",
      margin: { l: 50, r: 10, t: 10, b: 40 },
      xaxis: { title: "Frequency", gridcolor: "#e6ebf2", zerolinecolor: "#e6ebf2" },
      yaxis: { title: "Power", gridcolor: "#e6ebf2", zerolinecolor: "#e6ebf2" },
      shapes,
      annotations,
    };
    Plotly.newPlot("lsPlot", [trace], layout, { responsive: true });
  }

  function plotPhase(period, t0, repeatTimes = 1) {
    if (data.t.length === 0 || !isFinite(period) || period <= 0) {
      Plotly.newPlot("phasePlot", [{ x: [0], y: [0], visible: "legendonly" }], { paper_bgcolor: "#ffffff", plot_bgcolor: "#ffffff" });
      return;
    }
    const phases = [];
    const values = [];
    for (let i = 0; i < data.t.length; i++) {
      const ph = ((data.t[i] - t0) / period) % 1;
      const p = ph < 0 ? ph + 1 : ph;
      phases.push(p);
      values.push(data.y[i]);
    }
    const traces = [
      {
        x: phases,
        y: values,
        mode: "markers",
        marker: { color: "#e1b12c", size: 6, opacity: 0.85 },
        name: "phase",
      },
    ];
    if (repeatTimes === 2) {
      const phases2 = phases.map((p) => p + 1);
      traces.push({
        x: phases2,
        y: values,
        mode: "markers",
        marker: { color: "#e1b12c", size: 6, opacity: 0.35 },
        name: "phase+1",
        showlegend: false,
      });
    }
    const layout = {
      paper_bgcolor: "#ffffff",
      plot_bgcolor: "#ffffff",
      margin: { l: 50, r: 10, t: 10, b: 40 },
      xaxis: { title: "Phase", range: [0, repeatTimes], gridcolor: "#e6ebf2", zerolinecolor: "#e6ebf2" },
      yaxis: { title: "y", gridcolor: "#e6ebf2", zerolinecolor: "#e6ebf2" },
    };
    Plotly.newPlot("phasePlot", traces, layout, { responsive: true });
  }

  // main compute with parallel workers (safe copies)
  async function computeLS() {
    if (data.t.length < 3) {
      log("Not enough data");
      return;
    }
    const t = Float64Array.from(data.t);
    const y = Float64Array.from(data.y);
    const useSigma = $("useSigma").checked && data.s.length === data.t.length;
    const detrend = $("detrend").value;
    const norm = $("norm").value;

    let y0;
    if (detrend === "lin") y0 = linDetrend(t, y);
    else {
      const mu = mean(y);
      y0 = Float64Array.from(y, (v) => v - mu);
    }

    let wArr = null;
    if (useSigma) {
      wArr = new Float64Array(data.s.length);
      for (let i = 0; i < wArr.length; i++) {
        const s = data.s[i];
        wArr[i] = s > 0 ? 1 / (s * s) : 0;
      }
    }
    weights = wArr;

    const ofac = Math.max(1, parseInt($("ofac").value || "5", 10));
    const fminInput = parseFloat($("fmin").value);
    const fmaxInput = parseFloat($("fmax").value);
    const { freqs, fmin, fmax } = computeFreqGrid(t, fminInput, fmaxInput, ofac);
    setText("nf", freqs.length.toLocaleString());

    const nWorkersVal = ($("nWorkers").value || "").trim().toLowerCase();
    const maxHw = navigator.hardwareConcurrency || 4;
    const nWorkers = nWorkersVal === "navigator" ? Math.min(8, Math.max(1, maxHw)) : Math.max(1, parseInt(nWorkersVal || "2", 10));

    const M = freqs.length;
    const chunkSize = Math.ceil(M / nWorkers);
    const chunks = [];
    let start = 0;
    while (start < M) {
      chunks.push({ start, end: Math.min(M, start + chunkSize) });
      start += chunkSize;
    }

    log(`Computing: M=${M}, workers=${nWorkers}, f in [${fmin.toPrecision(5)}, ${fmax.toPrecision(5)}]`);

    const P = new Float64Array(M);
    const workers = [];
    const promises = [];
    for (const ck of chunks) {
      const wk = new Worker(workerUrl);
      workers.push(wk);
      promises.push(
        new Promise((resolve) => {
          wk.onmessage = (e) => {
            const { start, end, P: chunkP } = e.data;
            P.set(new Float64Array(chunkP), start);
            resolve();
          };
        })
      );
      wk.postMessage({
        t: new Float64Array(t),
        y0: new Float64Array(y0),
        w: wArr ? new Float64Array(wArr) : null,
        freqs: new Float64Array(freqs),
        start: ck.start,
        end: ck.end,
        norm,
      });
    }

    await Promise.all(promises);
    workers.forEach((w) => w.terminate());

    let peakIndex = 0;
    for (let i = 1; i < P.length; i++) if (P[i] > P[peakIndex]) peakIndex = i;
    lastLS = { freqs, P, peakIndex };

    const fPeak = freqs[peakIndex];
    const pPeak = P[peakIndex];
    setText("peakF", isFinite(fPeak) ? fPeak.toPrecision(8) : "-");
    setText("peakP", isFinite(pPeak) ? pPeak.toPrecision(6) : "-");
    setText("peakPer", isFinite(fPeak) ? (1 / fPeak).toPrecision(8) : "-");

    plotLS(freqs, P, peakIndex);

    const periodInput = $("period");
    if (!periodInput.value) {
      const p = 1 / fPeak;
      periodInput.value = isFinite(p) ? p : "";
    }
    const t0 = Number.isFinite(Number($("t0").value)) ? Number($("t0").value) : basicStats(data.t).tmin;
    const per = Number(periodInput.value);
    const useHalf = $("mirrorPeriod").checked;
    plotPhase(useHalf ? per / 2 : per, t0, parseInt($("phaseRepeat").value, 10));
    log("Done");
  }

  function refineAroundPeak() {
    if (!lastLS.freqs.length) {
      log("Compute L-S first");
      return;
    }
    const freqs = lastLS.freqs;
    const idx = lastLS.peakIndex >= 0 ? lastLS.peakIndex : 0;
    const f0 = freqs[idx];
    const df = (freqs[freqs.length - 1] - freqs[0]) / freqs.length;
    const span = 20;
    const fmin = Math.max(1e-9, f0 - span * df);
    const fmax = f0 + span * df;
    const fineM = 10 * 2 * span;
    const fineFreqs = new Float64Array(fineM);
    const step = (fmax - fmin) / Math.max(1, fineM - 1);
    for (let i = 0; i < fineM; i++) fineFreqs[i] = fmin + i * step;

    const t = Float64Array.from(data.t);
    const y = Float64Array.from(data.y);
    const detrend = $("detrend").value;
    let y0;
    if (detrend === "lin") y0 = linDetrend(t, y);
    else {
      const mu = mean(y);
      y0 = Float64Array.from(y, (v) => v - mu);
    }
    const w = $("useSigma").checked && data.s.length === data.t.length ? Float64Array.from(weights) : null;
    const norm = $("norm").value;

    const Pfine = lombScargleChunk(t, y0, w, fineFreqs, 0, fineFreqs.length, norm);

    let peakIndex = 0;
    for (let i = 1; i < Pfine.length; i++) if (Pfine[i] > Pfine[peakIndex]) peakIndex = i;
    const fPeak = fineFreqs[peakIndex];
    const pPeak = Pfine[peakIndex];
    plotLS(fineFreqs, Pfine, peakIndex);
    setText("peakF", isFinite(fPeak) ? fPeak.toPrecision(8) : "-");
    setText("peakP", isFinite(pPeak) ? pPeak.toPrecision(6) : "-");
    setText("peakPer", isFinite(fPeak) ? (1 / fPeak).toPrecision(8) : "-");

    const periodInput = $("period");
    periodInput.value = 1 / fPeak;
    const t0 = Number.isFinite(Number($("t0").value)) ? Number($("t0").value) : basicStats(data.t).tmin;
    const useHalf = $("mirrorPeriod").checked;
    plotPhase(useHalf ? 1 / fPeak / 2 : 1 / fPeak, t0, parseInt($("phaseRepeat").value, 10));
    log("Refined around peak");
  }

  function updateStats() {
    setText("statN", data.t.length);
    const { T, tmin, tmax, dtmin } = basicStats(data.t);
    setText("statT", isFinite(T) ? `${tmin.toPrecision(5)} ~ ${tmax.toPrecision(5)} (T=${T.toPrecision(5)})` : "-");
    setText("statDt", isFinite(dtmin) ? dtmin.toPrecision(5) : "-");
  }
  function log(msg) {
    const el = $("log");
    if (!el) return;
    const now = new Date().toLocaleTimeString();
    el.textContent = `[${now}] ${msg}\n` + el.textContent;
  }

  // events and wiring
  const fileInput = $("fileInput");
  if (fileInput) {
    fileInput.addEventListener("change", async (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const txt = await file.text();
      const sep = $("sep").value;
      const hasHeader = $("hasHeader").checked;
      const colMap = $("colMap").value;
      const parsed = parseText(txt, { sep, hasHeader, colMap });
      if (parsed.t.length === 0) {
        log("No valid rows parsed");
        return;
      }
      const idx = parsed.t
        .map((v, i) => [v, i])
        .sort((a, b) => a[0] - b[0])
        .map((p) => p[1]);
      data.t = idx.map((i) => parsed.t[i]);
      data.y = idx.map((i) => parsed.y[i]);
      data.s = parsed.s.length ? idx.map((i) => parsed.s[i]) : [];
      updateStats();
      plotTimeSeries();
      log(`Loaded ${data.t.length} points`);
    });
  }

  const btnClear = $("btnClear");
  if (btnClear)
    btnClear.addEventListener("click", () => {
      data = { t: [], y: [], s: [] };
      lastLS = { freqs: new Float64Array(0), P: new Float64Array(0), peakIndex: -1 };
      if (fileInput) fileInput.value = "";
      updateStats();
      plotTimeSeries();
      plotLS(new Float64Array(0), new Float64Array(0), -1);
      plotPhase(NaN, 0, 1);
      setText("peakF", "-");
      setText("peakP", "-");
      setText("peakPer", "-");
      setText("nf", "0");
      log("Cleared");
    });

  const btnDemo = $("btnDemo");
  if (btnDemo)
    btnDemo.addEventListener("click", () => {
      const N = 300;
      const P = 1.2345;
      const A = 1.0;
      const noise = 0.25;
      const t = [];
      let cur = 0;
      for (let i = 0; i < N; i++) {
        cur += 0.01 + Math.random() * 0.05;
        t.push(cur + (Math.random() < 0.1 ? Math.random() * 0.2 : 0));
      }
      const y = t.map((tt) => A * Math.sin((2 * Math.PI * tt) / P + 0.4) + (Math.random() * 2 - 1) * noise);
      data = { t, y, s: [] };
      updateStats();
      plotTimeSeries();
      log(`Demo generated: N=${N}, true P~${P}`);
    });

  const btnCompute = $("btnCompute");
  if (btnCompute) btnCompute.addEventListener("click", () => computeLS());
  const btnRefine = $("btnRefine");
  if (btnRefine) btnRefine.addEventListener("click", () => refineAroundPeak());
  const btnPhase = $("btnPhase");
  if (btnPhase)
    btnPhase.addEventListener("click", () => {
      const perIn = parseFloat($("period").value);
      const t0 = Number.isFinite(Number($("t0").value)) ? Number($("t0").value) : basicStats(data.t).tmin;
      const per = isFinite(perIn) ? perIn : lastLS.peakIndex >= 0 ? 1 / lastLS.freqs[lastLS.peakIndex] : NaN;
      const useHalf = $("mirrorPeriod").checked;
      plotPhase(useHalf ? per / 2 : per, t0, parseInt($("phaseRepeat").value, 10));
    });

  //
  const invertBox = $("invertY");
  if (invertBox) {
    invertBox.addEventListener("change", () => {
      plotTimeSeries();
    });
  }

  // initial plots
  plotTimeSeries();
  plotLS(new Float64Array(0), new Float64Array(0), -1);
  plotPhase(NaN, 0, 1);
})();
