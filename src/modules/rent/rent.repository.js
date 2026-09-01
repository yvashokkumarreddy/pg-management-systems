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


function getCurrentMonthRange() {
  const now =
    new Date();

  const year =
    now.getFullYear();

  const month =
    now.getMonth() + 1;


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
    nextMonth = 1;
    nextYear += 1;
  }


  const nextMonthStart =
    formatDate({
      year:
        nextYear,

      month:
        nextMonth,

      day: 1,
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

        monthlyRent:
          tenants.monthlyRent,

        status:
          tenants.status,
      })
      .from(tenants)
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

  return result[0] ?? null;
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
      .insert(rentBills)
      .values(data)
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
      .from(rentBills)
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

  return result[0] ?? null;
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
      .from(rentBills)
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

  return result[0] ?? null;
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
      .update(rentBills)
      .set({
        status,

        /*
         * updatedAt is an actual event
         * timestamp, so Date is correct.
         */
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

  return result[0] ?? null;
}


/* ======================================================
   FIND RENT BILLS BY OWNER
====================================================== */

export async function findRentBillsByOwner(
  dbClient,
  ownerId,
  status = null
) {
  const conditions = [
    eq(
      tenants.ownerId,
      ownerId
    ),
  ];


  if (status) {
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

      roomId:
        rooms.id,

      roomNumber:
        rooms.roomNumber,

      floor:
        rooms.floor,
    })
    .from(rentBills)
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
    .from(rentBills)
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

        roomId:
          rooms.id,

        roomNumber:
          rooms.roomNumber,

        floor:
          rooms.floor,
      })
      .from(rentBills)
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

  return result[0] ?? null;
}


/* ======================================================
   RENT COLLECTION SUMMARY
====================================================== */

export async function findRentCollectionSummary(
  dbClient,
  ownerId
) {
  /*
   * paymentDate is PostgreSQL DATE.
   *
   * Therefore month boundaries must
   * also be YYYY-MM-DD strings.
   */
  const {
    monthStart,
    nextMonthStart,
  } =
    getCurrentMonthRange();


  /* ================================================
     LIFETIME COLLECTED
  ================================================ */

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
      .from(payments)
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


  /* ================================================
     COLLECTED THIS MONTH
  ================================================ */

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
      .from(payments)
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