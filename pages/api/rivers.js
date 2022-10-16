import {convertFromBuffer, createColorImage, convertToBuffer} from '../../util/image_utils.js'
import fetch from 'node-fetch';

const base_seed = 'seed';
const image_types = ['image/png', 'image/jpeg', 'image/bmp'];
const baseWaterDisplayLevel = 10;
const baseSaturationDisplayLevel = 0.01;
const baseMaxFlowSteps = 10;
const saturationFactor = 0.01;

async function getChannel(channel, x, y, width, height)
{
	var response = await fetch(`http://localhost:3000/api/noise?x=${x}&y=${y}&width=${width}&height=${height}&octaves=6&seed=${channel}`);
	var buf = await response.buffer();
	return convertFromBuffer(buf, width, height);
}

function inBounds(arr, x, y)
{
	return x >= 0 && y >= 0 && x < arr.length && y < arr[0].length;
}

const dirs = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
function lowestNeighbor(terrain, saturation, x, y)
{
	var minX = x, minY = y;
	var minHeight = terrain[x][y] + saturation[x][y];
	for (var point of dirs) {
		var neighborX = x+point[0];
		var neighborY = y+point[1];
		if (!inBounds(terrain, neighborX, neighborY))
			continue;
		try
		{
			var height = terrain[neighborX][neighborY] + saturation[neighborX][neighborY];
			if(height < minHeight)
			{
				minHeight = height;
				minX = neighborX;
				minY = neighborY;
			}
		}
		catch(error)
		{
			console.log("river flow error at ("+neighborX+","+neighborY+")");
			throw error;
		}
	}
	return {x: minX, y: minY, height: minHeight};
}

export default async function rivers(req, res) {
	// Optional params
	var x0 = Number(req.query['x']) || 0;
	var y0 = Number(req.query['y']) || 0;
	var mapWidth = Number(req.query['width']);
	var mapHeight = Number(req.query['height']);
	mapWidth = mapWidth ? mapWidth : 500;
	mapHeight = mapHeight ? mapHeight : 500;
	var seed = req.query['seed'] ? req.query['seed'] : base_seed;
	var return_type = req.query['type'] ? req.query['type'] : 'data';
	var flowFactor = Number(req.query['flowFactor']);
	flowFactor = flowFactor ? flowFactor : 3;
	var waterDisplayLevel = baseWaterDisplayLevel * flowFactor;
	var saturationDisplayLevel = baseSaturationDisplayLevel * flowFactor;
	var maxFlowSteps = Math.floor(baseMaxFlowSteps * flowFactor);
	var wetness = Number(req.query['wetness']) ? Number(req.query['wetness']) : 1;
	// Get maps
	var terrainMap = await getChannel(seed, x0, y0, mapWidth, mapHeight);
	var rainfallMap = await getChannel(seed+'rainfall', x0, y0, mapWidth, mapHeight);
	var flow = Array(mapWidth).fill().map(() => Array(mapHeight).fill(0));
	var saturation = Array(mapWidth).fill().map(() => Array(mapHeight).fill(0));
	
	// Simulate water movement
	for (var y = 0; y < mapHeight; y++)
	{
		for (var x = 0; x < mapWidth; x++)
		{
			var water = rainfallMap[x][y] * wetness;
			var currentX = x;
			var currentY = y;
			var lowest = {x: -1, y: -1};
			for (var i = 0; i < maxFlowSteps; i++)
			{
				flow[currentX][currentY] += water;
				lowest = lowestNeighbor(terrainMap, saturation, currentX, currentY);
				if (lowest.height < terrainMap[currentX][currentY] + saturation[currentX][currentY])
				{
					currentX = lowest.x;
					currentY = lowest.y;
				}
				else
				{
					saturation[currentX][currentY] += water * saturationFactor;
					break;
				}
			}
		}
	}
	
	// Build response image
	if (image_types.includes(return_type))
	{
		// Binarize flow by water level
		var result = Array(mapWidth).fill().map(() => Array(mapHeight).fill(0));
		for (var y = 0; y < mapHeight; y++)
		{
			for (var x = 0; x < mapWidth; x++)
			{
				result[x][y] = (flow[x][y] > waterDisplayLevel || saturation[x][y] > saturationDisplayLevel) ? 1 : 0;
			}
		}
		// Set colors
		var blank = Array(mapWidth).fill().map(() => Array(mapHeight).fill(0));
		createColorImage(blank, blank, result, (image) => {
			image.getBuffer(return_type, (err, resultBuffer) => {
				res.setHeader('Content-Type', return_type).send(resultBuffer);
			});
		});
	}
	else if (return_type === 'lakes' || return_type === 'saturation')
	{
		convertToBuffer(saturation, (buffer) => {
			res.setHeader('Content-Type', 'application/octet-stream').send(buffer);
		});
	}
	else
	{
		convertToBuffer(flow, (buffer) => {
			res.setHeader('Content-Type', 'application/octet-stream').send(buffer);
		});
	}
}