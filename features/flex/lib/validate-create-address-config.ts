import type {
  AddressConfigType,
  AutoCreationType,
  CreateAddressConfigRequest,
} from "@/features/flex/types"
import { isRecord } from "@/lib/request-validation"

const ADDRESS_TYPES: AddressConfigType[] = [
  "sms",
  "whatsapp",
  "messenger",
  "gbm",
  "email",
  "rcs",
  "apple",
  "chat",
]
const AUTO_CREATION_TYPES: AutoCreationType[] = ["webhook", "studio", "default"]

function optionalString(value: unknown): value is string | undefined {
  return value === undefined || typeof value === "string"
}

export function validateCreateAddressConfig(
  value: unknown
): CreateAddressConfigRequest | null {
  if (!isRecord(value)) return null
  const {
    address,
    type,
    friendlyName,
    autoCreationEnabled,
    autoCreationType,
    autoCreationConversationServiceSid,
    autoCreationWebhookUrl,
    autoCreationWebhookMethod,
    autoCreationWebhookFilters,
    autoCreationStudioFlowSid,
    autoCreationStudioRetryCount,
    addressCountry,
  } = value
  if (
    typeof address !== "string" ||
    !address.trim() ||
    address.length > 255 ||
    typeof type !== "string" ||
    !ADDRESS_TYPES.includes(type as AddressConfigType) ||
    !optionalString(friendlyName) ||
    (autoCreationEnabled !== undefined && typeof autoCreationEnabled !== "boolean") ||
    (autoCreationType !== undefined &&
      (typeof autoCreationType !== "string" ||
        !AUTO_CREATION_TYPES.includes(autoCreationType as AutoCreationType))) ||
    !optionalString(autoCreationConversationServiceSid) ||
    !optionalString(autoCreationWebhookUrl) ||
    (autoCreationWebhookMethod !== undefined &&
      autoCreationWebhookMethod !== "GET" &&
      autoCreationWebhookMethod !== "POST") ||
    (autoCreationWebhookFilters !== undefined &&
      (!Array.isArray(autoCreationWebhookFilters) ||
        !autoCreationWebhookFilters.every((item) => typeof item === "string"))) ||
    !optionalString(autoCreationStudioFlowSid) ||
    (autoCreationStudioRetryCount !== undefined &&
      (!Number.isInteger(autoCreationStudioRetryCount) ||
        (autoCreationStudioRetryCount as number) < 0)) ||
    !optionalString(addressCountry)
  ) {
    return null
  }
  return {
    address: address.trim(),
    type: type as AddressConfigType,
    ...(typeof friendlyName === "string" && { friendlyName: friendlyName.trim() }),
    ...(typeof autoCreationEnabled === "boolean" && { autoCreationEnabled }),
    ...(typeof autoCreationType === "string" && { autoCreationType: autoCreationType as AutoCreationType }),
    ...(typeof autoCreationConversationServiceSid === "string" && { autoCreationConversationServiceSid }),
    ...(typeof autoCreationWebhookUrl === "string" && { autoCreationWebhookUrl }),
    ...(autoCreationWebhookMethod !== undefined && { autoCreationWebhookMethod }),
    ...(Array.isArray(autoCreationWebhookFilters) && { autoCreationWebhookFilters }),
    ...(typeof autoCreationStudioFlowSid === "string" && { autoCreationStudioFlowSid }),
    ...(typeof autoCreationStudioRetryCount === "number" && { autoCreationStudioRetryCount }),
    ...(typeof addressCountry === "string" && { addressCountry }),
  }
}
