import { CollectionResponses, TypedPocketBase } from "@/pocketbase-types"
import { useMemo } from "react"
import { usePocketBase as usePocketBaseRaw } from "use-pocketbase"

export function usePocketBase() {
	return usePocketBaseRaw() as TypedPocketBase
}

export function usePbCollection(collection: keyof CollectionResponses) {
	const pb = usePocketBase()
	return useMemo(() => pb.collection(collection), [pb, collection])
}
