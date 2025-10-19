/**
 * Feature Flags System
 * 
 * This system allows us to safely develop and test new features without
 * breaking existing functionality. Features can be enabled/disabled
 * based on environment, user role, or specific conditions.
 */

interface FeatureFlag {
  key: string
  name: string
  description: string
  enabled: boolean
  environments?: ('development' | 'staging' | 'production')[]
  adminOnly?: boolean
  userRoles?: string[]
}

const FEATURE_FLAGS: FeatureFlag[] = [
  {
    key: 'modern_chat_panel',
    name: 'Modern Chat Panel',
    description: 'New slide-up chat panel design for sessions',
    enabled: true,
    environments: ['development', 'staging'],
    adminOnly: false
  },
  {
    key: 'session_container_v2',
    name: 'Session Container V2',
    description: 'Improved session container with better viewport fitting',
    enabled: true,
    environments: ['development', 'staging'],
    adminOnly: false
  },
  {
    key: 'admin_testing_page',
    name: 'Admin Testing Page',
    description: 'Comprehensive testing interface for admins',
    enabled: true,
    environments: ['development', 'staging', 'production'],
    adminOnly: true
  },
  {
    key: 'improved_password_validation',
    name: 'Improved Password Validation',
    description: 'More inclusive password validation with additional special characters',
    enabled: true,
    environments: ['development', 'staging', 'production'],
    adminOnly: false
  },
  {
    key: 'debug_mode',
    name: 'Debug Mode',
    description: 'Enable debug logging and additional error information',
    enabled: process.env.NODE_ENV === 'development',
    environments: ['development'],
    adminOnly: true
  }
]

class FeatureFlagManager {
  private flags: Map<string, FeatureFlag> = new Map()

  constructor() {
    FEATURE_FLAGS.forEach(flag => {
      this.flags.set(flag.key, flag)
    })
  }

  /**
   * Check if a feature is enabled
   */
  isEnabled(key: string, context?: {
    environment?: string
    isAdmin?: boolean
    userRole?: string
  }): boolean {
    const flag = this.flags.get(key)
    if (!flag) {
      console.warn(`Feature flag '${key}' not found`)
      return false
    }

    // Check base enabled state
    if (!flag.enabled) {
      return false
    }

    // Check environment restrictions
    if (flag.environments && context?.environment) {
      if (!flag.environments.includes(context.environment as any)) {
        return false
      }
    }

    // Check admin-only restrictions
    if (flag.adminOnly && !context?.isAdmin) {
      return false
    }

    // Check user role restrictions
    if (flag.userRoles && context?.userRole) {
      if (!flag.userRoles.includes(context.userRole)) {
        return false
      }
    }

    return true
  }

  /**
   * Get all available feature flags
   */
  getAllFlags(): FeatureFlag[] {
    return Array.from(this.flags.values())
  }

  /**
   * Get a specific feature flag
   */
  getFlag(key: string): FeatureFlag | undefined {
    return this.flags.get(key)
  }

  /**
   * Enable/disable a feature flag (for testing)
   */
  setFlag(key: string, enabled: boolean): void {
    const flag = this.flags.get(key)
    if (flag) {
      flag.enabled = enabled
    }
  }
}

// Global feature flag manager instance
export const featureFlags = new FeatureFlagManager()

// Convenience functions for common checks
export const isFeatureEnabled = (key: string, context?: {
  environment?: string
  isAdmin?: boolean
  userRole?: string
}) => featureFlags.isEnabled(key, context)

// Environment-aware feature checks
export const isDevelopment = () => process.env.NODE_ENV === 'development'
export const isProduction = () => process.env.NODE_ENV === 'production'

// Common feature flag checks
export const useModernChatPanel = (isAdmin = false) => 
  isFeatureEnabled('modern_chat_panel', { 
    environment: process.env.NODE_ENV, 
    isAdmin 
  })

export const useSessionContainerV2 = (isAdmin = false) => 
  isFeatureEnabled('session_container_v2', { 
    environment: process.env.NODE_ENV, 
    isAdmin 
  })

export const showAdminTesting = (isAdmin = false) => 
  isFeatureEnabled('admin_testing_page', { 
    environment: process.env.NODE_ENV, 
    isAdmin 
  })

export const useImprovedPasswordValidation = () => 
  isFeatureEnabled('improved_password_validation', { 
    environment: process.env.NODE_ENV 
  })

export const isDebugMode = (isAdmin = false) => 
  isFeatureEnabled('debug_mode', { 
    environment: process.env.NODE_ENV, 
    isAdmin 
  })

export type { FeatureFlag }