---
layout: post
title: a mini tool for viewing spectra from Polarbase
date: 2025-10-27 09:00:00
description: Spectrum Viewer in miniTools
tags: code tool
categories: astro-posts
featured: false
---

The website now includes a submenu named 'miniTools', in which I convert some useful tiny tools to the JaveScript language and can be fully used on the website. Now that there is only one tool  <a href="/miniTools/spectrum-viewer/">'Spectrum Viewer'</a>, which can used to show the Stokes <i>I</i>, <i>V</i>, and  <i>Null</i> profiles of a spectrum in the format of [Polarbase](https://www.polarbase.ovgso.fr). Spectrum Viewer can autometicly detect the data type including: 

 - Spectrum w/ Stokes <i>V</i> (pol)
 - Spectrum w/ only Stokes <i>I</i>  (I)
 - LSD profile w/ Stokes <i>V</i> (pol)
 - LSD profile w/ only Stokes <i>I</i>  (I)
 
 You can also selected a method to read the data. For data of spectrum, the tool will include a list of button for chromospheric lines, you can click it and the plot will jump to the line with given velocity range.
