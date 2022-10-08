import '../styles/globals.css'
import { useEffect } from 'react'
import type { AppProps } from 'next/app'
import { MantineProvider } from '@mantine/core'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import axios from 'axios'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 初期設定だと、失敗しても3回リトライを繰り返す
      retry: false,
      // ブラウザにフォーカスを当てたときにRestAPIにフェッチが走るのでfalseに
      refetchOnWindowFocus: false,
    },
  },
})

function MyApp({ Component, pageProps }: AppProps) {
  // サーバーサイドとのクッキーのやり取りを許可する
  axios.defaults.withCredentials = true

  // ロードされたときに、csrfTokenを取得する
  useEffect(() => {
    const getCsrfToken = async () => {
      const { data } = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/csrf`
      )
      // axiosのdefault設定でヘッダーに取得したcsrf-tokenを付与する
      axios.defaults.headers.common['csrf-token'] = data.csrfToken
    }
    getCsrfToken()
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <MantineProvider
        withGlobalStyles
        withNormalizeCSS
        theme={{
          /** Put your mantine theme override here */
          colorScheme: 'dark',
          fontFamily: 'Verdata, sans-serif',
        }}
      >
        <Component {...pageProps} />
      </MantineProvider>
      <ReactQueryDevtools />
    </QueryClientProvider>
  )
}

export default MyApp
