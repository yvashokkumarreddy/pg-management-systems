import { db } from "@/db";

import {
  findRoomById,
  countOccupiedBedsByRoom,
  createTenant,
  createRentBill,
  createTenantDeposit,
  findTenantsByOwner,
  findTenantDetailsById,
  updateTenant,
  updateTenantDeposit,
  archiveTenant,
  restoreTenant,
  findCurrentRentBill,
  updateRentBill,
} from "./tenant.repository.js";

import {
  calculateRentCycle,
} from "./tenant.utils.js";


/* ======================================================
   CREATE TENANT
====================================================== */

export async function createTenantService(
  data
) {
  const room =
    await findRoomById(
      db,
      data.roomId
    );

  if (!room) {
    throw new Error(
      "Room not found"
    );
  }

  if (
    room.ownerId !==
    data.ownerId
  ) {
    throw new Error(
      "Room does not belong to this owner"
    );
  }

  if (
    room.status ===
    "ARCHIVED"
  ) {
    throw new Error(
      "Cannot assign tenant to an archived room"
    );
  }

  /*
   * Check occupancy BEFORE inserting
   * the new tenant.
   */
  const occupiedBeds =
    await countOccupiedBedsByRoom(
      db,
      data.roomId
    );

  if (
    occupiedBeds >=
    Number(room.capacity)
  ) {
    throw new Error(
      "Room has no available bed"
    );
  }

  const rentCycle =
    calculateRentCycle(
      data.dateOfJoining
    );

  const tenantId =
    crypto.randomUUID();


  return await db.transaction(
    async (tx) => {
      const tenant =
        await createTenant(
          tx,
          {
            id:
              tenantId,

            ownerId:
              data.ownerId,

            roomId:
              data.roomId,

            fullName:
              data.fullName,

            mobile:
              data.mobile,

            dateOfJoining:
              new Date(
                data.dateOfJoining
              ),

            monthlyRent:
              String(
                data.monthlyRent
              ),

            status:
              "ACTIVE",
          }
        );


      const rentBill =
        await createRentBill(
          tx,
          {
            id:
              crypto.randomUUID(),

            tenantId:
              tenant.id,

            billingPeriodStart:
              rentCycle.billingPeriodStart,

            billingPeriodEnd:
              rentCycle.billingPeriodEnd,

            dueDate:
              rentCycle.dueDate,

            amountDue:
              String(
                data.monthlyRent
              ),

            amountPaid:
              "0",

            balanceAmount:
              String(
                data.monthlyRent
              ),

            status:
              "PENDING",
          }
        );


      const deposit =
        await createTenantDeposit(
          tx,
          {
            id:
              crypto.randomUUID(),

            tenantId:
              tenant.id,

            advanceAmount:
              String(
                data.advanceAmount ??
                  0
              ),

            maintenanceAmount:
              String(
                data.maintenanceAmount ??
                  0
              ),

            refundableAmount:
              String(
                data.refundableAmount ??
                  0
              ),
          }
        );


      return {
        tenant,
        rentBill,
        deposit,
      };
    }
  );
}


/* ======================================================
   GET TENANTS
====================================================== */

export async function getTenantsService(
  ownerId
) {
  if (!ownerId) {
    throw new Error(
      "Owner ID is required"
    );
  }

  return await findTenantsByOwner(
    db,
    ownerId
  );
}


/* ======================================================
   GET TENANT
====================================================== */

export async function getTenantByIdService(
  tenantId,
  ownerId
) {
  if (!tenantId) {
    throw new Error(
      "Tenant ID is required"
    );
  }

  if (!ownerId) {
    throw new Error(
      "Owner ID is required"
    );
  }

  const tenant =
    await findTenantDetailsById(
      db,
      tenantId,
      ownerId
    );

  if (!tenant) {
    return null;
  }

  return tenant;
}


/* ======================================================
   UPDATE TENANT
====================================================== */

/* ======================================================
   UPDATE TENANT
====================================================== */

