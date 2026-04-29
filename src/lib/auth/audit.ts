import 'server-only';

import prisma from '@/lib/db';
import { getSession } from '@/lib/auth/session';

// Vocabulário de ações para manter o log filtrável.
// Adicionar novas conforme necessário — manter formato VERBO_ENTIDADE.
export type AuditAction =
    | 'LOGIN_SUCCESS'
    | 'LOGIN_FAILURE'
    | 'LOGOUT'
    | 'USER_CREATED'
    | 'USER_UPDATED'
    | 'USER_DELETED'
    | 'PASSWORD_CHANGED'
    | 'CLIENT_CREATED'
    | 'CLIENT_UPDATED'
    | 'CLIENT_DELETED'
    | 'ORDER_CREATED'
    | 'ORDER_UPDATED'
    | 'ORDER_STATUS_CHANGED'
    | 'ORDER_CANCELLED'
    | 'ORDER_DELETED'
    | 'PRODUCT_CREATED'
    | 'PRODUCT_UPDATED'
    | 'PRODUCT_DELETED'
    | 'SETTINGS_UPDATED';

interface AuditOptions {
    action: AuditAction;
    // ID alvo da ação (ex: orderId em ORDER_UPDATED). Opcional para ações sem alvo.
    targetId?: string;
    // Detalhes em JSON serializável. Não inclua dados sensíveis (senhas, tokens).
    details?: Record<string, unknown>;
    // Permite registrar log atribuído a um usuário específico (ex: LOGIN_SUCCESS antes da sessão existir)
    userId?: string;
}

// Registra um evento de auditoria.
// NUNCA lança — falha de auditoria não pode quebrar a operação principal.
// Em produção real, considere fila/buffer e alarme se a taxa de erro subir.
export async function audit(opts: AuditOptions): Promise<void> {
    try {
        let userId = opts.userId;
        if (!userId) {
            const session = await getSession();
            userId = session?.id;
        }
        if (!userId) {
            // Sem usuário identificado e sem userId explícito — não há a quem atribuir.
            // Schema atual exige userId NOT NULL. Se quiser registrar ações anônimas,
            // crie um usuário "system" no seed ou torne userId opcional.
            return;
        }

        const payload = {
            action: opts.action,
            ...(opts.targetId ? { targetId: opts.targetId } : {}),
            ...(opts.details ? { details: opts.details } : {}),
        };

        await prisma.log.create({
            data: {
                userId,
                // Serializamos como JSON string para caber no campo `action` (String).
                // Mantemos prefixo legível para grep/filtro rápido.
                action: `${opts.action}:${JSON.stringify(payload)}`,
            },
        });
    } catch (err) {
        console.error('[audit] falha ao registrar log:', err);
    }
}
