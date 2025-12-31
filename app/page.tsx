import DynamicPage from "./[slug]/page";

export default async function HomePage() {
  return <DynamicPage params={{ slug: 'landing' }} />;
}
