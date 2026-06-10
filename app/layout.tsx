import type { Metadata } from "next"
import "./globals.css"
import { Providers } from "@/components/layout/providers"

export const metadata: Metadata = {
  title: "School ERP",
  description: "School Management System",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
