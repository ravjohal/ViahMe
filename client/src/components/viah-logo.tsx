interface ViahLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

export function ViahLogo({ className = "", size = "md" }: ViahLogoProps) {
  const heights = {
    sm: "h-6",
    md: "h-10",
    lg: "h-16",
    xl: "h-24",
  };

  return (
    <div className={`flex items-center gap-2 ${heights[size]} ${className}`}>
      {/* Lotus Icon */}
      <svg
        viewBox="0 0 40 40"
        className="h-full w-auto"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Lotus petals in gradient gold */}
        <defs>
          <linearGradient id="lotusGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="50%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#fb923c" />
          </linearGradient>
        </defs>
        
        {/* Center petal */}
        <path
          d="M20 8 L24 18 L20 28 L16 18 Z"
          fill="url(#lotusGradient)"
          opacity="0.9"
        />
        
        {/* Left petal */}
        <path
          d="M12 12 L20 18 L18 28 L10 22 Z"
          fill="url(#lotusGradient)"
          opacity="0.7"
        />
        
        {/* Right petal */}
        <path
          d="M28 12 L30 22 L22 28 L20 18 Z"
          fill="url(#lotusGradient)"
          opacity="0.7"
        />
        
        {/* Far left petal */}
        <path
          d="M6 16 L10 22 L12 28 L8 24 Z"
          fill="url(#lotusGradient)"
          opacity="0.5"
        />
        
        {/* Far right petal */}
        <path
          d="M34 16 L32 24 L28 28 L30 22 Z"
          fill="url(#lotusGradient)"
          opacity="0.5"
        />
        
        {/* Center dot */}
        <circle cx="20" cy="18" r="2" fill="#ea580c" />
      </svg>

      {/* Text Logo */}
      <div className="flex items-baseline">
        <span className="font-display text-[1.8em] font-bold tracking-tight bg-gradient-to-r from-orange-600 via-orange-500 to-orange-400 bg-clip-text text-transparent">
          Viah
        </span>
        <span className="font-display text-[1.2em] font-normal text-muted-foreground ml-0.5">
          .me
        </span>
      </div>
    </div>
  );
}
