'use client'

import { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  getVisualCMSPages, 
  saveVisualCMSPage, 
  deleteVisualCMSPage,
  CMSPage 
} from '@/app/actions/visual-cms';
import { CMSBlock, BlockType } from '@/app/types/cms-blocks';
import { BlockRenderer } from '@/components/cms-blocks/BlockRenderer';
import { 
  GripVertical, 
  Plus, 
  Trash2, 
  Edit2, 
  Eye, 
  Save,
  X,
  Layout,
  Type,
  Image as ImageIcon,
  Video,
  Zap,
  Grid,
  Minus
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { GlassCard } from '@/app/components/ui/GlassCard';
import { BlockPropertiesEditor } from './BlockPropertiesEditor';

interface BlockItemProps {
  block: CMSBlock;
  onEdit: (block: CMSBlock) => void;
  onDelete: (blockId: string) => void;
}

function BlockItem({ block, onEdit, onDelete }: BlockItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getBlockIcon = (type: BlockType) => {
    const icons: Record<BlockType, any> = {
      hero: Layout,
      text: Type,
      image: ImageIcon,
      video: Video,
      cta: Zap,
      features: Grid,
      pricing: Grid,
      testimonials: Grid,
      gallery: Grid,
      divider: Minus,
      spacer: Minus,
    };
    const Icon = icons[type] || Layout;
    return <Icon className="w-4 h-4" />;
  };

  const getBlockName = (type: BlockType) => {
    const names: Record<BlockType, string> = {
      hero: 'Hero',
      text: 'Tekst',
      image: 'Obraz',
      video: 'Wideo',
      cta: 'CTA',
      features: 'Funkcje',
      pricing: 'Cennik',
      testimonials: 'Opinie',
      gallery: 'Galeria',
      divider: 'Separator',
      spacer: 'Odstęp',
    };
    return names[type] || type;
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white/5 border border-white/10 rounded-lg p-4 mb-2 group hover:bg-white/10 transition-colors"
    >
      <div className="flex items-center gap-3">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-white/40 hover:text-white/80"
        >
          <GripVertical className="w-5 h-5" />
        </button>
        <div className="flex-1 flex items-center gap-2">
          {getBlockIcon(block.type)}
          <span className="text-white font-medium">{getBlockName(block.type)}</span>
        </div>
        <button
          onClick={() => onEdit(block)}
          className="p-2 text-amber-400 hover:text-amber-300 opacity-0 group-hover:opacity-100 transition-opacity"
          title="Edytuj"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => onDelete(block.id)}
          className="p-2 text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity"
          title="Usuń"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default function VisualCMSEditor() {
  const router = useRouter();
  const [pages, setPages] = useState<CMSPage[]>([]);
  const [selectedPage, setSelectedPage] = useState<CMSPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditingPage, setIsEditingPage] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [editingBlock, setEditingBlock] = useState<CMSBlock | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    loadPages();
  }, []);

  const loadPages = async () => {
    setLoading(true);
    const result = await getVisualCMSPages();
    if (result.error) {
      setError(result.error);
    } else {
      setPages(result.data || []);
    }
    setLoading(false);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id && selectedPage) {
      const oldIndex = selectedPage.blocks.findIndex((b) => b.id === active.id);
      const newIndex = selectedPage.blocks.findIndex((b) => b.id === over.id);

      const newBlocks = arrayMove(selectedPage.blocks, oldIndex, newIndex);
      // Update order property
      const blocksWithOrder = newBlocks.map((block, index) => ({
        ...block,
        order: index,
      }));

      setSelectedPage({
        ...selectedPage,
        blocks: blocksWithOrder,
      });
    }
  };

  const handleAddBlock = (type: BlockType) => {
    if (!selectedPage) return;

    const newBlock: CMSBlock = createDefaultBlock(type, selectedPage.blocks.length);
    const newBlocks = [...selectedPage.blocks, newBlock];
    setSelectedPage({
      ...selectedPage,
      blocks: newBlocks,
    });
    setEditingBlock(newBlock);
  };

  const handleSavePage = async () => {
    if (!selectedPage) return;

    setLoading(true);
    const result = await saveVisualCMSPage(selectedPage);
    if (result.success) {
      await loadPages();
      setIsEditingPage(false);
      setEditingBlock(null);
    } else {
      setError(result.error || 'Błąd zapisywania');
    }
    setLoading(false);
  };

  const handleDeleteBlock = (blockId: string) => {
    if (!selectedPage) return;
    const newBlocks = selectedPage.blocks
      .filter((b) => b.id !== blockId)
      .map((block, index) => ({ ...block, order: index }));
    setSelectedPage({
      ...selectedPage,
      blocks: newBlocks,
    });
  };

  if (loading && pages.length === 0) {
    return <div className="text-white/60">Ładowanie...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Visual CMS Editor</h2>
          <p className="text-white/60 text-sm mt-1">Twórz strony poprzez przeciąganie bloków</p>
        </div>
        <button
          onClick={() => {
            const newPage: CMSPage = {
              id: '',
              slug: '',
              title: 'Nowa Strona',
              blocks: [],
              published: false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };
            setSelectedPage(newPage);
            setIsEditingPage(true);
          }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={18} />
          Nowa Strona
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Pages List */}
        <div className="lg:col-span-1">
          <GlassCard className="p-4">
            <h3 className="text-lg font-bold text-white mb-4">Strony</h3>
            <div className="space-y-2">
              {pages.map((page) => (
                <button
                  key={page.id}
                  onClick={() => {
                    setSelectedPage(page);
                    setIsEditingPage(false);
                    setIsPreviewMode(false);
                  }}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    selectedPage?.id === page.id
                      ? 'bg-primary text-brown-900 font-bold'
                      : 'bg-white/5 hover:bg-white/10 text-white'
                  }`}
                >
                  <div className="font-medium">{page.title}</div>
                  <div className="text-xs opacity-70">/{page.slug}</div>
                </button>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* Editor Canvas */}
        <div className="lg:col-span-2">
          {selectedPage ? (
            <GlassCard className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white">{selectedPage.title}</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsPreviewMode(!isPreviewMode)}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm flex items-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    {isPreviewMode ? 'Edytuj' : 'Podgląd'}
                  </button>
                  {!isEditingPage && (
                    <button
                      onClick={() => setIsEditingPage(true)}
                      className="px-4 py-2 bg-primary hover:bg-amber-400 text-brown-900 rounded-lg text-sm font-bold"
                    >
                      Edytuj
                    </button>
                  )}
                </div>
              </div>

              {isPreviewMode ? (
                <div className="space-y-0">
                  {selectedPage.blocks.map((block) => (
                    <BlockRenderer key={block.id} block={block} preview={true} />
                  ))}
                </div>
              ) : (
                <>
                  {isEditingPage && (
                    <div className="mb-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                      <div className="space-y-2 mb-4">
                        <input
                          type="text"
                          value={selectedPage.slug}
                          onChange={(e) =>
                            setSelectedPage({ ...selectedPage, slug: e.target.value })
                          }
                          placeholder="slug (np. o-nas)"
                          className="w-full px-3 py-2 bg-black/40 border border-white/20 rounded text-white text-sm"
                        />
                        <input
                          type="text"
                          value={selectedPage.title}
                          onChange={(e) =>
                            setSelectedPage({ ...selectedPage, title: e.target.value })
                          }
                          placeholder="Tytuł strony"
                          className="w-full px-3 py-2 bg-black/40 border border-white/20 rounded text-white text-sm"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleSavePage}
                          disabled={loading}
                          className="btn-primary flex items-center gap-2 text-sm"
                        >
                          <Save className="w-4 h-4" />
                          Zapisz
                        </button>
                        <button
                          onClick={() => {
                            setIsEditingPage(false);
                            setEditingBlock(null);
                            loadPages();
                          }}
                          className="btn-secondary text-sm"
                        >
                          Anuluj
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Available Blocks */}
                  {isEditingPage && (
                    <div className="mb-4 p-3 bg-white/5 rounded-lg">
                      <div className="text-sm text-white/60 mb-2">Dodaj blok:</div>
                      <div className="flex flex-wrap gap-2">
                        {(['hero', 'text', 'image', 'video', 'cta', 'features', 'divider', 'spacer'] as BlockType[]).map(
                          (type) => (
                            <button
                              key={type}
                              onClick={() => handleAddBlock(type)}
                              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded text-xs"
                            >
                              + {type}
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  )}

                  {/* Blocks List */}
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={selectedPage.blocks.map((b) => b.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-2">
                        {selectedPage.blocks.map((block) => (
                          <BlockItem
                            key={block.id}
                            block={block}
                            onEdit={setEditingBlock}
                            onDelete={handleDeleteBlock}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>

                  {selectedPage.blocks.length === 0 && (
                    <div className="text-center py-12 text-white/40">
                      <p>Brak bloków. Dodaj pierwszy blok, aby rozpocząć.</p>
                    </div>
                  )}
                </>
              )}
            </GlassCard>
          ) : (
            <GlassCard className="p-12 text-center">
              <p className="text-white/60">Wybierz stronę z listy lub utwórz nową</p>
            </GlassCard>
          )}
        </div>

        {/* Block Properties Editor */}
        <div className="lg:col-span-1">
          {editingBlock && isEditingPage && (
            <GlassCard className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-white">Właściwości</h3>
                <button
                  onClick={() => setEditingBlock(null)}
                  className="text-white/60 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <BlockPropertiesEditor
                block={editingBlock}
                onChange={(updatedBlock) => {
                  if (!selectedPage) return;
                  const newBlocks = selectedPage.blocks.map((b) =>
                    b.id === updatedBlock.id ? updatedBlock : b
                  );
                  setSelectedPage({ ...selectedPage, blocks: newBlocks });
                  setEditingBlock(updatedBlock);
                }}
              />
            </GlassCard>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper function to create default blocks
function createDefaultBlock(type: BlockType, order: number): CMSBlock {
  const baseBlock = {
    id: crypto.randomUUID(),
    order,
  };

  switch (type) {
    case 'hero':
      return {
        ...baseBlock,
        type: 'hero',
        props: {
          title: 'Tytuł',
          subtitle: 'Podtytuł',
          description: 'Opis',
        },
      } as CMSBlock;
    case 'text':
      return {
        ...baseBlock,
        type: 'text',
        props: {
          content: '<p>Tekst</p>',
        },
      } as CMSBlock;
    case 'image':
      return {
        ...baseBlock,
        type: 'image',
        props: {
          src: '',
          alt: 'Image',
        },
      } as CMSBlock;
    case 'video':
      return {
        ...baseBlock,
        type: 'video',
        props: {
          youtubeUrl: '',
        },
      } as CMSBlock;
    case 'cta':
      return {
        ...baseBlock,
        type: 'cta',
        props: {
          title: 'Wezwanie do działania',
          buttonText: 'Kliknij',
          buttonLink: '#',
        },
      } as CMSBlock;
    case 'features':
      return {
        ...baseBlock,
        type: 'features',
        props: {
          features: [
            { title: 'Funkcja 1', description: 'Opis' },
            { title: 'Funkcja 2', description: 'Opis' },
            { title: 'Funkcja 3', description: 'Opis' },
          ],
          columns: 3,
        },
      } as CMSBlock;
    case 'divider':
      return {
        ...baseBlock,
        type: 'divider',
        props: {},
      } as CMSBlock;
    case 'spacer':
      return {
        ...baseBlock,
        type: 'spacer',
        props: {
          height: 40,
        },
      } as CMSBlock;
    default:
      return {
        ...baseBlock,
        type: 'text',
        props: { content: '' },
      } as CMSBlock;
  }
}


