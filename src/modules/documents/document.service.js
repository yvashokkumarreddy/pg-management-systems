import * as documentRepository from "./document.repository";

export async function listTenantDocuments(tenantId) {
  return documentRepository.findDocumentsByTenant(tenantId);
}
