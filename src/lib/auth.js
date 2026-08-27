export async function getCurrentUser() {
  // Authentication/session implementation will be added in the auth module.
  return null;
}

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  return user;
}
