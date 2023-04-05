import "@/styles/index.scss";
import type { AppProps } from "next/app";
import { useEffect } from "react";

export default function App({ Component, pageProps }: AppProps) {
  // Not necessarily the best approach (just a working one)
  useEffect(() => {
    document.body.classList.add("js-enabled");
  }, []);

  return <Component {...pageProps} />;
}
