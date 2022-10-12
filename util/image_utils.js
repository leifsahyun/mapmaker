import jimp from 'jimp';

export function convertToImage(data, callback) {
	const bytesPer = 4;
	var buffer = colMajorArrayToRowMajorBuffer(data, bytesPer, (buf, value, idx) => {
		buf[idx] = buf[idx+1] = buf[idx+2] = buf[idx+3] = Math.floor(255*value);
	});
	var width = data.length;
	var height = data[0].length;
	new jimp({data: buffer, width: width, height: height}, (err, image) => {
		if(err) throw err;
		callback(image);
	});
}

export function convertToBuffer(data, callback) {
	const bytesPer = 8;
	var buffer = colMajorArrayToRowMajorBuffer(data, bytesPer, (buf, value, idx) => {
		buf.writeDoubleBE(value, idx);
	});
	callback(buffer);
}

function colMajorArrayToRowMajorBuffer(data, bytesPerItem, fillFunction)
{
	if (!Array.isArray(data) || !Array.isArray(data[0]))
		throw 'Data for conversion must be a 2D Array';
	var width = data.length;
	var height = data[0].length;
	var buf = Buffer.alloc(bytesPerItem * width * height);
	for (var i=0; i<width; i++)
	{
		for (var j=0; j<height; j++)
		{
			var idx = bytesPerItem * (j*width + i);
			var value = data[i][j];
			if (value < 0 || value > 1)
				throw 'Expected all array values to be in range [0,1]'
			fillFunction(buf, value, idx);
		}
	}
	return buf;
}