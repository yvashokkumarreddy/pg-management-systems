"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  DoorOpen,
  Users,
  Wallet,
  Building2,
  LogOut,
} from "lucide-react";
import { apiRequest } from "@/lib/api/client";

const navigation = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: Home,
  },
  {
    label: "Rooms",
    href: "/rooms",
    icon: DoorOpen,
  },
  {
    label: "Tenants",
    href: "/tenants",
    icon: Users,
  },
  {
    label: "Rent & Payments",
    href: "/rent",
    icon: Wallet,
  },
  {
    label: "PG Profile",
    href: "/pg-profile",
    icon: Building2,
  },
];

export default function Sidebar({ owner }) {
  const pathname = usePathname();
  const router = useRouter();

  function isActive(href) {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }

    return pathname.startsWith(href);
  }

  async function logout() {
    try {
      await apiRequest("/api/auth/logout", {
        method: "POST",
      });
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }

  const ownerName =
    owner?.name || owner?.email || "PG Owner";

  const initials = ownerName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-brand-mark">PG</div>

        <div>
          <strong>PG Manager</strong>
          <span>Owner workspace</span>
        </div>
      </div>

      <div className="sidebar-section">
        Operations
      </div>

      <nav className="sidebar-nav">
        {navigation.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-link ${
                isActive(item.href) ? "active" : ""
              }`}
            >
              <Icon size={18} />

              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">
            {initials}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <strong
              style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {ownerName}
            </strong>

            <span>Owner · Active</span>
          </div>

          <button
            type="button"
            onClick={logout}
            title="Logout"
            style={{
              border: 0,
              background: "transparent",
              color: "#858a90",
              padding: "6px",
            }}
          >
            <LogOut size={17} />
          </button>
        </div>
      </div>
    </aside>
  );
}