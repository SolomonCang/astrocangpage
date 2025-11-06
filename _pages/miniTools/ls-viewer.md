---
layout: page
title: Lomb–Scargle Periodogram
permalink: /miniTools/ls-viewer/
description: "Upload irregular time series, compute Lomb–Scargle periodogram (parallel), and phase-fold the series in the browser."
nav: false
nav_order: 9
---

<link rel="stylesheet" href="{{ '/assets/css/ls-viewer.css' | relative_url }}">
<script src="https://cdn.plot.ly/plotly-2.35.2.min.js"></script>
<script src="{{ '/assets/js/miniTools/ls-viewer.js' | relative_url }}" defer></script>

<div class="ls-container">
  <header class="ls-header">
    <h1>Lomb–Scargle Periodogram</h1>
    <div class="sub">Upload 2-3 column CSV or space-separated text (ignore lines starting with #). Auto-plot time series, compute L-S with parallel workers and peak annotation, and phase-fold by period.</div>
    <div class="sub">Notes:
    - Default f_min ~ 1/T, where T = max(t) - min(t); f_max ~ 0.5 / min dt.
    - Upload 2-3 columns (third is optional sigma). Lines starting with # are ignored.
    - Computation runs with Web Workers in parallel.</div>
  </header>

  <div class="grid">
    <div class="panel">
      <div class="flex topbar">
        <div class="pill">Points: <span id="statN">0</span></div>
        <div class="pill">Time range: <span id="statT">-</span></div>
        <div class="pill">dt min: <span id="statDt">-</span></div>
        <div class="sp"></div>
        <button class="btn secondary" id="btnDemo">Load demo</button>
        <button class="btn" id="btnClear">Clear</button>
      </div>

      <h2>1) Time series</h2>
      <div id="timePlot" class="plot"></div>

      <h2>2) Lomb–Scargle periodogram</h2>
      <div id="lsPlot" class="plot"></div>

      <h2>3) Phase folding</h2>
      <div id="phasePlot" class="plot"></div>
    </div>

    <div class="panel">
      <h2>Data input</h2>
      <div class="controls">
        <div class="full">
          <input type="file" id="fileInput" accept=".csv,.txt,.dat" />
          <div class="hint">CSV or space-separated text. Lines starting with # are ignored. Up to 3 columns: t y [sigma].</div>
        </div>
        <div>
          <label>Separator</label>
          <select id="sep">
            <option value="auto">Auto</option>
            <option value=",">Comma (,)</option>
            <option value="tab">Tab</option>
            <option value="space">Space</option>
            <option value="semi">Semicolon (;)</option>
          </select>
        </div>
        <div>
          <label>Column map</label>
          <select id="colMap">
            <option value="t,y,s">t, y, sigma(optional)</option>
            <option value="t,y">t, y</option>
            <option value="y,t">y, t</option>
          </select>
        </div>
        <div class="full">
          <label><input type="checkbox" id="hasHeader" /> First row is header</label>
        </div>
      </div>

      <h2 style="margin-top:14px">L-S parameters</h2>
      <div class="controls">
        <div>
          <label>f_min</label>
          <input type="number" id="fmin" step="any" placeholder="auto" />
        </div>
        <div>
          <label>f_max</label>
          <input type="number" id="fmax" step="any" placeholder="auto" />
        </div>
        <div>
          <label>Oversampling (ofac)</label>
          <input type="number" id="ofac" step="1" value="5" />
        </div>
        <div>
          <label>Workers</label>
          <input type="number" id="nWorkers" min="1" step="1" value="navigator" />
        </div>
        <div>
          <label>Detrend</label>
          <select id="detrend">
            <option value="mean">Remove mean</option>
            <option value="lin">Linear detrend</option>
          </select>
        </div>
        <div>
          <label>Normalization</label>
          <select id="norm">
            <option value="scargle">Scargle</option>
            <option value="psd">PSD-like</option>
          </select>
        </div>
        <div>
          <label><input type="checkbox" id="useSigma" /> Use 3rd column sigma as weight</label>
        </div>
        <div>
          <label><input type="checkbox" id="mirrorPeriod" /> Use P/2 for phase (for double-peaked)</label>
        </div>
        <div class="full">
          <button class="btn" id="btnCompute">Compute L-S</button>
          <button class="btn secondary" id="btnRefine">Refine peak (fine scan)</button>
        </div>
      </div>

      <h2 style="margin-top:14px">Phase folding</h2>
      <div class="controls">
        <div>
          <label>Period P (=1/f)</label>
          <input type="number" id="period" step="any" placeholder="auto from peak" />
        </div>
        <div>
          <label>Phase zero t0</label>
          <input type="number" id="t0" step="any" placeholder="default min(t)" />
        </div>
        <div>
          <label>Phase span</label>
          <select id="phaseRepeat">
            <option value="1">[0,1]</option>
            <option value="2">[0,2]</option>
          </select>
        </div>
        <div class="full">
          <button class="btn" id="btnPhase">Plot phase</button>
        </div>
      </div>

      <h3>Status</h3>
      <div class="badge">
        <div>Peak: f=<span id="peakF">-</span>, P=<span id="peakP">-</span> | Period P=<span id="peakPer">-</span></div>
        <div>Freq points: <span id="nf">0</span></div>
        <div id="log" class="mono" style="white-space:pre-wrap;margin-top:6px;"></div>
      </div>
    </div>

  </div>
</div>
