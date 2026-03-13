import { ErrorState } from "./components/ui/ErrorState";
import Link from "next/link";
import { Home } from "lucide-react";

export default function NotFound() {
    return (
        <div className="flex h-screen w-screen items-center justify-center bg-gray-50/50 dark:bg-gray-900/50">
            <div className="flex flex-col items-center">
                <ErrorState
                    title="404 - Halaman Tidak Ditemukan"
                    message="Maaf, halaman atau rute yang Anda cari tidak tersedia di dalam sistem."
                />
                <Link
                    href="/"
                    className="mt-[-1rem] inline-flex items-center justify-center px-6 py-3 text-sm font-medium text-gray-900 transition-all bg-white border border-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-200 focus:ring-offset-2 active:scale-95 shadow-sm"
                >
                    <Home className="w-4 h-4 mr-2" />
                    Kembali ke Dashboard Utama
                </Link>
            </div>
        </div>
    );
}
