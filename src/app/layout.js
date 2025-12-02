import "./app.css";
import { Providers } from "./providers";

export const metadata = {
  title: "Brain Dumper - Transform Ideas into Documentation",
  description: "Dump your ideas in any language and get comprehensive documentation for GitHub Copilot development",
  icons: {
    icon: "/appwrite.svg",
  },
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
      </head>
      <body className="bg-gray-950 font-[Inter] text-white antialiased" suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
