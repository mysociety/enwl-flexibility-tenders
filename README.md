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

## Regenerating data

- [Regenerating tenders.csv](#regenerating-tenderscsv)
- [Regenerating tender-areas.geojson](#regenerating-tender-areasgeojson)
- [Regenerating postcode-units.geojson](#regenerating-postcode-unitsgeojson)
- [Regenerating dumb-meters.csv](#regenerating-dumb-meterscsv)
- [Regenerating warm-homes-local-grant-postcodes.csv](#regenerating-warm-homes-local-grant-postcodescsv)
- [Regenerating smart-meters.geojson](#regenerating-smart-metersgeojson)

### Regenerating tenders.csv

`static/data/tenders.csv` is a simplified copy of the [tender requirements CSV provided by ENWL](https://electricitynorthwest.opendatasoft.com/explore/dataset/enwl-flexibility-tender-site-requirements/export/).

To recreate it, you’ll need to:

- [Download ENWL’s tender requirements CSV](https://electricitynorthwest.opendatasoft.com/explore/dataset/enwl-flexibility-tender-site-requirements/export/) – let’s call it `enwl-flexibility-tender-postcode-data.csv`
- Install `csvfilter` to extract just the columns we need from `enwl-flexibility-tender-postcode-data.csv` (annoyingly, [an outstanding bug means you need to install a third-party branch](https://github.com/codeinthehole/csvfilter/issues/13) to make it work in this specific situation):

       pipx install "git+https://github.com/lk-jeffpeck/csvfilter.git@ec433f14330fbbf5d41f56febfeedac22868a949"

Then use `csvfilter` to pick out just the columns we need, into `static/data/tenders.csv`:

    csvfilter -f 2,3,5,6,7,8,9,10,11,12,17,18,19,20,21,22,23 enwl-flexibility-tender-postcode-data.csv > static/data/tenders.csv

### Regenerating tender-areas.geojson

`static/data/tender-areas.json` is a GeoJSON FeatureCollection of areas with ENWL flexibility tender requirements (Spring 2024 round) that we’re interested in, in the Greater Manchester area.

[ENWL provides a GeoJSON file of their tender requirements](https://electricitynorthwest.opendatasoft.com/explore/dataset/enwl-flexibility-tender-site-requirements/export/), but it includes duplicate polygons (the same area can have multiple tenders of different types at different times). For simplicity, we deduplicate these polygons, with `script/generate-tender-areas`.

To regenerate `tender-areas.geojson`, you will need to:

- Install the [`mapshaper` command line utility](https://github.com/mbloch/mapshaper)
- Download the GeoJSON file of [ENWL tender requirements](https://electricitynorthwest.opendatasoft.com/explore/dataset/enwl-flexibility-tender-site-requirements/export/)

Then run `script/generate-tender-areas` to output just the tender areas we care about, to `static/data/tender-areas.geojson`:

    script/generate-tender-areas /path/to/enwl-flexibility-tenders.geojson

**NOTE:** If you change the list of tender areas that you’re interested in, you’ll also want to change the hand-picked postcode units in `script/generate-postcode-units`, and the `where tender_area` clause in the `dumb-meters.csv` SQL below.

### Regenerating postcode-units.geojson

`static/data/postcode-units.geojson` contains the boundary polygon data for all postcode units (eg: `M15 5DD`) inside the ENWL tender areas (see `tender-areas.geojson` above), based on [postcode boundaries from the wonderful Mark Longair](https://longair.net/blog/2021/08/23/open-data-gb-postcode-unit-boundaries/).

To regenerate them, you’ll first need to:

- Install the [`mapshaper` command line utility](https://github.com/mbloch/mapshaper)
- Generate `static/data/tender-areas.geojson` using `script/generate-tender-areas`, as described above
- Download and unarchive [Mark Longair’s postcode boundaries data](https://longair.net/blog/2021/08/23/open-data-gb-postcode-unit-boundaries/) (approx 1 GB download, 4.25 GB once unarchived)

Then, with these things in place, you can run `script/generate-postcode-units`, passing in the path to the `units` directory inside Mark’s data, to output just the boundaries we need to `static/data/postcode-units.geojson`:

    script/generate-postcode-units /path/to/gb-postcodes-v5/units

Note that `script/generate-postcode-units` removes overlaps when exporting, with mapshaper’s `-clean` operation. We do this to reduce filesize and prevent duplicate/identical polygons from appearing in the output (and being stacked on top of one another on the map). But it is _not_ really how postcodes work in the real world, and it means some postcodes with useful data might end up missing from our map (eg: multiple postcodes covering different floors in a single block of flats).

### Regenerating dumb-meters.csv

`static/data/dumb-meters.csv` is a CSV of data about electricity and gas meters and consumption, per postcode in ENWL tender areas.

To recreate it, you’ll need to download:

- `enwl-flexibility-tender-postcode-data.csv` – [ENWL Flexibility Tender - Postcode Data](https://electricitynorthwest.opendatasoft.com/explore/dataset/enwl-flexibility-tender-postcode-data/information/)
- `Postcode_level_all_meters_electricity_2022.csv` – [Postcode-level all domestic meters electricity 2022](https://www.gov.uk/government/statistics/postcode-level-electricity-statistics-2022), Open Government Licensed
- `Postcode_level_standard_electricity_2022.csv` – [Postcode-level standard domestic electricity 2022](https://www.gov.uk/government/statistics/postcode-level-electricity-statistics-2022), Open Government Licensed
- `Postcode_level_economy_7_electricity_2022.csv` – [Postcode-level Economy 7 domestic electricity 2022](https://www.gov.uk/government/statistics/postcode-level-electricity-statistics-2022), Open Government Licensed
- `Postcode_level_gas_2022.csv` – [Postcode-level domestic gas 2022](https://www.gov.uk/government/statistics/postcode-level-gas-statistics-2022), Open Government Licensed

I used the Python program `csvfilter` to extract just the columns I needed from `enwl-flexibility-tender-postcode-data.csv` (but annoyingly, [an outstanding bug means you need to install a third-party branch](https://github.com/codeinthehole/csvfilter/issues/13) to make it work in this specific situation):

    pipx install "git+https://github.com/lk-jeffpeck/csvfilter.git@ec433f14330fbbf5d41f56febfeedac22868a949"
    csvfilter -f 0,1 enwl-flexibility-tender-postcode-data.csv > enwl-postcodes.csv

I then created a SQLite3 database to munge the data together into:

    sqlite3 dumb-meters.sqlite

From here on, everything is done from inside the SQLite command prompt. First, creating tables and indexes:

    create table electricity_all(outcode, postcode, num_meters, total_cons_kwh, mean_cons_kwh, median_cons_kwh);
    create table electricity_standard(outcode, postcode, num_meters, total_cons_kwh, mean_cons_kwh, median_cons_kwh);
    create table electricity_economy7(outcode, postcode, num_meters, total_cons_kwh, mean_cons_kwh, median_cons_kwh);
    create table gas(outcode, postcode, num_meters, total_cons_kwh, mean_cons_kwh, median_cons_kwh);
    create table postcodes(postcode, tender_area);

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
    .import --skip 1 enwl-postcodes.csv postcodes
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
    alter table gas add column pc;
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

Then creating a SQL view that joins all the tables together, picking just location data, the numbers of meters, and the total consumptions:

    create view
        combined
    as
        select
            postcodes.postcode,
            postcodes.tender_area,
            electricity_all.num_meters as "electricity_all_meters",
            electricity_all.total_cons_kwh as "electricity_all_consumption_kwh",
            electricity_all.mean_cons_kwh as "electricity_all_mean_cons_kwh",
            electricity_all.median_cons_kwh as "electricity_all_median_cons_kwh",
            electricity_standard.num_meters as "electricity_standard_meters",
            electricity_standard.total_cons_kwh as "electricity_standard_consumption_kwh",
            electricity_standard.mean_cons_kwh as "electricity_standard_mean_cons_kwh",
            electricity_standard.median_cons_kwh as "electricity_standard_median_cons_kwh",
            electricity_economy7.num_meters as "electricity_economy7_meters",
            electricity_economy7.total_cons_kwh as "electricity_economy7_consumption_kwh",
            electricity_economy7.mean_cons_kwh as "electricity_economy7_mean_cons_kwh",
            electricity_economy7.median_cons_kwh as "electricity_economy7_median_cons_kwh",
            gas.num_meters as "gas_meters",
            gas.total_cons_kwh as "gas_consumption_kwh",
            gas.mean_cons_kwh as "gas_mean_cons_kwh",
            gas.median_cons_kwh as "gas_median_cons_kwh"
        from
            postcodes
        left join
            electricity_all on postcodes.pc = electricity_all.pc
        left join
            electricity_standard on electricity_all.pc = electricity_standard.pc
        left join
            electricity_economy7 on electricity_all.pc = electricity_economy7.pc
        left join
            gas on electricity_all.pc = gas.pc;

Then exporting data from just the required tender areas, to a CSV:

    .mode csv
    .output ../static/data/dumb-meters.csv
    select
        postcode,
        tender_area,
        electricity_all_meters,
        cast(round(electricity_all_consumption_kwh) as int) as "electricity_all_consumption_kwh",
        cast(round(electricity_all_mean_cons_kwh) as int) as "electricity_all_mean_cons_kwh",
        cast(round(electricity_all_median_cons_kwh) as int) as "electricity_all_median_cons_kwh",
        electricity_standard_meters,
        cast(round(electricity_standard_consumption_kwh) as int) as "electricity_standard_consumption_kwh",
        cast(round(electricity_standard_mean_cons_kwh) as int) as "electricity_standard_mean_cons_kwh",
        cast(round(electricity_standard_median_cons_kwh) as int) as "electricity_standard_median_cons_kwh",
        electricity_economy7_meters,
        cast(round(electricity_economy7_consumption_kwh) as int) as "electricity_economy7_consumption_kwh",
        cast(round(electricity_economy7_mean_cons_kwh) as int) as "electricity_economy7_mean_cons_kwh",
        cast(round(electricity_economy7_median_cons_kwh) as int) as "electricity_economy7_median_cons_kwh",
        gas_meters,
        cast(round(gas_consumption_kwh) as int) as "gas_consumption_kwh",
        cast(round(gas_mean_cons_kwh) as int) as "gas_mean_cons_kwh",
        cast(round(gas_median_cons_kwh) as int) as "gas_median_cons_kwh"
    from
        combined
    where
        tender_area in ('ARDWICK', 'BOLTON BY BOWLAND', 'CATTERALL WATER WKS', 'CHORLEY SOUTH', 'CONISTON', 'FREDERICK RD GRID', 'PEEL ST', 'MARPLE', 'MOSS LN', 'MOSS SIDE', 'Moss Side (Leyland) & Seven Stars', 'SETTLE');
    .output stdout
    .mode columns

### Regenerating warm-homes-local-grant-postcodes.csv

`static/data/warm-homes-local-grant-postcodes.csv` is a CSV of the postcodes and local authorities in [DESNZ’s Excel spreadsheet of postcodes elligible for the December 2024 round of Warm Homes Local Grants](https://www.gov.uk/government/publications/warm-homes-local-grant) and _also_ within the ENWL tender areas.

To create it, I exported a CSV of the "Postcode" and "Local authority" columns from the DESNZ spreadsheet, and then imported it into a SQLite database:

    sqlite3 warm-home-local-grant.sqlite

From here on, everything was done from inside the SQLite command prompt. First, creating tables and indexes:

    create table grants(postcode, local_authority);
    create table postcodes(postcode, tender_area);

    create index idx_grants_postcode on grants (postcode);
    create index idx_postcodes_postcode on postcodes (postcode);

Then importing the data:

    .mode csv
    .import --skip 1 warm-homes-local-grant.csv grants
    .import --skip 1 enwl-postcodes.csv postcodes
    .mode columns

Then adding a "cleaned" postcode column, `pc`, that’s standardised across both tables:

    alter table grants add column pc;
    alter table postcodes add column pc;

    create index idx_grants_pc on grants (pc);
    create index idx_postcodes_pc on postcodes (pc);

    update grants set pc = upper(replace(postcode, ' ', ''));
    update postcodes set pc = upper(replace(postcode, ' ', ''));

Then creating a SQL view that joins the two tables together:

    create view
        combined
    as
        select
            postcodes.postcode,
            postcodes.tender_area,
            grants.local_authority
        from
            postcodes
        inner join
            grants on postcodes.pc = grants.pc;

Then exporting data from just the required tender areas, to a CSV:

    .mode csv
    .output ../static/data/warm-homes-local-grant-postcodes.csv
    select
        postcode,
        tender_area,
        local_authority
    from
        combined
    where
        tender_area in ('ARDWICK', 'BOLTON BY BOWLAND', 'CATTERALL WATER WKS', 'CHORLEY SOUTH', 'CONISTON', 'FREDERICK RD GRID', 'PEEL ST', 'MARPLE', 'MOSS LN', 'MOSS SIDE', 'Moss Side (Leyland) & Seven Stars', 'SETTLE');
    .output stdout
    .mode columns

### Regenerating smart-meters.geojson

`static/data/smart-meters.geojson` is a GeoJSON file of points representing smart meters, in the ENWL tender areas we’re interested in.

To recreate it, you’ll need to:

- Install the [`mapshaper` command line utility](https://github.com/mbloch/mapshaper)
- Generate `static/data/tender-areas.geojson` using `script/generate-tender-areas`, as described above
- Download [ENWL’s Smart Meter Installation GeoJSON file](https://electricitynorthwest.opendatasoft.com/explore/dataset/smart-meter-installation/information/?disjunctive.dist_number&disjunctive.pry_feeder) – which we’ll refer to as `smart-meter-installation.geojson` below

Then, with these things in place, you can run `script/generate-smart-meters`, passing in the path to the `smart-meter-installation.geojson` file, to output just the points we need to `static/data/smart-meters.geojson`:

    script/generate-smart-meters /path/to/smart-meter-installation.geojson
