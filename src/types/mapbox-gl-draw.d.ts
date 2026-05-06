declare module '@mapbox/mapbox-gl-draw' {
  import { IControl, Map } from 'mapbox-gl'

  interface MapboxDrawOptions {
    displayControlsDefault?: boolean
    controls?: {
      point?: boolean
      line_string?: boolean
      polygon?: boolean
      trash?: boolean
      combine_features?: boolean
      uncombine_features?: boolean
    }
    defaultMode?: string
    styles?: unknown[]
    keybindings?: boolean
    clickBuffer?: number
    touchBuffer?: number
    boxSelect?: boolean
  }

  interface MapboxDraw extends IControl {
    add(geojson: GeoJSON.Feature | GeoJSON.FeatureCollection): string | string[]
    getAll(): GeoJSON.FeatureCollection
    get(featureId: string): GeoJSON.Feature | undefined
    delete(featureIds: string | string[]): this
    deleteAll(): this
    set(featureCollection: GeoJSON.FeatureCollection): this
    changeMode(mode: string, options?: Record<string, unknown>): this
    getMode(): string
  }

  class MapboxDraw {
    constructor(options?: MapboxDrawOptions)
    onAdd(map: Map): HTMLElement
    onRemove(): void
    add(geojson: GeoJSON.Feature | GeoJSON.FeatureCollection): string | string[]
    getAll(): GeoJSON.FeatureCollection
    get(featureId: string): GeoJSON.Feature | undefined
    delete(featureIds: string | string[]): this
    deleteAll(): this
    set(featureCollection: GeoJSON.FeatureCollection): this
    changeMode(mode: string, options?: Record<string, unknown>): this
    getMode(): string
  }

  export = MapboxDraw
}
