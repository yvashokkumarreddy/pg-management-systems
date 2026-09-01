import {
  db,
} from "@/db";

import {
  createClient,
} from "@/lib/supabase/server";

import {
  findUserByAuthUserId,
} from "./auth.repository.js";


export class UnauthorizedError extends Error {
  constructor(
    message = "Unauthorized"
  ) {
    super(message);

    this.name =
      "UnauthorizedError";
  }
}


export async function getCurrentOwner() {
  const supabase =
    await createClient();


  const {
    data,
    error,
  } =
    await supabase.auth.getUser();


  if (
    error ||
    !data?.user
  ) {
    throw new UnauthorizedError();
  }


  const appUser =
    await findUserByAuthUserId(
      db,
      data.user.id
    );


  if (!appUser) {
    await supabase.auth.signOut();

    throw new UnauthorizedError(
      "Owner account is not linked"
    );
  }


  if (
    appUser.status &&
    appUser.status !== "ACTIVE"
  ) {
    await supabase.auth.signOut();

    throw new UnauthorizedError(
      "Owner account is inactive"
    );
  }


  return {
    ownerId:
      appUser.id,

    authUserId:
      data.user.id,

    email:
      data.user.email,

    user:
      appUser,
  };
}