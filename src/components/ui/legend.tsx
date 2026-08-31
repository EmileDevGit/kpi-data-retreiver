import { STATUS_STYLES } from "@/lib/styles/status";
import { Status } from "@/lib/types/status";

export function Legend() {
  const order: Status[] = ["good", "neutral", "bad"];
  return (
    <div className="flex gap-4">
      {order.map((s) => (
        <div key={s} className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${STATUS_STYLES[s].dot}`} />
          <span className="text-xs font-medium text-[#5C6357]">
            {STATUS_STYLES[s].label}
          </span>
        </div>
      ))}
    </div>
  );
}
