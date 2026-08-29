import {
  NextResponse,
} from "next/server";

import {
  supabaseAdmin,
} from "@/lib/supabase-admin";


export async function GET() {
  try {
    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL ||
      process.env.SUPABASE_URL ||
      null;


    const {
      data: buckets,
      error: listError,
    } =
      await supabaseAdmin.storage
        .listBuckets();


    const {
      data: bucket,
      error: bucketError,
    } =
      await supabaseAdmin.storage
        .getBucket(
          "tanent-documents"
        );


    return NextResponse.json({
      success: true,

      supabaseUrl,

      projectRef:
        supabaseUrl
          ? new URL(
              supabaseUrl
            ).hostname
          : null,

      buckets:
        buckets?.map(
          (item) => ({
            id: item.id,
            name: item.name,
            public:
              item.public,
          })
        ) || [],

      listBucketsError:
        listError
          ? {
              message:
                listError.message,
              status:
                listError.status,
            }
          : null,

      tenantDocumentsBucket:
        bucket || null,

      tenantDocumentsBucketError:
        bucketError
          ? {
              message:
                bucketError.message,
              status:
                bucketError.status,
            }
          : null,
    });

  } catch (error) {
    console.error(
      "Storage debug error:",
      error
    );


    return NextResponse.json(
      {
        success: false,

        message:
          error?.message ||
          "Storage debug failed",
      },
      {
        status: 500,
      }
    );
  }
}