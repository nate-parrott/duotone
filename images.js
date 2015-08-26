
function LoadImage(url, callback) {
	var image = new Image();
	image.onload = function() {
		callback(image);
	}
	image.src = url;
}

function ResizeImage(image, width, height, callback) {
	var canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	var ctx = canvas.getContext('2d');
	ctx.drawImage(image, 0, 0, width, height);
	LoadImage(canvas.toDataURL('image/png'), callback);
}
