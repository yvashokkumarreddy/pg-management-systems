"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  DoorOpen,
  Users,
  Menu,
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
    label: "More",
    href: "/pg-profile",
    icon: Menu,
  },
];

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="mobile-nav">
      {items.map((item) => {
        const Icon = item.icon;

        const active =
          item.href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`mobile-nav-link ${
              active ? "active" : ""
            }`}
          >
            <Icon size={20} />

            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}