import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7/+esm';
import * as topojson from 'https://cdn.jsdelivr.net/npm/topojson-client@3/+esm';
import { destinationPoint } from './geodesy.js';

// ISO 3166-1 numeric → country name
const ISO_NAMES = {
  4: 'Afghanistan', 8: 'Albania', 12: 'Algeria', 24: 'Angola',
  32: 'Argentina', 36: 'Australia', 40: 'Austria', 50: 'Bangladesh',
  56: 'Belgium', 64: 'Bhutan', 68: 'Bolivia', 76: 'Brazil',
  100: 'Bulgaria', 116: 'Cambodia', 120: 'Cameroon', 124: 'Canada',
  144: 'Sri Lanka', 152: 'Chile', 156: 'China', 170: 'Colombia',
  174: 'Comoros', 178: 'Rep. Congo', 180: 'Dem. Rep. Congo',
  188: 'Costa Rica', 191: 'Croatia', 192: 'Cuba', 196: 'Cyprus',
  203: 'Czech Republic', 204: 'Benin', 208: 'Denmark', 214: 'Dominican Republic',
  218: 'Ecuador', 222: 'El Salvador', 231: 'Ethiopia', 232: 'Eritrea',
  233: 'Estonia', 238: 'Falkland Islands', 242: 'Fiji', 246: 'Finland',
  250: 'France', 262: 'Djibouti', 266: 'Gabon', 270: 'Gambia',
  268: 'Georgia', 276: 'Germany', 288: 'Ghana', 300: 'Greece',
  304: 'Greenland', 308: 'Grenada', 320: 'Guatemala', 324: 'Guinea',
  328: 'Guyana', 332: 'Haiti', 340: 'Honduras', 348: 'Hungary',
  352: 'Iceland', 356: 'India', 360: 'Indonesia', 364: 'Iran',
  368: 'Iraq', 372: 'Ireland', 376: 'Israel', 380: 'Italy',
  388: 'Jamaica', 392: 'Japan', 398: 'Kazakhstan', 400: 'Jordan',
  404: 'Kenya', 408: 'North Korea', 410: 'South Korea',
  414: 'Kuwait', 418: 'Laos', 422: 'Lebanon', 426: 'Lesotho',
  428: 'Latvia', 430: 'Liberia', 434: 'Libya', 440: 'Lithuania',
  450: 'Madagascar', 454: 'Malawi', 458: 'Malaysia', 466: 'Mali',
  478: 'Mauritania', 484: 'Mexico', 496: 'Mongolia', 498: 'Moldova',
  504: 'Morocco', 508: 'Mozambique', 516: 'Namibia', 524: 'Nepal',
  528: 'Netherlands', 540: 'New Caledonia', 554: 'New Zealand',
  558: 'Nicaragua', 562: 'Niger', 566: 'Nigeria', 578: 'Norway',
  586: 'Pakistan', 591: 'Panama', 598: 'Papua New Guinea',
  600: 'Paraguay', 604: 'Peru', 608: 'Philippines', 616: 'Poland',
  620: 'Portugal', 634: 'Qatar', 642: 'Romania', 643: 'Russia',
  646: 'Rwanda', 659: 'St Kitts and Nevis', 662: 'St Lucia',
  670: 'St Vincent', 678: 'São Tomé and Príncipe', 682: 'Saudi Arabia',
  686: 'Senegal', 694: 'Sierra Leone', 703: 'Slovakia', 705: 'Slovenia',
  706: 'Somalia', 710: 'South Africa', 716: 'Zimbabwe', 724: 'Spain',
  729: 'Sudan', 740: 'Suriname', 752: 'Sweden', 756: 'Switzerland',
  158: 'Taiwan', 762: 'Tajikistan', 764: 'Thailand', 768: 'Togo',
  780: 'Trinidad and Tobago', 788: 'Tunisia', 792: 'Turkey',
  795: 'Turkmenistan', 800: 'Uganda', 804: 'Ukraine',
  784: 'United Arab Emirates', 826: 'United Kingdom',
  840: 'United States', 858: 'Uruguay', 860: 'Uzbekistan',
  862: 'Venezuela', 704: 'Vietnam', 834: 'Tanzania', 887: 'Yemen',
  894: 'Zambia', 51: 'Armenia', 31: 'Azerbaijan', 44: 'Bahamas',
  50: 'Bangladesh', 72: 'Botswana', 84: 'Belize', 96: 'Brunei',
  112: 'Belarus', 132: 'Cape Verde', 140: 'Central African Republic',
  148: 'Chad', 70: 'Bosnia and Herzegovina', 90: 'Solomon Islands',
  626: 'Timor-Leste', 748: 'Eswatini', 760: 'Syria',
  275: 'Palestine', 388: 'Jamaica', 462: 'Maldives',
};

let landFeature = null;
let countryFeatures = [];

export async function init() {
  const [landTopo, countriesTopo] = await Promise.all([
    fetch('./data/land-110m.json').then(r => r.json()),
    fetch('./data/countries-110m.json').then(r => r.json()),
  ]);
  landFeature = topojson.feature(landTopo, landTopo.objects.land);
  countryFeatures = topojson.feature(countriesTopo, countriesTopo.objects.countries).features;
}

export function findLandfall(lon, lat, bearingDeg) {
  if (!landFeature) return null;
  let inOcean = false;
  for (let dist = 50; dist <= 20000; dist += 50) {
    const [pLon, pLat] = destinationPoint(lon, lat, bearingDeg, dist);
    const onLand = d3.geoContains(landFeature, [pLon, pLat]);
    if (!inOcean && !onLand) inOcean = true;
    if (inOcean && onLand) {
      return { lon: pLon, lat: pLat, dist, name: countryAt(pLon, pLat) };
    }
  }
  return null;
}

export function countryAt(lon, lat) {
  for (const feature of countryFeatures) {
    if (d3.geoContains(feature, [lon, lat])) {
      const id = parseInt(feature.id, 10);
      return ISO_NAMES[id] || `Territory ${feature.id}`;
    }
  }
  return 'Unknown territory';
}
