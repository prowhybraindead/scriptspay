import { cn } from "@/lib/utils";

type LogoProps = {
  className?: string;
};

export function ScriptsLogoIcon({ className }: LogoProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      role="img"
      aria-label="Scripts icon"
      className={cn("h-10 w-10", className)}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M48 14H16V28H48V42H16"
        fill="none"
        stroke="#0F172A"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect x="36" y="50" width="14" height="3.5" rx="1" fill="#10B981" />
    </svg>
  );
}

export function ScriptsLogo({ className }: LogoProps) {
  return (
    <svg
      viewBox="0 0 300 64"
      role="img"
      aria-label="Scripts logo"
      className={cn("h-12 w-auto", className)}
      xmlns="http://www.w3.org/2000/svg"
    >
      <g>
        <path
          d="M48 14H16V28H48V42H16"
          fill="none"
          stroke="#0F172A"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <rect x="36" y="50" width="14" height="3.5" rx="1" fill="#10B981" />
      </g>
      <text
        x="72"
        y="42"
        fontFamily="Inter, system-ui, -apple-system, sans-serif"
        fontSize="32"
        fontWeight="700"
        fill="#0F172A"
        letterSpacing="-0.5"
      >
        Scripts
      </text>
      <rect x="215" y="44" width="16" height="4" rx="1" fill="#10B981" />
    </svg>
  );
}