import { createNoise2D } from 'simplex-noise';
import alea from 'alea';
import { convertToImage, convertToBuffer } from '../../util/image_utils.js'

const base_seed = 'seed';
const image_types = ['image/png', 'image/jpeg', 'image/bmp'];

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
	var return_type = req.query['type'];
	if(!freq)
		freq = 0.005;
	if(!octaves)
		octaves = 1;
	if(!seed)
		seed = base_seed;
	if(!return_type)
		return_type = 'data';
	
	// Create octaves
	var noise = [];
	for (var i = 0; i < octaves; i++)
	{
		noise[i] = createNoise2D(alea(seed+i));
	}
	
	// Generate data
	var data = Array(width).fill().map(() => Array(height).fill(0));
	for (var x = 0; x < width; x++) {
		for (var y = 0; y < height; y++) {
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
			value = value / (1 + Math.abs(value)) + 0.5;
			// Set data in buffer
			data[x][y] = value;
		}
	}
	
	// Build response image
	if (image_types.includes(return_type))
	{
		convertToImage(data, (image) => {
			image.getBuffer(return_type, (err, resultBuffer) => {
				res.setHeader('Content-Type', return_type).send(resultBuffer);
			});
		});
	}
	else
	{
		convertToBuffer(data, (buffer) => {
			res.send(buffer);
		});
	}
}
