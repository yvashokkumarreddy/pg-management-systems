"use client";

import {
  use,
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  Building2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  MapPin,
  Phone,
  X,
} from "lucide-react";


function normalizeList(values) {
  if (!Array.isArray(values)) {
    return [];
  }

  return values
    .map((item) => {
      if (typeof item === "string") {
        return item.trim();
      }

      if (typeof item === "number") {
        return String(item);
      }

      if (
        item &&
        typeof item === "object"
      ) {
        const value =
          item.label ??
          item.name ??
          item.value ??
          item.type ??
          item.roomType ??
          item.amenity ??
          item.title ??
          "";

        return typeof value === "string"
          ? value.trim()
          : "";
      }

      return "";
    })
    .filter(Boolean);
}


export default function PublicPGPage({
  params,
}) {
  const [slug, setSlug] =
    useState("");

    

  const [profile, setProfile] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [notFound, setNotFound] =
    useState(false);

  const [error, setError] =
    useState("");

  const [
    previewPhotoIndex,
    setPreviewPhotoIndex,
  ] = useState(null);


  useEffect(() => {
    async function resolveParams() {
      const resolvedParams =
        await params;

      setSlug(
        resolvedParams?.slug ?? ""
      );
    }

    resolveParams();
  }, [params]);


const loadProfile =
  useCallback(async () => {
    if (!slug) {
      return;
    }

    setLoading(true);
    setError("");
    setNotFound(false);

    try {
      const response =
        await fetch(
          `/api/public/pg/${encodeURIComponent(
            slug
          )}`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

      const result =
        await response.json();

      if (response.status === 404) {
        setNotFound(true);
        setProfile(null);
        return;
      }

      if (!response.ok) {
        throw new Error(
          result?.message ||
            "Failed to load PG profile"
        );
      }

      const data =
        result?.data ?? result;

      setProfile({
        ...data,

        googleMapsUrl:
          data?.googleMapsUrl ?? "",

        amenities:
          normalizeList(
            data?.amenities
          ),

        roomTypes:
          normalizeList(
            data?.roomTypes
          ),

        photos:
          Array.isArray(
            data?.photos
          )
            ? [...data.photos].sort(
                (a, b) =>
                  Number(
                    a?.sortOrder ?? 0
                  ) -
                  Number(
                    b?.sortOrder ?? 0
                  )
              )
            : [],
      });
    } catch (requestError) {
      console.error(
        "Load public PG profile error:",
        requestError
      );

      setError(
        requestError?.message ||
          "Failed to load PG profile"
      );
    } finally {
      setLoading(false);
    }
  }, [slug]);


useEffect(() => {
  loadProfile();
}, [loadProfile]);





useEffect(() => {
  function handleKeyDown(event) {
    if (previewPhotoIndex === null) {
      return;
    }

    if (event.key === "Escape") {
      setPreviewPhotoIndex(null);
      return;
    }

    const photos = profile?.photos ?? [];

    if (!photos.length) {
      return;
    }

    if (event.key === "ArrowLeft") {
      setPreviewPhotoIndex(
        (currentIndex) => {
          if (currentIndex === null) {
            return null;
          }

          return (
            currentIndex -
              1 +
              photos.length
          ) % photos.length;
        }
      );
    }

    if (event.key === "ArrowRight") {
      setPreviewPhotoIndex(
        (currentIndex) => {
          if (currentIndex === null) {
            return null;
          }

          return (
            currentIndex + 1
          ) % photos.length;
        }
      );
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
}, [
  previewPhotoIndex,
  profile?.photos,
]);


  function showPreviousPhoto() {
    const photos =
      profile?.photos ?? [];

    if (
      !photos.length ||
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
      ) % photos.length
    );
  }


  function showNextPhoto() {
    const photos =
      profile?.photos ?? [];

    if (
      !photos.length ||
      previewPhotoIndex ===
        null
    ) {
      return;
    }

    setPreviewPhotoIndex(
      (
        previewPhotoIndex +
          1
      ) % photos.length
    );
  }


  if (loading) {
    return (
      <main className="public-pg-state-page">
        <div className="public-pg-loader" />

        <p>
          Loading property...
        </p>
      </main>
    );
  }


  if (notFound) {
    return (
      <main className="public-pg-state-page">
        <div className="public-pg-state-icon">
          <Building2 size={30} />
        </div>

        <h1>
          PG not available
        </h1>

        <p>
          This PG profile is not
          currently published or
          the link is invalid.
        </p>
      </main>
    );
  }


  if (error || !profile) {
    return (
      <main className="public-pg-state-page">
        <div className="public-pg-state-icon">
          <Building2 size={30} />
        </div>

        <h1>
          Unable to load PG
        </h1>

        <p>
          {error ||
            "Something went wrong while loading this property."}
        </p>

        <button
          type="button"
          onClick={loadProfile}
        >
          Try again
        </button>
      </main>
    );
  }


  const coverPhoto =
    profile.photos?.[0];

  return (
    <main className="public-pg-page">
      <div className="public-pg-container">
        <section className="public-pg-hero">
          <div className="public-pg-cover">
            {coverPhoto?.fileUrl ? (
              <img
                src={
                  coverPhoto.fileUrl
                }
                alt={
                  profile.pgName
                }
              />
            ) : (
              <div className="public-pg-cover-placeholder">
                <Building2
                  size={48}
                />

                <span>
                  Property photo
                </span>
              </div>
            )}

            <div className="public-pg-cover-shade" />

            <div className="public-pg-cover-content">
              <span className="public-pg-eyebrow">
                PG ACCOMMODATION
              </span>

              <h1>
                {profile.pgName}
              </h1>

              {profile.address ? (
                <div className="public-pg-location">
                  <MapPin
                    size={17}
                  />

                  <span>
                    {
                      profile.address
                    }
                  </span>
                </div>
              ) : null}
            </div>
          </div>
        </section>


        <div className="public-pg-content-grid">
          <div className="public-pg-main-content">
            {profile.description ? (
              <section className="public-pg-card">
                <span className="public-pg-section-label">
                  ABOUT
                </span>

                <h2>
                  About this PG
                </h2>

                <p className="public-pg-description">
                  {
                    profile.description
                  }
                </p>
              </section>
            ) : null}


            {profile.amenities
              .length > 0 ? (
              <section className="public-pg-card">
                <span className="public-pg-section-label">
                  FACILITIES
                </span>

                <h2>
                  Amenities
                </h2>

                <div className="public-pg-tags">
                  {profile.amenities.map(
                    (
                      amenity,
                      index
                    ) => (
                      <span
                        key={`${amenity}-${index}`}
                      >
                        <span className="public-pg-tag-check">
                          ✓
                        </span>

                        {
                          amenity
                        }
                      </span>
                    )
                  )}
                </div>
              </section>
            ) : null}


            {profile.roomTypes
              .length > 0 ? (
              <section className="public-pg-card">
                <span className="public-pg-section-label">
                  ACCOMMODATION
                </span>

                <h2>
                  Available room
                  types
                </h2>

                <div className="public-pg-room-types">
                  {profile.roomTypes.map(
                    (
                      roomType,
                      index
                    ) => (
                      <div
                        key={`${roomType}-${index}`}
                        className="public-pg-room-type"
                      >
                        <Building2
                          size={19}
                        />

                        <span>
                          {
                            roomType
                          }
                        </span>
                      </div>
                    )
                  )}
                </div>
              </section>
            ) : null}
          </div>


          <aside className="public-pg-contact-card">
            <span className="public-pg-section-label">
              CONTACT
            </span>

            <h2>
              Interested in this
              PG?
            </h2>

            <p>
              Contact the property
              directly for
              availability and
              further details.
            </p>

            {profile.contactNumber ? (
              <div className="public-pg-phone">
                <div>
                  <Phone
                    size={18}
                  />
                </div>

                <span>
                  {
                    profile.contactNumber
                  }
                </span>
              </div>
            ) : null}


            <div className="public-pg-contact-actions">
              {profile.contactNumber ? (
                <a
                  className="public-pg-call-button"
                  href={`tel:${profile.contactNumber}`}
                >
                  <Phone
                    size={17}
                  />

                  Call now
                </a>
              ) : null}


              {profile.googleMapsUrl ? (
                <a
                  className="public-pg-map-button"
                  href={
                    profile.googleMapsUrl
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MapPin
                    size={17}
                  />

                  View on Google Maps

                  <ExternalLink
                    size={14}
                  />
                </a>
              ) : null}
            </div>


            {!profile.contactNumber &&
            !profile.googleMapsUrl ? (
              <div className="public-pg-no-contact">
                Contact information
                is not available.
              </div>
            ) : null}
          </aside>
        </div>


        {profile.photos.length >
        0 ? (
          <section className="public-pg-gallery-section">
            <div className="public-pg-gallery-heading">
              <div>
                <span className="public-pg-section-label">
                  GALLERY
                </span>

                <h2>
                  Property photos
                </h2>
              </div>

              <span>
                {
                  profile.photos
                    .length
                }{" "}
                {profile.photos
                  .length === 1
                  ? "photo"
                  : "photos"}
              </span>
            </div>

            <div className="public-pg-gallery">
              {profile.photos.map(
                (
                  photo,
                  index
                ) => (
                  <button
                    type="button"
                    key={
                      photo.id ??
                      `photo-${index}`
                    }
                    className={`public-pg-gallery-item ${
                      index === 0
                        ? "cover"
                        : ""
                    }`}
                    onClick={() =>
                      setPreviewPhotoIndex(
                        index
                      )
                    }
                  >
                    <img
                      src={
                        photo.fileUrl
                      }
                      alt={`${profile.pgName} property photo ${
                        index + 1
                      }`}
                    />

                    {index === 0 ? (
                      <span className="public-pg-gallery-cover-label">
                        Cover
                      </span>
                    ) : null}
                  </button>
                )
              )}
            </div>
          </section>
        ) : null}


        <footer className="public-pg-footer">
          <Building2
            size={17}
          />

          <span>
            {
              profile.pgName
            }
          </span>
        </footer>
      </div>


      {previewPhotoIndex !==
        null &&
      profile.photos?.[
        previewPhotoIndex
      ]?.fileUrl ? (
        <div
          className="public-pg-lightbox-backdrop"
          onMouseDown={(
            event
          ) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setPreviewPhotoIndex(
                null
              );
            }
          }}
        >
          <div className="public-pg-lightbox">
            <div className="public-pg-lightbox-header">
              <div>
                <strong>
                  {
                    profile.pgName
                  }
                </strong>

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

              <button
                type="button"
                aria-label="Close photo"
                onClick={() =>
                  setPreviewPhotoIndex(
                    null
                  )
                }
              >
                <X
                  size={21}
                />
              </button>
            </div>


            <div className="public-pg-lightbox-image">
              {profile.photos
                .length > 1 ? (
                <button
                  type="button"
                  className="public-pg-lightbox-nav public-pg-lightbox-prev"
                  aria-label="Previous photo"
                  onClick={
                    showPreviousPhoto
                  }
                >
                  <ChevronLeft
                    size={25}
                  />
                </button>
              ) : null}

              <img
                src={
                  profile.photos[
                    previewPhotoIndex
                  ].fileUrl
                }
                alt={`${profile.pgName} property photo ${
                  previewPhotoIndex +
                  1
                }`}
              />

              {profile.photos
                .length > 1 ? (
                <button
                  type="button"
                  className="public-pg-lightbox-nav public-pg-lightbox-next"
                  aria-label="Next photo"
                  onClick={
                    showNextPhoto
                  }
                >
                  <ChevronRight
                    size={25}
                  />
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}