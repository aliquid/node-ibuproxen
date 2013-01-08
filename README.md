node-ibuproxen
==============

Local buffering proxy, for example to provide lagless streaming of media over wifi.

Usage: node lib\ibuproxen.js <filename> [content-type]

Windows
-------
1. Make a short-cut on the desktop to ibu.cmd.
2. Drag'n'drop a media file from network share (over wifi) onto short-cut.
3. Use VLC to open http://localhost:8000/
4. Now the media file plays with local buffering to avoid lag.

Roadmap
-------
* Serve multiple files (avi+srt) or whole directories.
* Add support also for streaming content (e.g. http://.. instead of filename on mapped/mounted network share).
