export default function Logo({ size = 36 }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 64 64"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            style={{ display: "block" }}
        >
            <defs>
                <linearGradient id="g1" x1="0" x2="1">
                    <stop offset="0" stopColor="#60a5fa" />
                    <stop offset="1" stopColor="#3b82f6" />
                </linearGradient>
            </defs>

            <rect width="64" height="64" rx="12" fill="url(#g1)"></rect>

            <g transform="translate(10,10)" fill="#fff">
                <path d="M6 20 L18 8 L30 20 L18 32 Z" opacity="0.96" />
                <circle cx="18" cy="18" r="4" />
            </g>
        </svg>
    );
}
