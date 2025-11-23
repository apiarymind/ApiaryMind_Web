import { getWarehouse } from "../../../../lib/apiServices";

function WarehouseTable({ title, items }: { title: string, items: any[] }) {
  return (
    <div className="mb-8">
      <h3 className="text-xl font-bold text-amber-400 mb-4">{title}</h3>
      <div className="overflow-x-auto rounded-xl border border-brown-700 bg-brown-900/50">
        <table className="w-full text-left text-sm text-amber-100">
           <thead className="bg-brown-800 text-amber-500 uppercase font-bold text-xs">
            <tr>
              <th className="px-6 py-3">Nazwa</th>
              <th className="px-6 py-3 text-right">Ilość</th>
              <th className="px-6 py-3 text-right">Jednostka</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brown-700">
            {items.map((item) => (
               <tr key={item.id} className="hover:bg-brown-800/30">
                 <td className="px-6 py-3">{item.name}</td>
                 <td className="px-6 py-3 text-right font-mono">{item.quantity}</td>
                 <td className="px-6 py-3 text-right text-amber-200/60">{item.unit}</td>
               </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default async function WarehousePage() {
  const warehouse = await getWarehouse();

  return (
    <div>
      <h1 className="text-2xl font-bold text-amber-500 mb-6">Magazyn (Tylko odczyt)</h1>
      <WarehouseTable title="Sprzęt Pszczelarski" items={warehouse.equipment} />
      <WarehouseTable title="Produkty Pszczele" items={warehouse.products} />
      <WarehouseTable title="Opakowania" items={warehouse.packaging} />
    </div>
  );
}
