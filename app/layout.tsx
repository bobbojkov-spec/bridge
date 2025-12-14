import { inter, poppins, playfair } from '@/lib/fonts'
import { ConfigProvider } from "antd";
import '@/styles/globals.css'
import "antd/dist/reset.css";

export const metadata = {
  title: 'Bridge | Handmade Ceramics',
  description: 'Handmade ceramics inspired by the sea, created with love, touched by nature',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${poppins.variable} ${playfair.variable}`}>
      <body className={inter.className}>
        <ConfigProvider>
          {children}
        </ConfigProvider>
      </body>
    </html>
  )
}
