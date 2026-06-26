import { Icon, type IconName } from "@/components/icons";

export function Metric({
  icon,
  label,
  value,
  delta,
  tone = "flat",
}: {
  icon: IconName;
  label: string;
  value: React.ReactNode;
  delta?: string;
  tone?: "up" | "down" | "flat";
}) {
  return (
    <div className="metric">
      <div className="mlab">
        <span className="mi">
          <Icon name={icon} />
        </span>{" "}
        {label}
      </div>
      <div className="mval">{value}</div>
      {delta && <div className={"mdelta " + tone}>{delta}</div>}
    </div>
  );
}
