import Head from 'next/head';

export default function Layout({ children }) {
  return (
    <>
      <Head>
        <title>Convo App</title>
        <meta name="description" content="Convo application" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main>{children}</main>
    </>
  );
}