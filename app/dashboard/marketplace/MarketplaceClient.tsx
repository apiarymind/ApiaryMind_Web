"use client";

import { useState, useTransition, useEffect } from "react";
import { addSalesLogEntry, SalesLogEntry, getRhdReport, getSbReport, getSalesStatistics } from "@/app/actions/sales-log";
import Link from "next/link";
import { Calendar, FileText, Download, Plus, X, TrendingUp, Package, DollarSign } from "lucide-react";

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

  // Calculate statistics from current sales
  const stats = {
    totalRevenue: sales.reduce((sum, s) => sum + (s.revenue || 0), 0),
    totalQuantity: sales.reduce((sum, s) => sum + (s.quantity_sold || 0), 0),
    saleCount: sales.length,
  };

  // Auto-fill price when product is selected
  useEffect(() => {
    if (selectedProduct && userProducts && userProducts.length > 0) {
      const product = userProducts.find(p => p.id === selectedProduct);
      if (product && product.price) {
        setPrice(product.price.toString());
      }
    }
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
          <h1 className="text-3xl font-bold text-white">Ewidencja Sprzedaży</h1>
          <p className="text-white/70 mt-1">
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
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-5 h-5 text-blue-400" />
              <h3 className="text-sm font-bold text-blue-400">Łączny Przychód</h3>
            </div>
            <p className="text-2xl font-bold text-white">{stats.totalRevenue.toFixed(2)} zł</p>
          </div>
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Package className="w-5 h-5 text-green-400" />
              <h3 className="text-sm font-bold text-green-400">Łączna Ilość</h3>
            </div>
            <p className="text-2xl font-bold text-white">{stats.totalQuantity} szt.</p>
          </div>
          <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-purple-400" />
              <h3 className="text-sm font-bold text-purple-400">Liczba Transakcji</h3>
            </div>
            <p className="text-2xl font-bold text-white">{stats.saleCount}</p>
          </div>
        </div>
      )}

      {/* RHD Warning */}
      {!hasRhdAccess && (
        <div className="bg-amber-500/20 border border-amber-500/50 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="text-2xl">⚠️</div>
            <div className="flex-1">
              <h3 className="font-bold text-white mb-1">
                Wymagany numer weterynaryjny
              </h3>
              <p className="text-white/80 text-sm mb-3">
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
        <div className="bg-white/5 dark:bg-black/20 backdrop-blur-md rounded-xl p-6 border border-white/10 dark:border-white/5">
          <h2 className="text-xl font-bold text-white mb-4">
            Dodaj sprzedaż
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Produkt *
              </label>
              <select
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                disabled={isPending}
              >
                <option value="">Wybierz produkt</option>
                {userProducts && userProducts.length > 0 ? (
                  userProducts.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} {product.batch_code ? `(Partia: ${product.batch_code})` : ''} {product.stock !== undefined ? `[Stock: ${product.stock}]` : ''}
                    </option>
                  ))
                ) : (
                  <option value="" disabled>Brak produktów w magazynie</option>
                )}
              </select>
              {userProducts && userProducts.length === 0 && (
                <p className="text-xs text-white/60 mt-1">
                  Dodaj produkty w <Link href="/dashboard/beekeeper/warehouse" className="text-amber-400 hover:underline">magazynie</Link>
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Data sprzedaży *
              </label>
              <input
                type="date"
                value={saleDate}
                onChange={(e) => setSaleDate(e.target.value)}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                disabled={isPending}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Ilość (szt.) *
              </label>
              <input
                type="number"
                step="1"
                min="1"
                value={quantity}
                onChange={(e) => {
                  const val = e.target.value;
                  // Only allow positive integers
                  if (val === '' || /^\d+$/.test(val)) {
                    setQuantity(val);
                  }
                }}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="1"
                disabled={isPending}
              />
              <p className="text-xs text-white/60 mt-1">Tylko liczby całkowite (1, 2, 3...)</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Cena jednostkowa (zł) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="0.00"
                disabled={isPending}
              />
              {selectedProduct && (
                <p className="text-xs text-white/60 mt-1">
                  Cena pobrana z tabeli produktów
                </p>
              )}
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-white/80 mb-2">
                Odbiorca (opcjonalne - dla SB)
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
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
        <div className="bg-white/5 dark:bg-black/20 backdrop-blur-md rounded-xl p-6 border border-white/10 dark:border-white/5">
          <h2 className="text-xl font-bold text-white mb-4">Raporty</h2>
          
          {/* RHD Report Controls */}
          <div className="mb-4 p-4 bg-white/5 rounded-lg">
            <h3 className="text-sm font-bold text-white/80 mb-3">Raport RHD (Dzienny z przychodem narastającym)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
              <div>
                <label className="block text-xs text-white/60 mb-1">Data od</label>
                <input
                  type="date"
                  value={reportStartDate}
                  onChange={(e) => setReportStartDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block text-xs text-white/60 mb-1">Data do</label>
                <input
                  type="date"
                  value={reportEndDate}
                  onChange={(e) => setReportEndDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
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
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  {Array.from({ length: 12 }, (_, i) => {
                    const monthNum = i + 1;
                    return (
                      <option key={monthNum} value={String(monthNum)}>
                        {new Date(2024, i, 1).toLocaleDateString('pl-PL', { month: 'long' })}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div>
                <label className="block text-xs text-white/60 mb-1">Rok</label>
                <input
                  type="number"
                  value={reportYear}
                  onChange={(e) => setReportYear(parseInt(e.target.value))}
                  min={2020}
                  max={2099}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
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
        <div className="bg-white/5 dark:bg-black/20 backdrop-blur-md rounded-xl p-6 border border-white/10 dark:border-white/5">
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
                  <th className="px-4 py-3 text-left text-xs font-bold text-white/80 uppercase tracking-wider">Lp.</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-white/80 uppercase tracking-wider">Data</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-white/80 uppercase tracking-wider">Produkt</th>
                  {showReport === 'sb' && <th className="px-4 py-3 text-left text-xs font-bold text-white/80 uppercase tracking-wider">Partia</th>}
                  <th className="px-4 py-3 text-right text-xs font-bold text-white/80 uppercase tracking-wider">Ilość</th>
                  {!hidePrices && showReport === 'rhd' && (
                    <>
                      <th className="px-4 py-3 text-right text-xs font-bold text-white/80 uppercase tracking-wider">Przychód dzienny</th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-white/80 uppercase tracking-wider">Przychód narastająco</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {reportData.map((entry, index) => (
                  <tr key={index} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 text-white/70">{entry.lp}</td>
                    <td className="px-4 py-3 text-white/70">{entry.sale_date}</td>
                    <td className="px-4 py-3 text-white/70 font-medium">{entry.product_name}</td>
                    {showReport === 'sb' && (
                      <td className="px-4 py-3 text-white/70">{entry.batch_code || '-'}</td>
                    )}
                    <td className="px-4 py-3 text-right text-white/70">{entry.quantity} {entry.unit}</td>
                    {!hidePrices && showReport === 'rhd' && (
                      <>
                        <td className="px-4 py-3 text-right text-white/70">{entry.daily_revenue?.toFixed(2)} zł</td>
                        <td className="px-4 py-3 text-right text-white font-bold">{entry.cumulative_revenue?.toFixed(2)} zł</td>
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
        <h2 className="text-2xl font-bold text-white mb-4">
          Historia sprzedaży ({sales.length})
        </h2>
        {sales.length === 0 ? (
          <div className="text-center py-12 bg-white/5 dark:bg-black/20 backdrop-blur-md border border-white/10 dark:border-white/5 rounded-xl">
            <p className="text-white/60">
              Brak zarejestrowanych sprzedaży
            </p>
          </div>
        ) : (
          <div className="bg-white/5 dark:bg-black/20 backdrop-blur-md border border-white/10 dark:border-white/5 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-white/80 uppercase tracking-wider">Data</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-white/80 uppercase tracking-wider">Produkt</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-white/80 uppercase tracking-wider">Partia</th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-white/80 uppercase tracking-wider">Ilość</th>
                    <th className="px-6 py-3 text-right text-xs font-bold text-white/80 uppercase tracking-wider">Wartość</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {sales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white/70">
                        {new Date(sale.sale_date).toLocaleDateString("pl-PL")}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-white">
                        {sale.product_name || "Nieznany produkt"}
                      </td>
                      <td className="px-6 py-4 text-sm text-white/70">
                        {sale.batch_code || "-"}
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-white/70">
                        {sale.quantity_sold}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-bold text-white">
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
