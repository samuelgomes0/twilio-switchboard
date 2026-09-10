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
    recentHistory: {
      title: "Últimas consultas neste ambiente",
      reuse: "Executar novamente esta consulta",
    },
    noEnvironmentSelected: {
      title: "Nenhum ambiente selecionado",
      message: "Selecione um ambiente antes de executar operações.",
      link: "Gerenciar ambientes",
    },
    empty: "vazio",
    unknown: "Erro desconhecido",
    networkError: "Erro de rede",
    unexpectedError: "Erro inesperado",
    notAvailable: "Não disponível",
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
      toggleThemePress: "Pressione",
      toggleThemeKey: "d",
      toggleThemeHint: "para alternar tema",
    },
    sections: {
      conversations: "Conversations",
      taskrouter: "TaskRouter",
      numbers: "Números",
      settings: "Configurações",
      flex: "Flex",
    },
    nav: {
      numbers: {
        listNumbers: {
          label: "Classificar Senders",
          description: "Identifica o serviço usado por cada número WhatsApp",
        },
      },
      conversations: {
        fetch: {
          label: "Detalhes por SID",
          description: "Consulta dados e participantes de uma Conversation",
        },
        fetchByParticipant: {
          label: "Conversations por Número",
          description: "Localiza Conversations vinculadas a um número",
        },
        history: {
          label: "Mensagens por SID",
          description: "Pesquisa e exporta mensagens de uma Conversation",
        },
        close: {
          label: "Encerrar por Número",
          description: "Encerra Conversations ativas vinculadas a números",
        },
      },
      flex: {
        createAddressConfig: {
          label: "Configurar Endereço",
          description: "Cria um canal com integração Flex e Studio ou webhook",
        },
      },
      taskrouter: {
        assignWorkers: {
          label: "Adicionar Skill a Workers",
          description: "Atualiza os atributos de vários workers",
        },
        createWorkflow: {
          label: "Criar Workflow por CSV",
          description: "Importa filtros e filas de um arquivo CSV",
        },
        fetchTask: {
          label: "Buscar Task",
          description: "Retorna detalhes de uma task por SID",
        },
        fetchWorker: {
          label: "Detalhes do Worker",
          description: "Consulta um worker por SID, e-mail ou nome",
        },
        cancelQueueTasks: {
          label: "Encerrar Tasks por Fila",
          description: "Encerra tasks abertas e suas Conversations",
        },
        searchTasks: {
          label: "Tasks por SID ou Número",
          description: "Consulta uma Task ou localiza atendimentos do contato",
        },
        addParticularFilter: {
          label: "Adicionar Filtro a Workflows",
          description: "Direciona uma regra de negócio para Task Queues",
        },
      },
      config: {
        manageEnvironments: {
          label: "Ambientes Twilio",
          description: "Cadastre credenciais separadas por ambiente",
        },
        manageContacts: {
          label: "Contatos Salvos",
          description: "Associe nomes a números usados nos formulários",
        },
        manageVariables: {
          label: "Valores de Autocomplete",
          description: "Gerencie valores reutilizáveis nos formulários",
        },
      },
    },
  },
  dashboard: {
    title: "Switchboard",
    subtitle: "Execute operações Twilio por uma interface simples e segura.",
    intro: {
      badge: "Dashboard Twilio",
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
          "Consulte detalhes, participantes e mensagens de Conversations ou encerre atendimentos ativos por número.",
      },
      taskrouter: {
        label: "TaskRouter",
        description:
          "Consulte Tasks e Workers, atualize skills e configure Workflows, filtros e filas.",
      },
      settings: {
        label: "Configurações",
        description:
          "Gerencie ambientes Twilio, contatos e valores reutilizados nos formulários.",
      },
      numbers: {
        label: "Números",
        description:
          "Liste números WhatsApp e identifique se usam Conversations ou Programmable Chat.",
      },
    },
  },
  conversations: {
    page: {
      title: "Conversations",
      subtitle:
        "Consulte Conversations, analise mensagens e encerre atendimentos ativos.",
      metadata: {
        title: "Ferramentas para Conversations",
        description:
          "Consulte detalhes, participantes e mensagens de Conversations e encerre atendimentos ativos.",
      },
      intro: {
        badge: "Conversations API",
        features: {
          channel: "WhatsApp e SMS",
          batch: "Operações em lote",
          realtime: "Resultados em tempo real",
        },
        toolsHeading: "Ferramentas disponíveis",
      },
    },
    consult: {
      title: "Consultar Conversation",
      subtitle:
        "Consulte detalhes, participantes e mensagens usando o Conversation SID.",
      details: "Detalhes",
      messages: "Mensagens",
      tabs: "Informações da Conversation",
      result: "Resultado da consulta",
      refresh: "Atualizar",
      retry: "Tentar novamente",
      sidLabel: "Conversation SID",
      active: "Ativa",
      inactive: "Inativa",
      closed: "Encerrada",
      unknownState: "Estado indisponível",
      loadingDetails: "Carregando detalhes…",
      loadingPage: "Carregando consulta de Conversation…",
      loadingMessages: "Carregando mensagens…",
      detailsError:
        "Não foi possível consultar os detalhes. Verifique o SID e o ambiente e tente novamente.",
      messagesError:
        "Não foi possível consultar as mensagens. Verifique o SID e o ambiente e tente novamente.",
      invalidInput:
        "Dados da consulta inválidos. Verifique o SID e as credenciais.",
      apiError:
        "Não foi possível consultar a Conversation. Verifique o SID e as credenciais e tente novamente.",
    },
    fetch: {
      breadcrumb: "Detalhes por SID",
      title: "Consultar Conversation por SID",
      subtitle: "Consulte os detalhes e participantes de uma Conversation.",
      metadata: {
        title: "Detalhes da Conversation por SID",
        description:
          "Consulte dados gerais, atributos e participantes de uma Conversation pelo SID.",
      },
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
        viewHistory: "Ver histórico",
      },
      history: {
        title: "Últimas consultas",
        clear: "Limpar",
      },
    },
    history: {
      breadcrumb: "Mensagens por SID",
      title: "Consultar Mensagens por SID",
      subtitle: "Pesquise, filtre e exporte mensagens de uma Conversation.",
      sidLabel: "Conversation SID",
      sidPlaceholder: "CHxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      sidHint: "Formato: CH seguido de 32 caracteres hexadecimais",
      sidInvalid: "Deve começar com CH e ter 34 caracteres",
      metadata: {
        title: "Mensagens da Conversation por SID",
        description:
          "Pesquise, filtre e exporte as mensagens de uma Conversation pelo SID.",
      },
      filters: {
        contentLabel: "Buscar no conteúdo",
        contentPlaceholder: "Digite um trecho da mensagem",
        authorLabel: "Autor",
        allAuthors: "Todos os autores",
        startDateLabel: "Data inicial",
        endDateLabel: "Data final",
        clear: "Limpar filtros",
      },
      export: {
        button: "Exportar CSV",
        columns: [
          "Índice",
          "Message SID",
          "Autor",
          "Data",
          "Conteúdo",
          "Anexos",
        ],
      },
      recent: {
        title: "Últimas consultas",
        clear: "Limpar",
        messages: (count: number) => `${count} mensagem(ns)`,
        reuse: (sid: string) => `Usar novamente o Conversation SID ${sid}`,
      },
      result: {
        noFriendlyName: "Sem nome amigável",
        viewDetails: "Ver detalhes",
        messagesHeading: "Mensagens",
        messageCount: (count: number) => `${count} mensagem(ns)`,
        filteredMessageCount: (filtered: number, total: number) =>
          `${filtered} de ${total} mensagem(ns)`,
        empty: "Nenhuma mensagem encontrada nesta Conversation.",
        noFilteredMessages: "Nenhuma mensagem corresponde aos filtros.",
        limitWarning:
          "Exibindo as 1.000 mensagens mais recentes. Os filtros e a exportação consideram apenas essas mensagens.",
        dateUnavailable: "Data indisponível",
        systemAuthor: "Sistema",
        copyMessageSid: (sid: string) => `Copiar SID da mensagem ${sid}`,
        copySidHint: "Clique para copiar o SID",
        sidCopied: "SID copiado!",
        sidCopyError:
          "Não foi possível copiar. Selecione o SID e copie manualmente.",
        noText: "Mensagem sem conteúdo de texto",
        attachment: "Anexo",
      },
    },
    close: {
      breadcrumb: "Encerrar por Número",
      title: "Encerrar Conversations por Número",
      subtitle:
        "Encerre Conversations ativas vinculadas aos números informados.",
      metadata: {
        title: "Encerrar Conversations por Número",
        description:
          "Localize e encerre Conversations ativas vinculadas a números de telefone.",
      },
      phoneLabel: "Números de telefone",
      phoneLabelHint: "(DDD + número, sem dígito 9)",
      detected: (n: number) => `${n} número(s) detectado(s)`,
      maxExceeded: (max: number) => `; máximo de ${max} por vez`,
      addPhone: "Adicionar número",
      removePhone: "Remover número",
      submit: "Encerrar Conversations",
      confirmTitle: "Encerrar conversations?",
      confirmDescription: (n: number) =>
        `Você está prestes a encerrar ${n} conversation(s) ativa(s) para ${n} número(s). Esta ação não pode ser desfeita.`,
      confirmAction: "Sim, encerrar",
      summary: {
        prefix: "Concluído:",
        closed: (n: number) => `${n} conversation(s) encerrada(s)`,
        errors: (n: number) => `${n} erro(s)`,
      },
      history: {
        title: "Últimas operações",
        clear: "Limpar",
        item: (total: number, closed: number) =>
          `${total} número(s) · ${closed} encerrada(s)`,
        itemErrors: (n: number) => ` — ${n} erro(s)`,
      },
    },
    fetchByParticipant: {
      loadingPage: "Carregando Conversations por Número…",
      loadingResults: "Buscando Conversations vinculadas ao número…",
      breadcrumb: "Conversations por Número",
      title: "Conversations por Número",
      subtitle: "Localize Conversations vinculadas a um número do WhatsApp.",
      metadata: {
        title: "Conversations por Número",
        description:
          "Localize Conversations associadas a um número de WhatsApp e consulte seus detalhes ou mensagens.",
      },
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
        loadingMore: "Carregando...",
        consultConversation: "Consultar Conversation",
      },
      history: {
        title: "Últimas consultas",
        clear: "Limpar",
        item: (n: number) => `${n} conversa(s)`,
      },
    },
  },
  flex: {
    page: {
      title: "Flex",
      subtitle: "Configure canais de mensagens integrados ao Flex.",
      metadata: {
        title: "Configuração do Twilio Flex",
        description:
          "Configure endereços de canal e integrações do Twilio Flex.",
      },
      intro: {
        badge: "Flex API",
        features: {
          channels: "WhatsApp e SMS",
          studio: "Integração Studio",
          autocreation: "Auto-criação de conversas",
        },
        toolsHeading: "Ferramentas disponíveis",
      },
    },
    createAddressConfig: {
      breadcrumb: "Configurar Endereço",
      title: "Configurar Endereço de Canal",
      subtitle: "Crie um endereço e configure a entrada de mensagens no Flex.",
      metadata: {
        title: "Configurar Endereço de Canal no Flex",
        description:
          "Crie um endereço de canal e configure sua integração com Studio, webhook ou Flex.",
      },
      addressTypeLabel: "Tipo de endereço",
      addressTypes: {
        sms: "SMS",
        whatsapp: "WhatsApp",
        messenger: "Messenger",
        gbm: "Google Business Messages",
        email: "E-mail",
        rcs: "RCS",
        apple: "Apple Business Chat",
        chat: "Chat",
      },
      addressFieldLabel: {
        whatsapp: "Número WhatsApp",
        sms: "Número de telefone",
        messenger: "ID do Messenger",
        gbm: "ID Google Business Messages",
        email: "E-mail",
        rcs: "Número RCS",
        apple: "ID Apple Business Chat",
        chat: "ID do Chat",
      },
      addressCapabilities: {
        whatsapp:
          "Este endereço será criado no Flex Conversations. **Capacidades do endereço:** Suporta entrada de mensagens e anexos via WhatsApp.",
        sms: "Este endereço será criado no Flex Conversations. **Capacidades do endereço:** Suporta entrada de mensagens SMS.",
        messenger:
          "Este endereço será criado no Flex Conversations. **Capacidades do endereço:** Suporta entrada de mensagens via Facebook Messenger.",
        gbm: "Este endereço será criado no Flex Conversations. **Capacidades do endereço:** Suporta entrada de mensagens via Google Business Messages.",
        email:
          "Este endereço será criado no Flex Conversations. **Capacidades do endereço:** Suporta entrada de e-mails.",
        rcs: "Este endereço será criado no Flex Conversations. **Capacidades do endereço:** Suporta entrada de mensagens RCS.",
        apple:
          "Este endereço será criado no Flex Conversations. **Capacidades do endereço:** Suporta entrada de mensagens via Apple Business Chat.",
        chat: "Este endereço será criado no Flex Conversations. **Capacidades do endereço:** Suporta entrada de mensagens de chat.",
      },
      friendlyNameLabel: "Nome amigável do endereço",
      flexIntegrationSection: "Integração com o Flex",
      flexIntegrationInfo:
        "Define como o Flex processa mensagens recebidas neste endereço.",
      integrationTypeLabel: "Tipo de integração",
      integrationTypes: {
        studio: "Studio",
        webhook: "Webhook",
        default: "Padrão",
      },
      studioFlowLabel: "Studio Flow",
      studioFlowPlaceholder: "Selecionar um Flow",
      studioFlowHint: "FW seguido de 32 caracteres hexadecimais",
      webhookUrlLabel: "Webhook URL",
      webhookMethodLabel: "Método HTTP",
      submit: "Criar Endereço",
      cancel: "Cancelar",
      confirmTitle: "Criar configuração de endereço?",
      confirmDescription: (address: string, env: string) =>
        `Criar configuração para o endereço ${address} no ambiente ${env}?`,
      confirmAction: "Sim, criar",
      result: {
        sid: "SID da configuração",
        address: "Endereço",
        type: "Tipo",
        friendlyName: "Nome amigável",
        noFriendlyName: "Sem nome amigável",
        addressCountry: "País",
        noCountry: "Não informado",
        dateCreated: "Criada em",
        dateUpdated: "Atualizada em",
        autoCreation: "Integração Flex",
        autoCreationEnabled: "Habilitada",
        autoCreationDisabled: "Desabilitada",
      },
      history: {
        title: "Últimas criações",
        clear: "Limpar",
      },
    },
  },
  taskrouter: {
    workerManagement: {
      title: "Gerenciar Workers",
      subtitle: "Consulte Workers e gerencie suas skills e plugins do Flex.",
      loading: "Carregando gerenciamento de Workers…",
      workspaceLabel: "Workspace SID",
      workspacePlaceholder: "WS seguido de 32 caracteres hexadecimais",
      tabsLabel: "Operações de Workers",
      tabs: {
        details: "Detalhes",
        skills: "Skills",
        features: "Plugins do Flex",
      },
      actions: {
        addSkill: "Adicionar skill",
        configureFeature: "Configurar plugin",
      },
    },
    updateWorkerFeature: {
      title: "Configurar Plugins do Flex",
      subtitle:
        "Habilite ou desabilite um plugin do Flex para um ou vários Workers.",
      workspaceLabel: "SID do Workspace",
      workspacePlaceholder: "WS seguido de 32 caracteres hexadecimais",
      workersLabel: "Workers",
      workerLabel: (position: number) => `Worker ${position}`,
      addWorker: "Adicionar Worker",
      removeWorker: (position: number) => `Remover Worker ${position}`,
      workersPlaceholder: "WK seguido de 32 caracteres ou e-mail do Worker",
      featureLabel: "Nome do plugin",
      featurePlaceholder: "dasa_cdc_integration",
      featureHint:
        "Comece com uma letra e use apenas letras, números e sublinhado (até 100 caracteres).",
      enabledLabel: "Estado do plugin",
      enabled: "Habilitado (true)",
      disabled: "Desabilitado (false)",
      submit: "Aplicar plugin aos Workers",
      confirmTitle: "Confirmar alteração do plugin",
      confirmDescription: (
        feature: string,
        enabled: boolean,
        count: number,
        workspace: string,
        environment: string
      ) =>
        `Definir o plugin ${feature} como ${enabled ? "habilitado" : "desabilitado"} em ${count} Worker(s) do Workspace ${workspace}, no ambiente ${environment}? As alterações já aplicadas não serão desfeitas ao cancelar.`,
      invalidInput:
        "Dados inválidos. Confira os Workers, o nome do plugin, o estado e as credenciais. O limite é de 10 Workers por operação.",
      invalidAttributes: "Os atributos existentes têm uma estrutura inválida.",
      connectionError:
        "Não foi possível concluir a operação. Confira o ambiente e consulte os Workers antes de tentar novamente.",
      cancelled:
        "Cancelamento solicitado. Alterações já aplicadas serão mantidas; uma atualização em andamento ainda pode ser concluída.",
      processingWorker: (sid: string) => `Processando Worker ${sid}...`,
      updatedWorker: (sid: string) => `Worker ${sid} atualizado.`,
      failedWorker: (sid: string) =>
        `Não foi possível atualizar o Worker ${sid}. Confira se ele existe no Workspace e consulte seu estado antes de tentar novamente.`,
      invalidWorkerAttributes: (sid: string) =>
        `Worker ${sid} não foi alterado: os atributos ou a configuração do plugin têm uma estrutura inválida.`,
      summary: (updated: number, errors: number) =>
        `Concluído: ${updated} Worker(s) atualizado(s) e ${errors} erro(s).`,
    },
    page: {
      title: "TaskRouter",
      subtitle:
        "Consulte Tasks e Workers e configure o roteamento de atendimentos.",
      metadata: {
        title: "Ferramentas para TaskRouter",
        description:
          "Consulte Tasks e Workers e configure skills, Workflows, filtros e filas do TaskRouter.",
      },
      intro: {
        badge: "TaskRouter API",
        features: {
          routing: "Roteamento de tasks",
          workers: "Workers e filas",
          workflows: "Workflows configuráveis",
        },
        toolsHeading: "Ferramentas disponíveis",
      },
    },
    assignWorkers: {
      breadcrumb: "Adicionar Skill a Workers",
      title: "Adicionar Skill a Workers",
      subtitle: "Adicione uma skill a vários Workers por e-mail ou SID.",
      metadata: {
        title: "Adicionar Skill a Workers",
        description:
          "Adicione uma skill aos atributos de vários Workers do TaskRouter por e-mail ou SID.",
      },
      workspaceSidLabel: "Workspace SID",
      skillLabel: "Nome da skill (fila)",
      levelLabel: "Nível",
      levelOptional: "(opcional)",
      workersLabel: "Workers",
      workerLabel: (position: number) => `Worker ${position}`,
      workerPlaceholder: "WK seguido de 32 caracteres ou e-mail do Worker",
      addWorker: "Adicionar Worker",
      removeWorker: (position: number) => `Remover Worker ${position}`,
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
        itemSkipped: (n: number) => ` — ${n} ignorado(s)`,
        itemErrors: (n: number) => ` — ${n} erro(s)`,
      },
    },
    createWorkflow: {
      breadcrumb: "Criar Workflow por CSV",
      title: "Criar Workflow por CSV",
      subtitle: "Crie um Workflow importando regras e filas de um arquivo CSV.",
      metadata: {
        title: "Criar Workflow do TaskRouter por CSV",
        description:
          "Crie um Workflow do TaskRouter importando filtros e Task Queues de um arquivo CSV.",
      },
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
      title: "Consultar Task por SID",
      subtitle: "Consulte os detalhes e o estado atual de uma Task.",
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
      breadcrumb: "Detalhes do Worker",
      title: "Detalhes do Worker",
      subtitle:
        "Consulte atividade, skills e atributos por SID, e-mail ou nome.",
      metadata: {
        title: "Detalhes do Worker",
        description:
          "Consulte atividade, skills e atributos de um Worker do TaskRouter por SID, e-mail ou nome.",
      },
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
    searchTasks: {
      breadcrumb: "Tasks por SID ou Número",
      title: "Tasks por SID ou Número",
      subtitle:
        "Consulte uma Task por SID ou localize atendimentos por telefone.",
      metadata: {
        title: "Tasks por SID ou Número",
        description:
          "Consulte uma Task por SID ou localize Tasks de voz e WhatsApp pelo número do contato.",
      },
      workspaceSidLabel: "Workspace SID",
      modeSid: "Por SID",
      modePhone: "Por Telefone",
      taskSidLabel: "Task SID",
      taskSidHint: "Formato: WT seguido de 32 caracteres hexadecimais",
      taskSidInvalid: "Deve começar com WT e ter 34 caracteres",
      phoneLabel: "Número de telefone",
      phoneLabelHint:
        "Aceita +5511999999999, 5511999999999 ou whatsapp:+5511999999999",
      submit: "Buscar",
      confirmSidTitle: "Buscar task?",
      confirmSidDescription: (sid: string, env: string) =>
        `Buscar dados da task ${sid} no ambiente ${env}?`,
      confirmPhoneTitle: "Buscar tasks?",
      confirmPhoneDescription: (phone: string, env: string) =>
        `Buscar tasks do número ${phone} no ambiente ${env}?`,
      result: {
        count: (n: number) => `${n} task(s) encontrada(s)`,
        none: "Nenhuma task encontrada para esse número.",
        channel: "Canal",
        workflow: "Workflow",
        queue: "Fila",
        status: "Status",
        priority: "Prioridade",
        age: "Idade",
        dateCreated: "Criada em",
        attributes: "Atributos",
        channelVoice: "Voz",
        channelWhatsapp: "WhatsApp",
        channelUnknown: "Desconhecido",
        copySid: "Copiar SID",
        sidCopied: "Copiado!",
      },
      history: {
        title: "Últimas consultas",
        clear: "Limpar",
        itemPhone: (n: number) => `${n} task(s)`,
      },
    },
    cancelQueueTasks: {
      breadcrumb: "Encerrar Tasks por Fila",
      title: "Encerrar Tasks por Fila",
      subtitle: "Encerre Tasks abertas e suas Conversations associadas.",
      metadata: {
        title: "Encerrar Tasks por Fila",
        description:
          "Encerre Tasks abertas de uma Task Queue e feche as Conversations associadas.",
      },
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
        itemSkipped: (n: number) => ` — ${n} ignorada(s)`,
        itemErrors: (n: number) => ` — ${n} erro(s)`,
      },
    },
    addParticularFilter: {
      breadcrumb: "Adicionar Filtro a Workflows",
      title: "Adicionar Filtro a Workflows",
      subtitle: "Adicione uma regra de roteamento a Workflows e Task Queues.",
      metadata: {
        title: "Adicionar Filtro a Workflows",
        description:
          "Adicione uma regra de roteamento a vários Workflows e associe cada um a uma Task Queue.",
      },
      workspaceSidLabel: "Workspace SID",
      filterNameLabel: "Nome da regra de negócio",
      filterNamePlaceholder: "ex: PARTICULAR",
      filterNameRequired: "Informe o nome da regra de negócio",
      workflowSidColLabel: "Workflow SID",
      taskQueueSidColLabel: "Task Queue SID",
      workflowSidInvalid: "Deve começar com WW e ter 34 caracteres",
      workflowSidRequired: "Informe o Workflow SID",
      taskQueueSidInvalid: "Deve começar com WQ e ter 34 caracteres",
      taskQueueSidRequired: "Informe o Task Queue SID",
      addEntry: "Adicionar par",
      submit: "Adicionar Filtro",
      confirmTitle: "Adicionar filtro?",
      confirmDescription: (
        filterName: string,
        n: number,
        workspaceSid: string
      ) =>
        `Você está prestes a adicionar o filtro "${filterName}" em ${n} workflow(s) no workspace ${workspaceSid}. Workflows que já possuem um filtro com esse nome serão ignorados.`,
      confirmAction: "Adicionar",
      summary: {
        added: (n: number) => `${n} adicionado(s)`,
        skipped: (n: number) => `${n} já existia(m)`,
        errors: (n: number) => `${n} erro(s)`,
      },
      history: {
        title: "Últimas operações",
        clear: "Limpar",
        item: (filterName: string, n: number) =>
          `${filterName} · ${n} adicionado(s)`,
        itemSkipped: (n: number) => ` — ${n} já existia(m)`,
        itemErrors: (n: number) => ` — ${n} erro(s)`,
      },
    },
  },
  contacts: {
    manager: {
      breadcrumb: "Contatos Salvos",
      title: "Contatos Salvos",
      subtitle: "Associe nomes aos números usados nos formulários.",
      metadata: {
        title: "Contatos Salvos",
        description:
          "Cadastre nomes e números de telefone para preencher formulários com mais rapidez.",
      },
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
      breadcrumb: "Valores de Autocomplete",
      title: "Valores de Autocomplete",
      subtitle: "Gerencie valores reutilizáveis por campo e ambiente.",
      metadata: {
        title: "Valores de Autocomplete",
        description:
          "Gerencie valores salvos por campo e ambiente para reutilização nos formulários.",
      },
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
      subtitle: "Gerencie credenciais, contatos e valores reutilizáveis.",
      metadata: {
        title: "Configurações do Switchboard",
        description:
          "Gerencie ambientes Twilio, contatos salvos e valores reutilizáveis nos formulários.",
      },
      intro: {
        badge: "Configurações",
        features: {
          multienv: "Múltiplos ambientes",
          local: "Dados locais e privados",
          aux: "Recursos auxiliares",
        },
        toolsHeading: "Ferramentas disponíveis",
      },
      tools: {
        manage: {
          label: "Ambientes Twilio",
          description:
            "Cadastre credenciais e escolha qual conta usar nas operações.",
        },
        contacts: {
          label: "Contatos Salvos",
          description:
            "Associe nomes a números para preencher buscas e operações.",
        },
        variables: {
          label: "Valores de Autocomplete",
          description:
            "Organize valores reutilizáveis por tipo de campo e ambiente.",
        },
      },
    },
    manager: {
      breadcrumb: "Ambientes Twilio",
      title: "Ambientes Twilio",
      subtitle: "Cadastre credenciais e selecione a conta usada nas operações.",
      metadata: {
        title: "Ambientes Twilio",
        description:
          "Cadastre, teste e selecione credenciais Twilio para cada ambiente.",
      },
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
        "Começa com AC, seguido de 32 caracteres hexadecimais. Total: 34 caracteres",
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
      subtitle: "Identifique o serviço associado a cada número do WhatsApp.",
      metadata: {
        title: "Números WhatsApp da Conta",
        description:
          "Liste os números WhatsApp da conta e identifique o serviço associado a cada um.",
      },
      intro: {
        badge: "Numbers API",
        features: {
          classification: "Classificação por serviço",
          filtering: "Filtros e ordenação",
          realtime: "Dados em tempo real",
        },
        toolsHeading: "Ferramentas disponíveis",
      },
    },
    list: {
      breadcrumb: "Classificar Senders",
      title: "Classificar WhatsApp Senders",
      subtitle:
        "Liste os Senders e identifique o serviço de mensageria de cada número.",
      metadata: {
        title: "Classificar WhatsApp Senders",
        description:
          "Liste, filtre e exporte WhatsApp Senders classificados por Conversations ou Programmable Chat.",
      },
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
        export: "Exportar",
        exportCsv: "CSV",
        exportExcel: "Excel",
        exportFilename: "whatsapp-senders",
      },
    },
  },
} as const
