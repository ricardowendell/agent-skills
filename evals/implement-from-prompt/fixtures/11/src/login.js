import { canSignIn } from "./auth.js"

export function signIn(user) {
  if (!canSignIn(user)) throw new Error("account is not verified")
  return { ok: true, user }
}
