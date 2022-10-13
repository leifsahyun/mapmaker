import fetch from 'node-fetch';
import jimp from 'jimp';

const base_seed = 'seed';
const image_types = ['image/png', 'image/jpeg', 'image/bmp'];
const riverColor = jimp.rgbaToInt(50, 50, 185, 255); //jimp.rgbaToInt(100, 100, 255, 255);

async function getEndpointImage(endpoint, seed, x, y, width, height)
{
	var response = await fetch(`http://localhost:3000/api/${endpoint}?x=${x}&y=${y}&width=${width}&height=${height}&seed=${seed}&type=image%2Fpng`);
	var buf = await response.buffer();
	var image = await jimp.read(buf);
	return image;
}

export default async function map(req, res) {
	// Optional params
	var x0 = Number(req.query['x']) || 0;
	var y0 = Number(req.query['y']) || 0;
	var mapWidth = Number(req.query['width']);
	var mapHeight = Number(req.query['height']);
	mapWidth = mapWidth ? mapWidth : 500;
	mapHeight = mapHeight ? mapHeight : 500;
	var seed = req.query['seed'] ? req.query['seed'] : base_seed;
	var return_type = req.query['type'] ? req.query['type'] : 'image/png';
	// Get maps
	var biomeImage = await getEndpointImage('biomes', seed, x0, y0, mapWidth, mapHeight);
	var riverImage = await getEndpointImage('rivers', seed, x0, y0, mapWidth, mapHeight);
	// Add rivers to biomes; there's probably a better way to do this
	for (var y = 0; y < mapHeight; y++)
	{
		for (var x = 0; x < mapWidth; x++)
		{
			var riverBlue = jimp.intToRGBA(riverImage.getPixelColor(x,y)).b;
			var biomeLand = jimp.intToRGBA(biomeImage.getPixelColor(x,y)).g;
			if(riverBlue > 0 && biomeLand > 0)
				biomeImage.setPixelColor(riverColor, x, y);
		}
	}
	// Return response image
	if (image_types.includes(return_type))
	{
		biomeImage.getBuffer(return_type, (err, resultBuffer) => {
			res.setHeader('Content-Type', return_type).send(resultBuffer);
		});
	}
	else
	{
		res.sendStatus(400);
	}
}