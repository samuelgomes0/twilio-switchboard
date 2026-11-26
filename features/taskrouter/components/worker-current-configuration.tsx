import type { WorkerData } from "@/features/taskrouter/types"
import { readWorkerConfiguration } from "@/features/taskrouter/lib/worker-configuration"
import { strings } from "@/lib/strings"

export function WorkerCurrentConfiguration({
  worker,
  section,
}: {
  worker: WorkerData
  section: "skills" | "features"
}) {
  const labels = strings.taskrouter.workerManagement
  const configuration = readWorkerConfiguration(worker.attributes)
  return (
    <section
      className="mb-5 rounded-lg border border-border px-4 py-3"
      aria-label={labels.current[section]}
    >
      <h2 className="mb-2 text-sm font-medium">{labels.current[section]}</h2>
      {!configuration ? (
        <p className="text-sm text-muted-foreground">
          {labels.invalidConfiguration}
        </p>
      ) : section === "skills" ? (
        configuration.skills.length ? (
          <ul className="space-y-1 text-sm">
            {configuration.skills.map((skill) => (
              <li
                key={skill.name}
                className="flex flex-wrap justify-between gap-2"
              >
                <span>{skill.name}</span>
                <span className="text-muted-foreground">
                  {skill.level === null
                    ? labels.noLevel
                    : strings.taskrouter.fetchWorker.result.level(skill.level)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">{labels.noSkills}</p>
        )
      ) : (
        <>
          <p className="mb-2 text-xs text-muted-foreground">
            {labels.featureOverridesHint}
          </p>
          {configuration.features.length ? (
            <ul className="space-y-1 text-sm">
              {configuration.features.map((feature) => (
                <li
                  key={feature.name}
                  className="flex flex-wrap justify-between gap-2"
                >
                  <span className="break-all">{feature.name}</span>
                  <span className="text-muted-foreground">
                    {feature.enabled === null
                      ? labels.undefinedFeature
                      : feature.enabled
                        ? strings.taskrouter.updateWorkerFeature.enabled
                        : strings.taskrouter.updateWorkerFeature.disabled}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">{labels.noFeatures}</p>
          )}
        </>
      )}
    </section>
  )
}
