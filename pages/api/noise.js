import { createNoise2D } from 'simplex-noise';
import alea from 'alea';
import jimp from 'jimp';

const base_seed = 'seed';

export default function noise(req, res) {
	// Required params
	var x0 = Number(req.query['x']);
	var y0 = Number(req.query['y']);
	var width = Number(req.query['width']);
	var height = Number(req.query['height']);
	if(isNaN(x0) || isNaN(y0) || !width || !height)
	{
		res.sendStatus(400);
		return;
	}
	// Optional params
	var freq = Number(req.query['freq']);
	var octaves = Number(req.query['octaves']);
	var seed = req.query['seed'];
	if(!freq)
		freq = 0.005;
	if(!octaves)
		octaves = 1;
	if(!seed)
		seed = base_seed;
	
	// Create octaves
	var noise = [];
	for (var i = 0; i < octaves; i++)
	{
		noise[i] = createNoise2D(alea(seed+i));
	}
	
	// Generate data
	var buf = Buffer.alloc(4 * width * height);
	for (var y = 0; y < height; y++) {
		for (var x = 0; x < width; x++) {
			var idx = 4 * (y*width + x);
			var value = 0;
			// Sum octave data
			for (var i = 0; i < octaves; i++)
			{
				var octavePow = 1 << i;
				value += noise[i](freq*octavePow*(x+x0),freq*octavePow*(y+y0)) / octavePow 
			}
			// Adjust for extra range from octave addition
			value = value / (2 - (0.5 ** (octaves-1)));
			// Accentuate peaks and valleys
			value = 2*value / (1 + Math.abs(value));
			// Set data in buffer
			buf[idx] = buf[idx+1] = buf[idx+2] = buf[idx+3] = Math.floor(128+128*value);
		}
	}
	
	// Build response image
	new jimp({data: buf, width: width, height: height}, (err, image) => {
		if(err) throw err;
		image.getBuffer(jimp.MIME_PNG, (err, resultBuffer) => {
			res.setHeader('Content-Type', 'image/png').send(resultBuffer);
		});
	});
}
