"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertTriangle,
  Plus,
  Search,
  X,
} from "lucide-react";

import {
  useRouter,
  useSearchParams,
} from "next/navigation";

import { apiRequest } from "@/lib/api/client";


/* ======================================================
   HELPERS
====================================================== */

function formatCurrency(value) {
  const amount = Number(value || 0);

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}


function formatDate(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}


function getTenantRoomNumber(tenant) {
  return (
    tenant?.roomNumber ||
    tenant?.room?.roomNumber ||
    "—"
  );
}


function getTenantStatusLabel(status) {
  if (status === "NOTICE_PERIOD") {
    return "NOTICE";
  }

  if (status === "ARCHIVED") {
    return "ARCHIVED";
  }

  return "ACTIVE";
}


function getOutstandingAmount(tenant) {
  if (
    tenant?.balanceAmount !== undefined &&
    tenant?.balanceAmount !== null
  ) {
    return Number(
      tenant.balanceAmount || 0
    );
  }

  if (
    tenant?.pendingAmount !== undefined &&
    tenant?.pendingAmount !== null
  ) {
    return Number(
      tenant.pendingAmount || 0
    );
  }

  if (Array.isArray(tenant?.rentBills)) {
    return tenant.rentBills.reduce(
      (total, bill) => {
        return (
          total +
          Number(
            bill?.balanceAmount || 0
          )
        );
      },
      0
    );
  }

  return 0;
}


/* ======================================================
   PAGINATION
====================================================== */

const TENANTS_PER_PAGE = 10;


/* ======================================================
   ADD TENANT MODAL
====================================================== */

