"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertTriangle,
  BedDouble,
  DoorOpen,
  MoreVertical,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  X,
} from "lucide-react";

import { apiRequest } from "@/lib/api/client";

const CAPACITY_OPTIONS = [2, 3, 5, 6];

/* -------------------------------------------------------
   Helpers
------------------------------------------------------- */

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function getRoomStatus(room) {
  if (room.status === "ARCHIVED") {
    return "ARCHIVED";
  }

  const capacity = Number(room.capacity || 0);

  const occupiedBeds = Number(
    room.occupiedBeds || 0
  );

  const vacantBeds =
    room.vacantBeds !== undefined &&
    room.vacantBeds !== null
      ? Number(room.vacantBeds)
      : Math.max(
          capacity - occupiedBeds,
          0
        );

  if (
    capacity > 0 &&
    vacantBeds === 0
  ) {
    return "FULL";
  }

  if (occupiedBeds === 0) {
    return "VACANT";
  }

  return "PARTIAL";
}

/* -------------------------------------------------------
   Room Modal
------------------------------------------------------- */

function RoomModal({
  room,
  saving,
  error,
  onClose,
  onSubmit,
}) {
  const [roomNumber, setRoomNumber] =
    useState(room?.roomNumber || "");

  const [floor, setFloor] =
    useState(room?.floor || "");

  const [capacity, setCapacity] =
    useState(
      String(room?.capacity || 2)
    );

  const [rentPerBed, setRentPerBed] =
    useState(
      room?.rentPerBed
        ? String(room.rentPerBed)
        : ""
    );

  const [notes, setNotes] =
    useState(room?.notes || "");

  function handleSubmit(event) {
    event.preventDefault();

    const cleanRoomNumber =
      roomNumber.trim();

    const rent =
      Number(rentPerBed);

    if (!cleanRoomNumber) {
      return;
    }

    if (
      !rentPerBed ||
      rent <= 0
    ) {
      return;
    }

    onSubmit({
      roomNumber: cleanRoomNumber,

      floor:
        floor.trim() || null,

      capacity:
        Number(capacity),

      rentPerBed: rent,

      notes:
        notes.trim() || null,
    });
  }

  return (
    <div
      className="pg-modal-backdrop"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }
      }}
    >
      <div className="pg-modal room-modal">
        <div className="pg-modal-header">
          <div>
            <h2>
              {room
                ? "Edit room"
                : "Add room"}
            </h2>

            <p>
              {room
                ? "Update room details and pricing."
                : "Add a room to your PG inventory."}
            </p>
          </div>

          <button
            type="button"
            className="pg-icon-button"
            onClick={onClose}
            disabled={saving}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="pg-modal-body">
            {error ? (
              <div className="rooms-form-error">
                <AlertTriangle
                  size={16}
                />

                <span>
                  {error}
                </span>
              </div>
            ) : null}

            <div className="room-form-grid">
              {/* Room Number */}

              <div className="pg-field">
                <label htmlFor="roomNumber">
                  Room number
                </label>

                <input
                  id="roomNumber"
                  type="text"
                  className="pg-input"
                  value={roomNumber}
                  onChange={(event) =>
                    setRoomNumber(
                      event.target.value
                    )
                  }
                  placeholder="e.g. 101"
                  disabled={saving}
                  required
                  autoFocus
                />
              </div>

              {/* Floor */}

              <div className="pg-field">
                <label htmlFor="floor">
                  Floor

                  <span className="room-optional">
                    Optional
                  </span>
                </label>

                <input
                  id="floor"
                  type="text"
                  className="pg-input"
                  value={floor}
                  onChange={(event) =>
                    setFloor(
                      event.target.value
                    )
                  }
                  placeholder="e.g. Ground Floor"
                  disabled={saving}
                />
              </div>

              {/* Capacity */}

              <div className="pg-field">
                <label htmlFor="capacity">
                  Bed capacity
                </label>

                <select
                  id="capacity"
                  className="pg-input"
                  value={capacity}
                  onChange={(event) =>
                    setCapacity(
                      event.target.value
                    )
                  }
                  disabled={saving}
                >
                  {CAPACITY_OPTIONS.map(
                    (value) => (
                      <option
                        key={value}
                        value={String(
                          value
                        )}
                      >
                        {value} beds
                      </option>
                    )
                  )}
                </select>

                {room ? (
                  <small className="rooms-field-help">
                    Cannot be lower
                    than current
                    occupancy.
                  </small>
                ) : null}
              </div>

              {/* Rent */}

              <div className="pg-field">
                <label htmlFor="rentPerBed">
                  Rent per bed
                </label>

                <div className="room-money-input">
                  <span>₹</span>

                  <input
                    id="rentPerBed"
                    type="number"
                    min="1"
                    step="1"
                    value={rentPerBed}
                    onChange={(event) =>
                      setRentPerBed(
                        event.target
                          .value
                      )
                    }
                    placeholder="5000"
                    disabled={saving}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Notes */}

            <div className="pg-field room-notes-field">
              <label htmlFor="notes">
                Notes

                <span className="room-optional">
                  Optional
                </span>
              </label>

              <textarea
                id="notes"
                className="pg-input room-notes-input"
                value={notes}
                onChange={(event) =>
                  setNotes(
                    event.target.value
                  )
                }
                placeholder="Any additional information about this room..."
                disabled={saving}
                rows={3}
              />
            </div>
          </div>

          <div className="pg-modal-footer">
            <button
              type="button"
              className="pg-button pg-button-secondary"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="pg-button pg-button-primary"
              disabled={
                saving ||
                !roomNumber.trim() ||
                !rentPerBed ||
                Number(rentPerBed) <=
                  0
              }
            >
              {saving
                ? "Saving..."
                : room
                  ? "Save changes"
                  : "Add room"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* -------------------------------------------------------
   Rooms Page
------------------------------------------------------- */

export default function RoomsPage() {
  const [rooms, setRooms] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [pageError, setPageError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState("ACTIVE");

  const [
    modalOpen,
    setModalOpen,
  ] = useState(false);

  const [
    editingRoom,
    setEditingRoom,
  ] = useState(null);

  const [saving, setSaving] =
    useState(false);

  const [
    formError,
    setFormError,
  ] = useState("");

  const [
    openMenuId,
    setOpenMenuId,
  ] = useState(null);

  const [
    archivingId,
    setArchivingId,
  ] = useState(null);

  /* -----------------------------------------------------
     Fetch Rooms
  ----------------------------------------------------- */

  useEffect(() => {
    let cancelled = false;

    async function fetchRooms() {
      try {
        const response =
          await apiRequest(
            "/api/rooms?includeArchived=true"
          );
          console.log("ROOMS API RESPONSE:", response);

        if (!cancelled) {
          setRooms(
            response.data || []
          );

          setPageError("");
        }
      } catch (error) {
        if (!cancelled) {
          setPageError(
            error.message ||
              "Unable to load rooms."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchRooms();

    return () => {
      cancelled = true;
    };
  }, []);

  /* -----------------------------------------------------
     Filtered Rooms
  ----------------------------------------------------- */

  const visibleRooms =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      return rooms.filter(
        (room) => {
          const matchesSearch =
            !query ||
            String(
              room.roomNumber ||
                ""
            )
              .toLowerCase()
              .includes(query);

          let matchesStatus =
            true;

          if (
            statusFilter ===
            "ACTIVE"
          ) {
            matchesStatus =
              room.status !==
              "ARCHIVED";
          }

          if (
            statusFilter ===
            "ARCHIVED"
          ) {
            matchesStatus =
              room.status ===
              "ARCHIVED";
          }

          return (
            matchesSearch &&
            matchesStatus
          );
        }
      );
    }, [
      rooms,
      search,
      statusFilter,
    ]);

  /* -----------------------------------------------------
     Summary
  ----------------------------------------------------- */

  const summary = useMemo(() => {
    return rooms.reduce(
      (result, room) => {
        if (
          room.status ===
          "ARCHIVED"
        ) {
          return result;
        }

        const capacity =
          Number(
            room.capacity || 0
          );

        const occupiedBeds =
          Number(
            room.occupiedBeds || 0
          );

        const vacantBeds =
          room.vacantBeds !==
            undefined &&
          room.vacantBeds !== null
            ? Number(
                room.vacantBeds
              )
            : Math.max(
                capacity -
                  occupiedBeds,
                0
              );

        result.totalRooms +=
          1;

        result.totalBeds +=
          capacity;

        result.occupiedBeds +=
          occupiedBeds;

        result.availableBeds +=
          vacantBeds;

        return result;
      },
      {
        totalRooms: 0,
        totalBeds: 0,
        occupiedBeds: 0,
        availableBeds: 0,
      }
    );
  }, [rooms]);

  /* -----------------------------------------------------
     Modal
  ----------------------------------------------------- */

  function openCreateModal() {
    setEditingRoom(null);
    setFormError("");
    setModalOpen(true);
    setOpenMenuId(null);
  }

  function openEditModal(room) {
    setEditingRoom(room);
    setFormError("");
    setModalOpen(true);
    setOpenMenuId(null);
  }

  function closeModal() {
    if (saving) {
      return;
    }

    setModalOpen(false);
    setEditingRoom(null);
    setFormError("");
  }

  /* -----------------------------------------------------
     Create / Update
  ----------------------------------------------------- */

  async function handleSave(
    values
  ) {
    try {
      setSaving(true);
      setFormError("");

      if (editingRoom) {
        const response =
          await apiRequest(
            `/api/rooms/${editingRoom.id}`,
            {
              method: "PATCH",

              body: JSON.stringify(
                values
              ),
            }
          );

        setRooms((current) =>
          current.map((room) =>
            room.id ===
            editingRoom.id
              ? {
                  ...room,
                  ...response.data,
                }
              : room
          )
        );
      } else {
        const response =
          await apiRequest(
            "/api/rooms",
            {
              method: "POST",

              body: JSON.stringify(
                values
              ),
            }
          );

        const newRoom = {
          ...response.data,

          occupiedBeds:
            Number(
              response.data
                ?.occupiedBeds || 0
            ),

          vacantBeds:
            response.data
              ?.vacantBeds !==
              undefined
              ? Number(
                  response.data
                    .vacantBeds
                )
              : Number(
                  response.data
                    ?.capacity || 0
                ),
        };

        setRooms((current) => [
          newRoom,
          ...current,
        ]);
      }

      setModalOpen(false);
      setEditingRoom(null);
      setFormError("");
    } catch (error) {
      setFormError(
        error.data?.message ||
          error.message ||
          "Unable to save room."
      );
    } finally {
      setSaving(false);
    }
  }

  /* -----------------------------------------------------
     Archive / Delete
  ----------------------------------------------------- */

  async function handleArchive(
    room
  ) {
    if (
      Number(
        room.occupiedBeds || 0
      ) > 0
    ) {
      setPageError(
        `Room ${room.roomNumber} cannot be deleted while it has occupied beds.`
      );

      return;
    }

    const confirmed =
      window.confirm(
        `Delete Room ${room.roomNumber}?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setArchivingId(
        room.id
      );

      setPageError("");
      setOpenMenuId(null);

      await apiRequest(
        `/api/rooms/${room.id}`,
        {
          method: "DELETE",
        }
      );

      /*
       * Do NOT remove the room from state.
       * It is archived, not physically deleted.
       *
       * This allows the user to immediately
       * switch to "Archived rooms" and restore it.
       */
      setRooms((current) =>
        current.map((item) =>
          item.id === room.id
            ? {
                ...item,
                status:
                  "ARCHIVED",
              }
            : item
        )
      );
    } catch (error) {
      setPageError(
        error.message ||
          "Unable to delete room."
      );
    } finally {
      setArchivingId(null);
    }
  }

  /* -----------------------------------------------------
     Restore Archived Room
  ----------------------------------------------------- */

  async function handleRestore(
    room
  ) {
    const confirmed =
      window.confirm(
        `Restore Room ${room.roomNumber}?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setArchivingId(
        room.id
      );

      setPageError("");
      setOpenMenuId(null);

      const response =
        await apiRequest(
          `/api/rooms/${room.id}`,
          {
            method: "PATCH",

            body: JSON.stringify({
              status: "ACTIVE",
            }),
          }
        );

      /*
       * Merge response into existing room so
       * occupancy values are not accidentally
       * lost if PATCH returns only room fields.
       */
      setRooms((current) =>
        current.map((item) =>
          item.id === room.id
            ? {
                ...item,
                ...response.data,
                status: "ACTIVE",
              }
            : item
        )
      );
    } catch (error) {
      setPageError(
        error.message ||
          "Unable to restore room."
      );
    } finally {
      setArchivingId(null);
    }
  }

  /* -----------------------------------------------------
     Loading
  ----------------------------------------------------- */

  if (loading) {
    return (
      <div className="rooms-loading-grid">
        <div />
        <div />
        <div />
        <div />
      </div>
    );
  }

  /* -----------------------------------------------------
     Render
  ----------------------------------------------------- */

  return (
    <div className="rooms-page">
      {/* Heading */}

      <div className="rooms-page-heading">
        <div>
          <h2>Rooms</h2>

          <p>
            Manage room capacity
            and current bed
            availability.
          </p>
        </div>

        <button
          type="button"
          className="pg-button pg-button-primary"
          onClick={
            openCreateModal
          }
        >
          <Plus size={17} />
          Add room
        </button>
      </div>

      {/* Page Error */}

      {pageError ? (
        <div className="rooms-page-error">
          <AlertTriangle
            size={16}
          />

          <span>
            {pageError}
          </span>

          <button
            type="button"
            onClick={() =>
              setPageError("")
            }
          >
            <X size={15} />
          </button>
        </div>
      ) : null}

      {/* Summary */}

      <section className="rooms-summary-grid">
        <div className="dashboard-card rooms-summary-card">
          <span>
            Total rooms
          </span>

          <strong>
            {summary.totalRooms}
          </strong>

          <DoorOpen
            size={19}
          />
        </div>

        <div className="dashboard-card rooms-summary-card">
          <span>
            Total beds
          </span>

          <strong>
            {summary.totalBeds}
          </strong>

          <BedDouble
            size={19}
          />
        </div>

        <div className="dashboard-card rooms-summary-card">
          <span>
            Occupied beds
          </span>

          <strong>
            {
              summary.occupiedBeds
            }
          </strong>

          <BedDouble
            size={19}
          />
        </div>

        <div className="dashboard-card rooms-summary-card">
          <span>
            Available beds
          </span>

          <strong>
            {
              summary.availableBeds
            }
          </strong>

          <BedDouble
            size={19}
          />
        </div>
      </section>

      {/* Room Inventory */}

      <section className="dashboard-card rooms-content-card">
      <div className="rooms-toolbar">
        <div className="rooms-toolbar-heading">
          <h3>Room inventory</h3>

          <p>
            {visibleRooms.length}{" "}
            {visibleRooms.length === 1
              ? "room"
              : "rooms"}
          </p>
        </div>

        <div className="rooms-toolbar-actions">
          <div className="rooms-search">
            <Search size={15} />

            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search room number"
            />
          </div>

          <select
            className="prototype-room-filter"
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value);
              setOpenMenuId(null);
            }}
          >
            <option value="ACTIVE">
              Active rooms
            </option>

            <option value="ARCHIVED">
              Archived rooms
            </option>

            <option value="ALL">
              All rooms
            </option>
          </select>
        </div>
      </div>

        {/* Room Cards */}

        {visibleRooms.length >
        0 ? (
          <div className="rooms-grid">
            {visibleRooms.map(
              (room) => {
                const status =
                  getRoomStatus(
                    room
                  );

                const capacity =
                  Number(
                    room.capacity ||
                      0
                  );

                const occupiedBeds =
                  Number(
                    room.occupiedBeds ||
                      0
                  );

                const vacantBeds =
                  room.vacantBeds !==
                    undefined &&
                  room.vacantBeds !==
                    null
                    ? Number(
                        room.vacantBeds
                      )
                    : Math.max(
                        capacity -
                          occupiedBeds,
                        0
                      );

                const rentPerBed =
                  Number(
                    room.rentPerBed ||
                      0
                  );

                const isArchived =
                  room.status ===
                  "ARCHIVED";

                const isProcessing =
                  archivingId ===
                  room.id;

                return (
                  <article
                    key={room.id}
                    className={`prototype-room-card ${
                      isArchived
                        ? "prototype-room-card-archived"
                        : ""
                    }`}
                  >
                    {/* Card Header */}

                    <div className="prototype-room-card-top">
                      <div className="prototype-room-main-info">
                        <h3>
                          {
                            room.roomNumber
                          }
                        </h3>

                        <div className="prototype-room-meta">
                          <span>
                            Capacity:{" "}
                            {
                              capacity
                            }{" "}
                            {capacity ===
                            1
                              ? "bed"
                              : "beds"}
                          </span>

                          <span className="prototype-room-dot">
                            •
                          </span>

                          <strong>
                            {formatCurrency(
                              rentPerBed
                            )}
                          </strong>

                          <span>
                            per bed
                          </span>
                        </div>

                        {room.floor ? (
                          <span className="prototype-room-floor">
                            Floor:{" "}
                            {
                              room.floor
                            }
                          </span>
                        ) : null}
                      </div>

                      {/* Status + Menu */}

                      <div className="prototype-room-actions">
                        <span
                          className={`prototype-room-status prototype-room-status-${status.toLowerCase()}`}
                        >
                          {status}
                        </span>

                        <div className="prototype-room-menu-wrapper">
                          <button
                            type="button"
                            className="prototype-room-menu-button"
                            aria-label={`Room ${room.roomNumber} actions`}
                            aria-expanded={
                              openMenuId ===
                              room.id
                            }
                            onClick={() =>
                              setOpenMenuId(
                                (
                                  current
                                ) =>
                                  current ===
                                  room.id
                                    ? null
                                    : room.id
                              )
                            }
                          >
                            <MoreVertical
                              size={18}
                            />
                          </button>

                          {openMenuId ===
                          room.id ? (
                            <div className="prototype-room-menu">
                              {isArchived ? (
                                /* Archived room menu */

                                <button
                                  type="button"
                                  disabled={
                                    isProcessing
                                  }
                                  onClick={() =>
                                    handleRestore(
                                      room
                                    )
                                  }
                                >
                                  <RotateCcw
                                    size={
                                      14
                                    }
                                  />

                                  {isProcessing
                                    ? "Restoring..."
                                    : "Restore room"}
                                </button>
                              ) : (
                                /* Active room menu */

                                <>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      openEditModal(
                                        room
                                      )
                                    }
                                  >
                                    <Pencil
                                      size={
                                        14
                                      }
                                    />

                                    Edit
                                    room
                                  </button>

                                  <button
                                    type="button"
                                    className="prototype-room-delete"
                                    disabled={
                                      isProcessing
                                    }
                                    onClick={() =>
                                      handleArchive(
                                        room
                                      )
                                    }
                                  >
                                    <Trash2
                                      size={
                                        14
                                      }
                                    />

                                    {isProcessing
                                      ? "Deleting..."
                                      : "Delete room"}
                                  </button>
                                </>
                              )}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    {/* Bed Indicators */}

                    <div className="prototype-bed-list">
                      {Array.from({
                        length:
                          capacity,
                      }).map(
                        (
                          _,
                          index
                        ) => (
                          <span
                            key={
                              index
                            }
                            className={
                              index <
                              occupiedBeds
                                ? "prototype-bed prototype-bed-occupied"
                                : "prototype-bed"
                            }
                          />
                        )
                      )}
                    </div>

                    <div className="prototype-room-divider" />

                    {/* Footer */}

                    <div className="prototype-room-footer">
                      <span>
                        {
                          occupiedBeds
                        }{" "}
                        occupied
                      </span>

                      <strong>
                        {
                          vacantBeds
                        }{" "}
                        available
                      </strong>
                    </div>
                  </article>
                );
              }
            )}
          </div>
        ) : (
          /* Empty State */

          <div className="rooms-empty">
            <DoorOpen
              size={28}
            />

            <strong>
              {search
                ? "No matching rooms"
                : statusFilter ===
                    "ARCHIVED"
                  ? "No archived rooms"
                  : "No rooms yet"}
            </strong>

            <p>
              {search
                ? "Try another room number."
                : statusFilter ===
                    "ARCHIVED"
                  ? "Rooms you delete will appear here and can be restored later."
                  : "Add your first room to start tracking bed occupancy."}
            </p>

            {!search &&
            statusFilter !==
              "ARCHIVED" ? (
              <button
                type="button"
                className="pg-button pg-button-primary"
                onClick={
                  openCreateModal
                }
              >
                <Plus
                  size={16}
                />

                Add room
              </button>
            ) : null}
          </div>
        )}
      </section>

      {/* Modal */}

      {modalOpen ? (
        <RoomModal
          key={
            editingRoom?.id ||
            "new-room"
          }
          room={editingRoom}
          saving={saving}
          error={formError}
          onClose={closeModal}
          onSubmit={handleSave}
        />
      ) : null}
    </div>
  );
}