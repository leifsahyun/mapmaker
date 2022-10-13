import jimp from 'jimp';

export function convertToImage(data, callback) {
	createColorImage(data, data, data, callback);
}

export function createColorImage(r, g, b, callback) {
	const bytesPer = 4;
	if (!Array.isArray(r) || !Array.isArray(r[0])
		|| !Array.isArray(g) || !Array.isArray(g[0])
		|| !Array.isArray(b) || !Array.isArray(b[0]))
		throw 'Data for conversion must be 2D Arrays';
	var width = r.length;
	var height = r[0].length;
	if (width != g.length || height != g[0].length
		|| width != b.length || height != b[0].length)
		throw 'Arrays to combine must be the same size';
	
	var buf = colMajorSourceToRowMajorBuffer(width, height, bytesPer, (buf, idx, i, j) =>
	{
		buf[idx] = colorConstrain(r[i][j]*255);
		buf[idx+1] = colorConstrain(g[i][j]*255);
		buf[idx+2] = colorConstrain(b[i][j]*255);
		buf[idx+3] = 255;
	});
	
	new jimp({data: buf, width: width, height: height}, (err, image) => {
		if(err) throw err;
		callback(image);
	});
}

export function convertToBuffer(data, callback) {
	const bytesPer = 8;
	var buffer = colMajorArrayToRowMajorBuffer(data, bytesPer, (buf, idx, value) => {
		buf.writeDoubleBE(value, idx);
	});
	callback(buffer);
}

export function convertFromBuffer(buffer, width, height) {
	const bytesPer = 8;
	var data = rowMajorBufferToColMajorArray(buffer, width, height, bytesPer);
	return data;
}

export function averageGrayscaleArrays(arr1, arr2, adjustmentFactor = 1) {
	if (!Array.isArray(arr1) || !Array.isArray(arr1[0]) || !Array.isArray(arr2) || !Array.isArray(arr2[0]) )
		throw 'Objects to combine must be 2D Arrays';
	var width = arr1.length;
	var height = arr1[0].length;
	if (width != arr2.length || height != arr2[0].length)
		throw 'Arrays to combine must be the same size';
	for (var i=0; i<width; i++)
	{
		for (var j=0; j<height; j++)
		{
			arr1[i][j] = (arr1[i][j] + arr2[i][j] * adjustmentFactor) / (1 + adjustmentFactor);
		}
	}
	return arr1;
}

function colMajorArrayToRowMajorBuffer(data, bytesPerItem, fillFunction)
{
	if (!Array.isArray(data) || !Array.isArray(data[0]))
		throw 'Data for conversion must be a 2D Array';
	var width = data.length;
	var height = data[0].length;
	var buf = colMajorSourceToRowMajorBuffer(width, height, bytesPerItem, (buf, idx, i, j) =>
	{
		var value = data[i][j];
		if (value < 0 || value > 1)
			throw 'Expected all array values to be in range [0,1]'
		fillFunction(buf, idx, value);
	});
	return buf;
}

function colMajorSourceToRowMajorBuffer(width, height, bytesPerItem, fillFunction)
{
	var buf = Buffer.alloc(bytesPerItem * width * height);
	for (var i=0; i<width; i++)
	{
		for (var j=0; j<height; j++)
		{
			var idx = bytesPerItem * (j*width + i);
			fillFunction(buf, idx, i, j);
		}
	}
	return buf;
}

function rowMajorBufferToColMajorArray(buffer, width, height, bytesPerItem)
{
	var data = Array(width).fill().map(() => Array(height).fill(0));
	for (var i=0; i<width; i++)
	{
		for (var j=0; j<height; j++)
		{
			var idx = bytesPerItem * (j*width + i);
			data[i][j] = buffer.readDoubleBE(idx);
		}
	}
	return data;
}

function colorConstrain(num) {
	return Math.min(Math.max(Math.floor(num), 0), 255);
}