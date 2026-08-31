import { Status } from "@/lib/types/status";

export const STATUS_STYLES: Record <
  Status,
  { border: string; text: string; dot: string; label: string }
> = {
  good: {
    border: "border-[#4C8C5B]",
    text: "text-[#4C8C5B]",
    dot: "bg-[#4C8C5B]",
    label: "Good",
  },
  bad: {
    border: "border-[#C0392B]",
    text: "text-[#C0392B]",
    dot: "bg-[#C0392B]",
    label: "Bad",
  },
  neutral: {
    border: "border-[#8A9184]",
    text: "text-[#1E3A2B]",
    dot: "bg-[#8A9184]",
    label: "Neutral",
  },
};
