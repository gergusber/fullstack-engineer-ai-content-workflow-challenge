export const createQueryKeys = <T extends Record<string, any>>(
  entity: string,
  keys: T
): T & { _entity: string } => ({
  _entity: entity,
  ...keys
})

export const queryKeys = {
  campaigns: createQueryKeys('campaigns', {
    all: ['campaigns'] as const,
    lists: () => [...queryKeys.campaigns.all, 'list'] as const,
    list: (filters: Record<string, any>) => [
      ...queryKeys.campaigns.lists(),
      filters
    ] as const,
    details: () => [...queryKeys.campaigns.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.campaigns.details(), id] as const,
    stats: (id: string) => [...queryKeys.campaigns.detail(id), 'stats'] as const,
  }),

  content: createQueryKeys('content', {
    all: ['content'] as const,
    lists: () => [...queryKeys.content.all, 'list'] as const,
    list: (filters: Record<string, any>) => [
      ...queryKeys.content.lists(),
      filters
    ] as const,
    details: () => [...queryKeys.content.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.content.details(), id] as const,
    translations: (id: string) => [
      ...queryKeys.content.detail(id),
      'translations'
    ] as const,
    translationDetails: (id: string) => [
      ...queryKeys.content.translations(id),
      'details'
    ] as const,
    aiDrafts: (id: string) => [
      ...queryKeys.content.detail(id),
      'ai-drafts'
    ] as const,
  }),

  translations: createQueryKeys('translations', {
    all: ['translations'] as const,
    pending: () => [...queryKeys.translations.all, 'pending'] as const,
    aiDraftsPending: (contentId?: string) => [
      ...queryKeys.translations.all,
      'ai-drafts-pending',
      { contentId }
    ] as const,
  }),

  reviews: createQueryKeys('reviews', {
    all: ['reviews'] as const,
    pending: () => [...queryKeys.reviews.all, 'pending'] as const,
    byContent: (contentId: string) => [
      ...queryKeys.reviews.all,
      'by-content',
      contentId
    ] as const,
  }),

  analytics: createQueryKeys('analytics', {
    all: ['analytics'] as const,
    dashboard: () => [...queryKeys.analytics.all, 'dashboard'] as const,
    campaign: (id: string) => [
      ...queryKeys.analytics.all,
      'campaign',
      id
    ] as const,
  })
} as const

// Utility function to invalidate related queries
export const getInvalidationKeys = {
  forCampaign: (id: string) => [
    queryKeys.campaigns.detail(id),
    queryKeys.campaigns.lists(),
    queryKeys.analytics.campaign(id)
  ],

  forContent: (id: string) => [
    queryKeys.content.detail(id),
    queryKeys.content.lists(),
    queryKeys.content.translations(id),
    queryKeys.content.aiDrafts(id)
  ],

  forTranslation: () => [
    queryKeys.translations.pending(),
    queryKeys.translations.aiDraftsPending(),
    queryKeys.content.lists()
  ]
}