function AddTenantModal({
  rooms,
  creating,
  error,
  onClose,
  onCreate,
}) {
  const [fullName, setFullName] =
    useState("");

  const [mobile, setMobile] =
    useState("");

  const [roomId, setRoomId] =
    useState("");

  const [
    dateOfJoining,
    setDateOfJoining,
  ] = useState("");

  const [
    monthlyRent,
    setMonthlyRent,
  ] = useState("");

  const [
    depositReceived,
    setDepositReceived,
  ] = useState("");

  const [
    aadhaarFront,
    setAadhaarFront,
  ] = useState(null);

  const [
    aadhaarBack,
    setAadhaarBack,
  ] = useState(null);


  /* ====================================================
     AVAILABLE ROOMS
  ==================================================== */

  const availableRooms =
    useMemo(() => {
      return rooms.filter((room) => {
        if (
          room.status &&
          room.status !== "ACTIVE"
        ) {
          return false;
        }

        if (
          room.vacantBeds !== undefined &&
          room.vacantBeds !== null
        ) {
          return (
            Number(room.vacantBeds) > 0
          );
        }

        return (
          Number(room.capacity || 0) > 0
        );
      });
    }, [rooms]);


  /* ====================================================
     SUBMIT
  ==================================================== */

  async function handleSubmit(event) {
    event.preventDefault();

    if (!fullName.trim()) {
      return;
    }

    if (!mobile.trim()) {
      return;
    }

    if (!roomId) {
      return;
    }

    if (!dateOfJoining) {
      return;
    }

    if (
      !monthlyRent ||
      Number(monthlyRent) <= 0
    ) {
      return;
    }

    await onCreate({
      fullName: fullName.trim(),

      mobile: mobile.trim(),

      roomId,

      dateOfJoining,

      monthlyRent:
        Number(monthlyRent),

      depositReceived:
        Number(
          depositReceived || 0
        ),

      aadhaarFront,

      aadhaarBack,
    });
  }


  /* ====================================================
     MODAL
  ==================================================== */

  return (
    <div
      className="prototype-modal-backdrop"
      onMouseDown={(event) => {
        if (
          event.target ===
            event.currentTarget &&
          !creating
        ) {
          onClose();
        }
      }}
    >
      <div className="prototype-tenant-modal">

        {/* HEADER */}

        <div className="prototype-tenant-modal-header">
          <h2>
            Add tenant
          </h2>

          <button
            type="button"
            className="prototype-modal-close"
            onClick={onClose}
            disabled={creating}
            aria-label="Close add tenant"
          >
            <X size={18} />
          </button>
        </div>


        <form onSubmit={handleSubmit}>

          {/* BODY */}

          <div className="prototype-tenant-modal-body">

            {error ? (
              <div className="prototype-form-error">
                <AlertTriangle
                  size={16}
                />

                <span>
                  {error}
                </span>
              </div>
            ) : null}


            <div className="prototype-tenant-form-grid">

              {/* FULL NAME */}

              <div className="prototype-form-field">
                <label htmlFor="tenant-full-name">
                  FULL NAME
                </label>

                <input
                  id="tenant-full-name"
                  type="text"
                  placeholder="Tenant name"
                  value={fullName}
                  onChange={(event) =>
                    setFullName(
                      event.target.value
                    )
                  }
                  disabled={creating}
                  autoComplete="name"
                  required
                />
              </div>


              {/* PHONE */}

              <div className="prototype-form-field">
                <label htmlFor="tenant-mobile">
                  PHONE
                </label>

                <input
                  id="tenant-mobile"
                  type="tel"
                  inputMode="numeric"
                  placeholder="10-digit number"
                  maxLength={10}
                  value={mobile}
                  onChange={(event) => {
                    const value =
                      event.target.value.replace(
                        /\D/g,
                        ""
                      );

                    setMobile(value);
                  }}
                  disabled={creating}
                  autoComplete="tel"
                  required
                />
              </div>


              {/* ROOM */}

              <div className="prototype-form-field">
                <label htmlFor="tenant-room">
                  ROOM
                </label>

                <select
                  id="tenant-room"
                  value={roomId}
                  onChange={(event) =>
                    setRoomId(
                      event.target.value
                    )
                  }
                  disabled={creating}
                  required
                >
                  <option value="">
                    Select available room
                  </option>

                  {availableRooms.map(
                    (room) => (
                      <option
                        key={room.id}
                        value={room.id}
                      >
                        Room{" "}
                        {room.roomNumber}
                      </option>
                    )
                  )}
                </select>
              </div>


              {/* DATE OF JOINING */}

              <div className="prototype-form-field">
                <label htmlFor="tenant-date-of-joining">
                  DATE OF JOINING
                </label>

                <input
                  id="tenant-date-of-joining"
                  type="date"
                  value={dateOfJoining}
                  onChange={(event) =>
                    setDateOfJoining(
                      event.target.value
                    )
                  }
                  disabled={creating}
                  required
                />
              </div>


              {/* MONTHLY RENT */}

              <div className="prototype-form-field">
                <label htmlFor="tenant-monthly-rent">
                  MONTHLY RENT
                </label>

                <div className="prototype-money-field">
                  <span>
                    ₹
                  </span>

                  <input
                    id="tenant-monthly-rent"
                    type="number"
                    min="1"
                    step="1"
                    value={monthlyRent}
                    onChange={(event) =>
                      setMonthlyRent(
                        event.target.value
                      )
                    }
                    disabled={creating}
                    required
                  />
                </div>
              </div>


              {/* DEPOSIT RECEIVED */}

              <div className="prototype-form-field">
                <label htmlFor="tenant-deposit-received">
                  DEPOSIT RECEIVED
                </label>

                <div className="prototype-money-field">
                  <span>
                    ₹
                  </span>

                  <input
                    id="tenant-deposit-received"
                    type="number"
                    min="0"
                    step="1"
                    value={depositReceived}
                    onChange={(event) =>
                      setDepositReceived(
                        event.target.value
                      )
                    }
                    disabled={creating}
                  />
                </div>
              </div>

            </div>


            {/* DOCUMENTS */}

            <div className="prototype-documents-section">

              <div className="prototype-documents-label">
                DOCUMENTS
              </div>


              <div className="prototype-documents-grid">

                {/* AADHAAR FRONT */}

                <label className="prototype-document-upload">
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                    onChange={(event) =>
                      setAadhaarFront(
                        event.target.files?.[0] ||
                          null
                      )
                    }
                    disabled={creating}
                  />

                  <strong>
                    Aadhaar Front
                  </strong>

                  <span
                    title={
                      aadhaarFront?.name || ""
                    }
                  >
                    {aadhaarFront
                      ? aadhaarFront.name
                      : "Optional during creation"}
                  </span>
                </label>


                {/* AADHAAR BACK */}

                <label className="prototype-document-upload">
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                    onChange={(event) =>
                      setAadhaarBack(
                        event.target.files?.[0] ||
                          null
                      )
                    }
                    disabled={creating}
                  />

                  <strong>
                    Aadhaar Back
                  </strong>

                  <span
                    title={
                      aadhaarBack?.name || ""
                    }
                  >
                    {aadhaarBack
                      ? aadhaarBack.name
                      : "Optional during creation"}
                  </span>
                </label>

              </div>

            </div>

          </div>


          {/* FOOTER */}

          <div className="prototype-tenant-modal-footer">

            <button
              type="button"
              className="prototype-modal-cancel"
              onClick={onClose}
              disabled={creating}
            >
              Cancel
            </button>


            <button
              type="submit"
              className="prototype-modal-submit"
              disabled={
                creating ||
                !fullName.trim() ||
                !mobile.trim() ||
                !roomId ||
                !dateOfJoining ||
                !monthlyRent
              }
            >
              {creating
                ? "Creating..."
                : "Create tenant"}
            </button>

          </div>

        </form>

      </div>
    </div>
  );
}


