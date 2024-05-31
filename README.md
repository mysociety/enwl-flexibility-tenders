# ENWL flexibility tenders

A map of [Spring 2024 flexibility tender areas from Electricity North West](https://electricitynorthwest.opendatasoft.com/explore/dataset/enwl-flexibility-tender-site-requirements/information/).

## Use it online

Visit <https://mysociety.github.io/enwl-flexibility-tenders>.

All modern browsers are supported. Internet Explorer is not. See `.browserlistrc` for details.

## Running locally

Requirements:

- [Ruby](https://www.ruby-lang.org/en/documentation/installation/)
- [Bundler](https://bundler.io/#getting-started)

Install all dependencies and get a local server running immediately, in one command:

    script/server

The site will be available at both <http://localhost:4000> and <http://0.0.0.0:4000>.

If you want to serve locally over SSL (recommended) then generate self-signed SSL certificates with:

    script/generate-ssl-certificates

Once the SSL certificates are in place, `script/server` will serve the site over HTTPS, at both <https://localhost:4000> and <https://0.0.0.0:4000>. (You will need to tell your web browser to accept the self-signed certificate.)

You can build the site to `_site` (without serving it) with:

    script/build

## Regenerating areas.geojson

`static/js/areas.json` is a GeoJSON FeatureCollection of areas with ENWL flexibility tender requirements (Spring 2024 round), in the Greater Manchester area.

[ENWL provides a GeoJSON file of their tender requirements](https://electricitynorthwest.opendatasoft.com/explore/dataset/enwl-flexibility-tender-site-requirements/export/), but it includes duplicate polygons (if a substation area has multiple tenders at different times, it is represented by multiple identical polygons). For simplicity, we deduplicate these polygons, with `script/process-enwl-tenders-geojson`.

To regenerate `areas.geojson`, you will need:

- [Node.js](https://nodejs.org)

Then (assuming you’ve downloaded the ENWL GeoJSON to `./enwl-flexibility-tenders.geojson`) run:

    script/process-enwl-tenders enwl-flexibility-tenders.geojson > static/js/areas.geojson
