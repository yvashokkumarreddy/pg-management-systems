"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertTriangle,
  X,
} from "lucide-react";

import { useRouter } from "next/navigation";

import { apiRequest } from "@/lib/api/client";


export default function AddTenantForm({
  modal = false,
  onClose,
  onCreated,
}) {
  const router = useRouter();

  const [rooms, setRooms] =
    useState([]);

  const [loadingRooms, setLoadingRooms] =
    useState(true);

  const [creating, setCreating] =
    useState(false);

  const [error, setError] =
    useState("");

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


  useEffect(() => {
    let cancelled = false;

    async function loadRooms() {
      try {
        setLoadingRooms(true);

        const response =
          await apiRequest(
            "/api/rooms"
          );

        if (cancelled) {
          return;
        }

        setRooms(
          Array.isArray(
            response?.data
          )
            ? response.data
            : []
        );

      } catch (err) {
        console.error(
          "Load rooms error:",
          err
        );

        if (!cancelled) {
          setError(
            err?.data?.message ||
              err?.message ||
              "Unable to load rooms."
          );
        }

      } finally {
        if (!cancelled) {
          setLoadingRooms(false);
        }
      }
    }

    loadRooms();

    return () => {
      cancelled = true;
    };
  }, []);


  const availableRooms =
    useMemo(() => {
      return rooms.filter(
        (room) => {
          if (
            room.status &&
            room.status !==
              "ACTIVE"
          ) {
            return false;
          }

          if (
            room.vacantBeds !==
              undefined &&
            room.vacantBeds !==
              null
          ) {
            return (
              Number(
                room.vacantBeds
              ) > 0
            );
          }

          return (
            Number(
              room.capacity || 0
            ) > 0
          );
        }
      );
    }, [rooms]);


  function handleClose() {
    if (creating) {
      return;
    }

    if (onClose) {
      onClose();
      return;
    }

    router.push(
      "/tenants"
    );
  }


  async function handleSubmit(
    event
  ) {
    event.preventDefault();

    if (
      !fullName.trim() ||
      !mobile.trim() ||
      !roomId ||
      !dateOfJoining ||
      !monthlyRent ||
      Number(monthlyRent) <= 0
    ) {
      return;
    }

    try {
      setCreating(true);
      setError("");


      const response =
        await apiRequest(
          "/api/tenants",
          {
            method:
              "POST",

            body:
              JSON.stringify({
                fullName:
                  fullName.trim(),

                mobile:
                  mobile.trim(),

                roomId,

                dateOfJoining,

                monthlyRent:
                  Number(
                    monthlyRent
                  ),

                advanceAmount:
                  Number(
                    depositReceived ||
                      0
                  ),
              }),
          }
        );


      const createdTenant =
        response?.data
          ?.tenant ||
        response?.data;


      if (
        !createdTenant?.id
      ) {
        throw new Error(
          "Tenant created but tenant ID was not returned."
        );
      }


      const documentErrors =
        [];


      if (
        aadhaarFront
      ) {
        try {
          const formData =
            new FormData();

          formData.append(
            "file",
            aadhaarFront
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
              method:
                "POST",
              body:
                formData,
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


      if (
        aadhaarBack
      ) {
        try {
          const formData =
            new FormData();

          formData.append(
            "file",
            aadhaarBack
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
              method:
                "POST",
              body:
                formData,
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


      if (
        documentErrors.length > 0
      ) {
        console.warn(
          documentErrors.join(" ")
        );
      }


      if (onCreated) {
        await onCreated(
          createdTenant
        );

        return;
      }

      router.push(
        `/tenants/${createdTenant.id}`
      );

    } catch (err) {
      console.error(
        "Create tenant error:",
        err
      );

      setError(
        err?.data?.message ||
          err?.message ||
          "Unable to create tenant."
      );

    } finally {
      setCreating(false);
    }
  }


  const formContent = (
    <div className="prototype-tenant-modal">

      <div className="prototype-tenant-modal-header">
        <h2>
          Add tenant
        </h2>

        <button
          type="button"
          className="prototype-modal-close"
          onClick={
            handleClose
          }
          disabled={
            creating
          }
          aria-label="Close add tenant"
        >
          <X size={18} />
        </button>
      </div>


      <form
        onSubmit={
          handleSubmit
        }
      >

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

            <div className="prototype-form-field">
              <label htmlFor="tenant-full-name">
                FULL NAME
              </label>

              <input
                id="tenant-full-name"
                type="text"
                placeholder="Tenant name"
                value={
                  fullName
                }
                onChange={(
                  event
                ) =>
                  setFullName(
                    event.target
                      .value
                  )
                }
                disabled={
                  creating
                }
                autoComplete="name"
                required
              />
            </div>


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
                value={
                  mobile
                }
                onChange={(
                  event
                ) => {
                  const value =
                    event.target.value.replace(
                      /\D/g,
                      ""
                    );

                  setMobile(
                    value
                  );
                }}
                disabled={
                  creating
                }
                autoComplete="tel"
                required
              />
            </div>


            <div className="prototype-form-field">
              <label htmlFor="tenant-room">
                ROOM
              </label>

              <select
                id="tenant-room"
                value={
                  roomId
                }
                onChange={(
                  event
                ) =>
                  setRoomId(
                    event.target
                      .value
                  )
                }
                disabled={
                  creating ||
                  loadingRooms
                }
                required
              >
                <option value="">
                  {loadingRooms
                    ? "Loading rooms..."
                    : "Select available room"}
                </option>

                {availableRooms.map(
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


            <div className="prototype-form-field">
              <label htmlFor="tenant-date-of-joining">
                DATE OF JOINING
              </label>

              <input
                id="tenant-date-of-joining"
                type="date"
                value={
                  dateOfJoining
                }
                onChange={(
                  event
                ) =>
                  setDateOfJoining(
                    event.target
                      .value
                  )
                }
                disabled={
                  creating
                }
                required
              />
            </div>


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
                  value={
                    monthlyRent
                  }
                  onChange={(
                    event
                  ) =>
                    setMonthlyRent(
                      event.target
                        .value
                    )
                  }
                  disabled={
                    creating
                  }
                  required
                />
              </div>
            </div>


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
                  value={
                    depositReceived
                  }
                  onChange={(
                    event
                  ) =>
                    setDepositReceived(
                      event.target
                        .value
                    )
                  }
                  disabled={
                    creating
                  }
                />
              </div>
            </div>

          </div>


          <div className="prototype-documents-section">

            <div className="prototype-documents-label">
              DOCUMENTS
            </div>


            <div className="prototype-documents-grid">

              <label className="prototype-document-upload">

                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                  onChange={(
                    event
                  ) =>
                    setAadhaarFront(
                      event.target
                        .files?.[0] ||
                        null
                    )
                  }
                  disabled={
                    creating
                  }
                />

                <strong>
                  Aadhaar Front
                </strong>

                <span
                  title={
                    aadhaarFront?.name ||
                    ""
                  }
                >
                  {aadhaarFront
                    ? aadhaarFront.name
                    : "Optional during creation"}
                </span>

              </label>


              <label className="prototype-document-upload">

                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                  onChange={(
                    event
                  ) =>
                    setAadhaarBack(
                      event.target
                        .files?.[0] ||
                        null
                    )
                  }
                  disabled={
                    creating
                  }
                />

                <strong>
                  Aadhaar Back
                </strong>

                <span
                  title={
                    aadhaarBack?.name ||
                    ""
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


        <div className="prototype-tenant-modal-footer">

          <button
            type="button"
            className="prototype-modal-cancel"
            onClick={
              handleClose
            }
            disabled={
              creating
            }
          >
            Cancel
          </button>


          <button
            type="submit"
            className="prototype-modal-submit"
            disabled={
              creating ||
              loadingRooms ||
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
  );


  if (modal) {
    return (
      <div
        className="prototype-modal-backdrop"
        onMouseDown={(
          event
        ) => {
          if (
            event.target ===
              event.currentTarget &&
            !creating
          ) {
            handleClose();
          }
        }}
      >
        {formContent}
      </div>
    );
  }


  return (
    <div className="prototype-modal-backdrop">
      {formContent}
    </div>
  );
}