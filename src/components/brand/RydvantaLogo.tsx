import React from "react";
import Link from "next/link";

interface RydvantaLogoProps {
  variant?: "default" | "light";
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
  className?: string;
  asLink?: boolean;
}

export const RydvantaLogo: React.FC<RydvantaLogoProps> = ({
  variant = "default",
  size = "md",
  showTagline = false,
  className = "",
  asLink = true,
}) => {
  const isLight = variant === "light";

  const sizeConfig = {
    sm: {
      markWidth: 32,
      markHeight: 24,
      titleSize: "text-lg",
      subSize: "text-[10px]",
      tagSize: "text-[9px]",
      gap: "gap-2",
    },
    md: {
      markWidth: 40,
      markHeight: 28,
      titleSize: "text-xl",
      subSize: "text-xs",
      tagSize: "text-[10px]",
      gap: "gap-2.5",
    },
    lg: {
      markWidth: 50,
      markHeight: 34,
      titleSize: "text-2xl",
      subSize: "text-sm",
      tagSize: "text-xs",
      gap: "gap-3",
    },
  }[size];

  const content = (
    <div className={`flex items-center ${sizeConfig.gap} select-none ${className}`}>
      {/* Authentic Route Ribbon SVG Icon matching reference design */}
      <svg
        width={sizeConfig.markWidth}
        height={sizeConfig.markHeight}
        viewBox="0 0 48 34"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 transition-transform group-hover:scale-105"
      >
        {/* Top Terracotta / Burnt Orange ribbon arc */}
        <path
          d="M4 27C12 25 18 16 26 10C32 5 40 4 46 6C42 8 36 12 30 17C22 23 16 31 6 31C5 30 4 28 4 27Z"
          fill="#C94B18"
        />
        {/* Main Road Highway sweep in Charcoal/Forest */}
        <path
          d="M6 31C16 31 22 23 30 17C36 12 42 8 46 6C47 8 47 11 44 14C37 21 30 29 18 33C14 34 9 33 6 31Z"
          fill="#123B2F"
        />
        {/* Road Center Line Dashes (White / Ivory) */}
        <path
          d="M12 31.5L16 30M22 25.5L26 21.5M33 16L37 12"
          stroke="#F8F4EC"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeDasharray="2 3"
        />
        {/* Forest Green Base accent */}
        <path
          d="M18 33C30 29 37 21 44 14C45 15 45 17 43 19C36 26 28 32 17 34C15 34 16 33.5 18 33Z"
          fill="#0B2921"
          opacity="0.85"
        />
      </svg>

      {/* Typography */}
      <div className="flex flex-col leading-none">
        <div className="flex items-baseline gap-1.5">
          <span
            className={`font-black tracking-tight ${sizeConfig.titleSize} ${
              isLight ? "text-white" : "text-charcoal"
            }`}
          >
            Rydvanta
          </span>
          <span className={`font-bold tracking-normal ${sizeConfig.subSize} text-terracotta`}>
            Transit
          </span>
        </div>
        {showTagline && (
          <span
            className={`font-medium tracking-wide ${sizeConfig.tagSize} ${
              isLight ? "text-ivory-soft/80" : "text-charcoal-muted"
            }`}
          >
            Every route. Reliably booked.
          </span>
        )}
      </div>
    </div>
  );

  if (asLink) {
    return (
      <Link href="/" className="group inline-flex items-center">
        {content}
      </Link>
    );
  }

  return content;
};
