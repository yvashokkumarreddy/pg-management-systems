"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertTriangle,
  X,
} from "lucide-react";

import {
  apiRequest,
} from "@/lib/api/client";


/* ======================================================
   HELPERS
====================================================== */

function formatCurrency(value) {
  return new Intl.NumberFormat(
    "en-IN",
    {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }
  ).format(
    Number(value || 0)
  );
}


function formatCompactCurrency(value) {
  const amount =
    Number(value || 0);

  if (amount >= 10000000) {
    return `₹${Number(
      (
        amount /
        10000000
      ).toFixed(2)
    )}Cr`;
  }

  if (amount >= 100000) {
    return `₹${Number(
      (
        amount /
        100000
      ).toFixed(2)
    )}L`;
  }

  if (amount >= 1000) {
    return `₹${Number(
      (
        amount /
        1000
      ).toFixed(1)
    )}K`;
  }

  return formatCurrency(
    amount
  );
}


function parseDateOnly(value) {
  if (
    !value ||
    typeof value !==
      "string"
  ) {
    return null;
  }

  const match =
    /^(\d{4})-(\d{2})-(\d{2})$/.exec(
      value
    );

  if (!match) {
    return null;
  }

  return new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3])
  );
}


function formatCycleDate(value) {
  const date =
    parseDateOnly(value);

  if (!date) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
    }
  ).format(date);
}


function formatFullDate(value) {
  const date =
    parseDateOnly(value);

  if (!date) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  ).format(date);
}


function formatPaymentMode(mode) {
  switch (mode) {
    case "BANK_TRANSFER":
      return "Bank transfer";

    case "CASH":
      return "Cash";

    case "UPI":
      return "UPI";

    case "OTHER":
      return "Other";

    default:
      return mode || "—";
  }
}


function getTodayInputDate() {
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

  const values = {};

  for (const part of parts) {
    if (
      part.type !==
      "literal"
    ) {
      values[part.type] =
        part.value;
    }
  }

  return [
    values.year,
    values.month,
    values.day,
  ].join("-");
}


function roundMoney(value) {
  return (
    Math.round(
      Number(value) * 100
    ) / 100
  );
}


function isBillOverdue(bill) {
  const balance =
    Number(
      bill.balanceAmount ||
        0
    );

  if (
    balance <= 0 ||
    !bill.dueDate
  ) {
    return false;
  }

  return (
    bill.dueDate <
    getTodayInputDate()
  );
}


function getBillStatus(bill) {
  const amountPaid =
    Number(
      bill.amountPaid ||
        0
    );

  const balance =
    Number(
      bill.balanceAmount ||
        0
    );

  if (
    bill.status === "PAID" ||
    balance <= 0
  ) {
    return "PAID";
  }

  if (
    bill.status ===
      "OVERDUE" ||
    isBillOverdue(bill)
  ) {
    return "OVERDUE";
  }

  if (
    bill.status ===
      "PARTIALLY_PAID" ||
    bill.status ===
      "PARTIAL" ||
    amountPaid > 0
  ) {
    return "PARTIAL";
  }

  return "PENDING";
}


function getGroupedStatus(bills) {
  if (
    bills.some(
      (bill) =>
        getBillStatus(
          bill
        ) === "OVERDUE"
    )
  ) {
    return "OVERDUE";
  }

  if (
    bills.some(
      (bill) =>
        getBillStatus(
          bill
        ) === "PARTIAL"
    )
  ) {
    return "PARTIAL";
  }

  return "PENDING";
}


function getStatusLabel(status) {
  switch (status) {
    case "PAID":
      return "PAID";

    case "PARTIAL":
      return "PARTIAL";

    case "OVERDUE":
      return "OVERDUE";

    default:
      return "PENDING";
  }
}


/* ======================================================
   PAGE
====================================================== */