/* ======================================================
   TENANTS PAGE
====================================================== */

export default function TenantsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();


  const [tenants, setTenants] =
    useState([]);

  const [rooms, setRooms] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState("CURRENT");

  const [
    showAddTenant,
    setShowAddTenant,
  ] = useState(false);

  const [
    creatingTenant,
    setCreatingTenant,
  ] = useState(false);

  const [
    tenantFormError,
    setTenantFormError,
  ] = useState("");

  const [
    currentPage,
    setCurrentPage,
  ] = useState(1);


  /* ====================================================
     LOAD TENANTS + ROOMS
  ==================================================== */

  const loadData =
    useCallback(async () => {
      try {
        setLoading(true);
        setError("");

        const [
          tenantsResponse,
          roomsResponse,
        ] = await Promise.all([
          apiRequest(
            "/api/tenants"
          ),

          apiRequest(
            "/api/rooms"
          ),
        ]);

        const tenantList =
          Array.isArray(
            tenantsResponse?.data
          )
            ? tenantsResponse.data
            : [];

        const roomList =
          Array.isArray(
            roomsResponse?.data
          )
            ? roomsResponse.data
            : [];

        setTenants(
          tenantList
        );

        setRooms(
          roomList
        );

      } catch (err) {
        console.error(
          "Load tenants page error:",
          err
        );

        setError(
          err?.data?.message ||
            err?.message ||
            "Unable to load tenants."
        );

        setTenants([]);
        setRooms([]);

      } finally {
        setLoading(false);
      }
    }, []);


  useEffect(() => {
    loadData();
  }, [loadData]);


  /* ====================================================
     OPEN MODAL FROM DASHBOARD
     /tenants?add=1
  ==================================================== */

  useEffect(() => {
    const shouldOpenAddTenant =
      searchParams.get("add") === "1";

    if (shouldOpenAddTenant) {
      setTenantFormError("");
      setShowAddTenant(true);
    }
  }, [searchParams]);


  /* ====================================================
     FILTER TENANTS
  ==================================================== */

  const visibleTenants =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      return tenants.filter(
        (tenant) => {
          let matchesStatus = true;


          if (
            statusFilter ===
            "CURRENT"
          ) {
            matchesStatus =
              tenant.status ===
                "ACTIVE" ||
              tenant.status ===
                "NOTICE_PERIOD";
          }


          if (
            statusFilter ===
            "ACTIVE"
          ) {
            matchesStatus =
              tenant.status ===
              "ACTIVE";
          }


          if (
            statusFilter ===
            "NOTICE_PERIOD"
          ) {
            matchesStatus =
              tenant.status ===
              "NOTICE_PERIOD";
          }


          if (
            statusFilter ===
            "ARCHIVED"
          ) {
            matchesStatus =
              tenant.status ===
              "ARCHIVED";
          }


          if (!matchesStatus) {
            return false;
          }


          if (!query) {
            return true;
          }


          const tenantName =
            String(
              tenant.fullName || ""
            ).toLowerCase();


          const tenantMobile =
            String(
              tenant.mobile || ""
            ).toLowerCase();


          const roomNumber =
            String(
              getTenantRoomNumber(
                tenant
              )
            ).toLowerCase();


          return (
            tenantName.includes(
              query
            ) ||
            tenantMobile.includes(
              query
            ) ||
            roomNumber.includes(
              query
            )
          );
        }
      );
    }, [
      tenants,
      search,
      statusFilter,
    ]);


  /* ====================================================
     PAGINATION
  ==================================================== */

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        visibleTenants.length /
          TENANTS_PER_PAGE
      )
    );


  const safeCurrentPage =
    Math.min(
      currentPage,
      totalPages
    );


  const startIndex =
    (safeCurrentPage - 1) *
    TENANTS_PER_PAGE;


  const paginatedTenants =
    visibleTenants.slice(
      startIndex,
      startIndex +
        TENANTS_PER_PAGE
    );


  const showingFrom =
    visibleTenants.length === 0
      ? 0
      : startIndex + 1;


  const showingTo =
    Math.min(
      startIndex +
        TENANTS_PER_PAGE,
      visibleTenants.length
    );


  const paginationPages =
    useMemo(() => {
      const pages = [];

      for (
        let page = 1;
        page <= totalPages;
        page += 1
      ) {
        if (
          totalPages <= 7 ||
          page === 1 ||
          page === totalPages ||
          Math.abs(
            page -
              safeCurrentPage
          ) <= 1
        ) {
          pages.push(page);
        }
      }

      return pages;
    }, [
      totalPages,
      safeCurrentPage,
    ]);


  useEffect(() => {
    setCurrentPage(1);
  }, [
    search,
    statusFilter,
  ]);


  /* ====================================================
     OPEN ADD TENANT
  ==================================================== */

  function handleOpenAddTenant() {
    setTenantFormError("");
    setShowAddTenant(true);
  }


  /* ====================================================
     CLOSE ADD TENANT
  ==================================================== */

  function handleCloseAddTenant() {
    if (creatingTenant) {
      return;
    }

    setTenantFormError("");
    setShowAddTenant(false);

    /*
     * If modal was opened from
     * Dashboard, clean the URL.
     */
    if (
      searchParams.get("add") === "1"
    ) {
      router.replace(
        "/tenants",
        {
          scroll: false,
        }
      );
    }
  }


  /* ====================================================
     CREATE TENANT
  ==================================================== */

  async function handleCreateTenant(
    values
  ) {
    try {
      setCreatingTenant(true);
      setTenantFormError("");


      /* ================================================
         STEP 1 — CREATE TENANT
      ================================================ */

      const response =
        await apiRequest(
          "/api/tenants",
          {
            method: "POST",

            body: JSON.stringify({
              fullName:
                values.fullName,

              mobile:
                values.mobile,

              roomId:
                values.roomId,

              dateOfJoining:
                values.dateOfJoining,

              monthlyRent:
                values.monthlyRent,

              advanceAmount:
                values.depositReceived,
            }),
          }
        );


      const createdTenant =
        response?.data?.tenant ||
        response?.data;


      if (
        !createdTenant?.id
      ) {
        throw new Error(
          "Tenant created but tenant ID was not returned."
        );
      }


      /* ================================================
         STEP 2 — OPTIONAL DOCUMENTS
      ================================================ */

      const documentErrors = [];


      /* AADHAAR FRONT */

      if (
        values.aadhaarFront
      ) {
        try {
          const formData =
            new FormData();


          formData.append(
            "file",
            values.aadhaarFront
          );

          formData.append(
            "documentType",
            "AADHAAR"
          );

          formData.append(
            "documentSide",
            "FRONT"
          );


          await apiRequest(
            `/api/tenants/${createdTenant.id}/documents`,
            {
              method: "POST",
              body: formData,
            }
          );

        } catch (documentError) {
          console.error(
            "Aadhaar Front upload error:",
            documentError
          );

          documentErrors.push(
            documentError?.data
              ?.message ||
              documentError
                ?.message ||
              "Aadhaar Front upload failed."
          );
        }
      }


      /* AADHAAR BACK */

      if (
        values.aadhaarBack
      ) {
        try {
          const formData =
            new FormData();


          formData.append(
            "file",
            values.aadhaarBack
          );

          formData.append(
            "documentType",
            "AADHAAR"
          );

          formData.append(
            "documentSide",
            "BACK"
          );


          await apiRequest(
            `/api/tenants/${createdTenant.id}/documents`,
            {
              method: "POST",
              body: formData,
            }
          );

        } catch (documentError) {
          console.error(
            "Aadhaar Back upload error:",
            documentError
          );

          documentErrors.push(
            documentError?.data
              ?.message ||
              documentError
                ?.message ||
              "Aadhaar Back upload failed."
          );
        }
      }


      /* ================================================
         STEP 3 — REFRESH TENANTS
      ================================================ */

      await loadData();


      setShowAddTenant(false);


      /*
       * Remove ?add=1 after
       * successful creation.
       */
      if (
        searchParams.get("add") === "1"
      ) {
        router.replace(
          "/tenants",
          {
            scroll: false,
          }
        );
      }


      /*
       * Tenant is already created even
       * if optional documents fail.
       */
      if (
        documentErrors.length > 0
      ) {
        setError(
          `Tenant created successfully, but ${documentErrors.join(
            " "
          )}`
        );
      }

    } catch (err) {
      console.error(
        "Create tenant error:",
        err
      );

      setTenantFormError(
        err?.data?.message ||
          err?.message ||
          "Unable to create tenant."
      );

    } finally {
      setCreatingTenant(false);
    }
  }


  /* ====================================================
     PAGE
  ==================================================== */

  return (
    <div className="tenants-page">

      {/* =================================================
          PAGE HEADER
      ================================================== */}

      <div className="tenants-page-header">

        <div className="tenants-page-heading">

          <h1>
            Tenants
          </h1>

          <p>
            Resident status, room assignment,
            joining date and current financial
            position.
          </p>

        </div>


        <button
          type="button"
          className="tenants-add-button"
          onClick={
            handleOpenAddTenant
          }
        >
          <Plus size={17} />

          Add tenant
        </button>

      </div>


      {/* =================================================
          PAGE ERROR
      ================================================== */}

      {error ? (
        <div className="tenants-page-error">

          <div className="tenants-page-error-message">

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
            <X size={16} />
          </button>

        </div>
      ) : null}


      {/* =================================================
          TOOLBAR
      ================================================== */}

      <div className="tenants-toolbar">

        <div className="tenants-search">

          <Search size={17} />

          <input
            type="search"
            placeholder="Search tenant, phone or room"
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
          />

        </div>


        <select
          className="tenants-status-filter"
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(
              event.target.value
            )
          }
        >
          <option value="CURRENT">
            Current tenants
          </option>

          <option value="ACTIVE">
            Active
          </option>

          <option value="NOTICE_PERIOD">
            Notice period
          </option>

          <option value="ARCHIVED">
            Archived
          </option>

          <option value="ALL">
            All tenants
          </option>
        </select>

      </div>


      {/* =================================================
          TABLE CARD
      ================================================== */}

      <div className="tenants-table-card">

        <div className="tenants-table-scroll">

          <table className="tenants-table">

            <thead>
              <tr>

                <th>
                  ROOM
                </th>

                <th>
                  TENANT
                </th>

                <th>
                  PHONE
                </th>

                <th>
                  JOINED
                </th>

                <th>
                  MONTHLY RENT
                </th>

                <th>
                  OUTSTANDING
                </th>

                <th>
                  DUE DATE
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

              {/* LOADING */}
{/* LOADING */}

