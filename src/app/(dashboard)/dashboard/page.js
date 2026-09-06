"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Users,
  BedDouble,
  IndianRupee,
  AlertTriangle,
  Plus,
  DoorOpen,
  Wallet,
  Building2,
  ArrowRight,
  MapPin,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api/client";

function formatCurrency(value) {
  const amount = Number(value || 0);

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function MetricCard({
  label,
  value,
  footer,
  icon: Icon,
  danger = false,
}) {
  return (
    <div className="dashboard-card metric-card">
      <div className="metric-card-top">
        <div>
          <p className="metric-label">{label}</p>

          <h3
            className={`metric-value ${
              danger ? "metric-value-danger" : ""
            }`}
          >
            {value}
          </h3>
        </div>

        <div className="metric-icon">
          <Icon size={19} />
        </div>
      </div>

      {footer ? <p className="metric-footer">{footer}</p> : null}
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();

  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function fetchDashboard() {
      try {
        const response = await apiRequest("/api/dashboard");

        if (!cancelled) {
          setDashboard(response.data);
          setError("");
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.message ||
              "Unable to load dashboard. Please try again."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchDashboard();

    return () => {
      cancelled = true;
    };
  }, []);

  async function retryDashboard() {
    try {
      setLoading(true);
      setError("");

      const response = await apiRequest("/api/dashboard");

      setDashboard(response.data);
    } catch (err) {
      setError(
        err.message ||
          "Unable to load dashboard. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  const occupancyPercent = useMemo(() => {
    if (!dashboard?.rooms?.totalBeds) {
      return 0;
    }

    return Math.round(
      (dashboard.rooms.occupiedBeds /
        dashboard.rooms.totalBeds) *
        100
    );
  }, [dashboard]);

  const collectionPercent = useMemo(() => {
    if (!dashboard?.rent) {
      return 0;
    }

    const collected = Number(
      dashboard.rent.collectedThisMonth || 0
    );

    const outstanding = Number(
      dashboard.rent.outstandingAmount || 0
    );

    const total = collected + outstanding;

    if (!total) {
      return 0;
    }

    return Math.round((collected / total) * 100);
  }, [dashboard]);

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="dashboard-loading-block" />

        <div className="dashboard-loading-grid">
          <div />
          <div />
          <div />
          <div />
        </div>

        <div className="dashboard-loading-columns">
          <div />
          <div />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-card dashboard-error">
        <AlertTriangle size={28} />

        <h2>Dashboard unavailable</h2>

        <p>{error}</p>

        <button
          type="button"
          className="pg-button pg-button-primary"
          onClick={retryDashboard}
        >
          Try again
        </button>
      </div>
    );
  }

  if (!dashboard) {
    return null;
  }

  const { property, rooms, tenants, rent } = dashboard;

  const recentPayments = dashboard.recentPayments || [];
  const overdueBills = dashboard.overdueBills || [];

  return (
    <div className="dashboard-page">
    <div className="dashboard-page-heading">
    <div>
      <div className="dashboard-property-info">
        <div className="dashboard-property-details">
          <h2 className="dashboard-pg-title">
            <Building2 size={25} />
            <span>{property?.pgName || "Your PG"}</span>
          </h2>

          <div className="dashboard-property-location">
            {property?.address ? (
              <>
                <MapPin size={20} />
                <span>{property.address}</span>
              </>
            ) : (
              <span>
                Add your PG details from PG Profile
              </span>
            )}
          </div>
        </div>
      </div>

      {/* <p className="dashboard-property-description">
        Occupancy, tenants and rent activity from your
        current PG data.
      </p> */}
    </div>

      <button
        type="button"
        className="pg-button pg-button-primary"
       onClick={() => router.push("/tenants/new")}
      >
        <Plus size={17} />
        Add tenant
      </button>
    </div>

      <section className="dashboard-summary-grid">
        <div className="dashboard-hero-card">
          <div>
            <span className="dashboard-eyebrow">
              Today&apos;s operating picture
            </span>

            <h1>
              Your PG is {occupancyPercent}% occupied and
              collections are at {collectionPercent}%.
            </h1>

            <p>
              {rooms.availableBeds}{" "}
              {rooms.availableBeds === 1 ? "bed is" : "beds are"}{" "}
              currently available across {rooms.total}{" "}
              {rooms.total === 1 ? "room" : "rooms"}.
              {Number(rent.overdueAmount) > 0
                ? ` ${formatCurrency(
                    rent.overdueAmount
                  )} is currently overdue.`
                : " No rent is currently overdue."}
            </p>

            <div className="dashboard-hero-actions">
              <button
                type="button"
                className="dashboard-secondary-button"
                onClick={() => router.push("/rooms")}
              >
                Review vacancy
              </button>

              <button
                type="button"
                className="dashboard-secondary-button"
                onClick={() => router.push("/rent")}
              >
                Open collections
              </button>
            </div>
          </div>
        </div>

        <div className="dashboard-card collection-health-card">
          <div className="collection-health-heading">
            <div>
              <p className="metric-label">
                Collection health
              </p>

              <strong>Current cycle</strong>
            </div>

            <span
              className={`dashboard-status-badge ${
                collectionPercent >= 90
                  ? "status-success"
                  : collectionPercent >= 70
                    ? "status-warning"
                    : "status-danger"
              }`}
            >
              {collectionPercent >= 90
                ? "Healthy"
                : collectionPercent >= 70
                  ? "Moderate"
                  : "Follow-up"}
            </span>
          </div>

          <div
            className="collection-ring"
            style={{
              background: `conic-gradient(
                var(--primary) 0 ${collectionPercent}%,
                #eceae4 ${collectionPercent}% 100%
              )`,
            }}
          >
            <div className="collection-ring-inner">
              {collectionPercent}%
            </div>
          </div>

          <div className="collection-health-footer">
            <span>
              {formatCurrency(rent.collectedThisMonth)} collected
            </span>

            <span>
              {formatCurrency(rent.outstandingAmount)} open
            </span>
          </div>
        </div>
      </section>

      <section className="dashboard-quick-actions">
        <button
          type="button"
          className="quick-action-card"
         onClick={() => router.push("/tenants/new")}
        >
          <span className="quick-action-icon">
            <Plus size={18} />
          </span>

          <span>
            <strong>Add tenant</strong>
            <small>Create resident account</small>
          </span>
        </button>

        <button
          type="button"
          className="quick-action-card"
          onClick={() => router.push("/rooms")}
        >
          <span className="quick-action-icon">
            <DoorOpen size={18} />
          </span>

          <span>
            <strong>Manage rooms</strong>
            <small>Review capacity</small>
          </span>
        </button>

        <button
          type="button"
          className="quick-action-card"
          onClick={() => router.push("/rent")}
        >
          <span className="quick-action-icon">
            <Wallet size={18} />
          </span>

          <span>
            <strong>Record payment</strong>
            <small>Update rent bill</small>
          </span>
        </button>

        <button
          type="button"
          className="quick-action-card"
          onClick={() => router.push("/pg-profile")}
        >
          <span className="quick-action-icon">
            <Building2 size={18} />
          </span>

          <span>
            <strong>PG profile</strong>
            <small>Manage public listing</small>
          </span>
        </button>
      </section>

      <section className="dashboard-metrics-grid">
        <MetricCard
          label="Current tenants"
          value={tenants.current}
          footer={`${tenants.active} active · ${tenants.noticePeriod} notice period`}
          icon={Users}
        />

        <MetricCard
          label="Available beds"
          value={rooms.availableBeds}
          footer={`${rooms.occupiedBeds} occupied · ${rooms.totalBeds} total`}
          icon={BedDouble}
        />

        <MetricCard
          label="Collected this month"
          value={formatCurrency(rent.collectedThisMonth)}
          footer={`${collectionPercent}% collection health`}
          icon={IndianRupee}
        />

        <MetricCard
          label="Outstanding"
          value={formatCurrency(rent.outstandingAmount)}
          footer={`${formatCurrency(
            rent.overdueAmount
          )} overdue`}
          icon={AlertTriangle}
          danger={Number(rent.overdueAmount) > 0}
        />
      </section>

      <section className="dashboard-main-grid">
        <div className="dashboard-card">
          <div className="dashboard-card-heading">
            <div>
              <h3>Recent payments</h3>

              <p>
                Latest manually recorded rent payments.
              </p>
            </div>

            <button
              type="button"
              className="dashboard-link-button"
              onClick={() => router.push("/rent")}
            >
              View all
              <ArrowRight size={15} />
            </button>
          </div>

          {recentPayments.length > 0 ? (
            <div className="dashboard-table-wrapper">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Tenant</th>
                    <th>Amount</th>
                    <th>Mode</th>
                    <th>Date</th>
                  </tr>
                </thead>

                <tbody>
                  {recentPayments.map((payment,index) => {
                    const tenantName =
                      payment.tenantName ||
                      payment.tenant?.name ||
                      payment.name ||
                      "Tenant";

                    const roomNumber =
                      payment.roomNumber ||
                      payment.room?.roomNumber ||
                      payment.tenant?.roomNumber ||
                      null;

                    const amount =
                      payment.amount ||
                      payment.paymentAmount ||
                      0;

                    const paymentMode =
                      payment.paymentMode ||
                      payment.mode ||
                      "—";

                    const paymentDate =
                      payment.paymentDate ||
                      payment.date ||
                      payment.createdAt ||
                      "—";

                    return (
                      <tr
              key={
                        payment.id ||
                        payment.paymentId ||
                        `${payment.tenantId || "tenant"}-${
                          payment.paymentDate ||
                          payment.date ||
                          payment.createdAt ||
                          "payment"
                        }-${index}`
                      }
                    >
                        <td>
                          <strong>{tenantName}</strong>

                          {roomNumber ? (
                            <small>
                              Room {roomNumber}
                            </small>
                          ) : null}
                        </td>

                        <td>
                          {formatCurrency(amount)}
                        </td>

                        <td>
                          <span className="dashboard-neutral-badge">
                            {paymentMode}
                          </span>
                        </td>

                        <td>{paymentDate}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="dashboard-empty-state">
              <Wallet size={24} />

              <strong>No payments yet</strong>

              <p>
                Recorded payments will appear here.
              </p>
            </div>
          )}
        </div>

        <div className="dashboard-card">
          <div className="dashboard-card-heading">
            <div>
              <h3>Needs attention</h3>

              <p>
                Overdue bills requiring follow-up.
              </p>
            </div>

            {overdueBills.length > 0 ? (
              <span className="dashboard-status-badge status-danger">
                {overdueBills.length}{" "}
                {overdueBills.length === 1
                  ? "item"
                  : "items"}
              </span>
            ) : null}
          </div>

          {overdueBills.length > 0 ? (
            <div className="attention-list">
              {overdueBills.slice(0, 5).map((bill) => {
                const tenantName =
                  bill.tenantName ||
                  bill.tenant?.name ||
                  "Tenant";

                const roomNumber =
                  bill.roomNumber ||
                  bill.room?.roomNumber ||
                  bill.tenant?.roomNumber ||
                  null;

                const balanceAmount =
                  bill.balanceAmount ||
                  bill.balance ||
                  bill.amountDue ||
                  bill.outstandingAmount ||
                  0;

                return (
                  <div key={
                      bill.id ||
                      bill.billId ||
                      `${bill.tenantId || "tenant"}-${
                        bill.dueDate ||
                        bill.date ||
                        bill.createdAt ||
                        "bill"
                      }-${index}`
                    }
                    className="attention-row"
                  >
                    <div>
                      <strong>{tenantName}</strong>

                      <small>
                        {formatCurrency(balanceAmount)} overdue
                        {roomNumber
                          ? ` · Room ${roomNumber}`
                          : ""}
                      </small>
                    </div>

                    <button
                      type="button"
                      className="dashboard-outline-button"
                      onClick={() => router.push("/rent")}
                    >
                      View
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="dashboard-empty-state">
              <span className="dashboard-empty-success">
                ✓
              </span>

              <strong>Nothing overdue</strong>

              <p>
                There are no overdue rent bills
                requiring action.
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="dashboard-card occupancy-card">
        <div className="dashboard-card-heading">
          <div>
            <h3>Occupancy snapshot</h3>

            <p>
              Current bed utilization across active rooms.
            </p>
          </div>

          <button
            type="button"
            className="dashboard-link-button"
            onClick={() => router.push("/rooms")}
          >
            Manage rooms
            <ArrowRight size={15} />
          </button>
        </div>

        <div className="occupancy-content">
          <div className="occupancy-summary-line">
            <strong>
              {rooms.occupiedBeds} of {rooms.totalBeds} beds
              occupied
            </strong>

            <span>{occupancyPercent}%</span>
          </div>

          <div className="occupancy-progress">
            <span
              style={{
                width: `${occupancyPercent}%`,
              }}
            />
          </div>

          <div className="occupancy-stats">
            <div>
              <strong>{rooms.total}</strong>
              <span>Total rooms</span>
            </div>

            <div>
              <strong>{rooms.occupied}</strong>
              <span>Occupied rooms</span>
            </div>

            <div>
              <strong>{rooms.vacant}</strong>
              <span>Vacant rooms</span>
            </div>

            <div>
              <strong>{rooms.availableBeds}</strong>
              <span>Available beds</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}