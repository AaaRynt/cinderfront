import { Euler, Matrix4, Quaternion, Vector3 } from 'three'

import type { RockClusterProps } from '../stage2/environment/EnvironmentPrimitives'
import type { EnvironmentResponseInstance } from '../stage2/environment/responseGroups'

import { createDeterministicRandom } from '../stage2/environment/seededLayout'

/** Exact Stage 2 records, extracted without changing random consumption,
 * transforms, IDs, response order or metadata. Fitting is a separate step. */
export function createLegacyRockLayout({ count = 9, id, position, radiusM = 12, responseGroup, seed }: RockClusterProps) {
  const random = createDeterministicRandom(`${seed}:${id}`),
    matrices: Matrix4[] = [],
    responseInstances: EnvironmentResponseInstance[] = []
  for (let index = 0; index < Math.max(0, Math.floor(count)); index++) {
    const angle = random() * Math.PI * 2,
      distance = Math.sqrt(random()) * radiusM
    const localX = Math.cos(angle) * distance,
      localZ = Math.sin(angle) * distance,
      size = 0.9 + random() * 2.8,
      localY = size * (0.22 + random() * 0.12)
    const rotation = new Quaternion().setFromEuler(new Euler((random() - 0.5) * 0.65, random() * Math.PI * 2, (random() - 0.5) * 0.65))
    matrices.push(new Matrix4().compose(new Vector3(localX, localY, localZ), rotation, new Vector3(size, size * (0.48 + random() * 0.42), size * (0.7 + random() * 0.55))))
    if (responseGroup) responseInstances.push({ id: `${id}:rock:${index}`, instanceIndex: index, kind: 'rock', position: [position[0] + localX, position[1], position[2] + localZ], responseGroupId: responseGroup.id })
  }
  return { matrices, responseInstances }
}
