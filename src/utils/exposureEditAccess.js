/** Roles allowed to call PATCH /user/:id/exposure (agent and above). */
const EXPOSURE_MANAGER_ROLES = new Set([
  'agent',
  'super_master',
  'master',
  'admin',
  'super_admin',
])

function flattenHierarchyNodes(nodes, parentId = null) {
  if (!Array.isArray(nodes)) return []
  const flat = []
  for (const node of nodes) {
    const currentId = node._id ?? node.id ?? null
    const children = node.children
    flat.push({ id: currentId, parentId })
    if (Array.isArray(children) && children.length > 0) {
      flat.push(...flattenHierarchyNodes(children, currentId))
    }
  }
  return flat
}

/** Build Set of user ids from GET /user/hierarchy `data` tree (self + descendants). */
export function hierarchyResponseToUserIdSet(hierarchyResponse) {
  const tree = hierarchyResponse?.data
  const flat = flattenHierarchyNodes(tree)
  return new Set(
    flat.map((n) => (n.id != null ? String(n.id) : '')).filter(Boolean),
  )
}

export function canManageExposureByRole(authUser) {
  const role = (authUser?.role || '').toLowerCase()
  return EXPOSURE_MANAGER_ROLES.has(role)
}

/**
 * Super admin: any target. Others: self or id present in hierarchy tree for current scope.
 */
export function canEditExposureForTarget({
  authUser,
  targetUserId,
  descendantIdSet,
}) {
  if (!authUser || !canManageExposureByRole(authUser)) return false
  const role = (authUser?.role || '').toLowerCase()
  const tid = targetUserId != null ? String(targetUserId) : ''
  if (!tid) return false
  if (role === 'super_admin') return true
  const selfId = String(authUser._id ?? authUser.id ?? '')
  if (tid === selfId) return true
  if (!descendantIdSet || descendantIdSet.size === 0) return false
  return descendantIdSet.has(tid)
}
