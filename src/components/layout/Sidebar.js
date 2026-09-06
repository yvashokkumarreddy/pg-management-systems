"use client";

import {
  useState,
} from "react";

import Link from "next/link";

import {
  usePathname,
  useRouter,
} from "next/navigation";

import {
  Home,
  DoorOpen,
  Users,
  Wallet,
  Building2,
  LogOut,
} from "lucide-react";

import {
  apiRequest,
} from "@/lib/api/client";


const navigation = [
  {
    label:
      "Dashboard",
    href:
      "/dashboard",
    icon:
      Home,
  },
  {
    label:
      "Rooms",
    href:
      "/rooms",
    icon:
      DoorOpen,
  },
  {
    label:
      "Tenants",
    href:
      "/tenants",
    icon:
      Users,
  },
  {
    label:
      "Rent & Payments",
    href:
      "/rent",
    icon:
      Wallet,
  },
  {
    label:
      "PG Profile",
    href:
      "/pg-profile",
    icon:
      Building2,
  },
];


export default function Sidebar({
  owner,
}) {
  const pathname =
    usePathname();

  const router =
    useRouter();

  const [
    loggingOut,
    setLoggingOut,
  ] = useState(false);


  function isActive(
    href
  ) {
    if (
      href ===
      "/dashboard"
    ) {
      return (
        pathname ===
        "/dashboard"
      );
    }

    return pathname.startsWith(
      href
    );
  }


  async function logout() {
    if (loggingOut) {
      return;
    }

    try {
      setLoggingOut(
        true
      );

      await apiRequest(
        "/api/auth/logout",
        {
          method:
            "POST",
        }
      );

      router.replace(
        "/login"
      );

      router.refresh();
    } catch (error) {
      console.error(
        "Logout failed:",
        error
      );

      setLoggingOut(
        false
      );
    }
  }


  const ownerName =
    owner?.name ||
    owner?.email ||
    "PG Owner";


  const initials =
    ownerName
      .split(" ")
      .filter(Boolean)
      .map(
        (part) =>
          part[0]
      )
      .join("")
      .slice(0, 2)
      .toUpperCase();


  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-brand-mark">
          PG
        </div>

        <div>
          <strong>
            PG Manager
          </strong>

          <span>
            Owner workspace
          </span>
        </div>
      </div>


      <div className="sidebar-section">
        Operations
      </div>


      <nav className="sidebar-nav">
        {navigation.map(
          (item) => {
            const Icon =
              item.icon;

            return (
              <Link
                key={
                  item.href
                }
                href={
                  item.href
                }
                className={`sidebar-link ${
                  isActive(
                    item.href
                  )
                    ? "active"
                    : ""
                }`}
              >
                <Icon
                  size={
                    18
                  }
                />

                {
                  item.label
                }
              </Link>
            );
          }
        )}
      </nav>


      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">
            {
              initials
            }
          </div>

          <div
            style={{
              flex:
                1,
              minWidth:
                0,
            }}
          >
            <strong
              style={{
                overflow:
                  "hidden",
                textOverflow:
                  "ellipsis",
                whiteSpace:
                  "nowrap",
              }}
            >
              {
                ownerName
              }
            </strong>

            <span>
              Owner · Active
            </span>
          </div>

          <button
            type="button"
            onClick={
              logout
            }
            disabled={
              loggingOut
            }
            title={
              loggingOut
                ? "Logging out..."
                : "Logout"
            }
            aria-label="Logout"
            style={{
              border:
                0,
              background:
                "transparent",
              color:
                "#858a90",
              padding:
                "6px",
              cursor:
                loggingOut
                  ? "wait"
                  : "pointer",
              opacity:
                loggingOut
                  ? 0.6
                  : 1,
            }}
          >
            <LogOut
              size={
                17
              }
            />
          </button>
        </div>
      </div>
    </aside>
  );
}