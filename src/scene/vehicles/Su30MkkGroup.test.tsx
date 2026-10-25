import { describe, expect, it } from 'vitest'

import { deriveSu30ReinforcementState } from '@/simulation/su30Reinforcement'

import { Su30MkkGroup } from './Su30MkkGroup'

describe('resident Su-30 presentation ownership', () => {
  it.each(['defender_su30_01', 'defender_su30_02'] as const)('retains the same keyed root type for %s before entry, flight, departure and reverse seeks', (id) => {
    for (const time of [0, 103.9, 104, 137, 142, 170, 180, 104, 0]) {
      const group = deriveSu30ReinforcementState(time),
        tree = Su30MkkGroup({ group })
      const entity = tree.props.children.find((child: { key: string }) => child.key === id)!
      const presentation = entity.type(entity.props),
        root = presentation.props.children[0],
        pose = group.aircraft[id].pose
      expect(entity.key).toBe(id)
      expect(presentation.type).toBe('group')
      expect(presentation.props.visible).toBe(group.aircraft[id].visible)
      expect(root.type).toBe('group')
      expect(root.props.name).toBe(id)
      expect(root.props.visible).toBe(group.aircraft[id].visible)
      expect(root.props.position).toEqual([pose.position.x, pose.position.y, pose.position.z])
      expect(root.props.rotation).toEqual([pose.rotation.x, pose.rotation.y, pose.rotation.z, 'YXZ'])
    }
  })
})
