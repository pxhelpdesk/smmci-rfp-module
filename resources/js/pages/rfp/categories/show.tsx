import { Head, Link } from '@inertiajs/react';
import { Edit, ArrowLeft } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { RfpCategory, RfpUsage } from '@/types';

type Props = {
    category: RfpCategory & { usages: RfpUsage[] };
};

export default function Show({ category }: Props) {
    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Dashboard', href: '/dashboard' },
                { title: 'Categories', href: '/rfp/categories' },
                { title: category.name, href: `/rfp/categories/${category.id}` },
            ]}
        >
            <Head title={category.name} />

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">{category.name}</h1>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            {category.code}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/rfp/categories">
                                <ArrowLeft className="h-4 w-4 mr-1.5" />
                                Back
                            </Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                            <Link href={`/rfp/categories/${category.id}/edit`}>
                                <Edit className="h-4 w-4 mr-1.5" />
                                Edit
                            </Link>
                        </Button>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Badge variant={category.is_active ? "default" : "secondary"}>
                        {category.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2.5">
                        <div>
                            <p className="text-xs text-muted-foreground">Code</p>
                            <p className="text-sm font-medium">{category.code}</p>
                        </div>
                        <Separator />
                        <div>
                            <p className="text-xs text-muted-foreground">Name</p>
                            <p className="text-sm font-medium">{category.name}</p>
                        </div>
                        {category.description && (
                            <>
                                <Separator />
                                <div>
                                    <p className="text-xs text-muted-foreground">Description</p>
                                    <p className="text-sm">{category.description}</p>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Usages ({category.usages.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="border rounded-lg">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Code</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {category.usages.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={3} className="text-center py-6 text-muted-foreground">
                                                No usages found
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        category.usages.map((usage) => (
                                            <TableRow key={usage.id}>
                                                <TableCell className="font-medium">{usage.code}</TableCell>
                                                <TableCell>{usage.description}</TableCell>
                                                <TableCell>
                                                    <Badge variant={usage.is_active ? "default" : "secondary"}>
                                                        {usage.is_active ? 'Active' : 'Inactive'}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
