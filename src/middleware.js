import {
  createServerClient,
} from "@supabase/ssr";

import {
  NextResponse,
} from "next/server";


export async function middleware(
  request
) {
  let response =
    NextResponse.next({
      request,
    });


  const supabase =
    createServerClient(
      process.env
        .NEXT_PUBLIC_SUPABASE_URL,

      process.env
        .NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,

      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },

          setAll(
            cookiesToSet
          ) {
            /*
             * Update the incoming request
             * cookies first so Supabase
             * sees refreshed session data
             * during this request.
             */
            cookiesToSet.forEach(
              ({
                name,
                value,
              }) => {
                request.cookies.set(
                  name,
                  value
                );
              }
            );


            /*
             * Re-create the response using
             * the updated request.
             */
            response =
              NextResponse.next({
                request,
              });


            /*
             * Send refreshed Supabase
             * cookies back to the browser.
             */
            cookiesToSet.forEach(
              ({
                name,
                value,
                options,
              }) => {
                response.cookies.set(
                  name,
                  value,
                  options
                );
              }
            );
          },
        },
      }
    );


  /*
   * Do not use getSession() for
   * authorization decisions here.
   *
   * getUser() validates the auth user
   * with Supabase Auth.
   */
  const {
    data: {
      user,
    },
  } =
    await supabase.auth.getUser();


  /*
   * These pages require an authenticated
   * owner session.
   */
  const protectedPaths = [
    "/dashboard",
    "/rooms",
    "/tenants",
    "/payments",
    "/pg-profile",
    "/settings",
    "/rent",
  ];


  const isProtectedRoute =
    protectedPaths.some(
      (path) =>
        request.nextUrl.pathname ===
          path ||
        request.nextUrl.pathname.startsWith(
          `${path}/`
        )
    );


  /*
   * Login/register pages should not be
   * shown again to an authenticated user.
   */
  const isAuthRoute =
    request.nextUrl.pathname ===
      "/login" ||
    request.nextUrl.pathname ===
      "/register";


  if (
    isProtectedRoute &&
    !user
  ) {
    const loginUrl =
      request.nextUrl.clone();

    loginUrl.pathname =
      "/login";

    /*
     * Keep the original page so we can
     * support redirect-after-login later.
     */
    loginUrl.searchParams.set(
      "next",
      request.nextUrl.pathname
    );


    const redirectResponse =
      NextResponse.redirect(
        loginUrl
      );


    /*
     * Preserve any cookies Supabase
     * refreshed before the redirect.
     */
    response.cookies
      .getAll()
      .forEach(
        (cookie) => {
          redirectResponse.cookies.set(
            cookie.name,
            cookie.value,
            cookie
          );
        }
      );


    return redirectResponse;
  }


  if (
    isAuthRoute &&
    user
  ) {
    const dashboardUrl =
      request.nextUrl.clone();

    dashboardUrl.pathname =
      "/dashboard";

    dashboardUrl.search =
      "";


    const redirectResponse =
      NextResponse.redirect(
        dashboardUrl
      );


    response.cookies
      .getAll()
      .forEach(
        (cookie) => {
          redirectResponse.cookies.set(
            cookie.name,
            cookie.value,
            cookie
          );
        }
      );


    return redirectResponse;
  }


  return response;
}


export const config = {
  matcher: [
    "/dashboard/:path*",
    "/rooms/:path*",
    "/tenants/:path*",
    "/payments/:path*",
    "/pg-profile/:path*",
    "/settings/:path*",
    "/rent/:path*",

    /*
     * Include auth pages so already
     * authenticated owners can be
     * redirected to the dashboard.
     */
    "/login",
    "/register",
  ],
};