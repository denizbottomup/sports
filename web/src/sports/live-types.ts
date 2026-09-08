export interface LiveTeam { id: string; name: string; short: string; abbreviation: string; logo: string | null; logoSource?: string | null; color: string; league?: string; leagueName?: string; country?: string; }
export interface UserTeam { id: string; name: string; short: string; abbreviation: string; logo: string | null; league?: string; leagueName?: string; country?: string; }
export interface User { id: string; email: string; name: string; picture: string | null; favorite: UserTeam | null; followed: UserTeam[]; language: string; }
export interface FactSource { source: string; sourceUrl: string; checkedAt: string; }
export interface Broadcast extends FactSource { country: string; channel: string; access: 'free' | 'paid' | 'unknown'; note?: string; }
export interface MatchDetails extends FactSource { referee: string | null; refereeSource?: FactSource; broadcasts: Broadcast[]; }
export interface Reading { title: string; paragraphs: string[]; kind: 'brief' | 'excerpt' | 'summary'; category?: string; language: string; checkedAt: string; }
export interface LiveFixture { details?: MatchDetails | null; id: string; date: string; dateConfirmed: boolean; status: string; competition: string; competitionName: string; home: boolean; team: LiveTeam; opponent: LiveTeam; venue: string | null; round: string; source: string; sourceUrl: string; fetchedAt: string; }
export interface LiveNews { reading?: Reading; id: string; title: string; summary: string; url: string; image: string | null; imageSource: string | null; publishedAt: string | null; datePrecision: string; firstSeenAt: string; teamId: string; sourceId: string; source: string; official: boolean; language: string; category: string; }
export interface Player { id: string; name: string; number: string; position: string; image: string | null; imageSource: string | null; sourceUrl: string | null; coach: boolean; }
export interface Roster { players: Player[]; updatedAt: string; source: string; sourceUrl: string; official: boolean; }
export interface Source { id: string; name: string; kind: string; publicUrl: string; official: boolean; interval: number; status: 'pending' | 'ok' | 'stale' | 'error'; lastCheckedAt: string | null; lastSuccessAt: string | null; error: string | null; }
export interface FollowedSummary { team: LiveTeam; nextFixture: LiveFixture | null; }
export interface Dashboard { user: User; team: LiveTeam; focusFixtureIds: string[]; followed: FollowedSummary[]; fixtures: LiveFixture[]; news: LiveNews[]; rosters: Record<string, Roster>; sources: Source[]; updatedAt: string | null; serverTime: string; newsPollSeconds: number; }
