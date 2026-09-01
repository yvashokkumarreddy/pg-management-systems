"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  AlertTriangle,
  ArrowLeft,
  ExternalLink,
  MoreVertical,
  Pencil,
  Plus,
  RotateCcw,
  X,
} from "lucide-react";

import {
  useParams,
  useRouter,
} from "next/navigation";

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

  if (amount >= 1000) {
    const thousands =
      amount / 1000;

    return `₹${
      Number.isInteger(
        thousands
      )
        ? thousands
        : thousands.toFixed(1)
    }K`;
  }

  return formatCurrency(
    amount
  );
}


function formatDate(value) {
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
      year: "numeric",
    }
  ).format(date);
}


function formatDateInput(value) {
  if (!value) {
    return "";
  }

  return String(value).slice(
    0,
    10
  );
}


function getInitials(name) {
  if (!name) {
    return "T";
  }

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) =>
      part
        .charAt(0)
        .toUpperCase()
    )
    .join("");
}


function getRoomNumber(
  tenant
) {
  return (
    tenant?.room?.roomNumber ||
    tenant?.roomNumber ||
    "—"
  );
}


function getStatusLabel(
  status
) {
  if (
    status ===
    "NOTICE_PERIOD"
  ) {
    return "NOTICE";
  }

  if (
    status ===
    "ARCHIVED"
  ) {
    return "ARCHIVED";
  }

  return "ACTIVE";
}


function getBillStatusLabel(
  status
) {
  if (
    status === "PARTIAL"
  ) {
    return "PARTIAL";
  }

  if (
    status === "OVERDUE"
  ) {
    return "OVERDUE";
  }

  if (
    status === "PAID"
  ) {
    return "PAID";
  }

  return "PENDING";
}


function getPaymentModeLabel(
  mode
) {
  if (
    mode ===
    "BANK_TRANSFER"
  ) {
    return "Bank transfer";
  }

  if (
    mode === "UPI"
  ) {
    return "UPI";
  }

  if (
    mode === "CASH"
  ) {
    return "Cash";
  }

  return "Other";
}


function getOutstandingAmount(
  tenant
) {
  if (
    !Array.isArray(
      tenant?.rentBills
    )
  ) {
    return 0;
  }

  return tenant.rentBills.reduce(
    (total, bill) =>
      total +
      Number(
        bill?.balanceAmount ||
          0
      ),
    0
  );
}


function normalizeDocumentsResponse(
  response
) {
  if (
    Array.isArray(
      response?.data
    )
  ) {
    return response.data;
  }

  if (
    Array.isArray(
      response?.data?.documents
    )
  ) {
    return response.data
      .documents;
  }

  return [];
}


function getDocumentUrl(
  document
) {
  return (
    document?.signedUrl ||
    document?.url ||
    document?.downloadUrl ||
    null
  );
}


function isPdfDocument(
  document
) {
  const path =
    String(
      document?.storagePath ||
        ""
    ).toLowerCase();

  return path.endsWith(
    ".pdf"
  );
}


/* ======================================================
   TENANT OVERVIEW
====================================================== */

function TenantOverview({
  tenant,
}) {
  return (
    <div>

      <div className="tenant-tab-section-heading">

        <div>

          <h3>
            Personal & occupancy details
          </h3>

          <p>
            Tenant contact, room
            assignment and rent
            information.
          </p>

        </div>

      </div>


      <div className="tenant-overview-grid">

        <div>
          <span>
            Full name
          </span>

          <strong>
            {tenant.fullName ||
              "—"}
          </strong>
        </div>


        <div>
          <span>
            Mobile
          </span>

          <strong>
            {tenant.mobile ||
              "—"}
          </strong>
        </div>


        <div>
          <span>
            Room
          </span>

          <strong>
            Room{" "}
            {getRoomNumber(
              tenant
            )}
          </strong>
        </div>


        <div>
          <span>
            Joining date
          </span>

          <strong>
            {formatDate(
              tenant.dateOfJoining
            )}
          </strong>
        </div>


        <div>
          <span>
            Monthly rent
          </span>

          <strong>
            {formatCurrency(
              tenant.monthlyRent
            )}
          </strong>
        </div>


        <div>
          <span>
            Status
          </span>

          <strong>
            {getStatusLabel(
              tenant.status
            )}
          </strong>
        </div>

      </div>

    </div>
  );
}


/* ======================================================
   TENANT EDIT FORM
====================================================== */

