
import React, { useRef } from "react";
import { SizeWithStock } from "@/models/Product";

// Define SizeItem to match how it's used in ProductForm
export interface SizeItem {
  size: string;
  price: number;
  stock: number;
  image?: string; // base64
}

interface SizeManagerProps {
  sizes: SizeItem[];
  onChange: (sizes: SizeItem[]) => void;
}

const SizeManager: React.FC<SizeManagerProps> = ({ sizes, onChange }) => {
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleSizeChange = (index: number, field: keyof SizeItem, value: string | number) => {
    const updated = sizes.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    );
    onChange(updated);
  };

  const handleImageChange = (index: number, file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      const updated = sizes.map((item, i) =>
        i === index ? { ...item, image: base64 } : item
      );
      onChange(updated);
    };
    reader.readAsDataURL(file);
  };

  const addSize = () => {
    onChange([...sizes, { size: "", price: 0, stock: 0, image: "" }]);
  };

  const removeSize = (index: number) => {
    onChange(sizes.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center mb-2">
        <span className="font-bold">المقاسات المتوفرة</span>
        <button type="button" className="bg-green-700 text-white px-3 py-1 rounded" onClick={addSize}>إضافة مقاس</button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full border text-center">
          <thead>
            <tr className="bg-gray-200 text-gray-800">
              <th className="p-2 text-gray-800">المقاس</th>
              <th className="p-2 text-gray-800">السعر</th>
              <th className="p-2 text-gray-800">المخزون</th>
              <th className="p-2 text-gray-800">صورة المقاس</th>
              <th className="p-2 text-gray-800">حذف</th>
            </tr>
          </thead>
          <tbody>
            {sizes.map((item, idx) => (
              <tr key={idx} className="border-b">
                <td className="p-2">
                  <input
                    type="text"
                    value={item.size}
                    onChange={e => handleSizeChange(idx, "size", e.target.value)}
                    className="border rounded px-2 py-1 w-full"
                    placeholder="مثال: M, 42"
                  />
                </td>
                <td className="p-2">
                  <input
                    type="number"
                    value={item.price}
                    min={0}
                    onChange={e => handleSizeChange(idx, "price", parseFloat(e.target.value) || 0)}
                    className="border rounded px-2 py-1 w-full"
                  />
                </td>
                <td className="p-2">
                  <input
                    type="number"
                    value={item.stock}
                    min={0}
                    onChange={e => handleSizeChange(idx, "stock", parseInt(e.target.value) || 0)}
                    className="border rounded px-2 py-1 w-full"
                  />
                </td>
                <td className="p-2">
                  <input
                    type="file"
                    accept="image/*"
                    ref={el => fileInputRefs.current[idx] = el}
                    onChange={e => handleImageChange(idx, e.target.files?.[0] || null)}
                    className="text-gray-800"
                  />
                  {item.image && (
                    <img src={item.image} alt="size" className="h-10 w-10 object-cover mt-1 mx-auto rounded" />
                  )}
                </td>
                <td className="p-2">
                  <button type="button" className="bg-red-600 text-white px-2 py-1 rounded" onClick={() => removeSize(idx)}>
                    حذف
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SizeManager;
