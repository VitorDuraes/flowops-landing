import { Icon, type IconName } from "@/components/icons";

export function EmptyState({ icon, title, desc }: { icon: IconName; title: string; desc: string }) {
  return (
    <div className="empty">
      <div className="ei">
        <Icon name={icon} />
      </div>
      <h3>{title}</h3>
      <p>{desc}</p>
    </div>
  );
}
