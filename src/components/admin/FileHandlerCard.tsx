import { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { Upload, FileText, X, Eye, Download, CloudUpload } from 'lucide-react';

export default function FileHandlerCard() {
    const [file, setFile] = useState<File | null>(null);
    const [uploadTime, setUploadTime] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const droppedFile = e.dataTransfer.files[0];
            processFile(droppedFile);
        }
    };

    const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            processFile(e.target.files[0]);
        }
    };

    const processFile = (uploadedFile: File) => {
        // Just mocking the validation or type check if needed
        if (uploadedFile.type === 'application/pdf') {
            setFile(uploadedFile);
            const timeStr = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            setUploadTime(timeStr);
        } else {
            // For now, accept it but maybe show a warning, or strictly accept only PDF as per prompt "Arraste seu arquivo PDF"
            // Let's accept it but we are mainly designing for PDF
            setFile(uploadedFile);
            const timeStr = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            setUploadTime(timeStr);
        }
    };

    const handleRemoveFile = () => {
        setFile(null);
        setUploadTime(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    return (
        <div className="bg-card-dark rounded-xl border border-white/5 shadow-xl overflow-hidden">
            <div className="p-5 border-b border-white/5 flex justify-between items-center bg-zinc-900/50">
                <h2 className="text-sm font-bold text-white tracking-wide">Arquivos de Impressão</h2>
                <span className="text-[10px] font-mono text-text-secondary bg-white/5 px-2 py-0.5 rounded border border-white/5">V.3</span>
            </div>

            <div className="p-5 space-y-5">
                {!file ? (
                    // Empty State - Drop Zone
                    <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`
                            border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all gap-3 bg-zinc-900/50
                            ${isDragging ? 'border-blue-500 bg-blue-500/5' : 'border-zinc-700 hover:border-zinc-500 hover:bg-white/5'}
                        `}
                    >
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileInput}
                            className="hidden"
                            accept=".pdf"
                        />
                        <div className={`
                            p-3 rounded-full transition-transform duration-300
                            ${isDragging ? 'bg-blue-500/20 text-blue-500 scale-110' : 'bg-zinc-800 text-zinc-400'}
                        `}>
                            <CloudUpload size={32} />
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm text-white font-medium">
                                Arraste seu arquivo PDF aqui
                            </p>
                            <p className="text-xs text-zinc-500">
                                ou clique para selecionar
                            </p>
                        </div>
                    </div>
                ) : (
                    // Filled State - File Card
                    <div className="flex items-start gap-4 p-4 rounded-lg bg-zinc-950/50 border border-zinc-700/50 hover:border-zinc-600 transition-colors group relative">
                        <button
                            onClick={handleRemoveFile}
                            className="absolute top-2 right-2 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 p-1 rounded-md transition-colors"
                            title="Remover arquivo"
                        >
                            <X size={14} />
                        </button>

                        <div className="h-14 w-14 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0 text-red-500/80">
                            <FileText size={28} />
                        </div>
                        <div className="flex-1 min-w-0 py-0.5">
                            <h4 className="text-sm font-medium text-white truncate pr-6">{file.name}</h4>
                            <div className="flex items-center gap-3 mt-1.5 text-xs text-zinc-500">
                                <span className="font-mono">{formatFileSize(file.size)}</span>
                                <span className="w-1 h-1 rounded-full bg-zinc-700"></span>
                                <span>Enviado hoje às {uploadTime}</span>
                            </div>
                            <div className="flex items-center gap-3 mt-3">
                                <button className="flex items-center gap-1.5 text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors">
                                    <Eye size={12} />
                                    Visualizar
                                </button>
                                <button className="flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-white transition-colors">
                                    <Download size={12} />
                                    Baixar
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Production Instructions */}
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                            Instruções para Produção
                        </label>
                    </div>

                    <div className="relative">
                        <textarea
                            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder-zinc-600 min-h-[100px] resize-none"
                            placeholder="Adicione observações para a equipe de produção..."
                        ></textarea>
                    </div>

                    <button className="bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-medium py-2 px-4 rounded border border-zinc-700 transition-colors">
                        Salvar Observações
                    </button>
                </div>
            </div>
        </div>
    );
}
