interface StructuredDataProps {
  type: 'website' | 'organization' | 'article' | 'faq' | 'breadcrumb'
  data: any
}

export function StructuredData({ type, data }: StructuredDataProps) {
  const generateSchema = () => {
    const baseSchema = {
      '@context': 'https://schema.org',
    }

    switch (type) {
      case 'website':
        return {
          ...baseSchema,
          '@type': 'WebSite',
          name: 'Harthio',
          url: 'https://harthio.com',
          description: 'Platform for meaningful conversations with AI-powered matching and moderation',
          potentialAction: {
            '@type': 'SearchAction',
            target: 'https://harthio.com/search?q={search_term_string}',
            'query-input': 'required name=search_term_string'
          },
          ...data
        }

      case 'organization':
        return {
          ...baseSchema,
          '@type': 'Organization',
          name: 'Harthio',
          url: 'https://harthio.com',
          logo: 'https://harthio.com/logo.png',
          description: 'Connecting hearts and minds through meaningful conversations',
          foundingDate: '2025',
          sameAs: [
            'https://twitter.com/harthio_',
            'https://linkedin.com/company/harthio',
            'https://www.reddit.com/user/harthio/'
          ],
          contactPoint: {
            '@type': 'ContactPoint',
            email: 'seyi@harthio.com',
            contactType: 'customer service'
          },
          ...data
        }

      case 'article':
        return {
          ...baseSchema,
          '@type': 'Article',
          publisher: {
            '@type': 'Organization',
            name: 'Harthio',
            logo: 'https://harthio.com/logo.png'
          },
          ...data
        }

      case 'faq':
        return {
          ...baseSchema,
          '@type': 'FAQPage',
          mainEntity: data.questions?.map((q: any) => ({
            '@type': 'Question',
            name: q.question,
            acceptedAnswer: {
              '@type': 'Answer',
              text: q.answer
            }
          })) || []
        }

      default:
        return { ...baseSchema, ...data }
    }
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(generateSchema())
      }}
    />
  )
}