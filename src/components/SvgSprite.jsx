// Shared icons: screens reference them via <use href="#i-…">.
export default function SvgSprite() {
  return (
    <svg width={0} height={0} style={{ position: 'absolute' }} aria-hidden="true">
      <defs>
        <linearGradient id="gGold" x1={0} y1={0} x2={1} y2={1}>
          <stop offset={0} stopColor="#F0D59C" />
          <stop offset={1} stopColor="#B8924A" />
        </linearGradient>
        {/* v4.30: camp, sky, weather, doctrine (inserted before i-home) */}
        <symbol id="i-camp" viewBox="0 0 24 24">
          <path
            d="M2.8 19.5 12 4.5l9.2 15Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M12 4.5v15M9 19.5l3-5.5 3 5.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </symbol>
        <symbol id="i-sol" viewBox="0 0 24 24">
          <circle
            cx={12}
            cy={12}
            r="4.2"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M5.5 18.5l1.7-1.7M16.8 7.2l1.7-1.7"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </symbol>
        <symbol id="i-lune" viewBox="0 0 24 24">
          <path
            d="M15.8 3.6a8.6 8.6 0 1 0 4.6 14.8 7.1 7.1 0 0 1-4.6-14.8Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M18.5 6.5v2M17.5 7.5h2"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </symbol>
        <symbol id="i-aube" viewBox="0 0 24 24">
          <path
            d="M3 18.5h18M6.8 18.5a5.2 5.2 0 0 1 10.4 0"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M12 3.5v5M9.6 6l2.4-2.5L14.4 6M4.6 12.6l1.4 1M19.4 12.6l-1.4 1"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </symbol>
        <symbol id="i-crep" viewBox="0 0 24 24">
          <path
            d="M3 18.5h18M6.8 18.5a5.2 5.2 0 0 1 10.4 0"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M12 3.5v5M9.6 6.1l2.4 2.4 2.4-2.4M4.6 12.6l1.4 1M19.4 12.6l-1.4 1"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </symbol>
        <symbol id="i-pluie" viewBox="0 0 24 24">
          <path
            d="M7 15.5a4 4 0 0 1-.4-8 5.5 5.5 0 0 1 10.5 1.4A3.4 3.4 0 0 1 17.3 15.5Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M8.5 18.2l-.8 2M12.5 18.2l-.8 2M16.5 18.2l-.8 2"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </symbol>
        <symbol id="i-grele" viewBox="0 0 24 24">
          <path
            d="M12 2.8v18.4M4 7.4l16 9.2M4 16.6l16-9.2"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M9.6 4.4 12 6.6l2.4-2.2M9.6 19.6 12 17.4l2.4 2.2"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </symbol>
        <symbol id="i-sable" viewBox="0 0 24 24">
          <path
            d="M3 8c2.2-1.6 4.4-1.6 6.6 0s4.4 1.6 6.6 0M3 13c2.2-1.6 4.4-1.6 6.6 0s4.4 1.6 6.6 0 3.3-1.2 4.8-.4M5 18c2.2-1.6 4.4-1.6 6.6 0s4.4 1.6 6.6 0"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </symbol>
        <symbol id="i-vent" viewBox="0 0 24 24">
          <path
            d="M3 9h11.5a2.6 2.6 0 1 0-2.6-2.6M3 13.5h15.5a2.6 2.6 0 1 1-2.6 2.6M3 18h7"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </symbol>
        <symbol id="i-doctrine" viewBox="0 0 24 24">
          <path
            d="M12 3 20 6.5v5.2c0 4.4-3.3 7.8-8 9.3-4.7-1.5-8-4.9-8-9.3V6.5Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M8.6 12.2l2.4 2.4 4.6-4.8"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </symbol>
        <symbol id="i-home" viewBox="0 0 24 24">
          <path
            d="M12 2.8 20 7.4v9.2L12 21.2 4 16.6V7.4Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
          <circle cx={12} cy={12} r="2.6" fill="currentColor" />
        </symbol>
        <symbol id="i-dex" viewBox="0 0 24 24">
          <rect x="4.5" y="3.5" width={15} height={17} rx={3} fill="none" stroke="currentColor" strokeWidth="1.7" />
          <path d="M8.5 8h7M8.5 12h7M8.5 16h4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </symbol>
        <symbol id="i-fight" viewBox="0 0 24 24">
          <circle cx={12} cy={12} r="7.5" fill="none" stroke="currentColor" strokeWidth="1.7" />
          <circle cx={12} cy={12} r="2.6" fill="currentColor" />
          <path
            d="M12 1.8v4M12 18.2v4M1.8 12h4M18.2 12h4"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
        </symbol>
        <symbol id="i-types" viewBox="0 0 24 24">
          <g fill="none" stroke="currentColor" strokeWidth="1.7">
            <circle cx={9} cy="9.5" r={5} />
            <circle cx={15} cy="9.5" r={5} />
            <circle cx={12} cy="14.8" r={5} />
          </g>
        </symbol>
        <symbol id="i-league" viewBox="0 0 24 24">
          <g fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 3.5h8v5.5a4 4 0 0 1-8 0Z" />
            <path d="M8 5.5H5.2a3 3 0 0 0 3.1 4.4M16 5.5h2.8a3 3 0 0 1-3.1 4.4M12 13v4.5M8.5 20.5h7" />
          </g>
        </symbol>
        <symbol id="i-arrow" viewBox="0 0 16 16">
          <path
            d="M3 8h10M9 4l4 4-4 4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </symbol>
        <symbol id="i-plus" viewBox="0 0 16 16">
          <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
        </symbol>
        <symbol id="i-chev" viewBox="0 0 20 20">
          <path
            d="m5 8 5 5 5-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </symbol>
        <symbol id="i-x" viewBox="0 0 16 16">
          <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </symbol>
        <symbol id="i-save" viewBox="0 0 24 24">
          <g fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round">
            <path d="M12 2.8 20 7.4v9.2L12 21.2 4 16.6V7.4Z" />
            <path d="M12 7.5v7M8.8 11.6 12 14.8l3.2-3.2" strokeLinecap="round" />
          </g>
        </symbol>
        <symbol id="i-grass" viewBox="0 0 24 24">
          <path
            d="M3 20c2-5 3-9 3-13 1.5 3 2 6 2 9 .8-4 2.2-7 4-9-.5 4 0 8 1 11 1-3 2.6-6 5-8-1.2 3-1.6 6-1.5 10"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M2 20.5h20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </symbol>
        <symbol id="i-book" viewBox="0 0 24 24">
          <path
            d="M4 5.5C4 4.7 4.7 4 5.5 4H11v15H5.5A1.5 1.5 0 0 0 4 20.5ZM20 5.5c0-.8-.7-1.5-1.5-1.5H13v15h5.5c.8 0 1.5.7 1.5 1.5Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </symbol>
        <symbol id="i-team" viewBox="0 0 24 24">
          <g fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx={8} cy={8} r="3.4" />
            <circle cx={16} cy={8} r="3.4" />
            <circle cx={8} cy={16} r="3.4" />
            <circle cx={16} cy={16} r="3.4" />
          </g>
        </symbol>
        <symbol id="i-lock" viewBox="0 0 24 24">
          <g fill="none" stroke="currentColor" strokeWidth={2} strokeLinejoin="round">
            <rect x={5} y="10.5" width={14} height={10} rx="2.5" />
            <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" />
          </g>
        </symbol>
        <symbol id="i-check" viewBox="0 0 24 24">
          <path
            d="m5 12.5 4.5 4.5L19 7.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </symbol>
        <symbol id="i-star" viewBox="0 0 24 24">
          <path d="m12 3 2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 16.8 6.6 19.7l1.1-6.1L3.2 9.4l6.1-.8Z" fill="currentColor" />
        </symbol>
        <symbol id="i-play" viewBox="0 0 24 24">
          <path d="M8 5.5v13l10.5-6.5Z" fill="currentColor" />
        </symbol>
        <symbol id="i-logo" viewBox="0 0 32 32">
          <path
            d="M16 2.5 27.7 9.25v13.5L16 29.5 4.3 22.75V9.25Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <path
            stroke="currentColor"
            d="M8.5 16.5h4l2.2-5.5 2.6 10 2.1-4.5h4.1"
            fill="none"
            strokeWidth="2.1"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </symbol>
        {/* added by the v4 interface (formerly inserted by the engine, v4-03) */}
        <symbol id="i-map" viewBox="0 0 24 24">
          <path
            d="M3.5 6.5 9 4l6 2.5L20.5 4v13.5L15 20l-6-2.5-5.5 2.5Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
          <path d="M9 4v13.5M15 6.5V20" stroke="currentColor" strokeWidth="1.7" />
        </symbol>
        <symbol id="i-quest" viewBox="0 0 24 24">
          <path
            d="M6 3.5h9.5L19 7v13.5H6Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
          <path d="M9 10h7M9 13.5h7M9 17h4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </symbol>
        <symbol id="i-bag" viewBox="0 0 24 24">
          <path d="M5 8.5h14l-1 12H6Z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
          <path d="M9 8.5V7a3 3 0 0 1 6 0v1.5M9.5 13h5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </symbol>
        <symbol id="i-shop" viewBox="0 0 24 24">
          <path
            d="M4 9.5 5.5 4h13L20 9.5M5 9.5V20h14V9.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
          <path
            d="M4 9.5a2.7 2.7 0 0 0 5.3 0 2.7 2.7 0 0 0 5.4 0 2.7 2.7 0 0 0 5.3 0M10 20v-5h4v5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
        </symbol>
        <symbol id="i-gear" viewBox="0 0 24 24">
          <circle cx={12} cy={12} r={3.2} fill="none" stroke="currentColor" strokeWidth="1.7" />
          <path
            d="M12 2.8v2.6M12 18.6v2.6M21.2 12h-2.6M5.4 12H2.8M18.5 5.5l-1.8 1.8M7.3 16.7l-1.8 1.8M18.5 18.5l-1.8-1.8M7.3 7.3 5.5 5.5"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
          />
          <circle cx={12} cy={12} r={6.6} fill="none" stroke="currentColor" strokeWidth="1.7" />
        </symbol>
        <symbol id="i-gem" viewBox="0 0 24 24">
          <path d="M7 4h10l4 5-9 11L3 9Z" fill="currentColor" opacity=".25" />
          <path
            d="M7 4h10l4 5-9 11L3 9ZM3 9h18M9.5 4 8 9l4 11 4-11-1.5-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </symbol>
        <symbol id="i-menu" viewBox="0 0 24 24">
          <path d="M4.5 7h15M4.5 12h15M4.5 17h15" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
        </symbol>
        <symbol id="i-heal" viewBox="0 0 24 24">
          <path
            d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
          <path d="M12 10.5v5M9.5 13h5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </symbol>
        <symbol id="i-chevr" viewBox="0 0 20 20">
          <path
            d="m8 5 5 5-5 5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </symbol>
        <symbol id="i-chevl" viewBox="0 0 20 20">
          <path
            d="m12 5-5 5 5 5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </symbol>
        <symbol id="i-compass" viewBox="0 0 48 48">
          <circle cx={24} cy={24} r={21} fill="none" stroke="currentColor" strokeWidth="1.4" />
          <circle cx={24} cy={24} r={16} fill="none" stroke="currentColor" strokeWidth=".8" opacity=".6" />
          <path d="M24 4 28 24 24 44 20 24Z" fill="currentColor" opacity=".9" />
          <path d="M4 24 24 20 44 24 24 28Z" fill="currentColor" opacity=".45" />
          <text
            x={24}
            y={11.5}
            textAnchor="middle"
            fontSize="6.5"
            fontWeight="800"
            fill="#0b2236"
            fontFamily="Archivo,Arial"
          >
            N
          </text>
        </symbol>
        <symbol id="i-trophy" viewBox="0 0 24 24">
          <path d="M8 3.5h8v5.5a4 4 0 0 1-8 0Z" fill="currentColor" opacity=".25" />
          <g fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 3.5h8v5.5a4 4 0 0 1-8 0Z" />
            <path d="M8 5.5H5.2a3 3 0 0 0 3.1 4.4M16 5.5h2.8a3 3 0 0 1-3.1 4.4M12 13v4.5M8.5 20.5h7" />
          </g>
        </symbol>
        <symbol id="i-medal" viewBox="0 0 24 24">
          <g fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round">
            <path d="M8 3h8l-2.2 6h-3.6Z" />
            <circle cx={12} cy={15} r={5.5} />
          </g>
          <path d="m12 12.2 1 2 2.2.3-1.6 1.5.4 2.2-2-1.1-2 1.1.4-2.2-1.6-1.5 2.2-.3Z" fill="currentColor" />
        </symbol>
        <symbol id="i-sound" viewBox="0 0 24 24">
          <path
            d="M4 9.5h3.5L12 5.5v13l-4.5-4H4Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
          <path
            d="M15.5 9a4.5 4.5 0 0 1 0 6M18 6.5a8 8 0 0 1 0 11"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
        </symbol>
        <symbol id="i-phone" viewBox="0 0 24 24">
          <rect x={7} y={2.8} width={10} height={18.4} rx={2.4} fill="none" stroke="currentColor" strokeWidth="1.7" />
          <path d="M10.5 18h3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </symbol>
        <symbol id="i-user" viewBox="0 0 24 24">
          <circle cx={12} cy={8.5} r={4} fill="none" stroke="currentColor" strokeWidth="1.7" />
          <path
            d="M4.5 20.5a7.5 7.5 0 0 1 15 0"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
        </symbol>
        <symbol id="i-bolt" viewBox="0 0 24 24">
          <path
            d="M13.5 2.5 5 13.5h6l-1 8 8.5-11h-6Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
        </symbol>
      </defs>
    </svg>
  );
}
