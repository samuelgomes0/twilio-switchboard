export const strings = {
  app: {
    title: "Switchboard",
    description: "Interface visual para operações Twilio",
  },
  common: {
    cancel: "Cancelar",
    search: "Buscar",
    clear: "Limpar",
    processing: "Processando...",
    save: "Salvar",
    comingSoon: "Em breve",
    logOfOperations: "Log de Operações",
    lastQueries: "Últimas consultas",
    lastOperations: "Últimas operações",
    noEnvironmentSelected: {
      title: "Nenhum ambiente selecionado",
      message: "Selecione um ambiente antes de executar operações.",
      link: "Gerenciar ambientes",
    },
    empty: "vazio",
    unknown: "Erro desconhecido",
    networkError: "Erro de rede",
    unexpectedError: "Erro inesperado",
    apiConnectionError: "Erro ao conectar com a API",
  },
  sidebar: {
    title: "Switchboard",
    toggleLabel: "Toggle sidebar",
    environment: "Ambiente",
    noEnvironment: "Nenhum ambiente",
    noEnvironmentRegistered: "Nenhum ambiente cadastrado",
    configureEnvironments: "Configurar ambientes",
    footer: {
      toggleThemeHint: "para alternar tema",
    },
    sections: {
      conversations: "Conversations",
      taskrouter: "TaskRouter",
      settings: "Configurações",
    },
    nav: {
      conversations: {
        fetch: {
          label: "Buscar Conversa",
          description: "Retorna detalhes por SID",
        },
        fetchByParticipant: {
          label: "Buscar por Participante",
          description: "Lista conversas de um endereço",
        },
        close: {
          label: "Fechar Conversas",
          description: "Fecha conversas ativas por número",
        },
      },
      taskrouter: {
        assignWorkers: {
          label: "Atribuir Workers",
          description: "Adiciona skills a workers por e-mail",
        },
        createWorkflow: {
          label: "Criar Workflow",
          description: "Cria workflow de roteamento via CSV",
        },
        fetchTask: {
          label: "Buscar Task",
          description: "Retorna detalhes de uma task por SID",
        },
        fetchWorker: {
          label: "Buscar Worker",
          description: "Retorna dados de um worker por SID ou e-mail",
        },
        cancelQueueTasks: {
          label: "Encerrar Tasks da Fila",
          description: "Encerra tasks pendentes/reservadas e fecha conversas",
        },
      },
      config: {
        manageEnvironments: {
          label: "Gerenciar Ambientes",
          description: "Cadastre e gerencie credenciais Twilio",
        },
        manageContacts: {
          label: "Gerenciar Contatos",
          description: "Salve números com nomes para autocompletar",
        },
      },
    },
  },
  dashboard: {
    title: "Switchboard",
    subtitle:
      "Interface visual para operações Twilio. Selecione uma ferramenta abaixo.",
    tools: {
      conversations: {
        label: "Conversations",
        description:
          "Fecha conversas ativas em lote por número de telefone e consulta estado, participantes e atributos de conversas por SID.",
      },
      taskrouter: {
        label: "TaskRouter",
        description:
          "Atribui skills a workers por e-mail e cria workflows de roteamento a partir de arquivos CSV.",
      },
      settings: {
        label: "Configurações",
        description:
          "Cadastre e gerencie credenciais Twilio (Account SID e Auth Token) para múltiplos ambientes.",
      },
    },
  },
  conversations: {
    page: {
      title: "Conversations",
      subtitle:
        "Feche conversas ativas em lote e consulte detalhes de conversas por SID.",
    },
    fetch: {
      breadcrumb: "Buscar Conversa",
      title: "Buscar Conversa por SID",
      subtitle:
        "Retorna estado, participantes, atributos e datas de uma conversa",
      sidLabel: "Conversation SID",
      sidHint: "Formato: CH seguido de 32 caracteres hexadecimais",
      confirmTitle: "Buscar conversa?",
      confirmDescription: (sid: string, env: string) =>
        `Buscar dados da conversa ${sid} no ambiente ${env}?`,
      result: {
        noFriendlyName: "Sem nome amigável",
        dateCreated: "Criada em",
        dateUpdated: "Atualizada em",
        attributes: "Atributos",
        participants: "Participantes",
        noParticipants: "Nenhum participante encontrado",
        type: "Tipo",
        address: "Endereço",
        proxy: "Proxy",
        added: "Adicionado:",
        updated: "Atualizado:",
      },
      history: {
        title: "Últimas consultas",
        clear: "Limpar",
      },
    },
    close: {
      breadcrumb: "Fechar Conversas",
      title: "Fechar Conversas Ativas",
      subtitle:
        "Recebe números de telefone e fecha todas as conversas ativas associadas em lote",
      phoneLabel: "Números de telefone",
      phoneLabelHint: "(DDD + número, sem dígito 9)",
      detected: (n: number) => `${n} número(s) detectado(s)`,
      maxExceeded: (max: number) => ` — máximo ${max} por vez`,
      submit: "Fechar Conversas",
      confirmTitle: "Fechar conversas?",
      confirmDescription: (n: number) =>
        `Você está prestes a fechar ${n} conversa(s) ativas para ${n} número(s). Esta ação não pode ser desfeita.`,
      confirmAction: "Sim, fechar",
      summary: {
        prefix: "Concluído:",
        closed: (n: number) => `${n} conversa(s) fechada(s)`,
        errors: (n: number) => `${n} erro(s)`,
      },
      history: {
        title: "Últimas operações",
        clear: "Limpar",
      },
    },
    fetchByParticipant: {
      breadcrumb: "Buscar por Participante",
      title: "Buscar por Participante",
      subtitle: "Retorna todas as conversas WhatsApp associadas a um número",
      phoneLabel: "Número de telefone",
      phoneLabelHint: "(DDD + número, sem dígito 9)",
      filterLabel: "Filtrar por estado",
      stateOptions: {
        all: "Todos",
        active: "Ativas",
        inactive: "Inativas",
        closed: "Fechadas",
      },
      confirmTitle: "Buscar conversas?",
      confirmDescription: (address: string, env: string, state?: string) =>
        `Buscar conversas do participante ${address}${state ? ` com estado ${state}` : ""} no ambiente ${env}?`,
      results: {
        none: "Nenhuma conversa encontrada para esse número.",
        noneFiltered: (state: string) =>
          `Nenhuma conversa com estado "${state}" encontrada.`,
        count: (n: number) => `${n} conversa(s) encontrada(s)`,
        dateCreated: "Criada:",
        dateUpdated: "Atualizada:",
        identity: "Identidade:",
        loadMore: "Carregar mais",
      },
      history: {
        title: "Últimas consultas",
        clear: "Limpar",
      },
    },
  },
  taskrouter: {
    page: {
      title: "TaskRouter",
      subtitle:
        "Atribua workers, crie workflows, consulte tasks e inspecione workers do TaskRouter.",
    },
    assignWorkers: {
      breadcrumb: "Atribuir Workers",
      title: "Atribuir Workers à Fila",
      subtitle:
        "Adiciona uma skill com nível opcional aos attributes de workers identificados por e-mail",
      workspaceSidLabel: "Workspace SID",
      skillLabel: "Nome da skill (fila)",
      levelLabel: "Nível",
      levelOptional: "(opcional)",
      emailsLabel: "E-mails ou SIDs dos workers",
      emailsHint: "(um por linha ou separados por vírgula)",
      detected: (n: number) => `${n} identificador(es) detectado(s)`,
      maxExceeded: (max: number) => ` — máximo ${max} por vez`,
      submit: "Atribuir Workers",
      confirmTitle: "Atribuir workers?",
      confirmDescription: (skill: string, n: number, workspaceSid: string) =>
        `Você está prestes a adicionar a skill "${skill}" a ${n} worker(s) no workspace ${workspaceSid}.`,
      confirmAction: "Atribuir",
      summary: {
        updated: (n: number) => `${n} worker(s) atualizados`,
        skipped: (n: number) => `${n} ignorados`,
        errors: (n: number) => `${n} erros`,
      },
      history: {
        title: "Últimas operações",
        clear: "Limpar",
      },
    },
    createWorkflow: {
      breadcrumb: "Criar Workflow",
      title: "Criar Workflow",
      subtitle:
        "Lê um CSV com regras de negócio e filas Twilio para gerar filtros e criar o workflow no TaskRouter",
      workspaceSidLabel: "Workspace SID",
      workflowNameLabel: "Nome do Workflow",
      csvLabel: "Arquivo CSV",
      csvSelected: (name: string) => `Arquivo selecionado: ${name}`,
      csvReadError: "Não foi possível ler o arquivo CSV.",
      submit: "Criar Workflow",
      confirmTitle: "Criar workflow?",
      confirmDescription: (
        name: string,
        workspaceSid: string,
        csvName: string
      ) =>
        `Você está prestes a criar o workflow "${name}" no workspace ${workspaceSid}. Os filtros serão lidos do arquivo: ${csvName}.`,
      confirmAction: "Criar",
      summary: {
        created: (name: string) => `Workflow criado: ${name}`,
        filters: (n: number) => `${n} filtro(s)`,
      },
      history: {
        title: "Últimas criações",
        clear: "Limpar",
      },
    },
    fetchTask: {
      breadcrumb: "Buscar Task",
      title: "Buscar Task",
      subtitle:
        "Retorna status, fila, prioridade, atributos e datas de uma task pelo SID",
      workspaceSidLabel: "Workspace SID",
      taskSidLabel: "Task SID",
      taskSidHint: "Formato: WT seguido de 32 caracteres hexadecimais",
      confirmTitle: "Buscar task?",
      confirmDescription: (taskSid: string, env: string) =>
        `Buscar dados da task ${taskSid} no ambiente ${env}?`,
      result: {
        priority: "Prioridade",
        age: "Idade",
        channel: "Canal",
        workflow: "Workflow",
        queue: "Fila",
        reason: "Motivo",
        dateCreated: "Criada em",
        dateUpdated: "Atualizada em",
        attributes: "Atributos",
      },
      history: {
        title: "Últimas consultas",
        clear: "Limpar",
      },
    },
    fetchWorker: {
      breadcrumb: "Buscar Worker",
      title: "Buscar Worker",
      subtitle:
        "Retorna atividade, skills, atributos e datas de um worker pelo SID ou e-mail",
      workspaceSidLabel: "Workspace SID",
      identifierLabel: "Worker SID ou e-mail",
      identifierHint: "Aceita SID (WK + 32 hex) ou e-mail/nome do worker",
      confirmTitle: "Buscar worker?",
      confirmDescription: (identifier: string, env: string) =>
        `Buscar dados do worker ${identifier} no ambiente ${env}?`,
      result: {
        skills: "Skills",
        level: (n: number) => `nível ${n}`,
        dateCreated: "Criado em",
        dateUpdated: "Atualizado em",
        dateStatusChanged: "Atividade alterada em",
        fullAttributes: "Atributos completos",
      },
      history: {
        title: "Últimas consultas",
        clear: "Limpar",
      },
    },
    cancelQueueTasks: {
      breadcrumb: "Encerrar Tasks da Fila",
      title: "Encerrar Tasks da Fila",
      subtitle:
        "Encerra tasks pendentes/reservadas, envia mensagem de aviso e fecha as conversas associadas",
      workspaceSidLabel: "Workspace SID",
      taskQueueNameLabel: "Nome da fila (Task Queue)",
      closeMessageLabel: "Mensagem enviada ao cliente antes de fechar",
      submit: "Encerrar Tasks",
      confirmTitle: "Encerrar tasks da fila?",
      confirmDescription: (queue: string, workspaceSid: string) =>
        `Você está prestes a encerrar todas as tasks pendentes/reservadas da fila "${queue}" no workspace ${workspaceSid}. As conversas associadas receberão uma mensagem e serão fechadas. Esta ação não pode ser desfeita.`,
      confirmAction: "Sim, encerrar",
      summary: {
        success: (n: number) => `${n} encerrada(s)`,
        skipped: (n: number) => `${n} ignorada(s)`,
        errors: (n: number) => `${n} erro(s)`,
      },
      history: {
        title: "Últimas operações",
        clear: "Limpar",
      },
    },
  },
  contacts: {
    manager: {
      breadcrumb: "Gerenciar Contatos",
      title: "Contatos",
      subtitle: "Números salvos com nomes para autocompletar nos formulários",
      addButton: "Novo contato",
      addTitle: "Novo contato",
      editTitle: "Editar contato",
      emptyTitle: "Nenhum contato cadastrado",
      emptyHint: "Clique em",
      emptyHintLink: "Novo contato",
      emptyHintSuffix: "para começar",
      deleteConfirm: (name: string) =>
        `Excluir "${name}"? Esta ação não pode ser desfeita.`,
      deleteButton: "Confirmar exclusão",
    },
    form: {
      nameLabel: "Nome",
      namePlaceholder: "ex: João Silva",
      phoneLabel: "Número (DDD + número)",
      phonePlaceholder: "ex: 1187654321",
      saveButton: "Salvar",
    },
  },
  environments: {
    page: {
      title: "Configurações",
      subtitle: "Gerencie credenciais e configurações do Switchboard.",
      tools: {
        manage: {
          label: "Gerenciar Ambientes",
          description:
            "Cadastre, edite e remova ambientes Twilio com Account SID e Auth Token.",
        },
        contacts: {
          label: "Gerenciar Contatos",
          description:
            "Salve números de telefone com nomes para autocompletar nos formulários.",
        },
      },
    },
    manager: {
      breadcrumb: "Gerenciar Ambientes",
      title: "Ambientes Twilio",
      subtitle: "Gerencie as credenciais de cada ambiente",
      addButton: "Novo ambiente",
      addTitle: "Novo ambiente",
      editTitle: "Editar ambiente",
      emptyTitle: "Nenhum ambiente cadastrado",
      emptyHint: "Clique em",
      emptyHintLink: "Novo ambiente",
      emptyHintSuffix: "para começar",
      deleteConfirm: (name: string) =>
        `Excluir "${name}"? Esta ação não pode ser desfeita.`,
      deleteButton: "Confirmar exclusão",
    },
    card: {
      active: "Ativo",
      accountSidLabel: "Account SID",
      authTokenLabel: "Auth Token",
      selectButton: "Selecionar",
      editAriaLabel: "Editar ambiente",
      deleteAriaLabel: "Excluir ambiente",
    },
    form: {
      nameLabel: "Nome do ambiente",
      namePlaceholder: "ex: Produção, Homologação",
      nameRequired: "Nome obrigatório",
      accountSidLabel: "Account SID",
      accountSidHint:
        "Começa com AC, seguido de 32 caracteres hex — total 34 chars",
      accountSidRequired: "Account SID obrigatório",
      accountSidInvalid: "Deve começar com AC e ter 34 caracteres",
      authTokenLabel: "Auth Token",
      authTokenPlaceholder: "32 caracteres",
      authTokenHint: "Exatamente 32 caracteres",
      authTokenRequired: "Auth Token obrigatório",
      authTokenInvalid: "Deve ter exatamente 32 caracteres",
      showTokenAriaLabel: "Revelar token",
      hideTokenAriaLabel: "Ocultar token",
      saveButton: "Salvar",
      cancelButton: "Cancelar",
    },
  },
} as const
