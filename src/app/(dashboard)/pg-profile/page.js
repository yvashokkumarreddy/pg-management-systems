"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Building2,
  Camera,
  Check,
  Copy,
  ExternalLink,
  Eye,
  ImagePlus,
  Loader2,
  MapPin,
  Phone,
  Save,
  Trash2,
  Upload,
  X,
} from "lucide-react";

import {
  apiRequest,
} from "@/lib/api/client";

import ConfirmModal from "@/components/ConfirmModal";


const EMPTY_FORM = {
  pgName: "",
  description: "",
  address: "",
  contactNumber: "",
  googleMapsUrl: "",
  amenities: [],
  roomTypes: [],
  isPublished: false,
};


const AMENITY_OPTIONS = [
    "Wi-Fi",
    "Power Backup",
    "Parking",
    "CCTV",
    "Housekeeping",
    "Washing Machine",
    "RO Water",
    "Geyser",
    "AC",
    "3 Times Food"
];


const ROOM_TYPE_OPTIONS = [
  "Single Sharing",
  "Double Sharing",
  "Triple Sharing",
  "Four Sharing",
  "5,6 Sharing"
];


function getErrorMessage(
  error,
  fallback
) {
  return (
    error?.message ||
    fallback
  );
}


function normalizeList(
  values
) {
  if (!Array.isArray(values)) {
    return [];
  }

  const normalized =
    values
      .map((item) => {
        if (
          typeof item ===
          "string"
        ) {
          return item.trim();
        }

        if (
          typeof item ===
          "number"
        ) {
          return String(item);
        }

        if (
          item &&
          typeof item ===
            "object"
        ) {
          const possibleValue =
            item.label ??
            item.name ??
            item.value ??
            item.type ??
            item.roomType ??
            item.amenity ??
            item.title ??
            "";

          if (
            typeof possibleValue ===
            "string"
          ) {
            return possibleValue.trim();
          }

          return "";
        }

        return "";
      })
      .filter(Boolean);

  return [
    ...new Set(normalized),
  ];
}


function normalizeProfile(
  data
) {
  if (!data) {
    return null;
  }

  return {
    ...data,

    googleMapsUrl:
      typeof data.googleMapsUrl ===
      "string"
        ? data.googleMapsUrl
        : "",

    amenities:
      normalizeList(
        data.amenities
      ),

    roomTypes:
      normalizeList(
        data.roomTypes
      ),

    photos:
      Array.isArray(
        data.photos
      )
        ? [...data.photos].sort(
            (a, b) =>
              Number(
                a?.sortOrder ??
                  0
              ) -
              Number(
                b?.sortOrder ??
                  0
              )
          )
        : [],
  };
}


function profileToForm(
  profile
) {
  if (!profile) {
    return {
      ...EMPTY_FORM,
    };
  }

  return {
    pgName:
      profile.pgName ??
      "",

    description:
      profile.description ??
      "",

    address:
      profile.address ??
      "",

    contactNumber:
      profile.contactNumber ??
      "",

    googleMapsUrl:
      profile.googleMapsUrl ??
      "",

    amenities:
      normalizeList(
        profile.amenities
      ),

    roomTypes:
      normalizeList(
        profile.roomTypes
      ),

    isPublished:
      Boolean(
        profile.isPublished
      ),
  };
}


