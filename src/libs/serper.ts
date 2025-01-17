
// Based on https://gist.github.com/transitive-bullshit/9ef36acf6dfa4d5b1e1990181a5c3846

import axios, { Axios, AxiosResponse } from 'axios';
import { z } from 'zod';

export const BASE_URL = 'https://google.serper.dev';

export const SearchParamsSchema = z.object({
    q: z.string().describe('search query'),
    autocorrect: z.boolean().default(true).optional(),
    gl: z.string().default('us').optional(),
    hl: z.string().default('en').optional(),
    page: z.number().int().positive().default(1).optional(),
    num: z.number().int().positive().default(10).optional(),
});
export type SearchParams = z.infer<typeof SearchParamsSchema>;

export interface SearchResponse {
    searchParameters: SearchParameters & { type: 'search' };
    organic: Organic[];
    answerBox?: AnswerBox;
    knowledgeGraph?: KnowledgeGraph;
    topStories?: TopStory[];
    peopleAlsoAsk?: PeopleAlsoAsk[];
    relatedSearches?: RelatedSearch[];
}

export interface SearchImagesResponse {
    searchParameters: SearchParameters & { type: 'images' };
    images: Image[];
}

export interface SearchVideosResponse {
    searchParameters: SearchParameters & { type: 'videos' };
    videos: Video[];
}

export interface SearchPlacesResponse {
    searchParameters: SearchParameters & { type: 'places' };
    places: Place[];
}

export interface SearchNewsResponse {
    searchParameters: SearchParameters & { type: 'news' };
    news: News[];
}

export interface SearchShoppingResponse {
    searchParameters: SearchParameters & { type: 'shopping' };
    shopping: Shopping[];
}

export type Response =
    | SearchResponse
    | SearchImagesResponse
    | SearchVideosResponse
    | SearchPlacesResponse
    | SearchNewsResponse
    | SearchShoppingResponse;

export interface KnowledgeGraph {
    title: string;
    type: string;
    website: string;
    imageUrl: string;
    description: string;
    descriptionSource: string;
    descriptionLink: string;
    attributes: Record<string, string>;
}

export interface Organic {
    title: string;
    link: string;
    snippet: string;
    position: number;
    imageUrl?: string;
    sitelinks?: SiteLink[];
}

export interface AnswerBox {
    snippet: string;
    snippetHighlighted?: string[];
    title: string;
    link: string;
    date?: string;
    position?: number;
}

export interface SiteLink {
    title: string;
    link: string;
}

export interface PeopleAlsoAsk {
    question: string;
    snippet: string;
    title: string;
    link: string;
}

export interface RelatedSearch {
    query: string;
}

export interface SearchParameters {
    q: string;
    gl: string;
    hl: string;
    num: number;
    autocorrect: boolean;
    page: number;
    type: string;
    engine: string;
}

export interface TopStory {
    title: string;
    link: string;
    source: string;
    date: string;
    imageUrl: string;
}

export interface Image {
    title: string;
    imageUrl: string;
    imageWidth: number;
    imageHeight: number;
    thumbnailUrl: string;
    thumbnailWidth: number;
    thumbnailHeight: number;
    source: string;
    domain: string;
    link: string;
    googleUrl: string;
    position: number;
}

export interface Video {
    title: string;
    link: string;
    snippet: string;
    date: string;
    imageUrl: string;
    position: number;
}

export interface Place {
    position: number;
    title: string;
    address: string;
    latitude: number;
    longitude: number;
    category: string;
    phoneNumber?: string;
    website: string;
    cid: string;
    rating?: number;
    ratingCount?: number;
}

export interface News {
    title: string;
    link: string;
    snippet: string;
    date: string;
    source: string;
    imageUrl: string;
    position: number;
}

export interface Shopping {
    title: string;
    source: string;
    link: string;
    price: string;
    imageUrl: string;
    delivery?: Record<string, string>;
    rating?: number;
    ratingCount?: number;
    offers?: string;
    productId?: string;
    position: number;
}

export interface ClientOptions extends Omit<Partial<SearchParams>, 'q'> {
    apiKey?: string;
    apiBaseUrl?: string;
}

/**
 * Lightweight wrapper around Serper for Google search.
 *
 * @see https://dev
 */
export class SerperClient {
    protected api: Axios;
    protected apiKey: string;
    protected apiBaseUrl: string;
    protected params: Omit<Partial<SearchParams>, 'q'>;

    constructor({
        apiKey = process.env.SERPER_API_KEY,
        apiBaseUrl = BASE_URL,
        ...params
    }: ClientOptions = {}) {
        if (!apiKey) {
            throw new Error(
                `SerperClient missing required "apiKey" (defaults to "SERPER_API_KEY" env var)`
            );
        }

        this.apiKey = apiKey;
        this.apiBaseUrl = apiBaseUrl;
        this.params = params;

        console.warn('apiBaseUrl', this.apiBaseUrl);
        

        this.api = axios.create({
            baseURL: this.apiBaseUrl,
            headers: {
                'X-API-KEY': this.apiKey,
            }
        })
    }

    async search(queryOrOpts: string | SearchParams) {
        return this._fetch<SearchResponse>('search', queryOrOpts);
    }

    async searchImages(queryOrOpts: string | SearchParams) {
        return this._fetch<SearchImagesResponse>('images', queryOrOpts);
    }

    async searchVideos(queryOrOpts: string | SearchParams) {
        return this._fetch<SearchVideosResponse>('videos', queryOrOpts);
    }

    async searchPlaces(queryOrOpts: string | SearchParams) {
        return this._fetch<SearchPlacesResponse>('places', queryOrOpts);
    }

    async searchNews(queryOrOpts: string | SearchParams) {
        return this._fetch<SearchNewsResponse>('news', queryOrOpts);
    }

    async searchProducts(queryOrOpts: string | SearchParams) {
        return this._fetch<SearchShoppingResponse>('shopping', queryOrOpts);
    }

    protected async _fetch<T extends Response>(
        endpoint: string,
        queryOrOpts: string | SearchParams
    ) {
        const params = {
            ...this.params,
            ...(typeof queryOrOpts === 'string' ? { q: queryOrOpts } : queryOrOpts),
        };

        console.warn('serper._fetch params', params)
        
        try {
            const res = await this.api.post<unknown, AxiosResponse<T, unknown>>(endpoint, params, {
                responseType: 'json'
            })
            // console.warn('serper._fetch res', res.data)
            return res.data;
        } catch(e) {
            console.warn(`serper._fetch failed ${e.message}`)
            return null
        }
    }
}
