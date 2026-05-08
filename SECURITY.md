# 🔒 Política de Segurança - Kachat

Este documento descreve as políticas de segurança implementadas no projeto Kachat.

---

## 1. Autenticação e Autorização

### autenticação
- O sistema utiliza **Supabase Auth** para gerenciamento de sessões
- Usuários devem confirmar email antes de fazer login
- Tokens JWT são usados para autenticação de requisições

### Autorização (RLS - Row Level Security)
Todas as tabelas possuem políticas RLS ativas:

| Tabela | SELECT | INSERT | UPDATE | DELETE |
|--------|--------|--------|--------|--------|
| `profiles` | Público | Próprio perfil | Próprio perfil | - |
| `groups` | Público | Dono apenas | Dono/Admins | Dono apenas |
| `group_members` | Público | Dono/Admins | - | Membro/Admin |
| `group_messages` | Membros | Membros | Sender/Admins | Sender apenas |
| `direct_messages` | Sender/Receiver | Autenticado | Sender apenas | Sender apenas |

---

## 2. Validação de Input

### Limites de Tamanho
| Campo | Limite | Local |
|-------|--------|-------|
| Mensagem | 10.000 chars | Frontend + Database |
| Nome de usuário | 50 chars | Frontend + Database |
| Nome de grupo | 100 chars | Frontend + Database |
| Descrição grupo | 500 chars | Frontend + Database |
| Arquivo upload | 100MB | Frontend + RLS |

### Validação de URLs
- Apenas protocolos `http` e `https` são permitidos
- URLs com `javascript:`, `data:`, `vbscript:` são bloqueadas
- Implementado no `markdownParser.jsx`

---

## 3. Upload de Arquivos

### Buckets Configurados

| Bucket | Tamanho Máximo | Tipos Permitidos |
|--------|----------------|------------------|
| `avatars` | 5MB | jpeg, png, webp |
| `chat-files` | 100MB |Todos (com validação client-side) |

### Tipos de Arquivo Bloqueados
- Executáveis (.exe, .sh, .bat, .cmd, .msi)
- Scripts (.js, .php, .asp, .cgi)
- Sistemas (.dll, .so, .dylib)

---

## 4. Prevenção de Vulnerabilidades

### XSS (Cross-Site Scripting)
- Todo HTML em mensagens é escapado antes da renderização
- Função `escapeHtml()` aplicada no markdown parser
- Links abrem em nova aba com `rel="noopener noreferrer"`

### SQL Injection
- Queries feitas via cliente Supabase usam parameterized queries
- Não há concatenação de strings em queries SQL

### CSRF
- Supabase usa tokens JWT no header Authorization
- Tokens são validados automaticamente pelo Supabase

---

## 5. Variáveis de Ambiente

O projeto requer as seguintes variáveis de ambiente:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
```

**Nota:** O arquivo `.env` deve ser criado localmente e NUNCA deve ser commitado. Use `.env.example` como template.

---

## 6. Checklist de Segurança para Code Review

Ao adicionar novas funcionalidades, verifique:

- [ ] Não expor dados sensíveis no frontend
- [ ] Validar input do usuário
- [ ] Verificar permissões RLS para novas tabelas
- [ ] Usar parameterized queries (não concatenar strings)
- [ ] Sanitizar HTML antes de renderizar
- [ ] Validar tipos de arquivo em uploads
- [ ] Não commitar secrets ou chaves

---

## 7. Reportando Vulnerabilidades

Se encontrar uma vulnerabilidade de segurança, por favor:
1. Não divulgue publicamente
2. Entre em contato com a equipe de desenvolvimento
3. Forneça detalhes sobre a vulnerabilidade descoberta

---

## Histórico de Versão

| Versão | Data | Descrição |
|--------|------|------------|
| 1.0.0 | 2026-05-08 | Versão inicial com políticas básicas |

---

*Este documento deve ser atualizado sempre que novas políticas de segurança forem implementadas.*