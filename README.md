# Mapmaker

This is an HTTP service that provides simplex noise based map generation for games. It has API endpoints to grab maps at each stage of the generation process and can be run locally on any machine supporting Node.js and npm or in a Docker container on any cloud provider.

## Running Locally

With Node.js and npm installed run:

```bash
npm run dev
# or
next dev
# or
docker build -t mapmaker .
docker run -p 3000:3000 mapmaker
```

Endpoints will be available at http://localhost:3000/api All endpoints are GET and take parameters as query string encoded values. They can return either a bmp, png, or jpeg image of the map generated or a big-endian, row-major buffer of JS double values representing the grayscale of the image.

## Endpoints

### GET /api/noise

Returns 2D [simplex noise](https://en.wikipedia.org/wiki/Simplex_noise) in the range \[0,1\) with octave combinations and peaks and valleys accentuated by a sigmoid function S(x) = x / (1 + |x|)

**Required Parameters**

x int : X-coordinate of top-left corner of noise

y int : Y-coordinate of top-left corner of noise

width int : Width of noise in pixels

height int : Height of noise in pixels

**Optional Parameters**

freq float : Frequency of noise. Default value 0.005

octaves int : Number of octaves of noise to combine in result. Each octave added to the base has twice the frequency and half the magnitude of the previous one. Default value 1

seed string : Noise randomness seed. Default value 'seed'

type string : Mime type of image to return. Type must be url encoded as a parameter, replacing '/' with '%2F'. 'data', 'buffer' or unsupported types will return an application/octet-stream of doubles describing the noise. Supported image types are image/bmp, image/png, image/jpeg. Default value 'data'

### GET /api/biomes

Returns a section of map with biome coloration. Drier areas are redder, wetter areas are greener, higher up areas are lighter, lower down areas are darker, and there are lakes.

**Optional Parameters**

x int : X-coordinate of top-left corner of noise. Default value 0

y int : Y-coordinate of top-left corner of noise. Default value 0

width int : Width of noise in pixels. Default value 500

height int : Height of noise in pixels. Default value 500

seed string : Noise randomness seed. Default value 'seed'

type string : Mime type of image to return. Type must be url encoded as a parameter, replacing '/' with '%2F'. 'data', 'buffer' or unsupported types will return an application/octet-stream of doubles describing the noise. Supported image types are image/bmp, image/png, image/jpeg. Default value 'data'

### GET /api/rivers

Simulates drainage over an area to produce a map of rivers and lakes. Traces flow from rainfall in each pixel downhill until a minima is reached to produce river traces. When returning a data stream, rivers and lakes are returned separately. Call with type='lakes' or 'saturation' to get lake data; anything else returns river data.

**Optional Parameters**

x int : X-coordinate of top-left corner of noise. Default value 0

y int : Y-coordinate of top-left corner of noise. Default value 0

width int : Width of noise in pixels. Default value 500

height int : Height of noise in pixels. Default value 500

seed string : Noise randomness seed. Default value 'seed'

type string : Mime type of image to return. Type must be url encoded as a parameter, replacing '/' with '%2F'. 'data', 'buffer' or unsupported types will return an application/octet-stream of doubles describing the noise. Supported image types are image/bmp, image/png, image/jpeg. Calling with 'lakes' will return a stream of lake data. Default value 'data'.