import { useState, useRef, useEffect } from 'react';
import { Pencil, Check, X, Building2 } from 'lucide-react';

interface EditableClientNameProps {
    initialName: string;
    onSave: (newName: string) => void;
}

export default function EditableClientName({ initialName, onSave }: EditableClientNameProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState(initialName);
    const [tempName, setTempName] = useState(initialName);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isEditing]);

    const handleSave = () => {
        if (tempName.trim()) {
            setName(tempName);
            onSave(tempName);
            setIsEditing(false);
        }
    };

    const handleCancel = () => {
        setTempName(name);
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSave();
        if (e.key === 'Escape') handleCancel();
    };

    if (isEditing) {
        return (
            <div className="flex items-center gap-2">
                <div className="relative flex-1 max-w-sm">
                    <Building2 className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                    <input
                        ref={inputRef}
                        type="text"
                        value={tempName}
                        onChange={(e) => setTempName(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="w-full bg-zinc-800 border border-zinc-600 rounded-md py-1.5 pl-9 pr-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        placeholder="Nome do Cliente"
                    />
                </div>
                <button
                    onClick={handleSave}
                    className="p-1.5 bg-green-500/10 text-green-500 rounded-md hover:bg-green-500/20 transition-colors"
                >
                    <Check size={16} />
                </button>
                <button
                    onClick={handleCancel}
                    className="p-1.5 bg-red-500/10 text-red-500 rounded-md hover:bg-red-500/20 transition-colors"
                >
                    <X size={16} />
                </button>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2 group">
            <Building2 className="text-text-secondary" size={16} />
            <span className="text-text-secondary">Cliente:</span>
            <span className="text-white font-medium">{name}</span>
            <button
                onClick={() => setIsEditing(true)}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-zinc-500 hover:text-blue-500 hover:bg-blue-500/10 rounded"
                title="Editar nome"
            >
                <Pencil size={14} />
            </button>
        </div>
    );
}