export async function updateTenantService(
  tenantId,
  ownerId,
  data
) {
  const existingTenant =
    await findTenantDetailsById(
      db,
      tenantId,
      ownerId
    );

  if (!existingTenant) {
    throw new Error(
      "Tenant not found"
    );
  }


  /*
   * Archived tenant profile cannot
   * be edited through normal update.
   *
   * Restoration is handled by
   * restoreTenantService().
   */
  if (
    existingTenant.status ===
    "ARCHIVED"
  ) {
    throw new Error(
      "Archived tenant cannot be updated"
    );
  }


  /* ====================================================
     CHECK WHETHER MONTHLY RENT ACTUALLY CHANGED
  ==================================================== */

  const monthlyRentChanged =
    data.monthlyRent !==
      undefined &&
    Number(data.monthlyRent) !==
      Number(
        existingTenant.monthlyRent
      );


  /* ====================================================
     ROOM CHANGE VALIDATION
  ==================================================== */

  if (
    data.roomId &&
    data.roomId !==
      existingTenant.roomId
  ) {
    const room =
      await findRoomById(
        db,
        data.roomId
      );

    if (!room) {
      throw new Error(
        "Room not found"
      );
    }

    if (
      room.ownerId !==
      ownerId
    ) {
      throw new Error(
        "Room does not belong to this owner"
      );
    }

    if (
      room.status ===
      "ARCHIVED"
    ) {
      throw new Error(
        "Cannot assign tenant to an archived room"
      );
    }


    const occupiedBeds =
      await countOccupiedBedsByRoom(
        db,
        data.roomId
      );


    if (
      occupiedBeds >=
      Number(room.capacity)
    ) {
      throw new Error(
        "Room has no available bed"
      );
    }
  }


  return await db.transaction(
    async (tx) => {
      /* ==================================================
         TENANT UPDATE
      ================================================== */

      const tenantUpdate =
        {};


      const allowedTenantFields =
        [
          "fullName",
          "mobile",
          "roomId",
          "emergencyContactName",
          "emergencyContactPhone",
          "officeName",
          "officeAddress",
          "permanentAddress",
        ];


      for (
        const field of
        allowedTenantFields
      ) {
        if (
          data[field] !==
          undefined
        ) {
          tenantUpdate[field] =
            data[field];
        }
      }


      if (
        data.dateOfBirth !==
        undefined
      ) {
        tenantUpdate.dateOfBirth =
          data.dateOfBirth
            ? new Date(
                data.dateOfBirth
              )
            : null;
      }


      if (
        data.dateOfJoining !==
        undefined
      ) {
        tenantUpdate.dateOfJoining =
          new Date(
            data.dateOfJoining
          );
      }


      if (
        data.monthlyRent !==
        undefined
      ) {
        tenantUpdate.monthlyRent =
          String(
            data.monthlyRent
          );
      }


      const tenant =
        Object.keys(
          tenantUpdate
        ).length > 0
          ? await updateTenant(
              tx,
              tenantId,
              ownerId,
              tenantUpdate
            )
          : existingTenant;


      /* ==================================================
         UPDATE CURRENT RENT BILL WHEN RENT CHANGES

         RULE:

         amountPaid = 0
           → current bill uses new rent

         amountPaid > 0
           → current bill stays unchanged

         Future bills automatically use
         tenant.monthlyRent.
      ================================================== */

      let rentBill =
        null;


      if (
        monthlyRentChanged
      ) {
        const currentRentBill =
          await findCurrentRentBill(
            tx,
            tenantId,
            new Date()
          );


        if (
          currentRentBill &&
          Number(
            currentRentBill.amountPaid
          ) === 0
        ) {
          rentBill =
            await updateRentBill(
              tx,
              currentRentBill.id,
              {
                amountDue:
                  String(
                    data.monthlyRent
                  ),

                balanceAmount:
                  String(
                    data.monthlyRent
                  ),
              }
            );
        }
      }


      /* ==================================================
         DEPOSIT UPDATE
      ================================================== */

      const depositUpdate =
        {};


      if (
        data.advanceAmount !==
        undefined
      ) {
        depositUpdate.advanceAmount =
          String(
            data.advanceAmount
          );
      }


      if (
        data.maintenanceAmount !==
        undefined
      ) {
        depositUpdate.maintenanceAmount =
          String(
            data.maintenanceAmount
          );
      }


      if (
        data.refundableAmount !==
        undefined
      ) {
        depositUpdate.refundableAmount =
          String(
            data.refundableAmount
          );
      }


      let deposit =
        existingTenant.deposit;


      if (
        Object.keys(
          depositUpdate
        ).length > 0
      ) {
        deposit =
          await updateTenantDeposit(
            tx,
            tenantId,
            depositUpdate
          );
      }


      return {
        tenant,
        deposit,
        rentBill,
      };
    }
  );
}


