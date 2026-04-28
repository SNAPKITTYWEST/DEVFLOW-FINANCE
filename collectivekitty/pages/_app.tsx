import { SessionProvider } from "next-auth/react"
import type { AppProps } from "next/app"
import { Toaster } from "react-hot-toast"
import "../styles/globals.css"

export default function App({
  Component, pageProps: { session, ...pageProps }
}: AppProps) {
  return (
    <SessionProvider session={session}>
      <Toaster position="bottom-right" toastOptions={{
        style: {
          background: '#111',
          color: '#fff',
          border: '1px solid #222',
          fontFamily: 'monospace',
          fontSize: '12px',
        },
      }} />
      <Component {...pageProps} />
    </SessionProvider>
  )
}
