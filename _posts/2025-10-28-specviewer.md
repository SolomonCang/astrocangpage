---
layout: post
title: a mini tool for viewing spectra from Polarbase
date: 2025-10-27 09:00:00
description: Spectrum Viewer in miniTools
tags: code tool
categories: astro-posts
featured: false
---

The website now features a submenu called “miniTools,” where I’ve ported several handy utilities to JavaScript so they can run entirely in the browser. Currently, it includes a single tool: <a href="/miniTools/spectrum-viewer/">Spectrum Viewer</a>. This tool displays Stokes <i>I</i>, <i>V</i>, and <i>Null</i> profiles for spectra in the Polarbase format. Spectrum Viewer automatically detects the data type, including:

- Spectrum with Stokes <i>V</i> (pol)
- Spectrum with Stokes <i>I</i> only (I)
- LSD profile with Stokes <i>V</i> (pol)
- LSD profile with Stokes <i>I</i> only (I)

You can also choose a method for reading the data. For spectral data, the tool provides a set of buttons for common chromospheric lines; clicking a button will navigate the plot to that line with the specified velocity range.