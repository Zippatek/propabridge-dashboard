import mapboxgl from 'mapbox-gl'
console.log('Static default:', Object.keys(mapboxgl))
import('mapbox-gl').then(m => {
  console.log('Dynamic keys:', Object.keys(m))
  console.log('m.default:', !!m.default)
})
