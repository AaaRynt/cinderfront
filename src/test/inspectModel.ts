import { isValidElement, type ReactNode } from 'react'
import * as THREE from 'three'

interface Props {
  children?: ReactNode
  geometry?: THREE.BufferGeometry
  material?: THREE.Material
  name?: string
  position?: readonly number[]
  rotation?: readonly [number, number, number, THREE.EulerOrder?]
  scale?: readonly number[]
}
export function appendModel(parent: THREE.Object3D, node: ReactNode) {
  if (Array.isArray(node)) {
    node.forEach((n) => appendModel(parent, n))
    return
  }
  if (!isValidElement<Props>(node)) return
  if (typeof node.type === 'function') {
    appendModel(parent, (node.type as (p: Props) => ReactNode)(node.props))
    return
  }
  if (typeof node.type !== 'string') {
    appendModel(parent, node.props.children)
    return
  }
  const p = node.props,
    object = node.type === 'mesh' ? new THREE.Mesh(p.geometry, p.material) : new THREE.Group()
  object.name = p.name ?? ''
  if (p.position) object.position.set(p.position[0]!, p.position[1]!, p.position[2]!)
  if (p.rotation) object.rotation.set(p.rotation[0], p.rotation[1], p.rotation[2], p.rotation[3] ?? 'XYZ')
  if (p.scale) object.scale.set(p.scale[0]!, p.scale[1]!, p.scale[2]!)
  parent.add(object)
  appendModel(object, p.children)
}
