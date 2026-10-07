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

export function isValidStudioFlowSid(value: string): boolean {
  return /^FW[0-9a-f]{32}$/i.test(value.trim())
}

export function isValidWebhookUrl(value: string): boolean {
  try {
    const url = new URL(value.trim())
    return url.protocol === "https:" || url.protocol === "http:"
  } catch {
    return false
  }
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
    (typeof friendlyName === "string" && friendlyName.length > 256) ||
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
  if (
    (autoCreationEnabled === true && autoCreationType === undefined) ||
    (typeof autoCreationConversationServiceSid === "string" &&
      !/^IS[0-9a-f]{32}$/i.test(autoCreationConversationServiceSid.trim())) ||
    (typeof autoCreationStudioFlowSid === "string" &&
      !isValidStudioFlowSid(autoCreationStudioFlowSid)) ||
    (typeof autoCreationWebhookUrl === "string" &&
      !isValidWebhookUrl(autoCreationWebhookUrl)) ||
    (autoCreationType === "studio" &&
      (typeof autoCreationStudioFlowSid !== "string" ||
        !isValidStudioFlowSid(autoCreationStudioFlowSid))) ||
    (autoCreationType === "webhook" &&
      (typeof autoCreationWebhookUrl !== "string" ||
        !isValidWebhookUrl(autoCreationWebhookUrl)))
  ) {
    return null
  }
  return {
    address: address.trim(),
    type: type as AddressConfigType,
    ...(typeof friendlyName === "string" && { friendlyName: friendlyName.trim() }),
    ...(typeof autoCreationEnabled === "boolean" && { autoCreationEnabled }),
    ...(typeof autoCreationType === "string" && { autoCreationType: autoCreationType as AutoCreationType }),
    ...(typeof autoCreationConversationServiceSid === "string" && { autoCreationConversationServiceSid: autoCreationConversationServiceSid.trim() }),
    ...(typeof autoCreationWebhookUrl === "string" && { autoCreationWebhookUrl: autoCreationWebhookUrl.trim() }),
    ...(autoCreationWebhookMethod !== undefined && { autoCreationWebhookMethod }),
    ...(Array.isArray(autoCreationWebhookFilters) && { autoCreationWebhookFilters }),
    ...(typeof autoCreationStudioFlowSid === "string" && { autoCreationStudioFlowSid: autoCreationStudioFlowSid.trim() }),
    ...(typeof autoCreationStudioRetryCount === "number" && { autoCreationStudioRetryCount }),
    ...(typeof addressCountry === "string" && { addressCountry }),
  }
}
