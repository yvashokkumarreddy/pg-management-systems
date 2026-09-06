import {
  and,
  desc,
  eq,
  gte,
  lt,
  sql,
} from "drizzle-orm";

import {
  rentBills,
  rooms,
  tenants,
  payments,
} from "@/db/schema";


/* ======================================================
   DATE HELPERS
====================================================== */

function formatDate({
  year,
  month,
  day,
}) {
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


function getIndiaDateParts() {
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


  return {
    year:
      Number(
        values.year
      ),

    month:
      Number(
        values.month
      ),

    day:
      Number(
        values.day
      ),
  };
}


function getTodayDateString() {
  const {
    year,
    month,
    day,
  } =
    getIndiaDateParts();


  return formatDate({
    year,
    month,
    day,
  });
}


function getCurrentMonthRange() {
  const {
    year,
    month,
  } =
    getIndiaDateParts();


  const monthStart =
    formatDate({
      year,
      month,
      day: 1,
    });


  let nextYear =
    year;


  let nextMonth =
    month + 1;


  if (
    nextMonth === 13
  ) {
    nextMonth =
      1;

    nextYear +=
      1;
  }


  const nextMonthStart =
    formatDate({
      year:
        nextYear,

      month:
        nextMonth,

      day:
        1,
    });


  return {
    monthStart,
    nextMonthStart,
  };
}


/* ======================================================
   FIND TENANT FOR RENT
====================================================== */

export async function findTenantForRent(
  dbClient,
  tenantId,
  ownerId
) {
  const result =
    await dbClient
      .select({
        id:
          tenants.id,

        ownerId:
          tenants.ownerId,

        roomId:
          tenants.roomId,

        fullName:
          tenants.fullName,

        mobile:
          tenants.mobile,

        dateOfJoining:
          tenants.dateOfJoining,

        dateOfLeaving:
          tenants.dateOfLeaving,

        noticeGivenDate:
          tenants.noticeGivenDate,

        plannedVacatingDate:
          tenants.plannedVacatingDate,

        rentCycleDay:
          tenants.rentCycleDay,

        monthlyRent:
          tenants.monthlyRent,

        status:
          tenants.status,
      })
      .from(
        tenants
      )
      .where(
        and(
          eq(
            tenants.id,
            tenantId
          ),

          eq(
            tenants.ownerId,
            ownerId
          )
        )
      )
      .limit(1);


  return (
    result[0] ??
    null
  );
}


/* ======================================================
   FIND TENANTS ELIGIBLE FOR SCHEDULED RENT
====================================================== */

export async function findTenantsForScheduledRent(
  dbClient
) {
  return await dbClient
    .select({
      id:
        tenants.id,

      ownerId:
        tenants.ownerId,

      roomId:
        tenants.roomId,

      fullName:
        tenants.fullName,

      dateOfJoining:
        tenants.dateOfJoining,

      dateOfLeaving:
        tenants.dateOfLeaving,

      noticeGivenDate:
        tenants.noticeGivenDate,

      plannedVacatingDate:
        tenants.plannedVacatingDate,

      rentCycleDay:
        tenants.rentCycleDay,

      monthlyRent:
        tenants.monthlyRent,

      status:
        tenants.status,
    })
    .from(
      tenants
    )
    .where(
      sql`
        ${tenants.status}
        IN (
          'ACTIVE',
          'NOTICE_PERIOD'
        )
      `
    );
}


/* ======================================================
   CREATE RENT BILL
====================================================== */

export async function createRentBill(
  dbClient,
  data
) {
  const result =
    await dbClient
      .insert(
        rentBills
      )
      .values(
        data
      )
      .returning();


  return result[0];
}


/* ======================================================
   FIND LATEST RENT BILL
====================================================== */

export async function findLatestRentBillByTenant(
  dbClient,
  tenantId
) {
  const result =
    await dbClient
      .select()
      .from(
        rentBills
      )
      .where(
        eq(
          rentBills.tenantId,
          tenantId
        )
      )
      .orderBy(
        desc(
          rentBills.billingPeriodStart
        )
      )
      .limit(1);


  return (
    result[0] ??
    null
  );
}


/* ======================================================
   FIND BILL BY TENANT + PERIOD START
====================================================== */

export async function findRentBillByTenantAndStart(
  dbClient,
  tenantId,
  billingPeriodStart
) {
  const result =
    await dbClient
      .select()
      .from(
        rentBills
      )
      .where(
        and(
          eq(
            rentBills.tenantId,
            tenantId
          ),

          eq(
            rentBills.billingPeriodStart,
            billingPeriodStart
          )
        )
      )
      .limit(1);


  return (
    result[0] ??
    null
  );
}


/* ======================================================
   UPDATE RENT BILL STATUS
====================================================== */

export async function updateRentBillStatus(
  dbClient,
  billId,
  status
) {
  const result =
    await dbClient
      .update(
        rentBills
      )
      .set({
        status,

        updatedAt:
          new Date(),
      })
      .where(
        eq(
          rentBills.id,
          billId
        )
      )
      .returning();


  return (
    result[0] ??
    null
  );
}


/* ======================================================
   FIND ALL RENT BILLS BY OWNER
   HISTORICAL / DETAIL USE
====================================================== */

export async function findRentBillsByOwner(
  dbClient,
  ownerId,
  status = null
) {
  const conditions =
    [
      eq(
        tenants.ownerId,
        ownerId
      ),
    ];


  if (
    status
  ) {
    conditions.push(
      eq(
        rentBills.status,
        status
      )
    );
  }


  return await dbClient
    .select({
      id:
        rentBills.id,

      tenantId:
        rentBills.tenantId,

      billingPeriodStart:
        rentBills.billingPeriodStart,

      billingPeriodEnd:
        rentBills.billingPeriodEnd,

      dueDate:
        rentBills.dueDate,

      amountDue:
        rentBills.amountDue,

      amountPaid:
        rentBills.amountPaid,

      balanceAmount:
        rentBills.balanceAmount,

      status:
        rentBills.status,

      createdAt:
        rentBills.createdAt,

      updatedAt:
        rentBills.updatedAt,

      tenantName:
        tenants.fullName,

      tenantMobile:
        tenants.mobile,

      tenantStatus:
        tenants.status,

      rentCycleDay:
        tenants.rentCycleDay,

      roomId:
        rooms.id,

      roomNumber:
        rooms.roomNumber,

      floor:
        rooms.floor,
    })
    .from(
      rentBills
    )
    .innerJoin(
      tenants,
      eq(
        rentBills.tenantId,
        tenants.id
      )
    )
    .leftJoin(
      rooms,
      eq(
        tenants.roomId,
        rooms.id
      )
    )
    .where(
      and(
        ...conditions
      )
    )
    .orderBy(
      desc(
        rentBills.dueDate
      )
    );
}


/* ======================================================
   FIND CURRENT RENT POSITION BY OWNER
====================================================== */

/*
 * Main Rent & Payments listing.
 *
 * FINAL RULE:
 *
 * 1 tenant = 1 current rent-cycle record.
 *
 * Historical bills remain untouched.
 *
 * The current bill is the bill whose
 * billing period contains today's India
 * calendar date:
 *
 * billingPeriodStart <= today
 * billingPeriodEnd   >= today
 *
 * Previous unpaid balances are calculated
 * separately and are NOT merged into the
 * current bill itself.
 */
export async function findCurrentRentPositionsByOwner(
  dbClient,
  ownerId
) {
  const today =
    getTodayDateString();


  return await dbClient.execute(
    sql`
      SELECT
        t.id AS "tenantId",
        t.full_name AS "tenantName",
        t.mobile AS "tenantMobile",
        t.status AS "tenantStatus",
        t.rent_cycle_day AS "rentCycleDay",
        t.monthly_rent AS "monthlyRent",

        r.id AS "roomId",
        r.room_number AS "roomNumber",
        r.floor AS "floor",

        current_bill.id AS "currentBillId",
        current_bill.billing_period_start AS "billingPeriodStart",
        current_bill.billing_period_end AS "billingPeriodEnd",
        current_bill.due_date AS "dueDate",
        current_bill.amount_due AS "currentAmountDue",
        current_bill.amount_paid AS "currentAmountPaid",
        current_bill.balance_amount AS "currentBalanceAmount",
        current_bill.status AS "currentStatus",

        COALESCE(
          previous_balance."previousOutstanding",
          0
        ) AS "previousOutstanding",

        (
          COALESCE(
            current_bill.balance_amount,
            0
          )
          +
          COALESCE(
            previous_balance."previousOutstanding",
            0
          )
        ) AS "totalOutstanding"

      FROM tenants t

      LEFT JOIN rooms r
        ON r.id = t.room_id

      LEFT JOIN LATERAL (
        SELECT
          rb.id,
          rb.billing_period_start,
          rb.billing_period_end,
          rb.due_date,
          rb.amount_due,
          rb.amount_paid,
          rb.balance_amount,
          rb.status

        FROM rent_bills rb

        WHERE
          rb.tenant_id = t.id

          AND
          rb.billing_period_start <= ${today}

          AND
          rb.billing_period_end >= ${today}

        ORDER BY
          rb.billing_period_start DESC,
          rb.created_at DESC

        LIMIT 1
      ) current_bill
        ON TRUE

      LEFT JOIN LATERAL (
        SELECT
          COALESCE(
            SUM(
              rb.balance_amount
            ),
            0
          ) AS "previousOutstanding"

        FROM rent_bills rb

        WHERE
          rb.tenant_id = t.id

          AND
          rb.balance_amount > 0

          AND (
            current_bill.id IS NULL
            OR rb.id <> current_bill.id
          )

          AND (
            current_bill.billing_period_start IS NULL
            OR rb.billing_period_start <
              current_bill.billing_period_start
          )
      ) previous_balance
        ON TRUE

      WHERE
        t.owner_id = ${ownerId}

        AND t.status IN (
          'ACTIVE',
          'NOTICE_PERIOD'
        )

      ORDER BY
        current_bill.due_date ASC NULLS LAST,
        t.full_name ASC
    `
  );
}


/* ======================================================
   FIND RENT BILLS BY TENANT
====================================================== */

export async function findRentBillsByTenant(
  dbClient,
  tenantId,
  ownerId
) {
  return await dbClient
    .select({
      id:
        rentBills.id,

      tenantId:
        rentBills.tenantId,

      billingPeriodStart:
        rentBills.billingPeriodStart,

      billingPeriodEnd:
        rentBills.billingPeriodEnd,

      dueDate:
        rentBills.dueDate,

      amountDue:
        rentBills.amountDue,

      amountPaid:
        rentBills.amountPaid,

      balanceAmount:
        rentBills.balanceAmount,

      status:
        rentBills.status,

      createdAt:
        rentBills.createdAt,

      updatedAt:
        rentBills.updatedAt,
    })
    .from(
      rentBills
    )
    .innerJoin(
      tenants,
      eq(
        rentBills.tenantId,
        tenants.id
      )
    )
    .where(
      and(
        eq(
          tenants.id,
          tenantId
        ),

        eq(
          tenants.ownerId,
          ownerId
        )
      )
    )
    .orderBy(
      desc(
        rentBills.billingPeriodStart
      )
    );
}


/* ======================================================
   FIND RENT BILL DETAILS
====================================================== */

export async function findRentBillDetailsById(
  dbClient,
  billId,
  ownerId
) {
  const result =
    await dbClient
      .select({
        id:
          rentBills.id,

        tenantId:
          rentBills.tenantId,

        billingPeriodStart:
          rentBills.billingPeriodStart,

        billingPeriodEnd:
          rentBills.billingPeriodEnd,

        dueDate:
          rentBills.dueDate,

        amountDue:
          rentBills.amountDue,

        amountPaid:
          rentBills.amountPaid,

        balanceAmount:
          rentBills.balanceAmount,

        status:
          rentBills.status,

        createdAt:
          rentBills.createdAt,

        updatedAt:
          rentBills.updatedAt,

        tenantName:
          tenants.fullName,

        tenantMobile:
          tenants.mobile,

        tenantStatus:
          tenants.status,

        rentCycleDay:
          tenants.rentCycleDay,

        roomId:
          rooms.id,

        roomNumber:
          rooms.roomNumber,

        floor:
          rooms.floor,
      })
      .from(
        rentBills
      )
      .innerJoin(
        tenants,
        eq(
          rentBills.tenantId,
          tenants.id
        )
      )
      .leftJoin(
        rooms,
        eq(
          tenants.roomId,
          rooms.id
        )
      )
      .where(
        and(
          eq(
            rentBills.id,
            billId
          ),

          eq(
            tenants.ownerId,
            ownerId
          )
        )
      )
      .limit(1);


  return (
    result[0] ??
    null
  );
}


/* ======================================================
   RENT COLLECTION SUMMARY
====================================================== */

export async function findRentCollectionSummary(
  dbClient,
  ownerId
) {
  const {
    monthStart,
    nextMonthStart,
  } =
    getCurrentMonthRange();


  const lifetimeResult =
    await dbClient
      .select({
        total: sql`
          COALESCE(
            SUM(${payments.amount}),
            0
          )
        `,
      })
      .from(
        payments
      )
      .innerJoin(
        tenants,
        eq(
          payments.tenantId,
          tenants.id
        )
      )
      .where(
        eq(
          tenants.ownerId,
          ownerId
        )
      );


  const monthResult =
    await dbClient
      .select({
        total: sql`
          COALESCE(
            SUM(${payments.amount}),
            0
          )
        `,
      })
      .from(
        payments
      )
      .innerJoin(
        tenants,
        eq(
          payments.tenantId,
          tenants.id
        )
      )
      .where(
        and(
          eq(
            tenants.ownerId,
            ownerId
          ),

          gte(
            payments.paymentDate,
            monthStart
          ),

          lt(
            payments.paymentDate,
            nextMonthStart
          )
        )
      );


  return {
    collectedThisMonth:
      Number(
        monthResult[0]?.total ||
          0
      ),

    lifetimeCollected:
      Number(
        lifetimeResult[0]?.total ||
          0
      ),
  };
}