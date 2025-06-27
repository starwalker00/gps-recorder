'use client'

import { useEffect, useState } from 'react'
import type { FeatureCollection, Feature, Point } from 'geojson'

import dynamic from 'next/dynamic'
const MapLibreView = dynamic(() => import('./component/MapLibreView'), { ssr: false })

export default function Home() {
  const [watchId, setWatchId] = useState<number | null>(null)
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lon: number; accuracy: number } | null>(null)
  const [features, setFeatures] = useState<Feature<Point, { espece: string; accuracy: number }>[]>([])
  const [espece, setEspece] = useState('')

  // Démarre la surveillance GPS au montage
  useEffect(() => {
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords
        setCurrentCoords({ lat: latitude, lon: longitude, accuracy })
      },
      (err) => {
        console.error('Erreur de localisation :', err)
        alert('Erreur lors de la localisation.')
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    )

    setWatchId(id)

    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId)
      }
    }
  }, [])

  const enregistrer = () => {
    // if (!currentCoords || currentCoords.accuracy > 10) {
    //   alert("La précision est insuffisante pour enregistrer.")
    //   return
    // }
    if (!currentCoords) {
      alert("Pas de coordonnées pour enregistrer.")
      return
    }
    const newFeature: Feature<Point, { espece: string; accuracy: number }> = {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [currentCoords.lon, currentCoords.lat],
      },
      properties: {
        espece,
        accuracy: currentCoords.accuracy,
      },
    }

    setFeatures((prev) => [...prev, newFeature])
    setEspece('')
  }

  const exporterGeoJSON = () => {
    const dataStr = JSON.stringify(featureCollection, null, 2)
    const blob = new Blob([dataStr], { type: 'application/geo+json' })
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.download = 'arbres.geojson'
    link.click()
    URL.revokeObjectURL(url)
  }

  const featureCollection: FeatureCollection<Point, { espece: string }> = {
    type: 'FeatureCollection',
    features,
  }

  return (
    <main className="p-4 max-w-xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">📡 Précision GPS en temps réel</h1>

      <div className="p-3 border rounded bg-gray-50">
        {currentCoords ? (
          <>
            <p><strong>Latitude :</strong> {currentCoords.lat.toFixed(6)}</p>
            <p><strong>Longitude :</strong> {currentCoords.lon.toFixed(6)}</p>
            <p><strong>Précision :</strong> ±{currentCoords.accuracy.toFixed(1)} m</p>
          </>
        ) : (
          <p>Localisation en cours...</p>
        )}
      </div>

      <input
        type="text"
        placeholder="Espèce"
        className="w-full p-2 border rounded"
        value={espece}
        onChange={(e) => setEspece(e.target.value)}
      />

      <button
        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        onClick={enregistrer}
        disabled={!currentCoords || !espece.trim()}>
        Enregistrer
      </button>

      <button
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        onClick={exporterGeoJSON}
        disabled={features.length === 0}
      >
        💾 Télécharger GeoJSON
      </button>
      {currentCoords && (
        <div className="mt-4">
          <h2 className="font-semibold mb-2">🗺️ Carte de position</h2>
          <MapLibreView
            lat={currentCoords.lat}
            lon={currentCoords.lon}
            accuracy={currentCoords.accuracy}
          />
        </div>
      )}
      <ul className="mt-4 space-y-2">
        {features.map((feat, idx) => (
          <li key={idx} className="p-2 border rounded">
            <div><strong>Espèce :</strong> {feat.properties.espece}</div>
            <div><strong>Coordonnées :</strong> {feat.geometry.coordinates[1].toFixed(5)}, {feat.geometry.coordinates[0].toFixed(5)}</div>
          </li>
        ))}
      </ul>
    </main>
  )
}
