import { BufferGeometry, Color, Float32BufferAttribute, Shape, ShapeUtils, Vector2 } from 'three'

import type { XZPoint } from '../worldData.ts'

import { MAINLAND_POLYGON_XZ } from '../worldData.ts'
import { TERRAIN_GRID_X_VALUES, TERRAIN_GRID_Z_VALUES, getTerrainColor, getTerrainHeight, pointInPolygon } from './terrainModel.ts'

type TerrainVertex = XZPoint
type TerrainTriangle = readonly [a: number, b: number, c: number]

function clipToBoundary(points: readonly XZPoint[], axis: 0 | 1, limit: number, keepGreater: boolean) {
  const result: XZPoint[] = []
  if (points.length === 0) return result

  const isInside = (point: XZPoint) => (keepGreater ? point[axis] >= limit : point[axis] <= limit)
  const intersection = (start: XZPoint, end: XZPoint): XZPoint => {
    const denominator = end[axis] - start[axis]
    const progress = denominator === 0 ? 0 : (limit - start[axis]) / denominator
    if (axis === 0) return [limit, start[1] + (end[1] - start[1]) * progress]
    return [start[0] + (end[0] - start[0]) * progress, limit]
  }

  let previous = points[points.length - 1]!
  let previousInside = isInside(previous)
  for (const current of points) {
    const currentInside = isInside(current)
    if (currentInside !== previousInside) result.push(intersection(previous, current))
    if (currentInside) result.push(current)
    previous = current
    previousInside = currentInside
  }
  return result
}

function normalizePolygon(points: readonly XZPoint[]) {
  const result: XZPoint[] = []
  for (const point of points) {
    const previous = result[result.length - 1]
    if (!previous || Math.hypot(point[0] - previous[0], point[1] - previous[1]) > 1e-5) result.push(point)
  }
  if (result.length > 1) {
    const first = result[0]!
    const last = result[result.length - 1]!
    if (Math.hypot(first[0] - last[0], first[1] - last[1]) <= 1e-5) result.pop()
  }
  return result
}

function clipPolygonToCell(points: readonly XZPoint[], xMin: number, xMax: number, zMin: number, zMax: number) {
  let clipped = clipToBoundary(points, 0, xMin, true)
  clipped = clipToBoundary(clipped, 0, xMax, false)
  clipped = clipToBoundary(clipped, 1, zMin, true)
  clipped = clipToBoundary(clipped, 1, zMax, false)
  return normalizePolygon(clipped)
}

function createAxisValues(minimum: number, maximum: number, spacingM: number, extras: readonly number[]) {
  const values = [minimum, maximum, ...extras.filter((value) => value > minimum && value < maximum)]
  for (let value = minimum + spacingM; value < maximum; value += spacingM) values.push(value)
  values.sort((first, second) => first - second)
  return values.filter((value, index) => index === 0 || value - values[index - 1]! > 1e-4)
}

function buildClippedGrid(polygon: readonly XZPoint[], spacingM: number, constraintPoints: readonly XZPoint[] = [], sharedAxes?: { readonly xs: readonly number[]; readonly zs: readonly number[] }) {
  const xValues = polygon.map((point) => point[0])
  const zValues = polygon.map((point) => point[1])
  const xMin = Math.min(...xValues)
  const xMax = Math.max(...xValues)
  const zMin = Math.min(...zValues)
  const zMax = Math.max(...zValues)
  const xs =
    sharedAxes?.xs ??
    createAxisValues(
      xMin,
      xMax,
      spacingM,
      constraintPoints.map((point) => point[0]),
    )
  const zs =
    sharedAxes?.zs ??
    createAxisValues(
      zMin,
      zMax,
      spacingM,
      constraintPoints.map((point) => point[1]),
    )
  const vertices: TerrainVertex[] = []
  const triangles: TerrainTriangle[] = []
  const vertexIndices = new Map<string, number>()
  const vertexIndex = (point: XZPoint) => {
    const key = `${point[0].toFixed(5)}:${point[1].toFixed(5)}`
    const existing = vertexIndices.get(key)
    if (existing !== undefined) return existing
    const index = vertices.length
    vertices.push(point)
    vertexIndices.set(key, index)
    return index
  }

  for (let xIndex = 1; xIndex < xs.length; xIndex += 1) {
    const cellXMin = xs[xIndex - 1]!
    const cellXMax = xs[xIndex]!
    for (let zIndex = 1; zIndex < zs.length; zIndex += 1) {
      const cellZMin = zs[zIndex - 1]!
      const cellZMax = zs[zIndex]!
      const corners: XZPoint[] = [
        [cellXMin, cellZMin],
        [cellXMax, cellZMin],
        [cellXMax, cellZMax],
        [cellXMin, cellZMax],
      ]
      const allInside = corners.every(([x, z]) => pointInPolygon(x, z, polygon))
      const cellPolygon = allInside ? corners : clipPolygonToCell(polygon, cellXMin, cellXMax, cellZMin, cellZMax)
      if (cellPolygon.length < 3) continue

      const faces = allInside
        ? [
            [0, 1, 2],
            [0, 2, 3],
          ]
        : ShapeUtils.triangulateShape(
            cellPolygon.map(([x, z]) => new Vector2(x, z)),
            [],
          )
      const localIndices = cellPolygon.map(vertexIndex)
      for (const face of faces) {
        const a = localIndices[face[0]!]
        const b = localIndices[face[1]!]
        const c = localIndices[face[2]!]
        if (a !== undefined && b !== undefined && c !== undefined && a !== b && b !== c && a !== c) {
          triangles.push([a, b, c])
        }
      }
    }
  }

  return { triangles, vertices }
}

