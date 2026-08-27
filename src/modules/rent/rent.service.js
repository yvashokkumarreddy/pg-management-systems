import * as rentRepository from "./rent.repository";

export async function listTenantBillings(tenantId) {
  return rentRepository.findTenantBillings(tenantId);
}
