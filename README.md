```
██╗░░░██╗████████╗██╗░░██╗░█████╗░
██║░░░██║╚══██╔══╝╚██╗██╔╝██╔══██╗
██║░░░██║░░░██║░░░░╚███╔╝░██║░░██║
██║░░░██║░░░██║░░░░██╔██╗░██║░░██║
╚██████╔╝░░░██║░░░██╔╝╚██╗╚█████╔╝
░╚═════╝░░░░╚═╝░░░╚═╝░░╚═╝░╚════╝░
```

> Otevřená komunitní kryptoměnová konference

[![Test, build, deploy](https://github.com/gweicz/utxo/actions/workflows/deploy.yml/badge.svg)](https://github.com/gweicz/utxo/actions/workflows/deploy.yml)

Tento repozitář obsahuje základní specifikace (datové zdroje) všech ročníků
konference.

Veškeré informace o konferenci naleznete na
[docs.utxo.cz](https://docs.utxo.cz).

## Specifikace

- Zdrojové soubory ve formátu [YAML](https://yaml.org/) jsou umístěny v adresáři
  [`spec`](./spec).
- Validační schéma ([JSON Schema](https://json-schema.org/)) najdete v adresáři
  [`utils/schema`](./utils/schema)

Jako runtime se využívá Javascriptové [Deno](https://deno.land/).

## Ročníky

| Ročník          | Název       | Datum konání | Místo               |
| --------------- | ----------- | ------------ | ------------------- |
| [23](./spec/23) | **UTXO.23** | 2.-4.6.2022  | TBA                 |
| [22](./spec/22) | **UTXO.22** | 4.-5.6.2022  | Gabriel Loci, Praha |

## HTTP Endpoint

Veřejný HTTP endpoint s datovými soubory ve formátu JSON naleznete na adrese:

- [https://spec.utxo.cz/](https://spec.utxo.cz/)

## Bundle

Všechny datové sady v jednom souboru:

- [https://spec.utxo.cz/23/bundle.json](https://spec.utxo.cz/23/bundle.json)

## Datové sady

|              | Popis                                       | Ročník 2022                                                                    |
| ------------ | ------------------------------------------- | ------------------------------------------------------------------------------ |
| **index**    | Základní údaje o ročníku                    | [https://spec.utxo.cz/23/](https://spec.utxo.cz/23/)                           |
| **speakers** | Přednášející                                | [https://spec.utxo.cz/23/speakers.json](https://spec.utxo.cz/23/speakers.json) |
| **tracks**   | Programové sekce                            | [https://spec.utxo.cz/23/tracks.json](https://spec.utxo.cz/23/tracks.json)     |
| **events**   | Události                                    | [https://spec.utxo.cz/23/events.json](https://spec.utxo.cz/23/events.json)     |
| **faqs**     | Často kladené dotazy (FAQ)                  | [https://spec.utxo.cz/23/faqs.json](https://spec.utxo.cz/23/faqs.json)         |
| **partners** | Partneři (sponzoři, mediální partneři atp.) | [https://spec.utxo.cz/23/partners.json](https://spec.utxo.cz/23/partners.json) |
| **projects** | Projekty                                    | [https://spec.utxo.cz/23/projects.json](https://spec.utxo.cz/23/projects.json) |

Schema si můžete prohlédnout zde:
https://json-schema.app/view/%23%2Fdefinitions%2Fspeaker?url=https%3A%2F%2Fspec.utxo.cz%2Fschema%2F1%2Fbundle.json

## Kontakt

- Web: [utxo.cz](https://utxo.cz)
- Dokumentace: [docs.utxo.cz](https://docs.utxo.cz)
- Foundation: [utxo.foundation](https://utxo.foundation)
