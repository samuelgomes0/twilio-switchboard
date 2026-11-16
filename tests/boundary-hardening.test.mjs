import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"
import { createLoader } from "./typescript-loader.mjs"

const credentials = {
  accountSid: `AC${"1".repeat(32)}`,
  authToken: "2".repeat(32),
}

test("Excel export uses the writer-only browser dependency", () => {
  const manifest = JSON.parse(readFileSync("package.json", "utf8"))
  const source = readFileSync(
    "features/numbers/components/list-numbers-form.tsx",
    "utf8"
  )
  assert.equal(manifest.dependencies.xlsx, undefined)
  assert.equal(manifest.dependencies["write-excel-file"], "^4.1.1")
  assert.match(source, /import\(\s*"write-excel-file\/browser"\s*\)/)
})

test("request validation accepts only objects with a complete credential pair", async () => {
  const { isRecord, parseTwilioCredentials, readJsonObject, isTwilioSid } =
    createLoader()("lib/request-validation.ts")
  assert.equal(isRecord({}), true)
  assert.equal(isRecord(null), false)
  assert.equal(isRecord([]), false)
  assert.deepEqual(parseTwilioCredentials(credentials), credentials)
  for (const value of [{}, { accountSid: credentials.accountSid }, { ...credentials, authToken: "bad" }]) {
    assert.equal(parseTwilioCredentials(value), null)
  }
  assert.equal(isTwilioSid(`WS${"a".repeat(32)}`, "WS"), true)
  assert.equal(isTwilioSid("WS-invalid", "WS"), false)
  assert.deepEqual(
    await readJsonObject(new Request("http://localhost", { method: "POST", body: "{}" })),
    {}
  )
  assert.equal(
    await readJsonObject(new Request("http://localhost", { method: "POST", body: "[]" })),
    null
  )
})

test("TaskRouter rejects unsafe literals and normalizes only valid E.164 phones", () => {
  const { isSafeTaskRouterLiteral } = createLoader()(
    "features/taskrouter/lib/taskrouter-expression.ts"
  )
  const { normalizeTaskPhone } = createLoader()(
    "features/taskrouter/lib/search-tasks.ts"
  )
  assert.equal(isSafeTaskRouterLiteral("Regra segura"), true)
  for (const value of ["x' OR 1==1", 'x" OR 1==1', "x\\y", "x\n"])
    assert.equal(isSafeTaskRouterLiteral(value), false)
  assert.equal(normalizeTaskPhone("whatsapp:+55 (11) 99999-9999"), "+5511999999999")
  assert.equal(normalizeTaskPhone("+55' OR 1==1"), null)
})

test("spreadsheet exports neutralize formulas and quote CSV cells", () => {
  const { escapeCsvCell, sanitizeSpreadsheetCell } = createLoader()(
    "lib/spreadsheet.ts"
  )
  assert.equal(sanitizeSpreadsheetCell("=HYPERLINK(1)"), "'=HYPERLINK(1)")
  assert.equal(sanitizeSpreadsheetCell("+5511999999999"), "'+5511999999999")
  assert.equal(escapeCsvCell('Marca "A"'), '"Marca ""A"""')
})

test("wire dates are serialized as ISO strings", () => {
  const { toIsoString } = createLoader()("lib/to-iso-string.ts")
  assert.equal(
    toIsoString(new Date("2026-10-07T12:00:00Z")),
    "2026-10-07T12:00:00.000Z"
  )
  assert.equal(toIsoString("invalid"), null)
  assert.equal(toIsoString(null), null)
})

test("number listing reports partial and truncated results and fails when both sources fail", async () => {
  const { listNumbers } = createLoader()("features/numbers/lib/list-numbers.ts")
  const values = Array.from({ length: 1001 }, (_, index) => ({
    sid: `IG${String(index).padStart(32, "0")}`,
    address: `whatsapp:+5511${String(index).padStart(8, "0")}`,
    friendlyName: null,
  }))
  const client = {
    conversations: { v1: { addressConfigurations: { list: async () => values } } },
    messaging: { v2: { channelsSenders: { list: async () => { throw new Error("unavailable") } } } },
  }
  const result = await listNumbers(client)
  assert.equal(result.numbers.length, 1000)
  assert.equal(result.partial, true)
  assert.equal(result.hasMore, true)

  const failedClient = {
    conversations: { v1: { addressConfigurations: { list: async () => { throw new Error() } } } },
    messaging: { v2: { channelsSenders: { list: async () => { throw new Error() } } } },
  }
  await assert.rejects(listNumbers(failedClient))
})

test("Flex input validation enforces conditional integration fields", () => {
  const {
    isValidStudioFlowSid,
    isValidWebhookUrl,
    validateCreateAddressConfig,
  } = createLoader()(
    "features/flex/lib/validate-create-address-config.ts"
  )
  assert.deepEqual(validateCreateAddressConfig({ address: "+5511999999999", type: "whatsapp" }), {
    address: "+5511999999999",
    type: "whatsapp",
  })
  assert.equal(validateCreateAddressConfig({ address: "x", type: "invalid" }), null)
  assert.equal(
    validateCreateAddressConfig({ address: "x", type: "whatsapp", autoCreationWebhookFilters: [1] }),
    null
  )
  assert.equal(
    validateCreateAddressConfig({
      address: "x",
      type: "whatsapp",
      autoCreationEnabled: true,
      autoCreationType: "studio",
    }),
    null
  )
  assert.equal(
    validateCreateAddressConfig({
      address: "x",
      type: "whatsapp",
      autoCreationEnabled: true,
      autoCreationType: "webhook",
      autoCreationWebhookUrl: "javascript:alert(1)",
    }),
    null
  )
  const flowSid = `FW${"a".repeat(32)}`
  assert.equal(isValidStudioFlowSid(` ${flowSid} `), true)
  assert.equal(isValidStudioFlowSid("FW-invalid"), false)
  assert.equal(isValidWebhookUrl("https://example.com/hook"), true)
  assert.equal(isValidWebhookUrl("javascript:alert(1)"), false)
  assert.deepEqual(
    validateCreateAddressConfig({
      address: "x",
      type: "whatsapp",
      autoCreationEnabled: true,
      autoCreationType: "studio",
      autoCreationStudioFlowSid: ` ${flowSid} `,
    }),
    {
      address: "x",
      type: "whatsapp",
      autoCreationEnabled: true,
      autoCreationType: "studio",
      autoCreationStudioFlowSid: flowSid,
    }
  )
})

test("Flex route rejects incomplete integrations before creating a client", async () => {
  let clients = 0
  const { POST } = createLoader({
    "@/lib/twilio-client": {
      getTwilioClient: () => {
        clients++
        return {}
      },
    },
  })("app/api/flex/create-conversation-address/route.ts")
  for (const integration of [
    { autoCreationEnabled: true, autoCreationType: "studio" },
    {
      autoCreationEnabled: true,
      autoCreationType: "studio",
      autoCreationStudioFlowSid: "FW-invalid",
    },
    { autoCreationEnabled: true, autoCreationType: "webhook" },
    {
      autoCreationEnabled: true,
      autoCreationType: "webhook",
      autoCreationWebhookUrl: "file:///secret",
    },
  ]) {
    const response = await POST(
      new Request("http://localhost/api", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: "+5511999999999",
          type: "whatsapp",
          ...integration,
          ...credentials,
        }),
      })
    )
    assert.equal(response.status, 400)
  }
  assert.equal(clients, 0)
})
