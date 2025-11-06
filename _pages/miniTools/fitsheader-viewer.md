---
layout: page
title: FITS Header Viewer
permalink: /miniTools/fits-header-viewer/
description: "Parse and view the headers of each HDU in a FITS file directly in the browser."
nav: false
nav_order: 8
---

<link rel="stylesheet" href="{{ '/assets/css/fits-header-viewer.css' | relative_url }}">
<script src="{{ '/assets/js/miniTools/fits-header-viewer.js' | relative_url }}" defer></script>

<div class="fhv-container">
  <h2>FITS Header Viewer</h2>
  <p class="intro">
    Upload a .fits / .fit / .fts file to inspect the header of each HDU.
    You can click to choose a file or drag and drop it into the box.
  </p>

  <!-- Uploader -->
  <div class="uploader" id="uploader">
    <label for="fhv-file-input">
      Drag and drop a file here, or <span class="click">click to choose a file</span>
    </label>
    <input id="fhv-file-input" type="file" accept=".fits,.fit,.fts" />
  </div>

  <div id="fhv-file-info" class="file-info"></div>

  <!-- Controls -->
  <div id="fhv-controls" class="controls">
    <div class="row">
      <label for="fhv-hdu-select">Select HDU:</label>
      <select id="fhv-hdu-select"></select>
      <span id="fhv-hdu-count" class="badge"></span>
    </div>
  </div>

  <!-- Overview -->
  <div id="fhv-summary" class="summary"></div>
  <hr />
  <!-- Header table -->
  <div id="fhv-header" class="header"></div>
</div>
