var	util = require("util"),
	http = require("http"),
	fs = require("fs");

var	bufz = 1024*1024,
	facz = 2,
	maxz = 1024*1024 * 16;

if (process.argv.length < 3) {
	util.puts("Usage: " + process.argv[0] + " " + process.argv[1] + " <filename> [content-type]");
	exit(1);
}

var	filename = process.argv[2],
	contentType = process.argv.length > 3 ? process.argv[3] : "application/octet-stream";

var	fd = fs.openSync(filename, "rs"),
	filestat = fs.fstatSync(fd);

String.prototype.lpad = function(length, padding) {
	var	string = this,
		padding = padding ? padding : " ";
	while (string.length < length)
		string = padding + string;
	return string;
}

String.prototype.rpad = function(length, padding) {
	var	string = this,
		padding = padding ? padding : " ";
	while (string.length < length)
		string = string + padding;
	return string;
}

if (typeof String.prototype.startsWith != 'function') {
	String.prototype.startsWith = function (str){
		return this.slice(0, str.length) == str;
	};
}

var	six = 0;

http.createServer(function (req, res) {
	var	bufs = [ null, null, null, null ],
		bufi = 0,
		bufo = 0,
		ofsi = 0,
		ofs1 = filestat.size,
		satu = false;

	++six;

	function debug(what) {
		util.puts("#" + six + ": " + what.rpad(20) + " " + bufi + "/" + bufo + ("@" + ofsi).lpad(20) + "/" + bufz);
	}

	function read(cb) {
		if (bufs[bufi].length != bufz) {
			bufs[bufi] = new Buffer(bufz);
			debug("resizing");
		}
		debug("fs.read");
		fs.read(fd, bufs[bufi], 0, bufs[bufi].length, ofsi, cb);
	}

	function chew(bytesRead) {
		if (bytesRead < bufs[bufi].length) {
			var buft = bufs[bufi];
			bufs[bufi] = new Buffer(bytesRead);
			buft.copy(bufs[bufi], 0, 0, bytesRead);
		}
		bufi = (bufi + 1) % bufs.length;
		ofsi += bytesRead;
	}

	function fcb(err, bytesRead, buffer) {
		if (err) {
			debug(err);
			bufs[bufi] = null;
		} else if (buffer) {
			var underflow = (bufi == bufo);

			debug("read");

			chew(bytesRead);

			if ((bufi + 1) % bufs.length == bufo) {
				debug("saturated");
				satu = true;
			} else if (ofsi < ofs1) {
				read(fcb);
				if (underflow) {
					debug("pacemaker");
					dcb(true);
				}
			} else {
				debug("finished");
				bufs[bufi] = null;
			}
		} else if (ofsi < ofs1) {
			read(fcb);
			satu = false;
		} else {
			debug("finished");
			bufs[bufi] = null;
		}
	}

	function dcb(underflow) {
		if (!underflow) {
			bufo = (bufo + 1) % bufs.length;
			if (satu) {
				fcb();
			}
		}
		if (bufi-bufo) {
			debug("res.write");
			res.write(bufs[bufo]);
		} else if (null == bufs[bufo]) {
			debug("ending");
			res.end();
		} else {
			debug("underflow");
			bufz = Math.round(bufz * facz);
			if (bufz > maxz)
				bufz = maxz;
		}
	}

	util.puts("HTTP----------------");
	for (var h in req.headers) {
		util.puts(h + ": " + req.headers[h]);

		if (h == "range" && req.headers[h].toLowerCase().startsWith("bytes")) {
			var temp;
			temp = req.headers[h].split("=");
			if (temp.length > 1) {
				temp = temp[1].split("-");
				if (2 == temp.length) {
					ofsi = parseInt(temp[0]) || 0;
					ofs1 = (parseInt(temp[1]) || filestat.size-1) + 1;
					util.puts("# RANGE: " + ofsi + "-" + (ofs1-1));
				}
			}
		}
	}
	util.puts("--------------------");
	req.setEncoding("utf-8");
	res.writeHead(200, {
			"Server": "ibuproxen 0.90",
			"Content-Type": contentType,
			"Content-Length": "" + ofs1-ofsi,
			"Last-Modified": filestat.mtime.toUTCString(),
			"Accept-Ranges": "bytes",
			"Connection": "Close"
		});
	res.on('drain', function() {
			debug("drain");
			dcb(false)
		});
	res.on('close', function() {
			debug("close");
		});

	if (req.method == "GET") {
		while (ofsi < ofs1) {
			bufs[bufi] = new Buffer(bufz);
			if (bufi < bufs.length-1) {
				debug("fs.readSync");
				chew(fs.readSync(fd, bufs[bufi], 0, bufs[bufi].length, ofsi));
			} else {
				fcb();
				break;
			}
		}

		dcb(true);
	} else
		res.end();

}).listen(8000);

util.puts("ibuproxen running on port 8000 serving " + filename + " (" + contentType + ")");