{loading
  ? Array.from({
      length: 5,
    }).map((_, rowIndex) => (
      <tr
        key={`tenant-loading-${rowIndex}`}
        className="tenants-skeleton-row"
      >
        {/* ROOM */}
        <td>
          <div className="tenants-skeleton tenants-skeleton-room" />
        </td>

        {/* TENANT */}
        <td>
          <div className="tenants-skeleton tenants-skeleton-name" />
        </td>

        {/* PHONE */}
        <td>
          <div className="tenants-skeleton tenants-skeleton-phone" />
        </td>

        {/* JOINED */}
        <td>
          <div className="tenants-skeleton tenants-skeleton-date" />
        </td>

        {/* MONTHLY RENT */}
        <td>
          <div className="tenants-skeleton tenants-skeleton-money" />
        </td>

        {/* OUTSTANDING */}
        <td>
          <div className="tenants-skeleton tenants-skeleton-money" />
        </td>

        {/* DUE DATE */}
        <td>
          <div className="tenants-skeleton tenants-skeleton-date" />
        </td>

        {/* STATUS */}
        <td>
          <div className="tenants-skeleton tenants-skeleton-status" />
        </td>

        {/* ACTION */}
        <td className="tenant-table-action-cell">
          <div className="tenants-skeleton tenants-skeleton-action" />
        </td>
      </tr>
    ))
  : null}


              {/* TENANTS */}

              {!loading &&
              paginatedTenants.length > 0
                ? paginatedTenants.map(
                    (tenant) => {
                      const outstanding =
                        getOutstandingAmount(
                          tenant
                        );


                      return (
                        <tr
                          key={tenant.id}
                        >

                          {/* ROOM */}

                          <td>
                            <span className="tenant-room-number">
                              {getTenantRoomNumber(
                                tenant
                              )}
                            </span>
                          </td>


                          {/* TENANT */}

                          <td>
                            <div className="tenant-table-name">

                              <strong>
                                {tenant.fullName ||
                                  "—"}
                              </strong>

                            </div>
                          </td>


                          {/* PHONE */}

                          <td>
                            {tenant.mobile ||
                              "—"}
                          </td>


                          {/* JOINED */}

                          <td>
                            {formatDate(
                              tenant.dateOfJoining
                            )}
                          </td>


                          {/* MONTHLY RENT */}

                          <td>
                            <strong className="tenant-table-money">
                              {formatCurrency(
                                tenant.monthlyRent
                              )}
                            </strong>
                          </td>


                          {/* OUTSTANDING */}

                          <td>
                            <strong
                              className={
                                outstanding > 0
                                  ? "tenant-table-money tenant-outstanding-due"
                                  : "tenant-table-money"
                              }
                            >
                              {formatCurrency(
                                outstanding
                              )}
                            </strong>
                          </td>


                          {/* DUE DATE */}

                          <td>
                            {formatDate(
                              tenant.dueDate
                            )}
                          </td>


                          {/* STATUS */}

                          <td>

                            <span
                              className={`tenant-table-status tenant-table-status-${String(
                                tenant.status ||
                                  "ACTIVE"
                              ).toLowerCase()}`}
                            >
                              {getTenantStatusLabel(
                                tenant.status
                              )}
                            </span>

                          </td>


                          {/* VIEW */}

                          <td className="tenant-table-action-cell">

                            <button
                              type="button"
                              className="tenant-view-button"
                              onClick={() =>
                                router.push(
                                  `/tenants/${tenant.id}`
                                )
                              }
                            >
                              View
                            </button>

                          </td>

                        </tr>
                      );
                    }
                  )
                : null}


              {/* EMPTY */}

