---
layout: page
title: FITS Header Viewer
permalink: /miniTools/fits-header-viewer/
description: "在浏览器中解析并查看 FITS 各 HDU 的 Header。"
nav: false
nav_order: 8
---

<link rel="stylesheet" href="{{ '/assets/css/fits-header-viewer.css' | relative_url }}">
<script src="{{ '/assets/js/miniTools/fits-header-viewer.js' | relative_url }}" defer></script>

<div class="fhv-container">
  <h2>FITS Header Viewer</h2>
  <p class="intro">上传 .fits / .fit / .fts 文件以查看其各 HDU 的 Header 信息。可点击选择文件或将文件拖拽到框内。</p>

  <!-- 上传区 -->
  <div class="uploader" id="uploader">
    <label for="fhv-file-input">
      将文件拖拽到此处，或 <span class="click">点击选择文件</span>
    </label>
    <input id="fhv-file-input" type="file" accept=".fits,.fit,.fts" />
  </div>

  <div id="fhv-file-info" class="file-info"></div>

  <!-- 控件 -->
  <div id="fhv-controls" class="controls">
    <div class="row">
      <label for="fhv-hdu-select">选择 HDU：</label>
      <select id="fhv-hdu-select"></select>
      <span id="fhv-hdu-count" class="badge"></span>
    </div>
  </div>

  <!-- 概览 -->
  <div id="fhv-summary" class="summary"></div>
  <hr />
  <!-- Header 表 -->
  <div id="fhv-header" class="header"></div>
</div>
