import {
  NextResponse,
} from "next/server";

import crypto from "crypto";

import {
  db,
} from "@/db";

import {
  users,
} from "@/db/schema";

import {
  eq,
} from "drizzle-orm";

import {
  supabaseAdmin,
} from "@/lib/supabase-admin";


export async function POST(
  request
) {
  let authUserId = null;

  try {
    const body =
      await request.json();

    const email =
      body.email
        ?.trim()
        .toLowerCase();

    const password =
      body.password;

    const name =
      body.name
        ?.trim();


    if (!email) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Email is required",
        },
        {
          status: 400,
        }
      );
    }


    if (
      !password ||
      password.length < 8
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Password must be at least 8 characters",
        },
        {
          status: 400,
        }
      );
    }


    /*
     * Check application users table.
     */
    const existingUsers =
      await db
        .select()
        .from(users)
        .where(
          eq(
            users.email,
            email
          )
        )
        .limit(1);


    if (
      existingUsers.length > 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Owner with this email already exists",
        },
        {
          status: 409,
        }
      );
    }


    /*
     * Create Supabase Auth user.
     */
    const {
      data:
        authData,

      error:
        authError,
    } =
      await supabaseAdmin.auth.admin
        .createUser({
          email,

          password,

          /*
           * For current development:
           * allow immediate login.
           */
          email_confirm: true,

          user_metadata: {
            name:
              name || null,
          },
        });


    if (
      authError ||
      !authData?.user
    ) {
      console.error(
        "Supabase create user error:",
        authError
      );

      return NextResponse.json(
        {
          success: false,

          message:
            authError?.message ||
            "Failed to create authentication user",
        },
        {
          status: 400,
        }
      );
    }


    authUserId =
      authData.user.id;


    /*
     * Create application owner.
     */
    const ownerId =
      crypto.randomUUID();


    try {
      const result =
        await db
          .insert(users)
          .values({
            id:
              ownerId,

            authUserId,

            email,

            /*
             * Adapt this field if your
             * users schema uses another
             * name such as fullName.
             */
            name:
              name || null,

            status:
              "ACTIVE",
          })
          .returning();


      const owner =
        result[0];


      return NextResponse.json(
        {
          success: true,

          message:
            "Owner registered successfully",

          data: {
            id:
              owner.id,

            authUserId:
              owner.authUserId,

            email:
              owner.email,

            status:
              owner.status,
          },
        },
        {
          status: 201,
        }
      );
    } catch (dbError) {
      /*
       * Important cleanup:
       *
       * Auth user was created,
       * but DB owner creation failed.
       *
       * Remove Auth user so we don't
       * leave an orphan account.
       */
      await supabaseAdmin.auth.admin
        .deleteUser(
          authUserId
        );

      throw dbError;
    }
  } catch (error) {
    console.error(
      "Register owner error:",
      error
    );


    return NextResponse.json(
      {
        success: false,

        message:
          error.message ||
          "Failed to register owner",
      },
      {
        status: 500,
      }
    );
  }
}