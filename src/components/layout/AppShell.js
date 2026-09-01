"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import MobileNav from "./MobileNav";

import {
  apiRequest,
} from "@/lib/api/client";


export default function AppShell({
  children,
}) {
  const router =
    useRouter();

  const [
    owner,
    setOwner,
  ] = useState(null);

  const [
    property,
    setProperty,
  ] = useState(null);

  const [
    loading,
    setLoading,
  ] = useState(true);


  useEffect(() => {
    let cancelled =
      false;


    async function loadShell() {
      try {
        const meResponse =
          await apiRequest(
            "/api/auth/me"
          );


        if (cancelled) {
          return;
        }


        setOwner(
          meResponse.data
        );


        try {
          const profileResponse =
            await apiRequest(
              "/api/pg-profile"
            );


          if (!cancelled) {
            setProperty(
              profileResponse.data ||
                null
            );
          }
        } catch {
          if (!cancelled) {
            setProperty(null);
          }
        }
      } catch (error) {
        if (cancelled) {
          return;
        }


        if (
          error?.status ===
            401 ||
          error?.status ===
            403
        ) {
          router.replace(
            "/login"
          );

          router.refresh();

          return;
        }


        console.error(
          "Failed to load workspace:",
          error
        );

        router.replace(
          "/login"
        );

        router.refresh();
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }


    loadShell();


    return () => {
      cancelled = true;
    };
  }, [
    router,
  ]);


  if (loading) {
    return (
      <div className="app-loading">
        Loading workspace...
      </div>
    );
  }


  if (!owner) {
    return null;
  }


  return (
    <div className="app-shell">
      <Sidebar
        owner={owner}
      />

      <div className="app-main">
        <TopBar
          property={
            property
          }
        />

        <main className="page-content">
          {children}
        </main>
      </div>

      <MobileNav />
    </div>
  );
}