export default function RentPage() {
  const PAGE_SIZE = 5;


  /* ====================================================
     DATA
  ==================================================== */

  /*
   * Historical bills.
   *
   * Used for:
   * - payment allocation
   * - previous outstanding
   * - summary
   * - payment history
   */
  const [
    rentBills,
    setRentBills,
  ] = useState([]);


  /*
   * Current rent positions.
   *
   * Backend:
   * /api/rent-bills/current
   *
   * 1 tenant = 1 current-cycle row.
   */
  const [
    currentRentPositions,
    setCurrentRentPositions,
  ] = useState([]);


  const [
    collectionSummary,
    setCollectionSummary,
  ] = useState({
    collectedThisMonth: 0,
    lifetimeCollected: 0,
  });


  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    error,
    setError,
  ] = useState("");


  /* ====================================================
     FILTER + PAGINATION
  ==================================================== */

  const [
    statusFilter,
    setStatusFilter,
  ] = useState("ALL");


  const [
    currentPage,
    setCurrentPage,
  ] = useState(1);


  /* ====================================================
     PAYMENT MODAL
  ==================================================== */

  const [
    paymentModalOpen,
    setPaymentModalOpen,
  ] = useState(false);


  const [
    selectedPaymentTargetId,
    setSelectedPaymentTargetId,
  ] = useState("");


  const [
    paymentAmount,
    setPaymentAmount,
  ] = useState("");


  const [
    paymentAllocations,
    setPaymentAllocations,
  ] = useState({});


  const [
    paymentMode,
    setPaymentMode,
  ] = useState("UPI");


  const [
    paymentDate,
    setPaymentDate,
  ] = useState(
    getTodayInputDate()
  );


  const [
    paymentReference,
    setPaymentReference,
  ] = useState("");


  /*
   * When true:
   *
   * POST /api/payments
   * receives:
   *
   * markNoticePeriod: true
   *
   * Backend uses paymentDate as
   * noticeGivenDate.
   */
  const [
    markNoticePeriod,
    setMarkNoticePeriod,
  ] = useState(false);


  const [
    paymentSubmitting,
    setPaymentSubmitting,
  ] = useState(false);


  const [
    paymentError,
    setPaymentError,
  ] = useState("");


  /* ====================================================
     BILL DETAILS
  ==================================================== */

  const [
    billDetailsModalOpen,
    setBillDetailsModalOpen,
  ] = useState(false);


  const [
    selectedViewBill,
    setSelectedViewBill,
  ] = useState(null);


  const [
    billPayments,
    setBillPayments,
  ] = useState([]);


  const [
    billDetailsLoading,
    setBillDetailsLoading,
  ] = useState(false);


  const [
    billDetailsError,
    setBillDetailsError,
  ] = useState("");


  const [
    billPaymentsCache,
    setBillPaymentsCache,
  ] = useState({});


  /* ====================================================
     LOAD RENT DATA
  ==================================================== */

  const loadRentBills =
    useCallback(
      async () => {
        try {
          setLoading(true);
          setError("");

          const [
            billsResponse,
            currentResponse,
          ] =
            await Promise.all([
              apiRequest(
                "/api/rent-bills"
              ),

              apiRequest(
                "/api/rent-bills/current"
              ),
            ]);


          /* ============================================
             HISTORICAL RENT BILLS

             Actual response:

             {
               success: true,
               data: {
                 bills: [...],
                 summary: {...}
               }
             }
          ============================================ */

          const billsPayload =
            billsResponse?.data ??
            billsResponse;


          const bills =
            Array.isArray(
              billsPayload?.bills
            )
              ? billsPayload.bills
              : [];


          setRentBills(
            bills
          );


          setCollectionSummary({
            collectedThisMonth:
              Number(
                billsPayload
                  ?.summary
                  ?.collectedThisMonth ??
                  0
              ),

            lifetimeCollected:
              Number(
                billsPayload
                  ?.summary
                  ?.lifetimeCollected ??
                  0
              ),
          });


          /* ============================================
             CURRENT RENT POSITIONS

             Actual response:

             {
               success: true,
               data: {
                 positions: [...]
               }
             }
          ============================================ */

          const currentPayload =
            currentResponse?.data ??
            currentResponse;


          const positions =
            Array.isArray(
              currentPayload
                ?.positions
            )
              ? currentPayload.positions
              : [];


          setCurrentRentPositions(
            positions
          );
        } catch (err) {
          console.error(
            "Load rent data error:",
            err
          );


          setError(
            err?.data?.message ||
              err?.message ||
              "Unable to load rent data."
          );


          setRentBills(
            []
          );


          setCurrentRentPositions(
            []
          );


          setCollectionSummary({
            collectedThisMonth: 0,
            lifetimeCollected: 0,
          });
        } finally {
          setLoading(false);
        }
      },
      []
    );


  useEffect(
    () => {
      loadRentBills();
    },
    [
      loadRentBills,
    ]
  );


  /* ====================================================
     SUMMARY
  ==================================================== */

  /*
   * Collected values come from backend.
   *
   * Pending and overdue are calculated
   * from historical outstanding bills.
   */
  const summary =
    useMemo(
      () => {
        const result = {
          collectedThisMonth:
            Number(
              collectionSummary
                .collectedThisMonth ||
                0
            ),

          lifetimeCollected:
            Number(
              collectionSummary
                .lifetimeCollected ||
                0
            ),

          pending: 0,

          overdue: 0,
        };


        rentBills.forEach(
          (bill) => {
            const balance =
              Number(
                bill.balanceAmount ||
                  0
              );


            if (
              balance <= 0
            ) {
              return;
            }


            if (
              getBillStatus(
                bill
              ) === "OVERDUE"
            ) {
              result.overdue +=
                balance;
            } else {
              result.pending +=
                balance;
            }
          }
        );


        return result;
      },
      [
        rentBills,
        collectionSummary,
      ]
    );


  /* ====================================================
     MAIN CURRENT-CYCLE TABLE
  ==================================================== */

  const displayRows =
    useMemo(
      () => {
        return currentRentPositions
          .map(
            (position) => {
              const currentBalance =
                Number(
                  position
                    .currentBalanceAmount ??
                    0
                );


              const previousOutstanding =
                Number(
                  position
                    .previousOutstanding ??
                    0
                );


              const totalOutstanding =
                Number(
                  position
                    .totalOutstanding ??
                    currentBalance +
                      previousOutstanding
                );


              return {
                id:
                  position
                    .currentBillId ||
                  `tenant-${position.tenantId}`,

                type:
                  "CURRENT",

                tenantId:
                  position.tenantId,

                tenantName:
                  position.tenantName,

                tenantMobile:
                  position.tenantMobile,

                tenantStatus:
                  position.tenantStatus,

                rentCycleDay:
                  position.rentCycleDay,

                monthlyRent:
                  Number(
                    position.monthlyRent ??
                      0
                  ),

                roomId:
                  position.roomId,

                roomNumber:
                  position.roomNumber,

                floor:
                  position.floor,

                currentBillId:
                  position.currentBillId,

                billingPeriodStart:
                  position
                    .billingPeriodStart,

                billingPeriodEnd:
                  position
                    .billingPeriodEnd,

                dueDate:
                  position.dueDate,

                amountDue:
                  Number(
                    position
                      .currentAmountDue ??
                      0
                  ),

                amountPaid:
                  Number(
                    position
                      .currentAmountPaid ??
                      0
                  ),

                balanceAmount:
                  currentBalance,

                previousOutstanding,

                totalOutstanding,

                hasPreviousOutstanding:
                  Boolean(
                    position
                      .hasPreviousOutstanding
                  ) ||
                  previousOutstanding >
                    0,

                status:
                  position
                    .currentStatus ||
                  "PENDING",
              };
            }
          )
          .sort(
            (
              first,
              second
            ) =>
              String(
                first.tenantName ||
                  ""
              ).localeCompare(
                String(
                  second.tenantName ||
                    ""
                )
              )
          );
      },
      [
        currentRentPositions,
      ]
    );


  /* ====================================================
     STATUS FILTER
  ==================================================== */

  const visibleRows =
    useMemo(
      () => {
        if (
          statusFilter ===
          "ALL"
        ) {
          return displayRows;
        }


        return displayRows.filter(
          (row) => {
            const status =
              row.status ||
              "PENDING";


            return (
              status ===
              statusFilter
            );
          }
        );
      },
      [
        displayRows,
        statusFilter,
      ]
    );


  /* ====================================================
     PAGINATION
  ==================================================== */

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        visibleRows.length /
          PAGE_SIZE
      )
    );


  const paginatedRows =
    useMemo(
      () => {
        const start =
          (
            currentPage -
            1
          ) *
          PAGE_SIZE;


        return visibleRows.slice(
          start,
          start +
            PAGE_SIZE
        );
      },
      [
        visibleRows,
        currentPage,
      ]
    );


  useEffect(
    () => {
      setCurrentPage(1);
    },
    [
      statusFilter,
    ]
  );


  useEffect(
    () => {
      if (
        currentPage >
        totalPages
      ) {
        setCurrentPage(
          totalPages
        );
      }
    },
    [
      currentPage,
      totalPages,
    ]
  );


  /* ====================================================
     PAYMENT TARGETS

     IMPORTANT:

     These are built from historical
     outstanding bills, NOT current rows.

     That allows old unpaid bills to remain
     collectible.
  ==================================================== */

  const paymentTargets =
    useMemo(
      () => {
        const billsByTenant =
          new Map();


        rentBills.forEach(
          (bill) => {
            const balance =
              Number(
                bill.balanceAmount ||
                  0
              );


            if (
              balance <= 0
            ) {
              return;
            }


            if (
              !billsByTenant.has(
                bill.tenantId
              )
            ) {
              billsByTenant.set(
                bill.tenantId,
                []
              );
            }


            billsByTenant
              .get(
                bill.tenantId
              )
              .push(
                bill
              );
          }
        );


        const targets = [];


        billsByTenant.forEach(
          (
            tenantBills,
            tenantId
          ) => {
            const sortedBills =
              [
                ...tenantBills,
              ].sort(
                (
                  first,
                  second
                ) =>
                  String(
                    first
                      .billingPeriodStart ||
                      ""
                  ).localeCompare(
                    String(
                      second
                        .billingPeriodStart ||
                        ""
                    )
                  )
              );


            /*
             * One outstanding bill.
             */
            if (
              sortedBills.length ===
              1
            ) {
              targets.push({
                ...sortedBills[0],

                type:
                  "BILL",
              });


              return;
            }


            /*
             * Multiple outstanding bills.
             */
            const first =
              sortedBills[0];


            const last =
              sortedBills[
                sortedBills.length -
                  1
              ];


            const amountDue =
              roundMoney(
                sortedBills.reduce(
                  (
                    total,
                    bill
                  ) =>
                    total +
                    Number(
                      bill.amountDue ||
                        0
                    ),
                  0
                )
              );


            const amountPaid =
              roundMoney(
                sortedBills.reduce(
                  (
                    total,
                    bill
                  ) =>
                    total +
                    Number(
                      bill.amountPaid ||
                        0
                    ),
                  0
                )
              );


            const balanceAmount =
              roundMoney(
                sortedBills.reduce(
                  (
                    total,
                    bill
                  ) =>
                    total +
                    Number(
                      bill.balanceAmount ||
                        0
                    ),
                  0
                )
              );


            const dueDates =
              sortedBills
                .map(
                  (bill) =>
                    bill.dueDate
                )
                .filter(
                  Boolean
                )
                .sort();


            targets.push({
              id:
                `group-${tenantId}`,

              type:
                "GROUP",

              tenantId,

              tenantName:
                first.tenantName,

              tenantMobile:
                first.tenantMobile,

              tenantStatus:
                first.tenantStatus,

              roomId:
                first.roomId,

              roomNumber:
                first.roomNumber,

              floor:
                first.floor,

              billingPeriodStart:
                first
                  .billingPeriodStart,

              billingPeriodEnd:
                last
                  .billingPeriodEnd,

              dueDate:
                dueDates[0] ||
                first.dueDate,

              amountDue,

              amountPaid,

              balanceAmount,

              status:
                getGroupedStatus(
                  sortedBills
                ),

              bills:
                sortedBills,
            });
          }
        );


        return targets.sort(
          (
            first,
            second
          ) =>
            String(
              first.tenantName ||
                ""
            ).localeCompare(
              String(
                second.tenantName ||
                  ""
              )
            )
        );
      },
      [
        rentBills,
      ]
    );


  /* ====================================================
     SELECTED PAYMENT TARGET
  ==================================================== */

  const selectedPaymentTarget =
    useMemo(
      () =>
        paymentTargets.find(
          (target) =>
            target.id ===
            selectedPaymentTargetId
        ) ||
        null,
      [
        paymentTargets,
        selectedPaymentTargetId,
      ]
    );


  /*
   * Current tenant position is the preferred
   * source for tenant status.
   */
  const selectedTenantPosition =
    useMemo(
      () => {
        if (
          !selectedPaymentTarget
        ) {
          return null;
        }


        return (
          currentRentPositions.find(
            (position) =>
              position.tenantId ===
              selectedPaymentTarget
                .tenantId
          ) ||
          null
        );
      },
      [
        currentRentPositions,
        selectedPaymentTarget,
      ]
    );


  const selectedTenantStatus =
    selectedTenantPosition
      ?.tenantStatus ||
    selectedPaymentTarget
      ?.tenantStatus ||
    "";


  const tenantAlreadyInNotice =
    selectedTenantStatus ===
    "NOTICE_PERIOD";


  const tenantCanStartNotice =
    selectedTenantStatus ===
    "ACTIVE";


  const isMultiBillPayment =
    selectedPaymentTarget
      ?.type ===
    "GROUP";


  const selectedAllocationBills =
    isMultiBillPayment
      ? selectedPaymentTarget
          .bills
      : [];


  const allocatedAmount =
    useMemo(
      () =>
        roundMoney(
          Object.values(
            paymentAllocations
          ).reduce(
            (
              total,
              value
            ) =>
              total +
              Number(
                value || 0
              ),
            0
          )
        ),
      [
        paymentAllocations,
      ]
    );


  const numericPaymentAmount =
    Number(
      paymentAmount || 0
    );


  const remainingAllocation =
    roundMoney(
      numericPaymentAmount -
        allocatedAmount
    );


  /* ====================================================
     PAYMENT MODAL HELPERS
  ==================================================== */

  function createDefaultAllocations(
    target
  ) {
    if (
      !target ||
      target.type !==
        "GROUP"
    ) {
      return {};
    }


    const allocations = {};


    target.bills.forEach(
      (bill) => {
        allocations[bill.id] =
          String(
            Number(
              bill.balanceAmount ||
                0
            )
          );
      }
    );


    return allocations;
  }


  function findPaymentTargetForRow(
    row
  ) {
    if (!row) {
      return null;
    }


    return (
      paymentTargets.find(
        (target) =>
          target.tenantId ===
          row.tenantId
      ) ||
      null
    );
  }


  function openPaymentModal(
    target = null
  ) {
    let resolvedTarget =
      target;


    /*
     * Main table passes a CURRENT row.
     * Resolve it to the actual outstanding
     * historical payment target.
     */
    if (
      target?.type ===
      "CURRENT"
    ) {
      resolvedTarget =
        findPaymentTargetForRow(
          target
        );
    }


    const firstTarget =
      resolvedTarget ||
      paymentTargets[0] ||
      null;


    setPaymentModalOpen(
      true
    );


    setSelectedPaymentTargetId(
      firstTarget?.id ||
        ""
    );


    setPaymentAmount(
      firstTarget
        ? String(
            Number(
              firstTarget
                .balanceAmount ||
                0
            )
          )
        : ""
    );


    setPaymentAllocations(
      createDefaultAllocations(
        firstTarget
      )
    );


    setPaymentMode(
      "UPI"
    );


    setPaymentDate(
      getTodayInputDate()
    );


    setPaymentReference(
      ""
    );


    setMarkNoticePeriod(
      false
    );


    setPaymentError(
      ""
    );
  }


  function closePaymentModal() {
    if (
      paymentSubmitting
    ) {
      return;
    }


    setPaymentModalOpen(
      false
    );


    setSelectedPaymentTargetId(
      ""
    );


    setPaymentAmount(
      ""
    );


    setPaymentAllocations(
      {}
    );


    setPaymentMode(
      "UPI"
    );


    setPaymentDate(
      getTodayInputDate()
    );


    setPaymentReference(
      ""
    );


    setMarkNoticePeriod(
      false
    );


    setPaymentError(
      ""
    );
  }


  function handleSelectedPaymentTargetChange(
    event
  ) {
    const targetId =
      event.target.value;


    const target =
      paymentTargets.find(
        (item) =>
          item.id ===
          targetId
      ) ||
      null;


    setSelectedPaymentTargetId(
      targetId
    );


    setPaymentAmount(
      target
        ? String(
            Number(
              target
                .balanceAmount ||
                0
            )
          )
        : ""
    );


    setPaymentAllocations(
      createDefaultAllocations(
        target
      )
    );


    /*
     * Important:
     * Never carry notice selection to
     * another tenant.
     */
    setMarkNoticePeriod(
      false
    );


    setPaymentError(
      ""
    );
  }


  function handleAllocationChange(
    billId,
    value
  ) {
    setPaymentAllocations(
      (current) => ({
        ...current,

        [billId]:
          value,
      })
    );


    setPaymentError(
      ""
    );
  }


  /* ====================================================
     RECORD PAYMENT
  ==================================================== */

  async function handleRecordPayment(
    event
  ) {
    event.preventDefault();


    if (
      !selectedPaymentTarget
    ) {
      setPaymentError(
        "Select a rent bill."
      );


      return;
    }


    const amount =
      roundMoney(
        paymentAmount
      );


    const totalBalance =
      Number(
        selectedPaymentTarget
          .balanceAmount ||
          0
      );


    if (
      !Number.isFinite(
        amount
      ) ||
      amount <= 0
    ) {
      setPaymentError(
        "Enter a valid payment amount."
      );


      return;
    }


    if (
      amount >
      totalBalance
    ) {
      setPaymentError(
        `Payment cannot exceed ${formatCurrency(
          totalBalance
        )}.`
      );


      return;
    }


    if (
      !paymentDate
    ) {
      setPaymentError(
        "Select payment date."
      );


      return;
    }


    /*
     * Frontend protection.
     * Backend still remains authoritative.
     */
    if (
      markNoticePeriod &&
      !tenantCanStartNotice
    ) {
      setPaymentError(
        tenantAlreadyInNotice
          ? "Tenant is already in notice period."
          : "Only an active tenant can be marked as notice period."
      );


      return;
    }


    try {
      setPaymentSubmitting(
        true
      );


      setPaymentError(
        ""
      );


      /* ================================================
         SINGLE BILL PAYMENT
      ================================================ */

      if (
        !isMultiBillPayment
      ) {
        await apiRequest(
          "/api/payments",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                tenantId:
                  selectedPaymentTarget
                    .tenantId,

                rentBillId:
                  selectedPaymentTarget
                    .id,

                amount,

                mode:
                  paymentMode,

                paymentDate,

                notes:
                  paymentReference
                    .trim() ||
                  null,

                markNoticePeriod:
                  markNoticePeriod ===
                  true,
              }),
          }
        );


        setBillPaymentsCache(
          (current) => {
            const next = {
              ...current,
            };


            delete next[
              selectedPaymentTarget
                .id
            ];


            return next;
          }
        );
      }

      /* ================================================
         MULTI BILL PAYMENT
      ================================================ */

      else {
        const allocations =
          [];


        for (
          const bill of
          selectedAllocationBills
        ) {
          const allocationAmount =
            roundMoney(
              paymentAllocations[
                bill.id
              ] ||
                0
            );


          if (
            allocationAmount <
            0
          ) {
            throw new Error(
              "Allocation cannot be negative."
            );
          }


          const billBalance =
            Number(
              bill.balanceAmount ||
                0
            );


          if (
            allocationAmount >
            billBalance
          ) {
            throw new Error(
              `Allocation for ${formatCycleDate(
                bill.billingPeriodStart
              )} – ${formatCycleDate(
                bill.billingPeriodEnd
              )} cannot exceed ${formatCurrency(
                billBalance
              )}.`
            );
          }


          if (
            allocationAmount >
            0
          ) {
            allocations.push({
              rentBillId:
                bill.id,

              amount:
                allocationAmount,
            });
          }
        }


        if (
          allocations.length ===
          0
        ) {
          throw new Error(
            "Allocate the payment to at least one bill."
          );
        }


        const allocationTotal =
          roundMoney(
            allocations.reduce(
              (
                total,
                allocation
              ) =>
                total +
                allocation.amount,
              0
            )
          );


        if (
          allocationTotal !==
          amount
        ) {
          throw new Error(
            `Allocated amount must equal payment amount. Remaining: ${formatCurrency(
              amount -
                allocationTotal
            )}.`
          );
        }


        await apiRequest(
          "/api/payments",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                tenantId:
                  selectedPaymentTarget
                    .tenantId,

                amount,

                allocations,

                mode:
                  paymentMode,

                paymentDate,

                notes:
                  paymentReference
                    .trim() ||
                  null,

                markNoticePeriod:
                  markNoticePeriod ===
                  true,
              }),
          }
        );


        setBillPaymentsCache(
          (current) => {
            const next = {
              ...current,
            };


            allocations.forEach(
              (allocation) => {
                delete next[
                  allocation
                    .rentBillId
                ];
              }
            );


            return next;
          }
        );
      }


      /*
       * Reload historical bills AND current
       * positions after payment.
       *
       * This also refreshes tenantStatus when
       * notice period was started.
       */
      await loadRentBills();


      setPaymentModalOpen(
        false
      );


      setSelectedPaymentTargetId(
        ""
      );


      setPaymentAmount(
        ""
      );


      setPaymentAllocations(
        {}
      );


      setPaymentMode(
        "UPI"
      );


      setPaymentDate(
        getTodayInputDate()
      );


      setPaymentReference(
        ""
      );


      setMarkNoticePeriod(
        false
      );


      setPaymentError(
        ""
      );
    } catch (err) {
      console.error(
        "Record payment error:",
        err
      );


      setPaymentError(
        err?.data?.message ||
          err?.message ||
          "Unable to record payment."
      );
    } finally {
      setPaymentSubmitting(
        false
      );
    }
  }


  /* ====================================================
     BILL DETAILS
  ==================================================== */

  async function openBillDetails(
    bill
  ) {
    if (!bill) {
      return;
    }


    setSelectedViewBill(
      bill
    );


    setBillDetailsError(
      ""
    );


    setBillDetailsModalOpen(
      true
    );


    if (
      billPaymentsCache[
        bill.id
      ]
    ) {
      setBillPayments(
        billPaymentsCache[
          bill.id
        ]
      );


      setBillDetailsLoading(
        false
      );


      return;
    }


    setBillPayments(
      []
    );


    try {
      setBillDetailsLoading(
        true
      );


      const response =
        await apiRequest(
          `/api/tenants/${bill.tenantId}`
        );


      const tenant =
        response?.data ??
        response;


      const payments =
        Array.isArray(
          tenant?.payments
        )
          ? tenant.payments
          : [];


      const matchingPayments =
        payments
          .filter(
            (payment) =>
              payment.rentBillId ===
              bill.id
          )
          .sort(
            (
              first,
              second
            ) =>
              String(
                second.paymentDate
              ).localeCompare(
                String(
                  first.paymentDate
                )
              )
          );


      setBillPaymentsCache(
        (current) => ({
          ...current,

          [bill.id]:
            matchingPayments,
        })
      );


      setBillPayments(
        matchingPayments
      );
    } catch (err) {
      console.error(
        "Load bill details error:",
        err
      );


      setBillDetailsError(
        err?.data?.message ||
          err?.message ||
          "Unable to load payment history."
      );
    } finally {
      setBillDetailsLoading(
        false
      );
    }
  }


  function closeBillDetails() {
    setBillDetailsModalOpen(
      false
    );


    setSelectedViewBill(
      null
    );


    setBillPayments(
      []
    );


    setBillDetailsError(
      ""
    );
  }


  /* ====================================================
     PAGE
  ==================================================== */

  return (
    <div className="rent-fixed-page">

      {/* HEADER */}

      <div className="rent-fixed-header">

        <div>

          <h1>
            Rent &amp; Payments
          </h1>

          <p>
            Current rent-cycle financial
            position for each tenant.
          </p>

        </div>


        <button
          type="button"
          className="rent-primary-button"
          onClick={() =>
            openPaymentModal()
          }
          disabled={
            paymentTargets.length ===
            0
          }
        >
          + Record payment
        </button>

      </div>


      {/* ERROR */}

      {error ? (
        <div className="rent-fixed-error">

          <div>

            <AlertTriangle
              size={17}
            />

            <span>
              {error}
            </span>

          </div>


          <button
            type="button"
            onClick={() =>
              setError("")
            }
            aria-label="Close error"
          >
            <X
              size={16}
            />
          </button>

        </div>
      ) : null}


      {/* SUMMARY */}

      <div className="rent-fixed-summary-grid">

        <div className="rent-fixed-summary-card">

          <span>
            COLLECTED THIS MONTH
          </span>

          <strong>
            {loading
              ? "—"
              : formatCompactCurrency(
                  summary.collectedThisMonth
                )}
          </strong>

        </div>


        <div className="rent-fixed-summary-card">

          <span>
            LIFETIME COLLECTED
          </span>

          <strong>
            {loading
              ? "—"
              : formatCompactCurrency(
                  summary.lifetimeCollected
                )}
          </strong>

        </div>


        <div className="rent-fixed-summary-card">

          <span>
            PENDING
          </span>

          <strong>
            {loading
              ? "—"
              : formatCompactCurrency(
                  summary.pending
                )}
          </strong>

        </div>


        <div className="rent-fixed-summary-card rent-fixed-overdue-card">

          <span>
            OVERDUE
          </span>

          <strong>
            {loading
              ? "—"
              : formatCompactCurrency(
                  summary.overdue
                )}
          </strong>

        </div>

      </div>


      {/* TABLE */}

      <section className="rent-fixed-table-card">

        <div className="rent-fixed-table-header">

          <h2>
            Current rent cycles
          </h2>


          <select
            value={
              statusFilter
            }
            onChange={(
              event
            ) =>
              setStatusFilter(
                event.target.value
              )
            }
          >

            <option value="ALL">
              All statuses
            </option>

            <option value="PENDING">
              Pending
            </option>

            <option value="PARTIAL">
              Partial
            </option>

            <option value="OVERDUE">
              Overdue
            </option>

            <option value="PAID">
              Paid
            </option>

          </select>

        </div>


        <div className="rent-fixed-table-scroll">

          <table className="rent-fixed-table">

            <thead>

              <tr>

                <th>
                  TENANT
                </th>

                <th>
                  Phone No
                </th>

                <th>
                  DUE DATE
                </th>

                <th>
                  RENT
                </th>

                <th>
                  PAID
                </th>

                <th>
                  BALANCE
                </th>

                <th>
                  STATUS
                </th>

                <th
                  aria-label="Actions"
                />

              </tr>

            </thead>


            <tbody>

              {loading ? (
                <tr>

                  <td
                    colSpan={8}
                    className="rent-fixed-empty-cell"
                  >

                    <div className="rent-fixed-empty">

                      <div className="rent-fixed-spinner" />

                      <strong>
                        Loading rent cycles...
                      </strong>

                    </div>

                  </td>

                </tr>
              ) : null}


              {!loading &&
              paginatedRows.length >
                0
                ? paginatedRows.map(
                    (row) => {
                      const status =
                        row.status ||
                        "PENDING";


                      const paymentTarget =
                        findPaymentTargetForRow(
                          row
                        );


                      return (
                        <tr
                          key={
                            row.id
                          }
                        >

                          {/* TENANT */}

                          <td>

                            <div className="rent-fixed-tenant">

                              <strong>
                                {row.tenantName ||
                                  "—"}
                              </strong>

                              <span>
                                Room{" "}
                                {row.roomNumber ||
                                  "—"}
                              </span>


                              {row.billingPeriodStart &&
                              row.billingPeriodEnd ? (
                                <span>

                                  {formatCycleDate(
                                    row.billingPeriodStart
                                  )}

                                  {" – "}

                                  {formatCycleDate(
                                    row.billingPeriodEnd
                                  )}

                                </span>
                              ) : null}

                            </div>

                          </td>


                          {/* PHONE */}

                          <td>

                            <span className="rent-fixed-money">

                              {row.tenantMobile
                                ? `+91 ${row.tenantMobile}`
                                : "—"}

                            </span>

                          </td>


                          {/* DUE DATE */}

                          <td>

                            <span className="rent-fixed-cycle">

                              {formatCycleDate(
                                row.dueDate
                              )}

                            </span>

                          </td>


                          {/* CURRENT RENT */}

                          <td>

                            <span className="rent-fixed-money">

                              {formatCurrency(
                                row.amountDue
                              )}

                            </span>

                          </td>


                          {/* CURRENT PAID */}

                          <td>

                            <span className="rent-fixed-money">

                              {formatCurrency(
                                row.amountPaid
                              )}

                            </span>

                          </td>


                          {/* TOTAL OUTSTANDING */}

                          <td>

                            <div className="rent-fixed-tenant">

                              <strong className="rent-fixed-money">

                                {formatCurrency(
                                  row.totalOutstanding
                                )}

                              </strong>


                              {row.hasPreviousOutstanding ? (
                                <span>

                                  Current{" "}

                                  {formatCurrency(
                                    row.balanceAmount
                                  )}

                                  {" · Previous "}

                                  {formatCurrency(
                                    row.previousOutstanding
                                  )}

                                </span>
                              ) : null}

                            </div>

                          </td>


                          {/* STATUS */}

                          <td>

                            <span
                              className={`rent-fixed-status rent-fixed-status-${status.toLowerCase()}`}
                            >
                              {getStatusLabel(
                                status
                              )}
                            </span>

                          </td>


                          {/* ACTION */}

                          <td className="rent-fixed-action-cell">

                            {paymentTarget ? (
                              <button
                                type="button"
                                className="rent-fixed-record-button"
                                onClick={() =>
                                  openPaymentModal(
                                    row
                                  )
                                }
                              >
                                Record
                              </button>
                            ) : row.currentBillId ? (
                              <button
                                type="button"
                                className="rent-fixed-view-button"
                                onClick={() => {
                                  const historicalBill =
                                    rentBills.find(
                                      (
                                        bill
                                      ) =>
                                        bill.id ===
                                        row.currentBillId
                                    );


                                  if (
                                    historicalBill
                                  ) {
                                    openBillDetails(
                                      historicalBill
                                    );
                                  }
                                }}
                              >
                                View
                              </button>
                            ) : null}

                          </td>

                        </tr>
                      );
                    }
                  )
                : null}


              {!loading &&
              visibleRows.length ===
                0 ? (
                <tr>

                  <td
                    colSpan={8}
                    className="rent-fixed-empty-cell"
                  >

                    <div className="rent-fixed-empty">

                      <strong>
                        No current rent cycles found
                      </strong>

                      <p>
                        There are no tenants
                        matching this status.
                      </p>

                    </div>

                  </td>

                </tr>
              ) : null}

            </tbody>

          </table>

        </div>


        {/* PAGINATION */}

        {!loading &&
        visibleRows.length >
          0 ? (
          <div className="rent-fixed-pagination">

            <div className="rent-fixed-pagination-info">

              Showing{" "}

              <strong>
                {(currentPage -
                  1) *
                  PAGE_SIZE +
                  1}
              </strong>

              {" – "}

              <strong>
                {Math.min(
                  currentPage *
                    PAGE_SIZE,
                  visibleRows.length
                )}
              </strong>

              {" of "}

              <strong>
                {visibleRows.length}
              </strong>

              {" tenants"}

            </div>


            <div className="rent-fixed-pagination-controls">

              <button
                type="button"
                onClick={() =>
                  setCurrentPage(
                    (page) =>
                      Math.max(
                        1,
                        page - 1
                      )
                  )
                }
                disabled={
                  currentPage ===
                  1
                }
              >
                Previous
              </button>


              <div className="rent-fixed-pagination-pages">

                {Array.from(
                  {
                    length:
                      totalPages,
                  },
                  (
                    _,
                    index
                  ) =>
                    index + 1
                ).map(
                  (page) => (
                    <button
                      key={
                        page
                      }
                      type="button"
                      className={
                        currentPage ===
                        page
                          ? "active"
                          : ""
                      }
                      onClick={() =>
                        setCurrentPage(
                          page
                        )
                      }
                    >
                      {page}
                    </button>
                  )
                )}

              </div>


              <button
                type="button"
                onClick={() =>
                  setCurrentPage(
                    (page) =>
                      Math.min(
                        totalPages,
                        page + 1
                      )
                  )
                }
                disabled={
                  currentPage ===
                  totalPages
                }
              >
                Next
              </button>

            </div>

          </div>
        ) : null}

      </section>


      {/* ==================================================
          BILL DETAILS MODAL
      ================================================== */}

      {billDetailsModalOpen &&
      selectedViewBill ? (
        <div
          className="rent-bill-details-overlay"
          onMouseDown={
            closeBillDetails
          }
        >

          <div
            className="rent-bill-details-dialog"
            onMouseDown={(
              event
            ) =>
              event.stopPropagation()
            }
          >

            <div className="rent-bill-details-header">

              <div>

                <h2>
                  Rent bill details
                </h2>

                <p>
                  Payment history for this
                  billing cycle.
                </p>

              </div>


              <button
                type="button"
                className="rent-bill-details-close"
                onClick={
                  closeBillDetails
                }
                aria-label="Close bill details"
              >
                <X
                  size={18}
                />
              </button>

            </div>


            <div className="rent-bill-details-body">

              <div className="rent-bill-details-tenant">

                <div>

                  <span>
                    TENANT
                  </span>

                  <strong>
                    {selectedViewBill
                      .tenantName ||
                      "—"}
                  </strong>

                  <p>
                    Room{" "}
                    {selectedViewBill
                      .roomNumber ||
                      "—"}
                  </p>

                </div>


                <span
                  className={`rent-fixed-status rent-fixed-status-${getBillStatus(
                    selectedViewBill
                  ).toLowerCase()}`}
                >
                  {getStatusLabel(
                    getBillStatus(
                      selectedViewBill
                    )
                  )}
                </span>

              </div>


              <div className="rent-bill-details-grid">

                <div>

                  <span>
                    BILLING CYCLE
                  </span>

                  <strong>

                    {formatCycleDate(
                      selectedViewBill
                        .billingPeriodStart
                    )}

                    {" – "}

                    {formatCycleDate(
                      selectedViewBill
                        .billingPeriodEnd
                    )}

                  </strong>

                </div>


                <div>

                  <span>
                    DUE DATE
                  </span>

                  <strong>
                    {formatFullDate(
                      selectedViewBill
                        .dueDate
                    )}
                  </strong>

                </div>


                <div>

                  <span>
                    RENT
                  </span>

                  <strong>
                    {formatCurrency(
                      selectedViewBill
                        .amountDue
                    )}
                  </strong>

                </div>


                <div>

                  <span>
                    PAID
                  </span>

                  <strong>
                    {formatCurrency(
                      selectedViewBill
                        .amountPaid
                    )}
                  </strong>

                </div>


                <div>

                  <span>
                    BALANCE
                  </span>

                  <strong>
                    {formatCurrency(
                      selectedViewBill
                        .balanceAmount
                    )}
                  </strong>

                </div>

              </div>


              <div className="rent-bill-payment-history">

                <div className="rent-bill-payment-history-header">

                  <h3>
                    Payment history
                  </h3>


                  {!billDetailsLoading ? (
                    <span>

                      {billPayments.length}{" "}

                      {billPayments.length ===
                      1
                        ? "payment"
                        : "payments"}

                    </span>
                  ) : null}

                </div>


                {billDetailsError ? (
                  <div className="rent-bill-details-error">

                    <AlertTriangle
                      size={16}
                    />

                    <span>
                      {billDetailsError}
                    </span>

                  </div>
                ) : null}


                {billDetailsLoading ? (
                  <div className="rent-bill-details-loading">

                    <div className="rent-fixed-spinner" />

                    <span>
                      Loading payments...
                    </span>

                  </div>
                ) : null}


                {!billDetailsLoading &&
                billPayments.length >
                  0 ? (
                  <div className="rent-bill-payment-table-wrap">

                    <table className="rent-bill-payment-table">

                      <thead>

                        <tr>

                          <th>
                            MONTH
                          </th>

                          <th>
                            DATE
                          </th>

                          <th>
                            MODE
                          </th>

                          <th>
                            AMOUNT
                          </th>

                        </tr>

                      </thead>


                      <tbody>

                        {billPayments.map(
                          (payment) => (
                            <tr
                              key={
                                payment.id
                              }
                            >

                              <td>

                                {parseDateOnly(
                                  selectedViewBill
                                    .billingPeriodStart
                                )
                                  ? new Intl.DateTimeFormat(
                                      "en-IN",
                                      {
                                        month:
                                          "long",

                                        year:
                                          "numeric",
                                      }
                                    ).format(
                                      parseDateOnly(
                                        selectedViewBill
                                          .billingPeriodStart
                                      )
                                    )
                                  : "—"}

                              </td>


                              <td>

                                {formatFullDate(
                                  payment.paymentDate
                                )}

                              </td>


                              <td>

                                {formatPaymentMode(
                                  payment.mode
                                )}

                              </td>


                              <td>

                                <strong>

                                  {formatCurrency(
                                    payment.amount
                                  )}

                                </strong>

                              </td>

                            </tr>
                          )
                        )}

                      </tbody>

                    </table>

                  </div>
                ) : null}


                {!billDetailsLoading &&
                !billDetailsError &&
                billPayments.length ===
                  0 ? (
                  <div className="rent-bill-payment-empty">

                    <strong>
                      No payment records
                    </strong>

                    <p>
                      No payments were found
                      for this rent bill.
                    </p>

                  </div>
                ) : null}

              </div>

            </div>


            <div className="rent-bill-details-footer">

              <button
                type="button"
                onClick={
                  closeBillDetails
                }
              >
                Close
              </button>

            </div>

          </div>

        </div>
      ) : null}


      {/* ==================================================
          RECORD PAYMENT MODAL
      ================================================== */}

      {paymentModalOpen ? (
        <div
          className="rent-payment-overlay"
          onMouseDown={
            closePaymentModal
          }
        >

          <div
            className="rent-payment-dialog"
            onMouseDown={(
              event
            ) =>
              event.stopPropagation()
            }
          >

            <div className="rent-payment-dialog-header">

              <h2>
                Record payment
              </h2>


              <button
                type="button"
                className="rent-payment-dialog-close"
                onClick={
                  closePaymentModal
                }
                disabled={
                  paymentSubmitting
                }
                aria-label="Close payment form"
              >
                <X
                  size={18}
                />
              </button>

            </div>


            <form
              onSubmit={
                handleRecordPayment
              }
            >

              <div className="rent-payment-dialog-body">

                {paymentError ? (
                  <div className="rent-payment-form-error">

                    <AlertTriangle
                      size={16}
                    />

                    <span>
                      {paymentError}
                    </span>

                  </div>
                ) : null}


                {/* RENT BILL / GROUP */}

                <div className="rent-payment-field rent-payment-field-full">

                  <label
                    htmlFor="rentBill"
                  >
                    RENT BILL
                  </label>


                  <select
                    id="rentBill"
                    value={
                      selectedPaymentTargetId
                    }
                    onChange={
                      handleSelectedPaymentTargetChange
                    }
                    disabled={
                      paymentSubmitting
                    }
                    required
                  >

                    {paymentTargets.map(
                      (target) => (
                        <option
                          key={
                            target.id
                          }
                          value={
                            target.id
                          }
                        >

                          {target.tenantName}

                          {" · "}

                          {target.type ===
                          "GROUP"
                            ? `${target.bills.length} outstanding bills`
                            : `${formatCycleDate(
                                target.billingPeriodStart
                              )} – ${formatCycleDate(
                                target.billingPeriodEnd
                              )}`}

                          {" · "}

                          {formatCurrency(
                            target.balanceAmount
                          )}

                          {" balance"}

                        </option>
                      )
                    )}

                  </select>

                </div>


                {/* AMOUNT + MODE */}

                <div className="rent-payment-form-grid">

                  <div className="rent-payment-field">

                    <label
                      htmlFor="paymentAmount"
                    >
                      {isMultiBillPayment
                        ? "TOTAL AMOUNT"
                        : "AMOUNT"}
                    </label>


                    <input
                      id="paymentAmount"
                      type="number"
                      min="0.01"
                      step="0.01"
                      max={
                        selectedPaymentTarget
                          ? Number(
                              selectedPaymentTarget
                                .balanceAmount ||
                                0
                            )
                          : undefined
                      }
                      value={
                        paymentAmount
                      }
                      onChange={(
                        event
                      ) => {
                        setPaymentAmount(
                          event.target.value
                        );

                        setPaymentError(
                          ""
                        );
                      }}
                      disabled={
                        paymentSubmitting
                      }
                      required
                    />

                  </div>


                  <div className="rent-payment-field">

                    <label
                      htmlFor="paymentMode"
                    >
                      MODE
                    </label>


                    <select
                      id="paymentMode"
                      value={
                        paymentMode
                      }
                      onChange={(
                        event
                      ) =>
                        setPaymentMode(
                          event.target.value
                        )
                      }
                      disabled={
                        paymentSubmitting
                      }
                    >

                      <option value="UPI">
                        UPI
                      </option>

                      <option value="CASH">
                        Cash
                      </option>

                      <option value="BANK_TRANSFER">
                        Bank transfer
                      </option>

                      <option value="OTHER">
                        Other
                      </option>

                    </select>

                  </div>

                </div>


                {/* PAYMENT DATE + NOTE */}

                <div className="rent-payment-form-grid">

                  <div className="rent-payment-field">

                    <label
                      htmlFor="paymentDate"
                    >
                      PAYMENT DATE
                    </label>


                    <input
                      id="paymentDate"
                      type="date"
                      value={
                        paymentDate
                      }
                      onChange={(
                        event
                      ) => {
                        setPaymentDate(
                          event.target.value
                        );

                        setPaymentError(
                          ""
                        );
                      }}
                      disabled={
                        paymentSubmitting
                      }
                      required
                    />

                  </div>


                  <div className="rent-payment-field">

                    <label
                      htmlFor="paymentReference"
                    >
                      REFERENCE / NOTE
                    </label>


                    <input
                      id="paymentReference"
                      type="text"
                      placeholder="Optional"
                      maxLength={500}
                      value={
                        paymentReference
                      }
                      onChange={(
                        event
                      ) =>
                        setPaymentReference(
                          event.target.value
                        )
                      }
                      disabled={
                        paymentSubmitting
                      }
                    />

                  </div>

                </div>


                {/* MULTI-BILL ALLOCATION */}

                {isMultiBillPayment ? (
                  <div className="rent-payment-field rent-payment-field-full">

                    <label>
                      ADJUST PAYMENT
                    </label>


                    <div
                      style={{
                        display:
                          "grid",

                        gap:
                          "10px",
                      }}
                    >

                      {selectedAllocationBills.map(
                        (bill) => (
                          <div
                            key={
                              bill.id
                            }
                            style={{
                              display:
                                "grid",

                              gridTemplateColumns:
                                "1fr minmax(120px, 160px)",

                              gap:
                                "12px",

                              alignItems:
                                "center",

                              padding:
                                "10px 0",

                              borderBottom:
                                "1px solid rgba(148, 163, 184, 0.18)",
                            }}
                          >

                            <div>

                              <strong>

                                {formatCycleDate(
                                  bill.billingPeriodStart
                                )}

                                {" – "}

                                {formatCycleDate(
                                  bill.billingPeriodEnd
                                )}

                              </strong>


                              <div
                                style={{
                                  marginTop:
                                    "3px",

                                  fontSize:
                                    "12px",

                                  opacity:
                                    0.7,
                                }}
                              >

                                Outstanding{" "}

                                {formatCurrency(
                                  bill.balanceAmount
                                )}

                              </div>

                            </div>


                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              max={
                                Number(
                                  bill.balanceAmount ||
                                    0
                                )
                              }
                              value={
                                paymentAllocations[
                                  bill.id
                                ] ??
                                ""
                              }
                              onChange={(
                                event
                              ) =>
                                handleAllocationChange(
                                  bill.id,
                                  event.target.value
                                )
                              }
                              disabled={
                                paymentSubmitting
                              }
                            />

                          </div>
                        )
                      )}


                      <div
                        style={{
                          display:
                            "grid",

                          gridTemplateColumns:
                            "1fr auto",

                          rowGap:
                            "4px",

                          marginTop:
                            "4px",

                          fontSize:
                            "13px",
                        }}
                      >

                        <span>
                          Payment amount
                        </span>

                        <strong>

                          {formatCurrency(
                            numericPaymentAmount
                          )}

                        </strong>


                        <span>
                          Allocated
                        </span>

                        <strong>

                          {formatCurrency(
                            allocatedAmount
                          )}

                        </strong>


                        <span>
                          Remaining
                        </span>

                        <strong>

                          {formatCurrency(
                            remainingAllocation
                          )}

                        </strong>

                      </div>

                    </div>

                  </div>
                ) : null}


                {/* ======================================
                    NOTICE PERIOD
                ====================================== */}

                {selectedPaymentTarget ? (
                  <div
                    className="rent-payment-field rent-payment-field-full"
                    style={{
                      marginTop:
                        "2px",
                    }}
                  >

                    {tenantCanStartNotice ? (
                      <label
                        htmlFor="markNoticePeriod"
                        style={{
                          display:
                            "flex",

                          alignItems:
                            "flex-start",

                          gap:
                            "10px",

                          cursor:
                            paymentSubmitting
                              ? "default"
                              : "pointer",

                          textTransform:
                            "none",

                          letterSpacing:
                            "normal",
                        }}
                      >

                        <input
                          id="markNoticePeriod"
                          type="checkbox"
                          checked={
                            markNoticePeriod
                          }
                          onChange={(
                            event
                          ) => {
                            setMarkNoticePeriod(
                              event.target.checked
                            );

                            setPaymentError(
                              ""
                            );
                          }}
                          disabled={
                            paymentSubmitting
                          }
                          style={{
                            width:
                              "16px",

                            height:
                              "16px",

                            marginTop:
                              "2px",

                            flexShrink:
                              0,
                          }}
                        />


                        <span>

                          <strong
                            style={{
                              display:
                                "block",
                            }}
                          >
                            Mark tenant as Notice Period
                          </strong>


                          <span
                            style={{
                              display:
                                "block",

                              marginTop:
                                "3px",

                              fontSize:
                                "12px",

                              fontWeight:
                                400,

                              opacity:
                                0.72,

                              lineHeight:
                                1.5,
                            }}
                          >

                            Payment date{" "}

                            {paymentDate
                              ? `(${formatFullDate(
                                  paymentDate
                                )})`
                              : ""}{" "}

                            will be used as the
                            notice-given date.
                            Planned vacating date
                            will be calculated
                            automatically from the
                            tenant&apos;s rent cycle.

                          </span>

                        </span>

                      </label>
                    ) : tenantAlreadyInNotice ? (
                      <div
                        style={{
                          padding:
                            "11px 12px",

                          border:
                            "1px solid rgba(148, 163, 184, 0.22)",

                          borderRadius:
                            "8px",
                        }}
                      >

                        <strong
                          style={{
                            display:
                              "block",

                            fontSize:
                              "13px",
                          }}
                        >
                          Tenant is already in Notice Period
                        </strong>


                        <span
                          style={{
                            display:
                              "block",

                            marginTop:
                              "3px",

                            fontSize:
                              "12px",

                            opacity:
                              0.72,

                            lineHeight:
                              1.5,
                          }}
                        >
                          This payment will be
                          recorded normally and
                          will not start a new
                          notice period.
                        </span>

                      </div>
                    ) : null}

                  </div>
                ) : null}


                <p className="rent-payment-helper">

                  {isMultiBillPayment
                    ? "This tenant has multiple outstanding bills. Adjust how the payment should be distributed between them."
                    : "The backend prevents overpayment and updates the rent bill transactionally."}

                </p>

              </div>


              <div className="rent-payment-dialog-footer">

                <button
                  type="button"
                  className="rent-payment-cancel-button"
                  onClick={
                    closePaymentModal
                  }
                  disabled={
                    paymentSubmitting
                  }
                >
                  Cancel
                </button>


                <button
                  type="submit"
                  className="rent-payment-submit-button"
                  disabled={
                    paymentSubmitting ||
                    !selectedPaymentTarget
                  }
                >

                  {paymentSubmitting
                    ? "Recording..."
                    : markNoticePeriod
                    ? "Record payment & start notice"
                    : "Record payment"}

                </button>

              </div>

            </form>

          </div>

        </div>
      ) : null}

    </div>
  );
}