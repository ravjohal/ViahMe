interface ViahLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

export function ViahLogo({ className = "", size = "md" }: ViahLogoProps) {
  const sizeConfig = {
    sm: { height: "h-6", scale: 0.5 },
    md: { height: "h-10", scale: 0.8 },
    lg: { height: "h-16", scale: 1.2 },
    xl: { height: "h-24", scale: 1.6 },
  };

  const config = sizeConfig[size];

  return (
    <div className={`flex items-center relative ${config.height} ${className}`} style={{ minWidth: `${280 * config.scale}px` }}>
      <svg
        viewBox="0 0 400 120"
        className="h-full w-auto"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&display=swap');
          `}</style>
        </defs>

        {/* Bride silhouette with flowing dupatta */}
        <g transform="translate(10, 20)">
          {/* Bride's head */}
          <ellipse cx="35" cy="25" rx="12" ry="15" fill="#6B1F1F" />
          {/* Bride's face profile */}
          <path d="M 35 25 Q 40 25 42 30 Q 42 35 38 37 Q 35 38 32 36 Q 30 34 30 30 Q 30 25 35 25" fill="#F5E6D3" />
          {/* Dupatta on head */}
          <path d="M 25 20 Q 30 15 40 18 Q 45 20 42 25 Q 40 28 35 27 L 25 20" fill="#F97316" opacity="0.8" />
          
          {/* Flowing dupatta/hair streams */}
          <path d="M 40 28 Q 60 25 80 30 Q 85 32 82 35 Q 75 38 65 36 Q 50 34 40 32" fill="#F97316" opacity="0.9" />
          <path d="M 42 32 Q 70 28 95 35 Q 100 37 97 40 Q 88 42 75 40 Q 55 38 42 35" fill="#F97316" opacity="0.8" />
          <path d="M 38 35 Q 65 32 88 40 Q 92 42 89 45 Q 80 47 68 45 Q 50 42 38 38" fill="#F97316" opacity="0.7" />
          
          {/* Small decorative dots on dupatta */}
          <circle cx="60" cy="30" r="1.5" fill="#FFA500" />
          <circle cx="75" cy="35" r="1.5" fill="#FFA500" />
          <circle cx="85" cy="40" r="1.5" fill="#FFA500" />
        </g>

        {/* Decorative flourish on V */}
        <g transform="translate(25, 70)">
          <path d="M 0 0 Q 5 -3 8 0 Q 10 3 8 6 Q 5 8 2 6 Q 0 4 0 0" fill="#6B1F1F" opacity="0.6" />
          <path d="M 2 8 Q 4 10 6 15 Q 7 18 5 20 Q 3 21 1 18 Q 0 15 2 12" fill="#6B1F1F" opacity="0.6" />
          <circle cx="4" cy="3" r="1" fill="#8B2F2F" />
          <circle cx="3" cy="14" r="0.8" fill="#8B2F2F" />
        </g>

        {/* "Viah" text */}
        <text x="40" y="80" fontFamily="Playfair Display, serif" fontSize="65" fontWeight="700" fill="#6B1F1F" letterSpacing="-1">
          Viah
        </text>

        {/* Decorative swirl on 'a' */}
        <g transform="translate(155, 75)">
          <path d="M 0 0 Q -2 3 0 6 Q 2 8 4 6 Q 5 4 4 2 Q 3 0 0 0" fill="#6B1F1F" opacity="0.5" />
          <path d="M 0 -2 Q -3 -5 -5 -8 Q -6 -10 -4 -11 Q -2 -11 0 -9" fill="#6B1F1F" opacity="0.5" />
        </g>

        {/* Dot separator */}
        <circle cx="195" cy="75" r="6" fill="#F97316" />

        {/* "me" text */}
        <text x="210" y="80" fontFamily="Playfair Display, serif" fontSize="65" fontWeight="400" fill="#F97316" letterSpacing="-1">
          me
        </text>

        {/* Groom's Turban (Pagri) above "me" */}
        <g transform="translate(260, 8)">
          {/* Top knot of turban */}
          <ellipse cx="0" cy="0" rx="15" ry="8" fill="#F97316" opacity="0.9" />
          <path d="M -10 -2 Q -5 -8 0 -10 Q 5 -8 10 -2 L 8 0 Q 0 -3 -8 0 Z" fill="#FFA500" />
          
          {/* Turban layers - wrapped fabric effect */}
          <path d="M -20 8 Q -15 5 0 5 Q 15 5 20 8 L 20 12 Q 15 10 0 10 Q -15 10 -20 12 Z" fill="#F97316" opacity="0.95" />
          <path d="M -22 12 Q -17 10 0 10 Q 17 10 22 12 L 22 16 Q 17 14 0 14 Q -17 14 -22 16 Z" fill="#F97316" opacity="0.9" />
          <path d="M -24 16 Q -19 14 0 14 Q 19 14 24 16 L 24 20 Q 19 18 0 18 Q -19 18 -24 20 Z" fill="#F97316" opacity="0.85" />
          <path d="M -25 20 Q -20 18 0 18 Q 20 18 25 20 L 25 24 Q 20 22 0 22 Q -20 22 -25 24 Z" fill="#F97316" opacity="0.8" />
          <path d="M -26 24 Q -21 22 0 22 Q 21 22 26 24 L 26 28 Q 21 26 0 26 Q -21 26 -26 28 Z" fill="#F97316" opacity="0.75" />
          
          {/* Turban fabric lines for detail */}
          <line x1="-18" y1="10" x2="-18" y2="26" stroke="#FFA500" strokeWidth="0.5" opacity="0.6" />
          <line x1="-10" y1="8" x2="-10" y2="28" stroke="#FFA500" strokeWidth="0.5" opacity="0.6" />
          <line x1="0" y1="8" x2="0" y2="28" stroke="#FFA500" strokeWidth="0.5" opacity="0.6" />
          <line x1="10" y1="8" x2="10" y2="28" stroke="#FFA500" strokeWidth="0.5" opacity="0.6" />
          <line x1="18" y1="10" x2="18" y2="26" stroke="#FFA500" strokeWidth="0.5" opacity="0.6" />
        </g>
      </svg>
    </div>
  );
}
