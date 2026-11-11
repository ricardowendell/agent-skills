// Security-sensitive: any change requires a security review (see AGENTS.md).
export function canSignIn(user) {
  return Boolean(user?.emailVerified)
}
