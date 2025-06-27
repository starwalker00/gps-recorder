'use client'

import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import type { FeatureCollection, Point } from 'geojson'

const STYLE = "/plan-ign-standard.json"

type Props = {
    lat: number
    lon: number
    accuracy: number
}

export default function MapLibreView({ lat, lon, accuracy }: Props) {
    const mapRef = useRef<maplibregl.Map | null>(null)
    const mapContainerRef = useRef<HTMLDivElement | null>(null)

    useEffect(() => {
        if (!mapContainerRef.current) return

        if (!mapRef.current) {
            mapRef.current = new maplibregl.Map({
                container: mapContainerRef.current,
                style: STYLE,
                center: [lon, lat],
                zoom: 17,
                maxZoom: 22 //18 max disponible dans le service web pbf, configuré à la main dans /public/plan-ign-standard.json
            })

            mapRef.current.addControl(new maplibregl.NavigationControl(), 'top-right')
        }

        const map = mapRef.current

        const addLocationLayer = () => {
            // Nettoyer les anciennes sources/layers si elles existent
            if (map.getSource('user-location')) {
                if (map.getLayer('location-accuracy')) map.removeLayer('location-accuracy')
                if (map.getLayer('location-dot')) map.removeLayer('location-dot')
                map.removeSource('user-location')
            }

            const userLocation: FeatureCollection<Point> = {
                type: 'FeatureCollection',
                features: [
                    {
                        type: 'Feature',
                        geometry: { type: 'Point', coordinates: [lon, lat] },
                        properties: { accuracy },
                    },
                ],
            }

            map.addSource('user-location', {
                type: 'geojson',
                data: userLocation,
            })

            map.addLayer({
                id: 'location-accuracy',
                type: 'circle',
                source: 'user-location',
                paint: {
                    'circle-radius': [
                        'interpolate',
                        ['linear'],
                        ['zoom'],
                        0, 0,
                        20, accuracy
                    ],
                    'circle-color': '#3b82f6',
                    'circle-opacity': 0.2,
                    'circle-stroke-width': 1,
                    'circle-stroke-color': '#3b82f6',
                },
            })

            map.addLayer({
                id: 'location-dot',
                type: 'circle',
                source: 'user-location',
                paint: {
                    'circle-radius': 6,
                    'circle-color': '#1d4ed8',
                    'circle-stroke-width': 2,
                    'circle-stroke-color': '#ffffff',
                },
            })

            map.easeTo({ center: [lon, lat], duration: 500 })
        }

        // S'assurer que le style est chargé avant d'ajouter les couches
        if (map.isStyleLoaded()) {
            addLocationLayer()
        } else {
            map.once('load', addLocationLayer)
        }
    }, [lat, lon, accuracy])

    return <div ref={mapContainerRef} style={{ height: '300px', width: '100%', borderRadius: '0.5rem' }} />
}
