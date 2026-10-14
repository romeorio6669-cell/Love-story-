export interface PhotoItem {
  id: string;
  url: string;
  caption: string;
  category?: string;
  order: number;
}

export interface VideoItem {
  id: string;
  url: string;
  title: string;
  description?: string;
  type: 'gallery' | 'background' | 'main';
  order: number;
}

export interface CustomSectionItem {
  id: string;
  title: string;
  subtitle?: string;
  content: string;
  imageUrl?: string;
  iconName?: string;
  order: number;
  isVisible: boolean;
}

export interface TimelineEvent {
  id: string;
  time: string;
  title: string;
  description: string;
  order: number;
}

export interface RsvpResponse {
  id: string;
  guestName: string;
  status: 'attending' | 'apologizing';
  companionCount: number;
  message: string;
  phone?: string;
  createdAt: string;
  isVisibleInChat?: boolean;
}

export interface PublicGuestMessage {
  id: string;
  guestName: string;
  message: string;
  createdAt: string;
}

export interface InvitationData {
  // General Info
  siteTitle: string;
  groomName: string;
  brideName: string;
  groomBio?: string;
  brideBio?: string;
  groomImage: string;
  brideImage: string;
  
  // Opening Screen
  openingHeadline: string;
  openingSubheadline: string;
  openingButtonText: string;
  openingBgImage: string;
  openingBgVideo?: string;
  
  // Date & Countdown
  weddingDate: string; // ISO string e.g. "2026-11-20T19:00:00"
  weddingDateHijri?: string;
  eventStartTimeText: string;
  eventEndTimeText?: string;
  
  // Invitation Message
  invitationTitle: string;
  invitationMessage: string;
  invitationVerse?: string;
  familyNamesText?: string;
  invitationTextAlign: 'center' | 'right' | 'justify';
  invitationBgStyle: 'dark' | 'chocolate' | 'gold-border' | 'minimal';
  
  // Venue
  venueName: string;
  venueCity: string;
  venueAddress: string;
  venueDescription?: string;
  venueMapUrl: string;
  venueImage?: string;
  
  // Media Collections
  photos: PhotoItem[];
  videos: VideoItem[];
  
  // Background Music
  musicUrl: string;
  musicTitle?: string;
  musicEnabled: boolean;
  musicVolume: number; // 0.0 to 1.0
  musicAutoLoop: boolean;
  musicIconStyle: 'disc' | 'wave' | 'notes';
  
  // Timeline
  timelineEnabled: boolean;
  timeline: TimelineEvent[];
  
  // Custom Sections
  customSections: CustomSectionItem[];
  
  // RSVP Settings
  rsvpEnabled: boolean;
  rsvpDeadlineText?: string;
  rsvpAllowCompanions: boolean;
  rsvpMaxCompanions: number;
  rsvpNotes?: string;
  
  // Design & Theme Customization
  primaryColor: string; // e.g. '#c89d5c'
  bgColor: string;      // e.g. '#17120f'
  cardBgColor: string;  // e.g. '#231b17'
  textColor: string;    // e.g. '#f7f2ea'
  accentColor: string;  // e.g. '#d8ad6e'
  fontFamily: 'amiri' | 'alexandria' | 'aref-ruqaa';
  
  // Section Visibility & Order
  sectionsOrder: string[]; // ['opening', 'hero', 'couple', 'invitation', 'countdown', 'venue', 'timeline', 'photos', 'videos', 'custom', 'rsvp']
  hiddenSections: string[];
}
