import * as profileRepository from "./pg-profile.repository";

export async function getProfile(ownerId) {
  return profileRepository.findProfileByOwner(ownerId);
}
