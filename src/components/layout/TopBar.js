"use client";

import {
  usePathname,
} from "next/navigation";


const routeTitles = {
  "/dashboard":
    "Dashboard",

  "/rooms":
    "Rooms",

  "/tenants":
    "Tenants",

  "/rent":
    "Rent & Payments",

  "/pg-profile":
    "PG Profile",
};


function getPageTitle(
  pathname
) {
  if (
    pathname.startsWith(
      "/rooms"
    )
  ) {
    return "Rooms";
  }

  if (
    pathname.startsWith(
      "/tenants"
    )
  ) {
    return "Tenants";
  }

  if (
    pathname.startsWith(
      "/rent"
    )
  ) {
    return "Rent & Payments";
  }

  if (
    pathname.startsWith(
      "/pg-profile"
    )
  ) {
    return "PG Profile";
  }

  return (
    routeTitles[
      pathname
    ] ||
    "Dashboard"
  );
}


export default function TopBar() {
  const pathname =
    usePathname();

  const title =
    getPageTitle(
      pathname
    );


  return (
    <header className="top-bar">
      <div className="top-bar-title">
        <h1>
          {title}
        </h1>
      </div>
    </header>
  );
}