import {
  db,
} from "@/db";

import {
  findDashboardOccupants,
  findDashboardPayments,
  findDashboardRentBills,
  findDashboardRooms,
  findDashboardTenants,
  findPgProfileForDashboard,
} from "./dashboard.repository.js";


function moneyToPaise(
  value
) {
  const amount =
    Number(value || 0);

  return Math.round(
    amount * 100
  );
}


function paiseToMoney(
  value
) {
  return (
    value / 100
  ).toFixed(2);
}


function startOfToday() {
  const now =
    new Date();

  return new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );
}


function getCurrentMonthRange() {
  const now =
    new Date();

  const start =
    new Date(
      now.getFullYear(),
      now.getMonth(),
      1
    );

  const end =
    new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      1
    );

  return {
    start,
    end,
  };
}


function isPaymentInCurrentMonth(
  paymentDate,
  monthStart,
  nextMonthStart
) {
  const date =
    new Date(paymentDate);

  return (
    date >= monthStart &&
    date < nextMonthStart
  );
}


function calculateCurrentBillStatus(
  bill
) {
//   const duePaise =
//     moneyToPaise(
//       bill.amountDue
//     );

  const paidPaise =
    moneyToPaise(
      bill.amountPaid
    );

    const balancePaise =
    Math.max(
        moneyToPaise(
        bill.amountDue
        ) -
        moneyToPaise(
            bill.amountPaid
        ),
        0
    );

  if (
    balancePaise <= 0
  ) {
    return "PAID";
  }

  const dueDate =
    new Date(
      bill.dueDate
    );

  const today =
    startOfToday();

  const normalizedDueDate =
    new Date(
      dueDate.getFullYear(),
      dueDate.getMonth(),
      dueDate.getDate()
    );

  if (
    normalizedDueDate <
    today
  ) {
    return "OVERDUE";
  }

  if (
    paidPaise > 0
  ) {
    return "PARTIAL";
  }

  return "PENDING";
}


