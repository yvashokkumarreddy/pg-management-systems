"use client";

import { usePathname } from "next/navigation";
import { Building2, MapPin } from "lucide-react";

const routeTitles = {
  "/dashboard": "Dashboard",
  "/rooms": "Rooms",
  "/tenants": "Tenants",
  "/rent": "Rent & Payments",
  "/pg-profile": "PG Profile",
};

function getPageTitle(pathname) {
  if (pathname.startsWith("/rooms")) {
    return "Rooms";
  }

  if (pathname.startsWith("/tenants")) {
    return "Tenants";
  }

  if (pathname.startsWith("/rent")) {
    return "Rent & Payments";
  }

  if (pathname.startsWith("/pg-profile")) {
    return "PG Profile";
  }

  return routeTitles[pathname] || "Dashboard";
}

export default function TopBar({ property }) {
  const pathname = usePathname();
  const title = getPageTitle(pathname);

  return (
    <header className="top-bar">
      <div className="top-bar-title">
        <h1>{title}</h1>
      </div>

      {/* <div className="top-bar-property">
        <div className="top-bar-property-icon">
          <Building2 size={16} />
        </div>

        <div className="top-bar-property-content">
          <strong>
            {property?.pgName || "Your PG"}
          </strong>

          {property?.address ? (
            <span>
              <MapPin size={11} />
              {property.address}
            </span>
          ) : (
            <span>PG profile not configured</span>
          )}
        </div>
      </div> */}
    </header>
  );
}