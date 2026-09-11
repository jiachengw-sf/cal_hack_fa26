export type Role = "applicant" | "organizer";
export type Track = "hacker" | "judge";
export type ApplicationStatus =
  | "draft"
  | "submitted"
  | "accepted"
  | "waitlisted"
  | "rejected";

export interface HackerFormData {
  school: string;
  graduationYear: string;
  major: string;
  experienceLevel: string;
  skills: string;
  whyAttend: string;
  builtSomethingCool: string;
  resumeType: "link" | "file";
  resumeUrl?: string;
  resumeFilePath?: string;
}

export interface JudgeFormData {
  organization: string;
  role: string;
  expertiseAreas: string;
  priorJudgingExperience: string;
  availability: string;
  whyJudge: string;
}

export type FormData = HackerFormData | JudgeFormData;

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          role: Role;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          role?: Role;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          role?: Role;
          created_at?: string;
        };
        Relationships: [];
      };
      applications: {
        Row: {
          id: string;
          user_id: string;
          track: Track;
          status: ApplicationStatus;
          form_data: FormData;
          organizer_score: number | null;
          organizer_notes: string | null;
          reviewed_by: string | null;
          reviewed_at: string | null;
          submitted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          track: Track;
          status?: ApplicationStatus;
          form_data: FormData;
          organizer_score?: number | null;
          organizer_notes?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          submitted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          track?: Track;
          status?: ApplicationStatus;
          form_data?: FormData;
          organizer_score?: number | null;
          organizer_notes?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          submitted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "applications_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "applications_reviewed_by_fkey";
            columns: ["reviewed_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      settings: {
        Row: {
          id: number;
          applications_open: boolean;
          updated_by: string | null;
          updated_at: string;
        };
        Insert: {
          id?: number;
          applications_open?: boolean;
          updated_by?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: number;
          applications_open?: boolean;
          updated_by?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}
