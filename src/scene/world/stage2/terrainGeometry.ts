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

function clipPolygonToDiagonal(points: readonly XZPoint[], start: XZPoint, end: XZPoint, keepPositive: boolean) {
  const result: XZPoint[] = []
  if (points.length === 0) return result
  const side = (point: XZPoint) => (end[0] - start[0]) * (point[1] - start[1]) - (end[1] - start[1]) * (point[0] - start[0])
  const isInside = (value: number) => (keepPositive ? value >= -1e-6 : value <= 1e-6)
  let previous = points[points.length - 1]!
  let previousSide = side(previous)
  let previousInside = isInside(previousSide)

  for (const current of points) {
    const currentSide = side(current)
    const currentInside = isInside(currentSide)
    if (currentInside !== previousInside) {
      const progress = previousSide / (previousSide - currentSide)
      result.push([previous[0] + (current[0] - previous[0]) * progress, previous[1] + (current[1] - previous[1]) * progress])
    }
    if (currentInside) result.push(current)
    previous = current
    previousSide = currentSide
    previousInside = currentInside
  }

  return normalizePolygon(result)
}

function createAxisValues(minimum: number, maximum: number, spacingM: number, extras: readonly number[]) {
  const values = [minimum, maximum, ...extras.filter((value) => value > minimum && value < maximum)]
  for (let value = minimum + spacingM; value < maximum; value += spacingM) values.push(value)
  values.sort((first, second) => first - second)
  return values.filter((value, index) => index === 0 || value - values[index - 1]! > 1e-4)
}

function buildClippedGrid(polygon: readonly XZPoint[], spacingM: number, constraintPoints: readonly XZPoint[] = [], sharedAxes?: { readonly xs: readonly number[]; readonly zs: readonly number[] }, alignTerrainDiagonals = false, robustConcaveClipping = false) {
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
  const clippingPolygons = robustConcaveClipping
    ? ShapeUtils.triangulateShape(
        polygon.map(([x, z]) => new Vector2(x, z)),
        [],
      ).map((face) => face.map((index) => polygon[index]!))
    : [polygon]
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
      const cellPolygons = allInside ? [corners] : clippingPolygons.map((source) => clipPolygonToCell(source, cellXMin, cellXMax, cellZMin, cellZMax))

      for (const cellPolygon of cellPolygons) {
        if (cellPolygon.length < 3) continue
        const clippedPolygons = alignTerrainDiagonals ? [clipPolygonToDiagonal(cellPolygon, corners[0]!, corners[2]!, false), clipPolygonToDiagonal(cellPolygon, corners[0]!, corners[2]!, true)] : [cellPolygon]

        for (const clippedPolygon of clippedPolygons) {
          if (clippedPolygon.length < 3) continue
          const faces =
            !alignTerrainDiagonals && allInside
              ? [
                  [0, 1, 2],
                  [0, 2, 3],
                ]
              : ShapeUtils.triangulateShape(
                  clippedPolygon.map(([x, z]) => new Vector2(x, z)),
                  [],
                )
          const localIndices = clippedPolygon.map(vertexIndex)
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
    }
  }

  return { triangles, vertices }
}

function terrainAxisWindow(values: readonly number[], minimum: number, maximum: number) {
  let lowerIndex = 0
  while (lowerIndex + 1 < values.length && values[lowerIndex + 1]! <= minimum) lowerIndex += 1
  let upperIndex = lowerIndex + 1
  while (upperIndex + 1 < values.length && values[upperIndex]! < maximum) upperIndex += 1
  return values.slice(lowerIndex, Math.min(values.length, upperIndex + 1))
}

function orientTrianglesUp(vertices: readonly TerrainVertex[], triangles: readonly TerrainTriangle[]) {
  const indices: number[] = []
  for (const [a, b, c] of triangles) {
    const av = vertices[a]!
    const bv = vertices[b]!
    const cv = vertices[c]!
    // Positions are uploaded as Float32, so orient against the same values the
    // renderer receives. This avoids rare clipped-sliver winding flips after
    // buffer quantization.
    const ax = Math.fround(av[0])
    const az = Math.fround(av[1])
    const signedNormalY = (Math.fround(bv[1]) - az) * (Math.fround(cv[0]) - ax) - (Math.fround(bv[0]) - ax) * (Math.fround(cv[1]) - az)
    if (Math.abs(signedNormalY) <= 1e-6) continue
    if (signedNormalY >= 0) indices.push(a, b, c)
    else indices.push(a, c, b)
  }
  return indices
}

