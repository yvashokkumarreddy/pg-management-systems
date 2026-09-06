"use client";

import Link from "next/link";

import {
  usePathname,
} from "next/navigation";

import {
  Home,
  DoorOpen,
  Users,
  Wallet,
  Building2,
} from "lucide-react";


const items = [
  {
    label: "Home",
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
    label: "Rent",
    href: "/rent",
    icon: Wallet,
  },
  {
    label: "Profile",
    href: "/pg-profile",
    icon: Building2,
  },
];


export default function MobileNav() {
  const pathname =
    usePathname();


  function isActive(
    href
  ) {
    if (
      href === "/dashboard"
    ) {
      return (
        pathname ===
        "/dashboard"
      );
    }

    return (
      pathname === href ||
      pathname.startsWith(
        `${href}/`
      )
    );
  }


  return (
    <nav
      className="mobile-nav"
      aria-label="Mobile navigation"
    >
      {items.map(
        (item) => {
          const Icon =
            item.icon;

          const active =
            isActive(
              item.href
            );

          return (
            <Link
              key={
                item.href
              }
              href={
                item.href
              }
              className={`mobile-nav-link ${
                active
                  ? "active"
                  : ""
              }`}
              aria-current={
                active
                  ? "page"
                  : undefined
              }
            >
              <Icon
                size={20}
                strokeWidth={
                  active
                    ? 2.2
                    : 1.8
                }
              />

              <span>
                {
                  item.label
                }
              </span>
            </Link>
          );
        }
      )}
    </nav>
  );
}