function orientTrianglesUp(vertices: readonly TerrainVertex[], triangles: readonly TerrainTriangle[]) {
  const indices: number[] = []
  for (const [a, b, c] of triangles) {
    const av = vertices[a]!
    const bv = vertices[b]!
    const cv = vertices[c]!
    const signedNormalY = (bv[1] - av[1]) * (cv[0] - av[0]) - (bv[0] - av[0]) * (cv[1] - av[1])
    if (signedNormalY >= 0) indices.push(a, b, c)
    else indices.push(a, c, b)
  }
  return indices
}

export function createContinuousMainlandGeometry() {
  const { triangles, vertices } = buildClippedGrid(MAINLAND_POLYGON_XZ, 75, [], { xs: TERRAIN_GRID_X_VALUES, zs: TERRAIN_GRID_Z_VALUES })

  const positions: number[] = []
  const colors: number[] = []
  const color = new Color()
  for (const [x, z] of vertices) {
    const height = getTerrainHeight(x, z)
    positions.push(x, height, z)
    getTerrainColor(x, z, height, color)
    colors.push(color.r, color.g, color.b)
  }

  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  geometry.setAttribute('color', new Float32BufferAttribute(colors, 3))
  geometry.setIndex(orientTrianglesUp(vertices, triangles))
  geometry.computeVertexNormals()
  geometry.computeBoundingBox()
  geometry.computeBoundingSphere()
  return geometry
}

export function createTerrainSurfaceGeometry(points: readonly XZPoint[], yOffset = 0.25, _gridSpacingM = 45) {
  const xMin = Math.min(...points.map((point) => point[0]))
  const xMax = Math.max(...points.map((point) => point[0]))
  const zMin = Math.min(...points.map((point) => point[1]))
  const zMax = Math.max(...points.map((point) => point[1]))
  const surfaceXs = createAxisValues(xMin, xMax, Math.max(1, xMax - xMin), [...TERRAIN_GRID_X_VALUES.filter((value) => value > xMin && value < xMax), ...points.map((point) => point[0])])
  const surfaceZs = createAxisValues(zMin, zMax, Math.max(1, zMax - zMin), [...TERRAIN_GRID_Z_VALUES.filter((value) => value > zMin && value < zMax), ...points.map((point) => point[1])])
  const { triangles, vertices } = buildClippedGrid(points, 75, points, { xs: surfaceXs, zs: surfaceZs })
  const positions = vertices.flatMap(([x, z]) => [x, getTerrainHeight(x, z) + yOffset, z])
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  geometry.setIndex(orientTrianglesUp(vertices, triangles))
  geometry.computeVertexNormals()
  geometry.computeBoundingBox()
  geometry.computeBoundingSphere()
  return geometry
}

export function createCoastSkirtGeometry(bottomY = -3) {
  // The first two mainland edges close the authored polygon against the north
  // and east map bounds; they are world limits, not exposed shoreline.
  const shoreline = [...MAINLAND_POLYGON_XZ.slice(2), MAINLAND_POLYGON_XZ[0]!]
  const positions: number[] = []
  const indices: number[] = []
  for (const [x, z] of shoreline) {
    positions.push(x, getTerrainHeight(x, z), z, x, bottomY, z)
  }
  for (let index = 0; index < shoreline.length - 1; index += 1) {
    const next = index + 1
    const top = index * 2
    const bottom = top + 1
    const nextTop = next * 2
    const nextBottom = nextTop + 1
    indices.push(top, bottom, nextTop, bottom, nextBottom, nextTop)
  }
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  geometry.computeBoundingSphere()
  return geometry
}

export function createPolygonShape(points: readonly XZPoint[]) {
  const shape = new Shape()
  const first = points[0]
  if (!first) return shape
  shape.moveTo(first[0], -first[1])
  for (let index = 1; index < points.length; index += 1) {
    const point = points[index]!
    shape.lineTo(point[0], -point[1])
  }
  shape.closePath()
  return shape
}
