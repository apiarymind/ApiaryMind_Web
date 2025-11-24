"use client";

import { useAuth } from "../../../../lib/AuthContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiGet, apiPost, apiPut } from "../../../../lib/apiClient";

interface Section {
  id: number;
  type: string;
  order: number;
  content: any;
  title?: string;
}

interface Page {
  id: number;
  slug: string;
  title: string;
  sections: Section[];
}

// Stub pages for UI demo
const MOCK_PAGES: Page[] = [
  { 
    id: 1, 
    slug: 'landing', 
    title: 'Strona Główna', 
    sections: [
      { id: 101, type: 'HERO', order: 1, content: 'Witaj w ApiaryMind' },
      { id: 102, type: 'TEXT', order: 2, content: 'Opis systemu...' }
    ] 
  },
  { 
    id: 2, 
    slug: 'beta', 
    title: 'Program Beta', 
    sections: [
      { id: 201, type: 'FORM', order: 1, content: 'Formularz zgłoszeniowy' }
    ] 
  }
];

export default function AdminCMSPage() {
  const { profile, loading } = useAuth();
  const router = useRouter();
  const [pages, setPages] = useState<Page[]>(MOCK_PAGES);
  const [selectedPage, setSelectedPage] = useState<Page | null>(null);

  useEffect(() => {
    if (!loading && profile?.role !== 'SUPER_ADMIN') {
       router.push("/dashboard");
    }
  }, [loading, profile, router]);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData("sectionIndex", index.toString());
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    if (!selectedPage) return;
    const dragIndex = parseInt(e.dataTransfer.getData("sectionIndex"));
    if (dragIndex === dropIndex) return;

    const newSections = [...selectedPage.sections];
    const [movedSection] = newSections.splice(dragIndex, 1);
    newSections.splice(dropIndex, 0, movedSection);

    // Update order numbers
    const reordered = newSections.map((s, idx) => ({ ...s, order: idx + 1 }));
    
    setSelectedPage({ ...selectedPage, sections: reordered });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  if (profile?.role !== 'SUPER_ADMIN') return null;

  return (
    <div>
      <h1 className="text-3xl font-bold text-amber-500 mb-6">CMS - Edytor Stron</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-brown-800 rounded-xl border border-brown-700 p-4">
           <h3 className="font-bold text-amber-100 mb-4">Strony</h3>
           <ul className="space-y-2">
             {pages.map(page => (
               <li key={page.id}>
                 <button 
                   onClick={() => setSelectedPage(page)}
                   className={`w-full text-left px-3 py-2 rounded ${selectedPage?.id === page.id ? 'bg-amber-500 text-brown-900 font-bold' : 'text-amber-100 hover:bg-brown-700'}`}
                 >
                   {page.title} <span className="text-xs opacity-60">/{page.slug}</span>
                 </button>
               </li>
             ))}
           </ul>
        </div>

        <div className="md:col-span-3 bg-brown-800 rounded-xl border border-brown-700 p-6 min-h-[400px]">
           {selectedPage ? (
             <div>
               <div className="flex justify-between items-center mb-6">
                 <h2 className="text-xl font-bold text-amber-100">Edycja: {selectedPage.title}</h2>
                 <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm font-bold shadow">
                   Zapisz zmiany
                 </button>
               </div>

               <div className="space-y-4">
                 {selectedPage.sections.map((section, index) => (
                   <div 
                     key={section.id}
                     draggable
                     onDragStart={(e) => handleDragStart(e, index)}
                     onDrop={(e) => handleDrop(e, index)}
                     onDragOver={handleDragOver}
                     className="bg-brown-700 p-4 rounded border border-brown-600 cursor-move hover:border-amber-500/50 flex items-center gap-4 group"
                   >
                     <div className="text-2xl text-amber-500/50">☰</div>
                     <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold bg-amber-900/50 text-amber-200 px-2 py-0.5 rounded uppercase">{section.type}</span>
                          {section.title && <span className="font-bold text-amber-100">{section.title}</span>}
                        </div>
                        <div className="text-sm text-amber-200/70 truncate">
                          {typeof section.content === 'string' ? section.content : 'Complex content'}
                        </div>
                     </div>
                     <button className="text-amber-200 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">Usuń</button>
                   </div>
                 ))}
               </div>

               <div className="mt-6 border-2 border-dashed border-brown-600 rounded p-4 text-center text-amber-200/50 hover:border-amber-500/50 hover:text-amber-500 hover:bg-brown-700/30 cursor-pointer transition-colors">
                 + Dodaj nową sekcję
               </div>

             </div>
           ) : (
             <div className="flex items-center justify-center h-full text-amber-200/40">
               Wybierz stronę do edycji
             </div>
           )}
        </div>
      </div>
    </div>
  );
}
