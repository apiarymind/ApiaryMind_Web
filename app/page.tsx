import DynamicPage, { generateStaticParams } from "./[slug]/page";

// Reuse the dynamic page logic for the root path using 'landing' slug
export default async function HomePage() {
  return <DynamicPage params={{ slug: 'landing' }} />;
}

export { generateStaticParams };
