import crypto from "crypto";

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
  findRentBillByTenantAndStart,
} from "./tenant.repository.js";

import {
  calculateRentCycle,
  calculateTransitionRentCycle,
  getRentCycleDayFromDate,
  validateRentCycleDay,
} from "./tenant.utils.js";


/* ======================================================
   DATE HELPERS
====================================================== */

function getTodayDateString() {
  const parts =
    new Intl.DateTimeFormat(
      "en-CA",
      {
        timeZone:
          "Asia/Kolkata",

        year:
          "numeric",

        month:
          "2-digit",

        day:
          "2-digit",
      }
    ).formatToParts(
      new Date()
    );


  const values =
    {};


  for (
    const part of
    parts
  ) {
    if (
      part.type !==
      "literal"
    ) {
      values[
        part.type
      ] =
        part.value;
    }
  }


  return [
    values.year,
    values.month,
    values.day,
  ].join("-");
}


function isValidDateString(
  value
) {
  if (
    typeof value !==
      "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(
      value
    )
  ) {
    return false;
  }


  const [
    year,
    month,
    day,
  ] = value
    .split("-")
    .map(Number);


  if (
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
  ) {
    return false;
  }


  const daysInMonth =
    new Date(
      year,
      month,
      0
    ).getDate();


  return (
    day <=
    daysInMonth
  );
}

/* ======================================================
   NOTICE DATE HELPERS
====================================================== */

function getDaysInMonth(
  year,
  month
) {
  return new Date(
    year,
    month,
    0
  ).getDate();
}


function formatDateString(
  year,
  month,
  day
) {
  return [
    String(year).padStart(
      4,
      "0"
    ),

    String(month).padStart(
      2,
      "0"
    ),

    String(day).padStart(
      2,
      "0"
    ),
  ].join("-");
}


function getCycleBoundaryForMonth(
  year,
  month,
  rentCycleDay
) {
  const lastDay =
    getDaysInMonth(
      year,
      month
    );


  const day =
    Math.min(
      rentCycleDay,
      lastDay
    );


  return formatDateString(
    year,
    month,
    day
  );
}


function getNextMonth(
  year,
  month
) {
  if (
    month === 12
  ) {
    return {
      year:
        year + 1,

      month:
        1,
    };
  }


  return {
    year,

    month:
      month + 1,
  };
}


function calculatePlannedVacatingDate(
  noticeGivenDate,
  rentCycleDay
) {
  const [
    year,
    month,
  ] =
    noticeGivenDate
      .split("-")
      .map(Number);


  const currentMonthBoundary =
    getCycleBoundaryForMonth(
      year,
      month,
      rentCycleDay
    );


  /*
   * If notice is given ON the cycle
   * boundary, that cycle itself can serve
   * as the full notice cycle.
   *
   * Example:
   *
   * cycle day = 3
   * notice = 03 Oct
   * vacating = 03 Nov
   */
  if (
    noticeGivenDate ===
    currentMonthBoundary
  ) {
    const next =
      getNextMonth(
        year,
        month
      );


    return getCycleBoundaryForMonth(
      next.year,
      next.month,
      rentCycleDay
    );
  }


  /*
   * If notice is given AFTER this month's
   * boundary, the next cycle is the first
   * complete notice cycle.
   *
   * Example:
   *
   * cycle day = 3
   * notice = 06 Sep
   *
   * full notice cycle:
   * 03 Oct -> 02 Nov
   *
   * vacating = 03 Nov
   */
  if (
    noticeGivenDate >
    currentMonthBoundary
  ) {
    const next =
      getNextMonth(
        year,
        month
      );


    const afterNext =
      getNextMonth(
        next.year,
        next.month
      );


    return getCycleBoundaryForMonth(
      afterNext.year,
      afterNext.month,
      rentCycleDay
    );
  }


  /*
   * Notice was given BEFORE this month's
   * cycle boundary.
   *
   * Example:
   *
   * cycle day = 15
   * notice = 10 Sep
   *
   * full notice cycle:
   * 15 Sep -> 14 Oct
   *
   * vacating = 15 Oct
   */
  const next =
    getNextMonth(
      year,
      month
    );


  return getCycleBoundaryForMonth(
    next.year,
    next.month,
    rentCycleDay
  );
}

