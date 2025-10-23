import React from "react";

export type ListingCardProps = {
  readonly title: string;
  readonly location: string;
  readonly price: number;
  readonly availability: "Available" | "Unavailable" | "Occupied";
  readonly thumbnailUrl: string;
  readonly rating?: number | null;
  readonly reviewCount?: number;
  readonly onClick?: () => void;
  readonly description?: string | null;
};

export default function ListingCard({
  title,
  location,
  price,
  availability,
  thumbnailUrl,
  rating,
  reviewCount = 0,
  onClick,
  description,
}: ListingCardProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "Enter" || e.key === " ") onClick?.();
  };

  const hasReviews = (reviewCount ?? 0) > 0;
  const priceLkr = new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    minimumFractionDigits: 0,
  }).format(price);

  return (
    <button
      type="button"
      className="bg-white rounded-lg shadow hover:shadow-lg transition cursor-pointer flex flex-col text-left p-0 focus:outline-none"
      onClick={onClick}
      onKeyDown={handleKeyDown}
      aria-label={`View details for ${title}`}
      tabIndex={0}
    >
      <div className="w-full overflow-hidden rounded-t-lg bg-gray-100">
        <img
          src={thumbnailUrl || "/placeholder.svg"}
          alt={title}
          className="object-cover w-full h-40"
          loading="lazy"
        />
      </div>

      <div className="p-4 flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-semibold text-lg truncate" title={title}>{title}</h3>

          <span className="ml-2 text-xs text-gray-500">
            {hasReviews ? (
              <span className="inline-flex items-center gap-1">
                <svg width="14" height="14" fill="#f59e0b"><path d="M8 12.472l-4.472 2.35.854-4.98L1 6.763l5.014-.728L8 1.5l1.986 4.535 5.014.728-3.382 3.08.854 4.98z"/></svg>
                {Number(rating ?? 0).toFixed(1)} <span className="text-gray-400">({reviewCount})</span>
              </span>
            ) : (
              "No reviews"
            )}
          </span>
        </div>

        <div className="text-gray-600 text-sm mb-2 truncate" title={location}>
          {location}
        </div>

        <div className="text-gray-900 font-bold text-xl mb-2">{priceLkr}</div>

        <div
          className={`text-xs font-medium mb-2 ${
            availability === "Available" ? "text-green-600" : "text-red-500"
          }`}
        >
          {availability}
        </div>

        {description && (
          <div className="text-gray-500 text-xs truncate" title={description}>
            {description.length > 80 ? description.slice(0, 77) + "..." : description}
          </div>
        )}
      </div>
    </button>
  );
}
