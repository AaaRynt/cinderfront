let required = false
let published = false

/** Browser bootstrap opts in before importing any scene/simulation consumer. */
export function requireTerrainPreparation() {
  required = true
}
export function publishPreparedTerrain() {
  published = true
}
export function assertPreparedTerrain() {
  if (required && !published) throw new Error('Terrain preparation has not finished')
}
