import { getTwilioClient } from "@/lib/twilio-client"
import type {
  AddressConfigData,
  CreateAddressConfigRequest,
} from "@/features/flex/types"
import { toIsoString } from "@/lib/to-iso-string"

export async function createAddressConfig(
  params: CreateAddressConfigRequest,
  client: ReturnType<typeof getTwilioClient>
): Promise<AddressConfigData> {
  const createParams: Record<string, unknown> = {
    type: params.type,
    address: params.address,
  }

  if (params.friendlyName) createParams.friendlyName = params.friendlyName
  if (params.autoCreationEnabled !== undefined)
    createParams.autoCreationEnabled = params.autoCreationEnabled
  if (params.autoCreationType)
    createParams.autoCreationType = params.autoCreationType
  if (params.autoCreationConversationServiceSid)
    createParams.autoCreationConversationServiceSid =
      params.autoCreationConversationServiceSid
  if (params.autoCreationWebhookUrl)
    createParams.autoCreationWebhookUrl = params.autoCreationWebhookUrl
  if (params.autoCreationWebhookMethod)
    createParams.autoCreationWebhookMethod = params.autoCreationWebhookMethod
  if (params.autoCreationWebhookFilters?.length)
    createParams.autoCreationWebhookFilters = params.autoCreationWebhookFilters
  if (params.autoCreationStudioFlowSid)
    createParams.autoCreationStudioFlowSid = params.autoCreationStudioFlowSid
  if (
    params.autoCreationStudioRetryCount !== undefined &&
    params.autoCreationStudioRetryCount !== null
  )
    createParams.autoCreationStudioRetryCount =
      params.autoCreationStudioRetryCount
  if (params.addressCountry) createParams.addressCountry = params.addressCountry

  type AddressConfiguration = {
    sid: string
    accountSid: string
    address: string
    type: string
    friendlyName?: string | null
    addressCountry?: string | null
    autoCreation?: unknown
    dateCreated?: Date | string | null
    dateUpdated?: Date | string | null
    url: string
  }
  const addressConfigurations = client.conversations.v1
    .addressConfigurations as unknown as {
    create(params: Record<string, unknown>): Promise<AddressConfiguration>
  }
  const config = await addressConfigurations.create(createParams)

  return {
    sid: config.sid,
    accountSid: config.accountSid,
    address: config.address,
    type: config.type,
    friendlyName: config.friendlyName ?? null,
    addressCountry: config.addressCountry ?? null,
    autoCreation: (config.autoCreation as AddressConfigData["autoCreation"]) ?? {
      enabled: false,
    },
    dateCreated: toIsoString(config.dateCreated),
    dateUpdated: toIsoString(config.dateUpdated),
    url: config.url,
  }
}