export default function PGProfilePage() {
  const fileInputRef =
    useRef(null);

  const [
    form,
    setForm,
  ] = useState(
    EMPTY_FORM
  );

  const [
    profile,
    setProfile,
  ] = useState(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    publishing,
    setPublishing,
  ] = useState(false);

  const [
    uploading,
    setUploading,
  ] = useState(false);

  const [
    deletingPhotoId,
    setDeletingPhotoId,
  ] = useState(null);

  const [
    error,
    setError,
  ] = useState("");

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  const [
    previewOpen,
    setPreviewOpen,
  ] = useState(false);

  const [
    previewPhotoIndex,
    setPreviewPhotoIndex,
  ] = useState(null);

  const [
    linkCopied,
    setLinkCopied,
  ] = useState(false);

  const [
    deletePhotoId,
    setDeletePhotoId,
  ] = useState(null);


  const loadProfile =
    useCallback(
      async () => {
        setLoading(true);
        setError("");

        try {
          const response =
            await apiRequest(
              "/api/pg-profile"
            );

          const rawData =
            response?.data ??
            response;

          const normalized =
            normalizeProfile(
              rawData
            );

          setProfile(
            normalized
          );

          setForm(
            profileToForm(
              normalized
            )
          );
        } catch (requestError) {
          if (
            requestError?.status ===
              404 ||
            requestError?.statusCode ===
              404 ||
            requestError
              ?.response
              ?.status ===
              404 ||
            requestError?.message ===
              "PG profile not found"
          ) {
            setProfile(
              null
            );

            setForm({
              ...EMPTY_FORM,
            });

            return;
          }

          setError(
            getErrorMessage(
              requestError,
              "Failed to load PG profile"
            )
          );
        } finally {
          setLoading(
            false
          );
        }
      },
      []
    );


  useEffect(() => {
    if (!successMessage) {
      return;
    }

    const timer =
      window.setTimeout(() => {
        setSuccessMessage("");
      }, 3500);

    return () => {
      window.clearTimeout(
        timer
      );
    };
  }, [successMessage]);


  useEffect(() => {
    if (!error) {
      return;
    }

    const timer =
      window.setTimeout(() => {
        setError("");
      }, 5000);

    return () => {
      window.clearTimeout(
        timer
      );
    };
  }, [error]);


  useEffect(() => {
    loadProfile();
  }, [loadProfile]);


  useEffect(() => {
    function handleKeyDown(
      event
    ) {
      if (
        previewPhotoIndex ===
        null
      ) {
        return;
      }

      if (
        event.key ===
        "Escape"
      ) {
        setPreviewPhotoIndex(
          null
        );
      }

      if (
        event.key ===
        "ArrowLeft"
      ) {
        showPreviousPhoto();
      }

      if (
        event.key ===
        "ArrowRight"
      ) {
        showNextPhoto();
      }
    }

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  });


  function updateField(
    field,
    value
  ) {
    setForm(
      (current) => ({
        ...current,

        [field]:
          value,
      })
    );

    setError("");
    setSuccessMessage("");
  }


  function toggleArrayValue(
    field,
    value
  ) {
    setForm(
      (current) => {
        const currentValues =
          normalizeList(
            current[field]
          );

        const exists =
          currentValues.includes(
            value
          );

        return {
          ...current,

          [field]:
            exists
              ? currentValues.filter(
                  (item) =>
                    item !==
                    value
                )
              : [
                  ...currentValues,
                  value,
                ],
        };
      }
    );

    setError("");
    setSuccessMessage("");
  }


  function validateForm() {
    if (
      !form.pgName.trim()
    ) {
      return "PG name is required";
    }

    if (
      form.pgName.trim()
        .length > 200
    ) {
      return "PG name must not exceed 200 characters";
    }

    if (
      form.description
        .length > 2000
    ) {
      return "Description must not exceed 2000 characters";
    }

    if (
      form.address.length >
      500
    ) {
      return "Address must not exceed 500 characters";
    }

    if (
      form.contactNumber
        .length > 20
    ) {
      return "Contact number must not exceed 20 characters";
    }

    if (
      form.googleMapsUrl
        .length > 1000
    ) {
      return "Google Maps URL must not exceed 1000 characters";
    }

    const googleMapsUrl =
      form.googleMapsUrl.trim();

    if (googleMapsUrl) {
      try {
        const url =
          new URL(
            googleMapsUrl
          );

        const host =
          url.hostname.toLowerCase();

        const pathname =
          url.pathname.toLowerCase();

        const validUrl =
          host ===
            "maps.app.goo.gl" ||
          (
            host ===
              "goo.gl" &&
            pathname.startsWith(
              "/maps"
            )
          ) ||
          host ===
            "maps.google.com" ||
          (
            (
              host ===
                "google.com" ||
              host ===
                "www.google.com"
            ) &&
            pathname.startsWith(
              "/maps"
            )
          );

        if (!validUrl) {
          return "Please enter a valid Google Maps location URL";
        }
      } catch {
        return "Please enter a valid Google Maps location URL";
      }
    }

    return null;
  }


  async function handleSave() {
    const validationError =
      validateForm();

    if (validationError) {
      setError(
        validationError
      );

      return;
    }

    setSaving(true);
    setError("");
    setSuccessMessage("");

    try {
      const payload = {
        pgName:
          form.pgName.trim(),

        description:
          form.description.trim(),

        address:
          form.address.trim(),

        contactNumber:
          form.contactNumber.trim(),

        googleMapsUrl:
          form.googleMapsUrl.trim(),

        amenities:
          normalizeList(
            form.amenities
          ),

        roomTypes:
          normalizeList(
            form.roomTypes
          ),

        isPublished:
          Boolean(
            form.isPublished
          ),
      };

      const creating =
        !profile;

      const response =
        await apiRequest(
          "/api/pg-profile",
          {
            method:
              creating
                ? "POST"
                : "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(
                payload
              ),
          }
        );

      const rawProfile =
        response?.data ??
        response;

      const updatedProfile =
        normalizeProfile(
          rawProfile
        );

      setProfile(
        updatedProfile
      );

      setForm(
        profileToForm(
          updatedProfile
        )
      );

      setSuccessMessage(
        creating
          ? "PG profile created successfully"
          : "PG profile updated successfully"
      );
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
          "Failed to save PG profile"
        )
      );
    } finally {
      setSaving(
        false
      );
    }
  }


  async function handlePublishToggle(
    nextPublished
  ) {
    if (!profile) {
      updateField(
        "isPublished",
        nextPublished
      );

      return;
    }

    const previousValue =
      Boolean(
        profile.isPublished
      );

    setForm(
      (current) => ({
        ...current,

        isPublished:
          nextPublished,
      })
    );

    setPublishing(true);
    setError("");
    setSuccessMessage("");
    setLinkCopied(false);

    try {
      const response =
        await apiRequest(
          "/api/pg-profile",
          {
            method:
              "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                isPublished:
                  nextPublished,
              }),
          }
        );

      const rawProfile =
        response?.data ??
        response;

      const updatedProfile =
        normalizeProfile(
          rawProfile
        );

      setProfile(
        updatedProfile
      );

      setForm(
        (current) => ({
          ...current,

          isPublished:
            Boolean(
              updatedProfile
                ?.isPublished
            ),
        })
      );

      setSuccessMessage(
        nextPublished
          ? "Public profile published successfully"
          : "Public profile unpublished successfully"
      );
    } catch (requestError) {
      setForm(
        (current) => ({
          ...current,

          isPublished:
            previousValue,
        })
      );

      setError(
        getErrorMessage(
          requestError,
          nextPublished
            ? "Failed to publish PG profile"
            : "Failed to unpublish PG profile"
        )
      );
    } finally {
      setPublishing(
        false
      );
    }
  }


  async function handlePhotoUpload(
    event
  ) {
    const files =
      Array.from(
        event.target.files ??
          []
      );

    event.target.value =
      "";

    if (
      files.length === 0
    ) {
      return;
    }

    if (!profile) {
      setError(
        "Save the PG profile before uploading property photos."
      );

      return;
    }

    const existingCount =
      profile?.photos
        ?.length ?? 0;

    if (
      existingCount +
        files.length >
      10
    ) {
      setError(
        "Maximum 10 PG photos are allowed."
      );

      return;
    }

    for (
      const file of files
    ) {
      const extension =
        file.name
          ?.split(".")
          .pop()
          ?.toLowerCase();

      if (
        ![
          "jpg",
          "jpeg",
          "png",
          "webp",
        ].includes(
          extension
        )
      ) {
        setError(
          "Only JPG, JPEG, PNG and WEBP photos are allowed."
        );

        return;
      }

      if (
        file.size <= 0
      ) {
        setError(
          "Photo file is empty."
        );

        return;
      }

      if (
        file.size >
        5 *
          1024 *
          1024
      ) {
        setError(
          "Each photo must not exceed 5 MB."
        );

        return;
      }
    }

    setUploading(true);
    setError("");
    setSuccessMessage("");

    try {
      const uploadedPhotos =
        [];

      for (
        const file of files
      ) {
        const formData =
          new FormData();

        formData.append(
          "file",
          file
        );

        const response =
          await apiRequest(
            "/api/pg-profile/photos",
            {
              method:
                "POST",

              body:
                formData,
            }
          );

        const photo =
          response?.data ??
          response;

        if (photo) {
          uploadedPhotos.push(
            photo
          );
        }
      }

      setProfile(
        (current) => {
          if (!current) {
            return current;
          }

          return normalizeProfile({
            ...current,

            photos: [
              ...(
                current.photos ??
                []
              ),

              ...uploadedPhotos,
            ],
          });
        }
      );

      setSuccessMessage(
        uploadedPhotos.length ===
          1
          ? "Photo uploaded successfully"
          : `${uploadedPhotos.length} photos uploaded successfully`
      );
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
          "Failed to upload photo"
        )
      );

      await loadProfile();
    } finally {
      setUploading(
        false
      );
    }
  }


  async function handleDeletePhoto(
    photoId
  ) {
    if (!photoId) {
      return;
    }

    setDeletingPhotoId(
      photoId
    );

    setError("");
    setSuccessMessage("");

    try {
      await apiRequest(
        `/api/pg-profile/photos/${photoId}`,
        {
          method:
            "DELETE",
        }
      );

      setProfile(
        (current) => {
          if (!current) {
            return current;
          }

          return {
            ...current,

            photos:
              (
                current.photos ??
                []
              ).filter(
                (photo) =>
                  photo.id !==
                  photoId
              ),
          };
        }
      );

      setPreviewPhotoIndex(
        null
      );

      setDeletePhotoId(
        null
      );

      setSuccessMessage(
        "Photo deleted successfully"
      );
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
          "Failed to delete photo"
        )
      );
    } finally {
      setDeletingPhotoId(
        null
      );
    }
  }


  function openPhotoPreview(
    index
  ) {
    setPreviewPhotoIndex(
      index
    );
  }


  function closePhotoPreview() {
    setPreviewPhotoIndex(
      null
    );
  }


  function showPreviousPhoto() {
    const photos =
      profile?.photos ?? [];

    if (
      photos.length === 0 ||
      previewPhotoIndex ===
        null
    ) {
      return;
    }

    setPreviewPhotoIndex(
      (
        previewPhotoIndex -
          1 +
        photos.length
      ) %
        photos.length
    );
  }


  function showNextPhoto() {
    const photos =
      profile?.photos ?? [];

    if (
      photos.length === 0 ||
      previewPhotoIndex ===
        null
    ) {
      return;
    }

    setPreviewPhotoIndex(
      (
        previewPhotoIndex +
          1
      ) %
        photos.length
    );
  }


  function getPublicProfileUrl() {
    if (
      !profile?.slug ||
      typeof window ===
        "undefined"
    ) {
      return "";
    }

    return `${window.location.origin}/pg/${profile.slug}`;
  }


  function openPublicProfile() {
    const publicUrl =
      getPublicProfileUrl();

    if (
      !publicUrl ||
      !profile?.isPublished ||
      publishing
    ) {
      return;
    }

    window.open(
      publicUrl,
      "_blank",
      "noopener,noreferrer"
    );
  }


  async function copyPublicProfileLink() {
    const publicUrl =
      getPublicProfileUrl();

    if (
      !publicUrl ||
      !profile?.isPublished ||
      publishing
    ) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        publicUrl
      );

      setLinkCopied(
        true
      );

      setError("");

      window.setTimeout(
        () => {
          setLinkCopied(
            false
          );
        },
        1800
      );
    } catch (copyError) {
      console.error(
        "Copy public PG link error:",
        copyError
      );

      setError(
        "Failed to copy public profile link"
      );
    }
  }


