export const strings = {
  interface: {
    collapseSidebar: "Recolher navegação",
    expandSidebar: "Expandir navegação",
    toolDirectory: "Ferramentas",
    toolSearch: "Buscar por nome ou finalidade…",
    allAreas: "Todas as áreas",
    filterArea: "Filtrar por área",
    toolColumn: "Ferramenta",
    openTool: "Abrir ferramenta",
    configureEnvironment: "Configurar ambiente",
    catalogCount: (count: number) =>
      `${count} ferramenta${count === 1 ? "" : "s"}`,
    emptyCatalog: "Nenhuma ferramenta corresponde à busca.",
    searchTools: "Buscar ferramenta",
    searchShortcut: "Ctrl K",
    searchPlaceholder: "Digite uma ferramenta ou operação…",
    noToolsFound: "Nenhuma ferramenta encontrada. Tente outro termo.",
    expandNavigation: (section: string) => `Expandir ou recolher ${section}`,
    areaColumn: "Área",
    purposeColumn: "O que você pode fazer",
    savedEnvironments: "Ambientes salvos",
    storageLabel: "Armazenamento",
    environmentSelectedHint:
      "As próximas operações usam este ambiente. Revise o destino antes de confirmar alterações.",
    copyFailed:
      "Não foi possível copiar. Selecione o identificador e tente novamente.",
    breadcrumb: "Caminho de navegação",
    skip: "Ir para o conteúdo",
    home: "Visão geral",
    closeNavigation: "Fechar navegação",
    theme: "Alternar tema",
    light: "Tema claro",
    dark: "Tema escuro",
    system: "Tema do sistema",
    quickAccess: "Consultas rápidas",
    areas: "Ferramentas",
    homeTitle: "Visão geral",
    homeDescription:
      "Acesse as ferramentas de consulta, roteamento e configuração da sua operação Twilio.",
    environmentHint:
      "Selecione um ambiente antes de consultar ou alterar recursos.",
    execution: "Acompanhamento da operação",
    clientCancel:
      "Interromper o acompanhamento não interrompe operações já enviadas à Twilio.",
    exportScope:
      "A exportação inclui todos os resultados carregados, mesmo com filtros ativos.",
  },
  app: {
    title: "Switchboard",
    description: "Interface visual para operações Twilio",
  },
  operationReview: {
    analyze: "Revisar alvos",
    loading: "Consultando alvos…",
    title: "Alvos revisados",
    hint: "A execução inclui somente os recursos desta prévia. O estado será conferido novamente antes de cada alteração. Revise novamente após cinco minutos ou ao editar os campos.",
    empty:
      "Nenhum recurso elegível encontrado. Confira os campos ou consulte novamente.",
    partial:
      "Consulta limitada a 1.000 recursos por busca. Somente os alvos exibidos serão processados; outros recursos podem existir.",
    invalid: "Prévia inválida ou expirada. Revise os alvos novamente.",
    failed:
      "Não foi possível consultar os alvos. Confira o ambiente e os campos e tente revisar novamente.",
    resource: "Recurso",
    result: "Resultado por alvo",
    pending: "Sem confirmação",
    success: "Concluído",
    warning: "Verificar efeitos adicionais",
    error: "Falha ou resultado não confirmado",
    skipped: "Ignorado",
    skippedChanged: "Ignorado: estado ou vínculo mudou",
    interrupted:
      "Acompanhamento interrompido. Alterações já enviadas podem ter sido aplicadas. Confira os resultados e consulte os recursos antes de executar novamente.",
    recovery:
      "Confira os resultados e consulte o estado atual dos recursos antes de uma nova execução. Uma falha de conexão não garante que a alteração deixou de acontecer.",
    discard:
      "Há preenchimento ou uma operação em andamento nesta página. Sair pode descartar dados e interromper o acompanhamento. Deseja sair?",
  },
  common: {
    storageSaveFailed:
      "Não foi possível salvar. Seu preenchimento foi mantido; verifique o armazenamento do navegador e tente novamente.",
    storageError:
      "Não foi possível acessar o armazenamento do navegador. Algumas alterações podem não ter sido salvas.",
    dismiss: "Fechar aviso",
    errors: {
      auth: "Credenciais inválidas ou sem permissão.",
      notFound: "Recurso não encontrado.",
      conflict: "Recurso já existe.",
      validation: "Parâmetros inválidos.",
      external: "Erro na API do Twilio. Tente novamente.",
      internal: "Erro interno do servidor.",
      retryAuth: "credenciais inválidas ou sem permissão",
      retryNotFound: "recurso não encontrado",
      rateLimit: "limite de requisições excedido",
      http: (status: number) => `erro HTTP ${status}`,
      retryExternal: "erro na API do Twilio",
      missingCredentials:
        "Credenciais não configuradas. Selecione um ambiente.",
    },
    validation: {
      invalidBody: "Corpo da requisição inválido",
      workspaceRequired: "O campo 'workspaceSid' é obrigatório",
      skillRequired: "O campo 'skill' é obrigatório",
      invalidSkillLevel: "O nível da skill deve ser um número entre 0 e 5",
      addressRequired: "O campo 'address' é obrigatório",
      invalidPageToken: "Token de página inválido",
      invalidCredentials: "Credenciais em formato inválido",
      phoneRequired: "O campo 'phoneNumber' é obrigatório",
      invalidPhone: "Número de telefone inválido",
      invalidWorkspaceSid:
        "Workspace SID inválido. Formato esperado: WS + 32 caracteres hex",
      identifierRequired: "O campo 'identifier' é obrigatório",
      taskRequired: "O campo 'taskSid' é obrigatório",
      invalidTaskSid:
        "Task SID inválido. Formato esperado: WT + 32 caracteres hex",
      participantsRequired:
        "O campo 'participants' deve ser um array não vazio",
      noValidParticipants: "Nenhum participante válido informado",
    },
    retry: {
      attemptFailed: (label: string, attempt: number, safeMessage: string) =>
        `${label}: tentativa ${attempt} falhou: ${safeMessage}. Tentando novamente...`,
      failed: (label: string, attempts: number, safeMessage: string) =>
        `${label}: falhou após ${attempts} tentativas: ${safeMessage}`,
    },
    placeholders: {
      workspaceSid: "WSxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      accountSid: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      taskSid: "WTxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      phone: "+5511999999999",
      localPhone: "11999999999",
      worker: "WKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx ou nome amigável",
      skill: "suporte-tecnico",
      level: "5",
    },
    autocomplete: {
      deleteValue: "Excluir valor salvo",
      saveValue: (value: string) => `+ Salvar “${value}”`,
      saveMessage: "+ Salvar mensagem atual",
    },
    cancel: "Cancelar",
    search: "Buscar",
    clear: "Limpar",
    refresh: "Atualizar",
    processing: "Processando...",
    loadingPage: "Carregando página...",
    operationProgress: "Progresso da operação",
    save: "Salvar",
    comingSoon: "Em breve",
    logOfOperations: "Log de operações",
    recentHistory: {
      title: "Atividade recente neste navegador",
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
    workspaceSidHint:
      "Use o Workspace do TaskRouter (WS + 32 caracteres), não o Account SID.",
    contextEnvironmentMismatch:
      "Este link foi aberto a partir de outro ambiente. Os campos não foram reaproveitados. Volte ao ambiente de origem ou informe os identificadores do ambiente atual.",
    phoneDigitsOnly: "Deve conter apenas dígitos",
    waitingForOperations: "Aguardando operações...",
    warningBadge: {
      label: "Atenção",
      tooltip:
        "Esta operação modifica dados no Twilio. Revise os campos antes de executar.",
    },
  },
  sidebar: {
    navigationAriaLabel: "Navegação principal",
    title: "Switchboard",
    toggleLabel: "Alternar navegação lateral",
    environment: "Ambiente",
    noEnvironment: "Nenhum ambiente",
    noEnvironmentRegistered: "Nenhum ambiente cadastrado",
    configureEnvironments: "Configurações",
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
    },
    nav: {
      numbers: {
        listNumbers: {
          label: "Classificar Senders",
        },
      },
      conversations: {
        fetchByParticipant: {
          label: "Conversations por Número",
        },
        close: {
          label: "Encerrar por Número",
        },
      },
      taskrouter: {
        searchTasks: {
          label: "Consultar Task",
        },
      },
      config: {
        manageEnvironments: {
          label: "Ambientes Twilio",
        },
        manageContacts: {
          label: "Contatos Salvos",
        },
        manageVariables: {
          label: "Valores de Autocomplete",
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
        description: "Consulte Tasks e Workers e gerencie skills e plugins.",
      },
      settings: {
        label: "Configurações",
        description:
          "Gerencie ambientes Twilio, contatos e valores reutilizados nos formulários.",
      },
      numbers: {
        label: "Números",
        description:
          "Liste números WhatsApp e confira configurações de Conversations e classificações estimadas de serviço.",
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
      searchTasksForNumber: "Buscar Tasks deste número",
      title: "Consultar Conversation",
      subtitle:
        "Consulte detalhes, participantes e mensagens usando o Conversation SID.",
      details: "Detalhes",
      messages: "Mensagens",
      tabs: "Informações da Conversation",
      result: "Resultado da consulta",
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
      metadata: {
        title: "Detalhes da Conversation por SID",
        description:
          "Consulte dados gerais, atributos e participantes de uma Conversation pelo SID.",
      },
      result: {
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
    },
    history: {
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
        contentPlaceholder: "Busque por conteúdo da mensagem",
        authorLabel: "Autor",
        allAuthors: "Todos os autores",
        startDateLabel: "Data inicial",
        endDateLabel: "Data final",
        clear: "Limpar filtros",
      },
      export: {
        filename: (sid: string) => `conversation-${sid}.csv`,
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
      result: {
        messagesHeading: "Mensagens",
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
    closeSingle: {
      button: "Encerrar Conversation",
      closing: "Encerrando…",
      ariaLabel: (sid: string) => `Encerrar a Conversation ativa ${sid}`,
      confirmTitle: "Encerrar esta Conversation?",
      confirmDescription: (sid: string) =>
        `A Conversation ${sid} será encerrada. Esta ação não pode ser desfeita e afeta apenas esta conversa.`,
      confirmAction: "Encerrar Conversation",
      success: "Conversation encerrada com sucesso.",
      notActive:
        "A Conversation não está mais ativa. Seu estado foi atualizado; nenhum encerramento foi realizado.",
      error:
        "Não foi possível confirmar o encerramento. Atualize a consulta para verificar o estado antes de tentar novamente.",
    },
    close: {
      log: {
        searching: (address: string) => `Buscando conversas para ${address}...`,
        searchLabel: (address: string) => `Busca de conversas (${address})`,
        noActive: (address: string) =>
          `Nenhuma conversa ativa encontrada para ${address}`,
        closeLabel: (sid: string) => `Fechar conversa ${sid}`,
        closed: (sid: string) => `Conversa ${sid} fechada com sucesso`,
        start: (count: number) =>
          `Iniciando processamento de ${count} número(s)...`,
        done: (totalClosed: number, totalErrors: number) =>
          `Concluído. ${totalClosed} conversa(s) fechada(s), ${totalErrors} erro(s).`,
        found: (count: number, address: string) =>
          `${count} conversa(s) ativa(s) encontrada(s) para ${address}`,
      },
      breadcrumb: "Encerrar por Número",
      title: "Encerrar Conversations por número",
      subtitle:
        "Encerre Conversations ativas vinculadas aos números informados.",
      metadata: {
        title: "Encerrar Conversations por Número",
        description:
          "Localize e encerre Conversations ativas vinculadas a números de telefone.",
      },
      phoneLabel: "Número de telefone",
      phoneLabelHint: "(DDD + número, apenas dígitos, sem +55)",
      invalidPhone:
        "Informe um número brasileiro com DDD, com ou sem +55 ou whatsapp:+55",
      maxExceeded: (max: number) => `; máximo de ${max} por vez`,
      addPhone: "Adicionar número",
      removePhone: "Remover número",
      submit: "Encerrar Conversations",
      confirmTitle: "Encerrar conversations?",
      confirmDescription: (n: number, environment: string) =>
        `No ambiente ${environment}, serão encerradas somente as Conversations ativas da prévia, vinculadas aos ${n} número(s) abaixo. Recursos que mudaram de estado serão ignorados. Esta ação não pode ser desfeita.`,
      confirmTargets: "Números que serão consultados",
      confirmAction: "Encerrar Conversations revisadas",
      summary: {
        prefix: "Concluído:",
        closed: (n: number) => `${n} conversation(s) encerrada(s)`,
        errors: (n: number) => `${n} erro(s)`,
      },
      history: {
        item: (total: number, closed: number) =>
          `${total} número(s) · ${closed} encerrada(s)`,
        itemErrors: (n: number) => ` — ${n} erro(s)`,
      },
    },
    fetchByParticipant: {
      loadingPage: "Carregando Conversations por Número…",
      loadingResults: "Buscando Conversations vinculadas ao número…",
      progress: (pages: number, count: number) =>
        `Buscando todas as conversas… ${pages} página(s) consultada(s), ${count} conversa(s) encontrada(s). As ativas aparecem primeiro.`,
      cancelled:
        "Busca cancelada. Os resultados exibidos são parciais e podem não incluir todas as conversas ativas.",
      searchFailed:
        "Não foi possível concluir a busca. Os resultados exibidos são parciais. Faça uma nova busca para tentar novamente.",
      invalidPhone: "Informe o DDD e o número com 10 ou 11 dígitos, sem +55.",
      breadcrumb: "Conversations por Número",
      title: "Conversations por número",
      subtitle: "Localize Conversations vinculadas a um número do WhatsApp.",
      metadata: {
        title: "Conversations por Número",
        description:
          "Localize Conversations associadas a um número de WhatsApp e consulte seus detalhes ou mensagens.",
      },
      phoneLabel: "Número de telefone",
      phoneLabelHint: "(DDD + número, apenas dígitos, sem +55)",
      filterLabel: "Filtrar por estado",
      stateOptions: {
        all: "Todos",
        active: "Ativas",
        inactive: "Inativas",
        closed: "Fechadas",
      },
      results: {
        none: "Nenhuma conversa encontrada para esse número.",
        noneFiltered: (state: string) =>
          `Nenhuma conversa com estado "${state}" encontrada.`,
        count: (n: number) => `${n} conversa(s) encontrada(s)`,
        totalSuffix: (n: number) => ` · ${n} total`,
        dateCreated: "Criada:",
        dateUpdated: "Atualizada:",
        identity: "Identidade:",
        loadMore: "Exibir mais",
        consultConversation: "Consultar Conversation",
      },
      history: {
        item: (n: number) => `${n} conversa(s)`,
      },
    },
  },
  taskrouter: {
    workspace: {
      remembered: "Workspace reutilizado nas ferramentas deste ambiente.",
      list: "Selecionar por nome",
      refresh: "Atualizar Workspaces",
      selected: (name: string) => `${name} · Reutilizado neste ambiente`,
      loading: "Buscando Workspaces…",
      choose: "Workspaces da conta",
      placeholder: "Selecione um Workspace",
      option: (name: string, sid: string) => `${name || sid} · ${sid}`,
      empty: "Nenhum Workspace encontrado nesta conta.",
      more: "Carregar mais Workspaces",
      loadError:
        "Não foi possível listar os Workspaces. Confira o ambiente e as permissões ou informe o SID.",
    },
    workerManagement: {
      title: "Gerenciar Workers",
      subtitle: "Consulte Workers e gerencie suas skills e plugins do Flex.",
      loading: "Carregando gerenciamento de Workers…",
      workspaceLabel: "Workspace SID",
      workspacePlaceholder: "WSxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      modeLabel: "Modo de gerenciamento de Workers",
      modes: { individual: "Worker individual", batch: "Alteração em lote" },
      individualHint:
        "Consulte um agente para ver o estado atual e alterar suas skills ou configurações do Flex.",
      batchHint:
        "As alterações serão aplicadas a todos os Workers informados. Este modo não consulta detalhes individuais.",
      workersHint:
        "Use o SID de cada Worker ou um e-mail igual ao friendlyName. A lista é compartilhada entre skills e plugins; o atributo email não é consultado.",
      refreshing: "Consultando o estado atual do Worker…",
      selectFirst:
        "Consulte um Worker na aba Detalhes antes de alterar suas configurações.",
      consultWorker: "Consultar Worker",
      selectedTarget: (name: string, sid: string) => `Worker: ${name} (${sid})`,
      current: {
        skills: "Skills atuais do Worker",
        features: "Configurações atuais do Flex",
      },
      noSkills: "Nenhuma skill configurada.",
      noLevel: "Nível não definido",
      noFeatures:
        "Nenhuma sobrescrita de configuração encontrada neste Worker.",
      undefinedFeature: "Estado não definido",
      featureOverridesHint:
        "Estes valores são sobrescritas do Worker. A ausência de um valor não significa que o recurso está desabilitado no Flex.",
      invalidConfiguration:
        "Não foi possível interpretar a configuração atual. Consulte os atributos completos antes de alterar.",
      operationRunning:
        "Há uma alteração de Workers em andamento. Aguarde a conclusão ou cancele antes de iniciar outra alteração ou mudar os alvos.",
      viewOperation: "Ver operação",
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
      title: "Configurar plugins do Flex",
      subtitle:
        "Habilite ou desabilite um plugin do Flex para um ou vários Workers.",
      workspaceLabel: "Workspace SID",
      workspacePlaceholder: "WSxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      workersLabel: "Workers",
      workerLabel: (position: number) => `Worker ${position}`,
      addWorker: "Adicionar Worker",
      removeWorker: (position: number) => `Remover Worker ${position}`,
      workersPlaceholder:
        "WKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx ou agente@exemplo.com",
      workersHint:
        "Use o SID do agente ou um e-mail que seja exatamente o nome amigável (friendlyName) dele. A busca não consulta o atributo email. Para nomes repetidos, use o SID.",
      featureLabel: "Nome do plugin",
      featurePlaceholder: "dasa_cdc_integration",
      featureHint:
        "Comece com uma letra e use apenas letras, números, hífen ou sublinhado (até 100 caracteres).",
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
          "Consulte Tasks e Workers e gerencie skills e plugins do TaskRouter.",
      },
      intro: {
        badge: "TaskRouter API",
        features: {
          routing: "Roteamento de tasks",
          workers: "Workers e filas",
        },
        toolsHeading: "Ferramentas disponíveis",
      },
    },
    assignWorkers: {
      log: {
        invalidWorkers: (maxItems: number) =>
          `Informe entre 1 e ${maxItems} Workers válidos`,
        start: (count: number) =>
          `Iniciando processamento de ${count} worker(s)...`,
        done: (
          totalUpdated: number,
          totalSkipped: number,
          totalErrors: number
        ) =>
          `Concluído. ${totalUpdated} worker(s) atualizado(s), ${totalSkipped} ignorado(s), ${totalErrors} erro(s).`,
        searching: (identifier: string) => `Buscando worker: ${identifier}...`,
        searchLabel: (identifier: string) => `Busca de worker (${identifier})`,
        notFound: (identifier: string) =>
          `Worker não encontrado: ${identifier}`,
        addingSkill: (workerSid: string, skill: string) =>
          `Worker encontrado: ${workerSid}. Adicionando skill "${skill}"...`,
        updateLabel: (workerSid: string) => `Atualizar worker ${workerSid}`,
        updated: (skill: string, identifier: string, workerSid: string) =>
          `Skill "${skill}" adicionada ao worker ${identifier} (${workerSid})`,
      },
      breadcrumb: "Adicionar Skill a Workers",
      title: "Adicionar skill a Workers",
      subtitle:
        "Adicione uma skill a vários agentes (Workers) por SID ou nome amigável.",
      workspaceSidLabel: "Workspace SID",
      skillLabel: "Nome da skill",
      levelLabel: "Nível",
      levelOptional: "(opcional)",
      workersLabel: "Workers",
      workerLabel: (position: number) => `Worker ${position}`,
      workerPlaceholder: "WKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx ou nome amigável",
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
        item: (n: number) => `${n} atualizado(s)`,
        itemSkipped: (n: number) => ` — ${n} ignorado(s)`,
        itemErrors: (n: number) => ` — ${n} erro(s)`,
      },
    },
    fetchWorker: {
      breadcrumb: "Detalhes do Worker",
      title: "Detalhes do Worker",
      subtitle:
        "Consulte atividade, skills e atributos de um agente (Worker) por SID ou nome amigável.",
      workspaceSidLabel: "Workspace SID",
      identifierLabel: "Worker SID ou nome amigável",
      identifierHint:
        "Use o SID (WK + 32 caracteres hexadecimais) ou o nome amigável exato (friendlyName). E-mail só funciona quando é o nome amigável do Worker. Se houver nomes repetidos, use o SID para escolher o agente correto.",
      result: {
        skills: "Skills",
        level: (n: number) => `nível ${n}`,
        dateCreated: "Criado em",
        dateUpdated: "Atualizado em",
        dateStatusChanged: "Atividade alterada em",
        fullAttributes: "Atributos completos",
      },
    },
    searchTasks: {
      openConversation: "Consultar Conversation vinculada",
      relatedResources: "Continuar investigação",
      log: {
        workspaceNotFound: (workspaceSid: string) =>
          `Workspace não encontrado: ${workspaceSid}`,
        taskNotFound: (taskSid: string) => `Task não encontrada: ${taskSid}`,
      },
      duration: {
        seconds: (seconds: number) => `${seconds}s`,
        minutes: (minutes: number, seconds: number) =>
          `${minutes}m ${seconds}s`,
        hours: (hours: number, minutes: number) => `${hours}h ${minutes}m`,
      },
      breadcrumb: "Consultar Task",
      title: "Consultar Task",
      subtitle:
        "Consulte detalhes de uma Task por SID ou por número de telefone.",
      metadata: {
        title: "Consultar Task",
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
      result: {
        limitWarning:
          "A consulta foi limitada às primeiras 1.000 Tasks encontradas. Existem mais resultados; esta lista não representa o total.",
        count: (n: number) => `${n} task(s) encontrada(s)`,
        none: "Nenhuma task encontrada para esse número.",
        workflow: "Workflow",
        queue: "Fila",
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
        itemPhone: (n: number) => `${n} task(s)`,
      },
    },
  },
  contacts: {
    input: {
      saveContact: (value: string) => `Salvar “${value}” como contato`,
      removeContact: "Excluir contato",
      namePlaceholder: "João Silva",
    },
    manager: {
      deleteAriaLabel: "Excluir contato",
      breadcrumb: "Contatos Salvos",
      title: "Contatos salvos",
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
      namePlaceholder: "João Silva",
      phoneLabel: "Número (DDD + número)",
      phonePlaceholder: "11999999999",
      saveButton: "Salvar",
    },
  },
  variables: {
    groups: {
      workspaceSids: "Workspace SIDs",
      skillNames: "Skills",
      workerIdentifiers: "Workers",
      conversationSids: "Conversation SIDs",
      closeMessages: "Mensagens de encerramento",
    },
    manager: {
      editAriaLabel: "Editar valor salvo",
      deleteAriaLabel: "Excluir valor salvo",
      breadcrumb: "Valores de Autocomplete",
      title: "Valores de autocomplete",
      subtitle: "Gerencie valores reutilizáveis por campo e ambiente.",
      metadata: {
        title: "Valores de Autocomplete",
        description:
          "Gerencie valores salvos por campo e ambiente para reutilização nos formulários.",
      },
      addButton: "Adicionar",
      valueLabel: "Valor",
      valuePlaceholder: "Digite um valor",
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
      emptyHint:
        "Cadastre a conta Twilio que deseja consultar. Um ambiente reúne um nome, o Account SID e o Auth Token fornecidos pela sua equipe técnica.",
      setupSteps: [
        "Peça à equipe técnica as credenciais da conta Twilio e confirme se ela é de homologação ou produção.",
        "Crie um ambiente com um nome que identifique claramente a conta.",
        "Teste a conexão, salve e selecione o ambiente. Confira o destino antes de consultar ou alterar dados.",
      ],
      localCredentials:
        "As credenciais ficam salvas em texto simples neste navegador. Use um perfil confiável e não compartilhe o Auth Token.",
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
      namePlaceholder: "Homologação",
      nameRequired: "Nome obrigatório",
      accountSidLabel: "Account SID",
      accountSidHint:
        "Identifica a conta Twilio. Use o Account SID fornecido pela equipe técnica: AC seguido de 32 caracteres hexadecimais.",
      accountSidRequired: "Account SID obrigatório",
      accountSidInvalid: "Deve começar com AC e ter 34 caracteres",
      authTokenLabel: "Auth Token",
      authTokenPlaceholder: "32 caracteres",
      authTokenHint:
        "Credencial secreta da conta, com 32 caracteres. Solicite à equipe técnica e não compartilhe em mensagens ou capturas de tela.",
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
        "Confira as configurações de mensageria dos números de WhatsApp.",
      metadata: {
        title: "Números WhatsApp da Conta",
        description:
          "Liste os números WhatsApp da conta e confira configurações e classificações estimadas de mensageria.",
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
        "Liste os remetentes de WhatsApp (Senders) e confira as configurações de mensageria encontradas.",
      classificationHint:
        "Conversations indica uma configuração de endereço encontrada. Programmable Chat é uma classificação estimada para os demais números e não comprova a origem do serviço.",
      metadata: {
        title: "Classificar WhatsApp Senders",
        description:
          "Liste, filtre e exporte WhatsApp Senders com configurações de Conversations ou classificação estimada de Programmable Chat.",
      },
      submit: "Listar Senders",
      partialWarning:
        "Uma das fontes da Twilio não respondeu. Os resultados exibidos são parciais.",
      truncatedWarning:
        "A conta possui mais resultados do que o limite carregado. A lista está incompleta.",
      table: {
        colSid: "SID",
        sheetName: "Senders",
        colMark: "Marca / Identificação",
        colNumber: "Número",
        colService: "Serviço",
        filterAll: "Todos",
        filterConversations: "Conversations",
        filterPchat: "Programmable Chat (estimado)",
        searchPlaceholder: "Busque por nome ou número",
        searchLabel: "Buscar Senders por nome ou número",
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