{!loading &&
visibleTenants.length === 0 ? (
  <tr>
    <td
      colSpan={9}
      className="tenants-empty-cell"
    >
      <div className="tenants-empty">
        <strong>
          {search
            ? "No matching tenants"
            : statusFilter ===
                "ARCHIVED"
              ? "No archived tenants found"
              : "No tenants found"}
        </strong>

        <p>
          {search
            ? "Try searching by another name, phone number or room."
            : statusFilter ===
                "ARCHIVED"
              ? "Archived tenants will appear here."
              : "Add a tenant to start managing residents."}
        </p>
      </div>
    </td>
  </tr>
) : null}

            </tbody>

          </table>

        </div>


        {/* =================================================
            PAGINATION
        ================================================== */}

        {!loading &&
        visibleTenants.length > 0 ? (
          <div className="tenants-pagination">

            <div className="tenants-pagination-info">

              Showing{" "}

              <strong>
                {showingFrom}
              </strong>

              {"–"}

              <strong>
                {showingTo}
              </strong>

              {" of "}

              <strong>
                {visibleTenants.length}
              </strong>

              {" tenants"}

            </div>


            {totalPages > 1 ? (
              <div className="tenants-pagination-controls">

                {/* PREVIOUS */}

                <button
                  type="button"
                  className="tenants-pagination-nav"
                  disabled={
                    safeCurrentPage === 1
                  }
                  onClick={() =>
                    setCurrentPage(
                      Math.max(
                        1,
                        safeCurrentPage - 1
                      )
                    )
                  }
                >
                  Previous
                </button>


                {/* PAGE NUMBERS */}

                <div className="tenants-pagination-pages">

                  {paginationPages.map(
                    (
                      page,
                      index
                    ) => {
                      const previousPage =
                        paginationPages[
                          index - 1
                        ];


                      const showEllipsis =
                        previousPage &&
                        page -
                          previousPage >
                          1;


                      return (
                        <div
                          key={page}
                          className="tenants-pagination-page-item"
                        >

                          {showEllipsis ? (
                            <span className="tenants-pagination-ellipsis">
                              …
                            </span>
                          ) : null}


                          <button
                            type="button"
                            className={`tenants-pagination-page ${
                              safeCurrentPage ===
                              page
                                ? "active"
                                : ""
                            }`}
                            aria-current={
                              safeCurrentPage ===
                              page
                                ? "page"
                                : undefined
                            }
                            onClick={() =>
                              setCurrentPage(
                                page
                              )
                            }
                          >
                            {page}
                          </button>

                        </div>
                      );
                    }
                  )}

                </div>


                {/* NEXT */}

                <button
                  type="button"
                  className="tenants-pagination-nav"
                  disabled={
                    safeCurrentPage ===
                    totalPages
                  }
                  onClick={() =>
                    setCurrentPage(
                      Math.min(
                        totalPages,
                        safeCurrentPage + 1
                      )
                    )
                  }
                >
                  Next
                </button>

              </div>
            ) : null}

          </div>
        ) : null}

      </div>


      {/* =================================================
          ADD TENANT MODAL
      ================================================== */}

      {showAddTenant ? (
        <AddTenantModal
          key="add-tenant"
          rooms={rooms}
          creating={
            creatingTenant
          }
          error={
            tenantFormError
          }
          onClose={
            handleCloseAddTenant
          }
          onCreate={
            handleCreateTenant
          }
        />
      ) : null}

    </div>
  );
}