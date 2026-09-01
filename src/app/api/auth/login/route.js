import {
  NextResponse,
} from "next/server";

import {
  createClient,
} from "@/lib/supabase/server";

import {
  db,
} from "@/db";

import {
  findUserByAuthUserId,
} from "@/modules/auth/auth.repository.js";

import {
  validateLogin,
} from "@/modules/auth/auth.validation";


export async function POST(
  request
) {
  try {
    const body =
      await request.json();

    const validation =
      validateLogin(
        body
      );

    if (
      !validation.isValid
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Please check your login details.",

          errors:
            validation.errors,
        },
        {
          status: 400,
        }
      );
    }


    const email =
      body.email
        .trim()
        .toLowerCase();


    const supabase =
      await createClient();


    const {
      data,
      error,
    } =
      await supabase.auth
        .signInWithPassword({
          email,

          password:
            body.password,
        });


    if (
      error ||
      !data?.user
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            "Invalid email or password",
        },
        {
          status: 401,
        }
      );
    }


    const owner =
      await findUserByAuthUserId(
        db,
        data.user.id
      );


    if (!owner) {
      /*
       * Supabase authentication
       * succeeded, but this auth user
       * is not linked to an owner row
       * in the application database.
       *
       * Sign out immediately so an
       * authenticated Supabase session
       * is not left active.
       */
      await supabase.auth.signOut();

      return NextResponse.json(
        {
          success: false,

          message:
            "Owner account is not linked",
        },
        {
          status: 403,
        }
      );
    }


    if (
      owner.status &&
      owner.status !==
        "ACTIVE"
    ) {
      /*
       * Inactive owners must not keep
       * an authenticated session.
       */
      await supabase.auth.signOut();

      return NextResponse.json(
        {
          success: false,

          message:
            "Owner account is inactive",
        },
        {
          status: 403,
        }
      );
    }


    return NextResponse.json({
      success: true,

      message:
        "Login successful",

      data: {
        id:
          owner.id,

        email:
          data.user.email ??
          email,

        status:
          owner.status ??
          "ACTIVE",
      },
    });
  } catch (error) {
    console.error(
      "Login route error:",
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          "Failed to login",
      },
      {
        status: 500,
      }
    );
  }
}