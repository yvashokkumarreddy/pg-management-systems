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
            validation.errors.file,
          errors:
            validation.errors,
        },
        {
          status: 400,
        }
      );
    }


    const supabase =
      await createClient();

console.log("Supabase client created:", body.email, body.password);
    const {
      data,
      error,
    } =
      await supabase.auth
        .signInWithPassword({
          email:
            body.email
              .trim()
              .toLowerCase(),

          password:
            body.password,
        });

console.log(error, data.user);
    if (
      error ||
      !data.user
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
       * Auth succeeded but there's
       * no corresponding app owner.
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
          data.user.email,

        status:
          owner.status,
      },
    });
  } catch (error) {
    console.error(
      "Login error:",
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