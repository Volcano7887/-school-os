// Hand-written to match supabase/migrations/20260714000001_module1_schools_and_membership.sql.
// Regenerate for real once a local container runtime (Docker/Podman) is available:
//   npx supabase gen types typescript --db-url "<connection-string>" --schema public > src/types/database.types.ts

export type SchoolRole =
  | "super_admin"
  | "school_admin"
  | "principal"
  | "accountant"
  | "teacher"
  | "parent"
  | "student";

export type StudentGender = "male" | "female" | "other";
export type AccountType = "asset" | "liability" | "income" | "expense" | "equity";
export type JournalSourceType = "fee_payment" | "expense" | "salary_payment" | "manual";
export type FeeType = "tuition" | "admission" | "exam" | "arrears";
export type PaymentMode = "cash" | "bank" | "upi";
export type AuditAction = "create" | "update" | "delete";

export type Database = {
  public: {
    Tables: {
      schools: {
        Row: {
          id: string;
          name: string;
          slug: string;
          address: string | null;
          phone: string | null;
          email: string | null;
          logo_url: string | null;
          academic_year_start_month: number;
          is_active: boolean;
          daily_fee_target: number | null;
          monthly_fee_target: number | null;
          created_by: string;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          address?: string | null;
          phone?: string | null;
          email?: string | null;
          logo_url?: string | null;
          academic_year_start_month?: number;
          is_active?: boolean;
          daily_fee_target?: number | null;
          monthly_fee_target?: number | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["schools"]["Insert"]>;
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          phone: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      school_users: {
        Row: {
          id: string;
          school_id: string;
          user_id: string;
          role: SchoolRole;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          school_id: string;
          user_id: string;
          role: SchoolRole;
          is_active?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["school_users"]["Insert"]>;
        Relationships: [];
      };
      academic_years: {
        Row: {
          id: string;
          school_id: string;
          name: string;
          start_date: string;
          end_date: string;
          is_current: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          school_id: string;
          name: string;
          start_date: string;
          end_date: string;
          is_current?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["academic_years"]["Insert"]>;
        Relationships: [];
      };
      classes: {
        Row: {
          id: string;
          school_id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          school_id: string;
          name: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["classes"]["Insert"]>;
        Relationships: [];
      };
      students: {
        Row: {
          id: string;
          school_id: string;
          class_id: string | null;
          admission_no: string | null;
          full_name: string;
          gender: StudentGender | null;
          dob: string | null;
          guardian_name: string | null;
          guardian_phone: string | null;
          guardian_email: string | null;
          address: string | null;
          admission_date: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          school_id: string;
          class_id?: string | null;
          admission_no?: string | null;
          full_name: string;
          gender?: StudentGender | null;
          dob?: string | null;
          guardian_name?: string | null;
          guardian_phone?: string | null;
          guardian_email?: string | null;
          address?: string | null;
          admission_date?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["students"]["Insert"]>;
        Relationships: [];
      };
      ledger_accounts: {
        Row: {
          id: string;
          school_id: string;
          code: string;
          name: string;
          type: AccountType;
          is_system: boolean;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          school_id: string;
          code: string;
          name: string;
          type: AccountType;
          is_system?: boolean;
          is_active?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["ledger_accounts"]["Insert"]>;
        Relationships: [];
      };
      journal_entries: {
        Row: {
          id: string;
          school_id: string;
          entry_date: string;
          narration: string | null;
          source_type: JournalSourceType;
          source_id: string | null;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          school_id: string;
          entry_date: string;
          narration?: string | null;
          source_type: JournalSourceType;
          source_id?: string | null;
          created_by: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["journal_entries"]["Insert"]>;
        Relationships: [];
      };
      journal_entry_lines: {
        Row: {
          id: string;
          journal_entry_id: string;
          ledger_account_id: string;
          debit_amount: number;
          credit_amount: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          journal_entry_id: string;
          ledger_account_id: string;
          debit_amount?: number;
          credit_amount?: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["journal_entry_lines"]["Insert"]>;
        Relationships: [];
      };
      fee_structures: {
        Row: {
          id: string;
          school_id: string;
          academic_year_id: string;
          class_id: string | null;
          fee_type: FeeType;
          name: string;
          amount: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          school_id: string;
          academic_year_id: string;
          class_id?: string | null;
          fee_type: FeeType;
          name: string;
          amount: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["fee_structures"]["Insert"]>;
        Relationships: [];
      };
      fee_payments: {
        Row: {
          id: string;
          school_id: string;
          student_id: string;
          fee_structure_id: string | null;
          academic_year_id: string;
          receipt_no: string;
          amount: number;
          payment_mode: PaymentMode;
          period_label: string | null;
          remarks: string | null;
          paid_at: string;
          recorded_by: string;
          journal_entry_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          school_id: string;
          student_id: string;
          fee_structure_id?: string | null;
          academic_year_id: string;
          receipt_no: string;
          amount: number;
          payment_mode: PaymentMode;
          period_label?: string | null;
          remarks?: string | null;
          paid_at?: string;
          recorded_by: string;
          journal_entry_id?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["fee_payments"]["Insert"]>;
        Relationships: [];
      };
      expense_categories: {
        Row: {
          id: string;
          school_id: string;
          name: string;
          ledger_account_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          school_id: string;
          name: string;
          ledger_account_id: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["expense_categories"]["Insert"]>;
        Relationships: [];
      };
      vendors: {
        Row: {
          id: string;
          school_id: string;
          name: string;
          phone: string | null;
          email: string | null;
          address: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          school_id: string;
          name: string;
          phone?: string | null;
          email?: string | null;
          address?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["vendors"]["Insert"]>;
        Relationships: [];
      };
      expenses: {
        Row: {
          id: string;
          school_id: string;
          expense_category_id: string;
          vendor_id: string | null;
          amount: number;
          payment_mode: PaymentMode;
          expense_date: string;
          bill_no: string | null;
          remarks: string | null;
          bill_attachment_path: string | null;
          recorded_by: string;
          journal_entry_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          school_id: string;
          expense_category_id: string;
          vendor_id?: string | null;
          amount: number;
          payment_mode: PaymentMode;
          expense_date?: string;
          bill_no?: string | null;
          remarks?: string | null;
          bill_attachment_path?: string | null;
          recorded_by: string;
          journal_entry_id?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["expenses"]["Insert"]>;
        Relationships: [];
      };
      staff: {
        Row: {
          id: string;
          school_id: string;
          full_name: string;
          designation: string | null;
          phone: string | null;
          monthly_salary: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          school_id: string;
          full_name: string;
          designation?: string | null;
          phone?: string | null;
          monthly_salary: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["staff"]["Insert"]>;
        Relationships: [];
      };
      salary_payments: {
        Row: {
          id: string;
          school_id: string;
          staff_id: string;
          amount: number;
          payment_mode: PaymentMode;
          pay_month: string;
          paid_at: string;
          remarks: string | null;
          recorded_by: string;
          journal_entry_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          school_id: string;
          staff_id: string;
          amount: number;
          payment_mode: PaymentMode;
          pay_month: string;
          paid_at?: string;
          remarks?: string | null;
          recorded_by: string;
          journal_entry_id?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["salary_payments"]["Insert"]>;
        Relationships: [];
      };
      audit_logs: {
        Row: {
          id: string;
          school_id: string;
          user_id: string;
          action: AuditAction;
          table_name: string;
          record_id: string;
          new_data: Record<string, unknown> | null;
          old_data: Record<string, unknown> | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          school_id: string;
          user_id: string;
          action: AuditAction;
          table_name: string;
          record_id: string;
          new_data?: Record<string, unknown> | null;
          old_data?: Record<string, unknown> | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["audit_logs"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      record_salary_payment: {
        Args: {
          p_school_id: string;
          p_staff_id: string;
          p_amount: number;
          p_payment_mode: PaymentMode;
          p_pay_month: string;
          p_paid_at: string;
          p_remarks: string | null;
          p_recorded_by: string;
        };
        Returns: Database["public"]["Tables"]["salary_payments"]["Row"];
      };
      record_expense: {
        Args: {
          p_school_id: string;
          p_expense_category_id: string;
          p_vendor_id: string | null;
          p_amount: number;
          p_payment_mode: PaymentMode;
          p_expense_date: string;
          p_bill_no: string | null;
          p_remarks: string | null;
          p_bill_attachment_path: string | null;
          p_recorded_by: string;
        };
        Returns: Database["public"]["Tables"]["expenses"]["Row"];
      };
      record_fee_payment: {
        Args: {
          p_school_id: string;
          p_student_id: string;
          p_academic_year_id: string;
          p_fee_type: FeeType;
          p_amount: number;
          p_payment_mode: PaymentMode;
          p_paid_at: string;
          p_period_label: string | null;
          p_remarks: string | null;
          p_recorded_by: string;
        };
        Returns: Database["public"]["Tables"]["fee_payments"]["Row"];
      };
    };
    Enums: {
      school_role: SchoolRole;
      student_gender: StudentGender;
      account_type: AccountType;
      journal_source_type: JournalSourceType;
      fee_type: FeeType;
      payment_mode: PaymentMode;
    };
    CompositeTypes: Record<string, never>;
  };
};
