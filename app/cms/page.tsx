export default function CmsIntroPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-amber-200 mb-3">
        Dynamiczne strony CMS ApiaryMind
      </h1>
      <p className="text-sm text-amber-100/85 mb-3">
        Ta sekcja będzie wyświetlać strony zdefiniowane w panelu administratora (Strapi).
        Każda strona w CMS może mieć własne sekcje, formularze i treści.
      </p>
      <p className="text-sm text-amber-100/80">
        Przykładowo: <code>/cms/aktualnosci</code>, <code>/cms/poradnik</code>, <code>/cms/regulaminy</code>.
      </p>
    </div>
  );
}