/* ======================================================
   CREATE TENANT
====================================================== */

export async function createTenantService(
  data
) {
  console.log("Creating tenant with data:", data);
  const room =
    await findRoomById(
      db,
      data.roomId
    );


  if (
    !room
  ) {
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


  const occupiedBeds =
    await countOccupiedBedsByRoom(
      db,
      data.roomId
    );


  if (
    occupiedBeds >=
    Number(
      room.capacity
    )
  ) {
    throw new Error(
      "Room has no available bed"
    );
  }


  if (
    !isValidDateString(
      data.dateOfJoining
    )
  ) {
    throw new Error(
      "Invalid joining date"
    );
  }


  /*
   * Every new tenant initially starts
   * with joining day as rent-cycle day.
   *
   * Example:
   *
   * Joined 15 Sep
   * rentCycleDay = 15
   */
  const rentCycleDay =
    getRentCycleDayFromDate(
      data.dateOfJoining
    );


  const rentCycle =
    calculateRentCycle(
      data.dateOfJoining,
      rentCycleDay
    );


  const tenantId =
    crypto.randomUUID();


  return await db.transaction(
    async (
      tx
    ) => {
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
              data.dateOfJoining,

            rentCycleDay,

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
              rentCycle
                .billingPeriodStart,

            billingPeriodEnd:
              rentCycle
                .billingPeriodEnd,

            dueDate:
              rentCycle
                .dueDate,

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
  if (
    !ownerId
  ) {
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
  if (
    !tenantId
  ) {
    throw new Error(
      "Tenant ID is required"
    );
  }


  if (
    !ownerId
  ) {
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


  if (
    !tenant
  ) {
    return null;
  }


  return tenant;
}


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


  if (
    !existingTenant
  ) {
    throw new Error(
      "Tenant not found"
    );
  }


  if (
    existingTenant.status ===
    "ARCHIVED"
  ) {
    throw new Error(
      "Archived tenant cannot be updated"
    );
  }


  const monthlyRentChanged =
    data.monthlyRent !==
      undefined &&
    Number(
      data.monthlyRent
    ) !==
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


    if (
      !room
    ) {
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
      Number(
        room.capacity
      )
    ) {
      throw new Error(
        "Room has no available bed"
      );
    }
  }


  /* ====================================================
     DATE VALIDATION
  ==================================================== */

  if (
    data.dateOfBirth !==
      undefined &&
    data.dateOfBirth !==
      null &&
    data.dateOfBirth !==
      "" &&
    !isValidDateString(
      data.dateOfBirth
    )
  ) {
    throw new Error(
      "Invalid date of birth"
    );
  }


  if (
    data.dateOfJoining !==
      undefined &&
    !isValidDateString(
      data.dateOfJoining
    )
  ) {
    throw new Error(
      "Invalid joining date"
    );
  }


  return await db.transaction(
    async (
      tx
    ) => {
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
          data.dateOfBirth ||
          null;
      }


      /*
       * dateOfJoining remains a genuine
       * historical-data correction field.
       *
       * It does NOT automatically alter
       * rentCycleDay.
       */
      if (
        data.dateOfJoining !==
        undefined
      ) {
        tenantUpdate.dateOfJoining =
          data.dateOfJoining;
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
        ).length >
        0
          ? await updateTenant(
              tx,
              tenantId,
              ownerId,
              tenantUpdate
            )
          : existingTenant;


      /* ==================================================
         EXISTING MONTHLY RENT CHANGE RULE
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
            getTodayDateString()
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
        ).length >
        0
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
   CHANGE RENT CYCLE
====================================================== */

export async function changeTenantRentCycleService(
  tenantId,
  ownerId,
  data
) {
  if (
    !tenantId
  ) {
    throw new Error(
      "Tenant ID is required"
    );
  }


  if (
    !ownerId
  ) {
    throw new Error(
      "Owner ID is required"
    );
  }


  const newRentCycleDay =
    validateRentCycleDay(
      data.rentCycleDay
    );


  const transitionRentAmount =
    Number(
      data.transitionRentAmount
    );


  if (
    !Number.isFinite(
      transitionRentAmount
    ) ||
    transitionRentAmount <=
      0
  ) {
    throw new Error(
      "Transition rent amount must be greater than 0"
    );
  }


  const existingTenant =
    await findTenantDetailsById(
      db,
      tenantId,
      ownerId
    );


  if (
    !existingTenant
  ) {
    throw new Error(
      "Tenant not found"
    );
  }


  if (
    existingTenant.status ===
    "ARCHIVED"
  ) {
    throw new Error(
      "Rent cycle cannot be changed for an archived tenant"
    );
  }


  const currentRentCycleDay =
    Number(
      existingTenant.rentCycleDay
    );


  if (
    currentRentCycleDay ===
    newRentCycleDay
  ) {
    throw new Error(
      "New rent cycle day is the same as the current rent cycle day"
    );
  }


  /*
   * Bills are returned newest first by
   * findTenantDetailsById().
   */
  const latestBill =
    Array.isArray(
      existingTenant.rentBills
    )
      ? existingTenant
          .rentBills[0]
      : null;


  /*
   * Normally at least the first bill
   * exists.
   *
   * If old/repaired data has no bills,
   * transition begins from the historical
   * joining date.
   */
  const transitionStartDate =
    latestBill?.dueDate ||
    existingTenant
      .dateOfJoining;


  if (
    !isValidDateString(
      transitionStartDate
    )
  ) {
    throw new Error(
      "Unable to determine transition start date"
    );
  }


  const transitionCycle =
    calculateTransitionRentCycle(
      transitionStartDate,
      newRentCycleDay
    );


  return await db.transaction(
    async (
      tx
    ) => {
      /*
       * Protect against duplicate billing
       * if the request is accidentally
       * submitted more than once.
       */
      const existingTransitionBill =
        await findRentBillByTenantAndStart(
          tx,
          tenantId,
          transitionCycle
            .billingPeriodStart
        );


      if (
        existingTransitionBill
      ) {
        throw new Error(
          "A rent bill already exists for the transition period"
        );
      }


      /*
       * Historical dateOfJoining is NOT
       * touched.
       */
      const tenant =
        await updateTenant(
          tx,
          tenantId,
          ownerId,
          {
            rentCycleDay:
              newRentCycleDay,
          }
        );


      /*
       * Owner manually decides the
       * transition amount.
       *
       * Example:
       *
       * Old cycle: 15th
       * New cycle: 3rd
       *
       * 15 Oct -> 02 Nov
       * Amount is entered by owner.
       */
      const transitionBill =
        await createRentBill(
          tx,
          {
            id:
              crypto.randomUUID(),

            tenantId,

            billingPeriodStart:
              transitionCycle
                .billingPeriodStart,

            billingPeriodEnd:
              transitionCycle
                .billingPeriodEnd,

            dueDate:
              transitionCycle
                .dueDate,

            amountDue:
              String(
                transitionRentAmount
              ),

            amountPaid:
              "0",

            balanceAmount:
              String(
                transitionRentAmount
              ),

            status:
              "PENDING",
          }
        );


      return {
        tenant,

        transitionBill,

        previousRentCycleDay:
          currentRentCycleDay,

        newRentCycleDay,

        nextRegularCycleStart:
          transitionCycle
            .nextRegularCycleStart,
      };
    }
  );
}

/* ======================================================
   GIVE VACATING NOTICE
====================================================== */

export async function giveTenantNoticeService(
  tenantId,
  ownerId,
  data
) {
  if (
    !tenantId
  ) {
    throw new Error(
      "Tenant ID is required"
    );
  }


  if (
    !ownerId
  ) {
    throw new Error(
      "Owner ID is required"
    );
  }


  if (
    !isValidDateString(
      data.noticeGivenDate
    )
  ) {
    throw new Error(
      "Invalid notice given date"
    );
  }


  const existingTenant =
    await findTenantDetailsById(
      db,
      tenantId,
      ownerId
    );


  if (
    !existingTenant
  ) {
    throw new Error(
      "Tenant not found"
    );
  }


  if (
    existingTenant.status ===
    "ARCHIVED"
  ) {
    throw new Error(
      "Notice cannot be recorded for an archived tenant"
    );
  }


  if (
    existingTenant.status ===
    "NOTICE_PERIOD"
  ) {
    throw new Error(
      "Tenant is already in notice period"
    );
  }


  if (
    data.noticeGivenDate <
    existingTenant.dateOfJoining
  ) {
    throw new Error(
      "Notice date cannot be before joining date"
    );
  }


  const rentCycleDay =
    validateRentCycleDay(
      existingTenant.rentCycleDay
    );


  /*
   * IMPORTANT:
   *
   * The client does NOT decide the
   * planned vacating date.
   *
   * We calculate the first valid vacating
   * boundary that provides one complete
   * rent cycle of notice.
   */
  const plannedVacatingDate =
    calculatePlannedVacatingDate(
      data.noticeGivenDate,
      rentCycleDay
    );


  const tenant =
    await updateTenant(
      db,
      tenantId,
      ownerId,
      {
        status:
          "NOTICE_PERIOD",

        noticeGivenDate:
          data.noticeGivenDate,

        plannedVacatingDate,
      }
    );


  return {
    tenant,

    notice: {
      noticeGivenDate:
        data.noticeGivenDate,

      plannedVacatingDate,

      rentCycleDay,
    },
  };
}


/* ======================================================
   CANCEL VACATING NOTICE
====================================================== */

export async function cancelTenantNoticeService(
  tenantId,
  ownerId
) {
  if (
    !tenantId
  ) {
    throw new Error(
      "Tenant ID is required"
    );
  }


  if (
    !ownerId
  ) {
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


  if (
    !existingTenant
  ) {
    throw new Error(
      "Tenant not found"
    );
  }


  if (
    existingTenant.status ===
    "ARCHIVED"
  ) {
    throw new Error(
      "Notice cannot be cancelled for an archived tenant"
    );
  }


  if (
    existingTenant.status !==
    "NOTICE_PERIOD"
  ) {
    throw new Error(
      "Tenant is not in notice period"
    );
  }


  return await updateTenant(
    db,
    tenantId,
    ownerId,
    {
      status:
        "ACTIVE",

      noticeGivenDate:
        null,

      plannedVacatingDate:
        null,
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
  if (
    !tenantId
  ) {
    throw new Error(
      "Tenant ID is required"
    );
  }


  if (
    !ownerId
  ) {
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


  if (
    !existingTenant
  ) {
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
    leavingDate ||
    getTodayDateString();


  if (
    !isValidDateString(
      parsedLeavingDate
    )
  ) {
    throw new Error(
      "Invalid leaving date"
    );
  }


  if (
    parsedLeavingDate <
    existingTenant.dateOfJoining
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
  if (
    !tenantId
  ) {
    throw new Error(
      "Tenant ID is required"
    );
  }


  if (
    !ownerId
  ) {
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


  if (
    !existingTenant
  ) {
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


  const room =
    await findRoomById(
      db,
      existingTenant.roomId
    );


  if (
    !room
  ) {
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


  const occupiedBeds =
    await countOccupiedBedsByRoom(
      db,
      existingTenant.roomId
    );


  if (
    occupiedBeds >=
    Number(
      room.capacity
    )
  ) {
    throw new Error(
      "Assigned room has no available bed"
    );
  }


  return await restoreTenant(
    db,
    tenantId,
    ownerId
  );
}