/* ======================================================
   ARCHIVE TENANT
====================================================== */

export async function archiveTenantService(
  tenantId,
  ownerId,
  leavingDate
) {
  if (!tenantId) {
    throw new Error(
      "Tenant ID is required"
    );
  }

  if (!ownerId) {
    throw new Error(
      "Owner ID is required"
    );
  }


  const existingTenant =
    await findTenantDetailsById(
      db,
      tenantId,
      ownerId
    );


  if (!existingTenant) {
    throw new Error(
      "Tenant not found"
    );
  }


  if (
    existingTenant.status ===
    "ARCHIVED"
  ) {
    throw new Error(
      "Tenant is already archived"
    );
  }


  const parsedLeavingDate =
    leavingDate
      ? new Date(
          leavingDate
        )
      : new Date();


  if (
    Number.isNaN(
      parsedLeavingDate.getTime()
    )
  ) {
    throw new Error(
      "Invalid leaving date"
    );
  }


  if (
    parsedLeavingDate <
    new Date(
      existingTenant.dateOfJoining
    )
  ) {
    throw new Error(
      "Leaving date cannot be before joining date"
    );
  }


  return await archiveTenant(
    db,
    tenantId,
    ownerId,
    parsedLeavingDate
  );
}


/* ======================================================
   RESTORE / ACTIVATE TENANT
====================================================== */

export async function restoreTenantService(
  tenantId,
  ownerId
) {
  if (!tenantId) {
    throw new Error(
      "Tenant ID is required"
    );
  }

  if (!ownerId) {
    throw new Error(
      "Owner ID is required"
    );
  }


  const existingTenant =
    await findTenantDetailsById(
      db,
      tenantId,
      ownerId
    );


  if (!existingTenant) {
    throw new Error(
      "Tenant not found"
    );
  }


  if (
    existingTenant.status !==
    "ARCHIVED"
  ) {
    throw new Error(
      "Only archived tenants can be activated"
    );
  }


  if (
    !existingTenant.roomId
  ) {
    throw new Error(
      "Tenant has no assigned room"
    );
  }


  /* ====================================================
     CHECK ORIGINAL ASSIGNED ROOM
  ==================================================== */

  const room =
    await findRoomById(
      db,
      existingTenant.roomId
    );


  if (!room) {
    throw new Error(
      "Assigned room not found"
    );
  }


  if (
    room.ownerId !==
    ownerId
  ) {
    throw new Error(
      "Room does not belong to this owner"
    );
  }


  if (
    room.status !==
    "ACTIVE"
  ) {
    throw new Error(
      "Assigned room is archived"
    );
  }


  /* ====================================================
     CHECK BED AVAILABILITY
  ==================================================== */

  const occupiedBeds =
    await countOccupiedBedsByRoom(
      db,
      existingTenant.roomId
    );


  if (
    occupiedBeds >=
    Number(room.capacity)
  ) {
    throw new Error(
      "Assigned room has no available bed"
    );
  }


  /* ====================================================
     ACTIVATE
  ==================================================== */

  return await restoreTenant(
    db,
    tenantId,
    ownerId
  );
}