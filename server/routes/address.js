const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const config = require('../config');

let regionsData = null;

function loadRegions() {
  if (regionsData) return regionsData;
  try {
    const filePath = path.join(config.dataDir, 'regions.json');
    regionsData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    regionsData = {};
  }
  return regionsData;
}

// Get provinces
router.get('/provinces', (req, res) => {
  const regions = loadRegions();
  const provinces = Object.entries(regions).map(([code, val]) => ({
    code,
    name: val.name
  }));
  res.json({ success: true, provinces });
});

// Get cities by province
router.get('/cities/:provinceCode', (req, res) => {
  const regions = loadRegions();
  const province = regions[req.params.provinceCode];
  if (!province || !province.children) {
    return res.json({ success: true, cities: [] });
  }
  const cities = Object.entries(province.children).map(([code, val]) => ({
    code,
    name: val.name
  }));
  res.json({ success: true, cities });
});

// Get districts by city
router.get('/districts/:provinceCode/:cityCode', (req, res) => {
  const regions = loadRegions();
  const province = regions[req.params.provinceCode];
  if (!province || !province.children) {
    return res.json({ success: true, districts: [] });
  }
  const city = province.children[req.params.cityCode];
  if (!city || !city.children) {
    return res.json({ success: true, districts: [] });
  }
  const districts = Object.entries(city.children).map(([code, name]) => ({
    code,
    name: typeof name === 'string' ? name : name.name
  }));
  res.json({ success: true, districts });
});

module.exports = router;
