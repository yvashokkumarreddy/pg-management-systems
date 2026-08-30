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

import { apiRequest } from "@/lib/api/client";


/* ======================================================
   HELPERS
====================================================== */

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
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


function formatCycleDate(value) {
  if (!value) {
    return "—";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
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
  if (!value) {
    return "—";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
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
  const now =
    new Date();

  const offset =
    now.getTimezoneOffset() *
    60000;

  return new Date(
    now.getTime() - offset
  )
    .toISOString()
    .slice(0, 10);
}


function isBillOverdue(bill) {
  const balance =
    Number(
      bill.balanceAmount || 0
    );

  if (balance <= 0) {
    return false;
  }

  if (!bill.dueDate) {
    return false;
  }

  const dueDate =
    new Date(
      bill.dueDate
    );

  const today =
    new Date();

  dueDate.setHours(
    0,
    0,
    0,
    0
  );

  today.setHours(
    0,
    0,
    0,
    0
  );

  return dueDate < today;
}


function getBillStatus(bill) {
  const amountPaid =
    Number(
      bill.amountPaid || 0
    );

  const balance =
    Number(
      bill.balanceAmount || 0
    );

  if (
    bill.status === "PAID" ||
    balance <= 0
  ) {
    return "PAID";
  }

  if (
    bill.status === "OVERDUE" ||
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

  const [
    rentBills,
    setRentBills,
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
    selectedBillId,
    setSelectedBillId,
  ] = useState("");

  const [
    paymentAmount,
    setPaymentAmount,
  ] = useState("");

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

  const [
    paymentSubmitting,
    setPaymentSubmitting,
  ] = useState(false);

  const [
    paymentError,
    setPaymentError,
  ] = useState("");


  /* ====================================================
     BILL DETAILS MODAL
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
     LOAD BILLS + COLLECTION SUMMARY
  ==================================================== */

  const loadRentBills =
    useCallback(async () => {
      try {
        setLoading(true);
        setError("");

        const response =
          await apiRequest(
            "/api/rent-bills"
          );

        const payload =
          response?.data ??
          response;

        /*
         * New API response:
         *
         * {
         *   bills: [...],
         *   summary: {
         *     collectedThisMonth,
         *     lifetimeCollected
         *   }
         * }
         */

        const bills =
          Array.isArray(
            payload?.bills
          )
            ? payload.bills
            : Array.isArray(
                payload
              )
            ? payload
            : [];

        const backendSummary =
          payload?.summary ??
          {};

        setRentBills(
          bills
        );

        setCollectionSummary({
          collectedThisMonth:
            Number(
              backendSummary
                ?.collectedThisMonth ??
                0
            ),

          lifetimeCollected:
            Number(
              backendSummary
                ?.lifetimeCollected ??
                0
            ),
        });
      } catch (err) {
        console.error(
          "Load rent bills error:",
          err
        );

        setError(
          err?.data?.message ||
            err?.message ||
            "Unable to load rent bills."
        );

        setRentBills([]);

        setCollectionSummary({
          collectedThisMonth: 0,
          lifetimeCollected: 0,
        });
      } finally {
        setLoading(false);
      }
    }, []);


  useEffect(() => {
    loadRentBills();
  }, [
    loadRentBills,
  ]);


  /* ====================================================
     SUMMARY
  ==================================================== */

  const summary =
    useMemo(() => {
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


      /*
       * Pending and overdue are bill-based.
       *
       * Collected amounts are payment-based
       * and come from the backend.
       */

      rentBills.forEach(
        (bill) => {
          const balance =
            Number(
              bill.balanceAmount ||
                0
            );

          if (balance <= 0) {
            return;
          }

          const status =
            getBillStatus(
              bill
            );

          if (
            status ===
            "OVERDUE"
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
    }, [
      rentBills,
      collectionSummary,
    ]);


  /* ====================================================
     FILTERED BILLS
  ==================================================== */

  const visibleBills =
    useMemo(() => {
      if (
        statusFilter === "ALL"
      ) {
        return rentBills;
      }

      return rentBills.filter(
        (bill) =>
          getBillStatus(
            bill
          ) === statusFilter
      );
    }, [
      rentBills,
      statusFilter,
    ]);


  /* ====================================================
     PAGINATION
  ==================================================== */

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        visibleBills.length /
          PAGE_SIZE
      )
    );


  const paginatedBills =
    useMemo(() => {
      const start =
        (currentPage - 1) *
        PAGE_SIZE;

      const end =
        start +
        PAGE_SIZE;

      return visibleBills.slice(
        start,
        end
      );
    }, [
      visibleBills,
      currentPage,
    ]);


  useEffect(() => {
    setCurrentPage(1);
  }, [
    statusFilter,
  ]);


  useEffect(() => {
    if (
      currentPage >
      totalPages
    ) {
      setCurrentPage(
        totalPages
      );
    }
  }, [
    currentPage,
    totalPages,
  ]);


  /* ====================================================
     UNPAID BILLS
  ==================================================== */

  const unpaidBills =
    useMemo(
      () =>
        rentBills.filter(
          (bill) =>
            Number(
              bill.balanceAmount ||
                0
            ) > 0
        ),
      [
        rentBills,
      ]
    );


  const selectedBill =
    useMemo(() => {
      return (
        unpaidBills.find(
          (bill) =>
            bill.id ===
            selectedBillId
        ) || null
      );
    }, [
      unpaidBills,
      selectedBillId,
    ]);


  /* ====================================================
     PAYMENT MODAL OPEN
  ==================================================== */

  function openPaymentModal(
    bill = null
  ) {
    const firstBill =
      bill ||
      unpaidBills[0] ||
      null;

    setPaymentModalOpen(
      true
    );

    setSelectedBillId(
      firstBill?.id || ""
    );

    setPaymentAmount(
      firstBill
        ? String(
            Number(
              firstBill.balanceAmount ||
                0
            )
          )
        : ""
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

    setPaymentError("");
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

    setSelectedBillId(
      ""
    );

    setPaymentAmount(
      ""
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

    setPaymentError("");
  }


  /* ====================================================
     CHANGE SELECTED BILL
  ==================================================== */

  function handleSelectedBillChange(
    event
  ) {
    const billId =
      event.target.value;

    setSelectedBillId(
      billId
    );

    const bill =
      unpaidBills.find(
        (item) =>
          item.id === billId
      );

    setPaymentAmount(
      bill
        ? String(
            Number(
              bill.balanceAmount ||
                0
            )
          )
        : ""
    );

    setPaymentError("");
  }


  /* ====================================================
     RECORD PAYMENT
  ==================================================== */

  async function handleRecordPayment(
    event
  ) {
    event.preventDefault();

    if (!selectedBill) {
      setPaymentError(
        "Select a rent bill."
      );

      return;
    }

    const amount =
      Number(
        paymentAmount
      );

    const balance =
      Number(
        selectedBill.balanceAmount ||
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
      amount > balance
    ) {
      setPaymentError(
        `Payment cannot exceed ${formatCurrency(
          balance
        )}.`
      );

      return;
    }

    if (!paymentDate) {
      setPaymentError(
        "Select payment date."
      );

      return;
    }

    try {
      setPaymentSubmitting(
        true
      );

      setPaymentError("");

      await apiRequest(
        "/api/payments",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            tenantId:
              selectedBill.tenantId,

            rentBillId:
              selectedBill.id,

            amount,

            mode:
              paymentMode,

            paymentDate,
          }),
        }
      );


      /* ==================================================
         CLEAR CACHED PAYMENT HISTORY FOR THIS BILL
      ================================================== */

      setBillPaymentsCache(
        (current) => {
          const next = {
            ...current,
          };

          delete next[
            selectedBill.id
          ];

          return next;
        }
      );


      /* ==================================================
         RELOAD BILLS + PAYMENT-BASED SUMMARY
      ================================================== */

      await loadRentBills();


      /* ==================================================
         CLOSE + RESET PAYMENT MODAL
      ================================================== */

      setPaymentModalOpen(
        false
      );

      setSelectedBillId(
        ""
      );

      setPaymentAmount(
        ""
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

      setPaymentError("");

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
     OPEN BILL DETAILS
  ==================================================== */

  async function openBillDetails(
    bill
  ) {
    setSelectedViewBill(
      bill
    );

    setBillDetailsError("");

    setBillDetailsModalOpen(
      true
    );


    /* ================================================
       USE CACHED PAYMENTS
    ================================================ */

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


    /* ================================================
       LOAD PAYMENTS FIRST TIME ONLY
    ================================================ */

    setBillPayments([]);

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
            (a, b) =>
              new Date(
                b.paymentDate
              ).getTime() -
              new Date(
                a.paymentDate
              ).getTime()
          );


      /* SAVE FOR FUTURE VIEW CLICKS */

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

    setBillPayments([]);

    setBillDetailsError("");
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
            Bill-centric financial tracking
            with multiple manual payments
            per bill.
          </p>
        </div>


        <button
          type="button"
          className="rent-primary-button"
          onClick={() =>
            openPaymentModal()
          }
          disabled={
            unpaidBills.length ===
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


      {/* SUMMARY CARDS */}

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


      {/* RENT BILLS TABLE */}

      <section className="rent-fixed-table-card">

        <div className="rent-fixed-table-header">

          <h2>
            Rent bills
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
                        Loading rent bills...
                      </strong>

                    </div>

                  </td>

                </tr>
              ) : null}


              {!loading &&
              paginatedBills.length >
                0
                ? paginatedBills.map(
                    (bill) => {
                      const status =
                        getBillStatus(
                          bill
                        );

                      const balance =
                        Number(
                          bill.balanceAmount ||
                            0
                        );

                      return (
                        <tr
                          key={
                            bill.id
                          }
                        >

                          <td>

                            <div className="rent-fixed-tenant">

                              <strong>
                                {bill.tenantName ||
                                  "—"}
                              </strong>

                              <span>
                                Room{" "}
                                {bill.roomNumber ||
                                  "—"}
                              </span>

                            </div>

                          </td>


                          <td>

                            <span className="rent-fixed-money">

                              {bill.tenantMobile
                                ? `+91 ${bill.tenantMobile}`
                                : "—"}

                            </span>

                          </td>


                          <td>

                            <span className="rent-fixed-cycle">

                              {formatCycleDate(
                                bill.billingPeriodStart
                              )}

                            </span>

                          </td>


                          <td>

                            <span className="rent-fixed-money">

                              {formatCurrency(
                                bill.amountDue
                              )}

                            </span>

                          </td>


                          <td>

                            <span className="rent-fixed-money">

                              {formatCurrency(
                                bill.amountPaid
                              )}

                            </span>

                          </td>


                          <td>

                            <span className="rent-fixed-money">

                              {formatCurrency(
                                bill.balanceAmount
                              )}

                            </span>

                          </td>


                          <td>

                            <span
                              className={`rent-fixed-status rent-fixed-status-${status.toLowerCase()}`}
                            >
                              {getStatusLabel(
                                status
                              )}
                            </span>

                          </td>


                          <td className="rent-fixed-action-cell">

                            {balance > 0 ? (
                              <button
                                type="button"
                                className="rent-fixed-record-button"
                                onClick={() =>
                                  openPaymentModal(
                                    bill
                                  )
                                }
                              >
                                Record
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="rent-fixed-view-button"
                                onClick={() =>
                                  openBillDetails(
                                    bill
                                  )
                                }
                              >
                                View
                              </button>
                            )}

                          </td>

                        </tr>
                      );
                    }
                  )
                : null}


              {!loading &&
              visibleBills.length ===
                0 ? (
                <tr>

                  <td
                    colSpan={8}
                    className="rent-fixed-empty-cell"
                  >

                    <div className="rent-fixed-empty">

                      <strong>
                        No rent bills found
                      </strong>

                      <p>
                        There are no bills
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
        visibleBills.length > 0 ? (
          <div className="rent-fixed-pagination">

            <div className="rent-fixed-pagination-info">

              Showing{" "}

              <strong>
                {(currentPage - 1) *
                  PAGE_SIZE +
                  1}
              </strong>

              {" – "}

              <strong>
                {Math.min(
                  currentPage *
                    PAGE_SIZE,
                  visibleBills.length
                )}
              </strong>

              {" of "}

              <strong>
                {visibleBills.length}
              </strong>

              {" bills"}

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
                  currentPage === 1
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
                  (_, index) =>
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


      {/* RENT BILL DETAILS MODAL */}

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
                    {selectedViewBill.tenantName ||
                      "—"}
                  </strong>

                  <p>
                    Room{" "}
                    {selectedViewBill.roomNumber ||
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
                      selectedViewBill.billingPeriodStart
                    )}

                    {" – "}

                    {formatCycleDate(
                      selectedViewBill.billingPeriodEnd
                    )}
                  </strong>

                </div>


                <div>

                  <span>
                    DUE DATE
                  </span>

                  <strong>
                    {formatFullDate(
                      selectedViewBill.dueDate
                    )}
                  </strong>

                </div>


                <div>

                  <span>
                    RENT
                  </span>

                  <strong>
                    {formatCurrency(
                      selectedViewBill.amountDue
                    )}
                  </strong>

                </div>


                <div>

                  <span>
                    PAID
                  </span>

                  <strong>
                    {formatCurrency(
                      selectedViewBill.amountPaid
                    )}
                  </strong>

                </div>


                <div>

                  <span>
                    BALANCE
                  </span>

                  <strong>
                    {formatCurrency(
                      selectedViewBill.balanceAmount
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
                billPayments.length > 0 ? (
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
                                {new Intl.DateTimeFormat(
                                  "en-IN",
                                  {
                                    month: "long",
                                    year: "numeric",
                                  }
                                ).format(
                                  new Date(
                                    selectedViewBill.billingPeriodStart
                                  )
                                )}
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


      {/* RECORD PAYMENT MODAL */}

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


                <div className="rent-payment-field rent-payment-field-full">

                  <label
                    htmlFor="rentBill"
                  >
                    RENT BILL
                  </label>


                  <select
                    id="rentBill"
                    value={
                      selectedBillId
                    }
                    onChange={
                      handleSelectedBillChange
                    }
                    disabled={
                      paymentSubmitting
                    }
                    required
                  >

                    {unpaidBills.map(
                      (bill) => (
                        <option
                          key={
                            bill.id
                          }
                          value={
                            bill.id
                          }
                        >
                          {bill.tenantName}
                          {" · "}
                          {formatCycleDate(
                            bill.billingPeriodStart
                          )}
                          {" – "}
                          {formatCycleDate(
                            bill.billingPeriodEnd
                          )}
                          {" · "}
                          {formatCurrency(
                            bill.balanceAmount
                          )}
                          {" balance"}
                        </option>
                      )
                    )}

                  </select>

                </div>


                <div className="rent-payment-form-grid">

                  <div className="rent-payment-field">

                    <label
                      htmlFor="paymentAmount"
                    >
                      AMOUNT
                    </label>


                    <input
                      id="paymentAmount"
                      type="number"
                      min="0.01"
                      step="0.01"
                      max={
                        selectedBill
                          ? Number(
                              selectedBill.balanceAmount ||
                                0
                            )
                          : undefined
                      }
                      value={
                        paymentAmount
                      }
                      onChange={(
                        event
                      ) =>
                        setPaymentAmount(
                          event.target.value
                        )
                      }
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
                      ) =>
                        setPaymentDate(
                          event.target.value
                        )
                      }
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


                <p className="rent-payment-helper">
                  The backend prevents
                  overpayment and updates
                  the rent bill
                  transactionally.
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
                    !selectedBill
                  }
                >
                  {paymentSubmitting
                    ? "Recording..."
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