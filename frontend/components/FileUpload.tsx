"use client";

import { DragEvent, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UploadCloud, X, AlertCircle } from "lucide-react";

export interface UploadedFile {
  file: File;
  previewUrl: string;
}

interface FileUploadProps {
  files: UploadedFile[];
  onChange: (files: UploadedFile[]) => void;
  maxFiles?: number;
  label?: string;
}

const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
const MAX_SIZE_MB = 5;

export default function FileUpload({
  files,
  onChange,
  maxFiles = 5,
  label = "Upload Screenshots",
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState("");

  const addFiles = async (fileList: FileList | File[]) => {
    setError("");
    if (maxFiles <= 0) {
      setError("Screenshot limit reached. Remove an image to add another.");
      return;
    }
    const incoming = Array.from(fileList).filter((f) => f.type.startsWith("image/") || f.name.match(/\.(png|jpe?g|webp)$/i));

    if (incoming.length > maxFiles - files.length) {
      setError(`You can upload up to ${maxFiles} images. Please remove some first.`);
      return;
    }

    const validFiles: File[] = [];
    for (const file of incoming) {
      if (!ACCEPTED_TYPES.includes(file.type) && !file.name.match(/\.(png|jpe?g|webp)$/i)) {
        setError(`Only PNG, JPG, JPEG, and WEBP files are allowed (${file.name}).`);
        continue;
      }
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        setError(`${file.name} is larger than ${MAX_SIZE_MB}MB.`);
        continue;
      }
      validFiles.push(file);
    }

    const newFiles: UploadedFile[] = [];
    for (const file of validFiles) {
      const previewUrl = await readFileAsDataUrl(file);
      newFiles.push({ file, previewUrl });
    }

    if (newFiles.length > 0) onChange([...files, ...newFiles]);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) addFiles(e.dataTransfer.files);
  };

  const removeFile = (index: number) => {
    URL.revokeObjectURL(files[index].previewUrl);
    onChange(files.filter((_, i) => i !== index));
  };

  return (
    <div>
      {maxFiles > 0 && (
      <motion.div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        animate={dragOver ? { scale: 1.02 } : { scale: 1 }}
        className={`rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-300 cursor-pointer ${
          dragOver
            ? "border-primary-400 bg-primary-50/80 shadow-glow"
            : "border-gray-200 bg-white/40 hover:border-primary-300 hover:bg-primary-50/30"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) {
              addFiles(e.target.files);
              e.target.value = "";
            }
          }}
        />
        <motion.div animate={dragOver ? { y: -5 } : { y: 0 }}>
          <UploadCloud size={40} className="mx-auto mb-3 text-primary-400" />
          <p className="font-semibold text-gray-700">{label}</p>
          <p className="text-sm text-gray-500 mt-1">
            Drag & drop here, or{" "}
            <span className="text-primary-600 font-medium underline">browse files</span>
          </p>
          <p className="mt-2 text-xs text-gray-400">
            PNG, JPG, JPEG, WEBP up to {MAX_SIZE_MB}MB each ({maxFiles} remaining)
          </p>
        </motion.div>
      </motion.div>
      )}

      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-2 flex items-center gap-1.5 text-sm text-red-600 font-medium"
          >
            <AlertCircle size={14} />
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      {files.length > 0 && (
        <div className="mt-4">
          <p className="text-sm font-semibold text-gray-700 mb-3">
            Image Preview ({files.length})
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
            {files.map((file, index) => (
              <motion.div
                key={file.previewUrl}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative group aspect-square rounded-xl overflow-hidden border border-gray-200/80 shadow-sm"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={file.previewUrl}
                  alt={`Screenshot ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200" />
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"
                  title="Remove screenshot"
                  aria-label="Remove screenshot"
                >
                  <X size={14} />
                </button>
                <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded-lg bg-black/60 text-white text-[10px] max-w-[90%] truncate backdrop-blur-sm font-medium">
                  {file.file.name}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
