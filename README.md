# Mapmaker

This is an HTTP service that provides simplex noise based map generation for games. It has API endpoints to grab maps at each stage of the generation process and can be run locally on any machine supporting Node.js and npm or in a Docker container on any cloud provider.

## Running Locally

With Node.js and npm installed run:

```bash
npm run dev
# or
yarn dev
```

Endpoints will be available at http://localhost:3000/api All endpoints are GET and take parameters as query string encoded values. They can return either a PNG image of the map generated or a 2D JS float array representing the grayscale of the image.

## Endpoints

### GET /api/noise

Returns 2D [simplex noise](https://en.wikipedia.org/wiki/Simplex_noise) in the range \[0,1\) with octave combinations and peaks and valleys accentuated by a sigmoid function S(x) = 2x / (1 + |x|)

**Required Parameters**

x int : X-coordinate of top-left corner of noise

y int : Y-coordinate of top-left corner of noise

width int : Width of noise in pixels

height int : Height of noise in pixels

**Optional Parameters**

freq float : Frequency of noise. Default value 0.005

octaves int : Number of octaves of noise to combine in result. Each octave added to the base has twice the frequency and half the magnitude of the previous one. Default value 1

seed string : Noise randomness seed. Default value 'seed'

