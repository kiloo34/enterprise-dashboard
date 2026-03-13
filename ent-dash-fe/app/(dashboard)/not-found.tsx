import { FileSearch, Home } from 'lucide-react';
import Link from 'next/link';

export default function DashboardNotFound() {
    return (
        <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center p-8 animate-in fade-in duration-500">
            <div className="max-w-lg w-full text-center">

                {/* Error Code Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm font-mono font-bold text-gray-600 dark:text-gray-300 mb-8 tracking-wider">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    HTTP 404
                </div>

                {/* Icon */}
                <div className="w-20 h-20 bg-amber-50 dark:bg-amber-900/20 ring-8 ring-amber-50 dark:ring-amber-900/10 rounded-full flex items-center justify-center mb-6 mx-auto">
                    <FileSearch className="w-10 h-10 text-amber-500" />
                </div>

                {/* Large 404 */}
                <div className="text-8xl font-black text-gray-100 dark:text-gray-800 leading-none select-none mb-2">
                    404
                </div>

                {/* Title */}
                <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-3 -mt-4">
                    Halaman Tidak Ditemukan
                </h1>

                {/* Message */}
                <p className="text-gray-500 dark:text-gray-400 leading-relaxed mb-8">
                    Halaman yang Anda cari tidak ada, telah dipindahkan, atau Anda tidak memiliki akses ke halaman ini.
                </p>

                {/* Action */}
                <Link
                    href="/direksi/kinerja-keuangan"
                    className="inline-flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 active:scale-95 transition-all shadow-sm"
                >
                    <Home className="w-4 h-4" />
                    Kembali ke Dashboard
                </Link>
            </div>
        </div>
    );
}
