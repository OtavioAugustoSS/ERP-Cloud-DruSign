export interface ViaCEPResult {
    logradouro: string;
    bairro: string;
    localidade: string;
    uf: string;
}

export async function fetchAddressByCEP(cep: string): Promise<ViaCEPResult | null> {
    const digits = cep.replace(/\D/g, '');
    if (digits.length !== 8) return null;
    try {
        const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
        if (!res.ok) return null;
        const data = await res.json() as Record<string, string>;
        if (data.erro) return null;
        return {
            logradouro: data.logradouro ?? '',
            bairro: data.bairro ?? '',
            localidade: data.localidade ?? '',
            uf: data.uf ?? '',
        };
    } catch {
        return null;
    }
}
