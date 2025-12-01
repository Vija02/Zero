import { CollectionResponses, TypedPocketBase } from "@/pocketbase-types"
import { RecordService } from "pocketbase"
import { useMemo } from "react"
import { usePocketBase as usePocketBaseRaw } from "use-pocketbase"

export function usePocketBase() {
	return usePocketBaseRaw() as TypedPocketBase
}

export function usePbCollection<T extends keyof CollectionResponses>(
	collection: T,
): RecordService<CollectionResponses[T]> {
	const pb = usePocketBase()
	return useMemo(() => pb.collection(collection), [pb, collection])
}
