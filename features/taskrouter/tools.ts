import { ClipboardList, GitBranch, ListX, User, UserPlus } from "lucide-react"
import { ElementType } from "react"

interface Tool {
  label: string
  description: string
  href: string
  icon: ElementType
  available: boolean
}

export const taskrouterTools: Tool[] = [
  {
    label: "Atribuir Workers à Fila",
    description:
      "Adiciona uma skill com nível opcional aos attributes de workers identificados por e-mail.",
    href: "/taskrouter/assign-workers",
    icon: UserPlus,
    available: true,
  },
  {
    label: "Criar Workflow",
    description:
      "Lê um CSV com regras de negócio e filas Twilio para gerar filtros e criar o workflow no TaskRouter.",
    href: "/taskrouter/create-workflow",
    icon: GitBranch,
    available: true,
  },
  {
    label: "Buscar Task",
    description:
      "Retorna status, fila, prioridade, atributos e datas de uma task pelo SID.",
    href: "/taskrouter/fetch-task",
    icon: ClipboardList,
    available: true,
  },
  {
    label: "Buscar Worker",
    description:
      "Retorna atividade, skills, atributos e datas de um worker pelo SID ou e-mail.",
    href: "/taskrouter/fetch-worker",
    icon: User,
    available: true,
  },
  {
    label: "Encerrar Tasks da Fila",
    description:
      "Encerra todas as tasks pendentes/reservadas de uma fila e fecha as conversas associadas com mensagem de aviso.",
    href: "/taskrouter/cancel-queue-tasks",
    icon: ListX,
    available: true,
  },
]
