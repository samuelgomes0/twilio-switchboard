import { getTwilioClient } from "@/lib/twilio-client"
import type {
  AddressConfigData,
  CreateAddressConfigRequest,
} from "@/features/flex/types"

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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const config = await (client.conversations.v1.addressConfigurations as any).create(createParams)

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
    dateCreated: config.dateCreated
      ? new Date(config.dateCreated).toISOString()
      : null,
    dateUpdated: config.dateUpdated
      ? new Date(config.dateUpdated).toISOString()
      : null,
    url: config.url,
  }
}
