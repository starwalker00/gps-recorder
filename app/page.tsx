'use client'

import { useEffect, useState } from 'react'
import type { FeatureCollection, Feature, Point } from 'geojson'
import dynamic from 'next/dynamic'
import { useStore } from './lib/useStore'

const MapLibreView = dynamic(() => import('./component/MapLibreView'), { ssr: false })

export default function Home() {
  // const [watchId, setWatchId] = useState<number | null>(null)
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lon: number; accuracy: number } | null>(null)
  const [espece, setEspece] = useState('')

  // Zustand store
  const features = useStore((state) => state.features)
  const addFeature = useStore((state) => state.addFeature)
  const removeFeature = useStore((state) => state.removeFeature)
  const clearFeatures = useStore((state) => state.clearFeatures)

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

    return () => {
      navigator.geolocation.clearWatch(id)
    }
  }, [])

  const enregistrer = () => {
    if (!currentCoords) {
      alert("Pas de coordonnées pour enregistrer.")
      return
    }
    if (!espece.trim()) {
      alert("Veuillez saisir une espèce.")
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

    addFeature(newFeature)
    setEspece('')
  }

  const exporterGeoJSON = () => {
    const featureCollection: FeatureCollection<Point, { espece: string; accuracy: number }> = {
      type: 'FeatureCollection',
      features,
    }
    const dataStr = JSON.stringify(featureCollection, null, 2)
    const blob = new Blob([dataStr], { type: 'application/geo+json' })
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.download = 'arbres.geojson'
    link.click()
    URL.revokeObjectURL(url)
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
        disabled={!currentCoords || !espece.trim()}
      >
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
            features={features} // tu peux ajouter ça pour afficher les points enregistrés
          />
        </div>
      )}

      <ul className="mt-4 space-y-2">
        {features.map((feat, idx) => (
          <li key={idx} className="p-2 border rounded flex justify-between items-center">
            <div>
              <div><strong>Espèce :</strong> {feat.properties.espece}</div>
              <div><strong>Coordonnées :</strong> {feat.geometry.coordinates[1].toFixed(5)}, {feat.geometry.coordinates[0].toFixed(5)}</div>
              <div><strong>Précision :</strong> ±{feat.properties.accuracy.toFixed(1)} m</div>
            </div>
            <button
              onClick={() => removeFeature(idx)}
              className="bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700"
            >
              Supprimer
            </button>
          </li>
        ))}
      </ul>

      {features.length > 0 && (
        <button
          onClick={clearFeatures}
          className="mt-4 bg-red-800 text-white px-4 py-2 rounded hover:bg-red-900"
        >
          🗑️ Supprimer tout
        </button>
      )}
    </main>
  )
}
