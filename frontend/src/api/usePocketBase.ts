import { TypedPocketBase } from "@/pocketbase-types"
import { usePocketBase as usePocketBaseRaw } from "use-pocketbase"

export function usePocketBase() {
	return usePocketBaseRaw() as TypedPocketBase
}
