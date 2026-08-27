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
} from "./tenant.repository.js";

import { calculateRentCycle } from "./tenant.utils.js";

export async function createTenantService(data) {
  const room = await findRoomById(db, data.roomId);

  if (!room) {
    throw new Error("Room not found");
  }

  if (room.ownerId !== data.ownerId) {
    throw new Error(
      "Room does not belong to this owner"
    );
  }

  const rentCycle = calculateRentCycle(
    data.dateOfJoining
  );

  const tenantId = crypto.randomUUID();

  return await db.transaction(async (tx) => {
    const tenant = await createTenant(tx, {
      id: tenantId,

      ownerId: data.ownerId,

      roomId: data.roomId,

      fullName: data.fullName,

      mobile: data.mobile,

      dateOfJoining: new Date(
        data.dateOfJoining
      ),

      monthlyRent: String(data.monthlyRent),

      status: "ACTIVE",
    });

    const activeTenantCount = await countOccupiedBedsByRoom(db,data.roomId);

    if (activeTenantCount >= room.capacity) {
      throw new Error(
        "Room has no available bed"
      );
    }

    const rentBill = await createRentBill(tx, {
      id: crypto.randomUUID(),

      tenantId: tenant.id,

      billingPeriodStart:
        rentCycle.billingPeriodStart,

      billingPeriodEnd:
        rentCycle.billingPeriodEnd,

      dueDate: rentCycle.dueDate,

      amountDue: String(data.monthlyRent),

      amountPaid: "0",

      balanceAmount:
        String(data.monthlyRent),

      status: "PENDING",
    });

    const deposit = await createTenantDeposit(
      tx,
      {
        id: crypto.randomUUID(),

        tenantId: tenant.id,

        advanceAmount:
          String(data.advanceAmount ?? 0),

        maintenanceAmount:
          String(data.maintenanceAmount ?? 0),

        refundableAmount:
          String(data.refundableAmount ?? 0),
      }
    );

    return {
      tenant,
      rentBill,
      deposit,
    };
  });
}
export async function getTenantsService(ownerId) {
  if (!ownerId) {
    throw new Error("Owner ID is required");
  }

  return await findTenantsByOwner(
    db,
    ownerId
  );
}

export async function getTenantByIdService(
  tenantId,
  ownerId
) {
  if (!tenantId) {
    throw new Error("Tenant ID is required");
  }

  if (!ownerId) {
    throw new Error("Owner ID is required");
  }

  const tenant = await findTenantDetailsById(
    db,
    tenantId,
    ownerId
  );

  if (!tenant) {
    return null;
  }

  return tenant;
}



export async function updateTenantService(
  tenantId,
  ownerId,
  data
) {
  const existingTenant = await findTenantDetailsById(
    db,
    tenantId,
    ownerId
  );

  if (!existingTenant) {
    throw new Error("Tenant not found");
  }

  if (existingTenant.status === "ARCHIVED") {
    throw new Error("Archived tenant cannot be updated");
  }

  if (
    data.roomId &&
    data.roomId !== existingTenant.roomId
  ) {
    const room = await findRoomById(db, data.roomId);

    if (!room) {
      throw new Error("Room not found");
    }

    if (room.ownerId !== ownerId) {
      throw new Error(
        "Room does not belong to this owner"
      );
    }

    if (room.status === "ARCHIVED") {
      throw new Error(
        "Cannot assign tenant to an archived room"
      );
    }

    const activeTenantCount =
      await (
        db,
        data.roomId
      );

    if (activeTenantCount >= room.capacity) {
      throw new Error(
        "Room has no available bed"
      );
    }
  }

  return await db.transaction(async (tx) => {
    const tenantUpdate = {};

    const allowedTenantFields = [
      "fullName",
      "mobile",
      "roomId",
      "emergencyContactName",
      "emergencyContactPhone",
      "officeName",
      "officeAddress",
      "permanentAddress",
    ];

    for (const field of allowedTenantFields) {
      if (data[field] !== undefined) {
        tenantUpdate[field] = data[field];
      }
    }

    if (data.dateOfBirth !== undefined) {
      tenantUpdate.dateOfBirth = data.dateOfBirth
        ? new Date(data.dateOfBirth)
        : null;
    }

    if (data.dateOfJoining !== undefined) {
      tenantUpdate.dateOfJoining =
        new Date(data.dateOfJoining);
    }

    if (data.monthlyRent !== undefined) {
      tenantUpdate.monthlyRent =
        String(data.monthlyRent);
    }

    const tenant =
      Object.keys(tenantUpdate).length > 0
        ? await updateTenant(
            tx,
            tenantId,
            ownerId,
            tenantUpdate
          )
        : existingTenant;

    const depositUpdate = {};

    if (data.advanceAmount !== undefined) {
      depositUpdate.advanceAmount =
        String(data.advanceAmount);
    }

    if (data.maintenanceAmount !== undefined) {
      depositUpdate.maintenanceAmount =
        String(data.maintenanceAmount);
    }

    if (data.refundableAmount !== undefined) {
      depositUpdate.refundableAmount =
        String(data.refundableAmount);
    }

    let deposit = existingTenant.deposit;

    if (Object.keys(depositUpdate).length > 0) {
      deposit = await updateTenantDeposit(
        tx,
        tenantId,
        depositUpdate
      );
    }

    return {
      tenant,
      deposit,
    };
  });
}
export async function archiveTenantService(
  tenantId,
  ownerId,
  leavingDate
) {
  if (!tenantId) {
    throw new Error("Tenant ID is required");
  }

  if (!ownerId) {
    throw new Error("Owner ID is required");
  }

  const existingTenant =
    await findTenantDetailsById(
      db,
      tenantId,
      ownerId
    );

  if (!existingTenant) {
    throw new Error("Tenant not found");
  }

  if (existingTenant.status === "ARCHIVED") {
    throw new Error("Tenant is already archived");
  }

  const parsedLeavingDate = leavingDate
    ? new Date(leavingDate)
    : new Date();

  if (Number.isNaN(parsedLeavingDate.getTime())) {
    throw new Error("Invalid leaving date");
  }

  if (
    parsedLeavingDate <
    new Date(existingTenant.dateOfJoining)
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