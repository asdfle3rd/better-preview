import { useCallback } from '@wordpress/element';
import apiFetch, { APIFetchOptions } from '@wordpress/api-fetch';
import { useQueryClient } from '@tanstack/react-query';
import { useAsyncStores } from 'hooks/useAsyncStores';
import { TPostData } from 'types';

const apiFetchTemplatePostID = (location: string): APIFetchOptions<true> => {
	return {
		namespace: '/gutenbrick/v1',
		path: '/better-preview-plugin/v1/revisions/url-to-id',
		method: 'POST',
		data: { url: location },
	};
};

const apiFetchTemplateRevisionsHTML = (id: number): APIFetchOptions<true> => {
	return {
		namespace: '/gutenbrick/v1',
		method: 'GET',
		path: '/better-preview-plugin/v1/revisions/id-to-html/' + id,
	};
};

const getErrorPage = (msg: string, backlink?: string) =>
	`<html><body><div style="position: absolute; margin: auto;">Error fetching content<br/>${msg}</div>${backlink?.length ? `<a href="${backlink}" ></a>` : ''}</body></html>`;

export const useCustomApi = () => {
	const { asyncCoreDataStore } = useAsyncStores();
	const queryClient = useQueryClient();

	const getPostByUrl = useCallback(
		(url: string): Promise<TPostData> =>
			queryClient
				.fetchQuery({
					queryKey: ['post-by-url', url],
					queryFn: () => apiFetch(apiFetchTemplatePostID(url)),
					staleTime: 30000,
				})
				.catch(() => ({
					id: undefined,
					type: undefined,
				})) as Promise<TPostData>,
		[queryClient]
	);

	const getIframeContent = useCallback(
		(id: number): Promise<[string, undefined] | [undefined, string]> =>
			queryClient
				.fetchQuery({
					queryKey: ['iframe-content', id],
					queryFn: () => apiFetch(apiFetchTemplateRevisionsHTML(id)),
					staleTime: Infinity,
				})
				.then((html) => {
					return [html as string, undefined];
				})
				.catch((e: Error) => [
					undefined,
					getErrorPage(e.message),
				]) as Promise<[undefined, string]>,
		[queryClient]
	);

	const getEntityList = useCallback(
		(id: number, type: string) => {
			const query = {
				status: ['private', 'draft', 'pending', 'future', 'publish'],
			};

			return queryClient
				.fetchQuery({
					queryKey: ['entity-list', id, type],
					queryFn: () => {
						const mainPostPromise =
							asyncCoreDataStore.getEntityRecord(
								'postType',
								type,
								id
							);
						const relatedPostsPromise =
							asyncCoreDataStore.getRevisions(
								'postType',
								type,
								id,
								query
							);
						return Promise.all([
							mainPostPromise,
							relatedPostsPromise,
						]);
					},
					staleTime: 10000,
				})
				.then((res) => {
					return [
						(res.flat() as TPostData[]).map((e) => {
							e.status = e.status ?? 'trash';
							return e;
						}),
						undefined,
					];
				})
				.catch((e) => [undefined, e.message]) as Promise<
				[TPostData[], undefined] | [undefined, string]
			>;
		},
		[asyncCoreDataStore, queryClient]
	);

	return {
		apiFetchTemplatePostID,
		apiFetchTemplateRevisionsHTML,
		getErrorPage,
		getPostByUrl,
		getIframeContent,
		getEntityList,
	};
};
