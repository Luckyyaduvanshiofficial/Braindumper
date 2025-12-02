import "./app.css";
import { Providers } from "./providers";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://braindumpapp.vercel.app";

export const metadata = {
  // Basic metadata
  title: {
    default: "BrainDumper - Transform Chaos into Clarity",
    template: "%s | BrainDumper",
  },
  description:
    "Dump your chaotic thoughts, let AI organize them into actionable tasks, and focus on what matters. Transform ideas into documentation instantly.",
  keywords: [
    "brain dump",
    "productivity",
    "task management",
    "AI assistant",
    "idea organizer",
    "focus mode",
    "documentation generator",
    "thought organizer",
    "mental clarity",
    "ADHD productivity",
    "task prioritization",
    "markdown generator",
  ],
  authors: [{ name: "Lucky Labs" }],
  creator: "Lucky Labs",
  publisher: "Lucky Labs",
  
  // Favicon and icons
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.svg",
    apple: "/icon.svg",
  },
  
  // Manifest for PWA
  manifest: "/manifest.json",
  
  // Open Graph (Facebook, LinkedIn, etc.)
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "BrainDumper",
    title: "BrainDumper - Transform Chaos into Clarity",
    description:
      "Dump your chaotic thoughts, let AI organize them into actionable tasks, and focus on what matters. The productivity app for overthinkers.",
    images: [
      {
        url: `${siteUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "BrainDumper - Clear your mind, focus better",
      },
    ],
  },
  
  // Twitter Card
  twitter: {
    card: "summary_large_image",
    title: "BrainDumper - Transform Chaos into Clarity",
    description:
      "Dump your thoughts, let AI organize them, focus on one thing. The productivity app for overthinkers.",
    images: [`${siteUrl}/og-image.png`],
    creator: "@luckylabs",
  },
  
  // Robots
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  
  // Verification (add your actual verification codes)
  // verification: {
  //   google: "your-google-verification-code",
  //   yandex: "your-yandex-verification-code",
  // },
  
  // App-specific
  applicationName: "BrainDumper",
  category: "productivity",
  
  // Theme
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#a855f7" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0f" },
  ],
  colorScheme: "dark",
  
  // Other
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
};

// Viewport configuration
export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#a855f7",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fira+Code&family=Inter:opsz,wght@14..32,100..900&family=Poppins:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        
        {/* Structured Data - JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "BrainDumper",
              description:
                "Transform chaotic thoughts into organized action. AI-powered productivity app for mental clarity.",
              url: siteUrl,
              applicationCategory: "ProductivityApplication",
              operatingSystem: "Web",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
              },
              author: {
                "@type": "Organization",
                name: "Lucky Labs",
              },
              featureList: [
                "Brain dump to organized tasks",
                "AI-powered task prioritization",
                "Focus mode with timer",
                "Idea to documentation converter",
                "Task board with Now/Next/Later buckets",
              ],
            }),
          }}
        />
      </head>
      <body className="bg-gray-950 font-[Inter] text-white antialiased" suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
