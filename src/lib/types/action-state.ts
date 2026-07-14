export type ActionState = {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: Record<string, string[]>;
  // Small bag for a successful action to hand back an id/slug the UI needs
  // next (e.g. a receipt link) — deliberately loose, not meant for large payloads.
  data?: Record<string, string>;
};

export const initialActionState: ActionState = { status: "idle" };
