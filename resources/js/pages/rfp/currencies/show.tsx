import { Head, Link } from '@inertiajs/react';
import { Edit, ArrowLeft } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { RfpCurrency } from '@/types';

type Props = {
    currency: RfpCurrency;
};

export default function Show({ currency }: Props) {
    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Dashboard', href: '/dashboard' },
                { title: 'Currencies', href: '/rfp/currencies' },
                { title: currency.code, href: `/rfp/currencies/${currency.id}` },
            ]}
        >
            <Head title={currency.code} />

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">{currency.name}</h1>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            {currency.code}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/rfp/currencies">
                                <ArrowLeft className="h-4 w-4 mr-1.5" />
                                Back
                            </Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                            <Link href={`/rfp/currencies/${currency.id}/edit`}>
                                <Edit className="h-4 w-4 mr-1.5" />
                                Edit
                            </Link>
                        </Button>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Badge variant={currency.is_active ? "default" : "secondary"}>
                        {currency.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2.5">
                        <div>
                            <p className="text-xs text-muted-foreground">Code</p>
                            <p className="text-sm font-medium">{currency.code}</p>
                        </div>
                        <Separator />
                        <div>
                            <p className="text-xs text-muted-foreground">Name</p>
                            <p className="text-sm font-medium">{currency.name}</p>
                        </div>
                        {currency.description && (
                            <>
                                <Separator />
                                <div>
                                    <p className="text-xs text-muted-foreground">Description</p>
                                    <p className="text-sm">{currency.description}</p>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
