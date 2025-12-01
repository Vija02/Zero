import type {
	ListResult,
	RecordFullListOptions,
	RecordListOptions,
	RecordOptions,
} from "pocketbase"
import { useQuery, UseQueryResult } from "@tanstack/react-query"
import { usePbCollection } from "./usePocketBase"
import { CollectionResponses } from "@/pocketbase-types"

/**
 * Use this hook to fetch a single record from a PocketBase collection.
 *
 * @param collectionId
 * @param id
 * @param options
 * @returns
 */
export function usePbOne<T extends keyof CollectionResponses>(
	collectionId: T,
	id: string,
	options: RecordOptions = {},
): UseQueryResult<CollectionResponses[T], Error> {
	const collection = usePbCollection(collectionId)

	return useQuery({
		queryKey: [collectionId, "one", id, options],
		queryFn: async () => await collection.getOne(id, options),
	}) as UseQueryResult<CollectionResponses[T], Error>
}

/**
 * Use this hook to fetch a list of records from a PocketBase collection.
 *
 * @param collectionId
 * @param props
 * @returns
 */
export function usePbList<T extends keyof CollectionResponses>(
	collectionId: T,
	props: {
		page?: number
		perPage?: number
	} & RecordListOptions = {},
): UseQueryResult<ListResult<CollectionResponses[T]>, Error> {
	const collection = usePbCollection(collectionId)

	return useQuery({
		queryKey: [collectionId, "list", props],
		queryFn: async () => {
			const { page, perPage, ...options } = props
			return await collection.getList(page, perPage, options)
		},
	}) as UseQueryResult<ListResult<CollectionResponses[T]>, Error>
}

/**
 * Use this hook to fetch the first record from a PocketBase collection based on a filter.
 *
 * @param collectionId
 * @param filter
 * @param options
 * @returns
 */
export function usePbFirst<T extends keyof CollectionResponses>(
	collectionId: T,
	filter: string,
	options: RecordListOptions = {},
) {
	const collection = usePbCollection(collectionId)

	return useQuery({
		queryKey: [collectionId, "first", filter, options],
		queryFn: async () => await collection.getFirstListItem(filter, options),
	}) as UseQueryResult<CollectionResponses[T], Error>
}

/**
 * Use this hook to fetch the full list of records from a PocketBase collection.
 *
 * @param collectionId
 * @param options
 * @returns
 */
export function usePbFullList<T extends keyof CollectionResponses>(
	collectionId: T,
	options: RecordFullListOptions = {},
): UseQueryResult<CollectionResponses[T][], Error> {
	const collection = usePbCollection(collectionId)

	return useQuery({
		queryKey: [collectionId, "fullList", options],
		queryFn: async () => await collection.getFullList(options),
	}) as UseQueryResult<CollectionResponses[T][], Error>
}
