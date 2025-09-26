import { FileText, Tag, ShoppingBag, LucideIcon } from 'lucide-react'
import { ContentType } from '@/lib/api/types'

export interface ContentTypeIconMap {
  [ContentType.BLOG_POST]: LucideIcon
  [ContentType.HEADLINE]: LucideIcon
  [ContentType.PRODUCT_DESC]: LucideIcon
}

export const contentTypeIcons: ContentTypeIconMap = {
  [ContentType.BLOG_POST]: FileText,
  [ContentType.HEADLINE]: Tag,
  [ContentType.PRODUCT_DESC]: ShoppingBag,
}

export function getContentTypeIcon(contentType: ContentType): LucideIcon {
  return contentTypeIcons[contentType] || FileText
}

export function getContentTypeIconComponent(contentType: ContentType, className?: string) {
  const IconComponent = getContentTypeIcon(contentType)
  return <IconComponent className={className} />
}