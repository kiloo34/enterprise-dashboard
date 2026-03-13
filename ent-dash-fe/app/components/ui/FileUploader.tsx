import React from 'react';
import { UploadCloud } from 'lucide-react';

interface FileUploaderProps {
    file: File | null;
    onFileSelect: (file: File | null) => void;
    isUploading: boolean;
    progress: number;
    accept?: string;
    maxSizeDesc?: string;
    labels: {
        title: string;
        select: string;
        noFile: string;
        progressPrefix: string;
        uploading: string;
        button: string;
    };
    onUpload: () => void;
}

export function FileUploader({
    file,
    onFileSelect,
    isUploading,
    progress,
    accept = ".csv,.txt",
    maxSizeDesc = "Max 2GB",
    labels,
    onUpload
}: FileUploaderProps) {
    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {labels.title} ({maxSizeDesc})
                </label>
                <div className="mt-1 flex justify-center rounded-xl border-2 border-dashed border-slate-300 px-6 pt-5 pb-6 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 transition-colors group">
                    <div className="space-y-2 text-center">
                        <UploadCloud className="mx-auto h-10 w-10 text-slate-400 group-hover:text-blue-500 transition-colors" />
                        <div className="flex text-sm text-slate-600 dark:text-slate-400 justify-center">
                            <label htmlFor="file-upload" className="relative cursor-pointer rounded-md bg-transparent font-medium text-blue-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">
                                <span>{labels.select}</span>
                                <input
                                    id="file-upload"
                                    name="file-upload"
                                    type="file"
                                    className="sr-only"
                                    accept={accept}
                                    disabled={isUploading}
                                    onChange={(e) => onFileSelect(e.target.files?.[0] || null)}
                                />
                            </label>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-500">
                            {file ? file.name : labels.noFile}
                        </p>
                    </div>
                </div>
            </div>

            {isUploading && (
                <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                        <span className="flex items-center gap-2">
                            <svg className="animate-spin h-3 w-3 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            {labels.progressPrefix}
                        </span>
                        <span>{progress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 dark:bg-slate-800 overflow-hidden">
                        <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                </div>
            )}

            <button
                onClick={onUpload}
                disabled={!file || isUploading}
                className={`w-full mt-4 py-2.5 px-4 rounded-lg font-semibold text-sm text-white shadow-sm flex justify-center items-center gap-2
                    ${(!file || isUploading)
                        ? 'bg-slate-300 text-slate-500 cursor-not-allowed dark:bg-slate-800 dark:text-slate-500'
                        : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 transition-all hover:shadow'}
                `}
            >
                {isUploading ? labels.uploading : labels.button}
            </button>
        </div>
    );
}
