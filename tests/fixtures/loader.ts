import { AppError } from "@/lib/errors"
import { AppError as RepeatedError } from "@/lib/errors"
import { basename } from "node:path"

export { AppError, RepeatedError }
export const error: Error = new AppError("validation", "fixture")
export const filename: string = basename("directory/fixture.ts")