function TenantEditForm({
  tenant,
  rooms,
  saving,
  error,
  onCancel,
  onSave,
}) {
  const [
    fullName,
    setFullName,
  ] = useState(
    tenant.fullName || ""
  );

  const [
    mobile,
    setMobile,
  ] = useState(
    tenant.mobile || ""
  );

  const [
    roomId,
    setRoomId,
  ] = useState(
    tenant.roomId || ""
  );

  const [
    monthlyRent,
    setMonthlyRent,
  ] = useState(
    String(
      tenant.monthlyRent || ""
    )
  );

  const [
    dateOfJoining,
    setDateOfJoining,
  ] = useState(
    formatDateInput(
      tenant.dateOfJoining
    )
  );


  async function handleSubmit(
    event
  ) {
    event.preventDefault();

    await onSave({
      fullName:
        fullName.trim(),

      mobile:
        mobile.trim(),

      roomId,

      monthlyRent:
        Number(monthlyRent),

      dateOfJoining,
    });
  }


  return (
    <form
      onSubmit={
        handleSubmit
      }
    >

      <div className="tenant-tab-section-heading">

        <div>

          <h3>
            Edit tenant
          </h3>

          <p>
            Update tenant contact,
            room assignment and rent.
          </p>

        </div>

      </div>


      {error ? (
        <div className="tenant-inline-error">

          <AlertTriangle
            size={16}
          />

          {error}

        </div>
      ) : null}


      <div className="tenant-edit-grid">

        <div className="pg-field">

          <label>
            Full name
          </label>

          <input
            className="pg-input"
            value={fullName}
            onChange={(event) =>
              setFullName(
                event.target
                  .value
              )
            }
            required
          />

        </div>


        <div className="pg-field">

          <label>
            Mobile
          </label>

          <input
            className="pg-input"
            value={mobile}
            onChange={(event) =>
              setMobile(
                event.target
                  .value
              )
            }
            required
          />

        </div>


        <div className="pg-field">

          <label>
            Room
          </label>

          <select
            className="pg-input"
            value={roomId}
            onChange={(event) =>
              setRoomId(
                event.target
                  .value
              )
            }
            required
          >

            <option value="">
              Select room
            </option>


            {rooms.map(
              (room) => (
                <option
                  key={
                    room.id
                  }
                  value={
                    room.id
                  }
                >
                  Room{" "}
                  {
                    room.roomNumber
                  }
                </option>
              )
            )}

          </select>

        </div>


        <div className="pg-field">

          <label>
            Monthly rent
          </label>

          <input
            className="pg-input"
            type="number"
            min="1"
            value={
              monthlyRent
            }
            onChange={(event) =>
              setMonthlyRent(
                event.target
                  .value
              )
            }
            required
          />

        </div>


        <div className="pg-field">

          <label>
            Date of joining
          </label>

          <input
            className="pg-input"
            type="date"
            value={
              dateOfJoining
            }
            onChange={(event) =>
              setDateOfJoining(
                event.target
                  .value
              )
            }
            required
          />

        </div>

      </div>


      <div className="tenant-edit-actions">

        <button
          type="button"
          className="tenant-secondary-button"
          onClick={onCancel}
          disabled={saving}
        >
          Cancel
        </button>


        <button
          type="submit"
          className="tenant-primary-button"
          disabled={saving}
        >
          {saving
            ? "Saving..."
            : "Save changes"}
        </button>

      </div>

    </form>
  );
}


/* ======================================================
   RENT BILLS
====================================================== */

function RentBillsTab({
  tenant,
  onPaymentRecorded,
}) {
  const [
    selectedBill,
    setSelectedBill,
  ] = useState(null);


  const bills =
    useMemo(() => {

      const rentBills =
        Array.isArray(
          tenant?.rentBills
        )
          ? tenant.rentBills
          : [];


      const payments =
        Array.isArray(
          tenant?.payments
        )
          ? tenant.payments
          : [];


      return rentBills.map(
        (bill) => {

          const billPayments =
            payments.filter(
              (payment) =>
                payment
                  .rentBillId ===
                bill.id
            );


          return {
            ...bill,
            payments:
              billPayments,
          };
        }
      );

    }, [tenant]);


  return (
    <div>

      <div className="tenant-tab-section-heading">

        <div>

          <h3>
            Rent bills
          </h3>

          <p>
            Rent cycles,
            outstanding balances
            and payment history.
          </p>

        </div>

      </div>


      {bills.length === 0 ? (
        <div className="tenant-tab-empty">

          <strong>
            No rent bills found
          </strong>

          <p>
            Rent bills generated
            for this tenant will
            appear here.
          </p>

        </div>
      ) : null}


      {bills.length > 0 ? (
        <div className="tenant-bills-list">

          {bills.map(
            (bill) => {

              const payments =
                Array.isArray(
                  bill.payments
                )
                  ? bill.payments
                  : [];


              const balance =
                Number(
                  bill.balanceAmount ||
                    0
                );


              return (
                <article
                  key={
                    bill.id
                  }
                  className="tenant-bill-card"
                >

                  <div className="tenant-bill-card-header">

                    <div>

                      <strong>
                        {formatDate(
                          bill.billingPeriodStart
                        )}
                        {" – "}
                        {formatDate(
                          bill.billingPeriodEnd
                        )}
                      </strong>

                      <p>
                        Generated from
                        the tenant
                        joining-day rent
                        cycle.
                      </p>

                    </div>


                    <span
                      className={`tenant-bill-status tenant-bill-status-${String(
                        bill.status ||
                          "PENDING"
                      ).toLowerCase()}`}
                    >
                      {getBillStatusLabel(
                        bill.status
                      )}
                    </span>

                  </div>


                  <div className="tenant-bill-summary-grid">

                    <div>

                      <span>
                        Bill amount
                      </span>

                      <strong>
                        {formatCurrency(
                          bill.amountDue
                        )}
                      </strong>

                    </div>


                    <div>

                      <span>
                        Paid
                      </span>

                      <strong>
                        {formatCurrency(
                          bill.amountPaid
                        )}
                      </strong>

                    </div>


                    <div>

                      <span>
                        Balance
                      </span>

                      <strong
                        className={
                          balance >
                          0
                            ? "tenant-balance-due"
                            : ""
                        }
                      >
                        {formatCurrency(
                          balance
                        )}
                      </strong>

                    </div>


                    <div>

                      <span>
                        Status
                      </span>

                      <strong>
                        {getBillStatusLabel(
                          bill.status
                        )}
                      </strong>

                    </div>

                  </div>


                  <div className="tenant-bill-payment-area">

                    <div className="tenant-bill-payment-heading">

                      <strong>
                        Payments
                      </strong>


                      {balance >
                      0 ? (
                        <button
                          type="button"
                          className="tenant-small-primary-button"
                          onClick={() =>
                            setSelectedBill(
                              bill
                            )
                          }
                        >
                          <Plus
                            size={
                              14
                            }
                          />

                          Record
                          payment
                        </button>
                      ) : null}

                    </div>


                    {payments.length >
                    0 ? (
                      <div className="tenant-payment-list">

                        {payments.map(
                          (
                            payment,
                            index
                          ) => (
                            <div
                              key={
                                payment.id
                              }
                              className="tenant-payment-row"
                            >

                              <div>

                                <strong>
                                  Payment #
                                  {index +
                                    1}
                                </strong>

                                <span>
                                  {formatDate(
                                    payment.paymentDate
                                  )}
                                  {" · "}
                                  {getPaymentModeLabel(
                                    payment.mode
                                  )}
                                </span>

                              </div>


                              <strong>
                                {formatCurrency(
                                  payment.amount
                                )}
                              </strong>

                            </div>
                          )
                        )}

                      </div>
                    ) : (
                      <div className="tenant-no-payments">
                        No payments
                        recorded for
                        this bill.
                      </div>
                    )}

                  </div>

                </article>
              );
            }
          )}

        </div>
      ) : null}


      {selectedBill ? (
        <RecordPaymentModal
          tenantId={
            tenant.id
          }
          bill={
            selectedBill
          }
          onClose={() =>
            setSelectedBill(
              null
            )
          }
          onSaved={(
            result
          ) => {

            setSelectedBill(
              null
            );

            onPaymentRecorded(
              result
            );
          }}
        />
      ) : null}

    </div>
  );
}


