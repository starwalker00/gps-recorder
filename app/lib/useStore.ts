import { create } from 'zustand'
import type { Feature, Point } from 'geojson'

type MyFeature = Feature<Point, { espece: string; accuracy: number }>

interface State {
    features: MyFeature[]
    addFeature: (feature: MyFeature) => void
    removeFeature: (index: number) => void
    clearFeatures: () => void
}

const LOCAL_STORAGE_KEY = 'arbresFeatures'

export const useStore = create<State>((set) => {
    // Charge depuis localStorage si possible
    let storedFeatures: MyFeature[] = []
    if (typeof window !== 'undefined') {
        try {
            const json = localStorage.getItem(LOCAL_STORAGE_KEY)
            if (json) storedFeatures = JSON.parse(json)
        } catch { }
    }

    return {
        features: storedFeatures,

        addFeature: (feature) =>
            set((state) => {
                const newFeatures = [...state.features, feature]
                if (typeof window !== 'undefined') {
                    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newFeatures))
                }
                return { features: newFeatures }
            }),

        removeFeature: (index) =>
            set((state) => {
                const newFeatures = state.features.filter((_, i) => i !== index)
                if (typeof window !== 'undefined') {
                    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newFeatures))
                }
                return { features: newFeatures }
            }),

        clearFeatures: () =>
            set(() => {
                if (typeof window !== 'undefined') localStorage.removeItem(LOCAL_STORAGE_KEY)
                return { features: [] }
            }),
    }
})
