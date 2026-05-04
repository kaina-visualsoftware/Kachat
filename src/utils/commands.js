// System commands for chat
const commands = {
  help: {
    name: 'help',
    description: 'Mostra todos os comandos disponíveis',
    execute: () => {
      const commandList = Object.values(commands)
        .map(c => `/${c.name} - ${c.description}`)
        .join('\n')
      return { 
        message: `📋 *Comandos disponíveis:*\n\n${commandList}`, 
        type: 'system' 
      }
    }
  },

  time: {
    name: 'time',
    description: 'Mostra a hora atual',
    execute: () => {
      const now = new Date()
      const time = now.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
      })
      return { 
        message: `🕐 *Hora atual:* ${time}`, 
        type: 'system' 
      }
    }
  },

  date: {
    name: 'date',
    description: 'Mostra a data de hoje',
    execute: () => {
      const now = new Date()
      const date = now.toLocaleDateString('pt-BR', { 
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
      return { 
        message: `📅 *Data:* ${date}`, 
        type: 'system' 
      }
    }
  },

  ping: {
    name: 'ping',
    description: 'Testa a latência do sistema',
    execute: () => {
      const start = Date.now()
      const latency = Date.now() - start
      return { 
        message: `🏓 Pong! Latência: ${latency}ms`, 
        type: 'system' 
      }
    }
  },

  roll: {
    name: 'roll',
    description: 'Rola um dado (padrão: 6 faces). Uso: /roll [faces]',
    execute: (args) => {
      const faces = parseInt(args[0]) || 6
      if (faces < 1 || faces > 1000) {
        return { 
          message: `⚠️ Número de faces deve estar entre 1 e 1000`, 
          type: 'system' 
        }
      }
      const result = Math.floor(Math.random() * faces) + 1
      return { 
        message: `🎲 Você rolou um d${faces}: *${result}*`, 
        type: 'system' 
      }
    }
  },

  coin: {
    name: 'coin',
    description: 'Joga cara ou coroa',
    execute: () => {
      const result = Math.random() > 0.5 ? 'cara 🪙' : 'coroa 🪙'
      return { 
        message: `🪙 *Resultado:* ${result}`, 
        type: 'system' 
      }
    }
  },

  shuffle: {
    name: 'shuffle',
    description: 'Escolhe aleatoriamente entre opções. Uso: /shuffle opção1 opção2 ...',
    execute: (args) => {
      if (args.length < 2) {
        return { 
          message: `⚠️ Forneça pelo menos 2 opções. Ex: /shuffle pizza sushi churrasco`, 
          type: 'system' 
        }
      }
      const chosen = args[Math.floor(Math.random() * args.length)]
      return { 
        message: `🔀 *Escolhido:* ${chosen}`, 
        type: 'system' 
      }
    }
  },

  shrug: {
    name: 'shrug',
    description: 'Envia ¯\\_(ツ)_/¯',
    execute: () => {
      return { 
        message: `¯\\_(ツ)_/¯`, 
        type: 'message' 
      }
    }
  },

  tableflip: {
    name: 'tableflip',
    description: 'Envia (╯°□°）╯︵ ┻━┻',
    execute: () => {
      return { 
        message: `(╯°□°）╯︵ ┻━┻`, 
        type: 'message' 
      }
    }
  },

  unflip: {
    name: 'unflip',
    description: 'Envia ┬─┬ノ( º_ºノ)',
    execute: () => {
      return { 
        message: `┬─┬ノ( º_ºノ)`, 
        type: 'message' 
      }
    }
  },

  lenny: {
    name: 'lenny',
    description: 'Envia um Lenny face aleatório',
    execute: () => {
      const lennys = [
        '( ͡° ͜ʖ ͡°)',
        '( ͡° ʖ ͡°)',
        '[ ͡° ͜ʖ ͡°]',
        '( ͡ʘ ͜ʖ ͡ʘ)',
        '( ͡° ʖ ͡°)',
        '( ͠° ͜ʖ ͠°)'
      ]
      const chosen = lennys[Math.floor(Math.random() * lennys.length)]
      return { 
        message: chosen, 
        type: 'message' 
      }
    }
  },

  version: {
    name: 'version',
    description: 'Mostra a versão do app',
    execute: () => {
      return { 
        message: `📱 *Kachat* - Versão 1.0.0\nDesenvolvido com React + Supabase`, 
        type: 'system' 
      }
    }
  },

  uptime: {
    name: 'uptime',
    description: 'Mostra há quanto tempo a página está aberta',
    execute: () => {
      const startTime = window.__startTime || Date.now()
      const uptime = Date.now() - startTime
      const seconds = Math.floor(uptime / 1000)
      const minutes = Math.floor(seconds / 60)
      const hours = Math.floor(minutes / 60)
      
      let uptimeStr = ''
      if (hours > 0) uptimeStr += `${hours}h `
      if (minutes % 60 > 0) uptimeStr += `${minutes % 60}m `
      uptimeStr += `${seconds % 60}s`
      
      return { 
        message: `⏱️ *Online há:* ${uptimeStr}`, 
        type: 'system' 
      }
    }
  },

  clear: {
    name: 'clear',
    description: 'Limpa as mensagens da tela (apenas localmente)',
    execute: () => {
      return { 
        message: `__CLEAR__`, 
        type: 'action' 
      }
    }
  },

  me: {
    name: 'me',
    description: 'Envia uma ação em terceira pessoa. Uso: /me está feliz',
    execute: (args) => {
      if (args.length === 0) {
        return { 
          message: `⚠️ Forneça uma ação. Ex: /me está feliz`, 
          type: 'system' 
        }
      }
      const action = args.join(' ')
      return { 
        message: `*Você ${action}*`, 
        type: 'message' 
      }
    }
  }
}

// Initialize start time for uptime command
if (typeof window !== 'undefined') {
  window.__startTime = Date.now()
}

export function getCommands() {
  return Object.values(commands)
}

export function getCommand(name) {
  return commands[name.toLowerCase()] || null
}

export function processCommand(input) {
  const trimmed = input.trim()
  if (!trimmed.startsWith('/')) return null
  
  const parts = trimmed.slice(1).split(' ')
  const cmdName = parts[0].toLowerCase()
  const args = parts.slice(1)
  
  const command = commands[cmdName]
  if (!command) {
    return { 
      message: `⚠️ Comando não encontrado: /${cmdName}. Digite /help para ver os comandos disponíveis.`, 
      type: 'system' 
    }
  }
  
  return command.execute(args)
}

export default commands
