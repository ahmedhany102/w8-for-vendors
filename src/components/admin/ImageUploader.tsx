import React, { useRef } from "react";

interface ImageUploaderProps {
  value?: string[];
  onChange: (imgs: string[]) => void;
  label?: string;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ value = [], onChange, label }) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    let loaded = 0;
    const newImages: string[] = [];
    files.forEach((file, idx) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        newImages[idx] = ev.target?.result as string;
        loaded++;
        if (loaded === files.length) {
          onChange([...(value || []), ...newImages.filter(Boolean)]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemove = (idx: number) => {
    const updated = value.filter((_, i) => i !== idx);
    onChange(updated);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="space-y-2">
      {label && <label className="block font-bold mb-1">{label}</label>}
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="block"
        multiple
      />
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {value.map((img, idx) => (
            <div key={idx} className="relative w-fit">
              <img src={img} alt={`preview-${idx}`} className="h-24 w-24 object-cover rounded shadow" />
              <button
                type="button"
                onClick={() => handleRemove(idx)}
                className="absolute top-0 right-0 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                title="حذف الصورة"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageUploader; 