if (loading) {
  return (
    <div className="pg-profile-page pg-profile-loading-page">
      <div className="pg-profile-loading-header-simple">
        <div className="pg-profile-loading-block pg-profile-loading-header-block" />

        <div className="pg-profile-loading-block pg-profile-loading-actions-block" />
      </div>

      <div className="pg-profile-main-grid">
        <section className="pg-card pg-profile-loading-container pg-profile-loading-form-container">
          <div className="pg-profile-loading-block pg-profile-loading-card-heading" />

          <div className="pg-profile-loading-block pg-profile-loading-card-body" />
        </section>

        <aside className="pg-card pg-profile-loading-container pg-profile-loading-preview-container">
          <div className="pg-profile-loading-block pg-profile-loading-preview-cover" />

          <div className="pg-profile-loading-block pg-profile-loading-preview-body" />
        </aside>
      </div>

      <section className="pg-card pg-profile-loading-container pg-profile-loading-photos-container">
        <div className="pg-profile-loading-block pg-profile-loading-photos-heading" />

        <div className="pg-profile-loading-block pg-profile-loading-photos-body" />
      </section>
    </div>
  );
}


  return (
    <div className="pg-profile-page">
      <div className="pg-toast-container">
        {successMessage ? (
          <div
            className="pg-toast pg-toast-success"
            role="status"
          >
            <div className="pg-toast-icon">
              <Check
                size={18}
              />
            </div>

            <div className="pg-toast-content">
              <strong>
                Success
              </strong>

              <span>
                {successMessage}
              </span>
            </div>

            <button
              type="button"
              className="pg-toast-close"
              aria-label="Close notification"
              onClick={() =>
                setSuccessMessage(
                  ""
                )
              }
            >
              <X
                size={17}
              />
            </button>
          </div>
        ) : null}


        {error ? (
          <div
            className="pg-toast pg-toast-error"
            role="alert"
          >
            <div className="pg-toast-icon">
              <X
                size={18}
              />
            </div>

            <div className="pg-toast-content">
              <strong>
                Error
              </strong>

              <span>
                {error}
              </span>
            </div>

            <button
              type="button"
              className="pg-toast-close"
              aria-label="Close notification"
              onClick={() =>
                setError("")
              }
            >
              <X
                size={17}
              />
            </button>
          </div>
        ) : null}
      </div>


      <div className="pg-profile-page-header">
        <div>
          <h1>
            PG Profile
          </h1>

          <p>
            Manage your public
            PG information,
            amenities and property
            photos.
          </p>
        </div>


        <div className="pg-profile-header-actions">
          {profile?.slug ? (
            <>
              <button
                type="button"
                className="pg-profile-public-link-button"
                onClick={
                  copyPublicProfileLink
                }
                disabled={
                  publishing ||
                  !profile
                    ?.isPublished
                }
                title={
                  profile
                    ?.isPublished
                    ? "Copy public profile link"
                    : "Publish the profile to enable the public link"
                }
              >
                {publishing ? (
                  <Loader2
                    size={17}
                    className="pg-profile-spinner"
                  />
                ) : linkCopied ? (
                  <Check
                    size={17}
                  />
                ) : (
                  <Copy
                    size={17}
                  />
                )}

                {publishing
                  ? "Updating..."
                  : linkCopied
                    ? "Copied"
                    : "Copy Link"}
              </button>


              <button
                type="button"
                className="pg-profile-public-link-button"
                onClick={
                  openPublicProfile
                }
                disabled={
                  publishing ||
                  !profile
                    ?.isPublished
                }
                title={
                  profile
                    ?.isPublished
                    ? "Open public PG page"
                    : "Publish the profile to enable the public page"
                }
              >
                <ExternalLink
                  size={17}
                />

                Open Public Page
              </button>
            </>
          ) : null}


          <button
            type="button"
            className="pg-profile-preview-button"
            onClick={() =>
              setPreviewOpen(
                true
              )
            }
          >
            <Eye
              size={17}
            />

            Preview
          </button>


          <button
            type="button"
            className="pg-profile-save-button"
            onClick={
              handleSave
            }
            disabled={
              saving ||
              publishing
            }
          >
            {saving ? (
              <Loader2
                size={17}
                className="pg-profile-spinner"
              />
            ) : (
              <Save
                size={17}
              />
            )}

            {saving
              ? "Saving..."
              : "Save"}
          </button>
        </div>
      </div>


      {profile?.slug ? (
        <div
          className={`pg-profile-public-link-panel ${
            profile
              ?.isPublished
              ? "published"
              : "unpublished"
          }`}
        >
          <div className="pg-profile-public-link-info">
            <div className="pg-profile-public-link-icon">
              {publishing ? (
                <Loader2
                  size={17}
                  className="pg-profile-spinner"
                />
              ) : (
                <ExternalLink
                  size={17}
                />
              )}
            </div>

            <div>
              <strong>
                {publishing
                  ? form.isPublished
                    ? "Publishing profile..."
                    : "Unpublishing profile..."
                  : profile?.isPublished
                    ? "Public profile is live"
                    : "Public profile is not published"}
              </strong>

              {profile?.isPublished ? (
                <button
                  type="button"
                  className="pg-profile-slug-copy"
                  onClick={
                    copyPublicProfileLink
                  }
                  title="Copy public profile link"
                >
                  <span>
                    {`/pg/${profile.slug}`}
                  </span>

                  {linkCopied ? (
                    <Check
                      size={14}
                    />
                  ) : (
                    <Copy
                      size={14}
                    />
                  )}
                </button>
              ) : (
                <span>
                  Turn on Published
                  to make the public
                  profile available.
                </span>
              )}
            </div>
          </div>
        </div>
      ) : null}


      <div className="pg-profile-main-grid">
        <section className="pg-card pg-profile-information-card">
          <div className="pg-profile-card-heading">
            <div>
              <h2>
                Profile information
              </h2>

              <p>
                Information shown
                on your public PG
                profile.
              </p>
            </div>


            <label className="pg-profile-published-toggle">
              <input
                type="checkbox"
                checked={
                  form.isPublished
                }
                disabled={
                  publishing ||
                  saving
                }
                onChange={(
                  event
                ) =>
                  handlePublishToggle(
                    event.target
                      .checked
                  )
                }
              />

              <span className="pg-profile-toggle-track">
                <span className="pg-profile-toggle-thumb" />
              </span>

              <span>
                {publishing
                  ? "Updating..."
                  : "Published"}
              </span>
            </label>
          </div>


          <div className="pg-profile-form">
            <div className="pg-profile-field">
              <label htmlFor="pgName">
                PG name
                <span>
                  *
                </span>
              </label>

              <input
                id="pgName"
                type="text"
                maxLength={200}
                placeholder="e.g. Sunrise Men's PG"
                value={
                  form.pgName
                }
                onChange={(
                  event
                ) =>
                  updateField(
                    "pgName",
                    event.target
                      .value
                  )
                }
              />
            </div>


            <div className="pg-profile-field">
              <div className="pg-profile-field-label-row">
                <label htmlFor="description">
                  Description
                </label>

                <span>
                  {
                    form
                      .description
                      .length
                  }
                  /2000
                </span>
              </div>

              <textarea
                id="description"
                maxLength={2000}
                rows={5}
                placeholder="Tell prospective tenants about your PG..."
                value={
                  form.description
                }
                onChange={(
                  event
                ) =>
                  updateField(
                    "description",
                    event.target
                      .value
                  )
                }
              />
            </div>


            <div className="pg-profile-field">
              <label htmlFor="address">
                Address
              </label>

              <textarea
                id="address"
                maxLength={500}
                rows={3}
                placeholder="Full property address"
                value={
                  form.address
                }
                onChange={(
                  event
                ) =>
                  updateField(
                    "address",
                    event.target
                      .value
                  )
                }
              />
            </div>


            <div className="pg-profile-field">
              <label htmlFor="googleMapsUrl">
                Google Maps location
              </label>

              <input
                id="googleMapsUrl"
                type="url"
                maxLength={1000}
                placeholder="Paste Google Maps share link"
                value={
                  form.googleMapsUrl
                }
                onChange={(
                  event
                ) =>
                  updateField(
                    "googleMapsUrl",
                    event.target
                      .value
                  )
                }
              />

              <small className="pg-profile-field-hint">
                Open your PG
                location in Google
                Maps, choose Share,
                then paste the link
                here.
              </small>
            </div>


            <div className="pg-profile-field">
              <label htmlFor="contactNumber">
                Contact number
              </label>

              <input
                id="contactNumber"
                type="tel"
                maxLength={20}
                placeholder="e.g. 9876543210"
                value={
                  form.contactNumber
                }
                onChange={(
                  event
                ) =>
                  updateField(
                    "contactNumber",
                    event.target
                      .value
                  )
                }
              />
            </div>


            <div className="pg-profile-field">
              <label>
                Amenities
              </label>

              <div className="pg-profile-chip-grid">
                {AMENITY_OPTIONS.map(
                  (
                    amenity,
                    index
                  ) => {
                    const selected =
                      form.amenities.includes(
                        amenity
                      );

                    return (
                      <button
                        key={`${amenity}-${index}`}
                        type="button"
                        className={`pg-profile-select-chip ${
                          selected
                            ? "selected"
                            : ""
                        }`}
                        onClick={() =>
                          toggleArrayValue(
                            "amenities",
                            amenity
                          )
                        }
                      >
                        {selected ? (
                          <Check
                            size={14}
                          />
                        ) : null}

                        {amenity}
                      </button>
                    );
                  }
                )}
              </div>

              <small className="pg-profile-field-hint">
                Select the amenities
                available at your PG.
              </small>
            </div>

            <div className="pg-profile-field">
              <label>
                Room types
              </label>

              <div className="pg-profile-chip-grid">
                {ROOM_TYPE_OPTIONS.map(
                  (
                    roomType,
                    index
                  ) => {
                    const selected =
                      form.roomTypes.includes(
                        roomType
                      );

                    return (
                      <button
                        key={`${roomType}-${index}`}
                        type="button"
                        className={`pg-profile-select-chip ${
                          selected
                            ? "selected"
                            : ""
                        }`}
                        onClick={() =>
                          toggleArrayValue(
                            "roomTypes",
                            roomType
                          )
                        }
                      >
                        {selected ? (
                          <Check
                            size={14}
                          />
                        ) : null}

                        {roomType}
                      </button>
                    );
                  }
                )}
              </div>

              <small className="pg-profile-field-hint">
                Select the room types
                available at your PG.
              </small>
            </div>
          </div>
        </section>


        <aside className="pg-card pg-profile-preview-card">
          <div className="pg-profile-preview-label">
            PUBLIC PROFILE
            PREVIEW
          </div>

          <div className="pg-profile-preview-cover">
            {profile
              ?.photos?.[0]
              ?.fileUrl ? (
              <img
                src={
                  profile
                    .photos[0]
                    .fileUrl
                }
                alt="PG cover"
              />
            ) : (
              <div className="pg-profile-preview-cover-empty">
                <Building2
                  size={38}
                />

                <span>
                  Property photo
                </span>
              </div>
            )}
          </div>


          <div className="pg-profile-preview-content">
            <div className="pg-profile-preview-title-row">
              <div>
                <h2>
                  {form.pgName.trim() ||
                    "Your PG name"}
                </h2>

                {form.address ? (
                  <div className="pg-profile-preview-meta">
                    <MapPin
                      size={14}
                    />

                    <span>
                      {
                        form.address
                      }
                    </span>
                  </div>
                ) : null}
              </div>

              <span
                className={`pg-profile-status-badge ${
                  profile
                    ?.isPublished
                    ? "published"
                    : "draft"
                }`}
              >
                {publishing
                  ? "Updating"
                  : profile
                      ?.isPublished
                    ? "Published"
                    : "Draft"}
              </span>
            </div>


            {form.contactNumber ? (
              <div className="pg-profile-preview-meta">
                <Phone
                  size={14}
                />

                <span>
                  {
                    form.contactNumber
                  }
                </span>
              </div>
            ) : null}


            {form.googleMapsUrl ? (
              <div className="pg-profile-preview-meta">
                <MapPin
                  size={14}
                />

                <span>
                  Google Maps
                  location added
                </span>
              </div>
            ) : null}


            <p className="pg-profile-preview-description">
              {form.description ||
                "Add a description to tell prospective tenants about your property."}
            </p>


            {form.amenities
              .length > 0 ? (
              <div className="pg-profile-preview-section">
                <h3>
                  Amenities
                </h3>

                <div className="pg-profile-preview-chips">
                  {form.amenities.map(
                    (
                      amenity,
                      index
                    ) => (
                      <span
                        key={`${amenity}-${index}`}
                      >
                        {
                          amenity
                        }
                      </span>
                    )
                  )}
                </div>
              </div>
            ) : null}


            {form.roomTypes
              .length > 0 ? (
              <div className="pg-profile-preview-section">
                <h3>
                  Room types
                </h3>

                <div className="pg-profile-preview-chips">
                  {form.roomTypes.map(
                    (
                      roomType,
                      index
                    ) => (
                      <span
                        key={`${roomType}-${index}`}
                      >
                        {
                          roomType
                        }
                      </span>
                    )
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </aside>
      </div>


      <section className="pg-card pg-profile-photos-card">
        <div className="pg-profile-photos-header">
          <div>
            <h2>
              Property photos
            </h2>

            <p>
              Upload up to 10
              photos. The first
              photo is used as the
              cover image.
            </p>
          </div>

          <div>
            <input
              ref={
                fileInputRef
              }
              type="file"
              accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
              multiple
              hidden
              onChange={
                handlePhotoUpload
              }
            />

            <button
              type="button"
              className="pg-profile-upload-button"
              disabled={
                uploading ||
                !profile ||
                (
                  profile
                    ?.photos
                    ?.length ??
                  0
                ) >= 10
              }
              onClick={() =>
                fileInputRef
                  .current
                  ?.click()
              }
            >
              {uploading ? (
                <Loader2
                  size={17}
                  className="pg-profile-spinner"
                />
              ) : (
                <Upload
                  size={17}
                />
              )}

              {uploading
                ? "Uploading..."
                : "Upload photo"}
            </button>
          </div>
        </div>


        {!profile ? (
          <div className="pg-profile-photo-help">
            <ImagePlus
              size={20}
            />

            <span>
              Save the PG profile
              first to start
              uploading property
              photos.
            </span>
          </div>
        ) : null}


        {profile &&
        (
          profile?.photos
            ?.length ?? 0
        ) === 0 ? (
          <div className="pg-profile-empty-photos">
            <div className="pg-profile-empty-photo-icon">
              <Camera
                size={27}
              />
            </div>

            <h3>
              No property photos
              yet
            </h3>

            <p>
              Add clear photos of
              rooms and common
              areas to improve
              your PG profile.
            </p>

            <button
              type="button"
              onClick={() =>
                fileInputRef
                  .current
                  ?.click()
              }
            >
              <ImagePlus
                size={16}
              />

              Add photos
            </button>
          </div>
        ) : null}


        {(
          profile?.photos
            ?.length ?? 0
        ) > 0 ? (
          <div className="pg-profile-photo-grid">
            {profile.photos.map(
              (
                photo,
                index
              ) => (
                <div
                  className="pg-profile-photo-item"
                  key={
                    photo.id ??
                    `photo-${index}`
                  }
                >
                  <button
                    type="button"
                    className="pg-profile-photo-preview-trigger"
                    onClick={() =>
                      openPhotoPreview(
                        index
                      )
                    }
                  >
                    {photo.fileUrl ? (
                      <img
                        src={
                          photo.fileUrl
                        }
                        alt={`Property photo ${
                          index + 1
                        }`}
                      />
                    ) : (
                      <div className="pg-profile-preview-cover-empty">
                        <Camera
                          size={24}
                        />

                        <span>
                          Photo unavailable
                        </span>
                      </div>
                    )}

                    <div className="pg-profile-photo-preview-icon">
                      <Eye
                        size={17}
                      />
                    </div>
                  </button>


                  <div className="pg-profile-photo-overlay">
                    <span>
                      {index === 0
                        ? "Cover"
                        : `#${index}`}
                    </span>

                    <button
                      type="button"
                      title="Delete photo"
                      disabled={
                        deletingPhotoId ===
                        photo.id
                      }
                      onClick={() =>
                        setDeletePhotoId(
                          photo.id
                        )
                      }
                    >
                      {deletingPhotoId ===
                      photo.id ? (
                        <Loader2
                          size={16}
                          className="pg-profile-spinner"
                        />
                      ) : (
                        <Trash2
                          size={16}
                        />
                      )}
                    </button>
                  </div>
                </div>
              )
            )}


            {profile.photos
              .length < 10 ? (
              <button
                type="button"
                className="pg-profile-photo-add-tile"
                disabled={
                  uploading
                }
                onClick={() =>
                  fileInputRef
                    .current
                    ?.click()
                }
              >
                <ImagePlus
                  size={25}
                />

                <span>
                  Add photo
                </span>
              </button>
            ) : null}
          </div>
        ) : null}
      </section>


      {previewPhotoIndex !==
        null &&
      profile?.photos?.[
        previewPhotoIndex
      ]?.fileUrl ? (
        <div
          className="pg-photo-lightbox-backdrop"
          onMouseDown={(
            event
          ) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closePhotoPreview();
            }
          }}
        >
          <div className="pg-photo-lightbox">
            <div className="pg-photo-lightbox-header">
              <div>
                <span>
                  PROPERTY PHOTO
                </span>

                <strong>
                  {previewPhotoIndex ===
                  0
                    ? "Cover photo"
                    : `Photo #${previewPhotoIndex}`}
                </strong>
              </div>

              <button
                type="button"
                aria-label="Close photo preview"
                onClick={
                  closePhotoPreview
                }
              >
                <X
                  size={21}
                />
              </button>
            </div>


            <div className="pg-photo-lightbox-body">
              {profile.photos
                .length > 1 ? (
                <button
                  type="button"
                  className="pg-photo-lightbox-nav pg-photo-lightbox-prev"
                  aria-label="Previous photo"
                  onClick={
                    showPreviousPhoto
                  }
                >
                  ‹
                </button>
              ) : null}


              <img
                src={
                  profile.photos[
                    previewPhotoIndex
                  ].fileUrl
                }
                alt={`Property photo ${
                  previewPhotoIndex +
                  1
                }`}
              />


              {profile.photos
                .length > 1 ? (
                <button
                  type="button"
                  className="pg-photo-lightbox-nav pg-photo-lightbox-next"
                  aria-label="Next photo"
                  onClick={
                    showNextPhoto
                  }
                >
                  ›
                </button>
              ) : null}
            </div>


            <div className="pg-photo-lightbox-footer">
              <span>
                {previewPhotoIndex +
                  1}{" "}
                /{" "}
                {
                  profile.photos
                    .length
                }
              </span>
            </div>
          </div>
        </div>
      ) : null}


      {previewOpen ? (
        <div
          className="pg-profile-modal-backdrop"
          onMouseDown={(
            event
          ) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setPreviewOpen(
                false
              );
            }
          }}
        >
          <div className="pg-profile-modal">
            <div className="pg-profile-modal-header">
              <div>
                <span>
                  PUBLIC PROFILE
                  PREVIEW
                </span>

                <h2>
                  {form.pgName ||
                    "Your PG"}
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setPreviewOpen(
                    false
                  )
                }
              >
                <X
                  size={20}
                />
              </button>
            </div>


            {profile
              ?.photos?.[0]
              ?.fileUrl ? (
              <div className="pg-profile-modal-cover">
                <img
                  src={
                    profile
                      .photos[0]
                      .fileUrl
                  }
                  alt="PG cover"
                />
              </div>
            ) : null}


            <div className="pg-profile-modal-body">
              <div className="pg-profile-modal-title">
                <div>
                  <h2>
                    {form.pgName ||
                      "Your PG name"}
                  </h2>

                  {form.address ? (
                    <p>
                      <MapPin
                        size={15}
                      />

                      {
                        form.address
                      }
                    </p>
                  ) : null}
                </div>

                <span
                  className={`pg-profile-status-badge ${
                    profile
                      ?.isPublished
                      ? "published"
                      : "draft"
                  }`}
                >
                  {publishing
                    ? "Updating"
                    : profile
                        ?.isPublished
                      ? "Published"
                      : "Draft"}
                </span>
              </div>


              {form.description ? (
                <p className="pg-profile-modal-description">
                  {
                    form.description
                  }
                </p>
              ) : null}


              {form.contactNumber ? (
                <div className="pg-profile-modal-contact">
                  <Phone
                    size={16}
                  />

                  {
                    form.contactNumber
                  }
                </div>
              ) : null}


              {form.googleMapsUrl ? (
                <a
                  href={
                    form.googleMapsUrl
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pg-profile-modal-map-button"
                >
                  <MapPin
                    size={16}
                  />

                  View on Google Maps

                  <ExternalLink
                    size={14}
                  />
                </a>
              ) : null}


              {form.amenities
                .length > 0 ? (
                <div className="pg-profile-modal-section">
                  <h3>
                    Amenities
                  </h3>

                  <div className="pg-profile-preview-chips">
                    {form.amenities.map(
                      (
                        amenity,
                        index
                      ) => (
                        <span
                          key={`${amenity}-${index}`}
                        >
                          {
                            amenity
                          }
                        </span>
                      )
                    )}
                  </div>
                </div>
              ) : null}


              {form.roomTypes
                .length > 0 ? (
                <div className="pg-profile-modal-section">
                  <h3>
                    Room types
                  </h3>

                  <div className="pg-profile-preview-chips">
                    {form.roomTypes.map(
                      (
                        roomType,
                        index
                      ) => (
                        <span
                          key={`${roomType}-${index}`}
                        >
                          {
                            roomType
                          }
                        </span>
                      )
                    )}
                  </div>
                </div>
              ) : null}


              {(
                profile
                  ?.photos
                  ?.length ??
                0
              ) > 1 ? (
                <div className="pg-profile-modal-section">
                  <h3>
                    Property
                    photos
                  </h3>

                  <div className="pg-profile-modal-photo-grid">
                    {profile.photos.map(
                      (
                        photo,
                        index
                      ) =>
                        photo.fileUrl ? (
                          <button
                            key={
                              photo.id ??
                              `modal-photo-${index}`
                            }
                            type="button"
                            className="pg-profile-modal-photo-button"
                            onClick={() => {
                              setPreviewOpen(
                                false
                              );

                              setPreviewPhotoIndex(
                                index
                              );
                            }}
                          >
                            <img
                              src={
                                photo.fileUrl
                              }
                              alt={`Property photo ${
                                index +
                                1
                              }`}
                            />
                          </button>
                        ) : null
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}


      <ConfirmModal
        open={
          Boolean(
            deletePhotoId
          )
        }
        title="Delete property photo?"
        message="Are you sure you want to delete this property photo? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        loading={
          deletingPhotoId ===
          deletePhotoId
        }
        onCancel={() => {
          if (!deletingPhotoId) {
            setDeletePhotoId(
              null
            );
          }
        }}
        onConfirm={() =>
          handleDeletePhoto(
            deletePhotoId
          )
        }
      />
    </div>
  );
}