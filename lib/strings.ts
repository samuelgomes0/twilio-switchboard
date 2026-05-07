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
    aborted: "Operação cancelada",
    remove: "Remover",
    workspaceSidInvalid: "Deve começar com WS e ter 34 caracteres",
    phoneDigitsOnly: "Deve conter apenas dígitos",
    waitingForOperations: "Aguardando operações...",
    warningBadge: {
      label: "Atenção",
      tooltip:
        "Esta operação modifica dados no Twilio. Revise os campos antes de executar.",
    },
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
      numbers: "Números",
      settings: "Configurações",
    },
    nav: {
      numbers: {
        listNumbers: {
          label: "WhatsApp Senders",
          description:
            "Lista senders e identifica Conversations ou Programmable Chat",
        },
      },
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
        manageVariables: {
          label: "Gerenciar Variáveis",
          description: "Gerencie valores salvos para autocompletar",
        },
      },
    },
  },
  dashboard: {
    title: "Switchboard",
    subtitle:
      "Interface visual para operações Twilio. Selecione uma ferramenta abaixo.",
    intro: {
      badge: "Dashboard Twilio",
      description:
        "Painel de controle para operações Twilio. Execute ações diretamente pela interface, com resultados em tempo real — sem scripts, sem acesso ao console.",
      features: {
        credentials: "Credenciais armazenadas localmente",
        realtime: "Streaming de resultados em tempo real",
        multienv: "Suporte a múltiplos ambientes",
      },
      toolsHeading: "Ferramentas disponíveis",
    },
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
      numbers: {
        label: "Números",
        description:
          "Consulte e classifique os números WhatsApp da conta entre Conversations e Programmable Chat.",
      },
    },
  },
  conversations: {
    page: {
      title: "Conversations",
      subtitle:
        "Feche conversas ativas em lote e consulte detalhes de conversas por SID.",
      intro: {
        badge: "Conversations API",
        description:
          "Ferramentas para operar sobre conversas Twilio. Consulte, filtre e execute ações — com resultados em tempo real, sem sair da interface.",
        features: {
          channel: "WhatsApp e SMS",
          batch: "Operações em lote",
          realtime: "Resultados em tempo real",
        },
        toolsHeading: "Ferramentas disponíveis",
      },
    },
    fetch: {
      breadcrumb: "Buscar Conversa",
      title: "Buscar Conversa por SID",
      subtitle: "Consulta os detalhes completos de uma conversa pelo SID",
      about:
        "Busca uma conversa pelo SID e exibe suas informações completas. Útil quando você tem o SID e quer inspecionar a conversa sem abrir o console Twilio.",
      sidLabel: "Conversation SID",
      sidHint: "Formato: CH seguido de 32 caracteres hexadecimais",
      sidInvalid: "Deve começar com CH e ter 34 caracteres",
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
        messagingServiceSid: "Messaging Service SID",
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
        "Fecha em lote todas as conversas ativas de um ou mais números de telefone",
      about:
        "Localiza e encerra em lote todas as conversas ativas associadas a uma lista de números de telefone. Ideal para desativar atendimentos de vários números de uma só vez.",
      phoneLabel: "Números de telefone",
      phoneLabelHint: "(DDD + número, sem dígito 9)",
      detected: (n: number) => `${n} número(s) detectado(s)`,
      maxExceeded: (max: number) => ` — máximo ${max} por vez`,
      addPhone: "Adicionar número",
      removePhone: "Remover número",
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
        item: (total: number, closed: number) =>
          `${total} número(s) · ${closed} fechada(s)`,
        itemErrors: (n: number) => ` · ${n} erro(s)`,
      },
    },
    fetchByParticipant: {
      breadcrumb: "Buscar por Participante",
      title: "Buscar por Participante",
      subtitle: "Lista todas as conversas associadas a um número de telefone",
      about:
        "Lista todas as conversas em que um número de telefone participou. Útil para entender o histórico de atendimento de um cliente ou verificar o estado atual das suas conversas.",
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
        totalSuffix: (n: number) => ` · ${n} total`,
        dateCreated: "Criada:",
        dateUpdated: "Atualizada:",
        identity: "Identidade:",
        loadMore: "Carregar mais",
      },
      history: {
        title: "Últimas consultas",
        clear: "Limpar",
        item: (n: number) => `${n} conversa(s)`,
      },
    },
  },
  taskrouter: {
    page: {
      title: "TaskRouter",
      subtitle:
        "Atribua workers, crie workflows, consulte tasks e inspecione workers do TaskRouter.",
      intro: {
        badge: "TaskRouter API",
        description:
          "Ferramentas para gerenciar o TaskRouter. Configure roteamento, opere sobre workers e filas, e automatize processos diretamente pela interface.",
        features: {
          routing: "Roteamento de tasks",
          workers: "Workers e filas",
          workflows: "Workflows configuráveis",
        },
        toolsHeading: "Ferramentas disponíveis",
      },
    },
    assignWorkers: {
      breadcrumb: "Atribuir Workers",
      title: "Atribuir Workers à Fila",
      subtitle:
        "Adiciona uma skill aos atributos de múltiplos workers de uma vez",
      about:
        "Adiciona uma skill com nível opcional aos atributos de vários workers de uma vez. Ideal para preparar uma equipe antes de ativar uma nova fila ou redistribuir atendimentos entre times.",
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
        item: (n: number) => `${n} atualizado(s)`,
        itemSkipped: (n: number) => ` · ${n} ignorado(s)`,
        itemErrors: (n: number) => ` · ${n} erro(s)`,
      },
    },
    createWorkflow: {
      breadcrumb: "Criar Workflow",
      title: "Criar Workflow",
      subtitle:
        "Cria um workflow de roteamento no TaskRouter a partir de um arquivo CSV",
      about:
        "Lê as regras de negócio e filas de um arquivo CSV e cria o workflow de roteamento no TaskRouter. Ideal para automatizar a criação de workflows sem configurar cada filtro manualmente.",
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
        itemFilters: (n: number) => `${n} filtro(s)`,
      },
    },
    fetchTask: {
      breadcrumb: "Buscar Task",
      title: "Buscar Task",
      subtitle: "Consulta os detalhes completos de uma task pelo SID",
      about:
        "Busca uma task pelo SID e exibe suas informações completas. Útil quando você tem o SID e quer inspecionar o estado atual da task sem abrir o console Twilio.",
      workspaceSidLabel: "Workspace SID",
      taskSidLabel: "Task SID",
      taskSidHint: "Formato: WT seguido de 32 caracteres hexadecimais",
      taskSidInvalid: "Deve começar com WT e ter 34 caracteres",
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
        "Consulta os detalhes completos de um worker pelo SID ou e-mail",
      about:
        "Busca um worker pelo SID ou e-mail e exibe suas informações completas. Útil para inspecionar um worker e conferir suas configurações sem acessar o console Twilio.",
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
        "Encerra em lote as tasks de uma fila e fecha as conversas associadas",
      about:
        "Encerra em lote todas as tasks pendentes ou reservadas de uma fila, notifica os clientes e fecha as conversas associadas. Ideal para desativar uma fila inteira de atendimentos — ação irreversível, use com cuidado.",
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
        item: (n: number) => `${n} encerrada(s)`,
        itemSkipped: (n: number) => ` · ${n} ignorada(s)`,
        itemErrors: (n: number) => ` · ${n} erro(s)`,
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
  variables: {
    manager: {
      breadcrumb: "Gerenciar Variáveis",
      title: "Variáveis",
      subtitle: "Valores salvos para autocompletar nos formulários",
      addButton: "Adicionar",
      valueLabel: "Valor",
      valuePlaceholder: "Digite o valor...",
      saveButton: "Salvar",
      emptyHint: "Nenhum valor salvo",
      environmentLabel: "Ambiente ativo:",
      deleteConfirm: (val: string) =>
        `Excluir "${val}"? Esta ação não pode ser desfeita.`,
      deleteButton: "Confirmar exclusão",
    },
  },
  environments: {
    page: {
      title: "Configurações",
      subtitle: "Gerencie credenciais e configurações do Switchboard.",
      intro: {
        badge: "Configurações",
        description:
          "Central de configuração do Switchboard. Gerencie credenciais Twilio e recursos auxiliares que potencializam o uso das ferramentas.",
        features: {
          multienv: "Múltiplos ambientes",
          local: "Dados locais e privados",
          aux: "Recursos auxiliares",
        },
        toolsHeading: "Ferramentas disponíveis",
      },
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
        variables: {
          label: "Gerenciar Variáveis",
          description:
            "Adicione, edite e remova valores salvos para autocompletar nos formulários.",
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
      testButton: "Testar conexão",
      testingButton: "Testando...",
      testSuccess: "Conexão bem-sucedida",
      testError: "Credenciais inválidas ou sem permissão",
    },
  },
  numbers: {
    page: {
      title: "Números",
      subtitle:
        "Consulte e classifique os números WhatsApp da conta Twilio por serviço.",
      intro: {
        badge: "Numbers API",
        description:
          "Ferramentas para consultar e classificar os números WhatsApp da conta. Identifique qual serviço opera cada número — sem precisar acessar o console Twilio.",
        features: {
          classification: "Classificação por serviço",
          filtering: "Filtros e ordenação",
          realtime: "Dados em tempo real",
        },
        toolsHeading: "Ferramentas disponíveis",
      },
    },
    list: {
      breadcrumb: "WhatsApp Senders",
      title: "WhatsApp Senders",
      subtitle:
        "Lista todos os WhatsApp senders da conta e identifica o serviço de cada um",
      about:
        "Lista todos os WhatsApp senders registrados na conta e identifica se cada um opera via Conversations ou Programmable Chat. Útil para mapear rapidamente qual serviço está por trás de cada número sem precisar acessar o console Twilio.",
      submit: "Listar Senders",
      confirmTitle: "Listar senders?",
      confirmDescription: (env: string) =>
        `Listar todos os WhatsApp senders da conta no ambiente ${env}?`,
      table: {
        colMark: "Marca / Identificação",
        colNumber: "Número",
        colService: "Serviço",
        filterAll: "Todos",
        filterConversations: "Conversations",
        filterPchat: "Programmable Chat",
        searchPlaceholder: "Buscar por nome ou número...",
        empty: "Nenhum número encontrado.",
        emptyFiltered: "Nenhum número corresponde ao filtro.",
        count: (n: number) => `${n} número(s) encontrado(s)`,
        countFiltered: (n: number, total: number) =>
          `${n} de ${total} número(s)`,
      },
    },
  },
} as const