/* ======================================================
   RECORD PAYMENT
====================================================== */

function RecordPaymentModal({
  tenantId,
  bill,
  onClose,
  onSaved,
}) {
  const [
    amount,
    setAmount,
  ] = useState(
    String(
      bill.balanceAmount ||
        ""
    )
  );

  const [
    paymentMode,
    setPaymentMode,
  ] = useState("UPI");

  const [
    paymentDate,
    setPaymentDate,
  ] = useState(
    new Date()
      .toISOString()
      .slice(0, 10)
  );

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");


  async function handleSubmit(
    event
  ) {
    event.preventDefault();


    try {

      setSaving(true);
      setError("");


      const response =
        await apiRequest(
          "/api/payments",
          {
            method:
              "POST",

            body:
              JSON.stringify({
                tenantId,

                rentBillId:
                  bill.id,

                amount:
                  Number(
                    amount
                  ),

                mode:
                  paymentMode,

                paymentDate,
              }),
          }
        );


      onSaved(
        response?.data
      );

    } catch (err) {

      setError(
        err?.data?.message ||
          err?.message ||
          "Unable to record payment."
      );

    } finally {

      setSaving(false);
    }
  }


  return (
    <div className="tenant-modal-backdrop">

      <div className="tenant-action-modal">

        <div className="tenant-action-modal-header">

          <div>

            <h3>
              Record payment
            </h3>

            <p>
              Balance{" "}
              {formatCurrency(
                bill.balanceAmount
              )}
            </p>

          </div>


          <button
            type="button"
            onClick={
              onClose
            }
            disabled={
              saving
            }
          >
            <X size={18} />
          </button>

        </div>


        <form
          onSubmit={
            handleSubmit
          }
        >

          <div className="tenant-action-modal-body">

            {error ? (
              <div className="tenant-inline-error">

                <AlertTriangle
                  size={16}
                />

                {error}

              </div>
            ) : null}


            <div className="tenant-action-form-grid">

              <div className="pg-field">

                <label>
                  Amount
                </label>

                <input
                  className="pg-input"
                  type="number"
                  min="1"
                  max={Number(
                    bill.balanceAmount ||
                      0
                  )}
                  value={amount}
                  onChange={(event) =>
                    setAmount(
                      event.target
                        .value
                    )
                  }
                  required
                />

              </div>


              <div className="pg-field">

                <label>
                  Payment mode
                </label>

                <select
                  className="pg-input"
                  value={
                    paymentMode
                  }
                  onChange={(event) =>
                    setPaymentMode(
                      event.target
                        .value
                    )
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


              <div className="pg-field">

                <label>
                  Payment date
                </label>

                <input
                  className="pg-input"
                  type="date"
                  value={
                    paymentDate
                  }
                  onChange={(event) =>{
                    console.log(
                      "Payment date changed:",
                      event.target.value
                    )
                    setPaymentDate(
                      event.target
                        .value
                    )
                  }
                  }
                  required
                />

              </div>

            </div>

          </div>


          <div className="tenant-action-modal-footer">

            <button
              type="button"
              className="tenant-secondary-button"
              onClick={
                onClose
              }
              disabled={
                saving
              }
            >
              Cancel
            </button>


            <button
              type="submit"
              className="tenant-primary-button"
              disabled={
                saving ||
                !amount ||
                Number(
                  amount
                ) <= 0
              }
            >
              {saving
                ? "Recording..."
                : "Record payment"}
            </button>

          </div>

        </form>

      </div>

    </div>
  );
}


/* ======================================================
   DEPOSIT
====================================================== */

function DepositTab({
  tenantId,
  deposit,
  onUpdated,
}) {
  const [
    editing,
    setEditing,
  ] = useState(false);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");


  if (!deposit) {
    return (
      <div>

        <div className="tenant-tab-section-heading">

          <div>

            <h3>
              Deposit
            </h3>

            <p>
              Deposit and
              settlement
              information.
            </p>

          </div>

        </div>


        <div className="tenant-tab-empty">

          <strong>
            Deposit information
            unavailable
          </strong>

        </div>

      </div>
    );
  }


  if (editing) {
    return (
      <DepositEditForm
        deposit={deposit}
        saving={saving}
        error={error}
        onCancel={() => {
          setEditing(false);
          setError("");
        }}
        onSave={async (
          values
        ) => {

          try {

            setSaving(true);
            setError("");


            const response =
              await apiRequest(
                `/api/tenants/${tenantId}/deposit`,
                {
                  method:
                    "PATCH",

                  body:
                    JSON.stringify(
                      values
                    ),
                }
              );


            const updatedDeposit =
              response?.data
                ?.deposit ||
              response?.data ||
              {
                ...deposit,
                ...values,
              };


            onUpdated(
              updatedDeposit
            );


            setEditing(
              false
            );

          } catch (err) {

            setError(
              err?.data
                ?.message ||
                err?.message ||
                "Unable to update deposit."
            );

          } finally {

            setSaving(
              false
            );
          }
        }}
      />
    );
  }


  return (
    <div>

      <div className="tenant-tab-section-heading">

        <div>

          <h3>
            Deposit
          </h3>

          <p>
            Deposit and
            settlement
            information for this
            tenant.
          </p>

        </div>


        <button
          type="button"
          className="tenant-section-edit-button"
          onClick={() => {
            setError("");
            setEditing(true);
          }}
        >
          <Pencil
            size={14}
          />

          Update deposit
        </button>

      </div>


      <div className="tenant-deposit-summary">

        <div>

          <strong>
            {formatCurrency(
              deposit.advanceAmount
            )}
          </strong>

          <span>
            Advance received
          </span>

        </div>


        <div>

          <strong>
            {formatCurrency(
              deposit.maintenanceAmount
            )}
          </strong>

          <span>
            Maintenance
          </span>

        </div>


        <div>

          <strong>
            {formatCurrency(
              deposit.refundableAmount
            )}
          </strong>

          <span>
            Refundable
          </span>

        </div>

      </div>

    </div>
  );
}


/* ======================================================
   DEPOSIT EDIT
====================================================== */

function DepositEditForm({
  deposit,
  saving,
  error,
  onCancel,
  onSave,
}) {
  const [
    advanceAmount,
    setAdvanceAmount,
  ] = useState(
    String(
      deposit.advanceAmount ||
        0
    )
  );

  const [
    maintenanceAmount,
    setMaintenanceAmount,
  ] = useState(
    String(
      deposit.maintenanceAmount ||
        0
    )
  );

  const [
    refundableAmount,
    setRefundableAmount,
  ] = useState(
    String(
      deposit.refundableAmount ||
        0
    )
  );


  async function handleSubmit(
    event
  ) {
    event.preventDefault();

    await onSave({
      advanceAmount:
        Number(
          advanceAmount
        ),

      maintenanceAmount:
        Number(
          maintenanceAmount
        ),

      refundableAmount:
        Number(
          refundableAmount
        ),
    });
  }


  return (
    <form
      onSubmit={
        handleSubmit
      }
    >

      <div className="tenant-tab-section-heading">

        <div>

          <h3>
            Update deposit
          </h3>

          <p>
            Edit deposit and
            settlement values.
          </p>

        </div>

      </div>


      {error ? (
        <div className="tenant-inline-error">

          <AlertTriangle
            size={16}
          />

          {error}

        </div>
      ) : null}


      <div className="tenant-edit-grid">

        <div className="pg-field">

          <label>
            Advance amount
          </label>

          <input
            className="pg-input"
            type="number"
            min="0"
            value={
              advanceAmount
            }
            onChange={(event) =>
              setAdvanceAmount(
                event.target
                  .value
              )
            }
          />

        </div>


        <div className="pg-field">

          <label>
            Maintenance amount
          </label>

          <input
            className="pg-input"
            type="number"
            min="0"
            value={
              maintenanceAmount
            }
            onChange={(event) =>
              setMaintenanceAmount(
                event.target
                  .value
              )
            }
          />

        </div>


        <div className="pg-field">

          <label>
            Refundable amount
          </label>

          <input
            className="pg-input"
            type="number"
            min="0"
            value={
              refundableAmount
            }
            onChange={(event) =>
              setRefundableAmount(
                event.target
                  .value
              )
            }
          />

        </div>

      </div>


      <div className="tenant-edit-actions">

        <button
          type="button"
          className="tenant-secondary-button"
          onClick={
            onCancel
          }
          disabled={
            saving
          }
        >
          Cancel
        </button>


        <button
          type="submit"
          className="tenant-primary-button"
          disabled={
            saving
          }
        >
          {saving
            ? "Saving..."
            : "Save deposit"}
        </button>

      </div>

    </form>
  );
}


/* ======================================================
   DOCUMENT PREVIEW
====================================================== */

function DocumentPreviewModal({
  document,
  title,
  onClose,
}) {
  const documentUrl =
    getDocumentUrl(
      document
    );


  if (
    !document ||
    !documentUrl
  ) {
    return null;
  }


  const isPdf =
    isPdfDocument(
      document
    );


  return (
    <div className="tenant-modal-backdrop">

      <div className="tenant-document-preview-modal">

        <div className="tenant-action-modal-header">

          <div>

            <h3>
              {title}
            </h3>

            <p>
              Uploaded tenant
              document
            </p>

          </div>


          <button
            type="button"
            onClick={onClose}
          >
            <X size={18} />
          </button>

        </div>


        <div className="tenant-document-preview-body">

          {isPdf ? (
            <iframe
              src={documentUrl}
              title={title}
              className="tenant-document-preview-pdf"
            />
          ) : (
            <img
              src={documentUrl}
              alt={title}
              className="tenant-document-preview-image"
            />
          )}

        </div>


        <div className="tenant-action-modal-footer">

          <button
            type="button"
            className="tenant-secondary-button"
            onClick={onClose}
          >
            Close
          </button>


          <a
            href={documentUrl}
            target="_blank"
            rel="noreferrer"
            className="tenant-primary-button"
          >
            <ExternalLink
              size={15}
            />

            Open separately
          </a>

        </div>

      </div>

    </div>
  );
}


/* ======================================================
   DOCUMENTS
====================================================== */

function DocumentsTab({
  tenantId,
  documents,
  loading,
  onDocumentUploaded,
  onDocumentDeleted,
}) {
  const [
    error,
    setError,
  ] = useState("");

  const [
    uploading,
    setUploading,
  ] = useState("");

  const [
    deleting,
    setDeleting,
  ] = useState("");

  const [
    openMenu,
    setOpenMenu,
  ] = useState("");

  const [
    previewDocument,
    setPreviewDocument,
  ] = useState(null);

  const [
    previewTitle,
    setPreviewTitle,
  ] = useState("");


  const frontInput =
    useRef(null);

  const backInput =
    useRef(null);

  const photoInput =
    useRef(null);

  const otherInput =
    useRef(null);


  function findDocument(
    documentType,
    documentSide = null
  ) {
    return documents.find(
      (document) => {

        if (
          document.status &&
          document.status !==
            "ACTIVE"
        ) {
          return false;
        }


        if (
          document.documentType !==
          documentType
        ) {
          return false;
        }


        if (
          documentType ===
          "AADHAAR"
        ) {
          return (
            document.documentSide ===
            documentSide
          );
        }


        return true;
      }
    );
  }


  async function uploadDocument(
    file,
    documentType,
    documentSide = null
  ) {
    if (!file) {
      return;
    }


    const uploadKey =
      `${documentType}-${
        documentSide || ""
      }`;


    try {

      setUploading(
        uploadKey
      );

      setError("");
      setOpenMenu("");


      const formData =
        new FormData();


      formData.append(
        "file",
        file
      );


      formData.append(
        "documentType",
        documentType
      );


      if (documentSide) {
        formData.append(
          "documentSide",
          documentSide
        );
      }


      const response =
        await apiRequest(
          `/api/tenants/${tenantId}/documents`,
          {
            method:
              "POST",

            body:
              formData,
          }
        );


      const uploadedDocument =
        response?.data
          ?.document ||
        response?.data;


      if (
        uploadedDocument?.id
      ) {
        onDocumentUploaded(
          uploadedDocument
        );
      }

    } catch (err) {

      setError(
        err?.data?.message ||
          err?.message ||
          "Unable to upload document."
      );

    } finally {

      setUploading("");
    }
  }


  async function deleteDocument(
    document
  ) {
    if (!document?.id) {
      return;
    }


    const confirmed =
      window.confirm(
        "Delete this document?"
      );


    if (!confirmed) {
      return;
    }


    try {

      setDeleting(
        document.id
      );

      setError("");
      setOpenMenu("");


      await apiRequest(
        `/api/tenants/${tenantId}/documents/${document.id}`,
        {
          method:
            "DELETE",
        }
      );


      onDocumentDeleted(
        document.id
      );


      if (
        previewDocument
          ?.id ===
        document.id
      ) {
        setPreviewDocument(
          null
        );

        setPreviewTitle(
          ""
        );
      }

    } catch (err) {

      setError(
        err?.data?.message ||
          err?.message ||
          "Unable to delete document."
      );

    } finally {

      setDeleting("");
    }
  }


  function handleView(
    document,
    title
  ) {
    const documentUrl =
      getDocumentUrl(
        document
      );


    if (!documentUrl) {
      setError(
        "Document preview URL is unavailable."
      );

      return;
    }


    setPreviewDocument(
      document
    );

    setPreviewTitle(
      title
    );

    setOpenMenu("");
  }


  const cards =
    useMemo(
      () => [
        {
          key:
            "aadhaar-front",

          title:
            "Aadhaar — Front",

          type:
            "AADHAAR",

          side:
            "FRONT",

          inputRef:
            frontInput,
        },

        {
          key:
            "aadhaar-back",

          title:
            "Aadhaar — Back",

          type:
            "AADHAAR",

          side:
            "BACK",

          inputRef:
            backInput,
        },

        {
          key:
            "photo",

          title:
            "Photo",

          type:
            "PHOTO",

          side:
            null,

          inputRef:
            photoInput,
        },

        {
          key:
            "other",

          title:
            "Other",

          type:
            "OTHER",

          side:
            null,

          inputRef:
            otherInput,
        },
      ],
      []
    );


  return (
    <div>

      <div className="tenant-tab-section-heading">

        <div>

          <h3>
            Documents
          </h3>

          <p>
            Aadhaar, tenant
            photo and other
            private documents.
          </p>

        </div>

      </div>


      {error ? (
        <div className="tenant-inline-error">

          <AlertTriangle
            size={16}
          />

          <span>
            {error}
          </span>


          <button
            type="button"
            onClick={() =>
              setError("")
            }
          >
            <X size={15} />
          </button>

        </div>
      ) : null}


      {loading ? (
        <div className="tenant-tab-loading">
          Loading documents...
        </div>
      ) : (
        <div className="tenant-documents-grid">

          {cards.map(
            (card) => {

              const document =
                findDocument(
                  card.type,
                  card.side
                );


              const documentUrl =
                document
                  ? getDocumentUrl(
                      document
                    )
                  : null;


              const uploadKey =
                `${card.type}-${
                  card.side ||
                  ""
                }`;


              const isUploading =
                uploading ===
                uploadKey;


              const isDeleting =
                deleting ===
                document?.id;


              const isMenuOpen =
                openMenu ===
                card.key;


              return (
                <article
                  key={
                    card.key
                  }
                  className="tenant-document-card"
                >

                  {document ? (
                    <div className="tenant-document-menu-wrap">

                      <button
                        type="button"
                        className="tenant-document-menu-trigger"
                        aria-label="Document actions"
                        onClick={() =>
                          setOpenMenu(
                            isMenuOpen
                              ? ""
                              : card.key
                          )
                        }
                      >
                        <MoreVertical
                          size={
                            18
                          }
                        />
                      </button>


                      {isMenuOpen ? (
                        <div className="tenant-document-menu">

                          <button
                            type="button"
                            onClick={() => {

                              setOpenMenu(
                                ""
                              );

                              card
                                .inputRef
                                .current
                                ?.click();
                            }}
                            disabled={
                              isUploading ||
                              isDeleting
                            }
                          >
                            Re-upload
                          </button>


                          <button
                            type="button"
                            className="tenant-document-menu-delete"
                            onClick={() => {

                              setOpenMenu(
                                ""
                              );

                              deleteDocument(
                                document
                              );
                            }}
                            disabled={
                              isUploading ||
                              isDeleting
                            }
                          >
                            {isDeleting
                              ? "Deleting..."
                              : "Delete"}
                          </button>

                        </div>
                      ) : null}

                    </div>
                  ) : null}


                  <div className="tenant-document-card-content">

                    <strong>
                      {card.title}
                    </strong>

                    <span>
                      {document
                        ? "Active document"
                        : "No document uploaded"}
                    </span>

                  </div>


                  <div className="tenant-document-actions">

                    {document ? (
                      documentUrl ? (
                        <button
                          type="button"
                          className="tenant-document-link-button"
                          onClick={() =>
                            handleView(
                              document,
                              card.title
                            )
                          }
                        >
                          {card.type ===
                          "PHOTO"
                            ? "View"
                            : "View signed link"}
                        </button>
                      ) : null
                    ) : (
                      <button
                        type="button"
                        className="tenant-document-upload-button"
                        onClick={() =>
                          card
                            .inputRef
                            .current
                            ?.click()
                        }
                        disabled={
                          isUploading
                        }
                      >
                        {isUploading
                          ? "Uploading..."
                          : "Upload"}
                      </button>
                    )}


                    <input
                      ref={
                        card.inputRef
                      }
                      type="file"
                      hidden
                      accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                      onChange={(
                        event
                      ) => {

                        const file =
                          event
                            .target
                            .files?.[0];


                        uploadDocument(
                          file,
                          card.type,
                          card.side
                        );


                        event.target
                          .value =
                          "";
                      }}
                    />

                  </div>

                </article>
              );
            }
          )}

        </div>
      )}


      {previewDocument ? (
        <DocumentPreviewModal
          document={
            previewDocument
          }
          title={
            previewTitle
          }
          onClose={() => {

            setPreviewDocument(
              null
            );

            setPreviewTitle(
              ""
            );
          }}
        />
      ) : null}

    </div>
  );
}


/* ======================================================
   MAIN TENANT PAGE
====================================================== */

export default function TenantDetailPage() {
  const router =
    useRouter();

  const params =
    useParams();

  const tenantId =
    params?.tenantId;


  const [
    tenant,
    setTenant,
  ] = useState(null);

  const [
    rooms,
    setRooms,
  ] = useState([]);

  const [
    documents,
    setDocuments,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    documentsLoading,
    setDocumentsLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    activeTab,
    setActiveTab,
  ] = useState(
    "OVERVIEW"
  );

  const [
    editing,
    setEditing,
  ] = useState(false);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    editError,
    setEditError,
  ] = useState("");

  const [
    archiving,
    setArchiving,
  ] = useState(false);

  const [
    activating,
    setActivating,
  ] = useState(false);


  /* ====================================================
     LOAD TENANT
  ==================================================== */

  const loadTenant =
    useCallback(
      async () => {

        if (!tenantId) {
          return;
        }


        const response =
          await apiRequest(
            `/api/tenants/${tenantId}`
          );


        setTenant(
          response?.data
            ?.tenant ||
            response?.data ||
            null
        );

      },
      [tenantId]
    );


  /* ====================================================
     LOAD ROOMS
  ==================================================== */

  const loadRooms =
    useCallback(
      async () => {

        const response =
          await apiRequest(
            "/api/rooms"
          );


        const roomData =
          response?.data
            ?.rooms ||
          response?.data;


        setRooms(
          Array.isArray(
            roomData
          )
            ? roomData
            : []
        );

      },
      []
    );


  /* ====================================================
     LOAD DOCUMENTS
  ==================================================== */

  const loadDocuments =
    useCallback(
      async () => {

        if (!tenantId) {
          return;
        }


        try {

          setDocumentsLoading(
            true
          );


          const response =
            await apiRequest(
              `/api/tenants/${tenantId}/documents`
            );


          setDocuments(
            normalizeDocumentsResponse(
              response
            )
          );

        } finally {

          setDocumentsLoading(
            false
          );
        }

      },
      [tenantId]
    );


  /* ====================================================
     INITIAL LOAD
  ==================================================== */

  useEffect(() => {

    if (!tenantId) {
      return;
    }


    let cancelled =
      false;


    async function loadPage() {

      try {

        setLoading(true);
        setError("");


        await Promise.all([
          loadTenant(),
          loadRooms(),
          loadDocuments(),
        ]);

      } catch (err) {

        if (cancelled) {
          return;
        }


        setError(
          err?.data?.message ||
            err?.message ||
            "Unable to load tenant."
        );

      } finally {

        if (!cancelled) {
          setLoading(false);
        }
      }
    }


    loadPage();


    return () => {
      cancelled = true;
    };

  }, [
    tenantId,
    loadTenant,
    loadRooms,
    loadDocuments,
  ]);


  /* ====================================================
     SAVE TENANT
  ==================================================== */

  async function handleSave(
    values
  ) {
    try {

      setSaving(true);
      setEditError("");


      const response =
        await apiRequest(
          `/api/tenants/${tenantId}`,
          {
            method:
              "PATCH",

            body:
              JSON.stringify(
                values
              ),
          }
        );


      const updatedTenant =
        response?.data
          ?.tenant ||
        response?.data;


      setTenant(
        (current) => ({
          ...current,
          ...updatedTenant,

          deposit:
            response?.data
              ?.deposit ??
            current?.deposit,
        })
      );


      setEditing(false);


      await loadRooms();

    } catch (err) {

      setEditError(
        err?.data?.message ||
          err?.message ||
          "Unable to update tenant."
      );

    } finally {

      setSaving(false);
    }
  }


  /* ====================================================
     ARCHIVE TENANT
  ==================================================== */

  async function handleArchive() {
    const confirmed =
      window.confirm(
        `Archive ${tenant.fullName}?`
      );


    if (!confirmed) {
      return;
    }


    try {

      setArchiving(true);
      setError("");


      await apiRequest(
        `/api/tenants/${tenantId}`,
        {
          method:
            "DELETE",
        }
      );


      await Promise.all([
        loadTenant(),
        loadRooms(),
      ]);

    } catch (err) {

      setError(
        err?.data?.message ||
          err?.message ||
          "Unable to archive tenant."
      );

    } finally {

      setArchiving(
        false
      );
    }
  }


  /* ====================================================
     ACTIVATE TENANT
  ==================================================== */

  async function handleActivate() {
    const confirmed =
      window.confirm(
        `Activate ${tenant.fullName}?`
      );


    if (!confirmed) {
      return;
    }


    try {

      setActivating(true);
      setError("");


      await apiRequest(
        `/api/tenants/${tenantId}`,
        {
          method:
            "PATCH",

          body:
            JSON.stringify({
              status:
                "ACTIVE",
            }),
        }
      );


      await Promise.all([
        loadTenant(),
        loadRooms(),
      ]);

    } catch (err) {

      setError(
        err?.data?.message ||
          err?.message ||
          "Unable to activate tenant."
      );

    } finally {

      setActivating(
        false
      );
    }
  }


  /* ====================================================
     LOADING
  ==================================================== */

  if (loading) {
    return (
      <div className="tenant-detail-page">

        <div className="tenant-tab-loading">
          Loading tenant...
        </div>

      </div>
    );
  }


  if (!tenant) {
    return (
      <div className="tenant-detail-page">

        <div className="tenant-tab-empty">

          <strong>
            Tenant not found
          </strong>

        </div>

      </div>
    );
  }


  /* ====================================================
     DERIVED DATA
  ==================================================== */

  const isArchived =
    tenant.status ===
    "ARCHIVED";


  const outstanding =
    getOutstandingAmount(
      tenant
    );


  const depositAmount =
    Number(
      tenant?.deposit
        ?.advanceAmount ||
        0
    );


  const tenantPhoto =
    documents.find(
      (document) =>
        document
          .documentType ===
          "PHOTO" &&
        (
          !document.status ||
          document.status ===
            "ACTIVE"
        )
    );


  const tenantPhotoUrl =
    getDocumentUrl(
      tenantPhoto
    );


  /* ====================================================
     PAGE
  ==================================================== */

  return (
    <div className="tenant-detail-page">

      <div className="tenant-detail-top">

        <button
          type="button"
          className="tenant-back-button"
          onClick={() =>
            router.push(
              "/tenants"
            )
          }
        >
          <ArrowLeft
            size={15}
          />

          Back
        </button>


        <div className="tenant-detail-actions">

          {isArchived ? (
            <button
              type="button"
              className="tenant-activate-button"
              onClick={
                handleActivate
              }
              disabled={
                activating
              }
            >
              <RotateCcw
                size={16}
              />

              {activating
                ? "Activating..."
                : "Activate tenant"}
            </button>
          ) : (
            <>

              <button
                type="button"
                className="tenant-edit-button"
                onClick={() => {

                  setActiveTab(
                    "OVERVIEW"
                  );

                  setEditing(
                    true
                  );

                  setEditError(
                    ""
                  );
                }}
              >
                <Pencil
                  size={15}
                />

                Edit tenant
              </button>


              <button
                type="button"
                className="tenant-archive-button"
                onClick={
                  handleArchive
                }
                disabled={
                  archiving
                }
              >
                {archiving
                  ? "Archiving..."
                  : "Archive tenant"}
              </button>

            </>
          )}

        </div>

      </div>


      <div className="tenant-detail-heading">

        <h1>
          {tenant.fullName}
        </h1>

        <p>
          Tenant account, bills,
          payments, deposit and
          private documents.
        </p>

      </div>


      {error ? (
        <div className="tenant-inline-error">

          <AlertTriangle
            size={16}
          />

          <span>
            {error}
          </span>


          <button
            type="button"
            onClick={() =>
              setError("")
            }
          >
            <X size={15} />
          </button>

        </div>
      ) : null}


      <section className="tenant-profile-card">

        <div className="tenant-profile-center">

          <div
            className={`tenant-profile-avatar ${
              tenantPhotoUrl
                ? "tenant-profile-avatar-photo"
                : ""
            }`}
          >

            {tenantPhotoUrl ? (
              <img
                src={
                  tenantPhotoUrl
                }
                alt={`${tenant.fullName} profile`}
              />
            ) : (
              getInitials(
                tenant.fullName
              )
            )}

          </div>


          <h2>
            {tenant.fullName}
          </h2>


          <span
            className={`tenant-profile-status tenant-profile-status-${String(
              tenant.status ||
                "ACTIVE"
            ).toLowerCase()}`}
          >
            {getStatusLabel(
              tenant.status
            )}
          </span>


          <div className="tenant-profile-meta">

            <span>
              Room{" "}
              {getRoomNumber(
                tenant
              )}
            </span>

            <span>
              {tenant.mobile ||
                "—"}
            </span>

            <span>
              Joined{" "}
              {formatDate(
                tenant.dateOfJoining
              )}
            </span>

          </div>

        </div>


        <div className="tenant-financial-grid">

          <div className="tenant-financial-card">

            <strong>
              {formatCompactCurrency(
                tenant.monthlyRent
              )}
            </strong>

            <span>
              Rent
            </span>

          </div>


          <div className="tenant-financial-card">

            <strong>
              {formatCompactCurrency(
                depositAmount
              )}
            </strong>

            <span>
              Deposit
            </span>

          </div>


          <div className="tenant-financial-card">

            <strong
              className={
                outstanding >
                0
                  ? "tenant-due-value"
                  : ""
              }
            >
              {formatCompactCurrency(
                outstanding
              )}
            </strong>

            <span>
              Due
            </span>

          </div>

        </div>

      </section>


      <section className="tenant-tabs-card">

        <div className="tenant-tabs">

          <button
            type="button"
            className={
              activeTab ===
              "OVERVIEW"
                ? "active"
                : ""
            }
            onClick={() => {

              setEditing(false);

              setActiveTab(
                "OVERVIEW"
              );
            }}
          >
            Overview
          </button>


          <button
            type="button"
            className={
              activeTab ===
              "RENT_BILLS"
                ? "active"
                : ""
            }
            onClick={() => {

              setEditing(false);

              setActiveTab(
                "RENT_BILLS"
              );
            }}
          >
            Rent bills
          </button>


          <button
            type="button"
            className={
              activeTab ===
              "DEPOSIT"
                ? "active"
                : ""
            }
            onClick={() => {

              setEditing(false);

              setActiveTab(
                "DEPOSIT"
              );
            }}
          >
            Deposit
          </button>


          <button
            type="button"
            className={
              activeTab ===
              "DOCUMENTS"
                ? "active"
                : ""
            }
            onClick={() => {

              setEditing(false);

              setActiveTab(
                "DOCUMENTS"
              );
            }}
          >
            Documents
          </button>

        </div>


        <div className="tenant-tab-content">

          {activeTab ===
          "OVERVIEW" ? (
            editing ? (
              <TenantEditForm
                key={`edit-${tenant.id}`}
                tenant={tenant}
                rooms={rooms}
                saving={saving}
                error={
                  editError
                }
                onCancel={() => {

                  setEditing(
                    false
                  );

                  setEditError(
                    ""
                  );
                }}
                onSave={
                  handleSave
                }
              />
            ) : (
              <TenantOverview
                tenant={tenant}
              />
            )
          ) : null}


          {activeTab ===
          "RENT_BILLS" ? (
            <RentBillsTab
              tenant={tenant}
              onPaymentRecorded={(
                result
              ) => {

                const newPayment =
                  result?.payment;


                const updatedBill =
                  result?.rentBill;


                if (
                  !newPayment ||
                  !updatedBill
                ) {
                  return;
                }


                setTenant(
                  (current) => ({
                    ...current,

                    rentBills:
                      (
                        current
                          ?.rentBills ||
                        []
                      ).map(
                        (bill) =>
                          bill.id ===
                          updatedBill.id
                            ? {
                                ...bill,
                                ...updatedBill,
                              }
                            : bill
                      ),

                    payments: [
                      newPayment,
                      ...(
                        current
                          ?.payments ||
                        []
                      ),
                    ],
                  })
                );
              }}
            />
          ) : null}


          {activeTab ===
          "DEPOSIT" ? (
            <DepositTab
              tenantId={
                tenantId
              }
              deposit={
                tenant.deposit
              }
              onUpdated={(
                updatedDeposit
              ) => {

                setTenant(
                  (current) => ({
                    ...current,

                    deposit:
                      updatedDeposit,
                  })
                );
              }}
            />
          ) : null}


          {activeTab ===
          "DOCUMENTS" ? (
            <DocumentsTab
              tenantId={
                tenantId
              }
              documents={
                documents
              }
              loading={
                documentsLoading
              }
              onDocumentUploaded={(
                uploadedDocument
              ) => {

                setDocuments(
                  (current) => {

                    const filtered =
                      current.filter(
                        (document) => {

                          /*
                           * Aadhaar FRONT/BACK
                           * are separate slots.
                           */
                          if (
                            uploadedDocument
                              .documentType ===
                            "AADHAAR"
                          ) {
                            return !(
                              document
                                .documentType ===
                                "AADHAAR" &&
                              document
                                .documentSide ===
                                uploadedDocument
                                  .documentSide
                            );
                          }


                          /*
                           * PHOTO and OTHER each
                           * use one active slot.
                           */
                          return (
                            document
                              .documentType !==
                            uploadedDocument
                              .documentType
                          );
                        }
                      );


                    return [
                      uploadedDocument,
                      ...filtered,
                    ];
                  }
                );
              }}
              onDocumentDeleted={(
                documentId
              ) => {

                setDocuments(
                  (current) =>
                    current.filter(
                      (document) =>
                        document.id !==
                        documentId
                    )
                );
              }}
            />
          ) : null}

        </div>

      </section>

    </div>
  );
}