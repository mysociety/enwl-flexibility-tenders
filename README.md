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

## Regenerating dumb-meters.csv

`static/data/dumbmeters.csv` is a CSV of data about electricity and gas meters and consumption, per postcode in the M (Manchester), BL (Bolton), SK (Stockport), WA (Warrington), and WN (Wigan) postcode areas.

To recreate it, you’ll need to download:

- `NSPL_Online_Centroids_2400086033526942602.csv` – [ONS National Statistics Postcode Lookup (NSPL) postcode centroids](https://geoportal.statistics.gov.uk/datasets/2e65b9933cd9483b8724760f27968a48_0/explore), Open Government Licensed
- `Postcode_level_all_meters_electricity_2022.csv` – [Postcode-level all domestic meters electricity 2022](https://www.gov.uk/government/statistics/postcode-level-electricity-statistics-2022), Open Government Licensed
- `Postcode_level_standard_electricity_2022.csv` – [Postcode-level standard domestic electricity 2022](https://www.gov.uk/government/statistics/postcode-level-electricity-statistics-2022), Open Government Licensed
- `Postcode_level_economy_7_electricity_2022.csv` – [Postcode-level Economy 7 domestic electricity 2022](https://www.gov.uk/government/statistics/postcode-level-electricity-statistics-2022), Open Government Licensed
- `Postcode_level_gas_2022.csv` – [Postcode-level domestic gas 2022](https://www.gov.uk/government/statistics/postcode-level-gas-statistics-2022), Open Government Licensed

I used the Python program `csvfilter` to extract just the columns I needed from `NSPL_` (but annoyingly, [an outstanding bug means you need to install a third-party branch](https://github.com/codeinthehole/csvfilter/issues/13) to make it work in this specific situation):

    pipx install "git+https://github.com/lk-jeffpeck/csvfilter.git@ec433f14330fbbf5d41f56febfeedac22868a949"
    csvfilter -f 1,34,35 NSPL_Online_Centroids_2400086033526942602.csv > NSPL.csv

I then created a SQLite3 database to munge the data together into:

    sqlite3 dumb-meters.sqlite

From here on, everything is done from inside the SQLite command prompt. First, creating tables and indexes:

    create table electricity_all(outcode, postcode, num_meters, total_cons_kwh, mean_cons_kwh, median_cons_kwh);
    create table electricity_standard(outcode, postcode, num_meters, total_cons_kwh, mean_cons_kwh, median_cons_kwh);
    create table electricity_economy7(outcode, postcode, num_meters, total_cons_kwh, mean_cons_kwh, median_cons_kwh);
    create table gas(outcode, postcode, num_meters, total_cons_kwh, mean_cons_kwh, median_cons_kwh);
    create table postcodes (postcode, lat, lon);

    create index idx_electricity_all_postcode on electricity_all (postcode);
    create index idx_electricity_standard_postcode on electricity_standard (postcode);
    create index idx_electricity_economy7_postcode on electricity_economy7 (postcode);
    create index idx_gas_postcode on gas (postcode);
    create index idx_postcodes_postcode on postcodes (postcode);

Then importing the data:

    .mode csv
    .import --skip 1 Postcode_level_all_meters_electricity_2022.csv electricity_all
    .import --skip 1 Postcode_level_standard_electricity_2022.csv electricity_standard
    .import --skip 1 Postcode_level_economy_7_electricity_2022.csv electricity_economy7
    .import --skip 1 Postcode_level_gas_2022.csv gas
    .import --skip 1 NSPL.csv postcodes
    .mode columns

Then removing some rows we don’t need (technically this is optional, but it makes things simpler later on):

    delete from gas where postcode='All postcodes';
    delete from electricity_all where postcode='All postcodes';
    delete from electricity_standard where postcode='All postcodes';
    delete from electricity_economy7 where postcode='All postcodes';

Then adding a "cleaned" postcode column, `pc`, that’s standardised across all tables:

    alter table electricity_all add column pc;
    alter table electricity_standard add column pc;
    alter table electricity_economy7 add column pc;
    alter table electricity_gas add column pc;
    alter table postcodes add column pc;

    create index idx_electricity_all_pc on electricity_all (pc);
    create index idx_electricity_standard_pc on electricity_standard (pc);
    create index idx_electricity_economy7_pc on electricity_economy7 (pc);
    create index idx_gas_pc on gas (pc);
    create index idx_postcodes_pc on postcodes (pc);

    update electricity_all set pc = upper(replace(postcode, ' ', ''));
    update electricity_standard set pc = upper(replace(postcode, ' ', ''));
    update electricity_economy7 set pc = upper(replace(postcode, ' ', ''));
    update gas set pc = upper(replace(postcode, ' ', ''));
    update postcodes set pc = upper(replace(postcode, ' ', ''));

Then creating a SQL view that joins all the tables together, picking just the `postcode`, `lat` and `lon` fields, as well as the number of meters and the total consumption:

    create view combined as select electricity_all.postcode, postcodes.lon, postcodes.lat, electricity_all.num_meters as "electricity_all_meters", electricity_all.total_cons_kwh as "electricity_all_consumption_kwh", electricity_standard.num_meters as "electricity_standard_meters", electricity_standard.total_cons_kwh as "electricity_standard_consumption_kwh", electricity_economy7.num_meters as "electricity_economy7_meters", electricity_economy7.total_cons_kwh as "electricity_economy7_consumption_kwh", gas.num_meters as "gas_meters", gas.total_cons_kwh as "gas_consumption_kwh" from electricity_all join electricity_standard on electricity_all.pc = electricity_standard.pc join electricity_economy7 on electricity_all.pc = electricity_economy7.pc join gas on electricity_all.pc = gas.pc join postcodes on electricity_all.pc = postcodes.pc;

Then exporting just the required postcode areas to a CSV:

    .mode csv
    .output dumb-meters.csv
    select * from combined where (postcode like 'M%' and postcode not like 'ME%' and postcode not like 'MK%' and postcode not like 'ML%') or postcode like 'BL%' or postcode like 'SK%' or postcode like 'WA%' or postcode like 'WN%';
    .output stdout
    .mode columns
