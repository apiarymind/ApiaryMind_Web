"use client";

import { useState, useTransition, useEffect, useMemo } from "react";
import { addSalesLogEntry, SalesLogEntry, getRhdReport, getSbReport, getSalesStatistics } from "@/app/actions/sales-log";
import Link from "next/link";
import { Calendar, FileText, Download, Plus, X, TrendingUp, Package, DollarSign } from "lucide-react";
import SafeSalesLimitWidget from "@/app/components/marketplace/SafeSalesLimitWidget";
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface MarketplaceClientProps {
  initialSales: SalesLogEntry[];
  hasRhdAccess: boolean;
  userProducts: any[];
  rhdError?: string;
}

export default function MarketplaceClient({
  initialSales,
  hasRhdAccess,
  userProducts,
  rhdError,
}: MarketplaceClientProps) {
  console.log('MarketplaceClient: Received userProducts:', userProducts);
  console.log('MarketplaceClient: userProducts length:', userProducts?.length || 0);
  console.log('MarketplaceClient: Received initialSales:', initialSales);
  console.log('MarketplaceClient: initialSales length:', initialSales?.length || 0);
  console.log('MarketplaceClient: First sale sample:', initialSales?.[0]);
  const [sales, setSales] = useState(initialSales);
  const [showReport, setShowReport] = useState<'rhd' | 'sb' | null>(null);
  const [showReportControls, setShowReportControls] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0]);
  const [customerName, setCustomerName] = useState("");
  const [hidePrices, setHidePrices] = useState(false);
  const [reportStartDate, setReportStartDate] = useState(new Date().getFullYear() + "-01-01");
  const [reportEndDate, setReportEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportMonth, setReportMonth] = useState(String(new Date().getMonth() + 1));
  const [reportYear, setReportYear] = useState(new Date().getFullYear());
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [reportData, setReportData] = useState<any[]>([]);
  const [reportStats, setReportStats] = useState<{ totalRevenue?: number; totalQuantity: number }>({ totalQuantity: 0 });

  // Extract unique years from sales data and sort descending
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    sales.forEach(sale => {
      if (sale.sale_date) {
        const year = new Date(sale.sale_date).getFullYear();
        years.add(year);
      }
    });
    return Array.from(years).sort((a, b) => b - a); // Sort descending
  }, [sales]);

  // Get current year
  const currentYear = new Date().getFullYear();

  // Determine default selected year: current year if available, otherwise newest available
  const defaultYear = useMemo(() => {
    if (availableYears.length === 0) return currentYear;
    if (availableYears.includes(currentYear)) return currentYear;
    return availableYears[0]; // Newest available year
  }, [availableYears, currentYear]);

  // State for selected year
  const [selectedYear, setSelectedYear] = useState<string>(String(defaultYear));

  // Update selected year when defaultYear changes (e.g., when data loads)
  useEffect(() => {
    setSelectedYear(String(defaultYear));
  }, [defaultYear]);

  // Filter sales by selected year
  const filteredSales = useMemo(() => {
    if (!selectedYear) return sales;
    const year = parseInt(selectedYear);
    return sales.filter(sale => {
      if (!sale.sale_date) return false;
      return new Date(sale.sale_date).getFullYear() === year;
    });
  }, [sales, selectedYear]);

  // Calculate statistics from filtered sales (only selected year)
  const stats = useMemo(() => ({
    totalRevenue: filteredSales.reduce((sum, s) => sum + (s.revenue || 0), 0),
    totalQuantity: filteredSales.reduce((sum, s) => sum + (s.quantity_sold || 0), 0),
    saleCount: filteredSales.length,
  }), [filteredSales]);

  // Auto-fill price when product is selected
  const [selectedProductWeight, setSelectedProductWeight] = useState<number | undefined>(undefined);
  const [maxQuantity, setMaxQuantity] = useState<number | undefined>(undefined);
  const [quantityError, setQuantityError] = useState<string>("");
  
  useEffect(() => {
    if (selectedProduct && userProducts && userProducts.length > 0) {
      const product = userProducts.find(p => p.id === selectedProduct);
      if (product) {
        if (product.price) {
          setPrice(product.price.toString());
        }
        setSelectedProductWeight(product.weight_g);
        // Set max quantity based on stock
        const stock = product.stock !== undefined ? parseInt(String(product.stock)) : 0;
        setMaxQuantity(stock);
        // Reset quantity if it exceeds stock
        if (quantity) {
          const quantityNum = parseInt(quantity, 10);
          if (!isNaN(quantityNum) && quantityNum > stock) {
            setQuantity("");
            setQuantityError("");
          }
        }
      }
    } else {
      setSelectedProductWeight(undefined);
      setMaxQuantity(undefined);
      setQuantityError("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProduct, userProducts]);

  const handleAddSale = () => {
    if (!selectedProduct || !quantity || !price || !saleDate) {
      setMessage({ type: "error", text: "Proszę wypełnić wszystkie wymagane pola" });
      return;
    }

    const quantityNum = parseInt(quantity, 10);
    const priceNum = parseFloat(price);
    
    if (!quantityNum || quantityNum < 1 || isNaN(quantityNum)) {
      setMessage({ type: "error", text: "Ilość musi być liczbą całkowitą większą od zera" });
      return;
    }
    
    if (priceNum <= 0) {
      setMessage({ type: "error", text: "Cena musi być większa od zera" });
      return;
    }

    // Validate stock availability
    if (maxQuantity !== undefined && quantityNum > maxQuantity) {
      setQuantityError(`Brak wystarczającej ilości w magazynie (Dostępne: ${maxQuantity})`);
      setMessage({ type: "error", text: `Brak wystarczającej ilości w magazynie (Dostępne: ${maxQuantity})` });
      return;
    }

    startTransition(async () => {
      const result = await addSalesLogEntry({
        product_id: selectedProduct,
        quantity_sold: quantityNum,
        sale_date: saleDate,
        revenue: quantityNum * priceNum,
        customer_name: customerName || undefined,
      });
      
      if (result.success) {
        setMessage({ type: "success", text: "Sprzedaż została zarejestrowana!" });
        setSelectedProduct("");
        setQuantity("");
        setPrice("");
        setCustomerName("");
        setSaleDate(new Date().toISOString().split('T')[0]);
        setQuantityError("");
        setMaxQuantity(undefined);
        setSelectedProductWeight(undefined);
        // Refresh sales by reloading the page after a short delay
        setTimeout(() => {
          window.location.reload();
        }, 500);
      } else {
        setMessage({ type: "error", text: result.error || "Wystąpił błąd" });
      }
    });
  };

  const handleGenerateReport = async (type: 'rhd' | 'sb') => {
    startTransition(async () => {
      if (type === 'rhd') {
        const result = await getRhdReport(reportStartDate, reportEndDate);
        if (!result.error) {
          setReportData(result.data);
          setReportStats({ totalRevenue: result.totalRevenue, totalQuantity: result.totalQuantity });
          setShowReport('rhd');
        }
      } else {
        const result = await getSbReport(reportMonth, reportYear);
        if (!result.error) {
          setReportData(result.data);
          setReportStats({ totalQuantity: result.totalQuantity });
          setShowReport('sb');
        }
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Ewidencja Sprzedaży</h1>
          <p className="text-gray-700 dark:text-white/70 mt-1">
            Rejestracja sprzedaży zgodna z wymogami RHD/SB
          </p>
        </div>
        {hasRhdAccess && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowReportControls(!showReportControls);
            }}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-400 text-white font-bold rounded-xl transition-colors flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            {showReportControls ? "Ukryj Raporty" : "Pokaż Raporty"}
          </button>
        )}
      </div>

      {/* Statistics Cards */}
      {hasRhdAccess && sales.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-300 dark:border-blue-500/30 rounded-xl p-4 shadow-md dark:shadow-none">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h3 className="text-sm font-bold text-blue-700 dark:text-blue-400">Łączny Przychód</h3>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalRevenue.toFixed(2)} zł</p>
          </div>
          <div className="bg-green-50 dark:bg-green-500/10 border border-green-300 dark:border-green-500/30 rounded-xl p-4 shadow-md dark:shadow-none">
            <div className="flex items-center gap-2 mb-2">
              <Package className="w-5 h-5 text-green-600 dark:text-green-400" />
              <h3 className="text-sm font-bold text-green-700 dark:text-green-400">Łączna Ilość</h3>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalQuantity} szt.</p>
          </div>
          <div className="bg-purple-50 dark:bg-purple-500/10 border border-purple-300 dark:border-purple-500/30 rounded-xl p-4 shadow-md dark:shadow-none">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <h3 className="text-sm font-bold text-purple-700 dark:text-purple-400">Liczba Transakcji</h3>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.saleCount}</p>
          </div>
        </div>
      )}

      {/* Safe Sales Limit Widget */}
      {hasRhdAccess && <SafeSalesLimitWidget />}

      {/* RHD Warning */}
      {!hasRhdAccess && (
        <div className="bg-amber-500/20 border border-amber-500/50 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="text-2xl">⚠️</div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 dark:text-white mb-1">
                Wymagany numer weterynaryjny
              </h3>
              <p className="text-gray-700 dark:text-white/80 text-sm mb-3">
                Aby rejestrować sprzedaż, musisz posiadać numer weterynaryjny RHD lub SHP (SB).
              </p>
              <Link
                href="/dashboard/settings"
                className="inline-block px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg transition-colors text-sm"
              >
                Dodaj numer w ustawieniach →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Message */}
      {message && (
        <div
          className={`p-4 rounded-xl ${
            message.type === "success"
              ? "bg-green-500/10 border border-green-500/30 text-green-400"
              : "bg-red-500/10 border border-red-500/30 text-red-400"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Add Form - Always visible if has access */}
      {hasRhdAccess && (
        <div className="bg-white dark:bg-white/5 backdrop-blur-md rounded-xl p-6 border border-gray-300 dark:border-white/10 shadow-lg dark:shadow-none">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Dodaj sprzedaż
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white/80 mb-2">
                Produkt *
              </label>
              <select
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 dark:bg-gray-900/90 dark:text-gray-100 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-sm dark:shadow-none"
                disabled={isPending}
              >
                <option value="" className="bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100">Wybierz produkt</option>
                {userProducts && userProducts.length > 0 ? (
                  userProducts.map((product) => {
                    const stock = product.stock !== undefined ? parseInt(String(product.stock)) : 0;
                    const price = product.price !== undefined ? parseFloat(String(product.price)).toFixed(2) : '0.00';
                    
                    // Build variant info
                    let variantInfo = '';
                    if (product.volume_ml && product.weight_g) {
                      variantInfo = ` (${product.volume_ml}ml / ${product.weight_g}g)`;
                    } else if (product.volume_ml) {
                      variantInfo = ` (${product.volume_ml}ml)`;
                    } else if (product.weight_g) {
                      variantInfo = ` (${product.weight_g}g)`;
                    }
                    
                    // Format: {name} ({volume}ml / {weight}g) | Cena: {price} zł | Stan: {stock} szt
                    const displayText = stock === 0
                      ? `${product.name}${variantInfo} | Cena: ${price} zł | (Brak w magazynie)`
                      : `${product.name}${variantInfo} | Cena: ${price} zł | Stan: ${stock} szt`;
                    
                    return (
                      <option 
                        key={product.id} 
                        value={product.id}
                        disabled={stock === 0}
                        className="bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100"
                        style={stock === 0 ? { color: '#666', opacity: 0.6 } : {}}
                      >
                        {displayText}
                      </option>
                    );
                  })
                ) : (
                  <option value="" disabled className="bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100">Brak produktów w magazynie</option>
                )}
              </select>
              {userProducts && userProducts.length === 0 && (
                <p className="text-xs text-gray-600 dark:text-white/60 mt-1">
                  Dodaj produkty w <Link href="/dashboard/beekeeper/warehouse" className="text-amber-600 dark:text-amber-400 hover:underline">magazynie</Link>
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white/80 mb-2">
                Data sprzedaży *
              </label>
              <input
                type="date"
                value={saleDate}
                onChange={(e) => setSaleDate(e.target.value)}
                className="w-full px-4 py-2 bg-white dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-sm dark:shadow-none"
                disabled={isPending}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white/80 mb-2">
                Ilość (szt.) *
              </label>
              <input
                type="number"
                step="1"
                min="1"
                max={maxQuantity !== undefined ? maxQuantity : undefined}
                value={quantity}
                onChange={(e) => {
                  const val = e.target.value;
                  // Only allow positive integers
                  if (val === '' || /^\d+$/.test(val)) {
                    setQuantity(val);
                    // Clear error when user types
                    setQuantityError("");
                    
                    // Validate against max quantity
                    if (val && maxQuantity !== undefined) {
                      const quantityNum = parseInt(val, 10);
                      if (!isNaN(quantityNum) && quantityNum > maxQuantity) {
                        setQuantityError(`Brak wystarczającej ilości w magazynie (Dostępne: ${maxQuantity})`);
                      }
                    }
                  }
                }}
                className={`w-full px-4 py-2 bg-white dark:bg-white/5 border rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-sm dark:shadow-none ${
                  quantityError ? 'border-red-500 dark:border-red-500/50' : 'border-gray-300 dark:border-white/10'
                }`}
                placeholder="1"
                disabled={isPending}
              />
              {quantityError ? (
                <p className="text-xs text-red-600 dark:text-red-400 mt-1 font-medium">{quantityError}</p>
              ) : (
                <p className="text-xs text-gray-600 dark:text-white/60 mt-1">
                  Tylko liczby całkowite (1, 2, 3...)
                  {maxQuantity !== undefined && maxQuantity > 0 && (
                    <span className="ml-1">• Maksymalnie: {maxQuantity} szt</span>
                  )}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white/80 mb-2">
                Cena jednostkowa (zł) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full px-4 py-2 bg-white dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-sm dark:shadow-none"
                placeholder="0.00"
                disabled={isPending}
              />
              {selectedProduct && (
                <>
                  <p className="text-xs text-gray-600 dark:text-white/60 mt-1">
                    Cena pobrana z tabeli produktów
                  </p>
                  {selectedProductWeight && (
                    <p className="text-xs text-amber-600 dark:text-amber-400/80 mt-1 font-medium">
                      Waga jednostkowa tego produktu: {selectedProductWeight}g
                    </p>
                  )}
                </>
              )}
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-900 dark:text-white/80 mb-2">
                Odbiorca (opcjonalne - dla SB)
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-4 py-2 bg-white dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-sm dark:shadow-none"
                placeholder="Nazwa odbiorcy (dla SB)"
                disabled={isPending}
              />
            </div>
            <div className="md:col-span-2">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleAddSale();
                }}
                disabled={isPending || !selectedProduct || !quantity || !price || !saleDate}
                className="w-full px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending ? "Zapisywanie..." : "Zarejestruj sprzedaż"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reports Section - Hidden by default, shown when button clicked */}
      {hasRhdAccess && showReportControls && (
        <div className="bg-white dark:bg-white/5 backdrop-blur-md rounded-xl p-6 border border-gray-300 dark:border-white/10 shadow-lg dark:shadow-none">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Raporty</h2>
          
          {/* RHD Report Controls */}
          <div className="mb-4 p-4 bg-gray-50 dark:bg-white/5 rounded-lg">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white/80 mb-3">Raport RHD (Dzienny z przychodem narastającym)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
              <div>
                <label className="block text-xs text-gray-700 dark:text-white/60 mb-1">Data od</label>
                <input
                  type="date"
                  value={reportStartDate}
                  onChange={(e) => setReportStartDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-sm dark:shadow-none"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-700 dark:text-white/60 mb-1">Data do</label>
                <input
                  type="date"
                  value={reportEndDate}
                  onChange={(e) => setReportEndDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-sm dark:shadow-none"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleGenerateReport('rhd');
                  }}
                  disabled={isPending}
                  className="w-full px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 text-blue-400 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
                >
                  <FileText className="w-4 h-4" />
                  Generuj RHD
                </button>
              </div>
            </div>
          </div>

          {/* SB Report Controls */}
          <div className="p-4 bg-white/5 rounded-lg">
            <h3 className="text-sm font-bold text-white/80 mb-3">Raport SB (Miesięczny ilościowy)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-white/60 mb-1">Miesiąc</label>
                <select
                  value={reportMonth}
                  onChange={(e) => setReportMonth(e.target.value)}
                  className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  {Array.from({ length: 12 }, (_, i) => {
                    const monthNum = i + 1;
                    return (
                      <option key={monthNum} value={String(monthNum)} className="bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100">
                        {new Date(2024, i, 1).toLocaleDateString('pl-PL', { month: 'long' })}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-700 dark:text-white/60 mb-1">Rok</label>
                <input
                  type="number"
                  value={reportYear}
                  onChange={(e) => setReportYear(parseInt(e.target.value))}
                  min={2020}
                  max={2099}
                  className="w-full px-3 py-2 bg-white dark:bg-white/10 border border-gray-300 dark:border-white/20 rounded-lg text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleGenerateReport('sb');
                  }}
                  disabled={isPending}
                  className="w-full px-4 py-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/50 text-green-400 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
                >
                  <FileText className="w-4 h-4" />
                  Generuj SB
                </button>
              </div>
            </div>
          </div>

          {showReport && (
            <div className="mt-4 flex items-center gap-2">
              <label className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={hidePrices}
                  onChange={(e) => setHidePrices(e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-white/80 text-sm">Ukryj kwoty (dla weterynarii)</span>
              </label>
            </div>
          )}
        </div>
      )}

      {/* Report Display */}
      {showReport && reportData.length > 0 && (
        <div className="bg-white/5 dark:bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10 dark:border-white/10">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-bold text-white">
                {showReport === 'rhd' ? 'Raport RHD (Dzienny)' : 'Raport SB (Miesięczny)'}
              </h2>
              {showReport === 'rhd' && !hidePrices && (
                <p className="text-sm text-white/60 mt-1">
                  Przychód łączny: <span className="font-bold text-white">{reportStats.totalRevenue?.toFixed(2)} zł</span>
                </p>
              )}
              <p className="text-sm text-white/60 mt-1">
                Ilość łączna: <span className="font-bold text-white">{reportStats.totalQuantity} szt.</span>
              </p>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowReport(null);
                setHidePrices(false);
              }}
              className="text-white/60 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-900 dark:text-white/80 uppercase tracking-wider">Lp.</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-900 dark:text-white/80 uppercase tracking-wider">Data</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-900 dark:text-white/80 uppercase tracking-wider">Produkt</th>
                  {showReport === 'sb' && <th className="px-4 py-3 text-left text-xs font-bold text-gray-900 dark:text-white/80 uppercase tracking-wider">Partia</th>}
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-900 dark:text-white/80 uppercase tracking-wider">Ilość</th>
                  {!hidePrices && showReport === 'rhd' && (
                    <>
                      <th className="px-4 py-3 text-right text-xs font-bold text-gray-900 dark:text-white/80 uppercase tracking-wider">Kwota Transakcji</th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-gray-900 dark:text-white/80 uppercase tracking-wider">Przychód narastająco</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-white/10">
                {reportData.map((entry, index) => (
                  <tr key={index} className="bg-[#F8F9FA] dark:bg-white/[0.03] hover:bg-[#F5F5F5] dark:hover:bg-white/[0.06] transition-colors">
                    <td className="px-4 py-3 text-gray-900 dark:text-white/70">{entry.lp}</td>
                    <td className="px-4 py-3 text-gray-900 dark:text-white/70">{entry.sale_date}</td>
                    <td className="px-4 py-3 text-gray-900 dark:text-white/70 font-medium">{entry.product_name}</td>
                    {showReport === 'sb' && (
                      <td className="px-4 py-3 text-gray-900 dark:text-white/70">{entry.batch_code || '-'}</td>
                    )}
                    <td className="px-4 py-3 text-right text-gray-900 dark:text-white/70">{entry.quantity} {entry.unit}</td>
                    {!hidePrices && showReport === 'rhd' && (
                      <>
                        <td className="px-4 py-3 text-right text-gray-900 dark:text-white/70">{entry.transaction_value?.toFixed(2).replace('.', ',')} zł</td>
                        <td className="px-4 py-3 text-right text-gray-900 dark:text-white font-bold">{entry.cumulative_revenue?.toFixed(2).replace('.', ',')} zł</td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sales List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Historia sprzedaży ({filteredSales.length})
          </h2>
        </div>
        
        {/* Year Tabs */}
        {availableYears.length > 0 && (
          <div className="mb-4 border-b border-gray-300 dark:border-white/10">
            <Tabs value={selectedYear} onValueChange={setSelectedYear}>
              <TabsList className="bg-transparent border-0 p-0 h-auto">
                {availableYears.map(year => (
                  <TabsTrigger 
                    key={year} 
                    value={String(year)}
                    className="!text-gray-700 dark:!text-white/60 hover:!text-gray-900 dark:hover:!text-white rounded-none border-b-2 border-transparent data-[state=active]:border-amber-500 dark:data-[state=active]:border-amber-400 data-[state=active]:!text-amber-600 dark:data-[state=active]:!text-amber-400 data-[state=active]:font-bold px-4 py-2 -mb-px"
                  >
                    {year === currentYear ? `${year} (Bieżący)` : String(year)}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        )}

        {filteredSales.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-white/5 backdrop-blur-md border border-gray-300 dark:border-white/10 rounded-xl shadow-lg dark:shadow-none">
            <p className="text-gray-700 dark:text-white/60">
              {sales.length === 0 
                ? 'Brak zarejestrowanych sprzedaży'
                : `Brak sprzedaży w roku ${selectedYear}`
              }
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-white/5 backdrop-blur-md border border-gray-300 dark:border-white/10 rounded-xl overflow-hidden shadow-lg dark:shadow-none">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 dark:bg-white/5 border-b border-gray-300 dark:border-white/10">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 dark:text-white/80 uppercase tracking-wider">Data</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 dark:text-white/80 uppercase tracking-wider">Produkt</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 dark:text-white/80 uppercase tracking-wider">Partia</th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-gray-900 dark:text-white/80 uppercase tracking-wider">Ilość</th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-gray-900 dark:text-white/80 uppercase tracking-wider">Wartość</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-white/10">
                  {filteredSales.map((sale) => (
                    <tr key={sale.id} className="bg-[#F8F9FA] dark:bg-white/[0.03] hover:bg-[#F5F5F5] dark:hover:bg-white/[0.06] transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-white/70">
                        {new Date(sale.sale_date).toLocaleDateString("pl-PL")}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                        {sale.product_name || "Nieznany produkt"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-white/70">
                        {sale.batch_code || "-"}
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-gray-700 dark:text-white/70">
                        {sale.quantity_sold}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-bold text-gray-900 dark:text-white">
                        {sale.revenue?.toFixed(2) || "0.00"} zł
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
