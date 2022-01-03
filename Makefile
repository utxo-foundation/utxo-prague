NAME = gweicz/utxo
VERSION = 0.1.0

.PHONY: all build

all: build

build:
	deno run --unstable --allow-read --allow-write utils/build.js

docs-update:
	deno run --allow-read --allow-write utils/update-docs.js

speakers-table:
	deno run --allow-read --allow-write utils/update-docs.js speakersTableGen

speakers-leads:
	deno run --allow-read --allow-write utils/update-docs.js speakersLeadsGen
