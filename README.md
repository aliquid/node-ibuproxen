node-ibuproxen
==============

Local buffering proxy, for example to provide lagless streaming of media over wifi.

Usage: node lib\ibuproxen.js <filename> [content-type]

1. Make a short-cut on the desktop to ibu.cmd
2. Drag'n'drop a media file from network share (over wifi) onto short-cut
2. Use VLC to open http://localhost:8000/, now the media file plays with local buffering to avoid lag
