import {convertFromBuffer, createColorImage, averageGrayscaleArrays, convertToBuffer} from '../../util/image_utils.js'
import fetch from 'node-fetch';

const base_seed = 'seed';
const image_types = ['image/png', 'image/jpeg', 'image/bmp'];
const waterLevel = 0.3;

async function getChannel(channel, x, y, width, height)
{
	var response = await fetch(`http://localhost:3000/api/noise?x=${x}&y=${y}&width=${width}&height=${height}&octaves=6&seed=${channel}`);
	var buf = await response.buffer();
	return convertFromBuffer(buf, width, height);
}

export default async function biomes(req, res) {
	// Optional params
	var x0 = Number(req.query['x']) || 0;
	var y0 = Number(req.query['y']) || 0;
	var mapWidth = Number(req.query['width']);
	var mapHeight = Number(req.query['height']);
	mapWidth = mapWidth ? mapWidth : 500;
	mapHeight = mapHeight ? mapHeight : 500;
	var seed = req.query['seed'] ? req.query['seed'] : base_seed;
	var return_type = req.query['type'] ? req.query['type'] : 'data';
	// Get maps
	var terrainMap = await getChannel(seed, x0, y0, mapWidth, mapHeight);
	var rainfallMap = await getChannel(seed+'rainfall', x0, y0, mapWidth, mapHeight);
	var r = Array(mapWidth).fill().map(() => Array(mapHeight).fill(0));
	var g = Array(mapWidth).fill().map(() => Array(mapHeight).fill(0));
	var b = Array(mapWidth).fill().map(() => Array(mapHeight).fill(0));
	// Calculate biome colors
	for (var y = 0; y < mapHeight; y++)
	{
		for (var x = 0; x < mapWidth; x++)
		{
			var height = terrainMap[x][y];
			var rainfall = rainfallMap[x][y];
			r[x][y] = height<waterLevel ? 0 : Math.min(height * (1.5 - rainfall), 1);
			b[x][y] = height<waterLevel ? height+0.1 : height**2;
			g[x][y] = height<waterLevel ? 0 : height;
		}
	}
	// Build response image
	if (image_types.includes(return_type))
	{
		createColorImage(r, g, b, (image) => {
			image.getBuffer(return_type, (err, resultBuffer) => {
				res.setHeader('Content-Type', return_type).send(resultBuffer);
			});
		});
	}
	else
	{
		var result = averageGrayscaleArrays(averageGrayscaleArrays(r, g), b, 0.33);
		convertToBuffer(result, (buffer) => {
			res.setHeader('Content-Type', 'application/octet-stream').send(buffer);
		});
	}
}