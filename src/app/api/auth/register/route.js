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
  let authUserId =
    null;

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


    if (!name) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Name is required",
        },
        {
          status: 400,
        }
      );
    }


    if (
      name.length >
      150
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Name is too long",
        },
        {
          status: 400,
        }
      );
    }


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
     * Check whether this email already
     * belongs to an application owner.
     */
    const existingUsers =
      await db
        .select({
          id:
            users.id,
        })
        .from(users)
        .where(
          eq(
            users.email,
            email
          )
        )
        .limit(1);


    if (
      existingUsers.length >
      0
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
     * Create the Supabase Auth user.
     *
     * Email is currently confirmed
     * immediately so registration can
     * be followed by normal login.
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

          email_confirm:
            true,

          user_metadata: {
            name,
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


      /*
       * Supabase may already contain
       * this email even if the local
       * users table does not.
       */
      const authMessage =
        authError?.message
          ?.toLowerCase() ||
        "";


      if (
        authMessage.includes(
          "already"
        ) ||
        authMessage.includes(
          "registered"
        ) ||
        authMessage.includes(
          "exists"
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "An account with this email already exists",
          },
          {
            status: 409,
          }
        );
      }


      return NextResponse.json(
        {
          success: false,
          message:
            "Unable to create account",
        },
        {
          status: 400,
        }
      );
    }


    authUserId =
      authData.user.id;


    /*
     * Create the linked application
     * owner row.
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

            name,

            status:
              "ACTIVE",
          })
          .returning({
            id:
              users.id,

            email:
              users.email,

            status:
              users.status,
          });


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
       * Auth creation succeeded but
       * application owner creation
       * failed.
       *
       * Remove the Supabase Auth user
       * to avoid an orphaned account.
       */
      try {
        const {
          error:
            cleanupError,
        } =
          await supabaseAdmin
            .auth
            .admin
            .deleteUser(
              authUserId
            );


        if (
          cleanupError
        ) {
          console.error(
            "Failed to clean up Supabase Auth user:",
            authUserId,
            cleanupError
          );
        }
      } catch (
        cleanupError
      ) {
        console.error(
          "Unexpected auth cleanup error:",
          authUserId,
          cleanupError
        );
      }


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
          "Failed to register owner",
      },
      {
        status: 500,
      }
    );
  }
}