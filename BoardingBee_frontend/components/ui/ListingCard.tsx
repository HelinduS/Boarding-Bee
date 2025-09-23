import React from "react";

export type ListingCardProps = {
  readonly title: string;
  readonly location: string;
  readonly price: number;
  readonly availability: "Available" | "Unavailable";
  readonly thumbnailUrl: string;
  readonly rating?: number;
  readonly onClick?: () => void;
  readonly description?: string;
};

export default function ListingCard({
  title,
  location,
  price,
  availability,
  thumbnailUrl,
  rating,
  onClick,
  description,
}: ListingCardProps) {
  // Keyboard accessibility for card
  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      onClick?.();
    }
  };
  return (
    <button
      type="button"
      className="bg-white rounded-lg shadow hover:shadow-lg transition cursor-pointer flex flex-col text-left p-0 focus:outline-none"
      onClick={onClick}
      onKeyDown={handleKeyDown}
      aria-label={`View details for ${title}`}
      tabIndex={0}
    >
  <div className="aspect-w-16 aspect-h-10 w-full overflow-hidden rounded-t-lg bg-gray-100">
        <img
          src={thumbnailUrl}
          alt={title}
          className="object-cover w-full h-40"
          style={{ objectFit: "cover" }}
        />
      </div>
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-semibold text-lg truncate" title={title}>{title}</h3>
          {rating !== undefined && (
            <span className="ml-2 text-yellow-500 font-medium flex items-center">
              <svg width="16" height="16" fill="currentColor" className="inline mr-1"><path d="M8 12.472l-4.472 2.35.854-4.98L1 6.763l5.014-.728L8 1.5l1.986 4.535 5.014.728-3.382 3.08.854 4.98z"/></svg>
              {rating.toFixed(1)}
            </span>
          )}
        </div>
        <div className="text-gray-600 text-sm mb-2 truncate" title={location}>{location}</div>
        <div className="text-gray-900 font-bold text-xl mb-2">${price.toLocaleString()}</div>
        <div className={`text-xs font-medium mb-2 ${availability === "Available" ? "text-green-600" : "text-red-500"}`}>
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
