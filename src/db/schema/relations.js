import { relations } from "drizzle-orm";

import { users } from "./users.js";
import { rooms } from "./rooms.js";
import { tenants } from "./tenants.js";
import { tenantDocuments } from "./documents.js";
import { rentBills } from "./rent-bills.js";
import { payments } from "./payments.js";
import { tenantDeposits } from "./deposits.js";
import { pgProfiles } from "./pg-profile.js";
import { pgPhotos } from "./pg-photos.js";

export const usersRelations = relations(users, ({ many, one }) => ({
  rooms: many(rooms),
  tenants: many(tenants),
  pgProfile: one(pgProfiles),
}));

export const roomsRelations = relations(rooms, ({ one, many }) => ({
  owner: one(users, {
    fields: [rooms.ownerId],
    references: [users.id],
  }),

  tenants: many(tenants),
}));

export const tenantsRelations = relations(
  tenants,
  ({ one, many }) => ({
    owner: one(users, {
      fields: [tenants.ownerId],
      references: [users.id],
    }),

    room: one(rooms, {
      fields: [tenants.roomId],
      references: [rooms.id],
    }),

    documents: many(tenantDocuments),

    rentBills: many(rentBills),

    payments: many(payments),

    deposit: one(tenantDeposits),
  })
);

export const tenantDocumentsRelations = relations(
  tenantDocuments,
  ({ one }) => ({
    tenant: one(tenants, {
      fields: [tenantDocuments.tenantId],
      references: [tenants.id],
    }),
  })
);

export const rentBillsRelations = relations(
  rentBills,
  ({ one, many }) => ({
    tenant: one(tenants, {
      fields: [rentBills.tenantId],
      references: [tenants.id],
    }),

    payments: many(payments),
  })
);

export const paymentsRelations = relations(
  payments,
  ({ one }) => ({
    tenant: one(tenants, {
      fields: [payments.tenantId],
      references: [tenants.id],
    }),

    rentBill: one(rentBills, {
      fields: [payments.rentBillId],
      references: [rentBills.id],
    }),
  })
);

export const tenantDepositsRelations = relations(
  tenantDeposits,
  ({ one }) => ({
    tenant: one(tenants, {
      fields: [tenantDeposits.tenantId],
      references: [tenants.id],
    }),
  })
);

export const pgProfilesRelations = relations(
  pgProfiles,
  ({ one, many }) => ({
    owner: one(users, {
      fields: [pgProfiles.ownerId],
      references: [users.id],
    }),

    photos: many(pgPhotos),
  })
);

export const pgPhotosRelations = relations(
  pgPhotos,
  ({ one }) => ({
    pgProfile: one(pgProfiles, {
      fields: [pgPhotos.pgProfileId],
      references: [pgProfiles.id],
    }),
  })
);