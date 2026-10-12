// Complete User Profile Schema Definition & Privacy Access Control
// Organised strictly according to the 9 Profile Categories Specification

export type IdType = 'passport' | 'national_id' | 'drivers_license';
export type Gender = 'female' | 'male' | 'non_binary' | 'prefer_not_to_say' | 'custom';
export type RelationshipStatus = 'single' | 'in_a_relationship' | 'engaged' | 'married' | 'prefer_not_to_say';
export type VisibilityOption = 'public' | 'friends' | 'hidden';
export type FindMeOption = 'everyone' | 'friends_of_friends' | 'nobody';
export type MessageMeOption = 'everyone' | 'friends';
export type ReelsVisibilityOption = 'public' | 'friends';
export type AccountStatus = 'active' | 'blocked' | 'suspended';
export type InactivePolicy = 'auto_deactivate' | 'notify_after_90_days' | 'preserve';

// Social links structure
export interface SocialLinks {
  twitter?: string;
  github?: string;
  linkedin?: string;
  instagram?: string;
  website?: string;
}

// Category 6: Content (Reels & Photos) stored in posts table
export interface PostMedia {
  id: string;
  user_id: string;
  type: 'photo' | 'reel';
  media_url: string;
  caption?: string;
  visibility: ReelsVisibilityOption;
  created_at: string;
  likes: number;
  comments: number;
  is_liked?: boolean;
}

// Category 8 & 9: History and Recovery
export interface UsernameHistoryEntry {
  old_username: string;
  changed_at: string;
}

export interface AccountRecoveryPath {
  method: 'backup_email' | 'security_questions' | 'recovery_codes';
  recovery_email?: string;
  backup_codes_remaining?: number;
  is_configured: boolean;
}

/**
 * 1. Core Identity (Everyone)
 * 2. Contact & Verification (18+ only, or guardian link for minor)
 * 3. Personal & Discovery Details (Adults, optional visibility)
 * 4. Privacy & Visibility Controls
 * 5. Customization
 * 6. Content (Reels & Photos)
 * 7. System / Moderation Fields (Admin-visible only, per role)
 * 8. Additional Fields Often Missed
 * 9. Also Commonly Missed
 */
export interface CompleteUserProfile {
  // --- 1. Core Identity (everyone) ---
  user_id: string; // Internal unique ID, never shown to other users
  username: string; // Unique, public-facing handle
  display_name: string; // Shown name, can differ from username
  date_of_birth: string; // YYYY-MM-DD used to compute age & set is_adult (NEVER self-reported)
  avatar_url: string; // Profile photo
  bio: string; // Short free-text description
  preferred_language: string; // Drives UI language + translation defaults
  timezone: string; // For local time display
  created_at: string; // Account creation timestamp
  last_active_at: string; // Last activity timestamp

  // --- 2. Contact & Verification (18+ only, guardian for minor) ---
  email: string; // Required for verification
  email_verified_at: string | null; // Set once the verification code is confirmed
  phone_number: string; // Required, verified via SMS code
  phone_verified_at: string | null; // Set once the SMS code is confirmed
  national_id_number?: string; // Encrypted/masked at rest, visible only to compliance-role admins
  national_id_verified_at: string | null; // Set once ID is verified
  id_type?: IdType; // Passport, national ID card, or driver's license
  verification_expiry?: string | null; // Verification expiry date for periodic re-confirmation
  is_adult: boolean; // Server-enforced boolean strictly computed from date_of_birth (age >= 18)
  guardian_contact_email?: string; // Optional parent/guardian link if minor (<18) for COPPA

  // --- 3. Personal & Discovery Details (adults, optional visibility) ---
  occupation?: string; // Free text or job title
  location_country: string; // Separate from city, preserves East African & international countries
  location_city?: string; // Can be hidden independently of country
  interests: string[]; // Used for "find friends" matching
  gender?: Gender; // Optional, never required
  relationship_status?: RelationshipStatus; // Optional on discovery platforms

  // --- 4. Privacy & Visibility Controls ---
  location_visibility: VisibilityOption; // Public / Friends only / Hidden
  occupation_visibility: VisibilityOption; // Public / Friends only / Hidden
  who_can_find_me: FindMeOption; // Everyone / Friends of friends / Nobody
  who_can_message_me: MessageMeOption; // Everyone / Friends only
  who_can_see_reels: ReelsVisibilityOption; // Public / Friends only

  // --- 5. Customization ---
  theme_color: string; // Profile accent color (e.g. '#6366f1')
  profile_banner_url?: string; // Header image
  pinned_post_ids: string[]; // Highlighted Reels/photos on profile
  social_links: SocialLinks; // Optional external links

  // --- 6. Content (Reels & Photos) ---
  posts?: PostMedia[];

  // --- 7. System / Moderation Fields (admin-visible only, per role) ---
  role: 'admin' | 'user';
  compliance_role?: boolean; // Can view unmasked/encrypted compliance ID documents
  account_status: AccountStatus; // Active / Blocked / Suspended
  blocked_reason?: string; // Free text, required when blocking
  blocked_by_admin_id?: string; // Which admin took the action
  blocked_at?: string; // Timestamp
  report_count: number; // Aggregated count; triggers review at threshold
  device_sessions_count?: number; // Active sessions per device

