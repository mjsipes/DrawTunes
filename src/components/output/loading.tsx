import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <Card className="w-[450px] h-[360px]">
      <CardContent>
        <div className="space-y-2">
          <Skeleton className="h-4 w-[350px]" />
          <Skeleton className="h-4 w-[250px]" />
        </div>
        <div className="space-y-2 mt-10">
          <Skeleton className="h-4 w-[350px]" />
          <Skeleton className="h-4 w-[250px]" />
        </div>
        <div className="space-y-2 mt-10">
          <Skeleton className="h-4 w-[350px]" />
          <Skeleton className="h-4 w-[250px]" />
        </div>
        <div className="space-y-2 mt-10">
          <Skeleton className="h-4 w-[350px]" />
          <Skeleton className="h-4 w-[250px]" />
        </div>
      </CardContent>
    </Card>
  );
}
