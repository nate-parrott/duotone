downloadNextFrame = false;

function start() {
	var canvas = document.getElementById('canvas');
	var gl = canvas.getContext('webgl');
	var imageSize = [1, 1];
	
	// sizing:
	var resize = function() {
		var main = document.getElementById('main');
		var scale = Math.max(main.offsetWidth / imageSize[0], main.offsetHeight / imageSize[1]);
		var width = scale * imageSize[0];
		var height = scale * imageSize[1];
		canvas.width = width;
		canvas.height = height;
		var cssify = function(p) {return Math.round(p) + 'px'};
		canvas.style.width = cssify(width);
		canvas.style.marginLeft = cssify(-width/2);
		canvas.style.height = cssify(height);
		canvas.style.marginTop = cssify(-height/2);
		gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
	}
	window.addEventListener('resize', resize);
	setTimeout(resize, 100);
	resize();
	
	// quad buffer:
	var buffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(
    gl.ARRAY_BUFFER, 
    new Float32Array([
      -1.0, -1.0, 
       1.0, -1.0, 
      -1.0,  1.0, 
      -1.0,  1.0, 
       1.0, -1.0, 
       1.0,  1.0]), 
    gl.STATIC_DRAW
  );
	
	// vertex shader:
  var shaderScript = document.getElementById("2d-vertex-shader");
  var shaderSource = shaderScript.text;
  var vertexShader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vertexShader, shaderSource);
  gl.compileShader(vertexShader);
	if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
		console.error(gl.getShaderInfoLog(vertexShader));
	}

	// fragment shader:
 	shaderScript   = document.getElementById("2d-fragment-shader");
  shaderSource   = shaderScript.text;
  var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fragmentShader, shaderSource);
  gl.compileShader(fragmentShader);
	if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
		console.error(gl.getShaderInfoLog(fragmentShader));
	}
	
	// shader linking:
  var program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);	
  gl.useProgram(program);
	
	// texture loading:
	var texture;
	/* global */ SetImage = function(image) {
		imageSize = [image.width, image.height];
		resize();
		ResizeImage(image, 1024, 1024, function(image) {
		  gl.bindTexture(gl.TEXTURE_2D, texture);
		  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
		  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		  // gl.generateMipmap(gl.TEXTURE_2D);
		  gl.bindTexture(gl.TEXTURE_2D, null);
		});
	}
	var initTextures = function() {
	  texture = gl.createTexture();
		LoadImage('bridge.jpg', function(image) {
			SetImage(image);
		});
	}
	initTextures();
	
	// shader locations:
	var positionLocation = gl.getAttribLocation(program, "a_position");
	var textureLocation = gl.getUniformLocation(program, "texture");
	var color1Location = gl.getUniformLocation(program, 'color1');
	var color2Location = gl.getUniformLocation(program, 'color2');
	
	// colors:
	var color1 = [1,0,0,1];
	var color2 = [0,1,0,1];
	
	// rendering:
	var render = function() {
		window.requestAnimationFrame(render, canvas);
		gl.clearColor(1,0,0,1);
		gl.clear(gl.COLOR_BUFFER_BIT);
		
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.uniform1i(textureLocation, 0);
		
		gl.uniform4fv(color1Location, color1);
		gl.uniform4fv(color2Location, color2);
		
		gl.enableVertexAttribArray(positionLocation);
		gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
		gl.drawArrays(gl.TRIANGLES, 0, 6);
		
		if (downloadNextFrame) {
			downloadNextFrame = false;
			var popup = document.getElementById("downloadPopup");
			popup.style.display = 'block';
			var image = document.getElementById("downloadImg");
			image.src = canvas.toDataURL();
		}
	}
	render();
	
	// color changing:
	var touchIDs = [];
	var secondTouchID = null;
	var lastPosByID = {};
	var touchesCurrentlyDown = 0;
	var getNormalizedTouchPos = function(event) {
		return {x: event.screenX / window.innerWidth, y: event.screenY / window.innerHeight};
		/*var boundingRect = canvas.getBoundingClientRect();
		var canvasX = boundingRect.left + document.body.scrollLeft;
		var canvasY = boundingRect.top + document.body.scrollTop;
		return {x: (event.pageX - canvasX) / boundingRect.width, y: (event.pageY - canvasY) / boundingRect.height};*/
	}
	var shiftColor = function(color, delta) {
		/*var c = color.slice();
		c[0] = Math.max(0, Math.min(1, color[0] + delta.x));
		c[1] = Math.max(0, Math.min(1, color[1] + delta.y));*/
		var rgb = {r: color[0] * 255, g: color[1] * 255, b: color[2] * 255};
		var hsv = RGBtoHSV(rgb);
		hsv.h += delta.y;
		while (hsv.h > 1) hsv.h -= 1;
		while (hsv.h < 0) hsv.h += 1;
		//hsv.s = Math.max(0, Math.min(1, hsv.s + delta));
		hsv.v = Math.max(0, Math.min(1, hsv.v + delta.x));
		rgb = HSVtoRGB(hsv);
		return [rgb.r / 255, rgb.g / 255, rgb.b / 255, 1];
	}
	canvas.addEventListener('touchstart', function(e) {
		e.preventDefault();
		for (var i=0; i<e.changedTouches.length; i++) {
			var touch = e.changedTouches[i];
			lastPosByID[touch.identifier] = getNormalizedTouchPos(touch);
			touchIDs.push(touch.identifier);
		}
		return false;
	});
	canvas.addEventListener('touchmove', function(e) {
		e.preventDefault();
		for (var i=0; i<e.changedTouches.length; i++) {
			var touch = e.changedTouches[i];
			var newPos = getNormalizedTouchPos(touch);
			var oldPos = lastPosByID[touch.identifier];
			var delta = {x: newPos.x - oldPos.x, y: newPos.y - oldPos.y};
			if (touch.identifier == touchIDs[0]) {
				color1 = shiftColor(color1, delta);
			} else if (touch.identifier == touchIDs[1]) {
				color2 = shiftColor(color2, delta);
			}
			lastPosByID[touch.identifier] = newPos;
		}
		return false;
	});
	canvas.addEventListener('touchend', function(e) {
		e.preventDefault();
		if (e.touches.length == 1) {
			// the last touch is removed; clear our data:
			lastPosByID = {};
		}
		for (var i=0; i<e.changedTouches.length; i++) {
			var touch = e.changedTouches[i];
			touchIDs.splice(touchIDs.indexOf(touch.identifier), 1);
		}
		return false;
	});
}

start();

// setup image input:
function pickedImage(input) {
	if (input.files && input.files[0]) {
	    var reader = new FileReader();
	    reader.onload = function (e) {
				var url = e.target.result;
				LoadImage(url, function(image) {
					SetImage(image);
				});
	    };
	    reader.readAsDataURL(input.files[0]);
	  }
}

function download() {
	downloadNextFrame = true;
}
