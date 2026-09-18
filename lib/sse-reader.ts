// JSON parsing and reader cleanup stay with each consumer's error/lifecycle policy.
export async function consumeSseStream(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  onDataLine: (line: string) => void
): Promise<void> {
  const decoder = new TextDecoder()
  let buffer = ""

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const events = buffer.split("\n\n")
    buffer = events.pop() ?? ""

    for (const event of events) {
      const line = event.split("\n").find((entry) => entry.startsWith("data:"))
      if (line) onDataLine(line)
    }
  }
}
