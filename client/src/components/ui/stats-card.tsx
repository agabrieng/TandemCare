import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  change?: string;
  changeLabel?: string;
  positive?: boolean;
  description?: string;
  iconColor?: string;
  iconBg?: string;
  className?: string;
}

export function StatsCard({
  title,
  value,
  icon,
  change,
  changeLabel,
  positive = true,
  description,
  iconColor = "text-primary",
  iconBg = "bg-primary/90",
  className,
  ...props
}: StatsCardProps) {
  return (
    <Card className={cn("hover-elevate", className)} {...props}>
      <CardContent className="p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", iconBg)}>
              <div className={cn("", iconColor)}>
                {icon}
              </div>
            </div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-muted-foreground truncate">{title}</dt>
              <dd className="text-lg font-semibold text-foreground">{value}</dd>
            </dl>
          </div>
        </div>
        {(change || description) && (
          <div className="mt-2">
            <div className="flex items-center text-sm">
              {change && (
                <>
                  <span className={cn(
                    "font-medium",
                    positive ? "text-green-600" : "text-red-600"
                  )}>
                    {change}
                  </span>
                  {changeLabel && (
                    <span className="text-muted-foreground ml-2">{changeLabel}</span>
                  )}
                </>
              )}
              {description && !change && (
                <span className="text-muted-foreground">{description}</span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