  // --- 8. Additional Fields Often Missed ---
  account_deactivated_at?: string | null; // Reversible deactivation
  deletion_requested_at?: string | null; // Start of permanent-delete flow
  data_export_requested_at?: string | null; // Supports "download my data"
  profile_completeness_pct: number; // Computed percentage (0-100)
  tos_accepted_at: string; // Consent record for Terms of Service
  tos_version: string; // e.g. "2026.1"
  privacy_policy_accepted_at: string; // Consent record for Privacy Policy
  privacy_policy_version: string; // e.g. "2026.1"

  // --- 9. Also Commonly Missed ---
  account_recovery_path: AccountRecoveryPath;
  username_history: UsernameHistoryEntry[];
  blocking_list: string[]; // Who I blocked
  blocked_by_list: string[]; // Who blocked me (two separate queries)
  merged_account_of?: string[]; // Handles duplicate sign-ups or merged creator profiles
  correction_requested_at?: string | null; // Right to correct inaccurate data
  inactive_account_policy: InactivePolicy; // What happens to dormant profiles
  legal_hold: boolean; // Flag that blocks self-deletion while under investigation
}

/**
 * Server-Enforced Age and Adult Calculation:
 * strictly derived from date_of_birth, NEVER a self-reported checkbox!
 */
export function calculateAge(dobString: string): number {
  if (!dobString) return 0;
  const dob = new Date(dobString);
  if (isNaN(dob.getTime())) return 0;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return Math.max(0, age);
}

export function isAdultFromDob(dobString: string): boolean {
  return calculateAge(dobString) >= 18;
}

/**
 * Calculate Profile Completeness Percentage (0 - 100%)
 */
export function calculateProfileCompleteness(profile: Partial<CompleteUserProfile>): number {
  let score = 0;
  let total = 10;

  if (profile.username) score += 1;
  if (profile.display_name) score += 1;
  if (profile.avatar_url) score += 1;
  if (profile.bio && profile.bio.length > 5) score += 1;
  if (profile.email_verified_at) score += 1;
  if (profile.phone_verified_at) score += 1;
  if (profile.occupation) score += 1;
  if (profile.location_country) score += 1;
  if (profile.interests && profile.interests.length > 0) score += 1;
  if (profile.profile_banner_url) score += 1;

  return Math.round((score / total) * 100);
}

/**
 * Privacy Sanitizer: Generates Public-Facing Profile
 * Hides private fields (email, phone, DOB) and respects visibility toggles (location, occupation, reels).
 */
export function sanitizeToPublicProfile(
  profile: CompleteUserProfile,
  viewerRelation: 'public' | 'friend' | 'self' | 'admin' | 'compliance_admin'
): Partial<CompleteUserProfile> {
  const isSelf = viewerRelation === 'self';
  const isAdmin = viewerRelation === 'admin' || viewerRelation === 'compliance_admin';
  const isCompliance = viewerRelation === 'compliance_admin';
  const isFriend = viewerRelation === 'friend' || isSelf || isAdmin;

  // If self, return everything with national ID masked unless compliance
  if (isSelf) {
    return {
      ...profile,
      national_id_number: profile.national_id_number ? `••••••••${profile.national_id_number.slice(-4)}` : undefined,
    };
  }

  // If Admin or Compliance
  if (isAdmin) {
    return {
      ...profile,
      national_id_number: isCompliance
        ? profile.national_id_number
        : profile.national_id_number
        ? `••••••••${profile.national_id_number.slice(-4)}`
        : undefined,
    };
  }

  // Public/Friend view: STRICT PRIVACY BOUNDARIES
  const publicView: Partial<CompleteUserProfile> = {
    username: profile.username,
    display_name: profile.display_name,
    avatar_url: profile.avatar_url,
    bio: profile.bio,
    preferred_language: profile.preferred_language,
    timezone: profile.timezone,
    created_at: profile.created_at,
    last_active_at: profile.last_active_at,
    theme_color: profile.theme_color,
    profile_banner_url: profile.profile_banner_url,
    social_links: profile.social_links,
    profile_completeness_pct: profile.profile_completeness_pct,
    is_adult: profile.is_adult,
  };

  // Occupation visibility filter
  if (profile.occupation_visibility === 'public' || (profile.occupation_visibility === 'friends' && isFriend)) {
    publicView.occupation = profile.occupation;
    publicView.occupation_visibility = profile.occupation_visibility;
  }

  // Location visibility filter
  if (profile.location_visibility === 'public' || (profile.location_visibility === 'friends' && isFriend)) {
    publicView.location_country = profile.location_country;
    publicView.location_city = profile.location_city;
    publicView.location_visibility = profile.location_visibility;
  }

  // Interests filter
  publicView.interests = profile.interests;

  // Reels & Posts visibility filter
  if (profile.who_can_see_reels === 'public' || (profile.who_can_see_reels === 'friends' && isFriend)) {
    publicView.posts = profile.posts;
    publicView.pinned_post_ids = profile.pinned_post_ids;
  } else {
    publicView.posts = [];
    publicView.pinned_post_ids = [];
  }

  return publicView;
}
