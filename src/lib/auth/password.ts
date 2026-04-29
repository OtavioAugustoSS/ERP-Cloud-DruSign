// Política de senhas — aplicada na criação e troca de senha.
// Funções puras (sem server-only) para poder reusar a mensagem na UI client-side.
// Mudanças aqui valem para toda a aplicação.
export const PASSWORD_POLICY = {
    minLength: 8,
    maxLength: 128,
    requireUppercase: true,
    requireLowercase: true,
    requireNumber: true,
} as const;

export type PasswordValidationResult =
    | { ok: true }
    | { ok: false; error: string };

export function validatePassword(password: string): PasswordValidationResult {
    if (typeof password !== 'string') {
        return { ok: false, error: 'Senha inválida.' };
    }
    if (password.length < PASSWORD_POLICY.minLength) {
        return { ok: false, error: `A senha deve ter no mínimo ${PASSWORD_POLICY.minLength} caracteres.` };
    }
    if (password.length > PASSWORD_POLICY.maxLength) {
        return { ok: false, error: `A senha deve ter no máximo ${PASSWORD_POLICY.maxLength} caracteres.` };
    }
    if (PASSWORD_POLICY.requireUppercase && !/[A-Z]/.test(password)) {
        return { ok: false, error: 'A senha deve conter ao menos uma letra maiúscula.' };
    }
    if (PASSWORD_POLICY.requireLowercase && !/[a-z]/.test(password)) {
        return { ok: false, error: 'A senha deve conter ao menos uma letra minúscula.' };
    }
    if (PASSWORD_POLICY.requireNumber && !/[0-9]/.test(password)) {
        return { ok: false, error: 'A senha deve conter ao menos um número.' };
    }
    return { ok: true };
}

// Texto exibido na UI para o usuário saber a regra antes de digitar
export const PASSWORD_RULES_TEXT =
    `Mínimo de ${PASSWORD_POLICY.minLength} caracteres, com letra maiúscula, minúscula e número.`;
