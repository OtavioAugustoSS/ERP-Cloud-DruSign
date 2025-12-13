import { FileText, Eye, Download, Upload } from 'lucide-react';

export default function FileInspectionCard() {
    return (
        <div className="bg-card-dark rounded-xl border border-white/5 shadow-xl overflow-hidden">
            <div className="p-6 border-b border-white/5 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-white">Arquivos de Impressão</h2>
                <span className="text-xs font-mono text-text-secondary bg-white/5 px-2 py-1 rounded">V.3</span>
            </div>

            <div className="p-6 space-y-6">
                {/* File Item */}
                <div className="flex items-start gap-4 p-4 rounded-lg bg-input-bg border border-white/10 hover:border-white/20 transition-colors group">
                    <div className="h-12 w-12 rounded bg-red-500/20 flex items-center justify-center shrink-0 text-red-400">
                        <FileText size={24} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-white truncate pr-4">banner_campanha_v2_final_curvas.pdf</h4>
                        <div className="flex items-center gap-3 mt-1 text-xs text-text-secondary">
                            <span>15.4 MB</span>
                            <span className="w-1 h-1 rounded-full bg-white/20"></span>
                            <span>Enviado hoje às 14:30</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 text-primary hover:bg-primary/10 rounded transition-colors" title="Pré-visualizar">
                            <Eye size={20} />
                        </button>
                        <button className="p-2 text-text-secondary hover:text-white hover:bg-white/10 rounded transition-colors" title="Baixar">
                            <Download size={20} />
                        </button>
                    </div>
                </div>

                {/* Admin Instructions */}
                <div className="bg-white/5 rounded-lg p-4 space-y-3">
                    <h3 className="text-sm font-semibold text-white mb-2">
                        Instruções para Produção
                    </h3>

                    <textarea
                        className="w-full bg-input-bg border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder-white/20 min-h-[100px]"
                        placeholder="Adicione observações para a equipe de produção..."
                    ></textarea>

                    <div className="flex gap-3 mt-2">
                        <button className="bg-primary hover:bg-primary-hover text-white text-xs font-medium py-2 px-4 rounded transition-colors">
                            Salvar Observações
                        </button>
                    </div>
                </div>

                <button className="w-full py-3 border border-dashed border-white/20 rounded-lg text-sm text-text-secondary hover:text-white hover:border-primary hover:bg-primary/5 transition-all flex items-center justify-center gap-2">
                    <Upload size={18} />
                    Carregar novo arquivo
                </button>
            </div>
        </div>
    );
}