export async function getDashboardService(
  ownerId
) {
  if (!ownerId) {
    throw new Error(
      "Owner ID is required"
    );
  }

  const [
    rooms,
    occupants,
    tenants,
    rentBills,
    payments,
    property,
  ] = await Promise.all([
    findDashboardRooms(
      db,
      ownerId
    ),

    findDashboardOccupants(
      db,
      ownerId
    ),

    findDashboardTenants(
      db,
      ownerId
    ),

    findDashboardRentBills(
      db,
      ownerId
    ),

    findDashboardPayments(
      db,
      ownerId
    ),

    findPgProfileForDashboard(
      db,
      ownerId
    ),
  ]);

  /*
   * -------------------------
   * ROOM / BED STATISTICS
   * -------------------------
   */

  const totalRooms =
    rooms.length;

  const totalBeds =
    rooms.reduce(
      (
        total,
        room
      ) =>
        total +
        Number(
          room.capacity || 0
        ),
      0
    );

  /*
   * Only tenants attached
   * to an ACTIVE room count
   * toward current occupancy.
   */

  const activeRoomIds =
    new Set(
      rooms.map(
        (room) =>
          room.id
      )
    );

  const occupiedBeds =
    occupants.filter(
      (tenant) =>
        tenant.roomId &&
        activeRoomIds.has(
          tenant.roomId
        )
    ).length;

  const availableBeds =
    Math.max(
      totalBeds -
        occupiedBeds,
      0
    );

  const occupiedRoomIds =
    new Set(
      occupants
        .filter(
          (tenant) =>
            tenant.roomId &&
            activeRoomIds.has(
              tenant.roomId
            )
        )
        .map(
          (tenant) =>
            tenant.roomId
        )
    );

  const occupiedRooms =
    occupiedRoomIds.size;

  const vacantRooms =
    rooms.filter(
      (room) =>
        !occupiedRoomIds.has(
          room.id
        )
    ).length;


  /*
   * -------------------------
   * TENANT STATISTICS
   * -------------------------
   */

  const activeTenants =
    tenants.filter(
      (tenant) =>
        tenant.status ===
        "ACTIVE"
    ).length;

  const noticePeriodTenants =
    tenants.filter(
      (tenant) =>
        tenant.status ===
        "NOTICE_PERIOD"
    ).length;

  const archivedTenants =
    tenants.filter(
      (tenant) =>
        tenant.status ===
        "ARCHIVED"
    ).length;

  const currentTenants =
    activeTenants +
    noticePeriodTenants;


  /*
   * -------------------------
   * PAYMENT STATISTICS
   * -------------------------
   */

  const {
    start:
      currentMonthStart,

    end:
      nextMonthStart,
  } =
    getCurrentMonthRange();

  let collectedLifetimePaise =
    0;

  let collectedThisMonthPaise =
    0;

  for (
    const payment
    of payments
  ) {
    const amountPaise =
      moneyToPaise(
        payment.amount
      );

    collectedLifetimePaise +=
      amountPaise;

    if (
      isPaymentInCurrentMonth(
        payment.paymentDate,
        currentMonthStart,
        nextMonthStart
      )
    ) {
      collectedThisMonthPaise +=
        amountPaise;
    }
  }


  /*
   * -------------------------
   * RENT BILL STATISTICS
   * -------------------------
   */

  let totalOutstandingPaise =
    0;

  let pendingAmountPaise =
    0;

  let overdueAmountPaise =
    0;

  let pendingBillCount =
    0;

  let partialBillCount =
    0;

  let overdueBillCount =
    0;

  let paidBillCount =
    0;

  const overdueBills =
    [];

  for (
    const bill
    of rentBills
  ) {
    // const duePaise =
    //   moneyToPaise(
    //     bill.amountDue
    //   );

    const paidPaise =
      moneyToPaise(
        bill.amountPaid
      );

    const balancePaise =
        Math.max(
            moneyToPaise(
            bill.amountDue
            ) -
            moneyToPaise(
                bill.amountPaid
            ),
            0
        );

    const status =
      calculateCurrentBillStatus(
        bill
      );

    if (
      status === "PAID"
    ) {
      paidBillCount += 1;
      continue;
    }

    totalOutstandingPaise +=
      balancePaise;

    if (
      status === "OVERDUE"
    ) {
      overdueBillCount += 1;

      overdueAmountPaise +=
        balancePaise;

      overdueBills.push({
        id:
          bill.id,

        tenantId:
          bill.tenantId,

        tenantName:
          bill.tenantName,

        tenantMobile:
          bill.tenantMobile,

        roomId:
          bill.roomId,

        roomNumber:
          bill.roomNumber,

        billingPeriodStart:
          bill.billingPeriodStart,

        billingPeriodEnd:
          bill.billingPeriodEnd,

        dueDate:
          bill.dueDate,

        amountDue:
          bill.amountDue,

        amountPaid:
          bill.amountPaid,

        balanceAmount:
          paiseToMoney(
            balancePaise
          ),

        status:
          "OVERDUE",
      });

      continue;
    }

    /*
     * Pending amount means
     * outstanding but not overdue.
     */

    pendingAmountPaise +=
      balancePaise;

    if (
      status ===
      "PARTIAL"
    ) {
      partialBillCount +=
        1;
    } else {
      pendingBillCount +=
        1;
    }
  }


  /*
   * -------------------------
   * RECENT PAYMENTS
   * -------------------------
   */

  const recentPayments =
    payments
      .slice(0, 10)
      .map(
        (payment) => ({
          paymentId:
            payment.paymentId,

          tenantId:
            payment.tenantId,

          tenantName:
            payment.tenantName,

          tenantMobile:
            payment.tenantMobile,

          roomId:
            payment.roomId,

          roomNumber:
            payment.roomNumber,

          rentBillId:
            payment.rentBillId,

          amount:
            payment.amount,

          paymentDate:
            payment.paymentDate,

          mode:
            payment.mode,

          notes:
            payment.notes,

          billingPeriodStart:
            payment.billingPeriodStart,

          billingPeriodEnd:
            payment.billingPeriodEnd,

          billDueDate:
            payment.billDueDate,
        })
      );


  /*
   * -------------------------
   * FINAL DASHBOARD RESPONSE
   * -------------------------
   */

  return {
    property: property
    ? {
        pgName: property.pgName,
        address: property.address,
      }
    : null,
  rooms: {
    total:
      totalRooms,

    occupied:
      occupiedRooms,

    vacant:
      vacantRooms,

    totalBeds,

    occupiedBeds,

    availableBeds,
  },

  tenants: {
    current:
      currentTenants,

    active:
      activeTenants,

    noticePeriod:
      noticePeriodTenants,

    archived:
      archivedTenants,
  },

  rent: {
    collectedThisMonth:
      paiseToMoney(
        collectedThisMonthPaise
      ),

    collectedLifetime:
      paiseToMoney(
        collectedLifetimePaise
      ),

    outstandingAmount:
      paiseToMoney(
        totalOutstandingPaise
      ),

    pendingAmount:
      paiseToMoney(
        pendingAmountPaise
      ),

    overdueAmount:
      paiseToMoney(
        overdueAmountPaise
      ),

    bills: {
      pending:
        pendingBillCount,

      partial:
        partialBillCount,

      overdue:
        overdueBillCount,

      paid:
        paidBillCount,
    },
  },

  recentPayments:
    payments
      .slice(0, 10)
      .map(
        (payment) => ({
          paymentId:
            payment.paymentId,

          tenantId:
            payment.tenantId,

          tenantName:
            payment.tenantName,

          roomNumber:
            payment.roomNumber,

          rentBillId:
            payment.rentBillId,

          amount:
            payment.amount,

          paymentDate:
            payment.paymentDate,

          mode:
            payment.mode,
        })
      ),

  overdueBills:
    overdueBills
      .slice(0, 10),
};
}
