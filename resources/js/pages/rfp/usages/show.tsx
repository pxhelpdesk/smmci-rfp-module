import { Head, Link } from '@inertiajs/react';
import { Edit, ArrowLeft } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { RfpUsage } from '@/types';

type Props = {
    usage: RfpUsage;
};

export default function Show({ usage }: Props) {
    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Dashboard', href: '/dashboard' },
                { title: 'Usages', href: '/rfp/usages' },
                { title: usage.code, href: `/rfp/usages/${usage.id}` },
            ]}
        >
            <Head title={usage.code} />

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">{usage.code}</h1>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            {usage.description}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/rfp/usages">
                                <ArrowLeft className="h-4 w-4 mr-1.5" />
                                Back
                            </Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                            <Link href={`/rfp/usages/${usage.id}/edit`}>
                                <Edit className="h-4 w-4 mr-1.5" />
                                Edit
                            </Link>
                        </Button>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Badge variant={usage.is_active ? "default" : "secondary"}>
                        {usage.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    {usage.category && (
                        <Badge variant="outline">
                            {usage.category.name}
                        </Badge>
                    )}
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2.5">
                        <div>
                            <p className="text-xs text-muted-foreground">Code</p>
                            <p className="text-sm font-medium">{usage.code}</p>
                        </div>
                        <Separator />
                        <div>
                            <p className="text-xs text-muted-foreground">Category</p>
                            <p className="text-sm font-medium">
                                {usage.category ? `${usage.category.code} - ${usage.category.name}` : 'N/A'}
                            </p>
                        </div>
                        <Separator />
                        <div>
                            <p className="text-xs text-muted-foreground">Description</p>
                            <p className="text-sm">{usage.description}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