export function createContinuousMainlandGeometry() {
  // Concave shoreline cells can contain disconnected clipped pieces. Clip the
  // triangulated authoritative footprint only at those boundary cells while
  // retaining the compact two-triangle topology for fully interior cells.
  const { triangles, vertices } = buildClippedGrid(MAINLAND_POLYGON_XZ, 75, [], { xs: TERRAIN_GRID_X_VALUES, zs: TERRAIN_GRID_Z_VALUES }, true, true)

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
  const surfaceXs = terrainAxisWindow(TERRAIN_GRID_X_VALUES, xMin, xMax)
  const surfaceZs = terrainAxisWindow(TERRAIN_GRID_Z_VALUES, zMin, zMax)
  const { triangles, vertices } = buildClippedGrid(points, 75, [], { xs: surfaceXs, zs: surfaceZs }, true)
  const positions = vertices.flatMap(([x, z]) => [x, getTerrainHeight(x, z) + yOffset, z])
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  geometry.setIndex(orientTrianglesUp(vertices, triangles))
  geometry.computeVertexNormals()
  geometry.computeBoundingBox()
  geometry.computeBoundingSphere()
  return geometry
}

function createRibbonCrossSections(points: readonly XZPoint[], widthM: number) {
  const closed = points.length > 2 && Math.hypot(points[0]![0] - points[points.length - 1]![0], points[0]![1] - points[points.length - 1]![1]) <= 1e-4
  const centerline = closed ? points.slice(0, -1) : points
  const halfWidth = widthM / 2

  return centerline.map((current, index) => {
    const previous = closed ? centerline[(index - 1 + centerline.length) % centerline.length]! : centerline[Math.max(0, index - 1)]!
    const next = closed ? centerline[(index + 1) % centerline.length]! : centerline[Math.min(centerline.length - 1, index + 1)]!
    const tangentX = next[0] - previous[0]
    const tangentZ = next[1] - previous[1]
    const tangentLength = Math.hypot(tangentX, tangentZ) || 1
    const offsetX = (-tangentZ / tangentLength) * halfWidth
    const offsetZ = (tangentX / tangentLength) * halfWidth
    return {
      left: [current[0] + offsetX, current[1] + offsetZ] as XZPoint,
      right: [current[0] - offsetX, current[1] - offsetZ] as XZPoint,
    }
  })
}

/**
 * Builds each road segment through the same grid cells and 00-to-11 diagonal
 * used by the mainland. This keeps the complete ribbon, not only its edges,
 * at one constant clearance above the rendered terrain planes.
 */
export function createTerrainRoadGeometry(points: readonly XZPoint[], widthM: number, terrainClearanceM: number) {
  const geometry = new BufferGeometry()
  const crossSections = createRibbonCrossSections(points, widthM)
  if (crossSections.length < 2) return geometry

  const closed = points.length > 2 && Math.hypot(points[0]![0] - points[points.length - 1]![0], points[0]![1] - points[points.length - 1]![1]) <= 1e-4
  const segmentCount = closed ? crossSections.length : crossSections.length - 1
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

  for (let segmentIndex = 0; segmentIndex < segmentCount; segmentIndex += 1) {
    const current = crossSections[segmentIndex]!
    const next = crossSections[(segmentIndex + 1) % crossSections.length]!
    const quad = [current.left, next.left, next.right, current.right] as const
    const xMin = Math.min(...quad.map((point) => point[0]))
    const xMax = Math.max(...quad.map((point) => point[0]))
    const zMin = Math.min(...quad.map((point) => point[1]))
    const zMax = Math.max(...quad.map((point) => point[1]))
    const surfaceXs = terrainAxisWindow(TERRAIN_GRID_X_VALUES, xMin, xMax)
    const surfaceZs = terrainAxisWindow(TERRAIN_GRID_Z_VALUES, zMin, zMax)
    const segment = buildClippedGrid(quad, 75, [], { xs: surfaceXs, zs: surfaceZs }, true)
    const localIndices = segment.vertices.map(vertexIndex)
    for (const [a, b, c] of segment.triangles) triangles.push([localIndices[a]!, localIndices[b]!, localIndices[c]!])
  }

  const positions = vertices.flatMap(([x, z]) => [x, getTerrainHeight(x, z) + terrainClearanceM, z])
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
